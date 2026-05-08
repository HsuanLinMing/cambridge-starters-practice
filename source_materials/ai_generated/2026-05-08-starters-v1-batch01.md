# AI 仿真題草稿 · prompt v1 試跑批次 01

> Prompt 版本：`starters-v1`
> 生成日期：2026-05-08
> 主題：mixed（6 題型混合）
> 題數：8（mc × 2 / pc × 1 / wc × 1 / lc × 2 / fb × 1 / mt × 1）
> 出題者：人工依 `prompt-template.md` v1 規格自製（不是真正 AI 生成；用作 v1 規格的人工試跑驗證）。
>
> 規格：[`../../docs/AI_QUESTION_GENERATION.md`](../../docs/AI_QUESTION_GENERATION.md)
> 範本：[`./prompt-template.md`](./prompt-template.md)
> 範例：[`./example-ai-questions.md`](./example-ai-questions.md)

---

## 題 1：multiple-choice

```
id: q-ai-v1-mc-001
type: multiple-choice
source: ai_generated
promptVersion: starters-v1
prompt: An apple is ___.
options: red, blue, green, yellow
answer: red
explanation: 蘋果常常是紅色的，所以選 red。
difficulty: easy
topic: colors
notes: 顏色 + 名詞題；干擾選項全部是顏色，避免不對等比較。
```

## 題 2：multiple-choice

```
id: q-ai-v1-mc-002
type: multiple-choice
source: ai_generated
promptVersion: starters-v1
prompt: A ___ can run.
options: dog, table, book, chair
answer: dog
explanation: 動物會跑，所以選 dog；桌子、書、椅子不會跑喔。
difficulty: easy
topic: animals
notes: 句型 A ___ can run；干擾用日常名詞，避免冷僻字。
```

## 題 3：picture-choice（看圖選字）

```
id: q-ai-v1-pc-001
type: picture-choice
source: ai_generated
promptVersion: starters-v1
imagePrompt: 「灰色貓臉，三角耳朵，圓眼，鬍鬚，可愛卡通風格，淡黃背景」
prompt: What is this?
options: cat, dog, bird, frog
answer: cat
explanation: 圖片是灰色臉、三角耳朵、有鬍鬚的動物，是 cat。
difficulty: easy
topic: animals
notes: 圖片由人類整理者依 imagePrompt 自繪 SVG，可參考 public/images/cat.svg 既有風格；轉 JSON 時 image 欄位填 /images/cat.svg。
```

## 題 4：word-choice（看字選圖）

```
id: q-ai-v1-wc-001
type: word-choice
source: ai_generated
promptVersion: starters-v1
prompt: red
options:
  - { value: red,    imagePrompt: 「紅色色塊，圓形，無文字，無單字」 }
  - { value: blue,   imagePrompt: 「藍色色塊，圓形，無文字，無單字」 }
  - { value: green,  imagePrompt: 「綠色色塊，圓形，無文字，無單字」 }
  - { value: yellow, imagePrompt: 「黃色色塊，圓形，無文字，無單字」 }
answer: red
explanation: red 是紅色，找紅色那塊喔。
difficulty: easy
topic: colors
notes: color 類圖片**強制**「無文字、無單字」，避免將圖片內的英文洩漏答案（對齊 PRODUCT_SPEC「素材策略」與 prompt-template 規範）。public/images/red.svg / blue.svg 已存在；green / yellow.svg 待補（屬 P2-4C-2B-2 圖片素材補強）。
```

## 題 5：listening-choice（聽力選字）

```
id: q-ai-v1-lc-001
type: listening-choice
source: ai_generated
promptVersion: starters-v1
ttsScript: I have a book.
transcript: I have a book.
optionType: text
options: book, dog, cat, apple
answer: book
explanation: 音檔說「我有一本書」，所以選 book。
difficulty: easy
topic: school
notes: 音檔由人類整理者用 macOS `say -o public/audio/q-ai-v1-lc-001.mp3 "I have a book."` 自製（屬 P2-4C-2B-2 音檔素材補強）。
```

## 題 6：listening-choice（聽力選字）

```
id: q-ai-v1-lc-002
type: listening-choice
source: ai_generated
promptVersion: starters-v1
ttsScript: My mother is happy today.
transcript: My mother is happy today.
optionType: text
options: mother, father, friend, teacher
answer: mother
explanation: 音檔說「我的媽媽今天很開心」，所以選 mother。
difficulty: easy
topic: family
notes: 干擾選項全部來自 vocabulary 既有 family / school 類字（father / friend / teacher），讓小朋友練習「家人」字群辨識。
```

## 題 7：fill-blank（選項版填空）

```
id: q-ai-v1-fb-001
type: fill-blank
source: ai_generated
promptVersion: starters-v1
prompt: I can ___ fast.
options: run, sit, jump, eat
answer: run
explanation: 句子是「我可以 ___ 得很快」，「跑得很快」最自然，所以選 run。
difficulty: easy
topic: actions
notes: 干擾選項全部是 vocabulary 既有動詞（sit / jump）+ 1 個常見動詞（eat）；run / jump / sit 在現有 actions category。
```

## 題 8：matching（連連看）

