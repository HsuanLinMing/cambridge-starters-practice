# Claude Code 回報 · P3-10-K 第二刀：first practice paper 組裝 / paper-level metadata（部分完成）

任務日期：2026-05-14
任務性質：**P3-10-K 系列第二刀**——把 P3-10-K v0.1 / v0.1.1 已落地的「單題級 approved → ExamQuestion 轉換」往上一層，做 **paper-level 組裝**：讀正式題庫 `data/p3-example-questions.json` 內 13 題 → 依 `starterSection` 分組成 `ExamPaper` → 寫 preview JSON。本輪硬邊界全遵守：未讓 `/quiz` 切到 imported 題庫；未大改 `lib/data.ts` 載入流程（**完全未動**）；未改 UI / quiz / review UI；未呼叫 OpenAI；未下載 PDF / image / audio；未解析 PDF；未自動產生題目；未改 `data/p3-example-questions.json`；未直接改 `data/exam-papers.example.json`（測試只用 /tmp target）；未覆蓋既有 paper；未新增 npm 依賴；未處理 npm audit；未部署；未 commit `.env.local`；未 commit `.generated.json`；未 commit `.claude/settings.local.json`；未紀錄真實 API key。

## 【本輪修改摘要】

1. **新增 `scripts/assemble_practice_paper.mjs` v0.1**（~450 行，4 段結構，7 個 flag）。
2. **3 個必填 flag**（`--questions` / `--papers` / `--paper-id`）+ 4 個選填（`--out` 預設 `data/imported/practice-paper.preview.generated.json` / `--mode preview|write` / `--write yes|no` / `--limit` 預設 20）+ `--help`。
3. **雙開關保護**：`--mode write` 必須同時 `--write yes` 才能 append 新 paper 到 `--papers`；缺一就 exit 2。
4. **組裝策略 v0.1 保守**：
   - 不挑題、不重排（保留原 array 順序）
   - 依 `starterSection` 分組到 3 個 section（listening / reading-writing / speaking），缺值依 `question.type` fallback
   - 沒題目的 section **不出現**（避免空 section）
   - `--limit` 限制總題數，超過的標 `skip_due_to_limit` warning
   - sourceMix 由 `question.source` 累計 4 種 QuestionSource union 值（不在 union 標 `unknown_source_value` 不計入）
   - 對 9 個 Cambridge Starters Parts 檢查覆蓋率，0 題標 `insufficient_questions_for_part`
   - **不硬造題、不修改 question 內容 / id**
5. **Duplicate paper id 全域 gate**：preview 標 warning + JSON 仍寫；write mode → exit 2 + preview 仍寫 + target 不動。
6. **Empty questions 行為**：仍寫 preview + warning `no_questions_available`、exit 0；write mode 不寫 target。
7. **對齊 `lib/types.ts` 實際 schema**：使用 `examPaperId`（不是 `id`，與任務單建議範例不同）；**不寫入 `level` 欄位**（schema 沒有此欄位，避免污染正式型別）。
8. **8 種 CLI 測試全綠**：見「測試結果」段；正式 `data/p3-example-questions.json` / `data/exam-papers.example.json` 整輪未被改動。
9. **`.gitignore` 加 1 行** `data/imported/practice-paper.preview.generated.json`。
10. **文件同步**——`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` 升 v4.2（F-pre-8-g 新增 7 子段）；`docs/PRACTICE_DATA_IMPORT_PLAN.md` C 段加第 7 步 + 原 7 降 8；`docs/PRACTICE_DATA_PLAN.md` + `PROJECT_ROADMAP.md` 新增 P3-10-K 第二刀 🟡 條目。

`npm run lint` / `typecheck` / `build` 全綠（88 routes 不變、**無新依賴**）。**P3-10-K 第二刀 🟡 部分完成；P3-10-K / P3-10 / P3 整體仍 🟡**。

## 【修改檔案清單】

新增 1 份；修改 5 份；未動既有題目 / 圖片 / 音檔 / UI / quiz / review / schema / data / 題庫 / .env：

新增：
- **`scripts/assemble_practice_paper.mjs`**：v0.1 約 450 行，4 段（常數 / CLI parsing / Section 分組 + sourceMix 統計 + Part 覆蓋率檢查 / main）；**無新 npm 依賴**。

