# Data Schema

第一版資料以靜態 JSON 為主，集中在 `data/` 目錄。型別定義在 `lib/types.ts`。

---

## `data/vocabulary.json`

陣列，每筆代表一個單字。

```jsonc
{
  "id": "apple",                     // 全域唯一 slug
  "word": "apple",                   // 英文單字（小寫）
  "pos": "noun",                     // 詞性：noun | verb | adjective | adverb | number | preposition | pronoun
  "category": "food",                // 主題分類：food | animals | colors | numbers | family | body | school | home | weather | actions | other
  "translation": "蘋果",              // 中文翻譯
  "exampleEn": "I like a red apple.", // 例句（英文）
  "exampleZh": "我喜歡一顆紅蘋果。",     // 例句（中文）
  "image": "/images/apple.png",      // 可省略，沒有就不顯示
  "audio": "/audio/apple.mp3"        // 可省略
}
```

規則：

- `id` 在整份 vocabulary 中唯一，建議直接用 `word`。
- `image` / `audio` 路徑相對於 `public/`。
- `image` 可指向 `.svg` 或 `.png`（瀏覽器與 `<img>` / `new window.Image()` 對兩者載入行為一致；缺檔則由 `<PracticeImage>` / `<VocabularyCard>` 既有 fallback 顯示首字母）。color 類單字（red / blue …）的圖片**不要在圖內放單字英文**，避免看圖選字題型直接洩漏答案。
- 新增分類前先到 `lib/types.ts` 的 `VocabularyCategory` 新增字串字面量。

---

## `data/quizzes.json`

陣列，每筆代表一份測驗。

```jsonc
{
  "id": "starter-quiz-001",
  "title": "Starters · 入門小測驗",
  "description": "8 題快速暖身：顏色、動物、水果。",
  "questions": [
    {
      "id": "q1",
      "type": "multiple-choice",
      "prompt": "Which one is a fruit?",
      "options": ["cat", "apple", "red", "two"],
      "answer": "apple"
    }
  ]
}
```

規則：

- 每題 `id` 在所屬 quiz 中唯一即可。
- `answer` 對於 `multiple-choice` 必須是 `options` 中的其中一個字串。
- `type` 是 discriminator，未來新題型直接擴充字面量。

---

## P3 考前練習：題庫 / 考卷 / Session schema

> 本節定義 P3 測驗區的完整資料設計。對應 TypeScript 型別在 `lib/types.ts` 的「P3 考前練習題庫 / 考卷 / Session schema」區塊。
> P1~P2 既有的 `data/quizzes.json` 結構（簡單 multiple-choice）保留不動；P3 schema 與舊 schema **並存**，未來若要統一再做遷移。

### 題目來源（`QuestionSource`）

每題必填一個 `source` 標記，便於日後篩選練習範圍（例如「只練 sample papers」「只練 AI 仿真題」）。

| 標記 | 說明 |
| --- | --- |
| `official_sample` | 官方公開的 sample papers / 樣題整理出的題目 |
| `past_paper` | 歷屆考題整理（僅供自家學習使用，不對外散布） |
| `ai_generated` | 由 AI 依題型風格生成的仿真題 |
| `custom` | 使用者自製或老師補充的題目 |

### 共用題目欄位（`BaseQuestion`）

```jsonc
{
  "id": "q1",                          // 題目唯一識別碼
  "type": "multiple-choice",            // 題型 discriminator（見下節）
  "source": "official_sample",          // QuestionSource
  "prompt": "Which one is a fruit?",    // 題幹文字（可省略，例如純圖題）
  "explanation": "蘋果是水果，cat 是動物。",  // 解析（給結算頁與錯題複習頁，語氣須小一友善）
  "image": "/images/q1.svg",           // 題目圖片（可省略）
  "audio": "/audio/q1.mp3",            // 題目音檔（listening 題型必填）
  "difficulty": "easy",                 // easy | medium | hard（可省略）
  "topic": "food",                      // 主題（可對應 vocabulary category）
  "promptVersion": "starters-rw-v1"     // AI 生成題的 prompt 版本（僅 ai_generated 用）
}
```

