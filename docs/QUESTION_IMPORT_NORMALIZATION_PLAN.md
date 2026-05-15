# 匯入題目轉正式 schema 的 Normalize 流程（P3-10-C）

> 對應 P3-10「正式練習資料補齊與 web resource collector」。本檔規劃**把 imported source dataset 轉成正式 practice questions** 的 normalize 流程與 reviewStatus 狀態機。
>
> 本檔屬**規劃文件**；normalizer 實作屬 P3-10-E 範圍、本輪不實作。

最新整理：2026-05-13。

---

## A. 目標

把 collector 抓回的 `data/imported/source-document.generated.json` 中 `extractedCandidates[]` → 對齊 `lib/types.ts` `ExamQuestion` discriminated union 的正式題目草稿，並走 reviewStatus 流程確保**只有 approved_for_practice 才能進正式 quiz / review**。

關鍵原則：

- **不批次自動 approve**：collector / normalizer 是工具，最終 approve 必須是維護者人工決定。
- **每題保留來源**：對應 [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) D 段欄位要求。
- **可重跑、可回溯**：normalizer 重跑覆寫 `.generated.json`；正式 `data/*.json` 由維護者 commit、不被 normalizer 覆寫。
- **不直接使用外部資產**：圖片 / 音檔仍改用自家 SVG / 自製 TTS；normalizer 只填邏輯欄位、不貼外部 URL 到 `image` / `audioSrc`。
- **source-first（P3-10-L，2026-05-14）**：normalizer 只能接受**已在 source registry 中標 `approved_for_import`** 的來源；`pending_review` / `needs_manual_check` / `rejected` 一律拒絕。`ai_generated` **不得**用來補正式題庫數量。詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)。

---

## B. 支援題型

先對齊目前已有的 8 種題型（對應 `QuestionType` discriminated union）：

| type | 對齊 Starter Part | normalize 重點 |
| --- | --- | --- |
| `listening-choice` | L3 | candidate 必須有音檔來源指引 → 改自家 TTS；options 改 ImageOption[]（A/B/C） |
| `picture-choice` | RW1 / RW2 preview | candidate 必須有圖片提示 → 對齊自家 SVG 或 fallback |
| `true-false` | RW1 | 描述句 + yes / no 答案；對齊自家 SVG |
| `word-choice` | RW3 preview | 英文 prompt + 4 圖片選項 |
| `spelling` | RW3 | 圖 + 提示語 + 完整單字輸入；可加 `spellingHint` / `letterScramble` |
| `multiple-choice` | RW4 preview | 4 文字選項；通用文字題 |
| `fill-blank` | RW4 | 含 `___` 句子；可選項版 / 自由填空版 |
| `matching` | RW5 | `pairs[]` 結構 |

normalize 輸出時，**每題只能對應一種 type**；候選 ambiguous 時保留 `notes`、reviewStatus 設 `human_review_required`。

---

## C. Normalizer 輸出格式

實作後輸出至 `data/imported/normalized-questions.generated.json`；範例已 commit 在 `data/imported/normalized-questions.example.json`。

每題完整結構：

```jsonc
{
  "id": "q-sp-imp-001",
  "type": "spelling",
  "prompt": "Look at the picture. Write the word.",
  "image": "/images/apple.svg",
  "answer": "apple",
  "explanation": "圖片是蘋果，所以正確單字是 apple。",
  "spellingHint": "a _ _ l e",
  "letterScramble": "p p a l e",
  "starterSection": "reading-writing",
  "starterPart": "RW3",
  "skillFocus": ["spelling", "vocabulary"],
  "expectedAnswerType": "text",
  "source": "user_provided",
  "sourceUrl": "https://example.com/user-provided-worksheet",
  "sourceName": "User-provided RW3 worksheet",
  "sourceType": "user_provided",
  "provenance": {
    "resourceId": "res-003",
    "sourceDocumentId": "doc-002",
    "normalizerVersion": "v0.1-draft",
    "originalText": "Look at the picture. Write the word. (apple image) ____",
    "candidateConfidence": 0.8,
    "notes": "..."
  },
  "importedAt": "2026-05-13T00:00:00.000Z",
  "reviewStatus": "human_review_required"
}
```

詳見 `data/imported/normalized-questions.example.json` 三筆範例（spelling / true-false / multiple-choice 各一）。

### id 規則建議

- `q-{type-tag}-imp-{nnn}`：例 `q-sp-imp-001`（spelling import 第 1 題）
- type-tag 對應：mc / pc / wc / lc / fb / mt / tf / sp
- imp 表 imported；區別於既有手寫 `q-sp-001`（未來可能改用其他 prefix 例如 `q-sp-cus-`）

### 必填 vs 選填

- 必填：`id` / `type` / `answer`（matching 除外） / `source` / `sourceName` / `sourceType` / `provenance` / `importedAt` / `reviewStatus`
- 看題型必填：`prompt` / `options` / `image` 等（對應該題型 schema）
- 建議：`explanation` / `starterSection` / `starterPart` / `skillFocus` / `expectedAnswerType` / `sourceUrl`
- 題型專屬選填：`spellingHint` / `letterScramble`（spelling） / `transcript` / `ttsScript` / `audioSrc`（listening-choice） / `optionType`（listening-choice）

---

## D. reviewStatus 狀態機

5 種狀態 + 轉換規則：

```
imported_raw  ──collector 直接放──>  ai_normalized  ──AI 跑完──>  human_review_required
                                                                          │
                                                       ┌──────────────────┼──────────────────┐
                                                       ▼                  ▼                  ▼
                                              approved_for_practice    rejected         (留 human_review_required 等修正)
```

