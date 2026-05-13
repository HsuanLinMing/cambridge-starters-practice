# Claude Code 回報 · P3-10-F：匯入題目人工審核流程第一版（部分完成）

任務日期：2026-05-13
任務性質：**Review workflow CLI 第一版**——新增 `scripts/review_normalized_questions.mjs` v0.1，支援 `prepare-review`（normalizer draft → reviewer 工作介面）與 `validate-reviewed`（驗證人工編輯後條目）兩個 mode；定義「normalized draft → reviewerFields template → 人工填欄 → validation passed → 可進 P3-10-K」的完整流程。本輪硬邊界全遵守：未呼叫 OpenAI；未實作 openai mode；未下載 PDF / image / audio；未解析 PDF；未修改 `data/p3-example-questions.json` / `data/exam-papers.example.json`；未新增正式題目；未讓 `/quiz` 使用 imported 題庫；未產 TTS；未改 UI / quiz / review / schema；未接後端 / DB / 登入；未處理 npm audit；未部署；未 commit `.env.local`；未 commit `.generated.json`（5 個 `.generated.json` 全 gitignore）；未 commit `.claude/settings.local.json`；未紀錄真實 API key（本 CLI 不需任何 env）。

## 【本輪修改摘要】

新增 `scripts/review_normalized_questions.mjs` v0.1 + 同步 4 份文件 / Roadmap：

1. **CLI 兩 mode**：
   - `prepare-review`：讀 P3-10-E `normalized-questions.generated.json` → 篩 `status=draft + reviewStatus=needs_human_review + isReadyForPractice=false + draft!=null` 條目 → 預填 reviewerFields template（`approved=false` / `approvedForPractice=false` / finalQuestion 留空 answer/options）→ 寫 `data/imported/reviewed-questions.generated.json`。
   - `validate-reviewed`：讀 reviewer 編輯後 `reviewed-questions.generated.json` → 對 `approvedForPractice=true` 條目跑 schema + 題型 validation → 寫 `data/imported/review-validation.generated.json` + 印 console summary。**不修改 reviewed file**、**不寫正式題庫**。
2. **6 個 CLI flag**：`--input`（必填，兩 mode 對應不同上游） / `--out`（選填、兩 mode 不同預設） / `--mode`（必填，prepare-review / validate-reviewed） / `--limit`（預設 10、防呆） / `--dry-run yes|no`（預設 no） / `--help`。
3. **5 種 skip reason（prepare-review）**：`skipped_status_not_draft` / `skipped_review_status_not_needs_review` / `skipped_already_ready` / `skipped_draft_null` / `skip_due_to_limit`。
4. **保守 reviewerFields template**：每筆 queued 條目預填 type / starterPart / prompt（從 draft 抓），**但 answer / options 一律留空**（與 P3-10-E rule-based 保守邊界一致），reviewer 必須手填才能進入 validate-reviewed。
5. **題型 validation 規則**：對 `approvedForPractice=true` 條目跑：(a) 必填欄位（id / type / starterPart / prompt / answer）、(b) 字面量對齊（QuestionType 9 種 + StarterPart L1-L4 / RW1-RW5）、(c) 一致性（approved=true + reviewStatus=approved_for_practice 同步）、(d) 題型 specific：spelling answer 非空字串、true-false answer 必 yes/no（忽略大小寫）、5 種 CHOICE_TYPES（multiple-choice / word-choice / listening-image-choice / listening-choice / picture-choice）options ≥ 2 + answer 對應 options（純字串或 `{id, value}` 物件）。
6. **`.gitignore` 加 2 行**：`reviewed-questions.generated.json` + `review-validation.generated.json`；段落標題更新為 P3-10-A / D-2 / D-2B / D-3 / **E / F**。
7. **文件同步**——`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` 升 v3（新增 F-pre 段 7 個子段：兩 mode / prepare-review filter / reviewerFields template / reviewer 操作 4 步 / validate-reviewed 驗證規則 / output schema / v0.1 不做清單）；`docs/PRACTICE_DATA_IMPORT_PLAN.md` C 段流程 4/5/6 步重寫對齊 P3-10-E + F + K 範圍；`docs/PRACTICE_DATA_PLAN.md` + `PROJECT_ROADMAP.md` P3-10-F 條目從 ⬜ 改 🟡 + 補本輪完整實作摘要。
8. **CLI 端到端 6 種測試全綠**：使用者本機真實 normalized output（PDF skip case） / fixture 3 種 draft 變 queued / fixture observation/failed/skipped 變 skipped / dry-run yes / validate-reviewed 6 種 reviewer 編輯情境（1 passed + 4 failed + 1 skipped）/ 邊界 exit 2（缺 --input / unsupported mode / input 不存在）。

