#!/usr/bin/env node
/**
 * scripts/validate_source_registry.mjs
 *
 * P3-10-L：Source Registry 靜態驗證 CLI（v0.1）。
 *
 * 對應 docs/SOURCE_REGISTRY_PLAN.md。
 *
 * 用途：
 *   - 讀 source registry JSON（預設 data/imported/source-registry.example.json）
 *   - 驗證每筆 entry 的必填欄位 / enum 值 / sourceUrl 格式
 *   - 對 official_sample / past_paper 條目強制驗證 sourceUrl / publisher / provenanceNotes
 *   - 輸出 console summary（每筆 status / errors）
 *
 * 硬邊界（對齊 docs/SOURCE_REGISTRY_PLAN.md）：
 *   - ❌ 不抓網路 / 不發 HTTP 請求
 *   - ❌ 不呼叫 OpenAI / 任何雲端 API
 *   - ❌ 不修改正式題庫
 *   - ❌ 不寫任何輸出檔（純 stdout summary）
 *   - ✅ 純靜態 JSON schema 驗證
 *
 * 使用方式：
 *   help：
 *     node scripts/validate_source_registry.mjs --help
 *
 *   驗證 example registry：
 *     node scripts/validate_source_registry.mjs \
 *       --input data/imported/source-registry.example.json
 *
 * exit code：
 *   0  全部 entry 通過驗證
 *   1  有 entry 驗證失敗 / 未預期錯誤
 *   2  CLI 參數錯 / input 不存在 / JSON parse 失敗
 */

import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const VALIDATOR_VERSION = "validate_source_registry.mjs@v0.1.1";

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_INPUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "source-registry.example.json",
);

const HELP_TEXT = `
validate_source_registry.mjs — P3-10-L Source Registry static validator v0.1.1

Usage:
  node scripts/validate_source_registry.mjs --input <source-registry.json>
  node scripts/validate_source_registry.mjs --help

Flags:
  --input <path>   Path to source registry JSON (default: data/imported/source-registry.example.json)
  --help           Show this help and exit 0

What it validates (per entry):
  1. Required fields exist & are correct primitive type
  2. Enum fields use allowed literal values
  3. sourceUrl is a syntactically valid URL (URL constructor parsing)
  4. partsCovered is an array of allowed Part literals (or ["unknown"])
  5. official_sample / past_paper / official_learning_material entries must have:
       - non-empty sourceUrl
       - non-empty publisher
       - non-empty provenanceNotes
  6. official_sample / past_paper entries must have publisherType in
     { official, school } (not third_party / teacher / unknown)
  7. approved_for_import entries must have non-empty rightsNotes
  8. unknown sourceKind cannot be approved_for_import

Batch-level validation (v0.1.1, P3-10-L 修補):
  9. Duplicate sourceId across the input array → every entry sharing that id
     is marked failed with errors:
       - duplicate_sourceId:<sourceId>
       - duplicate_sourceId_at_entries:<comma-separated indices>
     Empty / non-string sourceId values are NOT treated as duplicates
     (they already fail rule #1 / #2 per-entry).

Output:
  - prints per-entry status (PASS / FAIL with errors) to stdout
  - prints batch summary (total / passed / failed / duplicateSourceIds) at the end

Exit code:
  0  all entries passed
  1  one or more entries failed validation (including duplicate sourceId)
  2  CLI parse error / input read error / JSON parse error

Hard boundaries:
  - Never fetches network / makes HTTP requests
  - Never calls OpenAI / cloud APIs
  - Never modifies the input file or any other file
  - Pure static schema validation
`;

// ===========================================================================
// 1. Enum 允許值（對齊 docs/SOURCE_REGISTRY_PLAN.md C 段）
// ===========================================================================

const ALLOWED_SOURCE_KIND = new Set([
  "official_sample",
  "official_learning_material",
  "past_paper",
  "third_party_practice",
  "custom",
  "ai_generated",
  "unknown",
]);

const ALLOWED_PUBLISHER_TYPE = new Set([
  "official",
  "school",
  "teacher",
  "third_party",
  "unknown",
]);

const ALLOWED_COLLECTION_STATUS = new Set([
  "discovered",
  "collected_metadata",
  "collected_text",
  "collected_asset_metadata",
  "failed",
]);

const ALLOWED_REVIEW_STATUS = new Set([
  "pending_review",
  "approved_for_import",
  "rejected",
  "needs_manual_check",
]);

