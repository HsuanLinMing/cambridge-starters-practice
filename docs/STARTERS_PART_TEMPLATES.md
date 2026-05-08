# Cambridge Pre A1 Starters 正式題型模板（P3-9-A 第一版）

> 本檔是 P3-9-A 的核心輸出——把本專案的練習題型對齊 Cambridge Pre A1 Starters 的**正式 parts 結構**，給後續 `/quiz` UI、AI 仿真題（P3-3 / P3-8）、Listening 題型（P3-4）、Reading & Writing 題型（P3-5）、官方資源整理（P3-7）一份共同參考標準。
>
> ⚠️ **本檔是「自製練習模板」，不是官方題庫，也不是複製官方題目**。所有模板皆依官方公開的題型結構描述「重新製作」，不抄原文、不變形歷屆題；正式題庫題目仍走「自製 / AI 仿真題 → 人工審核 → 進正式 JSON」流程。
>
> 本檔只寫**模板與規格**——**不修改** `lib/types.ts`、**不修改** `data/*.json`、**不修改** `/quiz` UI；那些屬於 P3-9-B（schema / metadata 實作）與 P3-9-C（part-specific UI 實作）。

## 用途與硬邊界

### 用途

- 整理本專案要如何對齊 Cambridge Pre A1 Starters 的正式 parts。
- 讓 AI 出題（P3-3 / P3-8）、題庫整理（P3-2）、`/quiz` UI（P3-6）、TTS（屬 P2-4C-2B-2 / P3-4）、圖片素材（屬 P2-4C-2B / P3-5）都能依這份模板發展。
- 給未來輪次任務分配時的「題型結構單一事實來源」。

### 硬邊界（與 `docs/PRODUCT_SPEC.md` /「目前明確不做」一致）

- ❌ 不抄 / 不改寫 / 不變形 Cambridge 官方原文 / 歷屆題。
- ❌ 不下載官方 PDF / 圖片 / 音檔。
- ❌ 不爬蟲。
- ❌ 不在題目 JSON 中放外部 URL（`image` / `audio` 一律本機路徑）。
- ❌ 不聲稱本專案題目是官方題；正式題庫題目皆標 `source: "ai_generated"` / `"custom"` / `"official_sample"` / `"past_paper"`，沒有「官方題」這個值（即使整理自 sample papers 也只是 `official_sample` 標記，內容仍是自家整理的描述，不抄原文）。
- ✅ 官方題型結構**只用來理解形式**——具體題目永遠自製或 AI 仿真。

## 大架構

Cambridge Pre A1 Starters 正式考試分三大段：

| 段落 | Part 數 | 本專案目前狀態 |
| --- | --- | --- |
| **Listening** | Part 1 ~ Part 4 | 🟡 P3-9-A 模板就位；P3-9-B 結構化 metadata 待做；P3-4 各 part UI 待做 |
| **Reading & Writing** | Part 1 ~ Part 5 | 🟡 P3-9-A 模板就位；目前 `/quiz` 只覆蓋 Part 3 / Part 4 / Part 5 的近似版本；其餘待 P3-9-C |
| **Speaking** | Part 1 ~ Part 4 | ⬜ **P3 不實作**；留到 P4 Speaking Examiner Agent 統一處理（見本檔「與 P4 Speaking Examiner Agent 的關係」） |

> 三段順序：本專案 `/quiz` 沿用「Section 1 Listening → Section 2 Reading & Writing」；Speaking 在 P4 是獨立 session 而非接續第三段（孩子可在不同時間做 Speaking 練習）。

---

## Listening 題型模板（Part 1 ~ Part 4）

### Listening Part 1（L1）：大圖 + 人物 / 物件位置連線

- **官方方向簡述**：考生看一張包含若干人物或物件的大場景圖（例如客廳、公園），聽考官 / 音檔逐句講「Tom is …」「The cat is …」，把名字 / 物件配對到圖中正確位置（連線題）。
- **本專案練習版目標**：簡化版——用「看圖 + 聽句子 + 選人物 / 選位置」的多選題形式，先讓孩子熟悉「聽句子定位人 / 物」的能力，連線手勢互動屬 P3-9-C 後續。
- **題目互動方式**（第一版簡化）：
  1. 顯示大場景圖（或先用文字描述場景）。
  2. 播放 `audio`（或顯示 transcript 文字 fallback）。
  3. 提供 4 個選項：人物名 / 位置詞，孩子點選正確答案。