`npm run lint` / `typecheck` / `build` 全綠（88 routes 不變、**無新依賴**）。**P3-10-F 標 🟡 部分完成；P3-10 / P3 整體仍 🟡——未把任何整體階段標完成**。

## 【修改檔案清單】

新增 1 份；修改 5 份；未動既有題目 / 圖片 / 音檔 / UI / quiz / review / schema / data / 題庫 / .env：

新增：
- **`scripts/review_normalized_questions.mjs`**：v0.1 review workflow CLI 約 440 行，分 6 段：(1) 常數（REVIEW_VERSION / SUPPORTED_MODES / ALLOWED_QUESTION_TYPES 9 種 + ALLOWED_STARTER_PARTS 9 種 + CHOICE_TYPES / HELP_TEXT）/ (2) CLI parsing + validateArgs / (3) JSON helpers / (4) prepare-review 邏輯（buildReviewItem 預填 reviewerFields template + buildSkippedReviewItem + classifyForReview）/ (5) validate-reviewed 邏輯（nonEmptyString + answerMatchesOptions + validateOneReviewedItem 完整題型 validation）/ (6) main + entry-script gate（沿用 P3-10-E 同模式）。**無新 npm 依賴**。

修改：
- **`.gitignore`**：加 2 行 `data/imported/reviewed-questions.generated.json` + `data/imported/review-validation.generated.json`；段落標題從「P3-10-A / D-2 / D-2B / D-3」改「P3-10-A / D-2 / D-2B / D-3 / **E / F**」。
- **`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`**：新增 F-pre 段（共 7 個子段，~120 行）；G 段加 v3 升級紀錄保留 v2 / v1。
- **`docs/PRACTICE_DATA_IMPORT_PLAN.md`**：C 段流程第 4 / 5 / 6 步重寫——4 步對齊 P3-10-E v0.1（保守 reviewStatus=needs_human_review、不自動跳 ai_normalized）/ 5 步寫 P3-10-F v0.1 完整 prepare-review + validate-reviewed 流程 / 6 步明示「轉成 formal practice data 屬 P3-10-K、本輪不做」。
- **`docs/PRACTICE_DATA_PLAN.md`**：F 段 P3-10-F 條目從 ⬜ 改 🟡，補本輪完整實作摘要。
- **`PROJECT_ROADMAP.md`**：P3-10-F 條目從 ⬜ 改 🟡（含 6 個 flag / 5 種 skip reason / reviewerFields template / 題型 validation 規則 / .gitignore / 文件同步 / 6 種 CLI 測試結果 / 硬邊界 13 條）。

