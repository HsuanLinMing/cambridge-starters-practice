# 範例題目草稿（custom）

> 本檔示範「在 `source_materials/custom/` 寫題目草稿」的格式。
> **本檔不含官方真題，只示範整理格式**。實際自製題請另開新檔（命名 `<日期>-<主題>-<批次>.md`）。
>
> 上游格式自由（為了讓使用者好寫），下游轉成 `data/*.json` 時須對齊 `lib/types.ts` 的 `BaseQuestion` + `ExamQuestion`、`docs/DATA_SCHEMA.md` 的 P3 schema。

## 草稿欄位對照

每題草稿建議涵蓋以下欄位：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | ✓ | 題目唯一識別碼，建議 `<題型前綴>-<分類>-<流水號>`（例：`q-mc-food-001`） |
| `type` | ✓ | `multiple-choice` / `picture-choice` / `word-choice` / `listening-choice` / `fill-blank` / `matching` |
| `source` | ✓ | 本資料夾草稿一律 `custom`（其他來源請放對應子目錄） |
| `prompt` | 視題型 | 題幹文字；某些純圖題可省略 |
| `options` | 視題型 | 選項；`string[]` 或 `ImageOption[]`（看字選圖用） |
| `answer` | 視題型 | 正確答案；對應 `options` 之一（matching 由 `pairs` 順序定義，無此欄） |
| `pairs` | matching 必填 | `{ left, right }[]`，原始順序即正確配對 |
| `explanation` | 建議 | 解析；給結算頁與錯題複習，**語氣須小一友善** |
| `image` | 可選 | 題目圖片，**只能指向 `/images/<filename>`**（本機 `public/images/`） |
| `audio` | 可選 / listening 必填 | 題目音檔，**只能指向 `/audio/<filename>`**（本機 `public/audio/`） |
| `difficulty` | 可選 | `easy` / `medium` / `hard` |
| `topic` | 可選 | 主題（對應 vocabulary 的 category 或自訂） |
| `notes` | 可選 | 草稿備註，給整理者自己看；**轉成 `data/*.json` 時不會帶過去** |

## 範例（自製題，**非官方真題**）

### 範例 1：multiple-choice（通用文字 4 選 1）

```
id: q-mc-custom-001
type: multiple-choice
source: custom
prompt: Which one is a fruit?
options: cat, apple, red, two
answer: apple
explanation: 蘋果是水果，cat 是動物喔！
difficulty: easy
topic: food
notes: 入門暖身題；可放在第一卷第一題。
```

### 範例 2：picture-choice（看圖選字）

```
id: q-pc-custom-001
type: picture-choice
source: custom
image: /images/apple.svg
prompt: What is this?
options: apple, banana, cat, dog
answer: apple
explanation: 圖片是紅色圓形水果，是 apple。
difficulty: easy
topic: food
notes: 圖片素材自製 SVG（已在 public/images/apple.svg）
```

### 範例 3：word-choice（看字選圖）

```
id: q-wc-custom-001
type: word-choice
source: custom
prompt: apple
options:
  - { value: apple, image: /images/apple.svg }
  - { value: cat,   image: /images/cat.svg   }
  - { value: dog,   image: /images/dog.svg   }
  - { value: book,  image: /images/book.svg  }
answer: apple
explanation: apple 是蘋果，找紅色圓形那張圖喔！
difficulty: easy
topic: food
notes: 4 圖選項皆來自本機 public/images/
```

### 範例 4：listening-choice（聽力選擇，文字選項版）

```
id: q-lc-custom-001
type: listening-choice
source: custom
audio: /audio/q-lc-custom-001.mp3
transcript: What does the boy want?
ttsScript: What does the boy want?
optionType: text
options: apple, banana, cat, dog
answer: apple
explanation: 音檔說小男孩想要蘋果。
difficulty: easy
topic: food
notes: ttsScript 給 macOS `say -o` 或雲端 TTS 生成；音檔放本機 public/audio/
```

### 範例 5：fill-blank（選項版填空）

```
id: q-fb-custom-001
type: fill-blank
source: custom
prompt: The sky is ___.
options: red, blue, green
answer: blue
explanation: 天空是藍色的，所以填 blue。
difficulty: easy
topic: colors
notes: ___ 處由前端 render 成空格或選項按鈕
```

### 範例 6：fill-blank（自由填空版）

```
id: q-fb-custom-002
type: fill-blank
source: custom
prompt: I have a ___.
answer: cat
explanation: 自由填空，比對忽略大小寫與前後空白。
difficulty: medium
topic: animals
notes: 沒有 options 欄位 → 渲染成文字輸入框
```

### 範例 7：matching（連連看）

```
id: q-mt-custom-001
type: matching
source: custom
prompt: 把英文單字配對到正確的圖片。
pairs:
  - { left: cat,   right: /images/cat.svg   }
  - { left: dog,   right: /images/dog.svg   }
  - { left: apple, right: /images/apple.svg }
  - { left: book,  right: /images/book.svg  }
explanation: 依左欄順序連到右欄正確圖片。
difficulty: easy
topic: mixed
notes: pairs 原始順序即正確配對；UI 端打散後讓使用者拖曳 / 點選
```

## 命名建議

| 對象 | 建議格式 | 範例 |
| --- | --- | --- |
| 草稿檔名 | `<日期>-<主題>-<批次>.md` | `2026-05-08-food-batch01.md` |
| 題目 id | `<題型前綴>-<分類>-<流水號>` | `q-mc-001` / `q-pc-food-001` / `q-lc-listening1-001` |

題型前綴對照：

- `q-mc-`：`multiple-choice`
- `q-pc-`：`picture-choice`
- `q-wc-`：`word-choice`
- `q-lc-`：`listening-choice`
- `q-fb-`：`fill-blank`
- `q-mt-`：`matching`

題目 id **全域唯一**，避免與 `data/p3-example-questions.json` 既有 id 撞名。

## 整理流程

1. 在本資料夾新增 `<日期>-<主題>-<批次>.md` 開始寫草稿。
2. 每題用上述格式列出欄位。
3. 草稿審視 OK 後，由人工整理（或未來 P3-2-B 工具）轉成符合 `BaseQuestion` 的 JSON 物件。
4. 整理後的 JSON 放進正式題庫位置（由 P3-2-B 定案，目前可暫放 `data/p3-example-questions.json` 或新增獨立檔）。
5. 草稿檔可保留作為**整理紀錄**，或在轉檔完成後移到子目錄歸檔。

## 提醒

- ❌ **不要在 `notes` 中放官方真題的字面內容**（即使是 `custom` 子目錄）。
- ❌ **不要把 `image` / `audio` 指向外部網址**。
- ❌ **不要在草稿中 commit 原始官方 PDF 或圖片**（已被 `.gitignore` 擋下，但仍要意識）。
- ✅ 自製題的英文應**簡單、適合小一**，題型風格對齊 Cambridge Starters 但**不抄真題**。
- ✅ 解析（`explanation`）語氣須**鼓勵 > 懲罰**：用「正確答案是 ___」「下次可以注意 ___ 唷」，避免「你錯了」「不對」。