- **需要的資料欄位**（對齊 P3-1 既有 schema 可用，**不必馬上動 types**）：
  - `image`（場景大圖；自製 SVG 或 PNG）
  - `audio`（句子音檔，如 `Tom is next to the dog.`）
  - `transcript`（文字字幕，給家長看）
  - `ttsScript`（TTS 腳本）
  - `prompt`（可選；如「Where is Tom?」）
  - `options`（4 個文字選項）
  - `answer`（`options` 之一）
- **imagePrompt 建議**：簡單線條場景，2~4 個明確區分的人物 / 物件，背景不複雜；色彩柔和。例如：`A simple cartoon living room with Tom standing next to a dog, Lily sitting on a sofa, a cat under a table. Soft colors, no English text in the image.`
- **ttsScript 建議**：單句、≤ 10 個英文字、語速放慢；例如：`Tom is next to the dog.`
- **answer 型態**：`choice`（從 `options` 選一個文字）。
- **目前 P3 schema 是否已支援**：✅ 部分支援——可用 `listening-choice` + `image` 欄位達成第一版；場景圖可放 `BaseQuestion.image`。但**沒有「場景中位置」結構化欄位**，所以「連線到圖中座標」的官方互動仍需 P3-9-B 補 metadata。
- **未來需要補哪些功能**：
  - 場景圖上的可點擊熱區（hotspot）配對互動。
  - `imageHotspots: { id, label, position: { x, y } }[]` 之類的 metadata（P3-9-B 待設計）。
- **是否需要圖片**：✅ 必要（場景大圖）。
- **是否需要音檔**：✅ 必要（句子音檔，可由 TTS 自製）。
- **是否適合 AI 仿真題生成**：✅ 高度適合——場景描述 + 句子 + 選項皆可由 AI 出，圖片由 `imagePrompt` 描述後由人手繪 SVG。第一版優先做。

### Listening Part 2（L2）：聽對話，寫 name / number

- **官方方向簡述**：聽一段考官 / 音檔的短對話（兩人互相打招呼、報名、講年齡 / 數量），考生在表格空格中**寫下** name 或 number。
- **本專案練習版目標**：第一版做「聽句子 + 文字輸入 name / number」單句版；多輪對話 / 表格屬 P3-9-C 後續。
- **題目互動方式**（第一版簡化）：
  1. 播放 `audio`（或顯示 transcript fallback）。
  2. 顯示題目文字（例如 `Name: ___` 或 `How many cats? ___`）。
  3. 孩子在 `<input>` 填入答案，比對時忽略大小寫與前後空白。
- **需要的資料欄位**：
  - `audio`（必填）
  - `transcript`、`ttsScript`
  - `prompt`（題目文字 + 空格佔位符）
  - `answer`（純字串，如 `"Tom"` / `"three"` / `"3"`）
  - `expectedAnswerType`（**未來欄位**：`name` / `number`，本輪不動 types）
- **imagePrompt 建議**：可選；若加表格圖，可畫一個簡單的「ID card 表格」線條圖，留空格給手寫；不放任何英文範例字（避免洩漏答案）。
- **ttsScript 建議**：對話兩句即可（≤ 20 字）；speaker 標記用 `[Examiner]` `[Child]` 註記；例如：`[Examiner] What's your name? [Child] My name is Tom.`
- **answer 型態**：`text`（自由文字，name / number 二類）。
- **目前 P3 schema 是否已支援**：⚠️ 半支援——`fill-blank` 自由填空版（無 `options`）已可實作 name / number 輸入；但**音檔欄位不在 `fill-blank` 必填**，需要組合 `BaseQuestion.audio` + `fill-blank.prompt`。建議 P3-9-B 加 `expectedAnswerType` 欄位以區分 `name` / `number` 並協助驗證。
- **未來需要補哪些功能**：
  - 多輪對話 UI（speaker 標籤、雙泡泡）。
  - 表格題型（多 row 同時填）。
  - 數字 vs 文字輸入鍵盤切換（行動裝置 UX）。
- **是否需要圖片**：⚠️ 可選（表格線條圖加分，但不必要）。
- **是否需要音檔**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 高度適合——AI 可出對話腳本、name / number 標準答案皆明確；不需精緻圖片。

### Listening Part 3（L3）：聽音選 A/B/C 圖

