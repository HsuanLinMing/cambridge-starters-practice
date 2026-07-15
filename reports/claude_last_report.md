# Codex 回報 · P3-10-V sourceProvenance schema + approve conversion

## 【本輪結論】

成功補上 `sourceProvenance` schema + approve conversion。

本輪已讓正式 `ExamQuestion` 可選擇保留 question-level provenance；`approve_reviewed_questions.mjs` v0.1.2 在 preview 與 `/tmp` write target 都會把 P3-10-U 三題的來源追溯寫入 `question.sourceProvenance`。本輪沒有正式 write `data/p3-example-questions.json`，也沒有修改正式 paper 或 `/quiz`。

## 【修改檔案清單】

- `lib/types.ts`
- `scripts/approve_reviewed_questions.mjs`
- `docs/DATA_SCHEMA.md`
- `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`
- `docs/PRACTICE_DATA_IMPORT_PLAN.md`
- `docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`
- `docs/PRACTICE_DATA_PLAN.md`
- `PROJECT_ROADMAP.md`
- `README.md`
- `reports/claude_last_report.md`

## 【sourceProvenance schema 設計】

新增 `QuestionSourceProvenance`，並在 `BaseQuestion` 加 optional `sourceProvenance?: QuestionSourceProvenance`。

欄位：

- `sourceUrl: string`：若 `sourceProvenance` 存在則必填。
- `sourceId?`
- `documentTitle?`
- `pageHint?`
- `sectionHint?`
- `sourceKind?`
- `publisher?`
- `publisherType?`
- `rightsNotes?`
- `provenanceNotes?`
- `reviewerNotes?`

`sourceProvenance` optional，不要求既有 13 題 dev seed 補欄位；`QuestionSource` union 沒有改，`official_learning_material` 等細分類保留在 `sourceProvenance.sourceKind`。

## 【approve conversion 行為】

`scripts/approve_reviewed_questions.mjs` 升為 v0.1.2。

來源取值優先支援：

- `reviewerFields.finalQuestion.sourceProvenance`
- `reviewerFields.finalQuestion` 直接欄位
- reviewed item 本身欄位
- `reviewedItem.discoveryProvenance`
- `reviewedItem.originalDraft`
- `originalDraft.provenance`
- `reviewerFields.reviewerNotes` / `reviewedItem.reviewerNotes`

轉換規則：

- 有非空 `sourceUrl` 才寫 `question.sourceProvenance`。
- 其他 provenance 欄位有非空字串才寫入。
- 透過 `Object.fromEntries(...filter)` 清掉 `undefined`，不寫 `null` / `undefined` 到 JSON。
- preview / write 共用同一 conversion，因此兩者都會保留。
- 若沒有 `sourceUrl`，不產生 `sourceProvenance`，避免假追溯。
- 不把 provenance 混進 `prompt` / `explanation` / answer / options / image / audio。

## 【P3-10-U 三題 fixture 重跑結果】

使用 `/tmp/cambridge-starters-p3-10-u-validation/reviewed-questions.approved.json` 與 `review-validation.json`。

- approve preview exit 0。
- `readyToAppend=3`
- `duplicateIds=0`
- `duplicateIdsInTarget=0`
- `duplicateIdsInBatch=0`
- ready questions with `sourceProvenance`: 3/3
- `official_sample` count: 3/3
- `sourceProvenance.sourceKind`: 3/3 為 `official_learning_material`
- `documentTitle` / `pageHint` / `rightsNotes` / `provenanceNotes` 均有保留。

Assemble preview 使用 `/tmp` write target：

- exit 0
- totalAvailable=16
- totalSelected=16
- sections=2
- `sourceMix={ official_sample: 3, ai_generated: 9, custom: 4 }`
- `reading-writing` section 包含三題 `q-src-rw3-001` / `q-src-rw1-001` / `q-src-rw4-001`

## 【/tmp write target 測試結果】

只寫入 `/tmp/cambridge-starters-p3-10-v-validation/target-questions.json`。

- `/tmp` target 由正式題庫複製而來。
- approve write exit 0。
- target 從 13 題變 16 題。
- append 題數：3。
- appended ids：`q-src-rw3-001` / `q-src-rw1-001` / `q-src-rw4-001`。
- appended 3/3 都有 `sourceProvenance.sourceUrl`。
- appended 3/3 都沒有 `undefined` / `null` provenance 值。
- 正式 `data/p3-example-questions.json` 不變。

## 【文件同步內容】

- `docs/DATA_SCHEMA.md`：新增 `sourceProvenance` schema、範例與硬邊界。
- `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`：F-pre-8 升 v0.1.2，補 approve conversion / preview schema / v4.5 版本紀錄。
- `docs/PRACTICE_DATA_IMPORT_PLAN.md`：第 6 步升 v0.1.2，正式資料欄位表新增 `sourceProvenance`。
- `docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`：approve preview / write checklist 補 provenance 檢查。
- `docs/PRACTICE_DATA_PLAN.md`：新增 P3-10-V 部分完成條目。
- `PROJECT_ROADMAP.md`：新增 P3-10-V 部分完成條目，未把 P3-10 / P3 標完成。
- `README.md`：長期方向補題目來源追溯說明。

## 【測試結果】

- `node scripts/approve_reviewed_questions.mjs ... --mode preview --limit 10`：通過，readyToAppend=3。
- `node scripts/approve_reviewed_questions.mjs ... --target /tmp/.../target-questions.json --mode write --write yes --limit 10`：通過，只寫 `/tmp` target。
- `node scripts/assemble_practice_paper.mjs --questions /tmp/.../target-questions.json ... --mode preview --paper-id starters-source-preview-001 --limit 20`：通過。
- `npm run lint`：通過。
- `npm run typecheck`：通過。
- `npm run build`：通過，Next.js static pages 仍為 88。
- `npm run runbook:check`：通過，overall PASS。

## 【安全檢查】

- 未修改正式題庫 `data/p3-example-questions.json`。
- 未修改正式 paper `data/exam-papers.example.json`。
- 未切 `/quiz`。
- 未修改 `lib/data.ts`。
- 未修改 app / components / public。
- 未下載官方 PDF / image / audio。
- 未 OCR、未新增 PDF parser。
- 未新增 npm 依賴；`package.json` / `package-lock.json` 無 diff。
- 未 stage / commit / push。
- `.env` / `.env.local` / `.claude/settings.local.json` / generated JSON 沒有 staged 或新增狀態。

## 【仍未處理】

- 三題尚未正式寫入 `data/p3-example-questions.json`。
- 尚未重新跑 P3-10-U write 前驗收。
- `/quiz` 尚未使用 imported 題庫。

## 【風險點】

- `sourceProvenance` 是來源追溯欄位，不代表授權證明；正式 write 前仍需 reviewer 再確認 `rightsNotes` / `provenanceNotes`。
- `QuestionSource` 仍是 4 值粗分類；`official_learning_material` 暫由 `question.source=official_sample` 承接，真實語義靠 `sourceProvenance.sourceKind` 保存。
- 本輪只驗證 P3-10-U 三題 fixture 與 `/tmp` target，不能直接視為正式 write 放行。

## 【後續建議】

- 下一輪重新跑 P3-10-U write 前驗收，檢查新的 preview JSON 是否保留 `sourceProvenance`。
- 若驗收通過，再由使用者明確授權正式 write；write 後立刻 `git diff data/p3-example-questions.json`。
- 後續若 source registry 欄位逐步穩定，可把 `sourceKind` / `publisherType` 收斂成更嚴格 union，但本輪先保持 string，避免擴大 schema blast radius。
