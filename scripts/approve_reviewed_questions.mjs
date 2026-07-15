#!/usr/bin/env node
/**
 * scripts/approve_reviewed_questions.mjs
 *
 * P3-10-K：approved reviewed item → 正式 ExamQuestion 轉換 CLI 第一版（v0.1）。
 *
 * 對應 docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md / docs/PRACTICE_DATA_IMPORT_PLAN.md /
 *      docs/DATA_SCHEMA.md / lib/types.ts。
 *
 * 用途：
 *   - 讀 reviewed-questions.generated.json + review-validation.generated.json
 *   - 篩出**同時**滿足下列條件的條目：
 *       1. validate-reviewed validationStatus === "passed"
 *       2. reviewStatus === "approved_for_practice"
 *       3. reviewerFields.approved === true
 *       4. reviewerFields.approvedForPractice === true
 *       5. reviewerFields.finalQuestion 存在
 *   - 依 type 把 finalQuestion 扁平化為正式 ExamQuestion schema
 *   - 預設 mode=preview：只寫 preview JSON、**不動正式題庫**
 *   - mode=write + --write yes：寫回 target（必須同時雙開關）；duplicate id 全域 exit 2
 *
 * 硬邊界（對齊 P3-10-K 任務單）：
 *   - ❌ 不自動產生題目；不呼叫 OpenAI；不下載 PDF / image / audio；不解析 PDF
 *   - ❌ 不讓非 approved_for_practice 條目進正式題庫
 *   - ❌ 不覆蓋既有正式題目（duplicate id 在 write mode 整批 exit 2）
 *   - ❌ 不接後端 / DB / 登入；不改題目核心欄位語意
 *   - ✅ preview mode 永遠安全（不動正式題庫，不管 --write 是什麼）
 *   - ✅ write mode 必須同時 --mode write + --write yes 才寫
 *
 * 使用方式：
 *   help：
 *     node scripts/approve_reviewed_questions.mjs --help
 *
 *   preview（預設、安全）：
 *     node scripts/approve_reviewed_questions.mjs \
 *       --reviewed data/imported/reviewed-questions.generated.json \
 *       --validation data/imported/review-validation.generated.json \
 *       --target data/p3-example-questions.json \
 *       --out data/imported/approved-questions.preview.generated.json \
 *       --mode preview --limit 10
 *
 *   write（必須兩個開關都 on）：
 *     node scripts/approve_reviewed_questions.mjs \
 *       --reviewed ... --validation ... --target ... --out ... \
 *       --mode write --write yes --limit 10
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤
 *   2  CLI 參數錯 / 必填檔不存在 / JSON parse 失敗 / mode=write 缺 --write yes /
 *       write mode + 有 duplicate id（不覆蓋既有正式題目，整批拒絕）
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const APPROVE_VERSION = "approve_reviewed_questions.mjs@v0.1.2";
const SUPPORTED_MODES = new Set(["preview", "write"]);
const DEFAULT_LIMIT = 10;

// 對齊 lib/types.ts QuestionSource union（4 種）。
// reviewer 在 finalQuestion.source 填非 union 的字面量（如 user_provided / third_party）→ 失敗，
// **不** silent fallback 為 custom，避免掩蓋 reviewer 填錯來源的問題。
// 若空字串 / 缺值 → 預設 "custom"。
const ALLOWED_QUESTION_SOURCES = new Set([
  "official_sample",
  "past_paper",
  "ai_generated",
  "custom",
]);

// 對齊 lib/types.ts QuestionType union（8 種）。
// listening-image-choice 不在 union → unsupported_question_type
// matching 在 union 但 reviewerFields.finalQuestion template 沒有 pairs[] → 暫時 unsupported（v0.1）
const FULLY_SUPPORTED_TYPES = new Set([
  "spelling",
  "true-false",
  "multiple-choice",
  "picture-choice",
  "word-choice",
  "listening-choice",
  "fill-blank",
]);
const NOT_IN_SCHEMA_UNION = new Set([
  "listening-image-choice", // 任務單明示 v0.1 不支援；schema union 無此 literal
]);
const TEMPLATE_INSUFFICIENT = new Set([
  "matching", // 在 schema union，但需 pairs[]，超出 reviewerFields template；v0.1 skip
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

const DEFAULT_STARTER_PART_BY_TYPE = {
  spelling: "RW3",
  "true-false": "RW1",
  "picture-choice": "RW1",
  "word-choice": "RW3",
  "multiple-choice": "RW4",
  "fill-blank": "RW4",
  "listening-choice": "L3",
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
// 注意：本 CLI **要求** reviewer 明示 --reviewed / --validation / --target 三個路徑，不提供預設
//      避免接錯檔（reviewed 與 validation 結構不同；target 是正式題庫不可意外指錯）。
//      只保留 --out 的預設（preview JSON 路徑），降低 reviewer 打字成本。
const DEFAULT_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "approved-questions.preview.generated.json",
);

const HELP_TEXT = `\napprove_reviewed_questions.mjs — P3-10-K approved → 正式題庫轉換 CLI v0.1.2\n
（v0.1.2：P3-10-V 修補，2026-07-07；正式 question 保留 sourceProvenance）\n
（v0.1.1：P3-10-K 修補，2026-05-14；新增 batch duplicate id 偵測 + finalQuestion.source union 驗證）\n
Usage:
  preview（預設、絕對安全；**不動正式題庫**）：
    node scripts/approve_reviewed_questions.mjs \\
      --reviewed data/imported/reviewed-questions.generated.json \\
      --validation data/imported/review-validation.generated.json \\
      --target data/p3-example-questions.json \\
      --out data/imported/approved-questions.preview.generated.json \\
      --mode preview --limit ${DEFAULT_LIMIT}

  write（**雙開關**：必須同時 --mode write + --write yes）：
    node scripts/approve_reviewed_questions.mjs \\
      --reviewed ... --validation ... --target ... --out ... \\
      --mode write --write yes --limit ${DEFAULT_LIMIT}

Options:
  --reviewed <path>     必填；reviewed-questions.generated.json（P3-10-F prepare-review output 經 reviewer 編輯）
  --validation <path>   必填；review-validation.generated.json（P3-10-F validate-reviewed output）
  --target <path>       必填；正式題庫路徑（預設 data/p3-example-questions.json）
                        preview mode：只讀，比對既有 id 找 duplicate
                        write mode：讀 + 寫（append approved items）
  --out <path>          選填；preview 寫檔路徑（預設 data/imported/approved-questions.preview.generated.json）
                        無論 preview 或 write mode 都會寫此 preview JSON
  --mode <mode>         選填；preview（預設）/ write
  --write <yes|no>      選填；預設 no；write mode 必須 yes 才允許寫 target；否則 exit 2
  --limit <n>           選填；最多取 N 筆 ready items（預設 ${DEFAULT_LIMIT}）
                        其餘 ready items 標 skip_due_to_limit
  --help                印此使用說明

過濾條件（任務單規範；**同時**滿足下列條件才會嘗試轉換）：
  - validate-reviewed 結果：item.validationStatus === "passed"
  - reviewed item：reviewStatus === "approved_for_practice"
  - reviewed item：reviewerFields.approved === true
  - reviewed item：reviewerFields.approvedForPractice === true
  - reviewed item：reviewerFields.finalQuestion 存在

skipped reason / failed error code：
  skipped_not_in_validation_passed      validation 沒給 passed
  skipped_review_status_not_approved    reviewStatus !== "approved_for_practice"
  skipped_approved_false                reviewerFields.approved !== true
  skipped_approved_for_practice_false   reviewerFields.approvedForPractice !== true
  skipped_no_final_question             reviewerFields.finalQuestion 為 null / 缺
  unsupported_question_type             type 不在 FULLY_SUPPORTED_TYPES（含 listening-image-choice / matching）
  duplicate_id_in_target                finalQuestion.id 已存在於 target 既有題目（v0.1.1 從 duplicate_id 拆出）
  duplicate_id_in_batch                 同批 ready items 內 id 重複（v0.1.1 新增）
  invalid_question_source               finalQuestion.source 非空但不在 QuestionSource union（v0.1.1 新增；status=failed）
  skip_due_to_limit                     超過 --limit 上限

write mode 額外保護（v0.1.1 保守邊界）：
  - 必須 --mode write 同時 --write yes，否則 exit 2
  - 若有任何 duplicate_id_in_target **或** duplicate_id_in_batch，**整批拒絕寫入** + exit 2
    （preview JSON 仍會寫，reviewer 可看到 warnings 內哪幾筆 dup）
  - reviewer 必須先在 reviewed file 改 id，或從 target 移除既有同 id 題目，才能重跑

QuestionSource union（finalQuestion.source 規則；v0.1.1 新增）：
  - 對齊 lib/types.ts QuestionSource union：official_sample / past_paper / ai_generated / custom
  - finalQuestion.source 為空或缺值 → 預設 "custom"
  - finalQuestion.source 在 union → 使用該值
  - finalQuestion.source 非空但不在 union → 條目 status="failed" + error invalid_question_source
    （**不** silent fallback 為 custom；避免掩蓋 reviewer 填錯來源）
  - reviewer 若想表示第三方來源（user_provided / third_party / 等），請保留於
    reviewerNotes / sourceType（discovery provenance）；**不要**寫入正式 QuestionSource union

ExamQuestion 轉換規則（v0.1.2 保守）：
  - source：依 QuestionSource union 規則（見上）；reviewer 可在 finalQuestion.source 提供，預設 "custom"
  - sourceProvenance（v0.1.2）：若 finalQuestion / reviewed item / discoveryProvenance 有 sourceUrl，
    會保留到正式 question.sourceProvenance；sourceUrl 必填，其他欄位有值才寫入。
    來源細節包含 sourceId / documentTitle / pageHint / sectionHint / sourceKind / publisher /
    publisherType / rightsNotes / provenanceNotes / reviewerNotes。此欄只作來源追溯與 reviewer 記錄，
    不代表授權，也不會把官方素材寫入題庫。
  - starterPart：使用 finalQuestion.starterPart；缺值時依 type fallback（spelling→RW3 / true-false→RW1 / ...）
  - image：使用 finalQuestion.imageSrc 對應 BaseQuestion.image；只在非空時填
  - audioSrc：listening-choice 才透傳；audio legacy field 用 audioSrc 同值（v0.1 簡化）
  - options：依 type 規則正規化（multiple-choice / picture-choice / fill-blank 接受 string[]；
            word-choice 必須 ImageOption[]；listening-choice 兩者皆可）
  - **不自動補** spellingHint / letterScramble / explanation / topic / promptVersion 等選填欄位

Hard constraints：
  - 不呼叫 OpenAI / 不需 OPENAI_API_KEY
  - 不下載 PDF / image / audio；不解析 PDF
  - 不自動覆寫既有正式題目（duplicate id 全域 exit 2）
  - 不讓非 approved_for_practice 條目進正式題庫
  - preview mode 對 target 是**唯讀**

Examples:
  # 預設安全 preview
  node scripts/approve_reviewed_questions.mjs --reviewed ... --validation ... --target ... --out ...

  # 真實寫入（建議先 preview 確認，再加 --mode write --write yes）
  node scripts/approve_reviewed_questions.mjs --reviewed ... --validation ... --target ... --out ... \\
    --mode write --write yes --limit 5
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
    reviewed: null,
    validation: null,
    target: null,
    out: null,
    mode: "preview",
    write: false,
    limit: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--reviewed") {
      out.reviewed = argv[++i];
    } else if (arg === "--validation") {
      out.validation = argv[++i];
    } else if (arg === "--target") {
      out.target = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else if (arg === "--mode") {
      out.mode = argv[++i];
    } else if (arg === "--write") {
      out.write = parseYesNo(argv[++i], "--write");
    } else if (arg === "--limit") {
      const n = Number(argv[++i]);
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error(`--limit 必須是正整數（got: ${argv[i]}）`);
      }
      out.limit = n;
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return out;
}

function validateArgs(args) {
  if (args.help) return;
  if (!SUPPORTED_MODES.has(args.mode)) {
    const supported = [...SUPPORTED_MODES].join(" / ");
    throw new Error(`--mode "${args.mode}" 未支援；本輪支援 ${supported}`);
  }
  if (!args.reviewed) {
    throw new Error("--reviewed is required（reviewed-questions.generated.json 路徑）");
  }
  if (!args.validation) {
    throw new Error("--validation is required（review-validation.generated.json 路徑）");
  }
  if (!args.target) {
    throw new Error("--target is required（正式題庫路徑，例如 data/p3-example-questions.json）");
  }
}

// ===========================================================================
// 2. JSON / FS helpers
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

function nonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function firstNonEmptyString(...values) {
  for (const value of values) {
    if (nonEmptyString(value)) return value.trim();
  }
  return undefined;
}

function objectOrEmpty(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function buildQuestionSourceProvenance(fq, reviewedItem) {
  const finalProvenance = objectOrEmpty(fq?.sourceProvenance);
  const discoveryProvenance = objectOrEmpty(reviewedItem?.discoveryProvenance);
  const originalDraft = objectOrEmpty(reviewedItem?.originalDraft);
  const draftProvenance = objectOrEmpty(originalDraft?.provenance);
  const reviewerFields = objectOrEmpty(reviewedItem?.reviewerFields);

  const sourceUrl = firstNonEmptyString(
    finalProvenance.sourceUrl,
    fq?.sourceUrl,
    reviewedItem?.sourceUrl,
    discoveryProvenance.sourceUrl,
    originalDraft.sourceUrl,
    draftProvenance.sourceUrl,
  );
  if (!sourceUrl) return undefined;

  const out = {
    sourceId: firstNonEmptyString(
      finalProvenance.sourceId,
      fq?.sourceId,
      reviewedItem?.sourceId,
      discoveryProvenance.sourceId,
      originalDraft.sourceId,
      draftProvenance.sourceId,
    ),
    sourceUrl,
    documentTitle: firstNonEmptyString(
      finalProvenance.documentTitle,
      fq?.documentTitle,
      reviewedItem?.documentTitle,
      discoveryProvenance.documentTitle,
      discoveryProvenance.title,
      originalDraft.documentTitle,
      draftProvenance.documentTitle,
    ),
    pageHint: firstNonEmptyString(
      finalProvenance.pageHint,
      fq?.pageHint,
      reviewedItem?.pageHint,
      discoveryProvenance.pageHint,
      originalDraft.pageHint,
      draftProvenance.pageHint,
    ),
    sectionHint: firstNonEmptyString(
      finalProvenance.sectionHint,
      fq?.sectionHint,
      reviewedItem?.sectionHint,
      discoveryProvenance.sectionHint,
      originalDraft.sectionHint,
      draftProvenance.sectionHint,
    ),
    sourceKind: firstNonEmptyString(
      finalProvenance.sourceKind,
      fq?.sourceKind,
      reviewedItem?.sourceKind,
      discoveryProvenance.sourceKind,
      originalDraft.sourceKind,
      draftProvenance.sourceKind,
      reviewedItem?.sourceType,
    ),
    publisher: firstNonEmptyString(
      finalProvenance.publisher,
      fq?.publisher,
      reviewedItem?.publisher,
      discoveryProvenance.publisher,
      originalDraft.publisher,
      draftProvenance.publisher,
    ),
    publisherType: firstNonEmptyString(
      finalProvenance.publisherType,
      fq?.publisherType,
      reviewedItem?.publisherType,
      discoveryProvenance.publisherType,
      originalDraft.publisherType,
      draftProvenance.publisherType,
    ),
    rightsNotes: firstNonEmptyString(
      finalProvenance.rightsNotes,
      fq?.rightsNotes,
      reviewedItem?.rightsNotes,
      discoveryProvenance.rightsNotes,
      originalDraft.rightsNotes,
      draftProvenance.rightsNotes,
    ),
    provenanceNotes: firstNonEmptyString(
      finalProvenance.provenanceNotes,
      fq?.provenanceNotes,
      reviewedItem?.provenanceNotes,
      discoveryProvenance.provenanceNotes,
      originalDraft.provenanceNotes,
      draftProvenance.provenanceNotes,
      draftProvenance.notes,
    ),
    reviewerNotes: firstNonEmptyString(
      finalProvenance.reviewerNotes,
      fq?.reviewerNotes,
      reviewerFields.reviewerNotes,
      reviewedItem?.reviewerNotes,
    ),
  };

  return Object.fromEntries(Object.entries(out).filter(([, value]) => value !== undefined));
}

// ===========================================================================
// 3. ExamQuestion 轉換（finalQuestion → ExamQuestion）
// ===========================================================================

function normalizeStarterPart(fqStarterPart, type) {
  if (nonEmptyString(fqStarterPart) && ALLOWED_STARTER_PARTS.has(fqStarterPart)) {
    return fqStarterPart;
  }
  return DEFAULT_STARTER_PART_BY_TYPE[type] ?? undefined;
}

/**
 * 把 options 正規化為 string[]（給 multiple-choice / picture-choice / fill-blank 用）。
 * 若 option 是物件 { value, ... }，取 value；否則保留字串。
 */
