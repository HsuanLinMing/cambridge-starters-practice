#!/usr/bin/env node
/**
 * scripts/normalize_collected_sources.mjs
 *
 * P3-10-E：AI normalizer 原型（v0.1，rule-based / mock-ai 模式）。
 *
 * 對應 docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md / docs/DISCOVERY_CRAWLER_PLAN.md。
 *
 * 用途：
 *   - 讀 `data/imported/source-documents.batch.generated.json`（P3-10-D-3 pipe output）
 *   - 對每個 `status=collected` + `document.kind=source_document` 的條目：
 *       * 若有 extractedCandidates  → 每個 candidate 轉成一筆「normalized question draft」（保守 rule-based）
 *       * 若無 extractedCandidates  → 寫一筆 status=observation 條目，**不硬造題**
 *   - 其他 kind（resource_index / asset_metadata）→ 跳過並記 skipped_* 原因
 *   - 輸出 `data/imported/normalized-questions.generated.json`（batch 結構，已 gitignore）
 *
 * 硬邊界（對齊 P3-10-E 任務單）：
 *   - ❌ 不呼叫 OpenAI / 不需 OPENAI_API_KEY（本輪 openai mode exit 2）
 *   - ❌ 不下載 PDF / image / audio
 *   - ❌ 不解析 PDF
 *   - ❌ 不寫正式題庫（不動 data/p3-example-questions.json / data/exam-papers.example.json）
 *   - ❌ 不從 third-party PDF / asset_metadata 產題
 *   - ❌ 不自動把 draft 升為 approved_for_practice
 *   - ✅ 所有 draft 一律標：
 *        reviewStatus = "needs_human_review"
 *        isReadyForPractice = false
 *        sourceStatus = "draft_from_collected_source"
 *
 * 使用方式：
 *   help：
 *     node scripts/normalize_collected_sources.mjs --help
 *
 *   rule-based：
 *     node scripts/normalize_collected_sources.mjs \
 *       --input data/imported/source-documents.batch.generated.json \
 *       --out data/imported/normalized-questions.generated.json \
 *       --mode rule-based --limit 5
 *
 *   dry-run（不寫輸出之外的副作用；本 CLI 沒有副作用 fetch / network，所以 dry-run 主要差別在 status 標籤）：
 *     node scripts/normalize_collected_sources.mjs ... --dry-run yes
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤
 *   2  CLI 參數錯 / input 不存在 / JSON parse 失敗 / mode=openai（本輪未實作）
 */

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  loadSourceRegistry,
  buildApprovedUrlSet,
  classifyUrlAgainstRegistry,
} from "./source_registry_gate.mjs";

// ===========================================================================
// 0. 常數
// ===========================================================================

const NORMALIZER_VERSION = "normalize_collected_sources.mjs@v0.2";
const SUPPORTED_MODES = new Set(["rule-based", "mock-ai"]);
const FUTURE_MODES = new Set(["openai"]);
const DEFAULT_LIMIT = 5;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_INPUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "source-documents.batch.generated.json",
);
const DEFAULT_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "normalized-questions.generated.json",
);