### 題型總覽（`QuestionType`）

| 題型 | 用途 | 必要欄位 |
| --- | --- | --- |
| `multiple-choice` | 通用文字 4 選 1 | `prompt` + `options` + `answer` |
| `picture-choice` | 看圖選字（題目圖 + 4 文字選項） | `image` + `options` + `answer` |
| `word-choice` | 看字選圖（題目文字 + 4 圖片選項） | `prompt` + `options[].image` + `answer` |
| `listening-choice` | 聽力選擇 | `audio` + `options` + `answer` |
| `fill-blank` | 填空（選項版或自由填空版） | `prompt` + `answer` |
| `matching` | 連連看 | `pairs` |

### `multiple-choice`：通用文字 4 選 1

```jsonc
{
  "id": "q1",
  "type": "multiple-choice",
  "source": "custom",
  "prompt": "Which one is a fruit?",
  "options": ["cat", "apple", "red", "two"],
  "answer": "apple"
}
```

要點：`answer` 必須是 `options` 中的其中一個字串。

### `picture-choice`：看圖選字

```jsonc
{
  "id": "q2",
  "type": "picture-choice",
  "source": "ai_generated",
  "image": "/images/apple.svg",
  "prompt": "What is this?",
  "options": ["apple", "banana", "cat", "dog"],
  "answer": "apple",
  "explanation": "圖片是紅色的圓形水果，是 apple。"
}
```

要點：`image` 必填；`prompt` 可省略（純圖題）。

### `word-choice`：看字選圖

```jsonc
{
  "id": "q3",
  "type": "word-choice",
  "source": "ai_generated",
  "prompt": "apple",
  "options": [
    { "value": "apple", "image": "/images/apple.svg" },
    { "value": "banana", "image": "/images/banana.svg" },
    { "value": "cat", "image": "/images/cat.svg" },
    { "value": "dog", "image": "/images/dog.svg" }
  ],
  "answer": "apple"
}
```

要點：`prompt` 必填（題目英文單字）；`options` 為 `ImageOption[]`；`answer` 對應某個 `options[i].value`。圖片缺檔時由 fallback 顯示首字母（不洩漏答案的視覺）。

### `listening-choice`：聽力選擇

```jsonc
{
  "id": "q4",
  "type": "listening-choice",
  "source": "ai_generated",
  "audio": "/audio/q4.mp3",
  "transcript": "What does the boy want?",
  "ttsScript": "What does the boy want?",
  "optionType": "text",
  "options": ["apple", "banana", "cat", "dog"],
  "answer": "apple"
}
```

要點：

- `audio` 必填。
- `transcript`：字幕，給家長 / 老師看，**不顯示給小朋友**。
- `ttsScript`：給 TTS 生成音檔的腳本（可加 SSML 等），與 `transcript` 不一定相同。
- `optionType`：`"text"`（文字選項）或 `"image"`（圖片選項，`options` 改用 `ImageOption[]`）；預設 `"text"`。

### `fill-blank`：填空

```jsonc
// 選項版（給選的）
{
  "id": "q5",
  "type": "fill-blank",
  "source": "custom",
  "prompt": "The sky is ___.",
  "options": ["red", "blue", "green"],
  "answer": "blue"
}

// 自由填空版（不給選項）
{
  "id": "q6",
  "type": "fill-blank",
  "source": "custom",
  "prompt": "I have a ___.",
  "answer": "cat"
}
```

要點：

- 有 `options` → 渲染成選擇題式填空。
- 無 `options` → 渲染成文字輸入框，比對時**忽略大小寫與前後空白**。

### `matching`：連連看

