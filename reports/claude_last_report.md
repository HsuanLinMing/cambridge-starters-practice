# Claude Code 回報 · P3-10-K 修補：同批 duplicate id + QuestionSource union 驗證（部分完成）

任務日期：2026-05-14
任務性質：**P3-10-K Codex 有條件通過後的最小修補**——只改 `scripts/approve_reviewed_questions.mjs`（v0.1 → v0.1.1）與對應文件；補上 Codex 驗收指出的 2 個問題（High：未檢查同批 ready items 內部 dup id；Medium：未驗 `finalQuestion.source` QuestionSource union）；**未擴張 P3-10-K 範圍**（未做 first practice paper 整盤組裝 / 未動 `/quiz` / 未動 lib/types.ts）。本輪硬邊界全遵守：未做 first practice paper 組裝；未讓 `/quiz` 使用 imported 題庫；未呼叫 OpenAI；未下載 PDF / image / audio；未解析 PDF；未自動產生題目；未覆蓋既有正式題目；**`data/p3-example-questions.json` / `data/exam-papers.example.json` 整輪未被改動（git diff HEAD 一致、13 題完整保留）**；未改 UI / quiz / review；未改 schema（只 import `lib/types.ts` 既有 QuestionSource union 字面量作驗證集合，未動 type 定義）；未接後端 / DB / 登入；未處理 npm audit；未部署；未 commit `.env.local`；未 commit `.generated.json`；未 commit `.claude/settings.local.json`；未紀錄真實 API key。

## 【本輪修改摘要】

1. **修補 1（High）：同批 ready items 內部 duplicate id 偵測**
   - 之前只檢查 `existingIds.has(id)`（target 既有），漏了「同批兩筆 reviewer 條目都填同 id」的 case。
   - 修補後新增 batch 內部 id 統計 + 二維 dup 檢查：拆 `duplicate_id_in_target` 與 `duplicate_id_in_batch` 兩個 warning code。
   - **同批 dup 兩筆都標 skipped**（不只 skip 第二筆）：reviewer 給兩筆同 id 通常代表至少一筆 id 填錯，保守起見全 skip 等 reviewer 決定。
   - write mode 任一 dup（target 或 batch）→ **整批拒絕寫入 + exit 2**；preview JSON 仍寫（reviewer 可從 items[] 找 dup 條目）。
   - summary 加 `duplicateIdsInTarget` / `duplicateIdsInBatch` 兩個分項；`duplicateIds` 仍記兩者聯集數量（向後相容）。
   - 流程重組為 4 / 4.5 / 5 / 6 三段：每筆轉換暫標 ready → batch 內 id 統計 → 雙維度 dup 檢查 → limit。

2. **修補 2（Medium）：QuestionSource union 驗證**
   - 之前 `source = nonEmptyString(fq.source) ? fq.source : "custom"` → 任何非空字串都會寫入 question.source。
   - 修補後 import 對齊 `lib/types.ts` `QuestionSource` union 4 種字面量集合：`official_sample` / `past_paper` / `ai_generated` / `custom`。
   - 三種情況處理：
     - 空 / 缺值 → 預設 `custom`
     - 在 union → 使用該值
     - **非空但不在 union** → 條目 `status="failed"` + error code `invalid_question_source`，**不** silent fallback 為 custom（避免掩蓋 reviewer 填錯來源）
   - reviewer 想表達 `user_provided` / `third_party` 等第三方來源應保留於 `reviewerNotes` 或 discovery provenance、**不**寫入正式 `QuestionSource` union（文件已明示）。

3. **HELP_TEXT 同步**：標題改 v0.1.1；補修補摘要、新 warning code、QuestionSource union 規則段。
4. **文件同步**：`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` 升 v4.1（F-pre-8-d / F-pre-8-e 重寫）；`docs/PRACTICE_DATA_IMPORT_PLAN.md` C-6 步補修補說明；`docs/PRACTICE_DATA_PLAN.md` P3-10-K 條目補 v0.1.1 修補摘要；`PROJECT_ROADMAP.md` 在 P3-10-K 條目上方插「P3-10-K 修補」獨立條目（按時序由新到舊排列）。
5. **7 種測試全綠**：見「測試結果」段。