const HELP_TEXT = `\nnormalize_collected_sources.mjs — P3-10-E / P3-10-N AI normalizer prototype v0.2\n
Usage:
  node scripts/normalize_collected_sources.mjs \\
    --input <source-documents.batch.generated.json> \\
    --out <normalized-questions.generated.json> \\
    [--source-registry <source-registry.generated.json>] \\
    [--mode rule-based|mock-ai] \\
    [--limit ${DEFAULT_LIMIT}] \\
    [--dry-run yes|no]

Options:
  --input <path>            選填；P3-10-D-3 pipe output（預設 data/imported/source-documents.batch.generated.json）
  --out <path>              選填；normalized-questions.generated.json 寫檔路徑（覆寫式；預設 data/imported/normalized-questions.generated.json）
  --source-registry <path>  選填；source registry JSON（P3-10-N，2026-05-15）
                            提供時啟用 source-first gate：只有 reviewStatus="approved_for_import"
                            的 source_document.url 才會被 normalize；其他狀態的 source 一律 skip
                            （不產 draft、不產 observation；詳見 docs/SOURCE_REGISTRY_PLAN.md D-1）
  --mode <mode>             選填；rule-based（預設，保守規則）/ mock-ai（rule-based fallback + 標 mock_ai_response warning）
  --limit <n>               選填；最多處理 N 筆 eligible source_document（預設 ${DEFAULT_LIMIT}）；防呆
  --dry-run <yes|no>        選填；預設 no；yes 時仍寫 output 但每筆 status 標 dry_run（不影響 pipeline 中段）
  --help                    印此使用說明

Modes：
  rule-based   保守 rule-based：把 extractedCandidates 直接轉 draft；無 candidates 出 observation
  mock-ai      同 rule-based 邏輯，但每筆 draft 加 mock_ai_response warning，模擬「AI 跑過但實際走 rule-based fallback」
  openai       **本輪未實作**；任何 --mode openai 呼叫將 exit 2（屬 P3-10-E 後續刀數，需 OPENAI_API_KEY）

Filter（任務單規範）：
  - 只處理 item.status="collected" + document.kind="source_document"
  - 其他狀態：跳過 + 標 skipped reason：
      * skipped_not_collected                       item.status != "collected"
      * skipped_asset_metadata                      document.kind = "asset_metadata"
      * skipped_resource_index                      document.kind = "resource_index"
      * skipped_not_source_document                 document.kind 為其他值
      * skipped_no_cleaned_text                     source_document 但 cleanedText 為空（無法 draft）
      * skipped_not_in_source_registry              (P3-10-N) URL 不在 source registry
      * skipped_source_not_approved_for_import      (P3-10-N) reviewStatus ≠ approved_for_import
      * skipped_invalid_url_for_gate                (P3-10-N) URL 無法解析為合法 URL
  - 不從 PDF / asset / resource_index 產題；不硬造題；不寫正式題庫
  - P3-10-N：若提供 --source-registry，gate 套用於 source_document.url；不在 approved
    set 的 source 一律不產 draft / observation，僅輸出 skipped item

Output schema（batch 結構，已 .gitignore）：
  {
    batchId, createdAt, source, input, mode, dryRun,
    summary: { totalInput, eligible, drafts, observations, skipped, failed },
    items: [
      {
        sourceItemId, sourceUrl, sourceType, resourceType, level,
        sourceQueryId, sourceQuery, sourceScore, sourceReasons,
        reviewStatus: "needs_human_review",     // 一律
        sourceStatus: "draft_from_collected_source",
        isReadyForPractice: false,              // 一律
        status: "draft | observation | skipped | failed",
        warnings: [...],
        draft: null | { questionType, starterPart, prompt, answer, options, confidence, normalizationNotes }
      }
    ]
  }

Hard constraints：
  - 不呼叫 OpenAI / 不需要 OPENAI_API_KEY
  - 不下載 PDF / image / audio；不解析 PDF
  - 不寫 data/p3-example-questions.json / data/exam-papers.example.json
  - draft 一律 reviewStatus=needs_human_review / isReadyForPractice=false
  - third-party PDF / asset 不會被轉題（pipe 已 skip 這些到 asset_metadata；normalizer 再次防護：skipped_asset_metadata）

Example:
  node scripts/normalize_collected_sources.mjs \\
    --input data/imported/source-documents.batch.generated.json \\
    --out data/imported/normalized-questions.generated.json \\
    --mode rule-based --limit 5
`;

// ===========================================================================
// 1. CLI arg parsing
// ===========================================================================

function parseYesNo(value, flag) {
  if (value === "yes" || value === "no") return value === "yes";
  throw new Error(`${flag} 必須是 yes 或 no（got: ${value}）`);
}

