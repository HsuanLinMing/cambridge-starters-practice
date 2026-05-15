/**
 * scripts/source_registry_gate.mjs
 *
 * P3-10-N：Source registry approved_for_import gate（共用 helper）。
 *
 * 對應 docs/SOURCE_REGISTRY_PLAN.md 的 D-1 規則：
 *   「只有 reviewStatus === "approved_for_import" 的 source 才能進
 *    collector / normalizer / 下游 pipeline。」
 *
 * 本檔提供：
 *   - normalizeSourceUrlForGate(value)         URL normalization（v0.1 規則）
 *   - loadSourceRegistry(path, { readJson })   讀 registry JSON（caller 提供 readJson helper）
 *   - buildApprovedUrlSet(registry)            建 approved URL set + duplicate sourceId 記錄
 *   - classifyUrlAgainstRegistry(url, registry, approvedUrls)
 *                                              對單一 URL 判 matched / status / sourceId / reason
 *
 * 硬邊界：
 *   - ❌ 不發 HTTP 請求 / 不抓網路
 *   - ❌ 不修改 registry input
 *   - ❌ 不做 domain-level 放行（必須是 registry 中明確的 sourceUrl，且 reviewStatus=approved_for_import）
 *   - ❌ 不做 fuzzy match
 *   - ✅ 對 reviewer 透明：classifyUrlAgainstRegistry 回傳的 reason / status 直接給上游 CLI 寫進 warnings
 *
 * URL normalization 規則（v0.1，刻意保守）：
 *   1. 解析為 URL；不可解析 → null（caller 應跳過）
 *   2. protocol 保留（http vs https 視為不同 URL）
 *   3. host 轉小寫（DNS host 不分大小寫）
 *   4. pathname 結尾若為單一 '/' 則保留；其他 trailing slash 移除
 *      （e.g. `https://example.com/` 保留尾斜線；`https://example.com/x/` → `https://example.com/x`）
 *   5. search（query string）保留；可能帶有意義（如 ?id=123）
 *   6. fragment（#anchor）移除（僅 client-side，不影響來源同一性）
 *
 *   注意：本規則**不**做 utm_* / tracking param 清除——若 reviewer 想要更激進的
 *   normalization，請改在 registry 的 sourceUrl 與 caller input 雙邊同步處理。
 */

export const SOURCE_REGISTRY_APPROVED_STATUS = "approved_for_import";

/**
 * Normalize a URL for source-registry exact-match comparison.
 * Returns canonical string, or null when input is not a parseable URL.
 *
 * 規則：保留 protocol / search；lowercase host；strip trailing slash on pathname
 * (除非 pathname === "/")；移除 fragment。
 */
export function normalizeSourceUrlForGate(value) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  let parsed;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }
  const host = parsed.host.toLowerCase();
  let path = parsed.pathname;
  if (path.length > 1 && path.endsWith("/")) {
    path = path.slice(0, -1);
  }
  // fragment dropped; search kept
  return `${parsed.protocol}//${host}${path}${parsed.search}`;
}

/**
 * Load source-registry JSON via the caller-provided readJsonFile helper.
 *
 * Throws Error when the file isn't a top-level array.
 * Caller is responsible for catching errors and printing a useful message
 * before calling process.exit(2).
 */
export async function loadSourceRegistry(path, { readJsonFile }) {
  const data = await readJsonFile(path);
  if (!Array.isArray(data)) {
    throw new Error(
      `source registry JSON 必須是最外層陣列：${path}（讀到 ${
        Array.isArray(data) ? "array" : typeof data
      }）`,
    );
  }
  return data;
}

/**
 * Build a Map<normalizedUrl, registryEntry> containing only entries with
 * reviewStatus === "approved_for_import" AND a parseable sourceUrl.
 *
 * Also detects duplicate sourceId values (for telemetry / non-crash safety).
 * 若同一 normalized URL 對到多筆 approved entries，保留**第一筆**（後續視為同源）。
 */
export function buildApprovedUrlSet(registry) {
  const seenIds = new Set();
  const duplicateIds = new Set();
  const approvedUrls = new Map();
  for (const entry of registry) {
    if (!entry || typeof entry !== "object") continue;
    if (typeof entry.sourceId === "string" && entry.sourceId.length > 0) {
      if (seenIds.has(entry.sourceId)) {
        duplicateIds.add(entry.sourceId);
      } else {
        seenIds.add(entry.sourceId);
      }
    }
    if (entry.reviewStatus !== SOURCE_REGISTRY_APPROVED_STATUS) continue;
    const normalized = normalizeSourceUrlForGate(entry.sourceUrl);
    if (!normalized) continue;
    if (!approvedUrls.has(normalized)) {
      approvedUrls.set(normalized, entry);
    }
  }
  return { approvedUrls, duplicateIds: [...duplicateIds] };
}

/**
 * Classify a single raw URL against the registry + approvedUrls map.
 *
 * Returns one of:
 *   - { matched: true,  status: "approved_for_import", sourceId, normalizedUrl, reason: null }
 *   - { matched: false, status: <reviewStatus from registry>, sourceId, normalizedUrl,
 *       reason: "skipped_source_not_approved_for_import" }
 *   - { matched: false, status: null, sourceId: null, normalizedUrl,
 *       reason: "skipped_not_in_source_registry" }
 *   - { matched: false, status: null, sourceId: null, normalizedUrl: null,
 *       reason: "skipped_invalid_url_for_gate" }
 */
export function classifyUrlAgainstRegistry(rawUrl, registry, approvedUrls) {
  const normalized = normalizeSourceUrlForGate(rawUrl);
  if (!normalized) {
    return {
      matched: false,
      status: null,
      sourceId: null,
      normalizedUrl: null,
      reason: "skipped_invalid_url_for_gate",
    };
  }
  if (approvedUrls.has(normalized)) {
    const entry = approvedUrls.get(normalized);
    return {
      matched: true,
      status: SOURCE_REGISTRY_APPROVED_STATUS,
      sourceId: typeof entry.sourceId === "string" ? entry.sourceId : null,
      normalizedUrl: normalized,
      reason: null,
    };
  }
  // Not approved — check whether URL exists at all (any reviewStatus)
  for (const entry of registry) {
    if (!entry || typeof entry !== "object") continue;
    const n = normalizeSourceUrlForGate(entry.sourceUrl);
    if (n === normalized) {
      return {
        matched: false,
        status: typeof entry.reviewStatus === "string" ? entry.reviewStatus : "unknown",
        sourceId: typeof entry.sourceId === "string" ? entry.sourceId : null,
        normalizedUrl: normalized,
        reason: "skipped_source_not_approved_for_import",
      };
    }
  }
  return {
    matched: false,
    status: null,
    sourceId: null,
    normalizedUrl: normalized,
    reason: "skipped_not_in_source_registry",
  };
}
