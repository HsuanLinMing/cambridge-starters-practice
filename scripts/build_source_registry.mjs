#!/usr/bin/env node
/**
 * scripts/build_source_registry.mjs
 *
 * P3-10-M：Source registry generated workflow（v0.1）。
 *
 * 對應 docs/SOURCE_REGISTRY_PLAN.md / docs/DISCOVERY_CRAWLER_PLAN.md。
 *
 * 用途：
 *   - 讀 discovered-resources example / generated JSON
 *   - 對每筆 discovered entry **保守**推論 sourceKind / publisher / publisherType /
 *     fileType / collectionStatus / reviewStatus / partsCovered / language / level / exam
 *   - 寫出 source-registry.generated.json — **預設一律給 reviewer 人工審核**
 *   - 重跑 input → 同樣 sourceId（deterministic）
 *
 * 硬邊界（對齊 docs/SOURCE_REGISTRY_PLAN.md）：
 *   - ❌ 不抓網路 / 不發 HTTP 請求
 *   - ❌ 不呼叫 OpenAI / cloud APIs
 *   - ❌ 不下載 PDF / image / audio
 *   - ❌ 不標 approved_for_import（**所有 generated entry 一律 pending_review / needs_manual_check**）
 *   - ❌ 不寫 data/p3-example-questions.json / data/exam-papers.example.json
 *   - ❌ 不誇大 provenanceNotes / rightsNotes（不聲稱已授權 / 已審核 / 可直接匯入）
 *   - ✅ 純資料轉換、可重跑、可審計、deterministic
 *
 * 使用方式：
 *   node scripts/build_source_registry.mjs --help
 *
 *   node scripts/build_source_registry.mjs \
 *     --input data/imported/discovered-resources.example.json \
 *     --out data/imported/source-registry.generated.json \
 *     --mode build \
 *     --limit 20
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤
 *   2  CLI 參數錯 / input 不存在 / JSON parse 失敗 / 不支援的 mode
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { normalizeSourceUrlForGate } from "./source_registry_gate.mjs";

// ===========================================================================
// 0. 常數
// ===========================================================================

const BUILDER_VERSION = "build_source_registry.mjs@v0.2";
const SUPPORTED_MODES = new Set(["build"]);
const DEFAULT_LIMIT = 20;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "source-registry.generated.json",
);

// ALLOWED_PARTS 在 inferPartsCovered() 內用來過濾 disc.detectedExamParts，
// 確保只通過 validator 認可的 Part 字面量；其他 ALLOWED_* 集合定義在
// scripts/validate_source_registry.mjs（單一事實來源）、本檔不重複。
const ALLOWED_PARTS = new Set([
  "L1", "L2", "L3", "L4",
  "RW1", "RW2", "RW3", "RW4", "RW5",
  "SP1", "SP2", "SP3", "SP4",
  "unknown",
]);

// Cambridge 官方代理 / 認可機構 hostname allowlist（只放極少數高信心項；保守為要）
const OFFICIAL_HOSTNAMES = new Set([
  "www.cambridgeenglish.org",
  "cambridgeenglish.org",
  "cambridge.org",
  "www.cambridge.org",
]);

// 中文官方代理 / 認可機構 hostname → publisher / publisherType 映射
// （需 reviewer 後續人工再確認，故仍標 needs_manual_check）
const LOCAL_AGENCY_HOSTNAMES = new Map([
  ["www.yle.tw", { publisher: "YLE 台灣", publisherType: "school" }],
  ["yle.tw", { publisher: "YLE 台灣", publisherType: "school" }],
  ["www.certificate.tw", { publisher: "Certificate 台灣", publisherType: "school" }],
  ["certificate.tw", { publisher: "Certificate 台灣", publisherType: "school" }],
]);

// 保守的 fixed text — 任何 generated entry 都會帶
const GENERATED_PROVENANCE_TEMPLATE = (discId, sourceQuery) =>
  `Generated from discovery output (disc id: ${discId ?? "unknown"}, source query: ${sourceQuery ?? "unknown"}); reviewer must verify source kind, publisher, parts covered, and rights before import.`;

const GENERATED_RIGHTS_NOTES =
  "Not reviewed. Do not import until reviewer confirms usage boundary, license, and copyright. Auto-generated entry — never approve without manual verification.";

const HELP_TEXT = `
build_source_registry.mjs — P3-10-M / P3-10-O Source Registry generated workflow v0.2

Usage:
  node scripts/build_source_registry.mjs --help
  node scripts/build_source_registry.mjs \\
    --input <discovered-resources.json> \\
    --out <source-registry.generated.json> \\
    --mode build \\
    --limit 20 \\
    [--merge-with <existing-source-registry.json>]

Flags:
  --input <path>       discovered-resources JSON 路徑（example 或 generated 均可）；必填
  --out <path>         source-registry generated JSON 輸出路徑（預設：${DEFAULT_OUT}）
  --mode <mode>        目前只支援：build（其他 mode 屬未來範圍 → exit 2）
  --limit <n>          最多寫出幾筆 entry（預設：${DEFAULT_LIMIT}，正整數）
  --merge-with <path>  選填（P3-10-O，2026-05-15）：既有 source registry JSON。
                       提供時，本 CLI 會合併新 discovery output 與既有 registry：
                         * 命中既有條目（依 sourceUrl normalize match）→ 保留 reviewer
                           人工欄位（reviewStatus / rightsNotes / provenanceNotes /
                           sourceKind / publisher / publisherType / partsCovered /
                           level / exam / accessType / language / collectedAt /
                           lastCheckedAt / sourceId）
                         * 新 discovery 條目（無 match）→ 照原本規則產生
                           pending_review / needs_manual_check，sourceId 避開
                           既有條目使用過的 id
                         * 既有條目在新 discovery input 中找不到 → 保留為 orphan，
                           不刪、不降級 reviewStatus（即使是 approved_for_import）
                       若 --merge-with 檔不存在 / 非 JSON / 非陣列 / 含 duplicate
                       sourceId / 條目缺 sourceId / sourceUrl → exit 2 + 不寫 output
  --help               印此使用說明後 exit 0

What it does:
  - 對每筆 discovered entry 保守推論 sourceKind / publisher / publisherType /
    language / level / exam / partsCovered / fileType / collectionStatus / reviewStatus
  - dedupe key = normalizedUrl ?? url（同 URL 多次出現只保留第一筆；不丟資料、僅標 warning）
  - sourceId 由 input 順序 deterministic 產生：src-gen-001 / src-gen-002 ...
  - 一律不標 approved_for_import（這個值必須留給 reviewer 人工 review 後手動改）

Defaults / 保守推論策略:
  - 所有 entry 預設 reviewStatus = pending_review
  - 下列情況改為 needs_manual_check（不要 approved_for_import）：
      * fileType === "pdf"            （需 reviewer 人工開啟確認內容）
      * sourceKind === "unknown"      （不確定來源 → 必查）
      * publisherType === "unknown"   （不確定發行機構 → 必查）
      * 推論的 sourceKind 屬 official_sample / past_paper（高風險、必查授權）
      * discovery score < 5 或 shouldCollect === false（discovery 已標低信心）
      * accessType 不確定（一律標 unknown）
  - publisher / publisherType 不可假裝 official：只有 hostname 屬 OFFICIAL_HOSTNAMES
    才能標 publisher="Cambridge Assessment English" + publisherType="official"
  - sourceKind 不可從 third_party / school hostname 升為 official_sample / past_paper
    （若推論不一致，自動降為 third_party_practice 或 unknown）
  - partsCovered 從 disc.detectedExamParts 過濾到 ALLOWED_PARTS；空則設 ["unknown"]
  - provenanceNotes / rightsNotes 用固定保守模板，**絕不**聲稱已授權 / 已審核
  - collectedAt / lastCheckedAt = null（discovery 並未實際 collect 任何東西）

What it never does:
  - 不發 HTTP / 不抓網路 / 不下載任何 asset
  - 不呼叫 OpenAI / 任何雲端 API
  - 不寫 data/p3-example-questions.json / data/exam-papers.example.json
  - 不修改 input 檔
  - 不標 approved_for_import（無論 source 看起來多官方）
  - 不偽裝 sourceKind / publisherType

Output:
  - 寫出 source-registry array 至 --out（覆寫式）
  - 也印一份 console summary（total / written / skipped / merged / newEntries /
    orphaned / approvedPreserved / reviewStatus 統計）
  - source-registry.generated.json 已在 .gitignore 排除，**絕不**commit
  - merge 後仍須跑 scripts/validate_source_registry.mjs 確認 schema / sourceId 唯一性

Merge merge-key 規則（P3-10-O，2026-05-15）：
  - 主要：normalizeSourceUrlForGate(sourceUrl) —— lowercase host / strip trailing
    slash（pathname=/ 除外）/ 保留 search / 移除 fragment（與 source_registry_gate 一致）
  - Fallback（normalize 失敗時）：title 小寫 + raw sourceUrl
  - **不**只用 sourceId（sourceId 依 input 順序產生，input 位移會錯位）

Preserve 規則（命中既有條目時保留下列欄位）：
  - sourceId / sourceKind / publisher / publisherType / language / level / exam /
    partsCovered / accessType / reviewStatus / provenanceNotes / rightsNotes /
    collectedAt / lastCheckedAt
  - title：若既有 title 為 "(no title …)" placeholder 才以新值替換；否則保留
  - fileType：若既有 fileType="unknown" 且新值更明確才以新值替換；否則保留
  - sourceUrl：保留既有（避免大小寫 / trailing slash 差異造成 spurious diff）

Exit code:
  0  成功
  1  未預期錯誤
  2  CLI 參數錯 / input 不存在 / JSON parse 失敗 / unsupported mode
`;

// ===========================================================================
// 1. CLI parsing
// ===========================================================================

function parseCliArgs(argv) {
  const args = {
    input: null,
    out: null,
    mode: "build",
    limit: DEFAULT_LIMIT,
    mergeWith: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--input") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        return { ok: false, error: `--input 需要一個路徑值，收到：${value ?? "(空)"}` };
      }
      args.input = value;
      i += 1;
      continue;
    }
    if (token === "--out") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        return { ok: false, error: `--out 需要一個路徑值，收到：${value ?? "(空)"}` };
      }
      args.out = value;
      i += 1;
      continue;
    }
    if (token === "--mode") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        return { ok: false, error: `--mode 需要一個值，收到：${value ?? "(空)"}` };
      }
      args.mode = value;
      i += 1;
      continue;
    }
    if (token === "--limit") {
      const value = argv[i + 1];
      const n = Number(value);
      if (!Number.isInteger(n) || n <= 0) {
        return { ok: false, error: `--limit 必須是正整數，收到：${value ?? "(空)"}` };
      }
      args.limit = n;
      i += 1;
      continue;
    }
    if (token === "--merge-with") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        return { ok: false, error: `--merge-with 需要一個路徑值，收到：${value ?? "(空)"}` };
      }
      args.mergeWith = value;
      i += 1;
      continue;
    }
    return { ok: false, error: `未知參數：${token}（用 --help 看完整用法）` };
  }
  return { ok: true, args };
}

// ===========================================================================
// 2. helpers
// ===========================================================================

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function parseUrl(value) {
  if (!isNonEmptyString(value)) return null;
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function hasCjkChars(value) {
  if (typeof value !== "string") return false;
  // 中日韓基本範圍（CJK Unified Ideographs + 注音 + 全形）
  return /[　-〿㄀-ㄯ一-鿿＀-￯]/.test(value);
}

function inferLanguage(disc) {
  const titleHasCjk = hasCjkChars(disc.title);
  const snippetHasCjk = hasCjkChars(disc.snippet);
  const queryHasCjk = hasCjkChars(disc.sourceQuery);
  if (titleHasCjk || snippetHasCjk || queryHasCjk) return "zh-Hant";
  return "en";
}

function inferLevel(disc) {
  const raw = typeof disc.level === "string" ? disc.level.trim() : "";
  if (raw.length > 0) return raw;
  return "unknown";
}

function inferExam(level) {
  const lower = level.toLowerCase();
  if (lower.includes("pre a1") || lower.includes("starters")) {
    return "Cambridge Starters";
  }
  if (lower.includes("a1 movers") || lower.includes("movers")) {
    return "Cambridge Movers";
  }
  if (lower.includes("a2 flyers") || lower.includes("flyers")) {
    return "Cambridge Flyers";
  }
  return "unknown";
}

function inferPartsCovered(disc) {
  const arr = Array.isArray(disc.detectedExamParts) ? disc.detectedExamParts : [];
  const filtered = arr.filter((p) => typeof p === "string" && ALLOWED_PARTS.has(p));
  if (filtered.length === 0) return ["unknown"];
  // de-dup, keep order
  const seen = new Set();
  const out = [];
  for (const p of filtered) {
    if (!seen.has(p)) {
      seen.add(p);
      out.push(p);
    }
  }
  return out;
}

function inferFileType(disc, urlObj) {
  const rt = typeof disc.resourceType === "string" ? disc.resourceType.toLowerCase() : "";
  // 1) 直接從 resourceType 推
  if (rt === "pdf") return "pdf";
  if (rt === "image") return "image";
  if (rt === "audio") return "audio";
  if (rt === "video") return "video";
  if (
    rt === "page" ||
    rt === "worksheet" ||
    rt === "vocabulary_list" ||
    rt === "listening_practice" ||
    rt === "reading_writing_practice" ||
    rt === "sample_paper"
  ) {
    return "html";
  }
  // 2) fallback：依 URL extension
  if (urlObj) {
    const pathname = urlObj.pathname.toLowerCase();
    if (pathname.endsWith(".pdf")) return "pdf";
    if (pathname.endsWith(".doc") || pathname.endsWith(".docx")) return "doc";
    if (pathname.endsWith(".mp3") || pathname.endsWith(".wav") || pathname.endsWith(".m4a")) return "audio";
    if (pathname.endsWith(".mp4") || pathname.endsWith(".mov")) return "video";
    if (
      pathname.endsWith(".png") ||
      pathname.endsWith(".jpg") ||
      pathname.endsWith(".jpeg") ||
      pathname.endsWith(".gif") ||
      pathname.endsWith(".svg")
    ) {
      return "image";
    }
    if (pathname.endsWith(".html") || pathname.endsWith(".htm") || pathname.endsWith("/") || !pathname.includes(".")) {
      return "html";
    }
  }
  return "unknown";
}

function inferPublisher(disc, urlObj) {
  const host = urlObj?.hostname?.toLowerCase() ?? "";
  if (OFFICIAL_HOSTNAMES.has(host)) {
    return { publisher: "Cambridge Assessment English", publisherType: "official" };
  }
  if (LOCAL_AGENCY_HOSTNAMES.has(host)) {
    const entry = LOCAL_AGENCY_HOSTNAMES.get(host);
    return { publisher: entry.publisher, publisherType: entry.publisherType };
  }
  // discovery 把 sourceType="official" 標到非 OFFICIAL_HOSTNAMES 的 host 時，
  // **保守**降為 third_party + needs_manual_check（不要假裝 official）。
  const discType = typeof disc.sourceType === "string" ? disc.sourceType : "unknown";
  let publisherType;
  if (discType === "official") {
    publisherType = "third_party"; // 降級保守
  } else if (discType === "school") {
    publisherType = "school";
  } else if (discType === "third_party") {
    publisherType = "third_party";
  } else {
    publisherType = "unknown";
  }
  // publisher 字串：用 sourceDomain（或 hostname）作可讀名稱；validator 要求非空
  const publisher = (() => {
    if (isNonEmptyString(disc.sourceDomain)) return disc.sourceDomain;
    if (isNonEmptyString(host)) return host;
    return "(unknown publisher)";
  })();
  return { publisher, publisherType };
}

function inferSourceKindAndReview(disc, publisherType, fileType) {
  const rt = typeof disc.resourceType === "string" ? disc.resourceType.toLowerCase() : "";
  const titleLower = (disc.title ?? "").toLowerCase();
  const snippetLower = (disc.snippet ?? "").toLowerCase();

  const looksLikeSample =
    rt === "sample_paper" ||
    titleLower.includes("sample paper") ||
    titleLower.includes("sample test") ||
    snippetLower.includes("sample paper");
  const looksLikePastPaper =
    titleLower.includes("past paper") ||
    titleLower.includes("歷屆") ||
    snippetLower.includes("past paper") ||
    snippetLower.includes("歷屆");
  const looksLikeWorksheet =
    rt === "worksheet" ||
    titleLower.includes("worksheet") ||
    titleLower.includes("練習題") ||
    titleLower.includes("習題");
  const looksLikeVocabList =
    rt === "vocabulary_list" ||
    titleLower.includes("word list") ||
    titleLower.includes("wordlist") ||
    titleLower.includes("單字表") ||
    titleLower.includes("字表");
  const looksLikeListening =
    rt === "listening_practice" ||
    titleLower.includes("listening practice") ||
    titleLower.includes("聽力練習");
  const looksLikeReadingWriting =
    rt === "reading_writing_practice" ||
    titleLower.includes("reading writing");
  const looksLikeShopping =
    Array.isArray(disc.reasons) && disc.reasons.includes("shopping_or_product_page");

  let sourceKind;

  // Step 1：先從 publisherType 限制 sourceKind 上限
  if (publisherType === "official") {
    // 來自 official hostname：可上 official_sample / official_learning_material / past_paper
    if (looksLikeSample) sourceKind = "official_sample";
    else if (looksLikePastPaper) sourceKind = "past_paper";
    else sourceKind = "official_learning_material";
  } else if (publisherType === "school") {
    // school 屬官方代理 / 認可機構：可上 past_paper 但仍需 needs_manual_check
    if (looksLikePastPaper || looksLikeSample) sourceKind = "past_paper";
    else if (looksLikeWorksheet || looksLikeVocabList || looksLikeListening || looksLikeReadingWriting) {
      sourceKind = "third_party_practice";
    } else sourceKind = "third_party_practice"; // 保守
  } else if (publisherType === "third_party") {
    sourceKind = "third_party_practice";
  } else {
    sourceKind = "unknown";
  }

  // Step 2：shopping/product 一律 unknown（不混入 practice）
  if (looksLikeShopping) sourceKind = "unknown";

  // Step 3：validator rule #6：official_sample / past_paper 要 publisherType ∈ {official, school}
  // 若 publisherType 不符 → 自動降為 third_party_practice 或 unknown（避免 validator fail）
  if (
    (sourceKind === "official_sample" || sourceKind === "past_paper") &&
    !["official", "school"].includes(publisherType)
  ) {
    sourceKind = publisherType === "unknown" ? "unknown" : "third_party_practice";
  }

  // Step 4：reviewStatus 推論
  // 預設 pending_review；高風險升 needs_manual_check
  let reviewStatus = "pending_review";

  const score = typeof disc.score === "number" ? disc.score : 0;
  const shouldCollect = disc.shouldCollect !== false; // 預設 true（若沒此欄位）

  const highRisk =
    fileType === "pdf" ||
    sourceKind === "unknown" ||
    publisherType === "unknown" ||
    sourceKind === "official_sample" ||
    sourceKind === "past_paper" ||
    sourceKind === "official_learning_material" ||
    score < 5 ||
    !shouldCollect;

  if (highRisk) reviewStatus = "needs_manual_check";

  return { sourceKind, reviewStatus };
}

function inferCollectionStatus() {
  // discovery 階段並未實際 collect 任何 metadata / body / asset；一律 "discovered"
  return "discovered";
}

function inferAccessType() {
  // 保守：除非 reviewer 確認，否則一律 unknown
  return "unknown";
}

function buildTitle(disc, urlObj) {
  if (isNonEmptyString(disc.title)) return disc.title.trim();
  if (isNonEmptyString(disc.sourceDomain)) return `(no title) ${disc.sourceDomain}`;
  if (urlObj) return `(no title) ${urlObj.hostname}${urlObj.pathname}`;
  return "(no title, no URL)";
}

function buildSourceUrl(disc) {
  // 優先 normalizedUrl，其次 url
  const normalized = parseUrl(disc.normalizedUrl);
  if (normalized) return normalized.href;
  const raw = parseUrl(disc.url);
  if (raw) return raw.href;
  return null;
}

function buildSourceId(index) {
  const padded = String(index + 1).padStart(3, "0");
  return `src-gen-${padded}`;
}

// ===========================================================================
// 3. 主轉換
// ===========================================================================

function buildEntries(discoveryArray, limit) {
  const skipped = [];
  const dedupKeys = new Set();
  const intermediate = [];

  for (let i = 0; i < discoveryArray.length; i += 1) {
    const disc = discoveryArray[i];
    if (typeof disc !== "object" || disc === null || Array.isArray(disc)) {
      skipped.push({
        discIndex: i,
        discId: null,
        reason: "skipped_not_an_object",
      });
      continue;
    }

    const sourceUrl = buildSourceUrl(disc);
    if (!sourceUrl) {
      skipped.push({
        discIndex: i,
        discId: typeof disc.id === "string" ? disc.id : null,
        reason: "skipped_missing_or_invalid_url",
      });
      continue;
    }

    // dedup key：優先 normalizedUrl，再 url
    const dedupKey =
      (typeof disc.normalizedUrl === "string" && disc.normalizedUrl.trim()) ||
      (typeof disc.url === "string" && disc.url.trim()) ||
      sourceUrl;
    if (dedupKeys.has(dedupKey)) {
      skipped.push({
        discIndex: i,
        discId: typeof disc.id === "string" ? disc.id : null,
        reason: "skipped_duplicate_url",
        dedupKey,
      });
      continue;
    }
    dedupKeys.add(dedupKey);

    intermediate.push({ disc, sourceUrl, discIndex: i });
  }

  // 套用 limit（防呆）
  const limited = intermediate.slice(0, limit);
  const overflow = intermediate.slice(limit);
  for (const item of overflow) {
    skipped.push({
      discIndex: item.discIndex,
      discId: typeof item.disc.id === "string" ? item.disc.id : null,
      reason: "skipped_due_to_limit",
    });
  }

  const entries = limited.map(({ disc, sourceUrl }, outIndex) => {
    const urlObj = parseUrl(sourceUrl);
    const { publisher, publisherType } = inferPublisher(disc, urlObj);
    const fileType = inferFileType(disc, urlObj);
    const { sourceKind, reviewStatus } = inferSourceKindAndReview(
      disc,
      publisherType,
      fileType,
    );
    const partsCovered = inferPartsCovered(disc);
    const language = inferLanguage(disc);
    const level = inferLevel(disc);
    const exam = inferExam(level);
    const collectionStatus = inferCollectionStatus();
    const accessType = inferAccessType();

    return {
      sourceId: buildSourceId(outIndex),
      title: buildTitle(disc, urlObj),
      sourceKind,
      sourceUrl,
      publisher,
      publisherType,
      language,
      level,
      exam,
      partsCovered,
      fileType,
      accessType,
      collectionStatus,
      reviewStatus,
      provenanceNotes: GENERATED_PROVENANCE_TEMPLATE(disc.id, disc.sourceQuery),
      rightsNotes: GENERATED_RIGHTS_NOTES,
      collectedAt: null,
      lastCheckedAt: null,
    };
  });

  return { entries, skipped };
}

// ===========================================================================
// 3.5. P3-10-O：Merge with existing registry
// ===========================================================================

/**
 * 命中既有條目時，下列欄位**一律保留 existing 值**——避免覆蓋 reviewer 人工編輯。
 * （title / fileType / sourceUrl 由 mergeEntryWithExisting 單獨處理）
 */