const ALLOWED_FILE_TYPE = new Set([
  "html",
  "pdf",
  "image",
  "audio",
  "video",
  "doc",
  "unknown",
]);

const ALLOWED_ACCESS_TYPE = new Set([
  "public",
  "free_with_signup",
  "paid",
  "restricted",
  "unknown",
]);

const ALLOWED_PARTS = new Set([
  "L1", "L2", "L3", "L4",
  "RW1", "RW2", "RW3", "RW4", "RW5",
  "SP1", "SP2", "SP3", "SP4",
  "unknown",
]);

const SOURCE_KINDS_REQUIRING_OFFICIAL_FIELDS = new Set([
  "official_sample",
  "past_paper",
  "official_learning_material",
]);

const SOURCE_KINDS_REQUIRING_OFFICIAL_PUBLISHER_TYPE = new Set([
  "official_sample",
  "past_paper",
]);

const REQUIRED_FIELDS = [
  "sourceId",
  "title",
  "sourceKind",
  "sourceUrl",
  "publisher",
  "publisherType",
  "language",
  "level",
  "exam",
  "partsCovered",
  "fileType",
  "accessType",
  "collectionStatus",
  "reviewStatus",
  "provenanceNotes",
  "rightsNotes",
  "collectedAt",
  "lastCheckedAt",
];

// ===========================================================================
// 2. CLI 解析
// ===========================================================================

function parseCliArgs(argv) {
  const args = { input: null, help: false };
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (token === "--help" || token === "-h") {
      args.help = true;
      continue;
    }
    if (token === "--input") {
      const value = argv[i + 1];
      if (!value || value.startsWith("--")) {
        return {
          ok: false,
          error: `--input 需要一個值（路徑），收到：${value ?? "(空)"}`,
        };
      }
      args.input = value;
      i += 1;
      continue;
    }
    return {
      ok: false,
      error: `未知參數：${token}（用 --help 看完整用法）`,
    };
  }
  return { ok: true, args };
}

// ===========================================================================
// 3. 單筆 entry 驗證
// ===========================================================================

function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isValidUrl(value) {
  if (!isNonEmptyString(value)) return false;
  try {
    const parsed = new URL(value);
    return Boolean(parsed);
  } catch {
    return false;
  }
}

function isIsoDateOrNull(value) {
  if (value === null) return true;
  if (typeof value !== "string") return false;
  const parsed = Date.parse(value);
  return !Number.isNaN(parsed);
}

