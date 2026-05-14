#!/usr/bin/env node
/**
 * scripts/assemble_practice_paper.mjs
 *
 * P3-10-K 第二刀：first practice paper 組裝 / paper-level metadata CLI（v0.1，2026-05-14）。
 *
 * 對應 lib/types.ts `ExamPaper` / `ExamSection` / `SourceMix` 與 docs/DATA_SCHEMA.md /
 *      docs/STARTERS_PART_TEMPLATES.md。
 *
 * 用途：
 *   - 讀正式題庫（data/p3-example-questions.json）+ 既有 papers 集合（data/exam-papers.example.json）
 *   - 依 starterSection 分 sections（listening / reading-writing / speaking）
 *   - 統計 sourceMix（official_sample / past_paper / ai_generated / custom 各題數）
 *   - 對齊 Cambridge Starters 9 Parts（L1-L4 / RW1-RW5）標記缺少 part（warning：
 *     insufficient_questions_for_part）
 *   - 預設 mode=preview，僅寫 preview JSON、**不動正式 papers 檔**
 *   - mode=write + --write yes 才 append 新 paper 到 --papers；duplicate paper id 整批 exit 2
 *
 * 硬邊界（對齊 P3-10-K 第二刀任務單）：
 *   - ❌ 不讓 /quiz 切到 imported 題庫（不動 lib/data.ts 任何載入流程）
 *   - ❌ 不大改 schema；CLI 直接套用 lib/types.ts 既有 ExamPaper / ExamSection 結構
 *   - ❌ 不自動產生題目；不呼叫 OpenAI；不下載 PDF / image / audio；不解析 PDF
 *   - ❌ 不改 data/p3-example-questions.json
 *   - ❌ 不直接改 data/exam-papers.example.json（除非 --mode write --write yes，且 reviewer
 *        應只對 /tmp target 實機測試確認）
 *   - ❌ 不覆蓋既有 paper（duplicate paper id 全域 exit 2）
 *   - ❌ 不硬造題：題目不足某 part 時只 warning，不偽造資料
 *
 * 使用方式：
 *   help：
 *     node scripts/assemble_practice_paper.mjs --help
 *
 *   preview（預設、絕對安全）：
 *     node scripts/assemble_practice_paper.mjs \
 *       --questions data/p3-example-questions.json \
 *       --papers data/exam-papers.example.json \
 *       --out data/imported/practice-paper.preview.generated.json \
 *       --mode preview \
 *       --paper-id starters-practice-paper-001 \
 *       --limit 20
 *
 *   write（雙開關；建議先 preview 確認）：
 *     node scripts/assemble_practice_paper.mjs ... --mode write --write yes
 *
 * exit code：
 *   0  成功
 *   1  未預期錯誤
 *   2  CLI 參數錯 / 必填檔不存在 / JSON parse 失敗 / questions 不是 array /
 *       mode=write 缺 --write yes / write mode + duplicate paper id
 */

import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

// ===========================================================================
// 0. 常數
// ===========================================================================

const ASSEMBLE_VERSION = "assemble_practice_paper.mjs@v0.1";
const SUPPORTED_MODES = new Set(["preview", "write"]);
const DEFAULT_LIMIT = 20;

// 對齊 lib/types.ts QuestionSource union（4 種）
const ALLOWED_QUESTION_SOURCES = ["official_sample", "past_paper", "ai_generated", "custom"];

// 對齊 lib/types.ts StarterSection 三種 + section metadata
const SECTION_DEFINITIONS = [
  {
    id: "listening",
    title: "Listening",
    description: "聽音檔選正確答案",
    starterSection: "listening",
    listeningTypes: new Set(["listening-choice"]),
  },
  {
    id: "reading-writing",
    title: "Reading & Writing",
    description: "看圖、選字、填空、連連看、yes / no 判斷、看圖拼字",
    starterSection: "reading-writing",
    listeningTypes: new Set(),
  },
  {
    id: "speaking",
    title: "Speaking",
    description: "口說題（屬 P4 Speaking Examiner Agent 範圍；本輪 paper 通常 0 題）",
    starterSection: "speaking",
    listeningTypes: new Set(),
  },
];