const PRESERVED_FIELDS_FROM_EXISTING = [
  "sourceId",
  "sourceKind",
  "publisher",
  "publisherType",
  "language",
  "level",
  "exam",
  "partsCovered",
  "accessType",
  "collectionStatus",
  "reviewStatus",
  "provenanceNotes",
  "rightsNotes",
  "collectedAt",
  "lastCheckedAt",
];

/**
 * mergeKey 規則：
 *   1. 主要：normalizeSourceUrlForGate(sourceUrl) → "url:<normalized>"
 *   2. Fallback：title (lower-trim) + raw sourceUrl → "fallback:<title>|<raw>"
 *   3. 都失敗 → null（caller 將該條目視為無法 merge）
 *
 * 重點：**不**只用 sourceId（sourceId 依 input 順序產生，input 位移會錯位）。
 */
function computeMergeKey(entry) {
  if (!entry || typeof entry !== "object") return null;
  const normalized = normalizeSourceUrlForGate(entry.sourceUrl);
  if (normalized) return `url:${normalized}`;
  const title = typeof entry.title === "string" ? entry.title.trim().toLowerCase() : "";
  const raw = typeof entry.sourceUrl === "string" ? entry.sourceUrl.trim() : "";
  if (title && raw) return `fallback:${title}|${raw}`;
  return null;
}