function normalizeStringOptions(options) {
  if (!Array.isArray(options)) return [];
  return options.map((o) => {
    if (typeof o === "string") return o;
    if (o && typeof o === "object") return o.value ?? o.id ?? "";
    return "";
  });
}

/**
 * 把 options 正規化為 ImageOption[]（給 word-choice 用）。
 * 接受 { value, image } / { value, image, id } / 純字串（拒絕：missing image）。
 * 回傳 { ok: true, options } 或 { ok: false, message }。
 */
function normalizeImageOptions(options) {
  if (!Array.isArray(options) || options.length === 0) {
    return { ok: false, message: "options 為空或不是陣列" };
  }
  const out = [];
  for (let i = 0; i < options.length; i++) {
    const o = options[i];
    if (typeof o === "string") {
      return { ok: false, message: `options[${i}] 是純字串；word-choice 需要 { value, image } 物件` };
    }
    if (!o || typeof o !== "object" || !nonEmptyString(o.value) || !nonEmptyString(o.image)) {
      return {
        ok: false,
        message: `options[${i}] 缺 value 或 image（word-choice 必須是 { value, image }）`,
      };
    }
    out.push({ value: o.value, image: o.image });
  }
  return { ok: true, options: out };
}

/**
 * 把 reviewerFields.finalQuestion 扁平化為正式 ExamQuestion。
 * 回傳 { ok: true, question } 或 { ok: false, errors: [...] }。
 */