// 對齊 docs/STARTERS_PART_TEMPLATES.md 9 個 Cambridge Starters Parts
const STARTERS_PARTS = [
  { part: "L1", section: "listening" },
  { part: "L2", section: "listening" },
  { part: "L3", section: "listening" },
  { part: "L4", section: "listening" },
  { part: "RW1", section: "reading-writing" },
  { part: "RW2", section: "reading-writing" },
  { part: "RW3", section: "reading-writing" },
  { part: "RW4", section: "reading-writing" },
  { part: "RW5", section: "reading-writing" },
];

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(__dirname, "..");
const DEFAULT_OUT = resolve(
  REPO_ROOT,
  "data",
  "imported",
  "practice-paper.preview.generated.json",
);

const HELP_TEXT = `\nassemble_practice_paper.mjs — P3-10-K 第二刀 first practice paper 組裝 CLI v0.1\n
Usage:
  preview（預設、絕對安全；**不動正式 papers 檔**）：
    node scripts/assemble_practice_paper.mjs \\
      --questions data/p3-example-questions.json \\
      --papers data/exam-papers.example.json \\
      --out data/imported/practice-paper.preview.generated.json \\
      --mode preview \\
      --paper-id starters-practice-paper-001 \\
      --limit ${DEFAULT_LIMIT}

  write（**雙開關**：必須同時 --mode write + --write yes）：
    node scripts/assemble_practice_paper.mjs ... --mode write --write yes

Options:
  --questions <path>      必填；正式題庫路徑（建議 data/p3-example-questions.json）
  --papers <path>         必填；既有 papers 集合路徑（建議 data/exam-papers.example.json）
  --out <path>            選填；preview JSON 路徑（預設 data/imported/practice-paper.preview.generated.json）
  --mode <mode>           選填；preview（預設）/ write
  --write <yes|no>        選填；預設 no；write mode 必須 yes 才允許 append paper 到 --papers
  --paper-id <id>         必填；新 paper 的 examPaperId；不可與 --papers 內既有 paper 重複
  --limit <n>             選填；最多納入 N 題（預設 ${DEFAULT_LIMIT}）；超過的題目不進 paper
                          並標 skip_due_to_limit
  --help                  印此使用說明

組裝策略（v0.1 保守）：
  - 從 --questions 讀所有題目；不挑題、不重排，**保留原 array 順序**
  - 依題目 starterSection 分組到 3 個 sections：listening / reading-writing / speaking
      * starterSection 缺值 → 依 question.type fallback：listening-choice → listening，其他 → reading-writing
      * 沒任何題目落入的 section **不會**出現在最終 paper（避免空 section）
  - sourceMix：每題 question.source 累計到 4 種 QuestionSource union 對應計數
      （official_sample / past_paper / ai_generated / custom）；不在 union 的 source 標 warning
  - --limit 限制總題數；超過的題目標 skip_due_to_limit warning（前 N 題進 paper、其餘略過）
  - 對 9 個 Cambridge Starters Parts（L1-L4 / RW1-RW5）逐一檢查；若某 part 觀察到 0 題
    → 標 warning insufficient_questions_for_part（reviewer 可看出哪些 part 還缺題目）
  - **不硬造題**、**不重排既有題目**、**不修改 question 內容 / id**

Hard constraints：
  - 不呼叫 OpenAI / 不下載 PDF / image / audio
  - 不改 --questions 檔（唯讀）
  - 預設 preview：對 --papers 也唯讀
  - write mode 雙開關才能寫；duplicate paper id 整批 exit 2
  - 不讓 /quiz 切到本輪輸出（lib/data.ts 完全不動）

Warning code：
  no_questions_available              --questions 是空 array（仍寫 preview、exit 0）
  unknown_starter_section_fallback    question.starterSection 不在 listening/reading-writing/speaking
  unknown_source_value                question.source 不在 QuestionSource union
  insufficient_questions_for_part     9 個 Starters parts 中某 part 觀察到 0 題
  skip_due_to_limit                   超過 --limit 的題目（不進 paper）
  duplicate_paper_id                  --paper-id 與 --papers 內既有 examPaperId 重複
  paper_has_zero_sections             組完後 paper.sections 為空（仍寫 preview、不寫 target）

Examples:
  node scripts/assemble_practice_paper.mjs \\
    --questions data/p3-example-questions.json \\
    --papers data/exam-papers.example.json \\
    --out data/imported/practice-paper.preview.generated.json \\
    --mode preview \\
    --paper-id starters-practice-paper-001 \\
    --limit 20
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
    questions: null,
    papers: null,
    out: null,
    mode: "preview",
    write: false,
    paperId: null,
    limit: null,
    help: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") {
      out.help = true;
    } else if (arg === "--questions") {
      out.questions = argv[++i];
    } else if (arg === "--papers") {
      out.papers = argv[++i];
    } else if (arg === "--out") {
      out.out = argv[++i];
    } else if (arg === "--mode") {
      out.mode = argv[++i];
    } else if (arg === "--write") {
      out.write = parseYesNo(argv[++i], "--write");
    } else if (arg === "--paper-id") {
      out.paperId = argv[++i];
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
  if (!args.questions) {
    throw new Error("--questions is required（建議 data/p3-example-questions.json）");
  }
  if (!args.papers) {
    throw new Error("--papers is required（建議 data/exam-papers.example.json）");
  }
  if (!args.paperId || !args.paperId.trim()) {
    throw new Error("--paper-id is required（新 paper 的 examPaperId）");
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

// ===========================================================================
// 3. Section 分組 + sourceMix 統計
// ===========================================================================

/**
 * 把單一題目歸到一個 section.id。
 * 依 starterSection；缺值時依 type fallback。
 */
function decideSectionId(question, warnings) {
  const ss = question?.starterSection;
  if (nonEmptyString(ss)) {
    const found = SECTION_DEFINITIONS.find((s) => s.starterSection === ss);
    if (found) return found.id;
    warnings.push({
      code: "unknown_starter_section_fallback",
      message:
        `question id="${question?.id}" starterSection="${ss}" 不在 listening / reading-writing / speaking；` +
        "fallback 依 question.type 決定（listening-choice → listening；其他 → reading-writing）。",
    });
  }
  if (question?.type === "listening-choice") return "listening";
  return "reading-writing";
}

function buildSections(questions, warnings, limit) {
  // 第一步：對所有題目套 limit；超過的標 skip_due_to_limit
  const includedQs = [];
  for (let i = 0; i < questions.length; i++) {
    if (includedQs.length < limit) {
      includedQs.push(questions[i]);
    } else {
      warnings.push({
        code: "skip_due_to_limit",
        message:
          `--limit=${limit} 限制：題目 id="${questions[i]?.id}"（第 ${i + 1} 筆）超過上限、不進 paper。`,
      });
    }
  }

  // 第二步：分組
  const sectionBuckets = new Map(); // section.id → questionIds[]
  for (const q of includedQs) {
    if (!nonEmptyString(q?.id)) continue;
    const sid = decideSectionId(q, warnings);
    if (!sectionBuckets.has(sid)) sectionBuckets.set(sid, []);
    sectionBuckets.get(sid).push(q.id);
  }

  // 第三步：依 SECTION_DEFINITIONS 順序回傳 ExamSection[]，**沒題目的 section 不出現**
  const sections = [];
  for (const def of SECTION_DEFINITIONS) {
    const ids = sectionBuckets.get(def.id) ?? [];
    if (ids.length === 0) continue;
    sections.push({
      id: def.id,
      title: def.title,
      description: def.description,
      questionIds: ids,
    });
  }
  return { sections, includedQs };
}

function computeSourceMix(questions, warnings) {
  const mix = {};
  for (const src of ALLOWED_QUESTION_SOURCES) mix[src] = 0;
  let totalKnown = 0;
  const unknownSourceIds = [];
  for (const q of questions) {
    const src = q?.source;
    if (ALLOWED_QUESTION_SOURCES.includes(src)) {
      mix[src] += 1;
      totalKnown += 1;
    } else {
      unknownSourceIds.push({ id: q?.id ?? "(no-id)", source: src ?? null });
    }
  }
  // 移除為 0 的 key 讓 sourceMix 緊湊（對齊既有 example：只列有題目的 source）
  const compact = {};
  for (const src of ALLOWED_QUESTION_SOURCES) {
    if (mix[src] > 0) compact[src] = mix[src];
  }
  if (unknownSourceIds.length > 0) {
    warnings.push({
      code: "unknown_source_value",
      message:
        `${unknownSourceIds.length} 題的 source 不在 QuestionSource union（official_sample / past_paper / ai_generated / custom）；` +
        `未計入 sourceMix：${unknownSourceIds
          .slice(0, 5)
          .map((u) => `id="${u.id}" source=${JSON.stringify(u.source)}`)
          .join(" / ")}${unknownSourceIds.length > 5 ? " ..." : ""}`,
    });
  }
  return { sourceMix: compact, totalKnown };
}

function checkPartCoverage(questions, warnings) {
  /** Map<part, count> */
  const partCounts = new Map();
  for (const def of STARTERS_PARTS) partCounts.set(def.part, 0);
  for (const q of questions) {
    const p = q?.starterPart;
    if (nonEmptyString(p) && partCounts.has(p)) {
      partCounts.set(p, (partCounts.get(p) ?? 0) + 1);
    }
  }
  const partBreakdown = {};
  for (const def of STARTERS_PARTS) {
    const c = partCounts.get(def.part) ?? 0;
    partBreakdown[def.part] = c;
    if (c === 0) {
      warnings.push({
        code: "insufficient_questions_for_part",
        message:
          `Cambridge Starters Part ${def.part}（section=${def.section}）目前正式題庫中 0 題；` +
          "建議後續刀數補題（屬 P3-10-G / H / I / J 範圍）。",
      });
    }
  }
  return partBreakdown;
}

// ===========================================================================
// 4. main
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

  const questionsPath = resolve(args.questions);
  const papersPath = resolve(args.papers);
  const outPath = args.out ? resolve(args.out) : DEFAULT_OUT;
  const limit = args.limit ?? DEFAULT_LIMIT;

  console.error(
    `[assemble] mode=${args.mode} write=${args.write ? "yes" : "no"} questions=${questionsPath} ` +
      `papers=${papersPath} out=${outPath} paper-id=${args.paperId} limit=${limit}`,
  );

  // 1. write mode 雙開關
  if (args.mode === "write" && args.write !== true) {
    console.error(
      "Error: --mode write 必須同時搭配 --write yes 才會實際寫入 --papers。\n" +
        "本輪 v0.1 設計**雙開關**避免無意識寫入。若仍想寫，請完整指令：\n" +
        "  --mode write --write yes\n" +
        "若要先檢查、不寫，請改 --mode preview。",
    );
    process.exit(2);
  }

  // 2. 讀檔
  if (!(await fileExists(questionsPath))) {
    console.error(`Error: --questions 檔不存在：${questionsPath}`);
    process.exit(2);
  }
  if (!(await fileExists(papersPath))) {
    console.error(`Error: --papers 檔不存在：${papersPath}`);
    process.exit(2);
  }
  let questionsData;
  let papersData;
  try {
    questionsData = await readJsonFile(questionsPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  try {
    papersData = await readJsonFile(papersPath);
  } catch (err) {
    console.error(`Error: ${err.message}`);
    process.exit(2);
  }
  if (!Array.isArray(questionsData)) {
    console.error(`Error: --questions JSON 必須是 array（ExamQuestion[]）：${questionsPath}`);
    process.exit(2);
  }
  if (!Array.isArray(papersData)) {
    console.error(`Error: --papers JSON 必須是 array（ExamPaper[]）：${papersPath}`);
    process.exit(2);
  }

  const warnings = [];

  // 3. empty questions：仍寫 preview、不 crash
  if (questionsData.length === 0) {
    warnings.push({
      code: "no_questions_available",
      message:
        `--questions 為空 array（${questionsPath}）；組裝會得到空 paper。` +
        "建議先跑 P3-10-K approved → ExamQuestion 轉換 CLI，或人工補題到 data/p3-example-questions.json。",
    });
  }

  // 4. 組 sections + sourceMix + part coverage
  const { sections, includedQs } = buildSections(questionsData, warnings, limit);
  const { sourceMix } = computeSourceMix(includedQs, warnings);
  const partBreakdown = checkPartCoverage(includedQs, warnings);
  if (sections.length === 0) {
    warnings.push({
      code: "paper_has_zero_sections",
      message:
        "組完後 paper.sections 為空（沒任何題目分到 listening / reading-writing / speaking）；" +
        "本輪仍寫 preview 供 reviewer 檢視，但 write mode 會跳過 target append。",
    });
  }

  // 5. duplicate paper id 檢查（preview / write 都做、行為不同）
  const existingPaperIds = new Set();
  for (const p of papersData) {
    if (p && nonEmptyString(p.examPaperId)) existingPaperIds.add(p.examPaperId);
  }
  const isDuplicatePaperId = existingPaperIds.has(args.paperId);
  if (isDuplicatePaperId) {
    warnings.push({
      code: "duplicate_paper_id",
      message:
        `--paper-id "${args.paperId}" 已存在於 --papers 既有 papers（${papersPath}）；` +
        "preview mode 標記、write mode 將 exit 2 拒絕覆蓋。" +
        "請改 --paper-id（建議帶日期或 v2 後綴）或先從 papers 移除既有同 id paper。",
    });
  }

  // 6. 組 ExamPaper
  const now = new Date().toISOString();
  const examPaper = {
    examPaperId: args.paperId,
    title: `Cambridge Starters 練習卷（${args.paperId}）`,
    description:
      "P3-10-K 第二刀 first practice paper 組裝 preview；題目由 data/p3-example-questions.json 自動分組，未經 reviewer paper-level 審核；** /quiz 尚未切到本卷**。",
    sections,
    sourceMix,
    createdAt: now,
    updatedAt: now,
  };

  // 7. 組 preview JSON
  const totalQuestionsAvailable = questionsData.length;
  const totalQuestionsSelected = sections.reduce((acc, s) => acc + s.questionIds.length, 0);
  const payload = {
    batchId: makeBatchId("paperbatch"),
    createdAt: now,
    source: ASSEMBLE_VERSION,
    mode: args.mode,
    write: args.write,
    questionsInput: questionsPath,
    papersInput: papersPath,
    summary: {
      totalQuestionsAvailable,
      totalQuestionsSelected,
      sections: sections.length,
      sourceMix,
      partBreakdown,
      warnings: warnings.length,
      isDuplicatePaperId,
      existingPapersCount: papersData.length,
    },
    paper: examPaper,
    warnings,
  };
  await writeJson(outPath, payload);
  console.error(
    `[assemble] wrote preview to ${outPath} — ` +
      `totalAvailable=${totalQuestionsAvailable} totalSelected=${totalQuestionsSelected} ` +
      `sections=${sections.length} warnings=${warnings.length} ` +
      `duplicatePaperId=${isDuplicatePaperId ? "yes" : "no"}`,
  );

  // 8. write mode：duplicate paper id → exit 2；empty paper → 不寫 target；否則 append
  const targetWillBeWritten = args.mode === "write" && args.write === true;
  if (targetWillBeWritten && isDuplicatePaperId) {
    console.error(
      `Error: write mode 偵測到 --paper-id "${args.paperId}" 與 --papers 既有 paper 重複；` +
        `為避免覆蓋既有 paper，**整批拒絕寫入** + exit 2。\n` +
        `   preview JSON 已寫至 ${outPath}，reviewer 可檢視 warnings 內 duplicate_paper_id。\n` +
        "請改 --paper-id 或從 --papers 移除既有同 id paper 後重跑。",
    );
    process.exit(2);
  }
  if (targetWillBeWritten && sections.length === 0) {
    console.error(
      `[assemble] write mode 但 paper.sections=0（沒題目可組）；不寫 target；preview JSON 已寫至 ${outPath}。`,
    );
    return;
  }
  if (targetWillBeWritten) {
    const newPapers = [...papersData, examPaper];
    await writeJson(papersPath, newPapers);
    console.error(
      `[assemble] **已寫入 papers**：${papersPath} 從 ${papersData.length} 份擴張到 ${newPapers.length} 份（追加 examPaperId="${args.paperId}"）。\n` +
        "  reviewer 請手動 git diff 確認後再 commit；本輪 CLI 不自動 commit。\n" +
        "  注意：/quiz 仍未切到本卷；屬 P3-10-K 後續刀數（lib/data.ts 載入邏輯）範圍。",
    );
  } else {
    console.error(
      `[assemble] mode=preview / --write=${args.write ? "yes" : "no"}：**未寫 --papers**；既有 papers 完全未動。`,
    );
  }
}

const isCliInvocation =
  import.meta.url === pathToFileURL(process.argv[1] ?? "").href;
if (isCliInvocation) {
  main().catch((err) => {
    console.error(`[assemble] unexpected error: ${err.stack ?? err.message}`);
    process.exit(1);
  });
}