/** title 是否為 buildTitle() 自動填的 placeholder（empty / "(no title …)"）。 */
function isAutoPlaceholderTitle(title) {
  if (typeof title !== "string") return true;
  const t = title.trim();
  if (!t) return true;
  if (t.startsWith("(no title")) return true;
  return false;
}

/**
 * 把新 auto-generated entry 與既有 entry 合併。
 * - PRESERVED_FIELDS_FROM_EXISTING 一律取 existing 值
 * - title：existing 為 placeholder 才以 new 值替換；否則保留 existing
 * - fileType：existing 為 "unknown" 且 new 非 "unknown" 才以 new 值替換
 * - sourceUrl：一律保留 existing（merge 是依 URL match，case / trailing slash 可能不同；
 *   保留 existing 避免 spurious diff）
 */
function mergeEntryWithExisting(newEntry, existingEntry) {
  const merged = { ...newEntry };
  for (const f of PRESERVED_FIELDS_FROM_EXISTING) {
    if (Object.prototype.hasOwnProperty.call(existingEntry, f)) {
      merged[f] = existingEntry[f];
    }
  }
  // title 特例
  const exTitle = existingEntry.title;
  if (isAutoPlaceholderTitle(exTitle) && !isAutoPlaceholderTitle(newEntry.title)) {
    merged.title = newEntry.title;
  } else if (typeof exTitle === "string") {
    merged.title = exTitle;
  }
  // fileType 特例
  if (
    existingEntry.fileType === "unknown" &&
    typeof newEntry.fileType === "string" &&
    newEntry.fileType !== "unknown"
  ) {
    merged.fileType = newEntry.fileType;
  } else if (typeof existingEntry.fileType === "string") {
    merged.fileType = existingEntry.fileType;
  }
  // sourceUrl 一律取 existing（若 existing 是非空字串）
  if (typeof existingEntry.sourceUrl === "string" && existingEntry.sourceUrl.trim()) {
    merged.sourceUrl = existingEntry.sourceUrl;
  }
  return merged;
}