| reviewStatus | 含義 | 寫入時機 | 進正式 quiz / review |
| --- | --- | --- | --- |
| `imported_raw` | 剛從 collector 抓回的候選 | collector 直接寫入 source-document；若維護者直接從 source-document 手抓題目當 normalize 來源，也可從此狀態起 | ❌ |
| `ai_normalized` | AI normalizer 跑過、出了結構化草稿，但未經人工檢查 | normalizer 寫入 normalized-questions.generated.json | ❌ |
| `human_review_required` | AI 結果結構不完整 / 有疑慮 / candidate confidence 低 → 必須人工修正 | normalizer 自動標 + 維護者 review 時也可降級到這 | ❌ |
| `approved_for_practice` | 人工審核通過、可進正式 paper | 維護者手動標 + commit 到 `data/p3-example-questions.json` 或 `data/practice-questions.json` | **✅** |
| `rejected` | 不適用 / 不通過 / 與既有題重複 | 維護者手動標 | ❌ |

**只有 `approved_for_practice` 才能進正式 quiz / review**——本檔規範未來 `lib/data.ts` 應做的過濾邏輯（屬 P3-10-K 範圍）。

### 升級流程建議

1. collector 抓 → `imported_raw`
2. AI normalizer 跑 → `ai_normalized`（若 confidence ≥ 0.8）或 `human_review_required`（若 confidence < 0.8 / 結構不全）
3. 維護者 review → `approved_for_practice` 或 `human_review_required` 或 `rejected`
4. `approved_for_practice` 的題目可由維護者 copy 進正式 `data/*.json`（保留所有 source / provenance 欄位）

### 不允許的轉換

- `rejected` → `approved_for_practice`：禁止直接跳；若想救回需先重新走 normalizer + review。
- `imported_raw` → `approved_for_practice`：禁止跳過 normalizer 與 human review；若維護者真的想手寫題，建議用 `source: "custom"` / `sourceType: "custom"` 從頭寫，而非走 imported pipeline。

---

## E. Normalizer 實作（P3-10-E 第一版：rule-based / mock-ai 原型）

> 對應 `scripts/normalize_collected_sources.mjs` v0.1（2026-05-13）。本輪先做最保守的 rule-based 原型，**不呼叫 OpenAI**；`openai` mode 屬後續刀數，CLI 已預留 mode 字面量但會 exit 2。

### E-1. Input

- `data/imported/source-documents.batch.generated.json`（P3-10-D-3 pipe 產出的 batch 結構，**不是** P3-10-B 既有 `source-document.generated.json`）
- 篩選條件：`item.status === "collected"` **且** `item.document.kind === "source_document"`

### E-2. Mode 對應

| mode | 是否本輪實作 | 行為 |
| --- | --- | --- |
| `rule-based`（預設） | ✅ | 把 `extractedCandidates` 直接轉 draft；無 candidates → status=observation；不硬造題 |
| `mock-ai` | ✅ | 同 rule-based 邏輯，但每筆 draft 加 `mock_ai_response` warning + `normalizationNotes` 前綴 `mode:mock-ai`，模擬「AI 跑過但走 rule-based fallback」 |
| `openai` | ❌（exit 2） | 屬未來範圍；需 `OPENAI_API_KEY`、prompt 設計、token / 成本管控；本輪 CLI 直接 exit 2 並印未實作訊息 |

### E-3. Skipped 分類（任務單規範）

對「非 source_document 或無效」的 batch item，輸出 status=skipped 並標 reason：

| skip reason | 觸發條件 |
| --- | --- |
| `skipped_not_collected` | `item.status !== "collected"`（如 failed / dry_run / skipped） |
| `skipped_asset_metadata` | `document.kind === "asset_metadata"`（pdf / image / audio / video）—— **本輪硬邊界**，不從 asset 產題 |
| `skipped_resource_index` | `document.kind === "resource_index"`（只有 metadata 級欄位、無 cleanedText） |
| `skipped_not_source_document` | `document.kind` 為其他值（含 null / 未知字面量） |
| `skipped_no_cleaned_text` | `kind=source_document` 但 `cleanedText` 為空（多半是 SPA / JS 渲染頁，collector regex 抓不到內容） |
| `skip_due_to_limit` | 超過 `--limit` 上限的 eligible source_document 條目 |

### E-4. Observation 路徑

當 `source_document` 有 cleanedText **但** `extractedCandidates.length === 0`：

- **不硬造題**——保守邊界。
- 輸出 status=observation + 兩條 warnings：
  - `no_question_candidates`：說明為什麼沒 draft
  - `observation_heading_summary`：節選前 3 個 headings 幫 reviewer 快速判斷該頁是否值得手寫候選

### E-5. Draft 路徑

當 `source_document` 有 `extractedCandidates`：每個 candidate **獨立**轉一筆 output item（status=draft）；保留 `sourceItemId`（discoveredResourceId） + draft 結構：

```jsonc
{
  "questionType": "spelling" | ... | "unknown",   // 對齊 ALLOWED_QUESTION_TYPES（8 種）
  "starterPart": "RW3" | ... | "unknown",          // 對齊 ALLOWED_STARTER_PARTS（L1-L4 + RW1-RW5）
  "prompt": "<candidate.text>",
  "answer": null,                                   // 保守邊界：rule-based 不猜 answer
  "options": [],                                    // 同理
  "confidence": 0.0 ~ 1.0,                          // 沿用 collector 的 confidence
  "normalizationNotes": [
    "mode:rule-based" | "mode:mock-ai",
    "candidate_index:<n>",
    "candidate_type:<question|vocabulary|instruction|...>",
    "source_note:<原 candidate.notes>",
    "rule_based_v0.1:no_answer_inferred",
    ...
  ]
}
```