`npm run lint` / `typecheck` / `build` 全綠（88 routes 不變、**無新依賴**）。`data/p3-example-questions.json` / `data/exam-papers.example.json` 完整保留（git diff HEAD 一致）。**P3-10-K 整體仍 🟡 部分完成、未誇大為完整完成**。

## 【修改檔案清單】

新增 0 份；修改 5 份；未動既有題目 / 圖片 / 音檔 / UI / quiz / review / schema / data / 題庫 / .env / .gitignore（既有規則已 cover `approved-questions.preview.generated.json`）：

修改：
- **`scripts/approve_reviewed_questions.mjs`**：v0.1 → v0.1.1。改動點：(a) `APPROVE_VERSION` 字串 `@v0.1` → `@v0.1.1`；(b) 新增 `ALLOWED_QUESTION_SOURCES` set 常數；(c) HELP_TEXT 標題改 v0.1.1 + 補修補摘要、新 warning code、QuestionSource union 規則段；(d) `convertFinalQuestionToExamQuestion` 內 `source` 從「`nonEmptyString(fq.source) ? fq.source : "custom"`」改為「依 ALLOWED_QUESTION_SOURCES 三段判斷」、非 union 值返回 `{ok: false, errors: [{code:"invalid_question_source",...}]}`；(e) `main()` 流程重組 4 / 4.5 / 5 / 6 三段——4 暫標 ready、4.5 雙維度 dup 檢查、5 limit、6 統計三個 dup 計數 + 一個聯集；(f) summary 加 `duplicateIdsInTarget` / `duplicateIdsInBatch` 欄位；(g) write mode duplicate gate 改用 `duplicateIdsAll`（聯集），錯誤訊息分別印 target / batch 部分。整體新增 ~50 行 / 改 ~30 行；CLI 既有指令面**完全相容**（v0.1 既有 case 仍 work）。
- **`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`**：F-pre-8-d 完全重寫（拆 target / batch 兩種 warning code + 兩 mode 行為表 + summary 對應欄位 + 為何 batch dup 兩筆都 skip 說明）；F-pre-8-e 補 source 規則 4 點（對齊 union / 空值預設 custom / 在 union 用該值 / 非 union 標 failed）；G 段加 v4.1 升級紀錄保留 v4 / v3.1 / v3 / v2 / v1。
- **`docs/PRACTICE_DATA_IMPORT_PLAN.md`**：C 段第 6 步補 v0.1.1 修補說明（duplicate id 拆兩種偵測 + QuestionSource union 4 種 + 非 union 值 status=failed）。
- **`docs/PRACTICE_DATA_PLAN.md`**：F 段 P3-10-K 條目從 v0.1 更新為 v0.1.1，補本輪 2 個修補摘要。
- **`PROJECT_ROADMAP.md`**：在原 P3-10-K 條目上方插一個獨立的「🟡 P3-10-K 修補」條目（按時序由新到舊），含本輪完整 2 個修補描述 + 7 種測試結果 + 硬邊界 11 條。

未動：`scripts/discover_resources.mjs` / `scripts/web_resource_collect.mjs` / `scripts/collect_discovered_resources.mjs` / `scripts/normalize_collected_sources.mjs` / `scripts/review_normalized_questions.mjs` / `scripts/generate_openai_tts_sample.mjs` / `lib/types.ts`（**對齊使用 QuestionSource union，但未動 type 定義**） / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / `components/QuizPlay.tsx` / 其他 components / **`data/p3-example-questions.json`（13 題完整保留）** / **`data/exam-papers.example.json`** / `data/vocabulary.json` / `data/quizzes.json` / `data/imported/*.example.json`（7 個範例完整保留）/ `public/images/` / `public/audio/` / `docs/DISCOVERY_CRAWLER_PLAN.md` / `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `docs/USER_TEST_NOTES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `README.md`（本輪沒新文件入口）/ `.env.example`（本輪不需新 env）/ `.gitignore`（既有規則已 cover）/ `source_materials/*` / `package.json`（無新依賴）/ `node_modules/`。

