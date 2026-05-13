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

## E. Normalizer 實作建議（P3-10-E 範圍、本輪不實作）

### Input

- `data/imported/source-document.generated.json`（collector 產出）
- 篩選條件：`extractedCandidates[].candidateType === "question"` 或 `"vocabulary"`

### 處理

1. 每個 candidate 嘗試對齊 8 種 type 之一
2. 拼出 prompt / options / answer / explanation / metadata
3. 重用既有 SVG（從自家 `public/images/` 對齊 candidate.text 含的物件名）
4. 不放外部 URL 到 `image` / `audioSrc`
5. 算 candidateConfidence（最低 0.0 / 最高 1.0）
6. 依 confidence 與結構完整度標 `reviewStatus`

### Output

- `data/imported/normalized-questions.generated.json`：array of normalized questions

### 不在 normalizer 範圍

- 不直接寫入 `data/p3-example-questions.json`
- 不上傳官方題目 / 歷屆題給 OpenAI API
- 不下載外部圖片 / 音檔到 `public/`
- 不自動 approve

---

## F. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) | 既有 schema 仍是權威；normalizer 輸出必須相容 |
| [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) | sourceType 7 種字面量 + 三層架構 |
| [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md) | normalizer 的 input 來源 |
| [`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md) | AI normalizer prompt 可重用既有 AI 出題 prompt |
| [`docs/STARTERS_PART_TEMPLATES.md`](./STARTERS_PART_TEMPLATES.md) | 各 Part 的題目互動方式與資料欄位建議 |

---

## G. 版本

- **v1**（2026-05-13）：第一版——P3-10-C 規劃文件、reviewStatus 5 狀態機、normalizer 輸出格式、id 規則建議、必填 vs 選填欄位、與既有文件分工。Normalizer 實作屬 P3-10-E、本輪未實作。