function convertFinalQuestionToExamQuestion(fq, reviewedItem = null) {
  const errors = [];
  if (!fq || typeof fq !== "object") {
    return { ok: false, errors: [{ code: "missing_final_question", message: "finalQuestion 缺" }] };
  }
  const type = fq.type;
  if (NOT_IN_SCHEMA_UNION.has(type)) {
    return {
      ok: false,
      errors: [
        {
          code: "unsupported_question_type",
          field: "finalQuestion.type",
          message: `type "${type}" 不在正式 QuestionType union（lib/types.ts）；v0.1 skip。`,
        },
      ],
    };
  }
  if (TEMPLATE_INSUFFICIENT.has(type)) {
    return {
      ok: false,
      errors: [
        {
          code: "unsupported_question_type",
          field: "finalQuestion.type",
          message:
            `type "${type}" 雖在 QuestionType union 但需要 pairs[] 等結構，reviewerFields.finalQuestion ` +
            "template 沒提供；v0.1 skip。未來可擴 template 後支援。",
        },
      ],
    };
  }
  if (!FULLY_SUPPORTED_TYPES.has(type)) {
    return {
      ok: false,
      errors: [
        {
          code: "unsupported_question_type",
          field: "finalQuestion.type",
          message: `type "${type}" 不在 FULLY_SUPPORTED_TYPES（${[...FULLY_SUPPORTED_TYPES].join(" / ")}）。`,
        },
      ],
    };
  }

  if (!nonEmptyString(fq.id)) errors.push({ code: "missing_id", field: "id", message: "id 為空" });
  if (!nonEmptyString(fq.prompt))
    errors.push({ code: "missing_prompt", field: "prompt", message: "prompt 為空" });
  if (!nonEmptyString(fq.answer))
    errors.push({ code: "missing_answer", field: "answer", message: "answer 為空" });

  if (errors.length > 0) return { ok: false, errors };

  // ---------------------------------------------------------------------
  // QuestionSource union 驗證（P3-10-K 修補，2026-05-14）
  // - 空 / 缺值 → 預設 "custom"
  // - 在 ALLOWED_QUESTION_SOURCES → 使用該值
  // - 非空但不在 union → 失敗 + invalid_question_source，**不** fallback 為 custom
  // ---------------------------------------------------------------------
  let resolvedSource;
  if (!nonEmptyString(fq.source)) {
    resolvedSource = "custom";
  } else if (ALLOWED_QUESTION_SOURCES.has(fq.source)) {
    resolvedSource = fq.source;
  } else {
    return {
      ok: false,
      errors: [
        {
          code: "invalid_question_source",
          field: "finalQuestion.source",
          message:
            `source "${fq.source}" 不在 QuestionSource union（` +
            `${[...ALLOWED_QUESTION_SOURCES].join(" / ")}）。` +
            "非法 source 不會 fallback 為 custom（避免掩蓋 reviewer 填錯來源）；" +
            "若 reviewer 想表示第三方來源，請保留於 reviewerNotes / discovery provenance，" +
            "不要寫入正式 QuestionSource union。",
        },
      ],
    };
  }

  // 基本欄位
  const starterPart = normalizeStarterPart(fq.starterPart, type);
  const sourceProvenance = buildQuestionSourceProvenance(fq, reviewedItem);
  const base = {
    id: fq.id,
    type,
    source: resolvedSource,
    prompt: fq.prompt,
    explanation: nonEmptyString(fq.explanation) ? fq.explanation : undefined,
    starterSection: type.startsWith("listening")
      ? "listening"
      : type === "matching"
        ? "reading-writing"
        : "reading-writing",
  };
  if (sourceProvenance) base.sourceProvenance = sourceProvenance;
  if (starterPart) base.starterPart = starterPart;
  if (nonEmptyString(fq.imageSrc)) base.image = fq.imageSrc;

  // 依 type 補欄位
  switch (type) {
    case "spelling": {
      // SpellingQuestion: prompt + answer 必填；image 選填；spellingHint / letterScramble 不亂補
      return {
        ok: true,
        question: {
          ...base,
          type: "spelling",
          answer: fq.answer,
        },
      };
    }
    case "true-false": {
      const ans = fq.answer.toLowerCase().trim();
      if (ans !== "yes" && ans !== "no") {
        return {
          ok: false,
          errors: [
            {
              code: "true_false_answer_invalid",
              field: "answer",
              message: `true-false 的 answer 必須是 "yes" 或 "no"（got: "${fq.answer}"）`,
            },
          ],
        };
      }
      return {
        ok: true,
        question: { ...base, type: "true-false", answer: ans },
      };
    }
    case "multiple-choice": {
      const options = normalizeStringOptions(fq.options);
      if (options.length < 2) {
        return {
          ok: false,
          errors: [
            { code: "options_too_few", field: "options", message: "multiple-choice 需要 >=2 個 options" },
          ],
        };
      }
      if (!options.includes(fq.answer)) {
        return {
          ok: false,
          errors: [
            {
              code: "answer_not_in_options",
              field: "answer",
              message: `answer "${fq.answer}" 不在正規化後 options 中`,
            },
          ],
        };
      }
      return {
        ok: true,
        question: { ...base, type: "multiple-choice", options, answer: fq.answer },
      };
    }
    case "picture-choice": {
      if (!nonEmptyString(base.image)) {
        return {
          ok: false,
          errors: [
            { code: "missing_image", field: "imageSrc", message: "picture-choice 必填 image / imageSrc" },
          ],
        };
      }
      const options = normalizeStringOptions(fq.options);
      if (options.length < 2) {
        return {
          ok: false,
          errors: [
            { code: "options_too_few", field: "options", message: "picture-choice 需要 >=2 個 options" },
          ],
        };
      }
      if (!options.includes(fq.answer)) {
        return {
          ok: false,
          errors: [
            { code: "answer_not_in_options", field: "answer", message: `answer "${fq.answer}" 不在 options 中` },
          ],
        };
      }
      return {
        ok: true,
        question: { ...base, type: "picture-choice", options, answer: fq.answer },
      };
    }
    case "word-choice": {
      const r = normalizeImageOptions(fq.options);
      if (!r.ok) {
        return {
          ok: false,
          errors: [{ code: "options_format_mismatch", field: "options", message: r.message }],
        };
      }
      const matchByValue = r.options.some((o) => o.value === fq.answer);
      if (!matchByValue) {
        return {
          ok: false,
          errors: [
            { code: "answer_not_in_options", field: "answer", message: `answer "${fq.answer}" 不在 options[].value 中` },
          ],
        };
      }
      return {
        ok: true,
        question: { ...base, type: "word-choice", options: r.options, answer: fq.answer },
      };
    }
    case "listening-choice": {
      // listening-choice 需要 audio 欄位（legacy）；v0.1 用 audioSrc 同值帶過
      if (!nonEmptyString(fq.audioSrc)) {
        return {
          ok: false,
          errors: [
            {
              code: "missing_audio_src",
              field: "audioSrc",
              message: "listening-choice 必填 audioSrc（reviewer 須先準備自製 TTS 音檔）",
            },
          ],
        };
      }
      // options 可為 string[] 或 ImageOption[]；簡單偵測：第一個是物件 → image 模式
      let optionType = "text";
      let normalizedOptions;
      if (Array.isArray(fq.options) && fq.options.length > 0 && typeof fq.options[0] === "object") {
        const r = normalizeImageOptions(fq.options);
        if (!r.ok) {
          return {
            ok: false,
            errors: [{ code: "options_format_mismatch", field: "options", message: r.message }],
          };
        }
        normalizedOptions = r.options;
        optionType = "image";
      } else {
        normalizedOptions = normalizeStringOptions(fq.options);
        if (normalizedOptions.length < 2) {
          return {
            ok: false,
            errors: [
              { code: "options_too_few", field: "options", message: "listening-choice 需要 >=2 個 options" },
            ],
          };
        }
      }
      // answer 必須對應 options
      const ans = fq.answer;
      const matched =
        optionType === "text"
          ? normalizedOptions.includes(ans)
          : normalizedOptions.some((o) => o.value === ans);
      if (!matched) {
        return {
          ok: false,
          errors: [
            { code: "answer_not_in_options", field: "answer", message: `answer "${ans}" 不在 options 中` },
          ],
        };
      }
      const base2 = { ...base, type: "listening-choice", audio: fq.audioSrc, audioSrc: fq.audioSrc };
      base2.optionType = optionType;
      base2.options = normalizedOptions;
      base2.answer = ans;
      return { ok: true, question: base2 };
    }
    case "fill-blank": {
      const out = { ...base, type: "fill-blank", answer: fq.answer };
      if (Array.isArray(fq.options) && fq.options.length > 0) {
        const options = normalizeStringOptions(fq.options);
        if (options.length >= 2) {
          if (!options.includes(fq.answer)) {
            return {
              ok: false,
              errors: [
                { code: "answer_not_in_options", field: "answer", message: `answer "${fq.answer}" 不在 options 中` },
              ],
            };
          }
          out.options = options;
        }
      }
      return { ok: true, question: out };
    }
    default:
      return {
        ok: false,
        errors: [
          { code: "unsupported_question_type", field: "type", message: `unreachable: type=${type}` },
        ],
      };
  }
}