額外 warnings：每筆 draft 至少 `rule_based_no_answer_inferred`；low confidence 時加 `low_confidence_unknown_type_part`；mock-ai 加 `mock_ai_response`。

### E-6. 一律標籤（不論 mode / 結果）

所有 output items 一律：

- `reviewStatus = "needs_human_review"`
- `sourceStatus = "draft_from_collected_source"`
- `isReadyForPractice = false`

唯有 P3-10-F 人工審核後升 `approved_for_practice`（在 D 段 5 狀態機規範），才能寫入正式 `data/p3-example-questions.json`（屬 P3-10-K 範圍）。

### E-7. Output（batch 結構）

寫入 `data/imported/normalized-questions.generated.json`（覆寫式，已 gitignore）：

```jsonc
{
  "batchId": "normbatch-<ISO ts>",
  "createdAt": "<ISO>",
  "source": "normalize_collected_sources.mjs@v0.1",
  "input": "<absolute path>",
  "mode": "rule-based" | "mock-ai",
  "dryRun": true | false,
  "summary": {
    "totalInput": <int>,
    "eligible": <int>,            // status=collected + kind=source_document
    "drafts": <int>,               // status="draft" 筆數
    "observations": <int>,         // status="observation" 筆數
    "dryRun": <int>,               // status="dry_run" 筆數
    "skipped": <int>,              // status="skipped" 筆數（含 skip_due_to_limit）
    "failed": <int>
  },
  "items": [
    {
      "sourceItemId": "<discoveredResourceId>",
      "sourceUrl": "...",
      "sourceType": "official | third_party | user_verified | unknown",
      "resourceType": "...",
      "level": "...",
      "sourceQueryId": "...",
      "sourceQuery": "...",
      "sourceScore": <int>,
      "sourceReasons": [...],
      "detectedExamParts": [...],
      "discoveryProvenance": { ... },
      "reviewStatus": "needs_human_review",
      "sourceStatus": "draft_from_collected_source",
      "isReadyForPractice": false,
      "status": "draft | observation | dry_run | skipped | failed",
      "warnings": [...],
      "draft": null | { ... }
    }
  ]
}
```

### E-8. 不在 normalizer v0.1 範圍

- ❌ 不直接寫入 `data/p3-example-questions.json`
- ❌ 不上傳官方題目 / 歷屆題給 OpenAI API（本輪根本不呼叫 OpenAI）
- ❌ 不下載外部圖片 / 音檔到 `public/`
- ❌ 不自動 approve（reviewStatus 永遠停在 needs_human_review）
- ❌ 不從 asset_metadata / resource_index / 第三方 PDF 產題（pipe 已 skip，normalizer 再次防護）
- ❌ 不猜 answer / options（draft.answer=null / options=[]，等 reviewer 補）
- ⬜ openai mode（CLI 已預留，exit 2）；對齊既有 `docs/AI_QUESTION_GENERATION.md` prompt 規格，後續刀數實作

---

## F-pre. P3-10-F：匯入題目人工審核流程（v0.1）

> 對應 `scripts/review_normalized_questions.mjs` v0.1（2026-05-13）。本輪是「人工審核流程第一版」，定義 normalized draft 如何進入 review queue、reviewer 如何升 `approved_for_practice`、以及 validate-reviewed 如何把關。**仍不寫正式題庫**——只到 `data/imported/reviewed-questions.generated.json` 為止；正式 `data/p3-example-questions.json` 寫入屬 P3-10-K 範圍。

### F-pre-1. 兩個 mode

| mode | 用途 | input | output |
| --- | --- | --- | --- |
| `prepare-review` | normalizer draft → reviewer 工作介面（預填 reviewerFields template、不自動 approve） | `data/imported/normalized-questions.generated.json`（P3-10-E 輸出） | `data/imported/reviewed-questions.generated.json` |
| `validate-reviewed` | 驗證人工編輯後的 reviewed 條目；**不修改 reviewed file**、**不寫正式題庫** | `data/imported/reviewed-questions.generated.json`（人工編輯後） | `data/imported/review-validation.generated.json` + console summary |

### F-pre-2. prepare-review filter（任務單規範）

只把同時滿足下列條件的條目放入 review queue：

- `status === "draft"`
- `reviewStatus === "needs_human_review"`
- `isReadyForPractice === false`
- `draft !== null`

不符合的條目標 `status: "skipped"` 並補 reason code 之一：

| skip reason | 觸發 |
| --- | --- |
| `skipped_status_not_draft` | status 不是 draft（含 observation / skipped / dry_run / failed） |
| `skipped_review_status_not_needs_review` | reviewStatus 已升級或為其他字面量 |
| `skipped_already_ready` | isReadyForPractice 已 true（**上游污染**） |
| `skipped_draft_null` | draft=null（即使 status=draft 也視為損壞） |
| `skip_due_to_limit` | 超過 `--limit` 上限的 eligible 條目 |

### F-pre-3. reviewerFields template（每筆 queued 預填）

```jsonc
{
  "approved": false,                    // 預設 false，**不自動 approve**
  "approvedForPractice": false,         // 預設 false
  "reviewerNotes": "",                  // 留空給 reviewer 填
  "finalQuestion": {
    "id": "",                           // 留空；建議 q-{type-tag}-imp-{nnn}
    "type": "<draft.questionType if in ALLOWED_QUESTION_TYPES else ''>",
    "starterPart": "<draft.starterPart if in ALLOWED_STARTER_PARTS else ''>",
    "prompt": "<draft.prompt>",         // **僅**預填 prompt
    "answer": "",                       // **不亂猜**；draft.answer 即使非 null 也不繼承
    "options": [],                      // 同理
    "explanation": "",
    "imageSrc": "",
    "audioSrc": ""
  }
}
```