/**
 * 驗證 --merge-with 載入的 registry。
 *
 * Throws Error（caller exit 2）若：
 *   - 不是 array
 *   - 任一 entry 不是物件
 *   - 任一 entry 缺 sourceId / sourceUrl
 *   - 含 duplicate sourceId
 */
function validateExistingRegistry(registry, path) {
  if (!Array.isArray(registry)) {
    throw new Error(
      `--merge-with JSON 必須是最外層陣列：${path}（讀到 ${
        registry === null ? "null" : typeof registry
      }）`,
    );
  }
  const seenIds = new Set();
  const dupIds = [];
  for (let i = 0; i < registry.length; i += 1) {
    const e = registry[i];
    if (!e || typeof e !== "object" || Array.isArray(e)) {
      throw new Error(`--merge-with entry ${i} 不是物件：${path}`);
    }
    if (!isNonEmptyString(e.sourceId)) {
      throw new Error(`--merge-with entry ${i} 缺 sourceId 或非字串：${path}`);
    }
    if (!isNonEmptyString(e.sourceUrl)) {
      throw new Error(
        `--merge-with entry ${i} (sourceId=${e.sourceId}) 缺 sourceUrl 或非字串：${path}`,
      );
    }
    if (seenIds.has(e.sourceId)) {
      dupIds.push(e.sourceId);
    } else {
      seenIds.add(e.sourceId);
    }
  }
  if (dupIds.length > 0) {
    throw new Error(
      `--merge-with 含 duplicate sourceId：${dupIds.join(
        ", ",
      )}。請先用 scripts/validate_source_registry.mjs 修正後重試。`,
    );
  }
}