- **官方方向簡述**：聽一句問題或敘述（例如 `What does Tom want?`），從 3 張圖（A / B / C）中選正確答案。
- **本專案練習版目標**：**目前 `/quiz` 的 `listening-choice` 最接近此 part**；本輪維持既有實作，後續 P3-9-C 可加 A/B/C 標籤、3 張圖選項視覺。
- **題目互動方式**：
  1. 播放 `audio`。
  2. 顯示 3 張（或 4 張）圖片選項，標 A / B / C / D。
  3. 孩子點選正確圖片。
- **需要的資料欄位**（已支援，目前 schema 可實作）：
  - `audio`（必填）
  - `transcript`、`ttsScript`
  - `optionType: "image"`
  - `options: ImageOption[]`（3~4 個圖片選項）
  - `answer`（其中一個 `options[i].value`）
- **imagePrompt 建議**：3~4 張**對比明確**的小圖（apple vs banana vs cat），單一物件、無背景、無英文字。每張圖風格一致避免無關干擾。
- **ttsScript 建議**：單句問題、≤ 10 字；例如：`What does Tom want?` / `Where is the cat?`
- **answer 型態**：`choice`（從 `options[i].value` 選一個）。
- **目前 P3 schema 是否已支援**：✅ **完整支援**——`listening-choice` + `optionType: "image"` 即可。目前 `data/p3-example-questions.json` 的 `q-lc-001` 用 `optionType: "text"` 文字選項版；圖片選項版可直接擴充。
- **未來需要補哪些功能**：
  - UI 加 A / B / C 標籤覆蓋在圖片角落。
  - 限制選項數為 3（目前 schema 不限制）。
- **是否需要圖片**：✅ 必要（3~4 張對比圖）。
- **是否需要音檔**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ **最適合**第一版優先——schema 已就位、AI 出題簡單、圖片需求清楚。

### Listening Part 4（L4）：聽指令塗顏色

- **官方方向簡述**：考生看一張黑白 / 灰階線條圖（多個物件），聽考官指令「Colour the apple red」「Colour the cat blue」，把對應物件塗對顏色。
- **本專案練習版目標**：第一版做「聽句子 + 選顏色 / 選物件」多選題版；真正的塗色互動（在 SVG 上點擊填色）屬 P3-9-C 後續。
- **題目互動方式**（第一版簡化）：
  1. 顯示線條圖（多物件，黑白或灰階）。
  2. 播放 `audio`（如 `Colour the apple red.`）。
  3. 提供兩種子題型：
     - **選顏色**：題目「What colour?」+ 4 個顏色選項。
     - **選物件**：題目「Which object?」+ 4 個物件名選項。
  4. 孩子點選正確答案。
- **需要的資料欄位**：
  - `image`（線條圖）
  - `audio`（指令音檔）
  - `transcript`、`ttsScript`
  - `prompt`（如 `What colour is the apple?`）
  - `options`（顏色名 4 選 1 / 物件名 4 選 1）
  - `answer`（`options` 之一）
- **imagePrompt 建議**：線條圖、無填色、多個易辨識物件（apple / cat / dog / book）；**圖內不放任何英文字**（避免洩漏物件名）。
- **ttsScript 建議**：祈使句、≤ 10 字；例如：`Colour the apple red.` / `The cat is blue.`
- **answer 型態**：`choice`（顏色名或物件名）。
- **目前 P3 schema 是否已支援**：✅ 部分支援——可用 `listening-choice` + `image` 達成「選顏色 / 選物件」第一版。**不支援**真正的塗色互動（需 P3-9-B 設計 colour-by-instruction 結構化欄位 + P3-9-C UI）。
- **未來需要補哪些功能**：
  - SVG 物件可點擊填色互動（每個物件一個 hotspot）。
  - `colorPalette: string[]` 限制可選顏色。
  - `instructions: { object, color }[]` 結構化指令清單。
- **是否需要圖片**：✅ 必要（線條圖）。
- **是否需要音檔**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 適合（第一版簡化版）；真正塗色互動的 AI 出題需配合 P3-9-B / P3-9-C 才可生成完整題目。

---

## Reading & Writing 題型模板（Part 1 ~ Part 5）

### Reading & Writing Part 1（RW1）：看圖 + 句子，判斷 yes/no 或 tick/cross