```jsonc
{
  "id": "q7",
  "type": "matching",
  "source": "custom",
  "prompt": "把英文單字配對到正確的圖片。",
  "pairs": [
    { "left": "cat", "right": "/images/cat.svg" },
    { "left": "dog", "right": "/images/dog.svg" },
    { "left": "apple", "right": "/images/apple.svg" }
  ]
}
```

要點：正確配對由 `pairs` 原始順序決定（`pairs[i].left` ↔ `pairs[i].right`）；UI 端打散後讓使用者拖曳 / 點選配對。

---

## 完整考卷（`ExamPaper`）

一份完整考卷由多個 section 組成（例如 Listening / Reading & Writing），對齊 Cambridge Starters 真實考試結構。

```jsonc
{
  "examPaperId": "starters-mock-001",
  "title": "Starters 模擬考 #1",
  "description": "10 題快速暖身：含聽力與看字選圖。",
  "sections": [
    {
      "id": "listening",
      "title": "Listening",
      "description": "聽音選圖 / 聽句子選答案",
      "questionIds": ["q-l-001", "q-l-002", "q-l-003"]
    },
    {
      "id": "reading-writing",
      "title": "Reading & Writing",
      "questionIds": ["q-rw-001", "q-rw-002", "q-rw-003", "q-rw-004"]
    }
  ],
  "sourceMix": {
    "official_sample": 2,
    "ai_generated": 4,
    "custom": 1
  },
  "createdAt": "2026-05-08T00:00:00.000Z",
  "updatedAt": "2026-05-08T00:00:00.000Z"
}
```

欄位說明：

| 欄位 | 說明 |
| --- | --- |
| `examPaperId` | 考卷模板唯一識別碼，對應 `ExamSessionState.examPaperId`。 |
| `title` / `description` | 顯示用文字。 |
| `sections` | 段落清單；`questionIds` 為該段落題目 id 順序，對應外部題庫的 `id`（題庫存放方式由 P3-2 定案，可能是 `data/exam-questions/*.json` 或單一檔）。 |
| `sourceMix` | 各 `QuestionSource` 在這份卷的題數彙總，給篩選 / 選卷頁顯示用。 |
| `createdAt` / `updatedAt` | ISO 8601 時間戳。 |

> **檔案放置**：本輪在 `data/exam-papers.example.json` 提供一份範例考卷；實際題庫匯入流程由 P3-2 定案。

---

## Exam Session（localStorage 狀態）

對應 `docs/PRODUCT_SPEC.md`「測驗與考前練習方向 → 完整考卷 Session → 作答進度保存」。

一份 `examPaperId` 可重新測驗產生**新的 Session**；舊 Session 保留直到使用者刪除或被覆蓋。

```jsonc
{
  "examSessionId": "sess-2026-05-08-001",
  "examPaperId": "starters-mock-001",
  "questionOrder": ["q-l-001", "q-l-002", "q-l-003", "q-rw-001", "q-rw-002", "q-rw-003", "q-rw-004"],
  "answers": {
    "q-l-001": "apple",
    "q-l-002": "blue",
    "q-rw-001": "cat"
  },
  "currentIndex": 3,
  "submitted": false,
  "score": null,
  "wrongQuestionIds": [],
  "createdAt": "2026-05-08T09:00:00.000Z",
  "updatedAt": "2026-05-08T09:05:30.000Z",
  "schemaVersion": 1
}
```

欄位說明：

| 欄位 | 說明 |
| --- | --- |
| `examSessionId` | Session 唯一識別碼。 |
| `examPaperId` | 對應的考卷模板 id。 |
| `questionOrder` | 題目實際 render 順序（生成時可打散，恢復時必須一致）。 |
| `answers` | 題目作答 map（`ExamAnswerMap`）：key = 題目 id；value = `string`（選擇 / 填空）或 `string[]`（matching：依左欄順序的右欄配對結果）。 |
| `currentIndex` | 目前進度（從 0 開始；對應 `questionOrder` 的 index）。 |
| `submitted` | 是否已交卷。 |
| `score` | 交卷後分數（答對題數）；未交卷為 `null`。 |
| `wrongQuestionIds` | 答錯題目 id 清單（交卷後填入）。 |
| `createdAt` / `updatedAt` | ISO 8601 時間戳。 |
| `schemaVersion` | localStorage migration 用；P3-1 第一版 = `1`。未來欄位變動時遞增並寫對應的 migration 邏輯。 |