/**
 * 把 buildEntries 產出的 generatedEntries 與 existingRegistry 合併。
 *
 * 輸出順序：
 *   1. 新 entries（按 input 順序），matched 的取既有 preserve 欄位，
 *      非 matched 的標 newEntries 並避開既有 sourceId
 *   2. Orphans（既有 registry 中 mergeKey 不在新 input 的條目，按既有順序附加在尾）
 *
 * 回傳 { outputEntries, stats } 含 merged / newEntries / orphaned / approvedPreserved /
 *   existingTotal counters。
 */
function mergeRegistries(generatedEntries, existingRegistry) {
  const existingByKey = new Map(); // mergeKey -> existing entry
  const existingSourceIds = new Set();
  for (const ex of existingRegistry) {
    const key = computeMergeKey(ex);
    if (key && !existingByKey.has(key)) {
      existingByKey.set(key, ex);
    }
    if (isNonEmptyString(ex.sourceId)) {
      existingSourceIds.add(ex.sourceId);
    }
  }

  const matchedKeys = new Set();
  const outputEntries = [];
  const stats = {
    existingTotal: existingRegistry.length,
    merged: 0,
    newEntries: 0,
    orphaned: 0,
    approvedPreserved: 0,
  };

  // 為「新 entry（無 match）」配發 sourceId，避開既有 ids
  let nextNewIdSuffix = 1;
  function nextAvailableNewSourceId() {
    while (true) {
      const padded = String(nextNewIdSuffix).padStart(3, "0");
      const candidate = `src-gen-${padded}`;
      nextNewIdSuffix += 1;
      if (!existingSourceIds.has(candidate)) {
        return candidate;
      }
    }
  }

  for (const newEntry of generatedEntries) {
    const key = computeMergeKey(newEntry);
    if (key && existingByKey.has(key)) {
      const ex = existingByKey.get(key);
      const merged = mergeEntryWithExisting(newEntry, ex);
      outputEntries.push(merged);
      matchedKeys.add(key);
      stats.merged += 1;
      if (ex.reviewStatus === "approved_for_import") {
        stats.approvedPreserved += 1;
      }
    } else {
      // 新 entry；確保 sourceId 不與既有衝突
      const safeId = nextAvailableNewSourceId();
      outputEntries.push({ ...newEntry, sourceId: safeId });
      stats.newEntries += 1;
    }
  }

  // Orphans：既有 entries 在新 discovery input 中找不到對應 mergeKey
  for (const ex of existingRegistry) {
    const key = computeMergeKey(ex);
    if (key && matchedKeys.has(key)) continue;
    // 沒 mergeKey 或 mergeKey 沒命中 → orphan（保留 entry 原樣）
    outputEntries.push(ex);
    stats.orphaned += 1;
    if (ex.reviewStatus === "approved_for_import") {
      stats.approvedPreserved += 1;
    }
  }

  return { outputEntries, stats };
}