- **官方方向簡述**：每題顯示一張圖 + 一句描述句（例如 `It is a cat.` 對應一張狗的圖），考生判斷句子是否描述正確，畫 ✓ 或 ✗。
- **本專案練習版目標**：對應未來的 `true-false` / `picture-choice` 變體——一張圖 + 一句敘述 + 兩個按鈕 ✓ / ✗。
- **題目互動方式**：
  1. 顯示一張單物件圖。
  2. 顯示一句描述（≤ 8 字英文）。
  3. 提供兩個大按鈕：✓ Yes / ✗ No。
- **需要的資料欄位**：
  - `image`（單物件圖）
  - `prompt`（描述句）
  - `answer`（`"yes"` 或 `"no"`，**或視為兩選項的 `picture-choice` / `multiple-choice` 變體**）
- **imagePrompt 建議**：單一物件、無背景、無英文字；風格與 R&W 其他 part 一致。
- **answer 型態**：`choice`（yes / no 二選一）。
- **目前 P3 schema 是否已支援**：⚠️ **不直接支援**——目前 6 題型沒有原生 yes/no 題型。可用 `multiple-choice` + `options: ["yes", "no"]` 暫代，但 UI 需要 P3-9-C 加大按鈕的視覺。建議 P3-9-B 加 `true-false` 或 `yes-no` 子題型，或在 metadata 加 `answerStyle: "yes-no"` 標記。
- **未來需要補哪些功能**：
  - `true-false` 題型（或 `yes-no` metadata）。
  - 大型 ✓ / ✗ 按鈕視覺。
- **是否需要圖片**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 高度適合——AI 易出「正確 vs 故意錯誤」描述對；圖片描述明確。

### Reading & Writing Part 2（RW2）：看大圖，回答 yes/no

- **官方方向簡述**：考生看一張**大場景圖**（例如教室、公園），下方有 5~6 句描述（`There is a cat under the table.`），逐句判斷 yes / no。
- **本專案練習版目標**：需要 scene image + 多個句子；本專案第一版可實作「一張大圖 + 多題依序作答」。
- **題目互動方式**：
  1. 螢幕上方顯示大場景圖（不換頁）。
  2. 下方逐題顯示句子，每題給 ✓ / ✗ 按鈕。
  3. 5~6 題完成後進下一個 part。
- **需要的資料欄位**：
  - `sceneImage` 共用（**未來欄位**：多題共用同一張大圖；本輪 schema 沒有共用機制，需 P3-9-B 設計）
  - 每題的 `prompt`（描述句）+ `answer`（`yes` / `no`）
- **imagePrompt 建議**：場景圖風格簡單線條、淡色調、3~5 個易辨識物件分布在不同位置；無英文字。例如：`A simple cartoon park scene: a dog under a bench, two children near a tree, an apple on the grass. Soft colors, no English text.`
- **answer 型態**：`choice`（yes / no）。
- **目前 P3 schema 是否已支援**：⚠️ **不支援多題共用同一場景圖**——目前每題各自的 `image` 是獨立欄位。可繞道用「同一張 SVG path 讓多題 reference」實作，但 UI 不會「視覺上保留場景圖不換」，需要 P3-9-B 設計 `sceneGroup: { sceneImage, questions[] }` 或在 `ExamSection` 加 `sharedImage` 欄位 + P3-9-C UI。
- **未來需要補哪些功能**：
  - `sceneGroup` / `sharedImage` schema 設計。
  - UI 場景圖固定 + 下方題目滾動 / 換頁的版面。
- **是否需要圖片**：✅ 必要（一張大場景）。
- **是否適合 AI 仿真題生成**：✅ 適合——AI 出場景描述 + 5~6 題 yes/no 對；場景圖較複雜，由人手繪 SVG 或多次 AI 出 imagePrompt 後人挑選。

### Reading & Writing Part 3（RW3）：看圖拼字

- **官方方向簡述**：每題顯示一張物件圖 + 缺字提示（例如 `_ _ _ l e` 對應 `apple`），考生**拼出**完整單字。
- **本專案練習版目標**：對應使用者提出的「**只顯示圖片、不顯示英文，孩子自己拼字輸入、可按看答案、下一題**」單字拼字測驗模式。**這是未來單字拼字測驗模式（屬 P2-4C-2B-2 review 區或 P3-9-C quiz 區）的重要依據**。
- **題目互動方式**：
  1. 顯示物件圖（**圖內不放英文字**，避免洩漏答案——color 類同既有規則）。
  2. 顯示缺字提示（部分字母 + 底線），或完全空白（孩子全字拼）。
  3. 孩子用 `<input>` 拼字輸入。
  4. 按「看答案」顯示正解；按「下一題」前進。