// ===========================================================================
// 4. 分流與管線
// ===========================================================================

function classifyReviewedItem(reviewedItem, validationByItemId) {
  // 找對應 validation
  const sourceItemId = reviewedItem?.sourceItemId;
  const fq = reviewedItem?.reviewerFields?.finalQuestion;
  // validation 條目以 sourceItemId 找對應；finalQuestionId 可作 second key
  // 注意：validate-reviewed 有 skipped 條目（沒驗證過 → 不可進）也有 failed → 不可進
  // 一個 sourceItemId 在 validation 中可能對應多筆（理論上 1 對 1，但保守查），找 passed 的那筆
  const matches = [];
  for (const v of validationByItemId.get(sourceItemId) ?? []) {
    matches.push(v);
  }
  const passed = matches.find(
    (v) => v.validationStatus === "passed" && (v.finalQuestionId ?? null) === (fq?.id ?? null),
  );
  if (!passed) {
    return {
      eligible: false,
      reason: "skipped_not_in_validation_passed",
      message:
        `validate-reviewed 沒給 passed（或 finalQuestionId 不一致）；sourceItemId=${sourceItemId}` +
        ` finalQuestionId=${fq?.id ?? "(none)"}`,
    };
  }
  if (reviewedItem?.reviewStatus !== "approved_for_practice") {
    return {
      eligible: false,
      reason: "skipped_review_status_not_approved",
      message: `reviewStatus="${reviewedItem?.reviewStatus}" 不是 "approved_for_practice"`,
    };
  }
  const rf = reviewedItem?.reviewerFields ?? {};
  if (rf.approved !== true) {
    return {
      eligible: false,
      reason: "skipped_approved_false",
      message: "reviewerFields.approved !== true",
    };
  }
  if (rf.approvedForPractice !== true) {
    return {
      eligible: false,
      reason: "skipped_approved_for_practice_false",
      message: "reviewerFields.approvedForPractice !== true",
    };
  }
  if (!fq) {
    return {
      eligible: false,
      reason: "skipped_no_final_question",
      message: "reviewerFields.finalQuestion 缺",
    };
  }
  return { eligible: true };
}