### localStorage key 命名約定（P3-1 提案）

> 由 P3-6 實作時定案，本節僅為提案方便對齊。

```
csp:examSession:<examSessionId>        // 一筆 Session
csp:examSessionIndex                    // 所有 Session id 索引（用於列表）
csp:examPaperLastSession:<examPaperId>  // 該考卷的最近 Session id（用於「繼續作答」入口）
```

### 不在 P3-1 範圍

下列項目**不在** P3-1 schema 設計範圍，由後續子階段定案：

- localStorage 實際讀寫 helper：屬 P3-6。
- 題庫實際存放結構（單一大檔 vs 分檔）：屬 P3-2「本機資料匯入流程」。
- AI 仿真題的 prompt 標準格式：屬 P3-3。
- 計時器：第一版不計時（見 PRODUCT_SPEC「完整考卷 Session」）。

---

## 本機素材匯入流程（P3-2-A）

P3 題庫的「上游」整理流程定義在 `source_materials/`。本節做高層說明；**詳細 SOP 見 [`../source_materials/README.md`](../source_materials/README.md)**，範例草稿格式見 [`../source_materials/custom/example-question-draft.md`](../source_materials/custom/example-question-draft.md)。

### 三層資料分工

| 層 | 位置 | 用途 | 是否 commit |
| --- | --- | --- | --- |
| **整理區** | `source_materials/<分類>/` | 使用者手動整理的題目草稿（純文字） | 純文字 commit；二進位（PDF / 圖 / 音）由子目錄 `.gitignore` 排除 |
| **正式題庫** | `data/*.json` | 給 app 載入的 P3 題庫 / 考卷 / 範例 | commit |
| **靜態素材** | `public/images/` / `public/audio/` | app 可直接 `<img>` / `<audio>` 載入的本機檔案 | 自製素材 commit；外部 / 官方素材一律不 commit |

### `source` 欄位 ↔ 整理區子目錄

每筆 P3 題目必填 `source`，與 `source_materials/` 的子目錄一一對應：

| `source` | `source_materials/<目錄>` | 說明 |
| --- | --- | --- |
| `official_sample` | `samples/` | 官方公開的 sample / 樣題整理 |
| `past_paper` | `past_papers/` | 歷屆考題整理（自家學習用，不對外散布） |
| `ai_generated` | `ai_generated/` | AI 依 Starters 風格生成的仿真題 |
| `custom` | `custom/` | 使用者自製或老師補充 |

### 工作流程概念

```
   使用者手動整理       （未來 P3-2-B 轉換工具或人工）
   ─────────────────────────────────────────────────────
   source_materials/<分類>/*.md    →    data/*.json    →    app 載入
   （整理區，原始草稿）                   （正式題庫）         （`/quiz` 渲染，P3-6）

   public/images/*.svg / .png      ←━━━━━━━━━━━━━━━━━━━━━━━━━━┘
   public/audio/*.mp3              ←━━━━━━━━━━━━━━━━━━━━━━━━━━┘
   （靜態素材，題目 image / audio 欄位指向）
```

### P3-2-A vs P3-2-B 範圍

- **P3-2-A**（本輪已完成）：資料夾結構、SOP 文件、`source` 對應、git 政策、範例草稿格式。**純人工流程，不寫任何自動化程式**。
- **P3-2-B**（尚未開始）：自動文字 → JSON 轉換工具、圖片 / 音檔命名 helper、TTS 自動生成 wrapper 等。**本輪不做**。

### 嚴禁