- **需要的資料欄位**：
  - `image`（物件圖，必填）
  - `answer`（完整英文單字）
  - `prompt`（拼字提示，如 `a _ _ l e`，可選；無提示版即全字拼）
  - `expectedAnswerType: "spelling"`（**未來欄位**）
- **imagePrompt 建議**：單一物件、清楚識別、無英文字；對齊 `data/vocabulary.json` 既有 54 字優先。
- **answer 型態**：`text`（自由文字，比對忽略大小寫與前後空白）。
- **目前 P3 schema 是否已支援**：⚠️ **半支援**——`fill-blank` 自由填空版（無 `options`，有 `answer`）可達成第一版拼字，但 schema 沒有「圖片必填 + 不顯示文字答案 + 拼字提示」結構。建議 P3-9-B 加 `spelling-input` 子題型或在 metadata 加 `inputMode: "spelling"` 標記。
- **未來需要補哪些功能**：
  - `spelling-input` 題型（或 `inputMode` metadata）。
  - 拼字提示渲染（部分字母 + 底線，每字一格輸入）。
  - 「看答案」/「再試一次」/「下一題」三按鈕視覺。
  - 與 review 區獨立練習模式（不交卷）的整合（屬 P2-4C-2B-2 範圍）。
- **是否需要圖片**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 適合——AI 從 vocabulary 取詞 + 自動產生 spelling 提示；圖片由現有 SVG 庫挑或 AI 出 `imagePrompt` 後人手繪。

### Reading & Writing Part 4（RW4）：短文 / 句子填空

- **官方方向簡述**：給一段短文或單句，留空格（通常 5 題），考生從給定的字詞 bank 中選正確詞填入。
- **本專案練習版目標**：對應目前 `fill-blank` 題型——選項版（`options` + `answer`）已可實作，自由填空版（無 `options`）也已支援。短文多空格屬 P3-9-C 後續。
- **題目互動方式**：
  1. 顯示短文（多句連接） / 單句。
  2. 每個空格用 `<input>` 或下拉選單。
  3. 選項版：上方顯示字詞 bank，孩子拖 / 點選填入。
  4. 自由填空版：直接輸入。
- **需要的資料欄位**：
  - `prompt`（短文 / 句子，含空格佔位符）
  - `options`（可選；選項版字詞 bank）
  - `answer`（空格答案，多空格時應為 `string[]`，**目前 schema 只支援單空格**）
- **imagePrompt 建議**：可選；若加配圖，畫小型情境插畫，無英文字。
- **answer 型態**：`text`（自由）或 `choice`（選項版）。
- **目前 P3 schema 是否已支援**：✅ **單空格完整支援**（`fill-blank` 兩版都已實作）；⚠️ **多空格短文不支援**——`answer` 目前是 `string` 而非 `string[]`。建議 P3-9-B 設計 `multi-blank` 或擴充 `fill-blank` 支援陣列答案。
- **未來需要補哪些功能**：
  - 多空格短文題型（`answer: string[]`）。
  - 字詞 bank 視覺（上方一排卡片，可拖到空格）。
  - 短文上下文提示樣式（不同段落字級 / 顏色）。
- **是否需要圖片**：⚠️ 可選。
- **是否適合 AI 仿真題生成**：✅ 高度適合——AI 出短文與空格 + bank 對應；不需精緻圖片。

### Reading & Writing Part 5（RW5）：看故事圖，回答一字答案

- **官方方向簡述**：考生看 3 張連續故事圖（或一張 scene image），讀題目（What / Where / Who / How many），用**單一英文字**作答。
- **本專案練習版目標**：需要 3 張圖（或 scene image）+ one-word answer 文字輸入；目前 `matching` 類最接近「圖文配對」但不是 one-word answer。**重要差距：本專案目前沒有「one-word answer + 多圖故事」原生題型**。
- **題目互動方式**：
  1. 顯示 3 張連續故事圖（或單張 scene image）。
  2. 顯示題目（如 `What is in the bag?` / `How many cats?`）。
  3. 孩子用 `<input>` 輸入單字答案，比對忽略大小寫。