## 【Duplicate id 修補說明】

### 兩維度偵測

| 偵測來源 | warning code | 觸發 |
| --- | --- | --- |
| target 既有 | `duplicate_id_in_target` | finalQuestion.id 已存在於 `--target` 現有正式題目（lookup 透過 `existingIds: Set`） |
| 同批內部 | `duplicate_id_in_batch` | finalQuestion.id 在本批兩筆以上 ready items 內重複（lookup 透過 `batchIdCounts: Map`） |

兩種可同時觸發（同 id 既在 target 也在 batch 重複出現 ≥2 次）；該筆 item 會同時帶兩個 warning code。

### 兩 mode 行為

| mode | preview | write + 任一 dup |
| --- | --- | --- |
| 命中 item | status=`skipped` + 對應 warning；question 物件仍保留供 reviewer 檢視 | 同 preview 標記；整批 exit 2 拒絕寫入 target |
| target | 不動 | 不動（CLI 在寫 target 前已 exit 2） |
| preview JSON | 寫 | **仍寫**（reviewer 可從 items[].warnings 找 dup 條目） |

### summary 欄位

| 欄位 | 含義 |
| --- | --- |
| `duplicateIds` | target + batch 兩種 dup 的 **unique id 聯集**（向後相容） |
| `duplicateIdsInTarget` | 只算 target 既有 dup 的 unique id 數 |
| `duplicateIdsInBatch` | 只算 batch 內部 dup 的 unique id 數 |

範例：target 含 q-A，batch 含兩筆 q-A + 兩筆 q-B：
- `duplicateIdsInTarget = 1`（只 q-A）
- `duplicateIdsInBatch = 2`（q-A 與 q-B 都在 batch 內 dup）
- `duplicateIds = 2`（聯集 unique：q-A、q-B）

### 為何「同批 dup 兩筆都 skip」

reviewer 給兩筆同 id 通常代表「至少一筆 id 填錯」，CLI 無法判斷哪筆對。最保守的設計：**全部** skip 等 reviewer 自行決定哪筆改 id。reviewer 在 reviewed file 改其中一筆的 id 後重跑，即可解開。

### 流程重組（4 / 4.5 / 5 / 6 三段）

之前 v0.1：在每筆 reviewed item 的轉換迴圈內，**立刻**做 duplicate check（只看 target）→ skipped or ready。

v0.1.1 拆兩段：
- **Step 4**：每筆轉換時暫標 `ready`（duplicate 檢查延後）；放進 `tentativelyReady` 陣列。
- **Step 4.5**：用 `tentativelyReady` 統計 batch 內部 id 出現次數（`batchIdCounts`），再對每筆檢查 (a) target 既有 (b) batch 內部 dup。同 item 可被兩種 dup 同時標記。
- **Step 5**：limit 只套用在「duplicate 檢查後仍 ready」的條目；超過 limit 的標 `skip_due_to_limit`。
- **Step 6**：統計三個 dup 計數（target / batch / 聯集）+ ready / skipped / failed。

## 【QuestionSource union 驗證說明】

### 對齊 lib/types.ts

```ts
// lib/types.ts（**未動**，本輪只 import 字面量）
export type QuestionSource =
  | "official_sample"   // Cambridge 官方 sample paper
  | "past_paper"        // 歷屆考題
  | "ai_generated"      // AI 生成題
  | "custom";           // 維護者自製 / 改寫
```

CLI 內新增常數：

```js
const ALLOWED_QUESTION_SOURCES = new Set([
  "official_sample",
  "past_paper",
  "ai_generated",
  "custom",
]);
```

### 三種輸入處理

| `finalQuestion.source` 值 | 處理 | 結果 |
| --- | --- | --- |
| 空字串 / 缺值（undefined） | 預設 `custom` | resolvedSource = `"custom"` |
| 在 union（4 種字面量之一） | 使用該值 | resolvedSource = fq.source |
| 非空但不在 union（如 `user_provided` / `third_party` / `manual` / 任何其他字串） | **errors push `invalid_question_source`** | 條目 status=`failed`，**不**寫入 question；**不** silent fallback 為 custom |