每筆 review item 同時保留：`sourceItemId` / `sourceUrl` / `sourceType` / `resourceType` / `level` / `sourceQueryId` / `sourceQuery` / `sourceScore` / `sourceReasons` / `detectedExamParts` / `discoveryProvenance` / `originalDraft`（完整 normalizer 階段 draft，便於 reviewer 比對）。

### F-pre-4. 人工審核流程（reviewer 操作）

1. `prepare-review` 產出 `reviewed-questions.generated.json`（已 gitignore）
2. reviewer **手動編輯** JSON：
   - 把要 approve 的條目 `reviewerFields.approved` 改 `true`
   - 把該條目 `reviewerFields.approvedForPractice` 改 `true`
   - 把該條目 `reviewStatus` 從 `needs_human_review` 改 `approved_for_practice`
   - 填齊 `reviewerFields.finalQuestion` 內必填欄位（id / type / starterPart / prompt / answer 等）
   - 不滿意的條目可保留 `approved=false`、不影響 batch
3. `validate-reviewed` 跑 schema + 題型驗證；產出 `review-validation.generated.json` 與 console summary
4. 若 validation 全 passed → reviewer 可進入 P3-10-K 把 approved items copy 進 `data/p3-example-questions.json`（**屬 P3-10-K 範圍、本輪不做**）

### F-pre-5. validate-reviewed 驗證規則

**只驗證 `approvedForPractice === true` 的條目**；其餘標 `validationStatus: "skipped"` + reason "approvedForPractice !== true"。

對 approvedForPractice=true 條目逐筆檢查：

| 檢查項 | error code |
| --- | --- |
| approved 不是 true | `approved_must_be_true` |
| reviewStatus 不是 "approved_for_practice" | `review_status_not_approved_for_practice` |
| finalQuestion.id 為空 | `missing_final_id` |
| finalQuestion.type 為空 | `missing_final_type` |
| finalQuestion.type 不在 QuestionType union | `invalid_final_type` |
| finalQuestion.starterPart 為空 | `missing_final_starter_part` |
| finalQuestion.starterPart 不在 L1-L4 / RW1-RW5 | `invalid_final_starter_part` |
| finalQuestion.prompt 為空 | `missing_final_prompt` |
| finalQuestion.answer 為空 | `missing_final_answer` |
| type=true-false 且 answer 不是 yes / no（忽略大小寫） | `true_false_answer_invalid` |
| type ∈ CHOICE_TYPES 且 options 少於 2 | `options_too_few` |
| type ∈ CHOICE_TYPES 且 answer 不在 options 內（支援純字串 / `{ id, value }` 物件） | `answer_not_in_options` |

**type-specific** spelling 僅要求 answer 非空字串；options 可空。

### F-pre-6. Output schema

prepare-review：

```jsonc
{
  "batchId": "revbatch-<ISO>",
  "createdAt": "...",
  "source": "review_normalized_questions.mjs@v0.1",
  "input": "<absolute>",
  "mode": "prepare-review",
  "dryRun": true | false,
  "summary": { "totalInput", "eligible", "queued", "dryRun", "skipped" },
  "items": [
    {
      "sourceItemId", "sourceUrl", "sourceType", "resourceType", "level",
      "sourceQueryId", "sourceQuery", "sourceScore", "sourceReasons",
      "detectedExamParts", "discoveryProvenance",
      "originalDraft",
      "reviewStatus": "needs_human_review",
      "status": "queued | dry_run | skipped",
      "warnings": [...],
      "reviewerFields": null | { approved, approvedForPractice, reviewerNotes, finalQuestion: {...} }
    }
  ]
}
```

validate-reviewed：

```jsonc
{
  "batchId": "valbatch-<ISO>",
  "validatedAt": "...",
  "source": "review_normalized_questions.mjs@v0.1",
  "input": "<absolute>",
  "mode": "validate-reviewed",
  "summary": {
    "totalInput", "approvedClaimed", "passedValidation", "failedValidation", "skippedNotApproved"
  },
  "items": [
    {
      "sourceItemId", "sourceUrl",
      "finalQuestionId", "finalQuestionType",
      "approvedForPractice", "approved", "reviewStatusClaim",
      "validationStatus": "passed | failed | skipped",
      "reason": null | "approvedForPractice !== true ...",
      "errors": [ { "code", "field", "message" } ]
    }
  ]
}
```

### F-pre-7. 覆寫保護 / merge-with（v0.2，P3-10-F 後續，2026-05-13）

P3-10-F v0.1 的 prepare-review 是「覆寫式」——若 `--out` 既有檔存在，會無聲覆蓋 reviewer 已填內容。v0.2 補上覆寫保護：

#### F-pre-7-a. 三種寫檔模式

| 情境 | 行為 |
| --- | --- |
| `--out` 不存在 | 正常建立；`summary.overwritten = false` |
| `--out` 已存在 + 未指定 `--overwrite` / `--merge-with` | **exit 2**；印錯誤訊息 + 3 條對策（a/b/c）；**不寫任何檔案** |
| `--out` 已存在 + `--overwrite yes` | 覆寫；`summary.overwritten = true`；batchWarnings 加 `overwrite_enabled` |
| `--out` 已存在 + `--merge-with <path>` | 讀 existing reviewed batch、依 mergeKey 合併；`summary.overwritten = true`；batchWarnings 加 `merged_from_existing_review`（若有 merge）/ `orphaned_existing_review`（若有 orphan） |
| `--out` 不存在 + `--merge-with <path>` | 仍跑 merge（讀 existing 來源並合併到新 batch），但 `summary.overwritten = false` |
| `--overwrite yes` + `--merge-with X` 同時指定 | 合法；以 merge 為主（reviewer edits 保留）；overwrite_enabled 仍會記錄 |

