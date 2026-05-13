#!/usr/bin/env node
/**
 * scripts/review_normalized_questions.mjs
 *
 * P3-10-F：匯入題目人工審核流程 CLI 第一版（v0.1）。
 *
 * 對應 docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md / docs/PRACTICE_DATA_IMPORT_PLAN.md。
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

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const REVIEW_VERSION = "review_normalized_questions.mjs@v0.1";
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

const HELP_TEXT = `\nreview_normalized_questions.mjs — P3-10-F review workflow CLI v0.1\n
Usage:
  prepare-review：把 normalizer 的 draft items 轉成 reviewer 工作介面（預填 reviewerFields template）
    node scripts/review_normalized_questions.mjs \\
      --input data/imported/normalized-questions.generated.json \\
      --out data/imported/reviewed-questions.generated.json \\
      --mode prepare-review --limit ${DEFAULT_LIMIT}

  validate-reviewed：驗證人工編輯後 reviewed-questions.generated.json，**不寫正式題庫**
    node scripts/review_normalized_questions.mjs \\
      --input data/imported/reviewed-questions.generated.json \\
      --mode validate-reviewed

Options:
  --input <path>     必填；prepare-review → normalized batch / validate-reviewed → reviewed batch
  --out <path>       選填；
                     prepare-review 預設 data/imported/reviewed-questions.generated.json
                     validate-reviewed 預設 data/imported/review-validation.generated.json
  --mode <mode>      必填；prepare-review / validate-reviewed
  --limit <n>        選填；prepare-review 最多處理 N 筆 eligible draft（預設 ${DEFAULT_LIMIT}）
  --dry-run <yes|no> 選填；預設 no；prepare-review yes 時每筆 status 標 dry_run + queued
  --help             印此使用說明

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

function makeBatchId(prefix) {
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  return `${prefix}-${ts}`;
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

  console.error(
    `[review] mode=prepare-review input=${inputPath} out=${outPath} limit=${limit} dry-run=${args.dryRun ? "yes" : "no"}`,
  );

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

  const inputItems = inputData.items;
  const totalInput = inputItems.length;
  const outItems = [];
  const eligibleIndices = [];
  // 第一輪：分流 eligible vs skipped（其他原因）
  for (let i = 0; i < inputItems.length; i++) {
    const it = inputItems[i];
    const cls = classifyForReview(it);
    if (cls.eligible) {
      eligibleIndices.push(i);
    } else {
      outItems.push(buildSkippedReviewItem(it, cls.reasonCode, cls.reasonMessage));
    }
  }
  // 第二輪：對 eligible 取前 limit；其餘標 skip_due_to_limit
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
  for (const i of toProcess) {
    outItems.push(buildReviewItem(inputItems[i], { dryRun: args.dryRun }));
  }

  const queued = outItems.filter((it) => it.status === "queued").length;
  const dryRunCount = outItems.filter((it) => it.status === "dry_run").length;
  const skipped = outItems.filter((it) => it.status === "skipped").length;

  const payload = {
    batchId: makeBatchId("revbatch"),
    createdAt: new Date().toISOString(),
    source: REVIEW_VERSION,
    input: inputPath,
    mode: "prepare-review",
    dryRun: args.dryRun,
    summary: {
      totalInput,
      eligible: eligibleIndices.length,
      queued,
      dryRun: dryRunCount,
      skipped,
    },
    items: outItems,
  };
  await writeJson(outPath, payload);
  console.error(
    `[review] wrote reviewed batch to ${outPath} — totalInput=${totalInput} eligible=${eligibleIndices.length} queued=${queued} dryRun=${dryRunCount} skipped=${skipped}`,
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