### 為何「非 union 值不 silent fallback 為 custom」

任務單明示「請不要自動把非法 source fallback 成 custom，因為這可能掩蓋 reviewer 填錯來源的問題」。具體場景：
- reviewer 從 P3-10-A 既有 `sourceType` 概念混淆（discovery 階段 sourceType 有 `user_verified` / `third_party` / `official` / `unknown`，但這些**不是** ExamQuestion 的 `QuestionSource`）。
- 若 CLI 把 `third_party` silent fallback 為 `custom`，正式題庫會出現 source=custom 但來源實際是第三方的題目，違反「正式題庫每題保留 source / provenance 可追溯」原則。
- 失敗 + 明確 error 訊息能讓 reviewer 立刻知道「source 填錯了、需要選正確的 union 字面量或保留至 reviewerNotes」。

### 錯誤訊息範例（stderr 與 errors[0].message 內容一致）

```
source "third_party" 不在 QuestionSource union（official_sample / past_paper / ai_generated / custom）。
非法 source 不會 fallback 為 custom（避免掩蓋 reviewer 填錯來源）；
若 reviewer 想表示第三方來源，請保留於 reviewerNotes / discovery provenance，
不要寫入正式 QuestionSource union。
```

## 【Preview 測試結果】

### Test 1：current preview vs real `data/p3-example-questions.json`

```
[approve] wrote preview to .../approved-questions.preview.generated.json — totalReviewed=1 validationPassed=0 readyToAppend=0 skipped=1 failed=0 duplicateIds=0(target=0,batch=0)
[approve] mode=preview / --write=no：**未寫 target**；正式題庫 .../p3-example-questions.json 完全未動。
exit=0
```

✅ 既有 PDF skipped case（從 P3-10-F 帶過來的 reviewed file）仍按預期 skip；新 `duplicateIds=0(target=0,batch=0)` 顯示證明兩個分項都 0；正式題庫未動。

## 【Write duplicate guard 測試結果】

### Test 2：`--mode write` 缺 `--write yes` → exit 2（既有保護未 regression）

```
Error: --mode write 必須同時搭配 --write yes 才會實際寫入正式題庫。
本輪 v0.1 設計**雙開關**避免無意識寫入。若仍想寫，請完整指令：
  --mode write --write yes
若要先檢查、不寫，請改 --mode preview。
exit=2
```

✅ v0.1 的雙開關保護完整保留。

### Fixture 1：同批 duplicate id preview

fixture：兩筆 reviewer items（sourceItemId=`a` 與 `b`）都填 `finalQuestion.id="q-new-dup"`；target 為 `[]`（空）。

```
[approve] wrote preview to /tmp/preview-batchdup.json — totalReviewed=2 validationPassed=2 readyToAppend=0 skipped=2 failed=0 duplicateIds=1(target=0,batch=1)
exit=0
```

逐筆：

```
summary: {"totalReviewed":2,"validationPassed":2,"readyToAppend":0,"skipped":2,"failed":0,"duplicateIds":1,"duplicateIdsInTarget":0,"duplicateIdsInBatch":1,"targetExistingCount":0}
item[0] id=q-new-dup status=skipped warnings=duplicate_id_in_batch
item[1] id=q-new-dup status=skipped warnings=duplicate_id_in_batch
```

✅ **兩筆都標 skipped**（不只第二筆）；`duplicateIdsInBatch=1`（unique id 為 1）；`duplicateIds=1`（聯集）；readyToAppend=0；target 未動（empty-target 仍 0 題）。

### Fixture 2：同批 duplicate id write mode → exit 2

```
[approve] wrote preview to /tmp/preview-batchdup-write.json — totalReviewed=2 validationPassed=2 readyToAppend=0 skipped=2 failed=0 duplicateIds=1(target=0,batch=1)
Error: write mode 偵測到 1 筆 duplicate id（batch=[q-new-dup]）；為避免覆寫既有正式題目或破壞 batch id 唯一性，**整批拒絕寫入** + exit 2。
   preview JSON 已寫至 /tmp/preview-batchdup-write.json，reviewer 可檢視 items[].warnings 找出 duplicate_id_in_target / duplicate_id_in_batch 條目。
請於 reviewed file 改 id（建議 q-{type-tag}-imp-{nnn}），或從 target 移除既有同 id 題目後重跑。
exit=2
```