#### F-pre-7-b. mergeKey 規則

優先：`sourceItemId + 從 originalDraft.normalizationNotes 取出的 candidate_index:<n>`
fallback：`sourceItemId + draft.prompt + draft.questionType + draft.starterPart`

兩種來源都能命中：normalizer 條目（draft 在 `item.draft`）與 reviewed 條目（draft 在 `item.originalDraft`）。

#### F-pre-7-c. merge 行為

- **命中現有 reviewer 條目**（new input mergeKey 對應 existing reviewed 條目）：
  - 保留 `reviewerFields`（reviewer 已填內容）+ `reviewStatus`（reviewer 已升的狀態）
  - source provenance（`sourceUrl` / `sourceType` / `resourceType` / `level` / `sourceScore` / `sourceReasons` / `discoveryProvenance`）以**最新 input** 為準（理由：reviewer 驗的是題目本身、上游 metadata 可能因 discovery 重跑而更新、應以最新為準）
  - 加 warning `merged_from_existing_review`
  - status = `queued`（或 `dry_run` 若 `--dry-run yes`）
- **未命中**（fresh draft）：正常 buildReviewItem 預填 reviewerFields template
- **orphaned**（existing 有但新 input 無對應）：
  - 整筆條目保留於 output（reviewer 已填內容不遺失）
  - `status = "orphaned_existing_review"`
  - warning `orphaned_existing_review`
  - reviewer 可決定（a）忽略 / 維持 orphaned 狀態，或（b）若仍想用，手動 rebuild input 或改用 `custom` sourceType 重新匯入

#### F-pre-7-d. summary 新欄位

| 欄位 | 含義 |
| --- | --- |
| `merged` | 從 `--merge-with` 命中既有 reviewer 條目並合併的筆數（subset of `queued` + `dryRun`） |
| `orphaned` | existing 有但新 input 無對應的條目數（保留於 items[]） |
| `overwritten` | 是否實際覆寫了既有 out 檔（boolean） |

#### F-pre-7-e. batchWarnings（top-level 與 items[] 並列）

新增 4 個 code：

| code | 觸發 |
| --- | --- |
| `output_exists_requires_overwrite_or_merge` | exit 2 case 印於 stderr；目前**不寫進 JSON**（exit 2 不寫檔），純錯誤訊息呈現 |
| `overwrite_enabled` | `--overwrite yes` + outExisted=true 觸發 |
| `merged_from_existing_review` | 至少 1 筆 item 從 merge-with 命中時記一筆（per-item warning 也會出現） |
| `orphaned_existing_review` | 至少 1 筆 orphaned 時記一筆（per-item warning 也會出現） |

### F-pre-8. P3-10-K：approved reviewed item → 正式 ExamQuestion（2026-05-14）

> 對應 `scripts/approve_reviewed_questions.mjs` v0.1（2026-05-14）。本輪是 P3-10 系列**最終一步**——把 validate-reviewed passed 的條目扁平化為正式 ExamQuestion 並（明確同意下）寫進 `data/p3-example-questions.json`。**預設 preview，不動正式題庫；雙開關才會寫**。

#### F-pre-8-a. 兩個 mode

| mode | 用途 | 寫 preview JSON | 寫 target |
| --- | --- | --- | --- |
| `preview`（預設） | 看會被轉換成什麼、誰會被 skip | ✅ | ❌（**絕對不動**） |
| `write` + `--write yes` | 真正 append approved items 到 `--target` | ✅ | ✅（追加；無 duplicate 才寫） |
| `write` + `--write no/missing` | — | ❌ | **exit 2**（雙開關保護） |

#### F-pre-8-b. 篩選條件（5 個 AND）

只有同時滿足下列條件才嘗試轉換：

1. validate-reviewed `validationStatus === "passed"`（且 `finalQuestionId` 一致）
2. reviewed `reviewStatus === "approved_for_practice"`
3. `reviewerFields.approved === true`
4. `reviewerFields.approvedForPractice === true`
5. `reviewerFields.finalQuestion` 存在

任一不符 → 標 `status: "skipped"` + 對應 reason code（`skipped_not_in_validation_passed` / `skipped_review_status_not_approved` / `skipped_approved_false` / `skipped_approved_for_practice_false` / `skipped_no_final_question`）。

#### F-pre-8-c. 題型支援（v0.1）

| type | 支援 | 備註 |
| --- | --- | --- |
| `spelling` | ✅ | image 從 imageSrc；不亂補 spellingHint / letterScramble |
| `true-false` | ✅ | answer 強制 yes/no（忽略大小寫） |
| `multiple-choice` | ✅ | options 正規化為 string[]；answer 必須在 options |
| `picture-choice` | ✅ | image 必填（imageSrc）；options string[] |
| `word-choice` | ✅ | options 必須是 `{value, image}` 物件陣列；answer match value |
| `listening-choice` | ✅ | audioSrc 必填；audio legacy field 用 audioSrc 同值；options 自動偵測 text/image |
| `fill-blank` | ✅ | options 選填；有時須 answer 在 options |
| `matching` | ❌ `unsupported_question_type` | template 沒 pairs[] 結構；未來擴 template 後支援 |
| `listening-image-choice` | ❌ `unsupported_question_type` | 不在 QuestionType union（lib/types.ts） |

#### F-pre-8-d. 重複 id 保護（v0.1.1 修補：拆 target / batch 兩種）

duplicate id 偵測同時涵蓋兩個維度：