修改：
- **`.gitignore`**：加 1 行 `data/imported/practice-paper.preview.generated.json`。
- **`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`**：F-pre-8 新增 F-pre-8-g（7 個子段，~85 行）；原 F-pre-8-g 更名 F-pre-8-h；G 段加 v4.2 升級紀錄。
- **`docs/PRACTICE_DATA_IMPORT_PLAN.md`**：C 段新增第 7 步「組裝 first practice paper（P3-10-K 第二刀 v0.1）」+ 原第 7 步「quiz / review 使用」降為第 8 步。
- **`docs/PRACTICE_DATA_PLAN.md`**：F 段新增 P3-10-K 第二刀 🟡 條目。
- **`PROJECT_ROADMAP.md`**：在原 P3-10-K 修補條目上方插一個獨立的 🟡 P3-10-K 第二刀 條目（按時序由新到舊排列），含本輪完整描述 / 8 種 CLI 測試結果 / 硬邊界 13 條 / 未做清單。

未動：`scripts/discover_resources.mjs` / `scripts/web_resource_collect.mjs` / `scripts/collect_discovered_resources.mjs` / `scripts/normalize_collected_sources.mjs` / `scripts/review_normalized_questions.mjs` / `scripts/approve_reviewed_questions.mjs`（**v0.1.1 完整保留**） / `scripts/generate_openai_tts_sample.mjs` / `lib/types.ts`（對齊使用既有 schema，未動 type 定義）/ `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / `components/QuizPlay.tsx` / 其他 components / **`data/p3-example-questions.json`（13 題完整保留）** / **`data/exam-papers.example.json`** / `data/vocabulary.json` / `data/quizzes.json` / `data/imported/*.example.json`（7 個範例完整保留）/ `public/images/` / `public/audio/` / `docs/DISCOVERY_CRAWLER_PLAN.md` / `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `docs/USER_TEST_NOTES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `README.md`（本輪沒新文件入口）/ `.env.example` / `source_materials/*` / `package.json`（無新依賴）/ `node_modules/`。

## 【Assemble CLI 說明】

### 4 段檔案結構

```
scripts/assemble_practice_paper.mjs
├── Section 0：常數
│   ├── ASSEMBLE_VERSION / SUPPORTED_MODES / DEFAULT_LIMIT
│   ├── ALLOWED_QUESTION_SOURCES（4 種，對齊 lib/types.ts QuestionSource union）
│   ├── SECTION_DEFINITIONS（listening / reading-writing / speaking 3 種對應 starterSection）
│   ├── STARTERS_PARTS（9 個 L1-L4 / RW1-RW5）
│   └── HELP_TEXT（含使用方式 / Options / 組裝策略 / 硬邊界 / Warning code 表 / Examples）
├── Section 1：CLI parsing（parseArgs / validateArgs；mode + 3 個必填 path 驗證）
├── Section 2：JSON / FS helpers（readJsonFile / writeJson / fileExists / makeBatchId / nonEmptyString）
├── Section 3：核心邏輯
│   ├── decideSectionId（單題 → section.id：starterSection 優先 / type fallback）
│   ├── buildSections（套 --limit / 分組到 section / 沒題目的 section 不出現）
│   ├── computeSourceMix（4 種 QuestionSource 累計 / 非 union 值 warning）
│   └── checkPartCoverage（9 個 Starters Parts；0 題 warning）
└── Section 4：main（讀檔 / write guard / empty questions / build paper / 寫 preview / write target gate / append target）
```

### CLI flag 表

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--questions <path>` | 必填 | — | 正式題庫路徑（建議 `data/p3-example-questions.json`） |
| `--papers <path>` | 必填 | — | 既有 papers 集合（建議 `data/exam-papers.example.json`） |
| `--out <path>` | 選填 | `data/imported/practice-paper.preview.generated.json` | preview JSON 寫檔路徑 |
| `--mode <mode>` | 選填 | `preview` | `preview`（預設、絕對安全）/ `write`（需雙開關） |
| `--write <yes\|no>` | 選填 | `no` | write mode 必須 yes 才允許 append paper；否則 exit 2 |
| `--paper-id <id>` | 必填 | — | 新 paper 的 examPaperId；不可與 --papers 內既有 paper 重複 |
| `--limit <n>` | 選填 | `20` | 最多納入 N 題；超過的標 `skip_due_to_limit` |
| `--help` | 選填 | — | 印 usage |

### exit code

| 情況 | exit code |
| --- | --- |
| 成功 | 0 |
| 未預期錯誤 | 1 |
| CLI 參數錯 / 必填檔不存在 / JSON parse 失敗 / questions 不是 array / mode=write 缺 `--write yes` / write mode + duplicate paper id | 2 |

### 與 P3-10-K v0.1.1（單題 approve）的關係

| 階段 | 工具 | 輸入 | 輸出 | 寫正式 |
| --- | --- | --- | --- | --- |
| K v0.1.1（單題） | `approve_reviewed_questions.mjs` | reviewed + validation + target | preview + 追加題到 `data/p3-example-questions.json` | 雙開關 + duplicate id gate 才寫 |
| **K 第二刀（本輪 paper）** | `assemble_practice_paper.mjs` | questions + papers + paper-id | preview + 追加 paper 到 `data/exam-papers.example.json` | 雙開關 + duplicate paper id gate 才寫 |
| ⬜ K 第三刀（未來） | 屬獨立刀數 | imported papers + lib/data.ts filter | `/quiz` 切換新 paper | 屬獨立刀數 |

## 【Paper schema / sections 說明】

### 對齊 lib/types.ts ExamPaper

```ts
export type ExamPaper = {
  examPaperId: string;          // ← 必填；CLI 從 --paper-id 取
  title: string;                 // ← 必填；CLI 自動生 "Cambridge Starters 練習卷（${paperId}）"
  description?: string;          // ← 選填；CLI 補本輪 P3-10-K 第二刀 disclaimer
  sections: ExamSection[];       // ← 必填；分 listening / reading-writing / speaking
  sourceMix?: SourceMix;         // ← 選填；CLI 由 question.source 統計
  createdAt?: string;            // ← 選填；CLI 取當下 ISO
  updatedAt?: string;            // ← 選填；CLI 取當下 ISO（首次組裝 = createdAt）
};
```

**注意實際 schema 細節**：
- 欄位是 `examPaperId`，**不是任務單範例的 `id`**——CLI 完全對齊 schema 字面量。
- 實際 schema **沒有 `level` 欄位**（任務單範例提到 `level: "Pre A1 Starters"`）——CLI **不寫入** `level`，避免污染正式型別；題庫 level 資訊由 paper.title 自然帶出。

### ExamSection 結構

```ts
export type ExamSection = {
  id: string;              // listening / reading-writing / speaking
  title: string;           // Listening / Reading & Writing / Speaking
  description?: string;    // 對應每 section 預設描述
  questionIds: string[];   // 該 section 內題目 id（不重排，依 --questions 原順序）
};
```

### 三個 SECTION_DEFINITIONS

CLI 內定義（與 lib/types.ts `StarterSection` union 完全對齊）：

| section.id | title | starterSection 對應 | type fallback |
| --- | --- | --- | --- |
| `listening` | Listening | `"listening"` | `listening-choice` |
| `reading-writing` | Reading & Writing | `"reading-writing"` | 其他所有 type |
| `speaking` | Speaking | `"speaking"` | （無 fallback；P4 未實作） |

**沒題目的 section 不會出現在最終 paper.sections[]**——避免 lib/data.ts 載入時 render 空 section。

### 9 個 Cambridge Starters Parts 覆蓋檢查

對齊 `docs/STARTERS_PART_TEMPLATES.md` 9 個 Parts，CLI 對每 part 計數 0 → 標 `insufficient_questions_for_part` warning：

| Part | Section | 目前題庫狀態（13 題版本） |
| --- | --- | --- |
| L1 | listening | **0 題** ⚠️ |
| L2 | listening | **0 題** ⚠️ |
| L3 | listening | 1 題（q-lc-001）|
| L4 | listening | **0 題** ⚠️ |
| RW1 | reading-writing | 3 題（q-pc-001 / q-tf-001 / q-tf-002）|
| RW2 | reading-writing | **0 題** ⚠️ |
| RW3 | reading-writing | 5 題（q-wc-001 / q-sp-001~004）|
| RW4 | reading-writing | 3 題（q-mc-001 / q-fb-001 / q-fb-002）|
| RW5 | reading-writing | 1 題（q-mt-001）|

⚠️ 4 個 part（L1 / L2 / L4 / RW2）為 0 題 → 4 個 `insufficient_questions_for_part` warnings。reviewer 可看出哪些 part 需要 P3-10-G / H / I / J 後續刀數補題。

## 【Preview 測試結果】

### Test 1：preview vs real data（13 題 / `--paper-id starters-practice-paper-001`）

```
$ node scripts/assemble_practice_paper.mjs \
    --questions data/p3-example-questions.json \
    --papers data/exam-papers.example.json \
    --out data/imported/practice-paper.preview.generated.json \
    --mode preview \
    --paper-id starters-practice-paper-001 \
    --limit 20
[assemble] mode=preview write=no ...
[assemble] wrote preview to .../practice-paper.preview.generated.json — totalAvailable=13 totalSelected=13 sections=2 warnings=4 duplicatePaperId=no
[assemble] mode=preview / --write=no：**未寫 --papers**；既有 papers 完全未動。
exit=0
```

preview JSON 內容：

```jsonc
{
  "summary": {
    "totalQuestionsAvailable": 13,
    "totalQuestionsSelected": 13,
    "sections": 2,
    "sourceMix": { "ai_generated": 9, "custom": 4 },
    "partBreakdown": {
      "L1": 0, "L2": 0, "L3": 1, "L4": 0,
      "RW1": 3, "RW2": 0, "RW3": 5, "RW4": 3, "RW5": 1
    },
    "warnings": 4,
    "isDuplicatePaperId": false,
    "existingPapersCount": 1
  },
  "paper": {
    "examPaperId": "starters-practice-paper-001",
    "title": "Cambridge Starters 練習卷（starters-practice-paper-001）",
    "description": "P3-10-K 第二刀 first practice paper 組裝 preview...",
    "sections": [
      { "id": "listening", "title": "Listening", "questionIds": ["q-lc-001"] },
      { "id": "reading-writing", "title": "Reading & Writing", "questionIds": [
        "q-mc-001", "q-pc-001", "q-wc-001", "q-fb-001", "q-fb-002", "q-mt-001",
        "q-tf-001", "q-sp-001", "q-sp-002", "q-sp-003", "q-sp-004", "q-tf-002"
      ]}
    ],
    "sourceMix": { "ai_generated": 9, "custom": 4 },
    "createdAt": "2026-05-14T...",
    "updatedAt": "2026-05-14T..."
  },
  "warnings": [
    { "code": "insufficient_questions_for_part", "message": "Cambridge Starters Part L1（section=listening）..." },
    { "code": "insufficient_questions_for_part", "message": "...L2..." },
    { "code": "insufficient_questions_for_part", "message": "...L4..." },
    { "code": "insufficient_questions_for_part", "message": "...RW2..." }
  ]
}
```

✅ 完全符合任務單需求：
- totalQuestionsAvailable=13、totalQuestionsSelected=13、sections=2（listening + reading-writing）
- sourceMix={ai_generated:9, custom:4} **與既有 example 完全一致**（驗證統計邏輯正確）
- 4 個 `insufficient_questions_for_part` warnings 對應 L1 / L2 / L4 / RW2 缺題
- isDuplicatePaperId=false（starters-practice-paper-001 不在既有 papers）
- 正式 papers 未動

### Test 8：`--limit 5` 限制題數

```
[assemble] wrote preview — totalAvailable=13 totalSelected=5 sections=2 warnings=13 duplicatePaperId=no
```

✅ totalSelected=5（前 5 題），其餘 8 題標 `skip_due_to_limit`（warnings 數從 4 跳到 13 = 4 原有 + 8 skip + 1 額外 part missing 因為被截）。

## 【Write guard 測試結果】

### Test 2：`--mode write` 缺 `--write yes` → exit 2

```
$ node scripts/assemble_practice_paper.mjs \
    --questions data/p3-example-questions.json \
    --papers data/exam-papers.example.json \
    --mode write \
    --paper-id starters-practice-paper-001
[assemble] mode=write write=no ...
Error: --mode write 必須同時搭配 --write yes 才會實際寫入 --papers。
本輪 v0.1 設計**雙開關**避免無意識寫入。若仍想寫，請完整指令：
  --mode write --write yes
若要先檢查、不寫，請改 --mode preview。
exit=2
```

✅ 符合雙開關保護設計。

### Test 7：write happy path vs `/tmp/target-papers.json`

```
$ echo '[]' > /tmp/target-papers.json
$ node scripts/assemble_practice_paper.mjs \
    --questions data/p3-example-questions.json \
    --papers /tmp/target-papers.json \
    --out /tmp/preview-happy.json \
    --mode write --write yes \
    --paper-id starters-imported-001 --limit 20
[assemble] **已寫入 papers**：/tmp/target-papers.json 從 0 份擴張到 1 份（追加 examPaperId="starters-imported-001"）。
  reviewer 請手動 git diff 確認後再 commit；本輪 CLI 不自動 commit。
  注意：/quiz 仍未切到本卷；屬 P3-10-K 後續刀數（lib/data.ts 載入邏輯）範圍。
exit=0
```

寫入後 `/tmp/target-papers.json` 內容：

```
papers count: 1
  examPaperId=starters-imported-001  title=Cambridge Starters 練習卷（starters-imported-001）
    sections=2  sourceMix={"ai_generated":9,"custom":4}
      listening: 1 題
      reading-writing: 12 題
```

✅ paper 結構完整、reviewer 看到「請手動 git diff」與「/quiz 仍未切換」提示。

## 【Duplicate paper id 保護】

### Test 3：duplicate paper id preview（`--paper-id starters-mock-001` 與既有衝突）

```
[assemble] wrote preview to /tmp/preview-dup.json — totalAvailable=13 totalSelected=13 sections=2 warnings=5 duplicatePaperId=yes
[assemble] mode=preview / --write=no：**未寫 --papers**；既有 papers 完全未動。
exit=0
```

```
isDuplicatePaperId: true
duplicate warnings: [ 'duplicate_paper_id' ]
```

✅ summary.isDuplicatePaperId=true；warnings 含 `duplicate_paper_id`；preview JSON 仍寫；exit 0（preview 不強制阻擋）。

### Test 4：duplicate paper id write mode → exit 2 + target 不動

```
$ cp data/exam-papers.example.json /tmp/papers-real-copy.json
$ node scripts/assemble_practice_paper.mjs \
    --questions data/p3-example-questions.json \
    --papers /tmp/papers-real-copy.json \
    --out /tmp/preview-dup-write.json \
    --mode write --write yes \
    --paper-id starters-mock-001
[assemble] wrote preview to /tmp/preview-dup-write.json — ... duplicatePaperId=yes
Error: write mode 偵測到 --paper-id "starters-mock-001" 與 --papers 既有 paper 重複；為避免覆蓋既有 paper，**整批拒絕寫入** + exit 2。
   preview JSON 已寫至 /tmp/preview-dup-write.json，reviewer 可檢視 warnings 內 duplicate_paper_id。
請改 --paper-id 或從 --papers 移除既有同 id paper 後重跑。
exit=2
$ diff -q /tmp/papers-real-copy.json data/exam-papers.example.json
（無輸出 = 完全相同）
```

✅ exit 2；preview 仍寫；/tmp/papers-real-copy.json **完全未動**。

## 【sourceMix 統計結果】

對 13 題正式題庫的 sourceMix 統計：

```
sourceMix: { "ai_generated": 9, "custom": 4 }
```

**與既有 `data/exam-papers.example.json` 內 `starters-mock-001` 的 sourceMix 完全一致**（`{ ai_generated: 9, custom: 4 }`），證明統計邏輯正確：

逐題分析（13 題）：
- ai_generated（9 題）：q-lc-001 / q-pc-001 / q-wc-001 / q-tf-001 / q-tf-002 / q-sp-001 / q-sp-002 / q-sp-003 / q-sp-004
- custom（4 題）：q-mc-001 / q-fb-001 / q-fb-002 / q-mt-001
- official_sample：0 題（不出現於 sourceMix；對齊 example 緊湊格式）
- past_paper：0 題（不出現於 sourceMix）

額外驗證：若 reviewer 之前用 `approve_reviewed_questions.mjs` 加題（其 v0.1.1 已驗證 source 必須在 union），新題會帶合法 source 進到本輪 sourceMix。若有題目 source 不在 union（理論上 v0.1.1 已 block），CLI 仍能 graceful 處理：標 `unknown_source_value` warning 並不計入。

## 【Output 格式檢查】

### preview / write 兩 mode 共用 schema

```jsonc
{
  "batchId": "paperbatch-2026-05-14T...",
  "createdAt": "...",
  "source": "assemble_practice_paper.mjs@v0.1",
  "mode": "preview" | "write",
  "write": true | false,
  "questionsInput": "<absolute path>",
  "papersInput": "<absolute path>",
  "summary": {
    "totalQuestionsAvailable": <int>,           // questions 檔內題目數
    "totalQuestionsSelected": <int>,             // 進入 paper.sections 的題目數
    "sections": <int>,                            // paper.sections 長度
    "sourceMix": { ... },                         // 與 paper.sourceMix 同值
    "partBreakdown": {                            // 9 個 Cambridge Starters Parts 題數
      "L1": N, "L2": N, ..., "RW5": N
    },
    "warnings": <int>,                            // warnings[] 長度
    "isDuplicatePaperId": <bool>,                 // --paper-id 與既有 papers 重複
    "existingPapersCount": <int>                  // --papers 內既有 paper 數
  },
  "paper": {
    // 完整 ExamPaper 物件，可直接 commit 到 --papers
    "examPaperId": "<--paper-id>",
    "title": "...",
    "description": "...",
    "sections": [
      { "id", "title", "description", "questionIds": [...] }
    ],
    "sourceMix": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "warnings": [ { "code", "message" } ]
}
```

### 任務單檢查清單

| 檢查項 | 結果 |
| --- | --- |
| preview JSON 是否存在 | ✅ `data/imported/practice-paper.preview.generated.json` 已寫 |
| summary 是否合理 | ✅ 8 個欄位含 `isDuplicatePaperId` / `partBreakdown` 額外 metadata |
| paper.id 是否符合 schema | ✅ 使用 `examPaperId`（不是 `id`），對齊 lib/types.ts |
| sourceMix 由 question.source 統計 | ✅ 13 題 → ai_generated=9 / custom=4，與既有 example 一致 |
| sections 依 starterPart / starterSection 分組 | ✅ 依 starterSection 分組到 listening / reading-writing 兩 section |
| 題目不足某 part 有 warning | ✅ L1 / L2 / L4 / RW2 共 4 個 `insufficient_questions_for_part` |
| preview 不改 papers target | ✅ `data/exam-papers.example.json` git diff HEAD 一致 |
| paper id duplicate write mode exit 2 | ✅ Test 4 驗證；preview 仍寫；target 未動 |
| generated output 被 gitignore 排除 | ✅ `.gitignore:56` 命中 |

## 【文件同步內容】

### `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` v4.2

F-pre-8 新增 **F-pre-8-g 段「P3-10-K 第二刀」** 共 7 個子段：
- 兩個 mode + 雙開關
- 組裝策略 v0.1 保守
- sourceMix 統計規則
- Part 覆蓋率檢查
- Duplicate paper id 保護
- Output schema
- Warning code 表 + v0.1 不做清單

原 F-pre-8-g「不在 v0.1 範圍」更名 F-pre-8-h。G 段加 v4.2 升級紀錄保留 v4.1 / v4 / v3.1 / v3 / v2 / v1。

### `docs/PRACTICE_DATA_IMPORT_PLAN.md`

C 段流程新增第 7 步「組裝 first practice paper（P3-10-K 第二刀 v0.1）」+ 原第 7 步「quiz / review 使用」降為第 8 步。

### `docs/PRACTICE_DATA_PLAN.md`

F 段新增 P3-10-K 第二刀 🟡 條目 + 本輪實作摘要。

### `PROJECT_ROADMAP.md`

在原 P3-10-K 修補條目上方插一個獨立的 🟡 P3-10-K 第二刀 條目（按時序由新到舊排列），含本輪完整描述：7 個 flag / 組裝策略 v0.1 / 4 段檔案結構 / 8 種 CLI 測試結果 / 硬邊界 13 條 / 未做清單。

### `README.md`

**未動**——文件索引已涵蓋；F-pre-8-g 為 QUESTION_IMPORT_NORMALIZATION_PLAN 內部章節擴張，無新文件入口。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues）
- `npm run typecheck`（`tsc --noEmit`）：✅ 全綠（純 `.mjs` script + 純文件、零 TypeScript 型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變、無新依賴）
- assemble CLI 8 種測試全綠：
  - ✅ Test 1 **preview vs real data**：13 題 → 2 sections / sourceMix={ai_generated:9, custom:4}（與既有 example 一致）/ 4 個 part-missing warnings / isDuplicatePaperId=false / 正式 papers 未動
  - ✅ Test 2 **`--mode write` 缺 `--write yes`** → exit 2 + 印 3 條對策
  - ✅ Test 3 **duplicate paper id preview**（`starters-mock-001`）→ isDuplicatePaperId=true / warning `duplicate_paper_id` / exit 0
  - ✅ Test 4 **duplicate paper id write mode** → exit 2 / preview 仍寫 / /tmp/papers-real-copy.json 完全未動
  - ✅ Test 5 **empty questions preview**（`[]`）→ sections=0 / 11 warnings 含 `no_questions_available` + 9 個 `insufficient_questions_for_part` + 1 個 `paper_has_zero_sections` / exit 0
  - ✅ Test 6 **empty questions write mode** → preview 仍寫 / target 不寫 / exit 0 + stderr 訊息
  - ✅ Test 7 **write happy path vs `/tmp/target-papers.json`** → 空 target → 1 paper 寫入 examPaperId=`starters-imported-001` / 2 sections / reviewer git diff 提示
  - ✅ Test 8 **`--limit 5`** → totalSelected=5 / 8 個 `skip_due_to_limit` warnings
- gitignore：✅ `.gitignore:56` cover `practice-paper.preview.generated.json`
- git status：本輪只 6 個檔案（1 新增 + 5 修改）；無 `.generated.json` / `.env.local` 進 diff
- **正式檔保護**：`diff data/p3-example-questions.json HEAD` 完全相同（13 題未動）；`diff data/exam-papers.example.json HEAD` 完全相同（1 paper 未動）

## 【仍未處理】

依任務單範圍（P3-10-K 第二刀屬部分完成）：

- ⬜ **lib/data.ts 載入 imported papers**：本輪只寫 paper 到 `data/exam-papers.example.json`，但 `/quiz` 仍從既有 paper 載入；未來需 lib/data.ts 加邏輯讀新 paper、或設定 paper picker UI（屬 P3-10-K 第三刀）。
- ⬜ **Section 內題目自動排序**：目前保留 `--questions` array 原順序；未來可依 starterPart 排序（L1→L4 / RW1→RW5），讓 paper 更接近 Starters 官方順序。
- ⬜ **Speaking section 內容**：屬 P4 Speaking Examiner Agent 範圍；本輪空 section 直接不出現。
- ⬜ **Cambridge Starters 官方題量對齊**：Listening 4 parts × 5 Q = 20Q；R&W 5 parts × 5 Q = 25Q；總 45Q。本輪 13 題遠少於目標；reviewer 需先補題（P3-10-G / H / I / J）。
- ⬜ **真實 reviewer commit 流程實測**：reviewer 須先跑 `approve_reviewed_questions.mjs` 累積足夠題目進 `data/p3-example-questions.json`，再跑本 CLI 組 paper；目前 13 題已足以驗證 CLI 邏輯，但無新 reviewer-approved 題目實測。
- ⬜ **`--rollback` flag / paper 移除**：reviewer 寫入後想復原須用 git checkout；屬未來 ergonomics enhancement。
- ⬜ **Paper validation**：本輪只組裝，不驗證 paper 內每題 id 是否真的在 questions 內、不驗 sourceMix 加總是否等於 totalSelected。屬未來保險 layer。
- ⬜ **第一份完整 first practice paper Codex 驗收**：屬 P3-10-K 收尾、需要 (a) reviewer approve 足夠題目 (b) 跑本 CLI 寫入 paper (c) lib/data.ts 整合 (d) /quiz 載入 (e) Codex 驗證完整流程。

P3-10-G / H / I / J 共 4 條題庫擴充未動；P3-10 / P3 / P4 / P5 仍 🟡 / ⬜。

## 【風險點】

- **paper.title 自動生成過於泛用：低**——目前 CLI 自動產 `"Cambridge Starters 練習卷（${paperId}）"`；reviewer 可能想要更具體的 title（如「Starters Mock 2026-05-14」）。建議下一輪加 `--paper-title` flag，缺值才 fallback 自動。
- **不寫入 `level` 欄位 vs 任務單範例不一致：低**——任務單範例 paper 結構含 `level: "Pre A1 Starters"`，但 `lib/types.ts` 實際 schema 沒此欄位。CLI 選擇對齊**實際 schema** 不寫 `level`；reviewer 若期望 level 在 paper 內，須先擴 schema（屬獨立 PR）。已在報告與 F-pre-8-g 文件明示。
- **section 內題目順序保留 array 原順序：中**——`data/p3-example-questions.json` 內順序是 q-mc-001 → q-pc-001 → q-wc-001 → q-lc-001 → q-fb-001 → q-fb-002 → q-mt-001 → q-tf-001 → q-sp-001 → q-sp-002 → q-sp-003 → q-sp-004 → q-tf-002（混雜各 starterPart）。組裝後 reading-writing section 內題目順序為 q-mc-001 → q-pc-001 → q-wc-001 → q-fb-001 → q-fb-002 → q-mt-001 → q-tf-001 → q-sp-001~004 → q-tf-002（**不依 starterPart 排序**）；對齊 Cambridge Starters 官方順序（RW1 → RW2 → ... → RW5）會更貼近真實考試體驗。建議下一輪加自動排序。
- **沒驗 paper 內 questionId 是否真的在 questions 內：低**——CLI 假設 reviewer 給的 `--questions` 檔內所有題目 id 有效；若 questions 檔被外部修改、id 缺失，paper.sections[].questionIds 仍會引用「不存在的 id」。實務上不太會發生（reviewer 只在本 repo 修改），但建議下一輪加 self-check。
- **/quiz 仍未切換：中（by design）**——本輪僅產 paper、不改 lib/data.ts，所以 `/quiz` 還是用既有 `starters-mock-001`。reviewer 若不知道，可能誤以為「跑完 CLI 後 /quiz 就有新 paper」。已在 CLI stderr + paper.description + 文件多處明示。
- **partBreakdown 沒對齊 Cambridge Starters 官方 5Q/part 目標**：低——目前只標 0 題為 warning，沒比較 vs 官方 5Q 目標。Reviewer 可能誤以為「L3 有 1 題就 OK」（其實官方 L3 = 5 題）。屬未來 enhancement，可加 partTargetCount + percentComplete metadata。
- **write 後不自動 commit**：低 by design——與 approve CLI 一致；reviewer 自己 git diff + commit。
- **ASSEMBLE_VERSION 硬編字串：低**——與既有 CLI 同模式。
- **error message 純中文**：與既有 CLI 一致。