- **需要的資料欄位**：
  - `images: string[]`（3 張連續圖，**未來欄位**——目前 schema `image` 是單一 string）
  - 或 `sceneImage: string`（單張 scene image）
  - `prompt`（問題）
  - `answer`（單一英文字）
  - `expectedAnswerType: "one-word"`（**未來欄位**）
- **imagePrompt 建議**：故事圖建議 3 張連貫情境（前 / 中 / 後），人物與道具一致；scene image 風格與 RW2 一致。
- **answer 型態**：`text`（單一英文字，比對忽略大小寫與前後空白）。
- **目前 P3 schema 是否已支援**：⚠️ **半支援**——可用 `fill-blank` 自由填空 + `BaseQuestion.image` 達成單張圖版本；3 張連續故事圖需要 P3-9-B 設計 `images: string[]` 或 `imageSequence` 欄位。
- **未來需要補哪些功能**：
  - `images: string[]` 欄位（多圖序列）。
  - 故事圖橫向滾動 / grid 排版。
  - `expectedAnswerType: "one-word"` metadata + 比對規則（單字、容錯）。
- **是否需要圖片**：✅ 必要（3 張或 1 張 scene）。
- **是否適合 AI 仿真題生成**：⚠️ 適合單張 scene + one-word answer 版本；3 張連續故事圖風格一致較困難，建議 AI 出 `imagePrompt` 後人手繪 / 挑選。

---

## 目前 P3 schema 對應表

> 對齊 `components/QuizPlay.tsx` 的 `getStarterPartInfo()` helper（P3-6-A.1 已實作）。本表是現況快照，**目前皆為「練習版近似對應」**，不是完整正式題型。

| 目前 P3 type | 對應正式 part | 對應狀態 | 主要差距 |
| --- | --- | --- | --- |
| `listening-choice` | **L3 preview** | 🟢 最接近 | 缺 A / B / C 視覺標籤；可擴充 image options |
| `picture-choice` | **RW1 / RW2 preview** | 🟡 形式接近、缺 yes/no 互動 | 沒有原生 yes/no 答案型態；scene image 多題共用未支援 |
| `word-choice` | **RW3 preview**（看圖認字） | 🟡 同題型反向（看字選圖） | 真正 RW3 是看圖拼字，需 spelling input；本 type 只是看字選圖 |
| `multiple-choice` | **RW4 preview**（短句選字） | 🟡 部分對齊 | 真正 RW4 是短文 / 句子填空，需 multi-blank；mc 只是文字 4 選 1 |
| `fill-blank` | **RW4** | 🟢 較接近 | 單空格已支援；多空格短文未支援 |
| `matching` | **RW5 preview**（圖文配對 / 故事理解預備） | 🟡 形式接近、答題型不同 | 真正 RW5 是 one-word answer，不是配對 |

說明：

- 這些是**目前練習版的近似對應**，UI 也已在題目卡 header 標 `Part X preview` 字樣（preview 表示「練習版近似、不是完整正式題型」）。
- **不是完整正式題型**——多項細節差距見上表「主要差距」欄。
- **未來會逐步新增更精準的 part-specific types 或 metadata**——具體進度由 P3-9-B（schema / metadata 實作）與 P3-9-C（part-specific UI 實作）推進；本檔（P3-9-A）只給設計方向。

### `getStarterPartInfo()` 與本表的關係

`components/QuizPlay.tsx` 既有的 `getStarterPartInfo(question)` 純函式 helper 把 6 題型映射到對應 Part 標示（`partLabel` + `zhTitle`），對齊本表的「對應正式 part」欄。未來 P3-9-B 補上 part-specific metadata 後，這個 helper 可以從 `question.starterPart` 直接讀，而不用再依 `question.type` 推導。

---

## 未來題型資料欄位建議（不在本輪實作）

> ⚠️ **本節只寫建議**——本輪**不修改** `lib/types.ts`、**不修改** `data/*.json`、**不修改** 任何 components。實作屬 P3-9-B。

未來 schema 可能補的欄位（建議名稱與字面值，最終由 P3-9-B 收斂）：

### `starterSection`（題目所屬段落）

字串字面量：

- `"listening"`
- `"reading-writing"`
- `"speaking"`

### `starterPart`（題目所屬 Part）

字串字面量：

- Listening：`"L1"` / `"L2"` / `"L3"` / `"L4"`
- Reading & Writing：`"RW1"` / `"RW2"` / `"RW3"` / `"RW4"` / `"RW5"`
- Speaking：`"SP1"` / `"SP2"` / `"SP3"` / `"SP4"`（屬 P4，本檔僅列出名稱對齊）