| 偵測來源 | warning code | 觸發 |
| --- | --- | --- |
| **target 既有** | `duplicate_id_in_target` | finalQuestion.id 已存在於 `--target` 現有正式題目 |
| **同批內部** | `duplicate_id_in_batch` | finalQuestion.id 在本批兩筆以上 ready items 內重複（reviewer 自己同 batch 給了兩筆同 id） |

兩個 mode 行為：

| mode | 行為 |
| --- | --- |
| preview | 命中任一 dup 的 item 標 `status="skipped"` + 對應 warning code；preview JSON 仍寫；target 不動 |
| write + 任一 dup（target 或 batch 任一） | **整批拒絕寫入** + exit 2；但 **preview JSON 仍會寫**（reviewer 可從 items[] 找 dup 條目）；reviewer 須改 id 或從 target 移除既有題目重跑 |

**為何 batch dup 兩筆都 skip**（不是只 skip 第二筆）：reviewer 給了兩筆同 id 通常代表「at least 一筆 id 填錯」，CLI 無法判斷哪筆對；保守起見**全部** skip 等 reviewer 自行決定。

summary 對應欄位：

| 欄位 | 含義 |
| --- | --- |
| `duplicateIds` | target + batch 兩種 dup id 的**聯集數量**（去重） |
| `duplicateIdsInTarget` | 只算 target 既有 dup 的 unique id 數 |
| `duplicateIdsInBatch` | 只算 batch 內部 dup 的 unique id 數 |

#### F-pre-8-e. ExamQuestion 轉換規則（v0.1.1 保守）

- `source`：依 QuestionSource union 規則（v0.1.1 補；見 F-pre-8-e-1）
  - 對齊 `lib/types.ts` `QuestionSource` union 4 種：`official_sample` / `past_paper` / `ai_generated` / `custom`
  - finalQuestion.source 為空或缺值 → 預設 `custom`
  - finalQuestion.source 在 union → 使用該值
  - finalQuestion.source **非空但不在 union** → 條目 `status="failed"` + error `invalid_question_source`，**不** silent fallback 為 custom
  - reviewer 若想表達第三方來源（`user_provided` / `third_party` / 等），請保留於 `reviewerNotes` 或 discovery provenance；**不**寫入正式 `QuestionSource` union
- `starterPart`：使用 finalQuestion.starterPart；缺值時依 type fallback（spelling→RW3、true-false→RW1、picture-choice→RW1、word-choice→RW3、multiple-choice→RW4、fill-blank→RW4、listening-choice→L3）
- `starterSection`：listening-* → `listening`；其餘 → `reading-writing`
- `image`：從 finalQuestion.imageSrc 抓；只在非空時填
- `audioSrc`：listening-choice 才透傳；同時設 `audio` 為相同值（schema legacy 必填）
- `explanation`：只在非空時填
- **不自動補**：spellingHint / letterScramble / topic / promptVersion / skillFocus / expectedAnswerType / difficulty 等選填欄位（reviewer 想加可在 finalQuestion 設）

#### F-pre-8-f. Preview output schema

```jsonc
{
  "batchId": "approvebatch-<ISO>",
  "createdAt": "...",
  "source": "approve_reviewed_questions.mjs@v0.1",
  "mode": "preview" | "write",
  "write": true | false,
  "reviewedInput": "<absolute path>",
  "validationInput": "<absolute path>",
  "target": "<absolute path>",
  "summary": {
    "totalReviewed": <int>,
    "validationPassed": <int>,
    "readyToAppend": <int>,
    "skipped": <int>,
    "failed": <int>,
    "duplicateIds": <int>,
    "targetExistingCount": <int>
  },
  "items": [
    {
      "sourceItemId", "sourceUrl", "sourceType",
      "finalQuestionId", "finalQuestionType",
      "reviewStatusClaim",
      "status": "ready | skipped | failed",
      "warnings": [...],
      "errors": [...],
      "question": null | { ExamQuestion schema }
    }
  ]
}
```

#### F-pre-8-g. P3-10-K 第二刀：first practice paper 組裝 / paper-level metadata（2026-05-14）

> 對應 `scripts/assemble_practice_paper.mjs` v0.1（2026-05-14）。本輪是 P3-10-K 系列第二刀——把正式題庫（`data/p3-example-questions.json`）內已 commit 的 ExamQuestion 組裝成完整 `ExamPaper`（paper-level metadata），但**仍不切換 `/quiz` 載入來源**（lib/data.ts 完全未動）。

##### 兩個 mode + 雙開關

| mode | 用途 | 寫 preview JSON | 寫 `--papers` target |
| --- | --- | --- | --- |
| `preview`（預設） | 看會組成什麼 paper、缺哪些 part | ✅ | ❌ |
| `write` + `--write yes` | 真正 append 新 paper 到 `--papers`（必須 paper id 不重複） | ✅ | ✅ |
| `write` + `--write no/missing` | — | ❌ | **exit 2** |

##### 組裝策略（v0.1 保守）

- **不挑題、不重排**：保留 `--questions` array 原順序。
- **依 starterSection 分組**：listening / reading-writing / speaking 三個 section；缺值時依 `question.type` fallback（`listening-choice` → listening；其他 → reading-writing）。
- **沒題目的 section 不出現**（避免空 section）。
- **--limit 限制總題數**；超過的標 `skip_due_to_limit` warning（前 N 題進 paper）。
- **不硬造題**：題目不足某 part 只標 warning `insufficient_questions_for_part`，CLI 不偽造資料。
- **不修改 question 內容 / id**：只引用 questionIds。

##### sourceMix 統計規則

