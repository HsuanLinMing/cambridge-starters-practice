#!/usr/bin/env node
/**
 * scripts/review_normalized_questions.mjs
 *
 * P3-10-F：匯入題目人工審核流程 CLI（v0.2，2026-05-13 P3-10-F 後續：reviewed output 覆寫保護 / merge-with）。
 *
 * 對應 docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md / docs/PRACTICE_DATA_IMPORT_PLAN.md。
 *
 * 版本歷史：
 *   v0.1（P3-10-F）：prepare-review + validate-reviewed 兩 mode；reviewer 工作介面 / schema + 題型驗證。
 *   v0.2（P3-10-F 後續，本輪）：reviewed output 覆寫保護——
 *     - 預設拒絕無聲覆寫；新增 --overwrite yes|no 與 --merge-with <existing-reviewed-json> 兩個 flag。
 *     - --overwrite yes：明確覆寫既有 out 檔。
 *     - --merge-with <path>：讀 existing reviewed batch，依 mergeKey 保留 reviewer 已填的 reviewerFields。
 *     - 不指定兩者且 out 已存在 → exit 2 + warning code output_exists_requires_overwrite_or_merge。
 *     - 新增 batchWarnings 區塊與 summary.merged / orphaned / overwritten 三個欄位。
 *     - orphaned existing item（新 input 中找不到對應）保留並標 status=orphaned_existing_review。
 *
 * 用途：
 *   - mode=prepare-review：讀 P3-10-E normalizer output → 篩出 draft items
 *     → 為每筆預填 reviewerFields template → 寫 reviewed-questions.generated.json
 *   - mode=validate-reviewed：讀 reviewed-questions.generated.json（人工編輯後）
 *     → 對 approvedForPractice=true 的條目跑 schema + 題型 validation
 *     → 印 console summary + 寫 review-validation.generated.json（不修改 reviewed file）
 *
 * 硬邊界（對齊 P3-10-F 任務單）：
 *   - ❌ 不呼叫 OpenAI（與 P3-10-E 一致）
 *   - ❌ 不下載 PDF / image / audio
 *   - ❌ 不解析 PDF
 *   - ❌ 不修改 data/p3-example-questions.json / data/exam-papers.example.json
 *   - ❌ 不讓 /quiz 使用匯入題（本 CLI 不動正式題庫 / 不動 lib/data.ts）
 *   - ❌ 不自動 approve（prepare-review 預設 approved=false / approvedForPractice=false）
 *   - ✅ validate-reviewed 只「驗證」：不寫正式題庫、不修改 reviewed file
 *   - ✅ 只接受 approvedForPractice=true 且 reviewStatus=approved_for_practice 的條目作為「approval claim」
 *
 * 使用方式：
 *   help：
 *     node scripts/review_normalized_questions.mjs --help
 *
 *   prepare-review：
 *     node scripts/review_normalized_questions.mjs \
 *       --input data/imported/normalized-questions.generated.json \
 *       --out data/imported/reviewed-questions.generated.json \
 *       --mode prepare-review --limit 10
 *
 *   dry-run（仍寫 output 但每筆標 dryRun=true）：
 *     node scripts/review_normalized_questions.mjs ... --dry-run yes
 *
 *   validate-reviewed：
 *     node scripts/review_normalized_questions.mjs \
 *       --input data/imported/reviewed-questions.generated.json \
 *       --mode validate-reviewed
 *
 * exit code：
 *   0  成功（含 validate-reviewed 找出 failed 條目；validation 結果以 JSON / console 報告，不影響 exit code）
 *   1  未預期錯誤
 *   2  CLI 參數錯 / input 不存在 / JSON parse 失敗 / 未支援 mode
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const REVIEW_VERSION = "review_normalized_questions.mjs@v0.2";
const SUPPORTED_MODES = new Set(["prepare-review", "validate-reviewed"]);
const DEFAULT_LIMIT = 10;

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
// 注意：本 CLI **要求**使用者明示 --input（兩 mode 對應不同上游檔），不提供 input 預設
//      避免 prepare-review / validate-reviewed 拿錯檔；故只保留 out 預設。
const DEFAULT_REVIEWED_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "reviewed-questions.generated.json",
);
const DEFAULT_VALIDATION_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "review-validation.generated.json",
);

// 對齊 docs/DATA_SCHEMA.md QuestionType discriminated union
const ALLOWED_QUESTION_TYPES = new Set([
  "multiple-choice",
  "picture-choice",
  "word-choice",
  "listening-choice",
  "listening-image-choice", // 任務單 spec 提到的 alias / future variant
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

const CHOICE_TYPES = new Set([
  "multiple-choice",
  "word-choice",
  "listening-choice",
  "listening-image-choice",
  "picture-choice",
]);

const HELP_TEXT = `\nreview_normalized_questions.mjs — P3-10-F review workflow CLI v0.2\n
Usage:
  prepare-review：把 normalizer 的 draft items 轉成 reviewer 工作介面（預填 reviewerFields template）
    node scripts/review_normalized_questions.mjs \\
      --input data/imported/normalized-questions.generated.json \\
      --out data/imported/reviewed-questions.generated.json \\
      --mode prepare-review --limit ${DEFAULT_LIMIT}

  prepare-review + 覆寫保護（v0.2 新增）：
    若 --out 既有檔存在，**預設拒絕無聲覆寫**；請於下列三種模式擇一：
    (a) --overwrite yes              明確允許覆寫
    (b) --merge-with <existing-path> 保留 existing reviewed file 內的 reviewer edits
    (c) （兩者皆不給）若 --out 不存在則正常建立；存在則 exit 2

  validate-reviewed：驗證人工編輯後 reviewed-questions.generated.json，**不寫正式題庫**
    node scripts/review_normalized_questions.mjs \\
      --input data/imported/reviewed-questions.generated.json \\
      --mode validate-reviewed

Options:
  --input <path>            必填；prepare-review → normalized batch / validate-reviewed → reviewed batch
  --out <path>              選填；
                            prepare-review 預設 data/imported/reviewed-questions.generated.json
                            validate-reviewed 預設 data/imported/review-validation.generated.json
  --mode <mode>             必填；prepare-review / validate-reviewed
  --limit <n>               選填；prepare-review 最多處理 N 筆 eligible draft（預設 ${DEFAULT_LIMIT}）
  --dry-run <yes|no>        選填；預設 no；prepare-review yes 時每筆 status 標 dry_run + queued
  --overwrite <yes|no>      **v0.2 新增**；預設 no；prepare-review 模式下，yes 時允許覆寫既有 out
                            （若 out 不存在則 flag 無作用）
  --merge-with <path>       **v0.2 新增**；prepare-review 模式下，讀 existing reviewed batch
                            並依 mergeKey 保留 reviewer 已填的 reviewerFields；orphaned 條目
                            （existing 有但新 input 無對應）會被保留並標 status=orphaned_existing_review
  --help                    印此使用說明

Merge key（--merge-with）：
  優先使用：sourceItemId + 從 originalDraft.normalizationNotes 取出的 candidate_index:<n>
  fallback：sourceItemId + originalDraft.prompt + originalDraft.questionType + originalDraft.starterPart

  Source provenance 更新策略：merged 條目以**最新 input** 的 source provenance 覆寫
  （sourceUrl / sourceType / resourceType / level / sourceScore / sourceReasons / discoveryProvenance
   都用新 input；只有 reviewerFields / reviewStatus 保留 existing）；理由是 reviewer 已驗的是「題目本身」，
  上游 metadata 可能因 discovery / pipe 重跑而更新、應以最新為準。

batchWarnings（top-level payload，與 items[] 並列；v0.2 新增）：
  - output_exists_requires_overwrite_or_merge   --out 已存在但未指定 --overwrite / --merge-with（exit 2 時印）
  - overwrite_enabled                            --overwrite yes 觸發並實際覆寫
  - merged_from_existing_review                  每筆 merge 命中的 item 內也會加；同時 batchWarnings 也記一筆
  - orphaned_existing_review                     existing 有但新 input 無對應（保留條目）

prepare-review filter（任務單規範）：
  只把同時滿足下列條件的條目放入 review queue：
    - status === "draft"
    - reviewStatus === "needs_human_review"
    - isReadyForPractice === false
    - draft !== null

  其餘標 skipped + 原因：
    skipped_status_not_draft       status !== "draft"（含 observation / skipped / dry_run / failed）
    skipped_review_status_not_needs_review  reviewStatus 已升級或非 needs_human_review
    skipped_already_ready          isReadyForPractice 已 true
    skipped_draft_null             draft === null（即使 status=draft 也視為損壞）

prepare-review 不自動 approve：
  - reviewerFields.approved = false
  - reviewerFields.approvedForPractice = false
  - reviewerFields.finalQuestion 預填 type / starterPart / prompt（從 draft 抓）；
    answer / options / explanation / imageSrc / audioSrc 一律留空，reviewer 手填

validate-reviewed 驗證規則（approvedForPractice=true 條目）：
  必填欄位：
    - finalQuestion.id            非空字串
    - finalQuestion.type          非空字串 + 對齊 QuestionType union
    - finalQuestion.starterPart   非空字串 + 對齊 L1-L4 / RW1-RW5
    - finalQuestion.prompt        非空字串
    - finalQuestion.answer        非空字串
    - reviewStatus                必須 "approved_for_practice"
    - approved                    必須 true
    - approvedForPractice         必須 true
  題型特殊：
    spelling                      answer 非空字串；options 可為空
    true-false                    answer 必須 "yes" 或 "no"（忽略大小寫）
    multiple-choice / word-choice / listening-image-choice / listening-choice / picture-choice
                                  options 至少 2 個；answer 必須對應 options 之一（純字串 or 物件 { id / value }）

Hard constraints：
  - 不呼叫 OpenAI / 不需 OPENAI_API_KEY
  - 不下載 PDF / image / audio
  - 不修改 data/p3-example-questions.json / data/exam-papers.example.json
  - 不修改 reviewed-questions.generated.json（validate-reviewed 只讀）
  - 不讓 /quiz 使用 imported 題庫（本 CLI 不動 lib/data.ts）
  - 寫入 generated JSON 一律覆寫式（reviewed-questions / review-validation 皆已 gitignore）

Examples:
  node scripts/review_normalized_questions.mjs \\
    --input data/imported/normalized-questions.generated.json \\
    --out data/imported/reviewed-questions.generated.json \\
    --mode prepare-review --limit 10

  node scripts/review_normalized_questions.mjs \\
    --input data/imported/reviewed-questions.generated.json \\
    --mode validate-reviewed
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
    mode: null,
    limit: null,
    dryRun: false,
    overwrite: false,
    mergeWith: null,
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
    } else if (arg === "--overwrite") {
      out.overwrite = parseYesNo(argv[++i], "--overwrite");
    } else if (arg === "--merge-with") {
      out.mergeWith = argv[++i];
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function validateArgs(args) {
  if (args.help) return;
  if (!args.mode) {
    throw new Error("--mode is required（prepare-review / validate-reviewed）");
  }
  if (!SUPPORTED_MODES.has(args.mode)) {
    const supported = [...SUPPORTED_MODES].join(" / ");
    throw new Error(`--mode "${args.mode}" 未支援；本輪支援 ${supported}`);
  }
  if (!args.input) {
    throw new Error("--input is required");
  }
}

// ===========================================================================
// 2. JSON helpers
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

async function fileExists(path) {
  try {
    const s = await stat(path);
    return s.isFile();
  } catch {
    return false;
  }
}

function makeBatchId(prefix) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${ts}`;
}

// ---------------------------------------------------------------------------
// Merge key（v0.2 P3-10-F 後續）
// ---------------------------------------------------------------------------
// 給 normalizer item（input）與 reviewed item（existing）共用的穩定 key。
//   優先：sourceItemId + 從 (originalDraft||draft).normalizationNotes 取 candidate_index:<n>
//   fallback：sourceItemId + draft.prompt + draft.questionType + draft.starterPart

function getCandidateIndexFromNotes(notes) {
  if (!Array.isArray(notes)) return null;
  for (const n of notes) {
    if (typeof n !== "string") continue;
    const m = /^candidate_index:(\d+)$/.exec(n.trim());
    if (m) return Number(m[1]);
  }
  return null;
}

/**
 * 從 input item 取 mergeKey。
 * input 可能是 normalizer 條目（draft 在 item.draft）
 * 或 reviewed 條目（draft 在 item.originalDraft）
 */