### `skillFocus`（題目主要訓練的能力）

字串字面量：

- `"listening"`
- `"vocabulary"`
- `"spelling"`
- `"reading"`
- `"writing"`
- `"speaking"`

### `ttsScript`

`string`，TTS 生成腳本。**已在 `ListeningChoiceQuestion` 既有**；未來建議升級為通用欄位（任何題型若有 TTS 需求都可用），或保留只在 listening 類題型。

### `imagePrompt`

`string`，自製插畫描述。**目前只在 AI 草稿層使用**（`source_materials/ai_generated/*.md`），轉正式 JSON 時不保留。未來若要做自動圖像生成可考慮升級為正式 schema 欄位（需配合「目前明確不做」清單再評估）。

### `expectedAnswerType`（答題型態）

字串字面量：

- `"choice"`：選擇（從 options 選一個）
- `"text"`：自由文字輸入
- `"number"`：數字
- `"name"`：人名（容錯：忽略大小寫）
- `"color"`：顏色名（限定 color 字典）
- `"one-word"`：單一英文字（RW5 用）
- `"spelling"`：拼字輸入（RW3 用，可能配 `spellingHint`）
- `"spoken"`：口說（屬 P4 Speaking Examiner Agent）

### `difficulty`（既有欄位升級）

目前 `BaseQuestion.difficulty` 是 `easy | medium | hard`。未來可考慮對齊 Starters 等級：

- `"starter-easy"`
- `"starter-medium"`

兩種命名擇一收斂（P3-9-B 決定）。

### 其他建議欄位（按需求逐步加）

- `imageHotspots`（L1 / L4）：場景圖上的可點擊熱區清單。
- `sharedSceneImage` / `sceneGroup`（RW2）：多題共用一張 scene image。
- `images: string[]`（RW5）：多圖序列。
- `colorPalette: string[]`（L4）：限定可選顏色。
- `instructions: { object, color }[]`（L4）：結構化指令。
- `imageSequence: string[]`（RW5）：故事連續圖。
- `wordBank: string[]`（RW4 多空格）：字詞 bank。
- `multiBlankAnswers: string[]`（RW4 多空格）：多空格答案陣列。

---

## AI 仿真題 prompt 如何使用模板（給 P3-8 / 後續 AI 出題用）

> 對齊 `docs/AI_QUESTION_GENERATION.md` 的 P3-3 規格與 `source_materials/ai_generated/prompt-template.md` 的 v1 prompt 範本。本節說明「**有了 P3-9-A 模板後，AI 出題流程多了哪一步**」。

### 完整流程（更新版）

```
1. 選 section + part
   └─ 例如：section=listening, part=L3（聽音選圖）

2. 套用 part template（本檔對應段）
   └─ 讀本檔 L3 模板：題目互動方式 / 需要欄位 / answer 型態 / imagePrompt 建議 / ttsScript 建議

3. 限制 vocabulary
   └─ 從 data/vocabulary.json 既有 54 字 + 已批准擴充字選詞；不用冷僻字

4. 生成 imagePrompt / ttsScript
   └─ imagePrompt 對齊本檔該 Part 的「imagePrompt 建議」（風格 / 物件數 / 無英文字）
   └─ ttsScript 對齊本檔該 Part 的「ttsScript 建議」（句長 / 語速 / speaker 標記）

5. 生成 answer / explanation
   └─ answer 對齊「answer 型態」欄位（choice / text / one-word / yes-no）
   └─ explanation 用小一友善鼓勵語氣

6. 人工審核
   └─ 用 docs/AI_QUESTION_GENERATION.md 第 7 節品質檢查 6 項
   └─ 加本檔對應段的「題目互動方式」確認是否符合 part 結構

7. 進 source_materials/ai_generated/<日期>-<topic>-batch<NN>.md
   └─ 以 v1 prompt 草稿格式保存
   └─ 標 source: "ai_generated"、promptVersion、starterSection、starterPart（後三者為未來 metadata，本輪先以草稿 markdown 註記）

8. 正式轉檔（屬 P3-2-B）
   └─ 草稿 → data/p3-example-questions.json 或正式題庫 JSON
   └─ 圖片 → public/images/、音檔 → public/audio/
```

### 給 AI 的 prompt 補充（建議在 v2 prompt 範本加入）