function makeOutItem(reviewedItem) {
  const fq = reviewedItem?.reviewerFields?.finalQuestion ?? null;
  return {
    sourceItemId: reviewedItem?.sourceItemId ?? null,
    sourceUrl: reviewedItem?.sourceUrl ?? null,
    sourceType: reviewedItem?.sourceType ?? null,
    finalQuestionId: fq?.id ?? null,
    finalQuestionType: fq?.type ?? null,
    reviewStatusClaim: reviewedItem?.reviewStatus ?? null,
    status: null, // ready | skipped | failed
    warnings: [],
    errors: [],
    question: null,
  };
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

  const reviewedPath = resolve(args.reviewed);
  const validationPath = resolve(args.validation);
  const targetPath = resolve(args.target);
  const outPath = args.out ? resolve(args.out) : DEFAULT_OUT;
  const limit = args.limit ?? DEFAULT_LIMIT;

  console.error(
    `[approve] mode=${args.mode} write=${args.write ? "yes" : "no"} reviewed=${reviewedPath} ` +
      `validation=${validationPath} target=${targetPath} out=${outPath} limit=${limit}`,
  );

  // ---------- 1. write mode 雙開關保護 ----------
  if (args.mode === "write" && args.write !== true) {
    console.error(
      "Error: --mode write 必須同時搭配 --write yes 才會實際寫入正式題庫。\n" +
        "本輪 v0.1 設計**雙開關**避免無意識寫入。若仍想寫，請完整指令：\n" +
        "  --mode write --write yes\n" +
        "若要先檢查、不寫，請改 --mode preview。",
    );
    process.exit(2);
  }

  // ---------- 2. 讀檔 ----------
  let reviewedData;
  let validationData;
  let targetData;
  try {
    reviewedData = await readJsonFile(reviewedPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  try {
    validationData = await readJsonFile(validationPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  if (!(await fileExists(targetPath))) {
    console.error(
      `Error: --target 檔不存在：${targetPath}\n本 CLI 預設要求 target 已存在（建議用 data/p3-example-questions.json）。`,
    );
    process.exit(2);
  }
  try {
    targetData = await readJsonFile(targetPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  if (!Array.isArray(reviewedData?.items)) {
    console.error(`Error: --reviewed JSON 必須含 items[] array`);
    process.exit(2);
  }
  if (!Array.isArray(validationData?.items)) {
    console.error(`Error: --validation JSON 必須含 items[] array`);
    process.exit(2);
  }
  if (!Array.isArray(targetData)) {
    console.error(`Error: --target JSON 必須是 array（既有正式題庫）`);
    process.exit(2);
  }

  // ---------- 3. 建 validation index + 既有 target id 集合 ----------
  /** Map<sourceItemId, validationItem[]> */
  const validationByItemId = new Map();
  for (const v of validationData.items) {
    const sid = v?.sourceItemId;
    if (!sid) continue;
    if (!validationByItemId.has(sid)) validationByItemId.set(sid, []);
    validationByItemId.get(sid).push(v);
  }
  const existingIds = new Set();
  for (const q of targetData) {
    if (q && nonEmptyString(q.id)) existingIds.add(q.id);
  }

  // ---------- 4. 對每筆 reviewed item 分流 + 轉換（暫時標 ready，duplicate 檢查延後到 4.5） ----------
  const outItems = [];
  const tentativelyReady = []; // 暫存「轉換成功、待 duplicate 檢查」的 ExamQuestion + outItem reference
  const totalReviewed = reviewedData.items.length;
  let validationPassedCount = 0;

  for (const r of reviewedData.items) {
    const outItem = makeOutItem(r);
    const cls = classifyReviewedItem(r, validationByItemId);
    if (!cls.eligible) {
      outItem.status = "skipped";
      outItem.warnings.push({ code: cls.reason, message: cls.message });
      outItems.push(outItem);
      continue;
    }
    validationPassedCount += 1;
    // 轉換
    const conv = convertFinalQuestionToExamQuestion(r.reviewerFields.finalQuestion, r);
    if (!conv.ok) {
      // unsupported_question_type → status=skipped；其他（含 invalid_question_source）→ status=failed
      const isUnsupported = conv.errors.some((e) => e.code === "unsupported_question_type");
      outItem.status = isUnsupported ? "skipped" : "failed";
      outItem.errors = conv.errors;
      outItems.push(outItem);
      continue;
    }
    // 暫時標 ready；duplicate 檢查在 4.5 統一處理（拆 target / batch）
    outItem.status = "ready";
    outItem.question = conv.question;
    outItems.push(outItem);
    tentativelyReady.push({ outItem, question: conv.question });
  }

  // ---------- 4.5. Duplicate id 檢查（P3-10-K 修補 2026-05-14：拆 target / batch 兩種） ----------
  // 先統計 ready batch 內部 id 出現次數
  const batchIdCounts = new Map();
  for (const r of tentativelyReady) {
    const id = r.question.id;
    batchIdCounts.set(id, (batchIdCounts.get(id) ?? 0) + 1);
  }
  // 再對每筆 tentatively ready 標記 in_target / in_batch（兩者可同時觸發）
  for (const r of tentativelyReady) {
    const id = r.question.id;
    const inTarget = existingIds.has(id);
    const batchCount = batchIdCounts.get(id) ?? 0;
    const inBatch = batchCount >= 2;
    if (inTarget) {
      r.outItem.status = "skipped";
      r.outItem.warnings.push({
        code: "duplicate_id_in_target",
        message:
          `finalQuestion.id="${id}" 已存在於 --target 既有正式題目；` +
          "preview mode 標記、write mode 將整批 exit 2 拒絕寫入。",
      });
    }
    if (inBatch) {
      r.outItem.status = "skipped";
      r.outItem.warnings.push({
        code: "duplicate_id_in_batch",
        message:
          `finalQuestion.id="${id}" 在本批 ${batchCount} 筆 ready items 內重複；` +
          "**全部** skip 不寫入正式題庫，reviewer 需在 reviewed file 修一筆的 id 才能 ready。",
      });
    }
  }

  // ---------- 5. 套用 --limit（只對「duplicate 檢查後仍 ready」條目） ----------
  const stillReady = tentativelyReady.filter((r) => r.outItem.status === "ready");
  const overLimit = stillReady.slice(limit);
  const withinLimit = stillReady.slice(0, limit);
  for (const r of overLimit) {
    r.outItem.status = "skipped";
    r.outItem.warnings.push({
      code: "skip_due_to_limit",
      message: `--limit=${limit} 限制：本批只取前 ${limit} 筆 ready 條目；本筆超過上限。`,
    });
    r.outItem.question = null;
  }

  // ---------- 6. 統計（duplicate id 拆兩種；P3-10-K 修補 2026-05-14） ----------
  const duplicateIdsInTarget = [
    ...new Set(
      outItems
        .filter((it) => it.warnings.some((w) => w.code === "duplicate_id_in_target"))
        .map((it) => it.finalQuestionId)
        .filter(Boolean),
    ),
  ];
  const duplicateIdsInBatch = [
    ...new Set(
      outItems
        .filter((it) => it.warnings.some((w) => w.code === "duplicate_id_in_batch"))
        .map((it) => it.finalQuestionId)
        .filter(Boolean),
    ),
  ];
  const duplicateIdsAll = [
    ...new Set([...duplicateIdsInTarget, ...duplicateIdsInBatch]),
  ];
  const readyCount = outItems.filter((it) => it.status === "ready").length;
  const skipped = outItems.filter((it) => it.status === "skipped").length;
  const failed = outItems.filter((it) => it.status === "failed").length;

  // ---------- 7. 先寫 preview JSON（讓 reviewer 即使遇到 write+duplicate exit 2 也能檢視內容） ----------
  const payload = {
    batchId: makeBatchId("approvebatch"),
    createdAt: new Date().toISOString(),
    source: APPROVE_VERSION,
    mode: args.mode,
    write: args.write,
    reviewedInput: reviewedPath,
    validationInput: validationPath,
    target: targetPath,
    summary: {
      totalReviewed,
      validationPassed: validationPassedCount,
      readyToAppend: readyCount,
      skipped,
      failed,
      // P3-10-K 修補（2026-05-14）：duplicateIds 仍記「target + batch 聯集數量」，新增兩個分項。
      duplicateIds: duplicateIdsAll.length,
      duplicateIdsInTarget: duplicateIdsInTarget.length,
      duplicateIdsInBatch: duplicateIdsInBatch.length,
      targetExistingCount: targetData.length,
    },
    items: outItems,
  };
  await writeJson(outPath, payload);
  console.error(
    `[approve] wrote preview to ${outPath} — totalReviewed=${totalReviewed} ` +
      `validationPassed=${validationPassedCount} readyToAppend=${readyCount} ` +
      `skipped=${skipped} failed=${failed} ` +
      `duplicateIds=${duplicateIdsAll.length}` +
      `(target=${duplicateIdsInTarget.length},batch=${duplicateIdsInBatch.length})`,
  );

  // ---------- 8. write mode 全域 duplicate id gate（preview 已寫，可安全 exit 2） ----------
  const targetWillBeWritten = args.mode === "write" && args.write === true;
  if (targetWillBeWritten && duplicateIdsAll.length > 0) {
    const parts = [];
    if (duplicateIdsInTarget.length > 0)
      parts.push(`target=[${duplicateIdsInTarget.join(", ")}]`);
    if (duplicateIdsInBatch.length > 0)
      parts.push(`batch=[${duplicateIdsInBatch.join(", ")}]`);
    console.error(
      `Error: write mode 偵測到 ${duplicateIdsAll.length} 筆 duplicate id（${parts.join(" / ")}）；為避免覆寫既有正式題目或破壞 batch id 唯一性，**整批拒絕寫入** + exit 2。\n` +
        `   preview JSON 已寫至 ${outPath}，reviewer 可檢視 items[].warnings 找出 duplicate_id_in_target / duplicate_id_in_batch 條目。\n` +
        "請於 reviewed file 改 id（建議 q-{type-tag}-imp-{nnn}），或從 target 移除既有同 id 題目後重跑。",
    );
    process.exit(2);
  }

  // ---------- 9. 真寫 target（僅 write mode + --write yes 且無 duplicate） ----------
  if (targetWillBeWritten) {
    if (withinLimit.length === 0) {
      console.error(
        `[approve] write mode 但 readyToAppend=0；不寫 target。preview JSON 已寫至 ${outPath}；reviewer 可檢查 skipped / failed 原因。`,
      );
      return;
    }
    const newTarget = [...targetData, ...withinLimit.map((r) => r.question)];
    await writeJson(targetPath, newTarget);
    console.error(
      `[approve] **已寫入 target**：${targetPath} 從 ${targetData.length} 題擴張到 ${newTarget.length} 題（追加 ${withinLimit.length} 題）。\n` +
        "  reviewer 請手動 git diff 確認後再 commit。",
    );
  } else {
    console.error(
      `[approve] mode=preview / --write=${args.write ? "yes" : "no"}：**未寫 target**；正式題庫 ${targetPath} 完全未動。`,
    );
  }
}

const isCliInvocation =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCliInvocation) {
  main().catch((err) => {
    console.error(`[approve] unexpected error: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