- 對 4 種 `QuestionSource` union 字面量（official_sample / past_paper / ai_generated / custom）逐一累計 question.source。
- 對齊現有 example `sourceMix` 結構：只列有題目的 source（為 0 的 key 不出現）。
- 若 question.source 不在 union（如 reviewer 之前誤寫的 third_party / user_provided）→ 不計入 sourceMix，並標 warning `unknown_source_value`。

##### Part 覆蓋率檢查

對 9 個 Cambridge Starters Parts（L1-L4 / RW1-RW5）逐一檢查：

- partBreakdown 紀錄每 part 的題數（含 0）。
- 任一 part 為 0 題 → 標 warning `insufficient_questions_for_part`。
- 不會 crash；reviewer 可看出哪些 part 還缺題目（屬 P3-10-G / H / I / J 後續題庫擴充範圍）。

##### Duplicate paper id 保護

| 觸發 | preview mode | write mode |
| --- | --- | --- |
| `--paper-id` 已存在於 `--papers` 既有 papers | 標 warning `duplicate_paper_id`；preview JSON 仍寫；target 不動 | **整批 exit 2**；preview JSON 仍寫；target 不動；reviewer 須改 `--paper-id` 或從 papers 移除既有同 id paper |

##### Output schema

preview / write 兩 mode 共用：

```jsonc
{
  "batchId": "paperbatch-<ISO>",
  "createdAt": "...",
  "source": "assemble_practice_paper.mjs@v0.1",
  "mode": "preview" | "write",
  "write": true | false,
  "questionsInput": "<absolute path>",
  "papersInput": "<absolute path>",
  "summary": {
    "totalQuestionsAvailable": <int>,
    "totalQuestionsSelected": <int>,
    "sections": <int>,
    "sourceMix": { "ai_generated": N, "custom": N, ... },
    "partBreakdown": { "L1": N, "L2": N, ..., "RW5": N },
    "warnings": <int>,
    "isDuplicatePaperId": <bool>,
    "existingPapersCount": <int>
  },
  "paper": {
    "examPaperId": "<--paper-id>",
    "title": "...",
    "description": "...",
    "sections": [ ExamSection ],
    "sourceMix": { ... },
    "createdAt": "...",
    "updatedAt": "..."
  },
  "warnings": [ { "code", "message" } ]
}
```

##### Warning code

| code | 觸發 |
| --- | --- |
| `no_questions_available` | --questions 是空 array（CLI 仍寫 preview、exit 0；write mode 不寫 target） |
| `unknown_starter_section_fallback` | question.starterSection 不在 listening/reading-writing/speaking |
| `unknown_source_value` | question.source 不在 QuestionSource union |
| `insufficient_questions_for_part` | 9 個 Starters parts 中某 part 觀察到 0 題 |
| `skip_due_to_limit` | 超過 --limit 的題目（不進 paper） |
| `duplicate_paper_id` | --paper-id 與 --papers 內既有 examPaperId 重複 |
| `paper_has_zero_sections` | 組完後 paper.sections 為空（仍寫 preview、不寫 target） |

##### 不在 P3-10-K 第二刀 v0.1 範圍

- ❌ 不切換 `/quiz` 載入來源（lib/data.ts 完全未動）
- ❌ 不挑題、不重排既有題目順序
- ❌ 不自動補題（題目不足 part 只 warning）
- ❌ 不修改正式題庫（`data/p3-example-questions.json` 唯讀）
- ❌ 不覆蓋既有 paper（duplicate paper id 全域 exit 2）
- ⬜ Section 內題目順序自動排序（依 starterPart L1→L4 / RW1→RW5）
- ⬜ Speaking section 內容（屬 P4 範圍）
- ⬜ `lib/data.ts` 加 paper id 過濾或 imported papers 整合（屬 P3-10-K 第三刀）
- ⬜ Cambridge Starters 官方題量對齊（Listening 20Q / R&W 25Q）

---

#### F-pre-8-h. 不在 P3-10-K v0.1 範圍

- ❌ 不自動產生題目；不呼叫 OpenAI；不下載 PDF / image / audio；不解析 PDF
- ❌ 不讓非 approved_for_practice 條目進正式題庫
- ❌ 不覆蓋既有正式題目（duplicate id 全域 exit 2）
- ❌ 不支援 matching / listening-image-choice 寫入正式題庫（reviewerFields template 不足）
- ❌ 不自動 commit（reviewer 跑 write 後自行 git diff + commit）
- ⬜ 自動補 `spellingHint` / `letterScramble` 等選填欄位（屬未來 enhancement）
- ⬜ matching template 擴張 + 寫入支援
- ⬜ Review UI dashboard 顯示 preview JSON 內容
- ⬜ `--rollback` flag（讓 reviewer 復原寫入）

---

### F-pre-9. 不在 P3-10-F v0.1 範圍

- ❌ 不呼叫 OpenAI（與 P3-10-E 一致）
- ❌ 不下載 PDF / image / audio；不解析 PDF
- ❌ 不修改 `data/p3-example-questions.json` / `data/exam-papers.example.json`
- ❌ 不讓 `/quiz` 使用 imported 題庫
- ❌ 不自動 approve / 不猜 answer / options
- ❌ 不修改 `reviewed-questions.generated.json`（validate-reviewed 只讀）
- ⬜ approved → 寫入正式題庫的工具（屬 P3-10-K 範圍）
- ⬜ Review dashboard / UI（本輪 CLI + JSON workflow，無 UI）
- ⬜ 多 reviewer 簽核流程
- ⬜ 與 `docs/AI_QUESTION_GENERATION.md` 6 項品質檢查的整合（人工目視，未自動化）

---