function parseArgs(argv) {
  const out = {
    input: null,
    out: null,
    sourceRegistry: null,
    mode: "rule-based",
    limit: null,
    dryRun: false,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--input") {
      out.input = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else if (arg === "--source-registry") {
      out.sourceRegistry = argv[++i];
    } else if (arg === "--mode") {
      out.mode = argv[++i];
    } else if (arg === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--limit 必須是正整數（got: ${argv[i]}）`);
      }
      out.limit = n;
    } else if (arg === "--dry-run") {
      out.dryRun = parseYesNo(argv[++i], "--dry-run");
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function validateArgs(args) {
  if (args.help) return;
  if (FUTURE_MODES.has(args.mode)) {
    throw new Error(
      `--mode "${args.mode}" 本輪未實作。P3-10-E 第一版只支援 rule-based / mock-ai（不呼叫 OpenAI）。` +
        " 若需 openai mode，需先在獨立刀數實作（含 OPENAI_API_KEY 讀取、prompt 設計、token / 成本管控）。",
    );
  }
  if (!SUPPORTED_MODES.has(args.mode)) {
    const supported = [...SUPPORTED_MODES].join(" / ");
    throw new Error(
      `--mode "${args.mode}" 未支援。本輪支援 ${supported}；future mode：openai。`,
    );
  }
}

// ===========================================================================
// 2. helpers
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

async function writeJson(path, payload) {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, JSON.stringify(payload, null, 2) + "\n", "utf8");
}

function makeBatchId() {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `normbatch-${ts}`;
}

// ===========================================================================
// 3. 共用：把 batch item 摘要成 output 條目的「source provenance」
// ===========================================================================

function makeBaseOutputItem(batchItem) {
  return {
    sourceItemId: batchItem?.discoveredResourceId ?? null,
    sourceUrl: batchItem?.url ?? null,
    sourceType: batchItem?.sourceType ?? "unknown",
    resourceType: batchItem?.resourceType ?? "unknown",
    level: batchItem?.level ?? "unknown",
    sourceQueryId: batchItem?.sourceQueryId ?? null,
    sourceQuery: batchItem?.sourceQuery ?? null,
    sourceScore: typeof batchItem?.score === "number" ? batchItem.score : null,
    sourceReasons: Array.isArray(batchItem?.reasons) ? [...batchItem.reasons] : [],
    detectedExamParts: Array.isArray(batchItem?.detectedExamParts)
      ? [...batchItem.detectedExamParts]
      : [],
    discoveryProvenance: batchItem?.discoveryProvenance ?? null,
    reviewStatus: "needs_human_review",
    sourceStatus: "draft_from_collected_source",
    isReadyForPractice: false,
    status: null,
    warnings: [],
    draft: null,
  };
}

// ===========================================================================
// 4. Rule-based draft：把 collector extractedCandidate 轉 draft
// ===========================================================================

const ALLOWED_QUESTION_TYPES = new Set([
  "multiple-choice",
  "picture-choice",
  "word-choice",
  "listening-choice",
  "fill-blank",
  "matching",
  "true-false",
  "spelling",
]);

const ALLOWED_STARTER_PARTS = new Set([
  "L1",
  "L2",
  "L3",
  "L4",
  "RW1",
  "RW2",
  "RW3",
  "RW4",
  "RW5",
]);

function normalizeCandidateToDraft(candidate, idx) {
  const text = (candidate?.text ?? "").trim();
  const likelyType = candidate?.likelyQuestionType ?? null;
  const likelyPart = candidate?.likelyStarterPart ?? null;
  const candidateConfidence =
    typeof candidate?.confidence === "number" ? candidate.confidence : 0;
  const notes = [];

  let questionType = "unknown";
  if (likelyType && ALLOWED_QUESTION_TYPES.has(likelyType)) {
    questionType = likelyType;
  } else if (likelyType) {
    notes.push(`unknown_likelyQuestionType:${likelyType}`);
  }

  let starterPart = "unknown";
  if (likelyPart && ALLOWED_STARTER_PARTS.has(likelyPart)) {
    starterPart = likelyPart;
  } else if (likelyPart) {
    notes.push(`unknown_likelyStarterPart:${likelyPart}`);
  }

  notes.push(`candidate_index:${idx}`);
  notes.push(`candidate_type:${candidate?.candidateType ?? "unknown"}`);
  if (candidate?.notes) notes.push(`source_note:${candidate.notes}`);
  if (text.length < 8) notes.push("text_too_short_for_full_question");
  if (text.length > 400) notes.push("text_too_long_may_contain_multiple_questions");
  notes.push("rule_based_v0.1:no_answer_inferred");

  // **保守邊界**：rule-based 不去猜 answer / options，留空給人工
  return {
    questionType,
    starterPart,
    prompt: text,
    answer: null,
    options: [],
    confidence: Number.isFinite(candidateConfidence) ? candidateConfidence : 0,
    normalizationNotes: notes,
  };
}

// ===========================================================================
// 5. 處理單一 batch item
// ===========================================================================

function classifyAndDraft(batchItem, opts) {
  const results = [];

  // 5-1. 非 collected → skip
  if (batchItem?.status !== "collected") {
    const out = makeBaseOutputItem(batchItem);
    out.status = "skipped";
    out.warnings.push({
      code: "skipped_not_collected",
      message: `item.status=${batchItem?.status ?? "(missing)"}；非 collected 不進入 normalizer`,
    });
    results.push(out);
    return results;
  }

  const kind = batchItem?.document?.kind ?? null;

  if (kind === "asset_metadata") {
    const out = makeBaseOutputItem(batchItem);
    out.status = "skipped";
    out.warnings.push({
      code: "skipped_asset_metadata",
      message:
        "document.kind=asset_metadata（pdf / image / audio / video）；本輪 normalizer 不從 asset 產題，避免 third-party 內容污染正式題庫。後續需 asset-aware 下載 + PDF parser + 人工審核才能進入 normalize。",
    });
    results.push(out);
    return results;
  }

  if (kind === "resource_index") {
    const out = makeBaseOutputItem(batchItem);
    out.status = "skipped";
    out.warnings.push({
      code: "skipped_resource_index",
      message:
        "document.kind=resource_index；只是 metadata 級別 entry、無 cleanedText / extractedCandidates，本輪不嘗試從 index 產題。後續可考慮 observation 模式。",
    });
    results.push(out);
    return results;
  }

  if (kind !== "source_document") {
    const out = makeBaseOutputItem(batchItem);
    out.status = "skipped";
    out.warnings.push({
      code: "skipped_not_source_document",
      message: `document.kind=${kind ?? "(missing)"}；非 source_document 不進入 normalizer`,
    });
    results.push(out);
    return results;
  }

  // 5-2. source_document：依 extractedCandidates 與 cleanedText 決策
  const doc = batchItem.document;
  const candidates = Array.isArray(doc.extractedCandidates)
    ? doc.extractedCandidates
    : [];
  const cleanedText = (doc.cleanedText ?? "").trim();

  if (!cleanedText) {
    const out = makeBaseOutputItem(batchItem);
    out.status = "skipped";
    out.warnings.push({
      code: "skipped_no_cleaned_text",
      message:
        "source_document.cleanedText 為空，無法做 rule-based normalize。可能來自 SPA / JS 渲染頁，建議改用 asset-aware 或 PDF parser，或人工標題目原文。",
    });
    results.push(out);
    return results;
  }

  if (candidates.length === 0) {
    // **保守邊界：不硬造題**
    const out = makeBaseOutputItem(batchItem);
    out.status = "observation";
    out.warnings.push({
      code: "no_question_candidates",
      message:
        "source_document.cleanedText 有內容但 extractedCandidates 為空。collector 的 regex 偵測沒抓到題目樣式；本輪保守邊界**不硬造題**——保留為 observation 條目，供人工檢視 cleanedText / headings / links 後再決定是否補手寫 candidate。",
    });
    if (doc.headings?.length) {
      out.warnings.push({
        code: "observation_heading_summary",
        message:
          `source_document 有 ${doc.headings.length} 個 headings，前 3 個：` +
          doc.headings
            .slice(0, 3)
            .map((h) => `[h${h.level}] ${h.text}`)
            .join(" / "),
      });
    }
    results.push(out);
    return results;
  }

  // 5-3. 把每個 candidate 轉 draft（一筆 batch item → N 筆 output items）
  const sampleNotes = opts.mode === "mock-ai" ? ["mode:mock-ai"] : ["mode:rule-based"];
  for (let i = 0; i < candidates.length; i++) {
    const out = makeBaseOutputItem(batchItem);
    out.status = opts.dryRun ? "dry_run" : "draft";
    const draft = normalizeCandidateToDraft(candidates[i], i);
    // 附加 mode 標記到 normalizationNotes 開頭
    draft.normalizationNotes = [...sampleNotes, ...draft.normalizationNotes];
    out.draft = draft;
    if (opts.dryRun) {
      out.warnings.push({
        code: "dry_run",
        message: `dry-run：draft 已產，但 status 標為 dry_run；reviewer 可比對欄位完整性後再實跑`,
      });
    }
    if (opts.mode === "mock-ai") {
      out.warnings.push({
        code: "mock_ai_response",
        message:
          "mode=mock-ai：本筆 draft 實際走 rule-based fallback（本輪不呼叫 OpenAI）；保留欄位結構供未來 openai mode 比對。",
      });
    }
    if (draft.questionType === "unknown" && draft.starterPart === "unknown") {
      out.warnings.push({
        code: "low_confidence_unknown_type_part",
        message:
          "draft 無法推斷 questionType 與 starterPart；需人工核對 candidate.text 內容。",
      });
    }
    // 補一筆通用警示：rule-based 不會猜 answer / options
    out.warnings.push({
      code: "rule_based_no_answer_inferred",
      message:
        "rule-based v0.1 保守邊界：draft.answer=null、options=[]；reviewer 必須手動補 answer / options 才能進入下一階段 (P3-10-F)。",
    });
    results.push(out);
  }
  return results;
}

// ===========================================================================
// 6. main
// ===========================================================================

async function main() {
  let args;
  try {
    args = parseArgs(process.argv.slice(2));
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(HELP_TEXT);
    process.exit(2);
  }
  if (args.help) {
    console.log(HELP_TEXT);
    process.exit(0);
  }
  try {
    validateArgs(args);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }

  const inputPath = args.input ? resolve(args.input) : DEFAULT_INPUT;
  const outPath = args.out ? resolve(args.out) : DEFAULT_OUT;
  const sourceRegistryPath = args.sourceRegistry ? resolve(args.sourceRegistry) : null;
  const limit = args.limit ?? DEFAULT_LIMIT;

  console.error(
    `[normalizer] input=${inputPath} out=${outPath} mode=${args.mode} limit=${limit} ` +
      `source-registry=${sourceRegistryPath ?? "(none — source-first gate disabled)"} ` +
      `dry-run=${args.dryRun ? "yes" : "no"}`,
  );

  let inputData;
  try {
    inputData = await readJsonFile(inputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(
      "提示：請先跑 P3-10-D-3 pipe 產出 source-documents.batch.generated.json，或用 fixture 測試。",
    );
    process.exit(2);
  }

  if (!Array.isArray(inputData?.items)) {
    console.error(
      `Error: input JSON 必須含 items[] array（P3-10-D-3 pipe batch 格式）：${inputPath}`,
    );
    process.exit(2);
  }

  // P3-10-N：載入 source registry（若有 --source-registry）
  let sourceRegistry = null;
  let approvedUrls = null;
  let duplicateSourceIds = [];
  if (sourceRegistryPath) {
    try {
      sourceRegistry = await loadSourceRegistry(sourceRegistryPath, { readJsonFile });
    } catch (err) {
      console.error(`Error: ${err.message}`);
      console.error(
        "提示：source registry JSON 必須是最外層陣列，且每筆條目應符合 scripts/validate_source_registry.mjs 的 schema。",
      );
      process.exit(2);
    }
    const built = buildApprovedUrlSet(sourceRegistry);
    approvedUrls = built.approvedUrls;
    duplicateSourceIds = built.duplicateIds;
    if (duplicateSourceIds.length > 0) {
      console.error(
        `[normalizer] warning: source registry contains duplicate sourceId(s): ${duplicateSourceIds.join(", ")}（gate 仍可運作；建議跑 scripts/validate_source_registry.mjs 修正後重試）`,
      );
    }
    console.error(
      `[normalizer] source-first gate enabled: registry=${sourceRegistry.length} entries, approvedSources=${approvedUrls.size}`,
    );
  } else {
    console.error(
      "[normalizer] warning: --source-registry 未指定，source-first gate 未啟用；本次 run 屬 dev / legacy flow，正式匯入版**應該**始終提供 --source-registry。",
    );
  }

  const inputItems = inputData.items;
  const totalInput = inputItems.length;

  // 6-1. 找出 eligible（status=collected + document.kind=source_document）
  // P3-10-N：若有 source registry，再過一層 gate；不在 approved set 的 source_document
  //         不進 eligible（單筆 skipped + 對應 reason code）
  const eligibleIndices = [];
  const ineligibleItems = [];
  const gateSkippedItems = [];
  let skippedNotInSourceRegistry = 0;
  let skippedSourceNotApprovedForImport = 0;
  let skippedInvalidUrlForGate = 0;
  for (let i = 0; i < inputItems.length; i++) {
    const it = inputItems[i];
    const isCollected = it?.status === "collected";
    const isSourceDoc = it?.document?.kind === "source_document";
    if (!(isCollected && isSourceDoc)) {
      ineligibleItems.push({ index: i, item: it });
      continue;
    }
    // P3-10-N gate
    if (approvedUrls) {
      const rawUrl = typeof it?.url === "string" ? it.url : it?.document?.url;
      const classification = classifyUrlAgainstRegistry(
        rawUrl,
        sourceRegistry,
        approvedUrls,
      );
      if (!classification.matched) {
        if (classification.reason === "skipped_not_in_source_registry") {
          skippedNotInSourceRegistry += 1;
        } else if (
          classification.reason === "skipped_source_not_approved_for_import"
        ) {
          skippedSourceNotApprovedForImport += 1;
        } else {
          skippedInvalidUrlForGate += 1;
        }
        gateSkippedItems.push({ index: i, item: it, classification });
        continue;
      }
    }
    eligibleIndices.push(i);
  }
  const eligibleCount = eligibleIndices.length;

  // 6-2. 對 eligible 取前 limit 筆；其餘標 skip_due_to_limit
  const toProcessIndices = eligibleIndices.slice(0, limit);
  const overLimitIndices = eligibleIndices.slice(limit);

  // 6-3. 跑 ineligible（一筆對一筆 skipped）
  const items = [];
  for (const { item } of ineligibleItems) {
    const outs = classifyAndDraft(item, { mode: args.mode, dryRun: args.dryRun });
    items.push(...outs);
  }
  // 6-3b. P3-10-N：gate 拒絕的 source_document — 不產 draft / observation，僅輸出 skipped item
  for (const { item, classification } of gateSkippedItems) {
    const out = makeBaseOutputItem(item);
    out.status = "skipped";
    let message;
    if (classification.reason === "skipped_not_in_source_registry") {
      message =
        `source_document.url 不在 source registry 中；P3-10-N gate 拒絕。` +
        `normalizedUrl=${classification.normalizedUrl}`;
    } else if (classification.reason === "skipped_source_not_approved_for_import") {
      message =
        `source registry sourceId=${classification.sourceId ?? "?"} ` +
        `reviewStatus="${classification.status}" ≠ "approved_for_import"；P3-10-N gate 拒絕`;
    } else {
      message =
        `source_document.url 不可解析為合法 URL；P3-10-N gate 拒絕`;
    }
    out.warnings.push({ code: classification.reason, message });
    items.push(out);
  }
  // 6-4. 跑 over-limit（標 skip_due_to_limit）
  for (const i of overLimitIndices) {
    const out = makeBaseOutputItem(inputItems[i]);
    out.status = "skipped";
    out.warnings.push({
      code: "skip_due_to_limit",
      message: `--limit=${limit} 限制：本 batch 只處理前 ${limit} 筆 eligible source_document（本筆位於 eligible 第 ${eligibleIndices.indexOf(i) + 1} 筆）`,
    });
    items.push(out);
  }
  // 6-5. 跑 eligible
  for (let k = 0; k < toProcessIndices.length; k++) {
    const idx = toProcessIndices[k];
    const it = inputItems[idx];
    console.error(
      `[normalizer] [${k + 1}/${toProcessIndices.length}] sourceItemId=${it?.discoveredResourceId} url=${it?.url}`,
    );
    const outs = classifyAndDraft(it, { mode: args.mode, dryRun: args.dryRun });
    items.push(...outs);
  }

  // 6-6. summary
  const drafts = items.filter((x) => x.status === "draft").length;
  const observations = items.filter((x) => x.status === "observation").length;
  const skipped = items.filter((x) => x.status === "skipped").length;
  const failed = items.filter((x) => x.status === "failed").length;
  const dryRunCount = items.filter((x) => x.status === "dry_run").length;

  const sourceRegistrySummary = sourceRegistryPath
    ? {
        sourceRegistryInput: sourceRegistryPath,
        sourceRegistryEntries: sourceRegistry.length,
        approvedSources: approvedUrls.size,
        duplicateSourceIdsInRegistry: duplicateSourceIds,
        skippedNotInSourceRegistry,
        skippedSourceNotApprovedForImport,
        skippedInvalidUrlForGate,
      }
    : {
        sourceRegistryInput: null,
        gateEnabled: false,
        note: "source-first gate disabled; legacy / dev flow only",
      };
  const payload = {
    batchId: makeBatchId(),
    createdAt: new Date().toISOString(),
    source: NORMALIZER_VERSION,
    input: inputPath,
    mode: args.mode,
    dryRun: args.dryRun,
    summary: {
      totalInput,
      eligible: eligibleCount,
      drafts,
      observations,
      dryRun: dryRunCount,
      skipped,
      failed,
      sourceRegistry: sourceRegistrySummary,
    },
    items,
  };

  await writeJson(outPath, payload);
  console.error(
    `[normalizer] wrote batch to ${outPath} — totalInput=${totalInput} eligible=${eligibleCount} ` +
      `drafts=${drafts} observations=${observations} dryRun=${dryRunCount} skipped=${skipped} failed=${failed}` +
      (sourceRegistryPath
        ? ` | gate: approvedSources=${approvedUrls.size} ` +
          `skippedNotInRegistry=${skippedNotInSourceRegistry} ` +
          `skippedNotApproved=${skippedSourceNotApprovedForImport}` +
          (skippedInvalidUrlForGate > 0 ? ` skippedInvalidUrl=${skippedInvalidUrlForGate}` : "")
        : " | gate: disabled"),
  );
}

const isCliInvocation =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCliInvocation) {
  main().catch((err) => {
    console.error(`[normalizer] unexpected error: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
