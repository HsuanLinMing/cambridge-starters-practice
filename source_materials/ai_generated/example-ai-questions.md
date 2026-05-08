# AI 仿真題草稿範例（example-ai-questions）

> 本檔示範「AI 生成的草稿應該長什麼樣子」。6 題涵蓋 6 種題型；**全部自製、非官方真題**。
>
> Prompt 範本：[`prompt-template.md`](./prompt-template.md)
> 規格說明：[`../../docs/AI_QUESTION_GENERATION.md`](../../docs/AI_QUESTION_GENERATION.md)
>
> 通過下方「自我檢查」後，由人類整理者或未來 P3-2-B 工具轉成正式 `data/*.json`。

## 範例批次資訊

- **生成日期**：2026-05-08（範例，非真實生成）
- **prompt 版本**：`starters-v1`
- **主題**：`mixed`（6 種題型各 1 題）
- **題數**：6
- **id 前綴**：`q-ai-<題型>-<流水號>`，與既有 `data/p3-example-questions.json` 的 `q-mc-001` / `q-pc-001` 等不撞名。

---

## 題目（6 題）

### 題 1：multiple-choice

```
id: q-ai-mc-001
type: multiple-choice
source: ai_generated
promptVersion: starters-v1
prompt: I see a ___.
options: cat, table, sky, week
answer: cat
explanation: 「I see a cat.」中文是「我看到一隻貓。」cat 是動物，是最自然的選擇。
difficulty: easy
topic: animals
notes: 干擾選項刻意挑「不是動物」的常見字。
```

### 題 2：picture-choice（看圖選字）

```
id: q-ai-pc-001
type: picture-choice
source: ai_generated
promptVersion: starters-v1
imagePrompt: 「黃色香蕉，彎月形，簡單卡通風格」
prompt: What is this?
options: banana, apple, dog, book
answer: banana
explanation: 圖片是黃色彎彎的水果，是 banana。
difficulty: easy
topic: food
notes: 圖片由人類整理者依 imagePrompt 自繪 SVG 後放入 public/images/banana.svg；轉 JSON 時 image 欄位才填入。
```

### 題 3：word-choice（看字選圖）

```
id: q-ai-wc-001
type: word-choice
source: ai_generated
promptVersion: starters-v1
prompt: dog
options:
  - { value: dog,   imagePrompt: 「橘色狗臉，垂耳，紅舌頭」 }
  - { value: cat,   imagePrompt: 「灰色貓臉，三角耳朵，鬍鬚」 }
  - { value: book,  imagePrompt: 「攤開的書，雙頁」 }
  - { value: apple, imagePrompt: 「紅色蘋果，棕梗綠葉」 }
answer: dog
explanation: 找垂耳、紅舌頭、橘色臉的那張圖喔。
difficulty: easy
topic: animals
notes: 4 圖選項所需自製 SVG 對齊既有 public/images/{dog,cat,book,apple}.svg；轉 JSON 時把 imagePrompt 換成 image 路徑。
```

### 題 4：listening-choice（聽力選字）

```
id: q-ai-lc-001
type: listening-choice
source: ai_generated
promptVersion: starters-v1
ttsScript: I have a red apple.
transcript: I have a red apple.
optionType: text
options: apple, dog, book, cat
answer: apple
explanation: 音檔說「我有一顆紅色的蘋果」，所以選 apple。
difficulty: easy
topic: food
notes: 音檔由人類整理者用 macOS `say -o public/audio/q-ai-lc-001.mp3 "I have a red apple."` 自製；轉 JSON 時 audio 欄位才填入。
```

### 題 5：fill-blank（選項版填空）

```
id: q-ai-fb-001
type: fill-blank
source: ai_generated
promptVersion: starters-v1
prompt: My ___ is happy today.
options: cat, table, week, sky
answer: cat
explanation: 句子說「我的 ___ 今天很開心」，主語要是會「開心」的東西。cat 是貓，最合理。
difficulty: medium
topic: animals
notes: 故意給「table / week / sky」這類「不會開心」的東西做干擾，幫助小朋友練習語意選擇。
```

### 題 6：matching（連連看）

```
id: q-ai-mt-001
type: matching
source: ai_generated
promptVersion: starters-v1
prompt: 把英文單字連到正確的圖片。
pairs:
  - { left: cat,    imagePrompt: 「灰色貓臉」 }
  - { left: dog,    imagePrompt: 「橘色狗臉」 }
  - { left: apple,  imagePrompt: 「紅色蘋果」 }
  - { left: banana, imagePrompt: 「黃色香蕉」 }
explanation: 依左欄順序連到右欄正確圖片。
difficulty: easy
topic: mixed
notes: pairs 原始順序即正確配對；UI 端打散讓小朋友配對。imagePrompt 給人類整理者自製 SVG 用，轉 JSON 時 right 欄位填入 /images/<id>.svg。
```

---

## ✅ 自我檢查紀錄

對照 [`../../docs/AI_QUESTION_GENERATION.md`](../../docs/AI_QUESTION_GENERATION.md) 第 7 節：

- [x] **答案在選項中**：q-ai-mc-001 / q-ai-pc-001 / q-ai-wc-001 / q-ai-lc-001 / q-ai-fb-001 五題的 answer 皆出現在 options（matching 由 pairs 順序決定）。
- [x] **`source` 正確**：6 題全部 `ai_generated`。
- [x] **`promptVersion` 正確**：6 題全部 `starters-v1`。
- [x] **解析鼓勵語氣**：用「最自然的選擇」「找垂耳、紅舌頭…的那張圖喔」「最合理」等語氣，無「你錯了」「不對」。
- [x] **無官方 / 歷屆題內容**：6 題皆全新自製，題幹用基礎句型 `I see a ___ / What is this / I have a / My ___ is happy today`，未引用任何官方原文。
- [x] **無外部 URL**：image / audio 用 `imagePrompt` / `ttsScript` 描述，未出現 `http://` / `https://`。
- [x] **適合小一程度**：英文題幹皆 ≤ 8 字，選項清楚；避開冷僻字（用 cat / dog / apple / banana / book 等高頻字）。

> 若實際 AI 生成時某題未通過任一項，**整批退回 AI 重做**或**人類整理者修正**後才能轉成 `data/*.json`。

---

## 提醒（給未來補題者）

- ❌ **不要在 notes 中放官方真題的字面內容**（即使是 ai_generated 子目錄）。
- ❌ **不要把 `image` / `audio` 指向外部網址**——草稿層只用 `imagePrompt` / `ttsScript` 描述。
- ❌ **不要假裝 AI 出題是 official_sample / past_paper**——任何時候 `source` 都是 `ai_generated`。
- ✅ **每題附 `promptVersion`**——便於日後 prompt 改版時回溯品質。
- ✅ **解析語氣鼓勵 > 懲罰**——對齊 PRODUCT_SPEC「國小低年級使用者設計原則」。
- ✅ **批次檔名格式**：`<YYYY-MM-DD>-<topic>-batch<NN>.md`，例如 `2026-05-08-food-batch01.md`。