// ===========================================================================
// 4. JSON 讀寫
// ===========================================================================

async function readJsonFile(path) {
  let raw;
  try {
    raw = await readFile(path, "utf8");
  } catch (err) {
    throw new Error(`讀檔失敗：${path}（${err.message}）`);
  }
  try {
    return JSON.parse(raw);
  } catch (err) {
    throw new Error(`JSON parse 失敗：${path}（${err.message}）`);
  }
}

async function writeJsonFile(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

// ===========================================================================
// 5. 主流程
// ===========================================================================

async function main(argv) {
  const parsed = parseCliArgs(argv);
  if (!parsed.ok) {
    process.stderr.write(`[build_source_registry] ${parsed.error}\n`);
    process.stderr.write(HELP_TEXT);
    process.exit(2);
  }
  if (parsed.args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  if (!SUPPORTED_MODES.has(parsed.args.mode)) {
    process.stderr.write(
      `[build_source_registry] 不支援的 --mode：${parsed.args.mode}（目前只支援：build）\n`,
    );
    process.exit(2);
  }

  if (!parsed.args.input) {
    process.stderr.write(`[build_source_registry] 必須提供 --input <discovered-resources.json>\n`);
    process.stderr.write(HELP_TEXT);
    process.exit(2);
  }

  const inputPath = resolve(process.cwd(), parsed.args.input);
  const outPath = parsed.args.out
    ? resolve(process.cwd(), parsed.args.out)
    : DEFAULT_OUT;
  const mergeWithPath = parsed.args.mergeWith
    ? resolve(process.cwd(), parsed.args.mergeWith)
    : null;

  let discoveryArray;
  try {
    const parsedJson = await readJsonFile(inputPath);
    if (!Array.isArray(parsedJson)) {
      process.stderr.write(
        `[build_source_registry] 預期 --input 最外層為陣列、實際是 ${typeof parsedJson}\n`,
      );
      process.exit(2);
    }
    discoveryArray = parsedJson;
  } catch (err) {
    process.stderr.write(`[build_source_registry] ${err.message}\n`);
    process.exit(2);
  }

  // P3-10-O：載入並驗證 --merge-with（若指定）
  let existingRegistry = null;
  if (mergeWithPath) {
    try {
      const parsedExisting = await readJsonFile(mergeWithPath);
      validateExistingRegistry(parsedExisting, mergeWithPath);
      existingRegistry = parsedExisting;
    } catch (err) {
      process.stderr.write(`[build_source_registry] ${err.message}\n`);
      process.stderr.write(
        "提示：--merge-with 必須是符合 source registry schema 的陣列；可用 scripts/validate_source_registry.mjs 檢查。\n",
      );
      process.exit(2);
    }
  }

  const { entries: rawEntries, skipped } = buildEntries(
    discoveryArray,
    parsed.args.limit,
  );

  let finalEntries = rawEntries;
  let mergeStats = null;
  if (existingRegistry) {
    const { outputEntries, stats } = mergeRegistries(rawEntries, existingRegistry);
    finalEntries = outputEntries;
    mergeStats = stats;
  }

  await writeJsonFile(outPath, finalEntries);

  // 印 summary
  const reviewStatusCounts = finalEntries.reduce((acc, e) => {
    acc[e.reviewStatus] = (acc[e.reviewStatus] ?? 0) + 1;
    return acc;
  }, {});
  const sourceKindCounts = finalEntries.reduce((acc, e) => {
    acc[e.sourceKind] = (acc[e.sourceKind] ?? 0) + 1;
    return acc;
  }, {});

  process.stdout.write(`${BUILDER_VERSION}\n`);
  process.stdout.write(`input:       ${inputPath}\n`);
  process.stdout.write(`out:         ${outPath}\n`);
  process.stdout.write(`mode:        ${parsed.args.mode}\n`);
  process.stdout.write(`limit:       ${parsed.args.limit}\n`);
  process.stdout.write(
    `merge-with:  ${mergeWithPath ?? "(none — overwrite mode)"}\n\n`,
  );

  if (mergeStats) {
    process.stdout.write(
      `Summary (merge mode): totalInput=${discoveryArray.length}  ` +
        `existingTotal=${mergeStats.existingTotal}  ` +
        `written=${finalEntries.length}  skipped=${skipped.length}\n`,
    );
    process.stdout.write(
      `  merged=${mergeStats.merged}  ` +
        `newEntries=${mergeStats.newEntries}  ` +
        `orphaned=${mergeStats.orphaned}  ` +
        `approvedPreserved=${mergeStats.approvedPreserved}\n`,
    );
  } else {
    process.stdout.write(
      `Summary: totalInput=${discoveryArray.length}  written=${finalEntries.length}  skipped=${skipped.length}\n`,
    );
  }
  process.stdout.write(
    `  reviewStatus: ${JSON.stringify(reviewStatusCounts)}\n`,
  );
  process.stdout.write(
    `  sourceKind:   ${JSON.stringify(sourceKindCounts)}\n`,
  );
  if (skipped.length > 0) {
    process.stdout.write(`\nSkipped (from discovery input):\n`);
    for (const s of skipped) {
      const idLabel = s.discId ?? `(no id, index ${s.discIndex})`;
      process.stdout.write(`  - ${idLabel}: ${s.reason}\n`);
    }
  }
  process.stdout.write(
    `\nReminder: all written entries are auto-generated unless preserved from --merge-with.\n` +
      `  - This CLI never sets approved_for_import on new entries (P3-10-L hard boundary).\n` +
      `  - merge-with preserves reviewer-edited fields (reviewStatus / rightsNotes / provenanceNotes /\n` +
      `    sourceKind / publisher / publisherType / partsCovered / level / exam / accessType / etc.).\n` +
      `  - Reviewer must still verify each entry; merge is preserve-only, not auto-approve.\n` +
      `  - Run scripts/validate_source_registry.mjs on the output to confirm schema + sourceId uniqueness.\n` +
      `  - source-registry.generated.json is gitignored; do NOT commit.\n`,
  );
}

// ===========================================================================
// 6. Entry-script gate
// ===========================================================================

const isDirectCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectCli) {
  main(process.argv.slice(2)).catch((err) => {
    process.stderr.write(`[build_source_registry] unexpected error\n  ${err?.stack ?? err}\n`);
    process.exit(1);
  });
}

export {
  BUILDER_VERSION,
  parseCliArgs,
  buildEntries,
  buildSourceId,
  buildSourceUrl,
  buildTitle,
  computeMergeKey,
  mergeEntryWithExisting,
  mergeRegistries,
  validateExistingRegistry,
  isAutoPlaceholderTitle,
  PRESERVED_FIELDS_FROM_EXISTING,
  inferLanguage,
  inferLevel,
  inferExam,
  inferPartsCovered,
  inferFileType,
  inferPublisher,
  inferSourceKindAndReview,
  inferCollectionStatus,
  inferAccessType,
  GENERATED_PROVENANCE_TEMPLATE,
  GENERATED_RIGHTS_NOTES,
};
