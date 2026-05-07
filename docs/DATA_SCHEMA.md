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

## 未來題型擴充方向

以下型別目前**尚未實作**，先在這裡記下未來的設計方向，以便之後 schema 一致演進。

### Listening

```jsonc
{
  "id": "l1",
  "type": "listening",
  "audio": "/audio/quiz/q1.mp3",
  "prompt": "What does the boy want?",
  "options": ["apple", "banana", "cat", "dog"],
  "answer": "apple"
}
```

要點：題目主體是音檔；可選擇是否搭配圖片選項（`optionType: "text" | "image"`）。

### Matching

```jsonc
{
  "id": "m1",
  "type": "matching",
  "prompt": "把英文單字配對到正確的圖片。",
  "pairs": [
    { "left": "cat", "right": "/images/cat.png" },
    { "left": "dog", "right": "/images/dog.png" }
  ]
}
```

要點：正確配對由原始順序決定；UI 端打散後讓使用者拖曳 / 點選配對。

### Fill-in-the-blank

```jsonc
{
  "id": "f1",
  "type": "fill-blank",
  "prompt": "The sky is ___.",
  "answer": "blue",
  "options": ["red", "blue", "green"]   // 可選；省略代表自由填空
}
```

要點：

- 有 `options` → render 成選擇題式填空。
- 沒有 `options` → render 成文字輸入框，比對時忽略大小寫與前後空白。

### 模擬考組合

未來模擬考一份檔可能由多個 quiz 組成，並加上時間限制：

```jsonc
{
  "id": "mock-001",
  "title": "Cambridge Starters · 模擬考 1",
  "timeLimitSec": 1200,
  "sections": [
    { "title": "Listening", "quizId": "starter-quiz-listening-1" },
    { "title": "Reading & Writing", "quizId": "starter-quiz-rw-1" }
  ]
}
```

實作此項時：

- 新增 `data/mocks.json`
- 把對應型別補進 `lib/types.ts`
- 更新本檔