## 【後續建議】

1. **下一步走 P3-10-K 第三刀：lib/data.ts 整合 imported paper**——本輪打通 paper 寫入鏈；下一步把 imported paper 載入 `/quiz`。涉及：(a) lib/data.ts 加 paper picker / filter / 標 `approved_for_practice` 過濾 / (b) UI 顯示 paper title 與來源 metadata / (c) reviewer 切換 paper UX。
2. **加 `--paper-title` flag**（屬 v0.1.1 小幅 enhancement）：reviewer 可指定 title；缺值才 fallback 自動。
3. **加 section 內 starterPart 自動排序**：依 Cambridge Starters 官方順序（L1→L2→L3→L4；RW1→RW2→...→RW5）。
4. **加 partTargetCount + percentComplete**（屬 v0.1.2 enhancement）：對齊 Cambridge Starters 官方 5Q/part 目標，summary 顯示 `{ L3: { count: 1, target: 5, percent: 20 } }`，reviewer 進度視覺化。
5. **加 paper validation self-check**：(a) 確認所有 questionIds 真的在 --questions 內 / (b) 確認 sourceMix 加總 == totalSelected / (c) 確認 sections 內無重複題 id。
6. **真實 reviewer 流程實測**：reviewer 先跑 approve_reviewed_questions.mjs 加幾題 → 跑本 CLI 組 paper → reviewer git diff → commit；驗證雙 CLI 端到端。
7. **Cambridge Starters 完整 paper 目標**：reviewer 補題到 45 題（4 L + 5 RW × 5 each）後，再走 P3-10-K Codex 驗收 first practice paper 上線。