function validateEntry(entry, index) {
  const errors = [];

  if (typeof entry !== "object" || entry === null || Array.isArray(entry)) {
    errors.push("entry 不是物件");
    return { entryIndex: index, sourceId: null, status: "failed", errors };
  }

  // 1. 必填欄位存在
  for (const field of REQUIRED_FIELDS) {
    if (!(field in entry)) {
      errors.push(`missing_required_field:${field}`);
    }
  }

  // 2. 字串型欄位非空（collectedAt / lastCheckedAt 例外，可為 null）
  const stringFields = [
    "sourceId",
    "title",
    "sourceKind",
    "sourceUrl",
    "publisher",
    "publisherType",
    "language",
    "level",
    "exam",
    "fileType",
    "accessType",
    "collectionStatus",
    "reviewStatus",
    "provenanceNotes",
    "rightsNotes",
  ];
  for (const f of stringFields) {
    if (f in entry && !isNonEmptyString(entry[f])) {
      errors.push(`field_must_be_non_empty_string:${f}`);
    }
  }

  // 3. enum 驗證
  if ("sourceKind" in entry && !ALLOWED_SOURCE_KIND.has(entry.sourceKind)) {
    errors.push(`invalid_enum_sourceKind:${entry.sourceKind}`);
  }
  if (
    "publisherType" in entry &&
    !ALLOWED_PUBLISHER_TYPE.has(entry.publisherType)
  ) {
    errors.push(`invalid_enum_publisherType:${entry.publisherType}`);
  }
  if (
    "collectionStatus" in entry &&
    !ALLOWED_COLLECTION_STATUS.has(entry.collectionStatus)
  ) {
    errors.push(`invalid_enum_collectionStatus:${entry.collectionStatus}`);
  }
  if (
    "reviewStatus" in entry &&
    !ALLOWED_REVIEW_STATUS.has(entry.reviewStatus)
  ) {
    errors.push(`invalid_enum_reviewStatus:${entry.reviewStatus}`);
  }
  if ("fileType" in entry && !ALLOWED_FILE_TYPE.has(entry.fileType)) {
    errors.push(`invalid_enum_fileType:${entry.fileType}`);
  }
  if ("accessType" in entry && !ALLOWED_ACCESS_TYPE.has(entry.accessType)) {
    errors.push(`invalid_enum_accessType:${entry.accessType}`);
  }

  // 4. partsCovered 陣列驗證
  if ("partsCovered" in entry) {
    if (!Array.isArray(entry.partsCovered)) {
      errors.push("partsCovered_must_be_array");
    } else if (entry.partsCovered.length === 0) {
      errors.push("partsCovered_must_have_at_least_one_value");
    } else {
      for (const part of entry.partsCovered) {
        if (!ALLOWED_PARTS.has(part)) {
          errors.push(`invalid_part_in_partsCovered:${part}`);
        }
      }
    }
  }

  // 5. sourceUrl 格式
  if ("sourceUrl" in entry && !isValidUrl(entry.sourceUrl)) {
    errors.push(`invalid_sourceUrl_format:${entry.sourceUrl}`);
  }

  // 6. ISO date 欄位
  if ("collectedAt" in entry && !isIsoDateOrNull(entry.collectedAt)) {
    errors.push("invalid_collectedAt_must_be_iso_date_or_null");
  }
  if ("lastCheckedAt" in entry && !isIsoDateOrNull(entry.lastCheckedAt)) {
    errors.push("invalid_lastCheckedAt_must_be_iso_date_or_null");
  }

  // 7. official_sample / past_paper / official_learning_material 必填強化
  if (
    "sourceKind" in entry &&
    SOURCE_KINDS_REQUIRING_OFFICIAL_FIELDS.has(entry.sourceKind)
  ) {
    if (!isValidUrl(entry.sourceUrl)) {
      errors.push(
        `official_or_past_paper_requires_valid_sourceUrl:${entry.sourceKind}`,
      );
    }
    if (!isNonEmptyString(entry.publisher)) {
      errors.push(
        `official_or_past_paper_requires_publisher:${entry.sourceKind}`,
      );
    }
    if (!isNonEmptyString(entry.provenanceNotes)) {
      errors.push(
        `official_or_past_paper_requires_provenanceNotes:${entry.sourceKind}`,
      );
    }
  }

  // 8. official_sample / past_paper 的 publisherType 必須是 official 或 school
  if (
    "sourceKind" in entry &&
    SOURCE_KINDS_REQUIRING_OFFICIAL_PUBLISHER_TYPE.has(entry.sourceKind) &&
    "publisherType" in entry &&
    !["official", "school"].includes(entry.publisherType)
  ) {
    errors.push(
      `official_or_past_paper_publisherType_must_be_official_or_school:got_${entry.publisherType}`,
    );
  }

  // 9. approved_for_import 要求 rightsNotes 與 sourceKind != unknown
  if (
    "reviewStatus" in entry &&
    entry.reviewStatus === "approved_for_import"
  ) {
    if (!isNonEmptyString(entry.rightsNotes)) {
      errors.push("approved_for_import_requires_rightsNotes");
    }
    if (entry.sourceKind === "unknown") {
      errors.push("unknown_sourceKind_cannot_be_approved_for_import");
    }
    if (entry.publisherType === "unknown") {
      errors.push("unknown_publisherType_cannot_be_approved_for_import");
    }
  }

  return {
    entryIndex: index,
    sourceId: typeof entry.sourceId === "string" ? entry.sourceId : null,
    status: errors.length === 0 ? "passed" : "failed",
    errors,
  };
}

// ===========================================================================
// 3.5 Batch-level 驗證（v0.1.1，P3-10-L 修補）
// ===========================================================================

/**
 * 找出同一個 input array 內出現多次的 sourceId（僅針對 non-empty string）。
 *
 * 回傳 Map<sourceId, number[] of entryIndices>，只包含出現 ≥ 2 次的 sourceId。
 * 空字串 / 非字串 sourceId 不視為 duplicate（會在 per-entry 驗證 #1 / #2 中被擋）。
 */
function findDuplicateSourceIds(results) {
  const seen = new Map();
  for (const r of results) {
    if (typeof r.sourceId !== "string" || r.sourceId.trim().length === 0) {
      continue;
    }
    const list = seen.get(r.sourceId) ?? [];
    list.push(r.entryIndex);
    seen.set(r.sourceId, list);
  }
  const duplicates = new Map();
  for (const [id, indices] of seen) {
    if (indices.length >= 2) {
      duplicates.set(id, indices);
    }
  }
  return duplicates;
}