✅ exit 2；preview JSON 仍寫；empty-target 不動（仍 0 題）；錯誤訊息明確指出 `batch=[q-new-dup]`（分項顯示 dup 來自 batch 不是 target）。

## 【Invalid source 測試結果】

### Fixture 3：兩筆 invalid source preview + write

fixture：sourceItemId=`a` 填 `source="third_party"`、sourceItemId=`b` 填 `source="user_provided"`；target 為 `[]`（空）。

**Preview**：

```
[approve] wrote preview to /tmp/preview-invsrc.json — totalReviewed=2 validationPassed=2 readyToAppend=0 skipped=0 failed=2 duplicateIds=0(target=0,batch=0)
[approve] mode=preview / --write=no：**未寫 target**；正式題庫 /tmp/empty-target.json 完全未動。
exit=0
```

逐筆：

```
summary: {"totalReviewed":2,"validationPassed":2,"readyToAppend":0,"skipped":0,"failed":2,"duplicateIds":0,"duplicateIdsInTarget":0,"duplicateIdsInBatch":0,"targetExistingCount":0}
item[0] id=q-sp-invsrc-001 status=failed warnings= errors=invalid_question_source
item[1] id=q-sp-invsrc-002 status=failed warnings= errors=invalid_question_source
```

✅ 兩筆都 status=`failed`、errors 含 `invalid_question_source`；readyToAppend=0；target 不動。

**Write mode（同 fixture）**：

```
[approve] wrote preview to /tmp/preview-invsrc-write.json — totalReviewed=2 validationPassed=2 readyToAppend=0 skipped=0 failed=2 duplicateIds=0(target=0,batch=0)
[approve] write mode 但 readyToAppend=0；不寫 target。preview JSON 已寫至 /tmp/preview-invsrc-write.json；reviewer 可檢查 skipped / failed 原因。
exit=0
```

✅ readyToAppend=0 → 不寫 target；exit 0（這不是 dup 觸發的，而是純粹「沒東西可寫」的正常分支）；target 不動。

注意：invalid_question_source 條目走 `status=failed` 分支（不算 ready），所以即使是 write mode 也不會因為 invalid source 觸發 exit 2，因為 dup gate 只看 dup ids。但**這些 failed 條目不會寫入 target**，因為它們從未進入 `withinLimit` 陣列。

## 【合法 source 測試結果】

### Fixture 4：4 種合法 source + 空 source（預設 custom）write happy path

fixture：5 筆 reviewer items：
- `a`：source=`custom`
- `b`：source=`ai_generated`
- `c`：source=`official_sample`
- `d`：source=`past_paper`
- `e`：**未填** source 欄位（測試「空值預設 custom」）

target 為 `/tmp/target-valid.json`（空 array）。

```
[approve] wrote preview to /tmp/preview-valid.json — totalReviewed=5 validationPassed=5 readyToAppend=5 skipped=0 failed=0 duplicateIds=0(target=0,batch=0)
[approve] **已寫入 target**：/tmp/target-valid.json 從 0 題擴張到 5 題（追加 5 題）。
  reviewer 請手動 git diff 確認後再 commit。
exit=0
```

target 寫入後內容：

```
題目數: 5
  q-sp-cus-001  type=spelling          source=custom            starterPart=RW3
  q-sp-ai-001   type=spelling          source=ai_generated      starterPart=RW3
  q-tf-os-001   type=true-false        source=official_sample   starterPart=RW1
  q-mc-pp-001   type=multiple-choice   source=past_paper        starterPart=RW4
  q-sp-empty-001 type=spelling         source=custom            starterPart=RW3   ← 空值預設 custom 正確
```