function makeMergeKey(item) {
  const sid = item?.sourceItemId ?? "";
  const draft = item?.originalDraft ?? item?.draft ?? {};
  const candIdx = getCandidateIndexFromNotes(draft?.normalizationNotes);
  if (candIdx !== null) return `${sid}|cidx:${candIdx}`;
  // fallback：以 prompt + type + starterPart 補足穩定性
  const prompt = (draft?.prompt ?? "").trim();
  const type = draft?.questionType ?? "";
  const part = draft?.starterPart ?? "";
  return `${sid}|p:${prompt}|t:${type}|sp:${part}`;
}

// ===========================================================================
// 3. prepare-review：把 normalizer draft → reviewer 工作條目
// ===========================================================================

function buildReviewItem(normItem, opts) {
  // source provenance 透傳（對齊任務單規範）
  const base = {
    sourceItemId: normItem?.sourceItemId ?? null,
    sourceUrl: normItem?.sourceUrl ?? null,
    sourceType: normItem?.sourceType ?? "unknown",
    resourceType: normItem?.resourceType ?? "unknown",
    level: normItem?.level ?? "unknown",
    sourceQueryId: normItem?.sourceQueryId ?? null,
    sourceQuery: normItem?.sourceQuery ?? null,
    sourceScore: typeof normItem?.sourceScore === "number" ? normItem.sourceScore : null,
    sourceReasons: Array.isArray(normItem?.sourceReasons) ? [...normItem.sourceReasons] : [],
    detectedExamParts: Array.isArray(normItem?.detectedExamParts)
      ? [...normItem.detectedExamParts]
      : [],
    discoveryProvenance: normItem?.discoveryProvenance ?? null,
    originalDraft: normItem?.draft ?? null,
    // **預設 reviewStatus 仍維持「needs_human_review」**——reviewer 自己改成 approved_for_practice 才會被 validate-reviewed 接受
    reviewStatus: "needs_human_review",
    status: opts.dryRun ? "dry_run" : "queued",
    warnings: [],
    reviewerFields: {
      approved: false,
      approvedForPractice: false,
      reviewerNotes: "",
      finalQuestion: {
        id: "",
        // 預填 draft 的 questionType / starterPart / prompt，**不亂猜 answer / options**
        type: normItem?.draft?.questionType && ALLOWED_QUESTION_TYPES.has(normItem.draft.questionType)
          ? normItem.draft.questionType
          : "",
        starterPart: normItem?.draft?.starterPart && ALLOWED_STARTER_PARTS.has(normItem.draft.starterPart)
          ? normItem.draft.starterPart
          : "",
        prompt: normItem?.draft?.prompt ?? "",
        answer: "",
        options: [],
        explanation: "",
        imageSrc: "",
        audioSrc: "",
      },
    },
  };
  if (opts.dryRun) {
    base.warnings.push({
      code: "dry_run",
      message:
        "dry-run：review item 已預填 reviewerFields template，但 status 標為 dry_run；reviewer 可比對欄位結構後再實跑。",
    });
  }
  return base;
}