**短期建議**：先讓 Codex 驗收本輪 P3-10-K 第二刀部分完成（驗 7 flag / 雙開關 / 4 段結構 / 8 種測試結果 / 4 個 warning code / sourceMix 統計一致性 / 正式檔 13 題 + 1 paper 完整保留 / lint / typecheck / build 全綠）；確認通過後決定下一刀（建議 K 第三刀 lib/data.ts 整合，或 G/H/I/J 題庫擴充先行）。

## 【Roadmap 同步檢查】

- 🟡 **P3-10-K 第二刀**：first practice paper 組裝 / paper-level metadata——**部分完成**（2026-05-14）—— 本輪完成
- 🟡 P3-10-K 修補：Codex 有條件通過後最小修補（仍 🟡）
- 🟡 P3-10-K：first practice paper 組裝與驗收 / approved → 正式題庫轉換 CLI（仍 🟡 部分完成，paper 整盤組裝 + Codex 驗收 first practice paper 仍 ⬜）
- 🟡 P3-10-F 後續：reviewed output 覆寫保護 / merge-with（仍 🟡）
- 🟡 P3-10-F：匯入題目人工審核流程（仍 🟡）
- 🟡 P3-10-E：AI normalizer 原型（仍 🟡）
- ⬜ P3-10-E 後續：openai mode 落地
- 🟡 P3-10-D-3 / D-2B / D-2：discovery / pipe（仍 🟡）
- ✅ P3-10-A / B / C
- 🟡 P3-10-D：collector 實測（仍 🟡）
- ⬜ P3-10-G / H / I / J：vocabulary 補齊、RW3 / RW1 / L3 題庫擴充
- 🟡 P3-10 整體：本輪後仍 🟡（A/B/C ✅ + D 🟡 + D-2 / D-2B / D-3 🟡 + E 🟡 + F 🟡 + F 後續 🟡 + **K 🟡 + K 修補 🟡 + K 第二刀 🟡** + G-J ⬜）—— **未把整體標完成**
- 🟡 P3-9-C 整體：仍 🟡（26 條 ✅）
- 🟡 P3 整體：仍 🟡 進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪只做 first practice paper 組裝 preview，**不代表 `/quiz` 已經使用 imported 題庫**；`lib/data.ts` 載入流程完全未動；`data/p3-example-questions.json` / `data/exam-papers.example.json` 整輪未被改動（git diff HEAD 確認一致）；`/quiz` 仍使用既有 `starters-mock-001`；P3-10-K 第二刀標 🟡 部分完成、未誇大為完整完成；reviewer 須先跑 `approve_reviewed_questions.mjs` 累積題目，再跑本 CLI，再走 lib/data.ts 整合（屬 P3-10-K 第三刀），才會真正讓 `/quiz` 換 paper。