未動：`scripts/discover_resources.mjs`（v0.2 完整保留）/ `scripts/web_resource_collect.mjs`（v0.1 + D-3 micro-refactor 完整保留）/ `scripts/collect_discovered_resources.mjs`（v0.1 完整保留）/ `scripts/normalize_collected_sources.mjs`（v0.1 完整保留）/ `scripts/generate_openai_tts_sample.mjs` / `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / `components/QuizPlay.tsx` / 其他 components / `data/p3-example-questions.json`（13 題完整保留）/ `data/exam-papers.example.json` / `data/vocabulary.json` / `data/quizzes.json` / `data/imported/*.example.json`（7 個範例完整保留）/ `public/images/` / `public/audio/` / `docs/DISCOVERY_CRAWLER_PLAN.md` / `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `docs/USER_TEST_NOTES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `README.md`（本輪沒新文件入口）/ `.env.example`（本輪不需新 env）/ `source_materials/*` / `package.json`（無新依賴）/ `node_modules/`。

## 【Review CLI 說明】

### 6 段檔案結構

```
scripts/review_normalized_questions.mjs
├── Section 0：常數（REVIEW_VERSION / SUPPORTED_MODES / ALLOWED_QUESTION_TYPES / ALLOWED_STARTER_PARTS / CHOICE_TYPES / HELP_TEXT）
├── Section 1：CLI parsing（parseYesNo / parseArgs / validateArgs；mode 字面量驗證）
├── Section 2：JSON helpers（readJsonFile / writeJson / makeBatchId）
├── Section 3：prepare-review
│   ├── buildReviewItem（queued/dry_run 條目 + reviewerFields template 預填）
│   ├── buildSkippedReviewItem（5 種 skip reason）
│   ├── classifyForReview（dispatcher）
│   └── runPrepareReview（讀 normalized batch / 分流 eligible / 跑 limit / 寫 reviewed batch）
├── Section 4：validate-reviewed
│   ├── nonEmptyString / answerMatchesOptions helpers
│   ├── validateOneReviewedItem（必填欄位 + 一致性 + 題型 specific 驗證）
│   └── runValidateReviewed（讀 reviewed batch / 跑 validation / 寫 validation summary + console）
└── Section 5：main + entry-script gate
```

### CLI flag 表

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--input` | 必填（兩 mode 對應不同上游） | — | prepare-review → normalized batch / validate-reviewed → reviewed batch |
| `--out` | 選填 | prepare-review → `data/imported/reviewed-questions.generated.json` / validate-reviewed → `data/imported/review-validation.generated.json` | output 寫檔路徑（覆寫式） |
| `--mode` | 必填 | — | `prepare-review` / `validate-reviewed` |
| `--limit` | 選填（僅 prepare-review 使用） | `10` | 最多處理 N 筆 eligible draft |
| `--dry-run` | 選填（僅 prepare-review 使用） | `no` | `yes` 時所有 queued 標 dry_run + 加 `dry_run` warning |
| `--help` | 選填 | — | 印 usage |

### exit code

| 情況 | exit code |
| --- | --- |
| 成功（含 validate-reviewed 找出 failed 條目；不影響 exit code） | 0 |
| 未預期錯誤 | 1 |
| CLI 參數錯 / input 不存在 / JSON parse 失敗 / 未支援 mode | 2 |

### 與 P3-10-D-3 / E / K 的關係

| 階段 | 工具 | 輸入 | 輸出 | reviewStatus |
| --- | --- | --- | --- | --- |
| D-3 pipe | `collect_discovered_resources.mjs` | discovered-resources | source-documents.batch | discovered_candidate |
| E normalizer | `normalize_collected_sources.mjs` | source-documents.batch | normalized-questions | needs_human_review |
| **F-pre prepare-review**（本輪） | `review_normalized_questions.mjs --mode prepare-review` | normalized-questions | reviewed-questions（reviewerFields template） | needs_human_review |
| **F-edit reviewer 編輯**（本輪 / 手動） | 維護者編輯 JSON | reviewed-questions | （同檔，reviewer 編輯後） | reviewer 改為 approved_for_practice |
| **F-val validate-reviewed**（本輪） | `review_normalized_questions.mjs --mode validate-reviewed` | reviewed-questions（編輯後） | review-validation.generated.json + console | （不改 reviewed file） |
| ⬜ K 寫入正式題庫 | 屬未來範圍 | validate-reviewed passed 條目 | `data/p3-example-questions.json` | （正式 schema） |

## 【Prepare-review 測試結果】

### Test A：使用者本機真實 normalized output

```
$ node scripts/review_normalized_questions.mjs \
    --input data/imported/normalized-questions.generated.json \
    --out data/imported/reviewed-questions.generated.json \
    --mode prepare-review --limit 10
[review] mode=prepare-review input=... out=... limit=10 dry-run=no
[review] wrote reviewed batch — totalInput=1 eligible=0 queued=0 dryRun=0 skipped=1
exit=0
```

唯一一筆來自 P3-10-E 對使用者本機 PDF batch 的處理結果（`status=skipped` + `skipped_asset_metadata`）被正確 skip：

```jsonc
{
  "sourceItemId": "disc-gen-0001",
  "sourceUrl": "https://www.lebusanglais.com/.../Pre-A1-Starters-Sample-Paper.pdf",
  "sourceType": "third_party",
  "resourceType": "pdf",
  "status": "skipped",
  "warnings": [{ "code": "skipped_status_not_draft", "message": "normalizer item.status=\"skipped\" 不是 \"draft\"，跳過。" }],
  "reviewerFields": null
}
```

✅ 證明本輪硬邊界生效：normalizer 階段已 skip 的條目（含 third-party PDF）在 prepare-review 階段不會被 promote 進 review queue。

### Test B：fixture 5 種 normalizer output 條件

自製 `/tmp/norm-fix.json`（已清理）含 5 種 normalizer output 條件：

| input | normalizer status | normalizer draft.type | 預期 prepare-review output |
| --- | --- | --- | --- |
| fx-001 | draft | spelling | queued + reviewerFields template |
| fx-002 | draft | true-false | queued + reviewerFields template |
| fx-003 | draft | multiple-choice | queued + reviewerFields template |
| fx-004 | observation | (none) | skipped (skipped_status_not_draft) |
| fx-005 | skipped | (none) | skipped (skipped_status_not_draft) |

實跑結果：

```
[review] wrote reviewed batch — totalInput=5 eligible=3 queued=3 dryRun=0 skipped=2
```

每筆 queued item reviewerFields 結構：

```
fx-001  status=queued
        reviewerFields.approved=false  approvedForPractice=false
        finalQuestion.type=spelling     starterPart=RW3   prompt="Look at the picture. Write the word."  answer=""  options=[]
fx-002  status=queued
        finalQuestion.type=true-false   starterPart=RW1   prompt="It is a cat."  answer=""  options=[]
fx-003  status=queued
        finalQuestion.type=multiple-choice  starterPart=RW4  prompt="Which one is a color?"  answer=""  options=[]
```

✅ 完整保留 source provenance（sourceItemId / sourceUrl / sourceType / resourceType / level / sourceQueryId / sourceQuery / sourceScore / sourceReasons / detectedExamParts / discoveryProvenance / originalDraft）；reviewerFields template 預填 type / starterPart / prompt **但 answer / options 一律空**；`approved=false` / `approvedForPractice=false` 確認**不自動 approve**。

## 【Dry-run 測試結果】

```
$ node scripts/review_normalized_questions.mjs --input /tmp/norm-fix.json --out /tmp/rev-dry.json --mode prepare-review --limit 10 --dry-run yes
[review] wrote reviewed batch — totalInput=5 eligible=3 queued=0 dryRun=3 skipped=2
exit=0
```

關鍵差別：
- **queued=0、dryRun=3**：3 筆 draft 從 queued 變 dry_run
- 每筆 dry_run item 多一筆 `dry_run` warning：「review item 已預填 reviewerFields template，但 status 標為 dry_run；reviewer 可比對欄位結構後再實跑」
- reviewerFields template 仍完整存在（reviewer 可比對欄位 layout 是否合理）

✅ dry-run 行為符合任務單規範；對 reviewer 在「正式生 reviewed batch 前先確認 schema 是否合用」非常有幫助。

## 【Validate-reviewed 測試結果】

自製 `/tmp/rev-edited.json`（已清理）模擬 reviewer 編輯後 6 種情境：

```
$ node scripts/review_normalized_questions.mjs --input /tmp/rev-edited.json --out /tmp/val-out.json --mode validate-reviewed
[review] mode=validate-reviewed input=/tmp/rev-edited.json out=/tmp/val-out.json (validation 只讀 input、不寫正式題庫)
[review] validation summary:
         totalInput=6
         approvedClaimed=5
         passedValidation=1
         failedValidation=4
         skippedNotApproved=1
[review] failed items:
         - sourceItemId=fx-002 finalQuestionId=q-tf-imp-001 type=true-false errors=true_false_answer_invalid
         - sourceItemId=fx-003 finalQuestionId=q-mc-imp-001 type=multiple-choice errors=answer_not_in_options
         - sourceItemId=fx-004 finalQuestionId= type=spelling errors=missing_final_id,missing_final_starter_part,missing_final_answer
         - sourceItemId=fx-006 finalQuestionId=q-incon-001 type=spelling errors=approved_must_be_true,review_status_not_approved_for_practice
[review] **不寫正式題庫**：data/p3-example-questions.json / data/exam-papers.example.json 未動。寫入 /tmp/val-out.json
```

逐筆驗證結果：

| sourceItemId | reviewer 編輯情境 | validation 結果 | error codes |
| --- | --- | --- | --- |
| fx-001 | 完整 spelling：id / type / starterPart / prompt / answer 都填、approved=true、approvedForPractice=true、reviewStatus=approved_for_practice | ✅ **passed** | — |
| fx-002 | true-false 但 answer="maybe" | ❌ failed | `true_false_answer_invalid` |
| fx-003 | multiple-choice + options=[apple,red,cat] 但 answer="purple" | ❌ failed | `answer_not_in_options` |
| fx-004 | spelling 但 id / starterPart / answer 都空 | ❌ failed | `missing_final_id` / `missing_final_starter_part` / `missing_final_answer` |
| fx-005 | approvedForPractice=false（reviewer 還沒勾選） | ⏭ skipped | reason: "approvedForPractice !== true" |
| fx-006 | 不一致：approvedForPractice=true 但 approved=false 且 reviewStatus=needs_human_review | ❌ failed | `approved_must_be_true` / `review_status_not_approved_for_practice` |

✅ 6 種情境全部正確分類；summary `passedValidation=1 / failedValidation=4 / skippedNotApproved=1` 加總 = 6 = totalInput。

## 【Output 格式檢查】

### prepare-review 結果（使用者本機 PDF case）

`data/imported/reviewed-questions.generated.json`：

```jsonc
{
  "batchId": "revbatch-2026-05-13T...",
  "createdAt": "...",
  "source": "review_normalized_questions.mjs@v0.1",
  "input": "<absolute path>",
  "mode": "prepare-review",
  "dryRun": false,
  "summary": { "totalInput": 1, "eligible": 0, "queued": 0, "dryRun": 0, "skipped": 1 },
  "items": [ { ...sourceItemId=disc-gen-0001 status=skipped warnings=[skipped_status_not_draft] reviewerFields=null... } ]
}
```

### prepare-review fixture queued item（保留所有 source provenance + reviewerFields template）

```jsonc
{
  "sourceItemId": "fx-001",
  "sourceUrl": "https://www.yle.tw/download.asp",
  "sourceType": "user_verified",
  "resourceType": "page",
  "level": "Pre A1 Starters",
  "sourceQueryId": "dq-zh-002",
  "sourceQuery": "劍橋兒童英檢 Starters 歷屆試題",
  "sourceScore": 9,
  "sourceReasons": ["zh_keyword_yle"],
  "detectedExamParts": ["unknown"],
  "discoveryProvenance": { "discoveryVersion": "fixture@v0", "searchProvider": "fixture", "rank": 1 },
  "originalDraft": { "questionType": "spelling", "starterPart": "RW3", ... },
  "reviewStatus": "needs_human_review",
  "status": "queued",
  "warnings": [],
  "reviewerFields": {
    "approved": false,
    "approvedForPractice": false,
    "reviewerNotes": "",
    "finalQuestion": {
      "id": "",
      "type": "spelling",                          // 預填
      "starterPart": "RW3",                         // 預填
      "prompt": "Look at the picture. Write the word.",  // 預填
      "answer": "",                                 // 保守邊界，留空
      "options": [],                                // 保守邊界，留空
      "explanation": "",
      "imageSrc": "",
      "audioSrc": ""
    }
  }
}
```

### validate-reviewed output schema

```jsonc
{
  "batchId": "valbatch-<ISO>",
  "validatedAt": "...",
  "source": "review_normalized_questions.mjs@v0.1",
  "input": "<absolute>",
  "mode": "validate-reviewed",
  "summary": {
    "totalInput": 6,
    "approvedClaimed": 5,
    "passedValidation": 1,
    "failedValidation": 4,
    "skippedNotApproved": 1
  },
  "items": [
    {
      "sourceItemId": "fx-002",
      "sourceUrl": "https://example.com/tf-bad",
      "finalQuestionId": "q-tf-imp-001",
      "finalQuestionType": "true-false",
      "approvedForPractice": true,
      "approved": true,
      "reviewStatusClaim": "approved_for_practice",
      "validationStatus": "failed",
      "reason": null,
      "errors": [
        { "code": "true_false_answer_invalid", "field": "finalQuestion.answer",
          "message": "true-false 的 answer 必須是 \"yes\" 或 \"no\"（忽略大小寫；got: \"maybe\"）" }
      ]
    }
  ]
}
```

### 任務單檢查清單

| 檢查項 | 結果 |
| --- | --- |
| prepare-review output 是否存在 | ✅ `data/imported/reviewed-questions.generated.json` 已寫 |
| summary 是否合理 | ✅ totalInput / eligible / queued / dryRun / skipped 加總一致；queued + dryRun + skipped = items.length |
| skipped / queued 是否合理 | ✅ 5 種 skip reason 字面量正確；queued 條目皆 status=queued + reviewerFields template 完整 |
| approvedForPractice 是否預設 false | ✅ 所有 queued 條目 `reviewerFields.approvedForPractice=false`（同 `approved=false`） |
| validate-reviewed 是否能抓出缺欄位 | ✅ missing_final_id / missing_final_type / missing_final_starter_part / missing_final_prompt / missing_final_answer 5 種 error code |
| 不會寫正式題庫 | ✅ `data/p3-example-questions.json` / `data/exam-papers.example.json` 完全未動；本 CLI 也不引用 `lib/data.ts` |
| generated output 是否被 gitignore 排除 | ✅ `.gitignore:53`-`:54` 命中 `reviewed-questions.generated.json` + `review-validation.generated.json` |

## 【人工審核 / approved_for_practice 策略】

### Review pipeline（reviewer 操作 4 步）

```
1. prepare-review
   $ node scripts/review_normalized_questions.mjs \
       --input data/imported/normalized-questions.generated.json \
       --out  data/imported/reviewed-questions.generated.json \
       --mode prepare-review --limit 10
   → 產 reviewed batch（每筆 reviewerFields template 預填 type / starterPart / prompt）

2. reviewer 手動編輯 reviewed-questions.generated.json
   - 把要 approve 的條目 reviewerFields.approved 改 true
   - reviewerFields.approvedForPractice 改 true
   - item.reviewStatus 從 "needs_human_review" 改 "approved_for_practice"
   - finalQuestion 內必填欄位（id / type / starterPart / prompt / answer）全部填齊
   - 題型 specific 補：
       * spelling   →  answer 非空字串、可選填 spellingHint / letterScramble（未來擴充）
       * true-false → answer 必 yes/no（忽略大小寫）
       * CHOICE_TYPES → options 至少 2 個 + answer 對應 options 之一
   - 不滿意條目可保留 approved=false 並補 reviewerNotes 解釋

3. validate-reviewed
   $ node scripts/review_normalized_questions.mjs \
       --input data/imported/reviewed-questions.generated.json \
       --mode validate-reviewed
   → 產 review-validation.generated.json + 印 console summary

4. 若全 passed → 進入 P3-10-K：寫入正式 data/p3-example-questions.json（**本輪不做**）
   - 屬獨立刀數，含 lib/data.ts 的 approved_for_practice 過濾邏輯
   - 也需與正式 ExamQuestion schema 對齊（finalQuestion → ExamQuestion 扁平化）
```

### reviewStatus 5 狀態機（對齊 QUESTION_IMPORT_NORMALIZATION_PLAN D 段）

```
imported_raw ──collector──▶ ai_normalized ──normalizer──▶ needs_human_review ──reviewer──┬─▶ approved_for_practice
                                                                                         ├─▶ human_review_required (需修)
                                                                                         └─▶ rejected (不通過)
```

本輪 P3-10-F v0.1：
- normalizer 一律輸出 `needs_human_review`（保守，不自動跳 `ai_normalized`）。
- reviewer 升 `approved_for_practice` 是唯一進入正式題庫的路徑。
- validate-reviewed 強制檢查「approvedForPractice=true → 必須同時 approved=true + reviewStatus=approved_for_practice」一致性，避免半 approve 狀態。

### 為何 reviewerFields 預填 type / starterPart / prompt 但不預填 answer / options

設計取捨：
1. **type / starterPart / prompt**：上游 normalizer 已給出 confidence > 0 的推斷，預填可大幅減少 reviewer 重複輸入；若 normalizer 推斷不準，reviewer 可改。
2. **answer / options 不預填**：rule-based normalizer 保守不猜 answer / options（draft.answer=null / options=[]）；如果 reviewerFields 也跟著預填空值反而誤導 reviewer 以為「上游有給」。預設 finalQuestion.answer="" / options=[] 明示「reviewer 必須手填」。
3. **explanation / imageSrc / audioSrc**：屬本專案自製素材；reviewer 須對齊 `public/images/*.svg` / 自製 TTS 才能填，normalizer 沒能力預填。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues；第一輪有 1 個 `DEFAULT_NORMALIZED_INPUT` unused warning，已移除）
- `npm run typecheck`（`tsc --noEmit`）：✅ 全綠（純 `.mjs` script + 純文件、零 TypeScript 型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變、無新依賴）
- review CLI 6 種測試全綠：
  - ✅ Test 1 `--help` → exit 0 + 完整 usage
  - ✅ Test 2 **prepare-review 跑使用者本機 normalized output**：totalInput=1 / eligible=0 / skipped=1（`skipped_status_not_draft`，PDF item 正確 skip）
  - ✅ Test 3 **prepare-review fixture**（5 種 normalizer output 條件）：totalInput=5 / queued=3 / skipped=2，reviewerFields template 全部正確預填、approved=false / approvedForPractice=false
  - ✅ Test 4 **dry-run yes**：queued=0 / dryRun=3，warning 多 `dry_run` code，reviewerFields 仍存
  - ✅ Test 5 **validate-reviewed fixture**（6 種 reviewer 編輯情境）：passedValidation=1 / failedValidation=4 / skippedNotApproved=1；error code 涵蓋 `true_false_answer_invalid` / `answer_not_in_options` / `missing_final_*` / `approved_must_be_true` / `review_status_not_approved_for_practice`
  - ✅ Test 6 邊界 exit 2（缺 `--input` / 缺 `--mode` / unsupported mode / input 不存在 path）
- gitignore：✅ `.gitignore:53-54` 已 cover 兩個新檔；7 個 generated 全 ignored；7 個 example JSON + `.env.example` 不被 ignore（會 commit）
- git status：本輪只 6 個檔案變動（1 新增 + 5 修改），無 `.generated.json` / `.env.local` / `.claude/settings.local.json` 進 diff

## 【仍未處理】

依任務單範圍（P3-10-F 屬部分完成）：

- ⬜ **approved → 寫入正式題庫的 CLI**（屬 P3-10-K）：把 validate-reviewed passed 的條目轉為正式 `ExamQuestion` schema 並寫 `data/p3-example-questions.json`；需新 CLI `approve_drafts_to_practice.mjs`（或類似）；含 `lib/data.ts` 加 `approved_for_practice` 過濾邏輯。
- ⬜ **Review UI dashboard**：本輪純 CLI + JSON workflow；reviewer 仍需手動編輯 JSON（VS Code / vim 等）；未來可考慮做一個簡單的 Next.js admin route 或獨立 Electron app。
- ⬜ **多 reviewer 簽核流程**：目前單一 reviewer 編輯 reviewed JSON；無「審 1 / 審 2」分階段 approval。屬企業級流程、本專案家用先不做。
- ⬜ **與 `docs/AI_QUESTION_GENERATION.md` 6 項品質檢查的自動化整合**：本輪 validation 只做 schema + 題型 specific 規則；6 項品質檢查（imagePrompt 對齊自家 SVG / ttsScript 標 examiner voice / 不含官方題目原文 / 等）目前需人工確認。
- ⬜ **openai mode for normalizer**：P3-10-E 已預留字面量但 exit 2；本輪不在 P3-10-F 範圍。
- ⬜ **reviewed batch 歷史**：覆寫式；不保留前一次 reviewed JSON；reviewer 若想比對「上次 review 到哪」需自己 git diff 或 `cp` 改檔名。
- ⬜ **批次操作 helper**：reviewer 仍需逐筆編輯 JSON；未來可考慮 CLI 子命令如 `bulk-approve --ids fx-001,fx-002`（屬 reviewer ergonomics 改善）。
- ⬜ **與 normalized-questions.example.json 既有人工示意範例的 schema 對齊**：example 是「approved 後扁平化到 ExamQuestion」目標 schema；本輪 reviewed batch 結構與 normalizer batch 結構皆為 reviewer 工作介面，刻意不同步；P3-10-K 才會做「reviewed approved item → ExamQuestion」轉換。

P3-10-G / H / I / J / K 共 5 條 ⬜ 仍未動（屬未來範圍）。

## 【風險點】

- **reviewer 手動編輯 JSON 容易出錯：高**——本輪沒 UI 也沒 schema 驗證的即時 feedback；reviewer 在 VS Code 編輯時可能誤打字面量（例如 `multiple_choice` 而非 `multiple-choice`）、JSON 格式錯（少逗號）、欄位漏填。validate-reviewed 會抓出絕大多數錯誤但仍是事後驗證。建議：(a) reviewer 用支援 JSON schema 的編輯器（如 VS Code）；(b) 短期內加 JSON schema 檔案到 `data/imported/` 便於 IDE 自動驗證；屬後續刀數小幅 enhancement。
- **`approvedForPractice=true` 但欄位不全的條目仍寫進 reviewed-questions.generated.json：低**——validate-reviewed 會抓出來，但 reviewed file 本身是 source of truth、reviewer 編輯後存檔即生效。建議流程：(a) 改完先 `validate-reviewed` 跑一輪、(b) 對 failed 條目逐個修、(c) 不修也保留為 failed 紀錄，不影響其他 passed 條目進入 K 階段。
- **answer 對應 options 的「物件」格式（`{id, value}`）vs 純字串字面量規則尚未明示：低**——validate-reviewed 接受兩種 option 格式；但 reviewer 編輯時若混用會困惑（例如 multiple-choice 的 options 有些用字串、有些用物件）。建議 reviewer 統一一種風格；未來 schema 升級時可強制單一格式。
- **不一致性檢查 force order：低**——validate-reviewed 對「approvedForPractice=true 但 approved=false」會回 `approved_must_be_true` 錯誤；reviewer 一次修一個欄位時可能不知道兩者要同步。已在 validation message 中明示「reviewer 必須同時勾選 approved=true」。
- **reviewed-questions.generated.json 覆寫式：中**——若 reviewer 已編輯一輪，下一次跑 `prepare-review` 會覆寫整檔，**所有 reviewer 編輯遺失**！本輪 v0.1 沒做「保留既有 reviewerFields」機制；建議 reviewer 每次跑 prepare-review 前先手動 `cp` 備份。下一輪 P3-10-F 後續刀數可加「`--merge-with <existing-reviewed>` flag」保留既有 reviewer 編輯。**這是本輪最大的可用性風險**。
- **PDF item 永遠 skip 不會 promote：low** —— 本輪沿襲 P3-10-E 保守邊界：PDF / image / audio 從 normalizer 就 skip，prepare-review 拿到也是 skip。這是設計，但長期意義是「discovery 找到的 PDF 永遠進不了 review」——除非 P3-10-D 後續刀數做 PDF parser，否則只能等使用者自己手寫 candidates 從 `custom` sourceType 進來。
- **CHOICE_TYPES 集合過寬：低**——包含 `listening-image-choice`（任務單規範）但 `lib/types.ts` 目前沒有此字面量；屬於「向前相容預留」。reviewer 用 listening-image-choice 寫 question 時 validate-reviewed 會放行，但 P3-10-K 寫入正式題庫時可能對應不到 schema。建議下一輪 K 動工時校正。
- **error message 多為中文：低**——validate-reviewed error.message 為中文；console summary 也中文（與 collector / discovery / normalizer 同模式）。對英語環境 CI 友善度低，但與本專案使用者語言一致；不算 bug。
- **未紀錄 reviewer identity：低**——`reviewerFields.reviewerNotes` 是自由欄位，沒結構欄位記 reviewer name / date / 簽核時間。本家用專案可接受，企業需求要加。
- **validate-reviewed 寫 `review-validation.generated.json` 但 CLI 不強制要求**：低——若 reviewer 想「只看 console、不要 fail file」，可手動刪 `--out`；CLI 仍會走預設路徑寫檔。屬已知行為、不算 bug。

## 【後續建議】

1. **下一步走 P3-10-K：approved → 正式題庫的轉換 CLI**——本輪已備好「validate-reviewed passed」這個 input；下一階段：
   - 新增 `scripts/approve_drafts_to_practice.mjs`（或類似名）
   - 讀 reviewed batch + validation summary
   - 對 `validationStatus=passed` 條目，把 `reviewerFields.finalQuestion` 扁平化轉為 `ExamQuestion` schema（對齊 `lib/types.ts` discriminated union）
   - **由維護者人工 commit 進 `data/p3-example-questions.json`**——不自動 commit；提供 dry-run 預覽
   - 同時改 `lib/data.ts` 加 `approved_for_practice` 過濾邏輯（與既有 13 題並存）
2. **加 reviewer ergonomics：`--merge-with` flag**（屬 P3-10-F 後續刀數）：prepare-review 接受既有 reviewed batch，**保留 reviewer 已填的 reviewerFields**，只 append 新 normalized drafts；避免覆寫遺失工作。**這是本輪最大的可用性風險點**，建議下一輪先補。
3. **加 JSON schema 檔案到 `data/imported/` 供 VS Code 自動驗證**：寫 `data/imported/schemas/reviewed-questions.schema.json`（JSON Schema draft-07）；reviewer 編輯 reviewed-questions.generated.json 時 VS Code 自動 hint 必填欄位 + 字面量限制。零依賴、零成本。
4. **同期擴量實測**：使用者下次跑 Brave + pipe + normalizer 拿到真正的 HTML draft 後，本 CLI 才有機會跑 queued path 處理真實 candidates。建議下次 Brave 實測時抓 1~2 條 HTML 教學頁面（非 PDF），跑完整鏈路：Brave → discover → pipe → normalize → prepare-review → 手填 reviewerFields → validate-reviewed → （未來）K。
5. **與 `docs/AI_QUESTION_GENERATION.md` 6 項品質檢查的整合**（屬 P3-10-F 後續 / E openai mode 落地後）：把 6 項檢查自動化進 validate-reviewed；reviewer 編輯時若違反（例：finalQuestion.prompt 含官方題目原文關鍵字）自動 fail。
6. **Review UI dashboard**（屬中期）：純 Next.js admin route 讀 reviewed batch JSON + 提供表單編輯介面 + 寫回 reviewed file；reviewer 不用編輯 JSON；屬可有可無的 ergonomics。

**短期建議**：先讓 Codex 驗收本輪 P3-10-F 部分完成（驗 CLI 6 flag / 2 mode / 5 種 prepare-review skip reason / 6 種 validate-reviewed 情境 / reviewerFields template 保守預填 / 不寫正式題庫 / lint / typecheck / build 全綠）；確認通過後決定下一刀（建議 P3-10-K 寫入正式題庫 CLI，或 P3-10-F 後續 reviewer ergonomics）。

## 【Roadmap 同步檢查】

- 🟡 **P3-10-F**：匯入題目人工審核流程（CLI + JSON workflow 第一版）——**部分完成**（2026-05-13）—— 本輪完成
- 🟡 P3-10-E：AI normalizer 原型（rule-based / mock-ai 第一版）（仍 🟡）
- ⬜ P3-10-E 後續：openai mode 落地（仍 ⬜）
- 🟡 P3-10-D-3：Discovery → Collector 自動 pipe（仍 🟡 部分完成）
- 🟡 P3-10-D-2B：Discovery crawler 接真實 Search Provider 第一版（仍 🟡 happy path verified）
- 🟡 P3-10-D-2：Discovery crawler 自動找資料來源（仍 🟡）
- ✅ P3-10-A / B / C
- 🟡 P3-10-D：collector 實測與第一批來源匯入（仍 🟡 部分完成）
- ⬜ P3-10-G / H / I / J：vocabulary 補齊、RW3 / RW1 / L3 題庫擴充
- ⬜ P3-10-K：first practice paper 組裝與驗收（含 approved → 正式題庫的 CLI）
- 🟡 P3-10 整體：本輪後仍 🟡（A/B/C ✅ + D 🟡 + D-2 / D-2B / D-3 🟡 + E 🟡 + **F 🟡** + G-K ⬜）—— **未把整體標完成**
- 🟡 P3-9-C 整體：仍 🟡（26 條 ✅）
- 🟡 P3 整體：仍 🟡 進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪只做人工審核流程第一版，**不寫正式題庫，不改 `/quiz`**；`data/p3-example-questions.json` / `data/exam-papers.example.json` / `public/images/` / `public/audio/` 皆完整保留未動；P3-10-F 標 🟡 部分完成、未誇大為完整完成；P3-10-K 寫入正式題庫的 CLI 屬獨立刀數、未實作；reviewer 仍需手動編輯 JSON（無 UI），但 CLI 提供了 prepare-review 預填 + validate-reviewed 強制驗證的兩端保護。