✅ 5 筆全部 ready 並寫入；4 種合法 source 各自保留；空值預設為 `custom`；無 dup（5 個 unique id）；無 failed；source 規則三段都驗證到。

## 【文件同步內容】

### `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` v4.1

- **F-pre-8-d 重寫**：拆 `duplicate_id_in_target` / `duplicate_id_in_batch` 兩個 warning code + 兩 mode 行為表 + summary `duplicateIds` / `duplicateIdsInTarget` / `duplicateIdsInBatch` 對應 + 為何 batch dup 兩筆都 skip 的設計取捨說明。
- **F-pre-8-e 補 source 規則 4 點**：對齊 QuestionSource union 4 種字面量 / 空值預設 custom / 在 union 用該值 / **非空但不在 union → failed + invalid_question_source（不 silent fallback）** / reviewer 第三方來源應保留於 reviewerNotes。
- **G 段加 v4.1 升級紀錄**保留 v4 / v3.1 / v3 / v2 / v1。

### `docs/PRACTICE_DATA_IMPORT_PLAN.md`

C 段第 6 步補修補摘要：duplicate id 拆兩種偵測 + QuestionSource union 4 種 + 非 union 值 status=failed + reviewer 第三方來源處理建議。

### `docs/PRACTICE_DATA_PLAN.md`

F 段 P3-10-K 條目從 v0.1 更新為 v0.1.1，補本輪 2 個修補摘要。

### `PROJECT_ROADMAP.md`

在原 P3-10-K 條目上方插一個獨立的「🟡 P3-10-K 修補」條目（按時序由新到舊排列），含本輪完整描述：2 個修補理由與行為 / mergeKey 規則 / 7 種測試結果 / 4 種 fixture 場景結果 / 硬邊界 11 條。

### `README.md`

**未動**——文件索引已涵蓋；F-pre-8 修補為 QUESTION_IMPORT_NORMALIZATION_PLAN 內部章節擴張，無新文件入口。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues）
- `npm run typecheck`（`tsc --noEmit`）：✅ 全綠（純 `.mjs` script + 純文件、零 TypeScript 型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變、無新依賴）
- approve CLI 7 種測試全綠：
  - ✅ Test 0 `--help` → exit 0；HELP 標題顯示 v0.1.1 + 修補摘要 + 新 warning code + QuestionSource union 規則
  - ✅ Test 1 **preview vs 既有 PDF skipped case**：totalReviewed=1 / readyToAppend=0 / `duplicateIds=0(target=0,batch=0)`；正式題庫未動
  - ✅ Test 2 **write 缺 `--write yes`** → exit 2（既有保護未 regression）
  - ✅ **Fixture 1 同批 dup preview**：兩筆同 id `q-new-dup` 都 status=skipped + warning `duplicate_id_in_batch`；summary `duplicateIdsInBatch=1` / `duplicateIds=1`；empty-target 不動
  - ✅ **Fixture 2 同批 dup write mode** → exit 2 + preview JSON 仍寫（含 `duplicate_id_in_batch` warnings）+ empty-target 不動
  - ✅ **Fixture 3 invalid source preview + write**：兩筆 `third_party` / `user_provided` → status=failed + error `invalid_question_source`；preview write mode 都不寫 target
  - ✅ **Fixture 4 合法 source happy path**：5 筆（custom / ai_generated / official_sample / past_paper / 空值預設 custom）→ readyToAppend=5；target 從 0 → 5 題；source 分配正確
- gitignore：✅ `.gitignore:55` 已 cover `approved-questions.preview.generated.json`（本輪未動）
- git status：本輪只 5 個檔案變動（0 新增 + 5 修改）；無 `.generated.json` / `.env.local` / `.claude/settings.local.json` 進 diff
- **正式題庫保護**：`diff data/p3-example-questions.json HEAD:data/p3-example-questions.json` → 完全相同（13 題未動）；`data/exam-papers.example.json` 同理

## 【仍未處理】

依任務單範圍（本輪只做最小修補，P3-10-K 整體仍 🟡）：