/**
 * 把 duplicate sourceId 錯誤 append 到對應 entries 的 errors 陣列；
 * 並把 status 升為 failed（即使原本 passed）。
 *
 * 直接 mutate `results` array（呼叫端可依新 status 重新統計）。
 */
function applyDuplicateSourceIdErrors(results, duplicates) {
  if (duplicates.size === 0) return;
  for (const [sourceId, indices] of duplicates) {
    const indicesStr = indices.join(",");
    for (const idx of indices) {
      const r = results[idx];
      if (!r) continue;
      r.errors.push(`duplicate_sourceId:${sourceId}`);
      r.errors.push(`duplicate_sourceId_at_entries:${indicesStr}`);
      r.status = "failed";
    }
  }
}

// ===========================================================================
// 4. 主流程
// ===========================================================================

async function main(argv) {
  const parsed = parseCliArgs(argv);
  if (!parsed.ok) {
    process.stderr.write(`[validate_source_registry] ${parsed.error}\n`);
    process.stderr.write(HELP_TEXT);
    process.exit(2);
  }
  if (parsed.args.help) {
    process.stdout.write(HELP_TEXT);
    return;
  }

  const inputPath = parsed.args.input
    ? resolve(process.cwd(), parsed.args.input)
    : DEFAULT_INPUT;

  let raw;
  try {
    raw = await readFile(inputPath, "utf8");
  } catch (err) {
    process.stderr.write(
      `[validate_source_registry] 讀檔失敗：${inputPath}\n  ${err.message}\n`,
    );
    process.exit(2);
  }

  let parsedJson;
  try {
    parsedJson = JSON.parse(raw);
  } catch (err) {
    process.stderr.write(
      `[validate_source_registry] JSON parse 失敗：${inputPath}\n  ${err.message}\n`,
    );
    process.exit(2);
  }

  if (!Array.isArray(parsedJson)) {
    process.stderr.write(
      `[validate_source_registry] 預期最外層為陣列、實際是 ${typeof parsedJson}\n`,
    );
    process.exit(2);
  }

  const results = parsedJson.map((entry, index) => validateEntry(entry, index));

  // Batch-level：duplicate sourceId 偵測（v0.1.1）
  const duplicateSourceIds = findDuplicateSourceIds(results);
  applyDuplicateSourceIdErrors(results, duplicateSourceIds);

  const passed = results.filter((r) => r.status === "passed").length;
  const failed = results.length - passed;

  // 每筆輸出
  process.stdout.write(`${VALIDATOR_VERSION}\n`);
  process.stdout.write(`input: ${inputPath}\n`);
  process.stdout.write(`total entries: ${results.length}\n\n`);

  for (const r of results) {
    const label = r.sourceId ?? `(no sourceId, index ${r.entryIndex})`;
    if (r.status === "passed") {
      process.stdout.write(`  [PASS] ${label}\n`);
    } else {
      process.stdout.write(`  [FAIL] ${label}\n`);
      for (const e of r.errors) {
        process.stdout.write(`         - ${e}\n`);
      }
    }
  }

  process.stdout.write(
    `\nSummary: total=${results.length}  passed=${passed}  failed=${failed}  duplicateSourceIds=${duplicateSourceIds.size}\n`,
  );

  if (failed > 0) {
    process.exit(1);
  }
}

// ===========================================================================
// 5. Entry-script gate
// ===========================================================================

const isDirectCli =
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectCli) {
  main(process.argv.slice(2)).catch((err) => {
    process.stderr.write(`[validate_source_registry] unexpected error\n  ${err?.stack ?? err}\n`);
    process.exit(1);
  });
}

export {
  VALIDATOR_VERSION,
  validateEntry,
  findDuplicateSourceIds,
  applyDuplicateSourceIdErrors,
  parseCliArgs,
  ALLOWED_SOURCE_KIND,
  ALLOWED_PUBLISHER_TYPE,
  ALLOWED_COLLECTION_STATUS,
  ALLOWED_REVIEW_STATUS,
  ALLOWED_FILE_TYPE,
  ALLOWED_ACCESS_TYPE,
  ALLOWED_PARTS,
  REQUIRED_FIELDS,
};