## F. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) | 既有 schema 仍是權威；normalizer 輸出必須相容 |
| [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) | sourceType 7 種字面量 + 三層架構 |
| [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md) | normalizer 的 input 來源 |
| [`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md) | AI normalizer prompt 可重用既有 AI 出題 prompt |
| [`docs/STARTERS_PART_TEMPLATES.md`](./STARTERS_PART_TEMPLATES.md) | 各 Part 的題目互動方式與資料欄位建議 |
| [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) | source-first gate：normalizer 只能接受 source registry `approved_for_import` 的條目（P3-10-L） |

---

## G. 版本

- **v4.3**（2026-05-14，P3-10-L：正式來源優先匯入規則 + Source Registry）：A 段「關鍵原則」補 source-first 條（normalizer 只能接受 source registry `approved_for_import` 來源、ai_generated 不得補正式題庫數量）；F 段「與既有文件的關係」加 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) 對齊重點。本檔仍屬規劃層，**不修改** schema / 不修改正式題庫 / 不修改 normalizer 實作；後續刀數可在 normalizer 內補 source registry gate 檢查（屬未來範圍，本輪不做）。
- **v4.2**（2026-05-14，P3-10-K 第二刀：first practice paper 組裝 / paper-level metadata）：F-pre-8 新增 F-pre-8-g 段共 7 個子段（兩 mode + 雙開關 / 組裝策略 / sourceMix 統計 / Part 覆蓋率檢查 / Duplicate paper id 保護 / Output schema / Warning code 表 / v0.1 不做清單）；原 F-pre-8-g「不在 v0.1 範圍」更名 F-pre-8-h。對應 `scripts/assemble_practice_paper.mjs` v0.1：預設 preview、雙開關（`--mode write` + `--write yes`）；duplicate paper id 全域 exit 2；不挑題不重排；不切換 `/quiz` 載入來源（lib/data.ts 未動）。
- **v4.1**（2026-05-14，P3-10-K 修補：Codex 有條件通過後）：F-pre-8-d 改寫拆 `duplicate_id_in_target` / `duplicate_id_in_batch` 兩個 warning code + 對應 summary 欄位 `duplicateIdsInTarget` / `duplicateIdsInBatch`（`duplicateIds` 仍記聯集數量）；F-pre-8-e 補 `source` 規則對齊 `QuestionSource` union 4 種字面量、非 union 值不 silent fallback。對應 `scripts/approve_reviewed_questions.mjs` v0.1.1。
- **v4**（2026-05-14，P3-10-K）：F-pre 段新增 F-pre-8 段「P3-10-K：approved reviewed item → 正式 ExamQuestion」含 7 個子段（兩 mode / 5-AND 篩選 / 題型支援表 9 種 / duplicate id 保護兩 mode 行為 / ExamQuestion 轉換規則 v0.1 保守 / preview output schema / v0.1 不做清單）；原 F-pre-8 更名 F-pre-9。對應 `scripts/approve_reviewed_questions.mjs` v0.1：preview 預設、絕對不動正式題庫；write 需雙開關（`--mode write` + `--write yes`）；duplicate id 全域 gate。**仍不自動 commit 正式題庫**——reviewer 跑 write 後自行 git diff 確認後 commit。
- **v3.1**（2026-05-13，P3-10-F 後續：reviewed output 覆寫保護 / merge-with）：F-pre 段新增 F-pre-7 覆寫保護段（含 F-pre-7-a 三種寫檔模式表、F-pre-7-b mergeKey 規則、F-pre-7-c merge 行為、F-pre-7-d summary 新欄位 `merged` / `orphaned` / `overwritten`、F-pre-7-e batchWarnings 4 個 code）；F-pre-7「不在 v0.1 範圍」更名為 F-pre-8。對應 `scripts/review_normalized_questions.mjs` v0.2：`--out` 已存在且未指定 `--overwrite` / `--merge-with` 時 **exit 2**；`--merge-with` 合併 reviewerFields + reviewStatus、source provenance 以最新 input 為準；orphaned 條目保留於 output 並標 `status: orphaned_existing_review`。
- **v3**（2026-05-13，P3-10-F）：新增 F-pre 段「P3-10-F：匯入題目人工審核流程（v0.1）」共 7 個子段（F-pre-1 兩個 mode / F-pre-2 prepare-review filter 與 5 種 skip reason / F-pre-3 reviewerFields template / F-pre-4 reviewer 操作流程 4 步 / F-pre-5 validate-reviewed 驗證規則表 / F-pre-6 兩種 mode 的 output schema / F-pre-7 v0.1 不做清單）；對應 `scripts/review_normalized_questions.mjs` v0.1。**仍不寫正式題庫**——正式 `data/p3-example-questions.json` 寫入屬 P3-10-K。
- **v2**（2026-05-13，P3-10-E）：E 段完全重寫——把「Normalizer 實作建議（本輪不實作）」改為「Normalizer 實作（P3-10-E 第一版：rule-based / mock-ai 原型）」，含 E-1 input / E-2 mode 對應表（rule-based ✅ / mock-ai ✅ / openai exit 2） / E-3 6 種 skipped 分類 / E-4 observation 路徑 / E-5 draft 路徑（保守邊界：answer=null / options=[]）/ E-6 一律標 reviewStatus=needs_human_review + isReadyForPractice=false / E-7 batch output schema / E-8 v0.1 不做清單。對應 `scripts/normalize_collected_sources.mjs` v0.1。
- **v1**（2026-05-13）：第一版——P3-10-C 規劃文件、reviewStatus 5 狀態機、normalizer 輸出格式、id 規則建議、必填 vs 選填欄位、與既有文件分工。Normalizer 實作屬 P3-10-E、本輪未實作。