function buildSkippedReviewItem(normItem, code, message) {
  return {
    sourceItemId: normItem?.sourceItemId ?? null,
    sourceUrl: normItem?.sourceUrl ?? null,
    sourceType: normItem?.sourceType ?? "unknown",
    resourceType: normItem?.resourceType ?? "unknown",
    level: normItem?.level ?? "unknown",
    sourceQueryId: normItem?.sourceQueryId ?? null,
    sourceQuery: normItem?.sourceQuery ?? null,
    sourceScore: typeof normItem?.sourceScore === "number" ? normItem.sourceScore : null,
    sourceReasons: Array.isArray(normItem?.sourceReasons) ? [...normItem.sourceReasons] : [],
    detectedExamParts: Array.isArray(normItem?.detectedExamParts)
      ? [...normItem.detectedExamParts]
      : [],
    discoveryProvenance: normItem?.discoveryProvenance ?? null,
    originalDraft: normItem?.draft ?? null,
    reviewStatus: normItem?.reviewStatus ?? "needs_human_review",
    status: "skipped",
    warnings: [{ code, message }],
    reviewerFields: null,
  };
}

function classifyForReview(normItem) {
  if (normItem?.status !== "draft") {
    return {
      eligible: false,
      reasonCode: "skipped_status_not_draft",
      reasonMessage: `normalizer item.status="${normItem?.status ?? "(missing)"}" 不是 "draft"，跳過。`,
    };
  }
  if (normItem?.reviewStatus !== "needs_human_review") {
    return {
      eligible: false,
      reasonCode: "skipped_review_status_not_needs_review",
      reasonMessage: `reviewStatus="${normItem?.reviewStatus}" 不是 "needs_human_review"，跳過。`,
    };
  }
  if (normItem?.isReadyForPractice === true) {
    return {
      eligible: false,
      reasonCode: "skipped_already_ready",
      reasonMessage: "isReadyForPractice=true（不該在此階段出現；可能是上游污染），跳過。",
    };
  }
  if (!normItem?.draft) {
    return {
      eligible: false,
      reasonCode: "skipped_draft_null",
      reasonMessage: "draft=null（即使 status=draft 也視為損壞），跳過。",
    };
  }
  return { eligible: true };
}