對齊 `docs/PRODUCT_SPEC.md`「測驗與考前練習方向 → 素材策略」與「目前明確不做」：

- ❌ 自動網路爬蟲（任何時候）。
- ❌ 下載 Cambridge 官方圖片 / 歷屆題官方圖片。
- ❌ commit 有版權風險的二進位素材（PDF / 官方圖 / 官方音）—— `source_materials/.gitignore` 已排除。
- ❌ 在題目 JSON 中放外部 URL（`image` / `audio` 一律本機路徑 `/images/<filename>` / `/audio/<filename>`）。

---

## AI 仿真題草稿與正式題庫的關係（P3-3）

P3-3 規範「請 AI 生成 Cambridge Starters 風格自製仿真題」的 prompt 格式與草稿輸出。詳細規格與 prompt 範本見：

- [`AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md)（規格文件）
- [`../source_materials/ai_generated/prompt-template.md`](../source_materials/ai_generated/prompt-template.md)（可直接複製給 AI 的 prompt 範本）
- [`../source_materials/ai_generated/example-ai-questions.md`](../source_materials/ai_generated/example-ai-questions.md)（AI 草稿範例 6 題覆蓋 6 題型）

### 流程：AI 草稿 → 正式題庫

```
   prompt 範本                   AI 草稿存放                            人工審核                     正式題庫
   ─────────────────────────────────────────────────────────────────────────────────────────────────────
   prompt-template.md       →   source_materials/ai_generated/        →   依 6 項          →    data/*.json
   （含可調參數 + 自我          <YYYY-MM-DD>-<topic>-batch<NN>.md       品質檢查清單           （對齊
    檢查清單 8 項）             （含 imagePrompt / ttsScript 草稿欄位）                            ExamQuestion）
                                                                                                     ↓
                                       自製 SVG 插畫 / TTS 音檔  →  public/images/  /  public/audio/
```

### 草稿欄位 vs 正式 schema 欄位

AI 草稿層保留兩個 P3-1 schema **沒有**的欄位，給人類整理者轉檔時參考：

| 草稿欄位 | 用途 | 正式 schema 是否保留 |
| --- | --- | --- |
| `imagePrompt` | 描述「自製插畫應該畫什麼」，給人類整理者繪製 SVG 用 | **不保留**——轉檔時換成 `image` 路徑 |
| `ttsScript` | 描述「TTS 應該唸什麼」，給人類整理者用 macOS `say -o` 等工具自製音檔 | **可保留**：`ListeningChoiceQuestion.ttsScript` 已是正式型別欄位 |
| `notes` | 給整理者的私人備註 | **不保留**——轉檔時不帶進 JSON |

> 若未來決定把 `imagePrompt` 也納入正式 schema（例如給未來自動圖像生成用），需先更新 `lib/types.ts` 與 `docs/DATA_SCHEMA.md` P3-1 schema 段，**並由 ChatGPT / 維護者收斂後動工**，本輪不做。

### `source` 強制標 `ai_generated`

- 每題 `source` **必須**是 `"ai_generated"`，不得標其他值。
- 建議附 `promptVersion`（例如 `starters-v1`），便於日後 prompt 改版時回溯出題品質。
- 嚴禁在 AI 草稿或正式 JSON 中假裝為 `official_sample` / `past_paper` / `custom`。

### 本輪 P3-3-A 範圍 vs 不做

| 範圍 | 內容 |
| --- | --- |
| ✅ **P3-3-A**（本輪已完成） | prompt 範本、草稿輸出格式、品質檢查清單、規格文件 |
| ⬜ **P3-3-B**（未開始） | AI API 客戶端串接（OpenAI / Anthropic）、自動把草稿轉 JSON（屬 P3-2-B）、自動圖像生成、自動 TTS wrapper |
| ❌ **永久不做** | AI 自動評分（自動判答；見 `docs/PRODUCT_SPEC.md`「目前明確不做」） |