- ⬜ **first practice paper 整盤組裝**（屬 P3-10-K 主任務未完部分）：paper-level metadata（`ExamPaper.sourceMix` / `sections` / `questionOrder`）的組裝。
- ⬜ **`lib/data.ts` 加 `approved_for_practice` 過濾邏輯**：目前 quiz 載入是整 `data/p3-example-questions.json`；若未來想做「approved-only quiz」需加 filter。
- ⬜ **`first practice paper` Codex 驗收**：需要先 (a) reviewer 跑 write 把幾題 approved 寫進正式題庫 (b) 整盤 paper 組裝 (c) 上線 `/quiz` (d) Codex 驗 quiz 流程仍正常。
- ⬜ **`--allow-partial yes` flag**：write mode 遇 dup 時允許 reviewer 明確同意「忽略 dup 條目、寫其他條目」；屬未來 reviewer ergonomics（風險：reviewer 可能漏掉 dup 條目）。
- ⬜ **matching template 擴張 + 寫入支援**。
- ⬜ **`--rollback` flag**：自動把上一輪 write 的條目從 target 移除；目前 reviewer 用 `git checkout` 解決。
- ⬜ **Review UI dashboard**：純 CLI workflow；reviewer 仍需自己用編輯器看 JSON。
- ⬜ **自動補選填欄位**（spellingHint / letterScramble / topic / promptVersion / skillFocus）。
- ⬜ **多 target 支援**：目前只接受單一 `--target`。
- ⬜ **使用者擴量實測**：本輪 fixture 已涵蓋 7 種題型中的 spelling / true-false / multiple-choice + invalid type；其他 4 種（picture-choice / word-choice / fill-blank / listening-choice）的轉換邏輯仍只靠 unit-level reading 確認；建議下一輪 reviewer 真實 approve 各題型時補實測。

P3-10-G / H / I / J 共 4 條仍未動。

## 【風險點】

- **batch dup 兩筆都 skip 對某些 reviewer 不直覺：低**——reviewer 可能預期「保留 first、skip second」。本輪選擇全 skip 是因為 CLI 無法判斷哪筆對；已在 warning message + F-pre-8-d 文件明示。reviewer 自己改其中一筆 id 重跑即可解開。
- **invalid_question_source 條目走 status=failed 而非 skipped：低**——與 P3-10-K v0.1 既有設計一致（unsupported_question_type → skipped；其他 conversion errors → failed）；reviewer 看 errors[0].code 就能定位問題。
- **invalid source 條目 write mode 不會觸發 exit 2：低**——只有 dup ids 會觸發整批 exit 2。invalid source 條目本身就 status=failed、不會進入 `withinLimit` 寫入，所以 write mode 仍安全（target 不會被寫入），但 reviewer 若不檢查 preview JSON 可能不知道有 failed 條目。建議短期內 reviewer 跑完 write 後檢視 console summary 內的 `failed` 計數。
- **target 真實寫入仍依賴 reviewer git diff + commit：低 by design**——CLI 不自動 commit，所以 reviewer 必須自己 `git diff data/p3-example-questions.json` 確認後 commit。屬訓練問題、非 bug。
- **APPROVE_VERSION 字串硬編：低**——版本升級時需手改；與既有 CLI 同模式。
- **fixture 沒覆蓋「同時 target dup + batch dup 同 item」混合 case：低**——理論上一個 id 既在 target 也在 batch dup 出現，該 item 應同時帶兩個 warning code。本輪沒專門 fixture 驗證，但邏輯上 step 4.5 內兩個 `if` 是平行檢查、可同時觸發。建議下一輪補 e2e fixture。
- **fixture 沒覆蓋 7 題型中的 picture-choice / word-choice / fill-blank / listening-choice 轉換**：見「仍未處理」段。
- **invalid source check 在 type-specific validation 之前跑**：意味即使 reviewer 填了無效 source + 無效 type，errors 內只會有 invalid_question_source（先 return）。reviewer 修完 source 後重跑才會看到 type 問題。屬已知模式、不算 bug。
- **error message 純中文**：與既有 CLI 一致。

## 【後續建議】