未來 `source_materials/ai_generated/prompt-template.md` v2 升級時建議加：

- 在「角色 + 任務」段：明示「依 `docs/STARTERS_PART_TEMPLATES.md` 對應 Part 模板出題」。
- 在「可調參數」段：加 `starterSection` / `starterPart` 兩個必填參數，AI 出題時必填。
- 在「自我檢查」段：加一條「對齊本 Part 模板的『題目互動方式』與『answer 型態』」。

---

## 與 P4 Speaking Examiner Agent 的關係

> 本節對齊 `PROJECT_ROADMAP.md` 的 P4 與 `docs/PRODUCT_SPEC.md` 的「長期目標 → Speaking Examiner Agent」段。

### 為什麼 Speaking 不在 P3

- **P3 範圍是 Listening + Reading & Writing**——本檔只整理 L1~L4 + RW1~RW5 共 9 個 part 的模板。
- Speaking 互動本質與客觀題不同：開放式回答、需要錄音 / STT / TTS / Agent 狀態機。客觀題的單題模板無法涵蓋多輪互動。
- Speaking Part 1~4（SP1~SP4）**留到 P4 Speaking Examiner Agent**統一處理。

### P4 Speaking Examiner Agent 是什麼

P4 不是「在客觀題模板上加一個 speaking type」，而是設計一個 **Speaking Examiner Agent（口說考官代理）**——agent-based flow，含：

- **角色**：友善 Cambridge Starters 口說考官。
- **狀態機**：`currentPart` / `currentQuestionIndex` / `examinerPrompt` / `expectedAnswerType` / `childResponse` / `transcript` / `feedback` / `score` / `nextAction`。
- **TTS 考官語音**（P4-3）。
- **小孩錄音**（P4-4）。
- **STT 轉文字**（P4-5）。
- **Agent 追問 / 下一題**控制（P4-6）。
- **AI 練習回饋**（P4-7）——觀察點包括 pronunciation / vocabulary / response relevance / confidence。
- **Speaking session 紀錄與家長檢視**（P4-8）。
- **弱點分析與複習建議**（P4-9）。

### 關鍵免責（與本檔模板無關但需處處標示）

- **AI 回饋不是 Cambridge 官方成績**——只是練習建議。
- **不聲稱能預測官方分數**。
- **不做能力等級對應**（不寫「相當於 Pre A1 / A1 / A2」）。
- UI 必須清楚標示「**AI 練習回饋，非官方考試分數**」。

詳細實作規劃見 `PROJECT_ROADMAP.md` P4-1 ~ P4-9 與 `docs/PRODUCT_SPEC.md`「長期目標 → Speaking Examiner Agent」段。

### Speaking Part 模板未來歸屬

未來若要寫 SP1~SP4 模板，**不寫進本檔**——而是寫進 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md`（規劃中，屬 P4 動工前置文件）。本檔只負責 Listening + Reading & Writing。

---

## 與其他文件的關係

| 文件 | 關係 |
| --- | --- |
| `docs/DATA_SCHEMA.md` | 本檔給「題型 → 正式 part」對應與未來欄位建議；DATA_SCHEMA 給「題型實際 schema 欄位」。兩檔互補，未來 P3-9-B 動工時需同步更新 DATA_SCHEMA。 |
| `docs/AI_QUESTION_GENERATION.md` | 本檔給 AI 出題模板的「題型結構參考」；AI_QUESTION_GENERATION 給 prompt 規格 / 草稿格式 / 品質檢查。兩檔互補。 |
| `source_materials/README.md` | 本檔給 AI 仿真題出題流程的「題型結構」；source_materials/README 給「整理區 SOP」與「官方資源整理原則」。兩檔互補。 |
| `PROJECT_ROADMAP.md` | 本檔屬 P3-9-A 子分區；P3-9-B（schema / metadata）與 P3-9-C（part-specific UI）尚未開始，依本檔模板逐步推進。 |
| `docs/PRODUCT_SPEC.md` | 本檔遵守「國小低年級使用者設計原則」與「目前明確不做」硬邊界。Speaking 部分對齊「長期目標 → Speaking Examiner Agent」段。 |

## 版本

- **v1**（2026-05-08）：第一版——9 個 part 模板（L1~L4 + RW1~RW5）+ 目前 schema 對應表 + 未來欄位建議 + AI prompt 流程更新 + P4 Speaking 關係說明。