```
id: q-ai-v1-mt-001
type: matching
source: ai_generated
promptVersion: starters-v1
prompt: 把英文單字連到正確的圖片。
pairs:
  - { left: cat,    imagePrompt: 「灰色貓臉，三角耳朵，鬍鬚」 }
  - { left: dog,    imagePrompt: 「橘色狗臉，垂耳，紅舌頭」 }
  - { left: book,   imagePrompt: 「攤開的書，雙頁，文字行模擬，無實際文字」 }
  - { left: apple,  imagePrompt: 「紅色蘋果，棕色梗，綠葉」 }
explanation: 依左欄順序連到右欄正確圖片。
difficulty: easy
topic: mixed
notes: pairs 原始順序即正確配對；UI 端打散後讓小朋友配對。imagePrompt 給人類整理者自製 SVG 用，所有 4 張圖均對應 public/images/{cat,dog,book,apple}.svg 既有素材，轉 JSON 時 right 欄位填 /images/<id>.svg。
```

---

## ✅ 人工品質檢查紀錄

依 [`../../docs/AI_QUESTION_GENERATION.md`](../../docs/AI_QUESTION_GENERATION.md) 第 7 節「品質檢查清單」與 [`./prompt-template.md`](./prompt-template.md) 第 8 項自我檢查清單，本批 8 題逐項核對：

| # | 檢查項 | 結果 | 備註 |
| --- | --- | --- | --- |
| 1 | 8 題全部 `source: ai_generated` | ✓ | 8 / 8 |
| 2 | 8 題全部 `promptVersion: starters-v1` | ✓ | 8 / 8 |
| 3 | answer 出現在 options（matching 例外） | ✓ | 7 題（matching 由 `pairs` 順序定義） |
| 4 | 無官方 / 歷屆題內容 | ✓ | 題幹用基礎句型 `An apple is`、`A ___ can run`、`I have a`、`My mother is happy`、`I can ___ fast` 等，未引用任何 Cambridge 官方原文 |
| 5 | 無外部 URL（`http://` / `https://`） | ✓ | image / audio 全部用 `imagePrompt` / `ttsScript` 描述，未出現任何 URL |
| 6 | `explanation` 鼓勵語氣 | ✓ | 用「最自然」「最合理」「找紅色那塊喔」等鼓勵語氣，無「你錯了」「不對」 |
| 7 | 英文題幹 ≤ 10 字 | ✓ | 最長 5 字（`My mother is happy today.` 5 字）；多數 ≤ 4 字 |
| 8 | 避開冷僻字、雙重否定、文化背景假設 | ✓ | 全部用 vocabulary 既有字或常見字（cat / dog / apple / book / red / blue / mother / father / chair / run / jump / sit） |
| 9 | id 與既有不撞名 | ✓ | 用 `q-ai-v1-*` 格式，與 `data/p3-example-questions.json`（`q-mc-001` 等）與 `example-ai-questions.md`（`q-ai-mc-001` 等）皆不撞名 |
| 10 | 題型分配對齊任務單建議 | ✓ | mc × 2、pc × 1、wc × 1、lc × 2、fb × 1、mt × 1 = 8 題 |

### 是否有任何題目需要日後調整

| 題號 | 觀察 / 建議 |
| --- | --- |
| 題 4（word-choice color） | `imagePrompt` 已加「無文字、無單字」強調，避免將英文寫進圖。實務上未來生成圖時若 AI 仍偏向把英文寫進，建議下一版 prompt（v2）在 color 題型段加入更強的禁止規則。green / yellow.svg 目前未自製（屬 P2-4C-2B-2），這批題進正式 JSON 前需先補。 |
| 題 6（listening-choice mother） | 干擾選項 `father / friend / teacher` 全部來自 vocabulary，已避開先前範例用過的 `sister / brother`（vocabulary 沒有的字）。**穩定** |
| 題 8（matching） | 4 張圖對應的 `cat / dog / book / apple` SVG 在 `public/images/` 已存在（P2-4C-2B-1 接入），**這批題日後可優先考慮轉成正式 JSON**（前提是先補 word-choice / picture-choice 題目所需的綠 / 黃色塊 SVG）。 |
| 題 5、6（聽力） | 音檔尚未自製（`q-ai-v1-lc-001.mp3` / `q-ai-v1-lc-002.mp3`）；屬 P2-4C-2B-2 真實音檔範圍。在音檔備齊前，這批 listening 題只能在草稿層存在，**不能進正式題庫上 `/quiz`**。 |
| 整體 | prompt v1 規格在「人工試跑」層面**可以產出符合品質要求的草稿**。下一輪可實際把 prompt v1 主體貼給 ChatGPT / Claude，比較「真 AI 生成」與「人工試跑」的差異；若 AI 生成偏向某種瑕疵（例如答案位置都在第一格、題幹太長、語氣不自然），再遞增 `starters-v2` 並在 `prompt-template.md`「版本歷史」段記錄。 |

### 後續流程

- 本檔屬**草稿層**（`source_materials/ai_generated/`），**不被** `lib/data.ts` import、**不**直接進 `/quiz`。
- 通過人工檢查後，由人工或未來 P3-2-B 工具轉成 `data/*.json`。轉檔時：
  - `notes` 欄位**不帶**進 JSON。
  - `imagePrompt` 換成 `image: "/images/<id>.svg"` 路徑。
  - `ttsScript` **保留**（已是 `ListeningChoiceQuestion.ttsScript` 正式欄位）。
  - 必填 image / audio 路徑前提：對應素材已存在於 `public/images/` 或 `public/audio/`。
- 轉檔前需先處理本檔「需要日後調整」表中的依賴項：
  1. 補 `green.svg` / `yellow.svg`（給題 4 用）。
  2. 自製音檔 `q-ai-v1-lc-001.mp3` / `q-ai-v1-lc-002.mp3`（給題 5、6 用）。
- 上述補素材屬 P2-4C-2B-2 範圍，本輪不做。