1. **下一步走 P3-10-K 第二刀：first practice paper 整盤組裝**——本輪修補後單題級別轉換鏈更加穩固；可開始把 reviewer 真實 approve 的題目組裝為完整 `ExamPaper`（需 `data/exam-papers.example.json` 結構整合 / `lib/data.ts` 載入邏輯）。
2. **加 fixture 覆蓋剩餘 4 種題型 + 混合 dup case**：picture-choice / word-choice / fill-blank / listening-choice 的轉換邏輯目前只靠 unit-level reading 確認；建議下一輪補 e2e fixture（屬測試覆蓋率 enhancement）。
3. **加 `--allow-partial yes` flag**：reviewer 明確同意「寫入非 dup 條目、忽略 dup 條目」；風險：reviewer 可能漏掉 dup 條目。
4. **加 file-exists 檢查 imageSrc / audioSrc**：approve 階段對 `--target` 所在 repo 的 `public/` 內檔案做 stat；不存在標 warning `asset_path_not_found`。
5. **prepare-review template 補 source 欄位 + sourceWarning**：reviewer template 目前沒 `source` 欄位（reviewer 填寫時可能不知道有此欄位）；建議下一輪 prepare-review template 補 + sourceWarning（third-party 時提示需改寫）。
6. **使用者擴量實測**：建議 reviewer 下次真實 approve 跨 2~3 種題型 + 設計同批 dup case + 設計 invalid source case，端到端驗證本輪修補。

**短期建議**：先讓 Codex 驗收本輪 P3-10-K 修補（驗 2 個修補 / 7 種測試結果 / 5 個檔案變動 / 正式題庫 13 題完整保留 / lint / typecheck / build 全綠）；確認通過後決定下一刀（建議 first practice paper 整盤組裝 + lib/data.ts approved 過濾，或 P3-10-G/H/I/J 題庫擴充先行）。

## 【Roadmap 同步檢查】

- 🟡 **P3-10-K 修補**：同批 duplicate id + QuestionSource union 驗證——**部分完成**（2026-05-14）—— 本輪完成
- 🟡 P3-10-K：first practice paper 組裝與驗收 / approved → 正式題庫轉換 CLI（仍 🟡 部分完成，paper 整盤組裝仍 ⬜）
- 🟡 P3-10-F 後續：reviewed output 覆寫保護 / merge-with（仍 🟡 部分完成）
- 🟡 P3-10-F：匯入題目人工審核流程（仍 🟡）
- 🟡 P3-10-E：AI normalizer 原型（rule-based / mock-ai 第一版）（仍 🟡）
- ⬜ P3-10-E 後續：openai mode 落地
- 🟡 P3-10-D-3：Discovery → Collector 自動 pipe（仍 🟡 部分完成）
- 🟡 P3-10-D-2B：Discovery crawler 接真實 Search Provider 第一版（仍 🟡 happy path verified）
- 🟡 P3-10-D-2：Discovery crawler 自動找資料來源（仍 🟡）
- ✅ P3-10-A / B / C
- 🟡 P3-10-D：collector 實測與第一批來源匯入（仍 🟡）
- ⬜ P3-10-G / H / I / J：vocabulary 補齊、RW3 / RW1 / L3 題庫擴充
- 🟡 P3-10 整體：本輪後仍 🟡（A/B/C ✅ + D 🟡 + D-2 / D-2B / D-3 🟡 + E 🟡 + F 🟡 + F 後續 🟡 + **K 🟡 + K 修補 🟡** + G-J ⬜）—— **未把整體標完成**
- 🟡 P3-9-C 整體：仍 🟡（26 條 ✅）
- 🟡 P3 整體：仍 🟡 進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪是 P3-10-K Codex 有條件通過後的最小修補，**只做 2 個修補（同批 dup id + QuestionSource union）**；未做 first practice paper 整盤組裝；未改 `/quiz`；未動 `lib/types.ts` schema 定義（只 import union 字面量作驗證集合）；`data/p3-example-questions.json` / `data/exam-papers.example.json` 整輪未被改動（git diff HEAD 確認一致）；P3-10-K 整體仍 🟡 部分完成、未誇大為完整完成。