async function runPrepareReview(args) {
  const inputPath = resolve(args.input);
  const outPath = args.out ? resolve(args.out) : DEFAULT_REVIEWED_OUT;
  const limit = args.limit ?? DEFAULT_LIMIT;
  const mergeWithPath = args.mergeWith ? resolve(args.mergeWith) : null;

  console.error(
    `[review] mode=prepare-review input=${inputPath} out=${outPath} limit=${limit} ` +
      `dry-run=${args.dryRun ? "yes" : "no"} overwrite=${args.overwrite ? "yes" : "no"} ` +
      `merge-with=${mergeWithPath ?? "-"}`,
  );

  // ---------- 1. 覆寫保護（v0.2 P3-10-F 後續） ----------
  const outExisted = await fileExists(outPath);
  if (outExisted && !args.overwrite && !mergeWithPath) {
    console.error(
      `Error: --out 目標檔已存在：${outPath}\n` +
        "為避免無聲覆寫 reviewer 已填內容，本 CLI v0.2 預設拒絕直接寫入。請擇一：\n" +
        "  (a) --overwrite yes              明確允許覆寫；reviewer 編輯會遺失\n" +
        "  (b) --merge-with <existing>      讀 existing reviewed batch、保留 reviewerFields\n" +
        "  (c) 改 --out 為其他路徑\n",
    );
    // 寫一個極簡 marker batch 不適當；本輪選擇純 exit 2，不寫任何檔案，避免污染。
    process.exit(2);
  }

  // ---------- 2. 讀 input ----------
  let inputData;
  try {
    inputData = await readJsonFile(inputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(
      "提示：請先跑 P3-10-E normalizer 產出 normalized-questions.generated.json，或用 fixture 測試。",
    );
    process.exit(2);
  }
  if (!Array.isArray(inputData?.items)) {
    console.error(`Error: input JSON 必須含 items[] array（P3-10-E normalizer batch 格式）：${inputPath}`);
    process.exit(2);
  }

  // ---------- 3. 讀 --merge-with（若有） ----------
  /** existingByKey: Map<mergeKey, reviewedItem> */
  const existingByKey = new Map();
  let mergeWithLoaded = false;
  if (mergeWithPath) {
    let existing;
    try {
      existing = await readJsonFile(mergeWithPath);
    } catch (err) {
      console.error(`Error: 讀 --merge-with 失敗：${err.message}`);
      process.exit(2);
    }
    if (!Array.isArray(existing?.items)) {
      console.error(`Error: --merge-with JSON 必須含 items[] array：${mergeWithPath}`);
      process.exit(2);
    }
    for (const ex of existing.items) {
      const key = makeMergeKey(ex);
      // 跳過已標 skipped / orphaned 的條目（避免把 skip 當 merge 來源）
      if (ex?.status === "skipped" || ex?.status === "orphaned_existing_review") continue;
      // 同 key 重複時保留第一筆（reviewer 不應該有重複 mergeKey，極端 case 採保守）
      if (!existingByKey.has(key)) existingByKey.set(key, ex);
    }
    mergeWithLoaded = true;
    console.error(`[review] --merge-with loaded ${existingByKey.size} existing reviewed items from ${mergeWithPath}`);
  }

  // ---------- 4. 分流 normalizer items：eligible vs skipped ----------
  const inputItems = inputData.items;
  const totalInput = inputItems.length;
  const outItems = [];
  const eligibleIndices = [];
  for (let i = 0; i < inputItems.length; i++) {
    const it = inputItems[i];
    const cls = classifyForReview(it);
    if (cls.eligible) {
      eligibleIndices.push(i);
    } else {
      outItems.push(buildSkippedReviewItem(it, cls.reasonCode, cls.reasonMessage));
    }
  }
  // limit 切割
  const toProcess = eligibleIndices.slice(0, limit);
  const overLimit = eligibleIndices.slice(limit);
  for (const i of overLimit) {
    outItems.push(
      buildSkippedReviewItem(
        inputItems[i],
        "skip_due_to_limit",
        `--limit=${limit} 限制：本 batch 只處理前 ${limit} 筆 eligible draft（本筆位於 eligible 第 ${eligibleIndices.indexOf(i) + 1} 筆）`,
      ),
    );
  }

  // ---------- 5. 跑 eligible：為每筆 build review item，並嘗試 merge ----------
  const matchedMergeKeys = new Set();
  let mergedCount = 0;
  for (const i of toProcess) {
    const normItem = inputItems[i];
    const mergeKey = makeMergeKey(normItem);
    const existing = existingByKey.get(mergeKey);
    if (existing && mergeWithLoaded) {
      // 命中既有 reviewer 條目：保留 reviewerFields / reviewStatus，source provenance 用最新
      const merged = buildReviewItem(normItem, { dryRun: args.dryRun });
      merged.reviewerFields = existing.reviewerFields ?? merged.reviewerFields;
      merged.reviewStatus = existing.reviewStatus ?? merged.reviewStatus;
      merged.warnings.push({
        code: "merged_from_existing_review",
        message:
          `本條目 mergeKey="${mergeKey}" 與 --merge-with 中既有 reviewer 條目命中；` +
          "保留 reviewerFields + reviewStatus（reviewer 已填內容不會遺失）；" +
          "source provenance（sourceUrl / sourceType / sourceScore / discoveryProvenance 等）以最新 input 為準。",
      });
      matchedMergeKeys.add(mergeKey);
      mergedCount += 1;
      outItems.push(merged);
    } else {
      outItems.push(buildReviewItem(normItem, { dryRun: args.dryRun }));
    }
  }

  // ---------- 6. orphaned：existing 中有但本次 input 找不到的條目 ----------
  let orphanedCount = 0;
  if (mergeWithLoaded) {
    for (const [key, ex] of existingByKey) {
      if (matchedMergeKeys.has(key)) continue;
      const orphan = {
        sourceItemId: ex?.sourceItemId ?? null,
        sourceUrl: ex?.sourceUrl ?? null,
        sourceType: ex?.sourceType ?? "unknown",
        resourceType: ex?.resourceType ?? "unknown",
        level: ex?.level ?? "unknown",
        sourceQueryId: ex?.sourceQueryId ?? null,
        sourceQuery: ex?.sourceQuery ?? null,
        sourceScore: typeof ex?.sourceScore === "number" ? ex.sourceScore : null,
        sourceReasons: Array.isArray(ex?.sourceReasons) ? [...ex.sourceReasons] : [],
        detectedExamParts: Array.isArray(ex?.detectedExamParts) ? [...ex.detectedExamParts] : [],
        discoveryProvenance: ex?.discoveryProvenance ?? null,
        originalDraft: ex?.originalDraft ?? null,
        reviewStatus: ex?.reviewStatus ?? "needs_human_review",
        status: "orphaned_existing_review",
        warnings: [
          {
            code: "orphaned_existing_review",
            message:
              `本條目在 --merge-with 中存在（mergeKey="${key}"）但於本次 input 中找不到對應；` +
              "為避免 reviewer 已填內容遺失而保留於 output。reviewer 可決定（a）忽略 / 維持 orphaned 狀態 " +
              "或（b）若仍想用，請手動 rebuild input 或改用 custom sourceType 重新匯入。",
          },
        ],
        reviewerFields: ex?.reviewerFields ?? null,
      };
      outItems.push(orphan);
      orphanedCount += 1;
    }
  }

  // ---------- 7. summary / batchWarnings / 寫檔 ----------
  const queued = outItems.filter((it) => it.status === "queued").length;
  const dryRunCount = outItems.filter((it) => it.status === "dry_run").length;
  const skipped = outItems.filter((it) => it.status === "skipped").length;
  const overwritten = outExisted && (args.overwrite || mergeWithLoaded);

  const batchWarnings = [];
  if (args.overwrite && outExisted) {
    batchWarnings.push({
      code: "overwrite_enabled",
      message: `--overwrite yes 觸發；既有 ${outPath} 內容已被覆寫（${mergeWithLoaded ? "但同時 --merge-with 已合併 reviewer edits" : "reviewer 任何先前編輯皆遺失"}）。`,
    });
  }
  if (mergedCount > 0) {
    batchWarnings.push({
      code: "merged_from_existing_review",
      message: `本 batch 從 --merge-with 合併 ${mergedCount} 筆既有 reviewer 條目；reviewerFields / reviewStatus 已保留。`,
    });
  }
  if (orphanedCount > 0) {
    batchWarnings.push({
      code: "orphaned_existing_review",
      message: `本 batch 含 ${orphanedCount} 筆 orphaned existing review 條目（existing 有但新 input 無對應）；已保留於 items[]。`,
    });
  }

  const payload = {
    batchId: makeBatchId("revbatch"),
    createdAt: new Date().toISOString(),
    source: REVIEW_VERSION,
    input: inputPath,
    mode: "prepare-review",
    dryRun: args.dryRun,
    mergeWith: mergeWithPath,
    summary: {
      totalInput,
      eligible: eligibleIndices.length,
      queued,
      merged: mergedCount,
      orphaned: orphanedCount,
      dryRun: dryRunCount,
      skipped,
      overwritten,
    },
    batchWarnings,
    items: outItems,
  };
  await writeJson(outPath, payload);
  console.error(
    `[review] wrote reviewed batch to ${outPath} — totalInput=${totalInput} eligible=${eligibleIndices.length} ` +
      `queued=${queued} merged=${mergedCount} orphaned=${orphanedCount} dryRun=${dryRunCount} ` +
      `skipped=${skipped} overwritten=${overwritten}`,
  );
}

// ===========================================================================
// 4. validate-reviewed：驗證 reviewer 編輯後的條目
// ===========================================================================

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function answerMatchesOptions(answer, options) {
  if (!Array.isArray(options)) return false;
  return options.some((opt) => {
    if (typeof opt === "string") return opt === answer;
    if (opt && typeof opt === "object") {
      return opt.id === answer || opt.value === answer;
    }
    return false;
  });
}

function validateOneReviewedItem(item) {
  const errors = [];
  const rf = item?.reviewerFields ?? {};
  const fq = rf?.finalQuestion ?? {};

  // 0. approval 一致性
  if (rf.approvedForPractice !== true) {
    return {
      validationStatus: "skipped",
      reason: "approvedForPractice !== true（reviewer 還沒勾選 approve；不做欄位驗證）",
      errors: [],
    };
  }
  // 既已 claim approvedForPractice=true，必須同時 approved=true
  if (rf.approved !== true) {
    errors.push({
      code: "approved_must_be_true",
      field: "reviewerFields.approved",
      message: "approvedForPractice=true 但 approved 不是 true；reviewer 必須同時勾選 approved=true。",
    });
  }
  if (item?.reviewStatus !== "approved_for_practice") {
    errors.push({
      code: "review_status_not_approved_for_practice",
      field: "reviewStatus",
      message: `reviewStatus="${item?.reviewStatus ?? "(missing)"}" 不是 "approved_for_practice"；approvedForPractice=true 時必須同步升級。`,
    });
  }

  // 1. 必填欄位
  if (!nonEmptyString(fq.id)) {
    errors.push({ code: "missing_final_id", field: "finalQuestion.id", message: "id 不可空" });
  }
  if (!nonEmptyString(fq.type)) {
    errors.push({ code: "missing_final_type", field: "finalQuestion.type", message: "type 不可空" });
  } else if (!ALLOWED_QUESTION_TYPES.has(fq.type)) {
    errors.push({
      code: "invalid_final_type",
      field: "finalQuestion.type",
      message: `type "${fq.type}" 不在 QuestionType union（${[...ALLOWED_QUESTION_TYPES].join(" / ")}）中`,
    });
  }
  if (!nonEmptyString(fq.starterPart)) {
    errors.push({
      code: "missing_final_starter_part",
      field: "finalQuestion.starterPart",
      message: "starterPart 不可空",
    });
  } else if (!ALLOWED_STARTER_PARTS.has(fq.starterPart)) {
    errors.push({
      code: "invalid_final_starter_part",
      field: "finalQuestion.starterPart",
      message: `starterPart "${fq.starterPart}" 不在 ${[...ALLOWED_STARTER_PARTS].join(" / ")} 中`,
    });
  }
  if (!nonEmptyString(fq.prompt)) {
    errors.push({
      code: "missing_final_prompt",
      field: "finalQuestion.prompt",
      message: "prompt 不可空",
    });
  }
  if (!nonEmptyString(fq.answer)) {
    errors.push({
      code: "missing_final_answer",
      field: "finalQuestion.answer",
      message: "answer 不可空",
    });
  }

  // 2. 題型特殊驗證（只在 type 合法時跑）
  if (ALLOWED_QUESTION_TYPES.has(fq.type)) {
    if (fq.type === "spelling") {
      if (!nonEmptyString(fq.answer)) {
        // 已經被 missing_final_answer 抓
      }
      // options 可空
    } else if (fq.type === "true-false") {
      const ans = nonEmptyString(fq.answer) ? fq.answer.trim().toLowerCase() : "";
      if (ans !== "yes" && ans !== "no") {
        errors.push({
          code: "true_false_answer_invalid",
          field: "finalQuestion.answer",
          message: `true-false 的 answer 必須是 "yes" 或 "no"（忽略大小寫；got: "${fq.answer}"）`,
        });
      }
    } else if (CHOICE_TYPES.has(fq.type)) {
      if (!Array.isArray(fq.options) || fq.options.length < 2) {
        errors.push({
          code: "options_too_few",
          field: "finalQuestion.options",
          message: `${fq.type} 必須至少有 2 個 options（got: ${
            Array.isArray(fq.options) ? fq.options.length : 0
          }）`,
        });
      } else if (nonEmptyString(fq.answer) && !answerMatchesOptions(fq.answer, fq.options)) {
        errors.push({
          code: "answer_not_in_options",
          field: "finalQuestion.answer",
          message: `answer "${fq.answer}" 不在 options 中（options 接受純字串或 { id, value } 物件）`,
        });
      }
    }
  }

  return {
    validationStatus: errors.length === 0 ? "passed" : "failed",
    reason: null,
    errors,
  };
}

async function runValidateReviewed(args) {
  const inputPath = resolve(args.input);
  const outPath = args.out ? resolve(args.out) : DEFAULT_VALIDATION_OUT;

  console.error(
    `[review] mode=validate-reviewed input=${inputPath} out=${outPath} (validation 只讀 input、不寫正式題庫)`,
  );

  let inputData;
  try {
    inputData = await readJsonFile(inputPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    console.error(
      "提示：請先跑 mode=prepare-review 產出 reviewed-questions.generated.json，或用 fixture 測試。",
    );
    process.exit(2);
  }
  if (!Array.isArray(inputData?.items)) {
    console.error(`Error: input JSON 必須含 items[] array（reviewed batch 格式）：${inputPath}`);
    process.exit(2);
  }

  const inputItems = inputData.items;
  const totalInput = inputItems.length;
  const itemsOut = [];
  let approvedClaimed = 0;
  let passedValidation = 0;
  let failedValidation = 0;
  let skippedNotApproved = 0;

  for (const it of inputItems) {
    const rf = it?.reviewerFields ?? {};
    const claim = rf.approvedForPractice === true;
    if (claim) approvedClaimed += 1;
    const result = validateOneReviewedItem(it);
    if (result.validationStatus === "skipped") {
      skippedNotApproved += 1;
    } else if (result.validationStatus === "passed") {
      passedValidation += 1;
    } else if (result.validationStatus === "failed") {
      failedValidation += 1;
    }
    itemsOut.push({
      sourceItemId: it?.sourceItemId ?? null,
      sourceUrl: it?.sourceUrl ?? null,
      finalQuestionId: it?.reviewerFields?.finalQuestion?.id ?? null,
      finalQuestionType: it?.reviewerFields?.finalQuestion?.type ?? null,
      approvedForPractice: claim,
      approved: rf.approved === true,
      reviewStatusClaim: it?.reviewStatus ?? null,
      validationStatus: result.validationStatus,
      reason: result.reason,
      errors: result.errors,
    });
  }

  const payload = {
    batchId: makeBatchId("valbatch"),
    validatedAt: new Date().toISOString(),
    source: REVIEW_VERSION,
    input: inputPath,
    mode: "validate-reviewed",
    summary: {
      totalInput,
      approvedClaimed,
      passedValidation,
      failedValidation,
      skippedNotApproved,
    },
    items: itemsOut,
  };
  await writeJson(outPath, payload);

  // console summary
  console.error(`[review] validation summary:`);
  console.error(`         totalInput=${totalInput}`);
  console.error(`         approvedClaimed=${approvedClaimed}`);
  console.error(`         passedValidation=${passedValidation}`);
  console.error(`         failedValidation=${failedValidation}`);
  console.error(`         skippedNotApproved=${skippedNotApproved}`);
  if (failedValidation > 0) {
    console.error(`[review] failed items:`);
    for (const it of itemsOut) {
      if (it.validationStatus === "failed") {
        console.error(
          `         - sourceItemId=${it.sourceItemId} finalQuestionId=${it.finalQuestionId} type=${it.finalQuestionType} errors=${it.errors.map((e) => e.code).join(",")}`,
        );
      }
    }
  }
  console.error(
    `[review] **不寫正式題庫**：data/p3-example-questions.json / data/exam-papers.example.json 未動。寫入 ${outPath}`,
  );
}

// ===========================================================================
// 5. main
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

  if (args.mode === "prepare-review") {
    await runPrepareReview(args);
  } else if (args.mode === "validate-reviewed") {
    await runValidateReviewed(args);
  }
}

const isCliInvocation =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCliInvocation) {
  main().catch((err) => {
    console.error(`[review] unexpected error: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
