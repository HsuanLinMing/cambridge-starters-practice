# Cambridge Pre A1 Starters 正式題型模板（P3-9-A 起，v2 校正版）

> 本檔是 P3-9-A 的核心輸出——把本專案的練習題型對齊 Cambridge Pre A1 Starters 的**正式 parts 結構**，給後續 `/quiz` UI、AI 仿真題（P3-3 / P3-8）、Listening 題型（P3-4）、Reading & Writing 題型（P3-5）、官方資源整理（P3-7）一份共同參考標準。
>
> ⚠️ **本檔是「自製練習模板」，不是官方題庫，也不是複製官方題目**。所有模板皆依官方公開的題型結構描述「重新製作」，不抄原文、不變形歷屆題；正式題庫題目仍走「自製 / AI 仿真題 → 人工審核 → 進正式 JSON」流程。
>
> 本檔只寫**模板與規格**——**不修改** `lib/types.ts`、**不修改** `data/*.json`、**不修改** `/quiz` UI；那些屬於 P3-9-B（schema / metadata 實作）與 P3-9-C（part-specific UI 實作）。
>
> 📌 **目前版本：v2（2026-05-09）**——P3-7-B 第一輪官方 format 校正完成。詳見文末「版本」段。

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

## 官方 format 摘要（v2 新增）

> 依 Cambridge English 公開的 Pre A1 Starters 官方 format 說明整理。**僅作題型結構參考**——本專案不複製官方題目 / 圖片 / 音檔 / sample paper 內容。

### Listening

- **Parts**：4 個
- **題數**：20 題（4 parts 各約 5 題）
- **時間**：約 20 分鐘
- **重要規則**：每段錄音會聽兩次（**each recording is heard twice**）
- **每 Part 提示**：每個 part 開頭有 one or two examples（給孩子熟悉題型）

### Reading and Writing

- **Parts**：5 個
- **題數**：25 題（5 parts 各約 5 題）
- **時間**：20 分鐘
- **重要規則**：所有 parts 的拼字必須完全正確（**spelling must be correct**）——尤其影響 RW3 看圖拼字、RW4 填空、RW5 one-word answer 三個 parts 的判分
- **每 Part 提示**：每個 part 開頭有 one or two examples

### Speaking

- **Parts**：4 個
- **時間**：3–5 分鐘（與 Listening / R&W 分開計時）
- **本專案 P3 範圍**：**不實作**——留給 P4 Speaking Examiner Agent（見 `PROJECT_ROADMAP.md` P4 章節）。

### 本專案使用方式

- 上述總覽**僅作題型結構參考**——不複製官方題目、圖片、音檔或 sample paper 內容。
- 本專案 `/quiz` 為自製練習版，**不模擬精確的官方題數 / 時間**（目前 7 題範例與正式 25+20=45 題 / 40 分鐘差距很大；自製音檔 + 自製 SVG 補齊前不追求總量）。
- 目標是讓孩子熟悉題型形式、降低真考時的陌生感，**不是還原官方考試體驗**。
- 仍是練習版近似對應，**不代表完整正式考試**。

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

### Listening Part 1（L1）：大圖 + 人物 / 物件位置連線（v2 校正）

- **官方方向簡述**：考生看一張包含若干人物或物件的大場景圖（例如客廳、公園、教室），聽考官 / 音檔逐句講「Tom is …」「The cat is …」，把名字 / 物件配對到圖中正確位置（連線題）。**官方規則**：本 Part 屬 Listening 段，錄音會聽兩次（heard twice）；開頭有 1~2 題 example 給孩子熟悉。
- **本專案練習版目標**：簡化版——用「看圖 + 聽句子 + 選人物 / 選位置 / 選物件」的多選題形式，先讓孩子熟悉「聽句子定位人 / 物 / 位置」的能力，連線手勢互動屬 P3-9-C 後續。
- **題目互動方式**（第一版簡化）：
  1. 顯示大場景圖（或先用文字描述場景）。
  2. 播放 `audio`（或顯示 transcript 文字 fallback）；模擬「heard twice」可在 UI 加重播按鈕。
  3. 提供 4 個選項：人物名 / 位置詞 / 物件名，孩子點選正確答案。
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

### Listening Part 2（L2）：聽對話，寫 name / number（v2 校正）

- **官方方向簡述**：聽一段考官 / 音檔的短對話（兩人互相打招呼、報名、講年齡 / 數量），考生在表格空格中**寫下** name 或 number 等短答案。**官方規則**：錄音會聽兩次（heard twice）；本 Part 開頭有 1~2 題 example。**spelling must be correct**——name / number 拼字 / 數字寫法錯了不算對。
- **本專案練習版目標**：第一版做「聽句子 + 文字輸入 name / number」單句版；多輪對話 / 表格 + 多空格屬 P3-9-C 後續。
- **題目互動方式**（第一版簡化）：
  1. 播放 `audio`（或顯示 transcript fallback）。
  2. 顯示題目文字（例如 `Name: ___` 或 `How many cats? ___`）。
  3. 孩子在 `<input>` 填入答案。**比對策略**：name 忽略大小寫但仍須拼字正確（對應「spelling must be correct」）；number 可接受文字（`three`）或數字（`3`）兩種寫法（依教師偏好）。
- **需要的資料欄位**：
  - `audio`（必填）
  - `transcript`、`ttsScript`
  - `prompt`（題目文字 + 空格佔位符）
  - `answer`（純字串，如 `"Tom"` / `"three"` / `"3"`）
  - `expectedAnswerType`（**未來欄位**：`name` / `number`，本輪不動 types）
- **imagePrompt 建議**：可選；若加表格圖，可畫一個簡單的「ID card 表格」線條圖，留空格給手寫；不放任何英文範例字（避免洩漏答案）。
- **ttsScript 建議**：對話兩句即可（≤ 20 字）；speaker 標記用 `[Examiner]` `[Child]` 註記；例如：`[Examiner] What's your name? [Child] My name is Tom.`
- **answer 型態**：`text` 包含三種子情境——`name`（人名 / 動物名 / 物件名）/ `number`（數字 1~20 居多）/ 一般 `text`。`expectedAnswerType` metadata 已在 P3-9-B 第一刀就位（4 個值含 `name` / `number` / `text`），可逐題區分以便未來精細比對。
- **目前 P3 schema 是否已支援**：⚠️ 半支援——`fill-blank` 自由填空版（無 `options`）已可實作 name / number 輸入；但**音檔欄位不在 `fill-blank` 必填**，需要組合 `BaseQuestion.audio` + `fill-blank.prompt`。`expectedAnswerType` 已在 P3-9-B 加入但 UI 尚未依 `name` / `number` / `text` 分流（屬 P3-9-C）。
- **未來需要補哪些功能**：
  - 多輪對話 UI（speaker 標籤、雙泡泡）。
  - 表格題型（多 row 同時填）。
  - 數字 vs 文字輸入鍵盤切換（行動裝置 UX）。
- **是否需要圖片**：⚠️ 可選（表格線條圖加分，但不必要）。
- **是否需要音檔**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 高度適合——AI 可出對話腳本、name / number 標準答案皆明確；不需精緻圖片。

### Listening Part 3（L3）：聽音選 A/B/C 圖（v2 校正 + P3-9-C 第一刀 audio 準備 + 第三刀 A/B/C 圖選項視覺）

- **官方方向簡述**：聽一句問題或短敘述（例如 `What does Tom want?` / `Where is the cat?`），從 **3 張圖（A / B / C）** 中選正確答案。**官方規則**：錄音會聽兩次（heard twice）；本 Part 開頭有 1~2 題 example。
- **本專案練習版目標**：**目前 `/quiz` 的 `listening-choice` 最接近此 part**。**P3-9-C 第一刀已支援 optional `audioSrc`**——UI render `<audio controls>` 讓孩子自行重播音檔（替代官方「heard twice」固定播放）；無音檔時自動 fallback 到 transcript / ttsScript 文字練習。**P3-9-C 第三刀（2026-05-10）**：`q-lc-001` 已切到 `optionType: "image"`，UI render 圖卡（手機 `grid-cols-2` / 桌機 `sm:grid-cols-3`）+ **左上角 A / B / C 標籤**，並**隱藏英文單字**避免聽力答案外洩；圖片缺檔時 fallback 顯示「字母 + 圖片準備中」。**P3-9-C 第三刀後續（2026-05-10）**：`q-lc-001` 已從 4 選項調整為 **3 選項 A/B/C**（apple / banana / cat），對齊正式 Cambridge L3 的 3 張版面；`banana.svg` 已補齊，3 張圖卡都顯示真實圖片。後續可加：（1）真實自製 TTS 音檔產生（已 ✅ OpenAI v2）；（2）多題 L3 題庫；（3）音檔快取 / 管理策略。
- **題目互動方式**：
  1. **若 `audioSrc` 存在且可載入**：顯示 `<audio controls>` + 「💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習」小提示（**考試中不顯示 transcript**，由 P3-9-C 第二刀規範）。
  2. **若 `audioSrc` 缺值或載入失敗**：自動 fallback 顯示「音檔準備中，先用文字練習」+ transcript / ttsScript 文字。
  3. 顯示 **3 張**圖片選項，標 A / B / C（手機 2 欄、桌機 3 欄）。
  4. 孩子點選正確圖片。
- **需要的資料欄位**（已支援，目前 schema 可實作）：
  - `audio`（legacy 必填）/ `audioSrc`（**P3-9-C 第一刀新增 optional**，本專案自製音檔路徑，建議 `/audio/starters/l3/<id>.mp3`）
  - `transcript`、`ttsScript`
  - `optionType: "image"`
  - `options: ImageOption[]`（3~4 個圖片選項）
  - `answer`（其中一個 `options[i].value`）
- **imagePrompt 建議**：3~4 張**對比明確**的小圖（apple vs banana vs cat），單一物件、無背景、無英文字。每張圖風格一致避免無關干擾。
- **ttsScript 建議**：單句問題、≤ 10 字；例如：`What does Tom want?` / `Where is the cat?`。本專案音檔**必須是自製或未來由 TTS 產生**，**嚴禁使用官方音檔**。
- **answer 型態**：`choice`（從 `options[i].value` 選一個）。
- **目前 P3 schema 是否已支援**：✅ **完整支援 + P3-9-C 第一刀補強**——`listening-choice` + `optionType: "image"` + 新增 `audioSrc?: string` optional 欄位（音檔載入失敗自動 fallback 不 crash）。目前 `data/p3-example-questions.json` 的 `q-lc-001` 已補 `audioSrc: /audio/starters/l3/q-lc-001.mp3`（但實體 mp3 尚未產生，UI 自動降級為文字練習）。
- **未來需要補哪些功能**：
  - 真實自製 TTS 音檔產生（macOS `say -o` / Web Speech API / 雲端 TTS，屬 P2-4C-2B-2 範圍）—— ✅ P3-9-C 第二刀已切到 OpenAI TTS v2 自製音檔。
  - 多題 L3 題庫（目前只有 1 題）。
  - 音檔快取 / 管理策略（避免每次 reload 重新下載）。
  - ~~UI 加 A / B / C 標籤覆蓋在圖片角落~~ ✅ **P3-9-C 第三刀已完成**（2026-05-10）。
  - ~~限制選項數為 3~~ ✅ **2026-05-10 完成**——`q-lc-001` 已從 4 選項調整為 3 選項 A/B/C 對齊正式 Cambridge L3。
  - ~~補 `banana.svg` 等目前缺檔的選項圖~~ ✅ **2026-05-10 補件完成**——L3 3 張 ImageOption（apple/banana/cat）全部顯示真實圖片，不再走 fallback。
  - 更完整 L3 Part 3 題型模板（含 Listening Part 3 example handling、heard-twice UI、多題 L3 題庫）。
- **是否需要圖片**：✅ 必要（3~4 張對比圖）。
- **是否需要音檔**：✅ 必要（但**本專案不下載官方音檔**——只能是自製或 TTS 自製）。
- **是否適合 AI 仿真題生成**：✅ **最適合**第一版優先——schema 已就位、AI 出題簡單、圖片需求清楚、音檔可由自製 TTS 產生。

### Listening Part 4（L4）：聽指令塗顏色（v2 校正）

- **官方方向簡述**：考生看一張黑白 / 灰階線條圖（多個物件），聽考官指令「Colour the apple red」「Colour the cat blue」，把對應**物件**塗對**顏色**。**官方規則**：錄音會聽兩次（heard twice）；本 Part 開頭有 1~2 題 example。**核心元素**：辨識物件 + 辨識顏色 + 連結兩者。
- **本專案練習版目標**：第一版做「聽句子 + 選顏色 / 選物件」多選題版（拆兩個子題型，分別練習辨識）；真正的塗色互動（在 SVG 上點擊填色）屬 P3-9-C 後續。
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

### Reading & Writing Part 1（RW1）：看圖 + 句子，判斷 yes/no 或 tick/cross（v2 校正 + P3-9-C 第三刀已實作 true-false 題型）

- **官方方向簡述**：每題顯示一張圖 + 一句描述句（例如 `It is a cat.` 對應一張狗的圖），考生判斷句子是否描述正確，畫 ✓ 或 ✗（部分版本用 yes / no 文字答）。**官方規則**：本 Part 屬 R&W 段，spelling 規則對 yes / no 答案不直接影響（不用打字 yes / no）但孩子要能讀懂句子；本 Part 開頭有 1~2 題 example。
- **本專案練習版目標**：**P3-9-C 第三刀已實作 `true-false` 題型**——一張圖 + 一句敘述 + 兩個大按鈕（Yes emerald + ✓ / No rose + ✗），透過 `<TrueFalseView>` 渲染。`q-tf-001` 範例題（`/images/cat.svg` + `It is a cat.` + answer `yes`）已在 `data/p3-example-questions.json` 就位、`/quiz` 可實際操作。**`picture-choice` 仍保留作為 RW1 / RW2 preview**——兩種題型並存：picture-choice 是「圖 + 4 文字選項」、true-false 是「圖 + 1 句描述 + Yes / No」，後者更貼近正式 RW1 形式。
- **題目互動方式**：
  1. 顯示一張單物件圖（透過既有 `<QuizImage>` 含 fallback）。
  2. 顯示一句描述（`prompt`，建議 ≤ 8 字英文）。
  3. 顯示「這句話對嗎？」副提示。
  4. 提供兩個大按鈕：Yes（emerald + ✓）/ No（rose + ✗），role="radio"，min-h-24/28，aria-label / aria-checked 完整。
- **需要的資料欄位**：
  - `image`（單物件圖；必填）
  - `prompt`（描述句；必填）
  - `answer`（`"yes"` 或 `"no"` 字串字面量；必填）
  - 可加 `starterSection: "reading-writing"` / `starterPart: "RW1"` / `expectedAnswerType: "choice"` metadata
- **imagePrompt 建議**：單一物件、無背景、無英文字；風格與 R&W 其他 part 一致。
- **answer 型態**：`choice`（yes / no 二選一；UI 顯示時轉為 `"Yes ✓"` / `"No ✗"`）。
- **目前 P3 schema 是否已支援**：✅ **完整支援**（P3-9-C 第三刀 2026-05-10 落地）——`lib/types.ts` 新增 `TrueFalseQuestion` type；`QuestionType` union 加 `"true-false"`；`components/QuizPlay.tsx` 新增 `<TrueFalseView>` + `<YesNoButton>`；`getStarterPartInfo` / `formatUserAnswer` / `formatCorrectAnswer` 同步處理 true-false；`app/quiz/page.tsx` `RW_TYPE_ORDER` 加 `"true-false": 2` 排序對齊 RW1。
- **未來需要補哪些功能**：
  - 多題 RW1 yes-no 範例（目前只有 q-tf-001 一題）。
  - 真正 ✓ / ✗ 手寫互動（畫圈 / 點擊勾叉而非按鈕；屬未來進階）。
- **是否需要圖片**：✅ 必要。
- **是否適合 AI 仿真題生成**：✅ 高度適合——AI 易出「正確 vs 故意錯誤」描述對；圖片描述明確。

### Reading & Writing Part 2（RW2）：看大圖，回答 yes/no（v2 校正）

- **官方方向簡述**：考生看一張**大場景圖**（例如教室、公園、客廳），下方有約 5 句描述（`There is a cat under the table.`），逐句判斷 yes / no。**官方規則**：本 Part 開頭有 1~2 題 example；spelling 規則對 yes / no 答案不直接影響但讀懂句子是核心。**核心結構**：一張共用 scene image + 多題判斷。
- **本專案練習版目標**：**目前 P3 schema 尚未完整支援**——`image` 是每題各自的欄位，沒有「多題共用同一張 scene image」結構。第一版可繞道用「同一張 SVG path 重複 reference」，但 UI 不會視覺保留場景圖不換。完整實作需 P3-9-B 後續加 `sceneGroup` / `sharedSceneImage` schema + P3-9-C UI（場景圖固定 + 下方多題滾動 / 換頁）。
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

### Reading & Writing Part 3（RW3）：看圖拼字（v2 校正）

- **官方方向簡述**：每題顯示一張物件圖 + 缺字提示（例如 `a _ _ _ e` 對應 `apple`，或字母被打散需重組），考生**拼出**完整單字並寫進空格。**官方規則重點**：本 Part 是「spelling must be correct」最直接生效的場景——拼錯一個字母即整題不算對（無部分給分）；本 Part 開頭有 1~2 題 example。
- **本專案練習版目標**：對應使用者提出的「**只顯示圖片、不顯示英文，孩子自己拼字輸入、可按看答案、下一題**」單字拼字測驗模式。**這是未來單字拼字測驗模式（屬 P2-4C-2B-2 review 區或 P3-9-C quiz 區）的重要依據**。**比對策略**：對應「spelling must be correct」，比對時忽略大小寫但**不容錯字母**——`appel` ≠ `apple`，需嚴格匹配。
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

### Reading & Writing Part 4（RW4）：短文 / 句子填空（v2 校正）

- **官方方向簡述**：給一段短文（多句連接成情境）或單句，留 5 個空格，考生從上方給定的**字詞 bank**（通常含 7~8 個候選字、比空格數多以增加干擾）中選正確詞填入。**官方規則**：本 Part 「spelling must be correct」生效——選錯字 / 寫錯字皆不算對；本 Part 開頭有 1~2 題 example。**核心結構**：完整短文上下文 + 多空格 + word bank。
- **本專案練習版目標**：
  - **目前 `fill-blank` 是 RW4 partial 對齊**：選項版（`options` + `answer`）已可實作單空格 + 簡單選擇；自由填空版（無 `options`）也已支援。**多空格短文 + word bank 仍未支援**——屬 P3-9-B 後續刀數 + P3-9-C UI 範圍。
  - **`multiple-choice` 只是 RW4 preview / 詞彙選擇預備**——形式是「單句 + 4 選 1」，與正式 RW4 「短文 + 5 空格 + word bank」差距大；P3-9-C 已在 UI 加 `Part 4 preview：短句選字 / 詞彙選擇` 區別文案。
  - 完整 RW4 需 `multiBlankAnswers: string[]` + `wordBank: string[]` schema 升級。
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

### Reading & Writing Part 5（RW5）：看故事圖，回答一字答案（v2 校正）

- **官方方向簡述**：考生看 **3 張連續故事圖**（picture story；前 / 中 / 後一致情境，主角與道具一致），讀題目（What / Where / Who / How many / How old），用**單一英文字（one-word answer）**作答。**官方規則**：「spelling must be correct」生效——拼錯一個字母不算對；本 Part 開頭有 1~2 題 example。**核心結構**：圖片序列 + 文字題目 + 嚴格單字答案。
- **本專案練習版目標**：需要 3 張連續圖（或退化成單張 scene image）+ one-word answer 文字輸入。**目前 `matching` 是 RW5 preview / 故事理解預備**——形式是配對而非 one-word answer，與正式 RW5 差距大。**重要差距**：本專案目前**沒有「one-word answer + 多圖故事」原生題型**——需 P3-9-B 後續加 `images: string[]` / `imageSequence` schema + `expectedAnswerType: "one-word"` 嚴格比對 + P3-9-C UI（多圖橫向排版 + one-word 輸入框）。
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

## 目前 P3 schema 對應表（v2 校正：三層分類）

> 對齊 `components/QuizPlay.tsx` 的 `getStarterPartInfo()` helper（P3-6-A.1 + P3-9-B + P3-9-C 小修已實作 metadata-first + (starterPart, type) 細分文案）。本表是現況快照，**這些都還不是官方題庫，只是自製練習題型對正式 parts 的逐步對齊**。

### 第一層：已較接近正式 Part 的題型

可作為「練習版近似實作」的基礎，UI 與 schema 改動小。

| 目前 P3 type | 對應正式 part | 狀態 | 主要差距 |
| --- | --- | --- | --- |
| `listening-choice` | **L3 preview / 部分支援** | 🟢 最接近 | ✅ **P3-9-C 第三刀**已加 A / B / C 視覺標籤 + 圖選項 + **3 選項對齊正式 L3**；缺「heard twice」重播 UI（目前由 `<audio controls>` 自由重播替代）；多題 L3 題庫待補 |
| `fill-blank` | **RW4 partial** | 🟢 較接近 | 單空格已支援；**多空格短文 + word bank 未支援**；缺「spelling must be correct」嚴格比對開關 |
| `true-false` | **RW1**（P3-9-C 第三刀） | 🟢 較接近（最直接對齊） | 大型 Yes / No 按鈕已實作（emerald + ✓ / rose + ✗）；多題 RW1 樣本待補（目前只有 q-tf-001 一題）；真正 ✓ / ✗ 手寫互動屬未來進階 |

### 第二層：preview / 預備型題型（形式接近、互動或答題型不同）

可在 UI 文案標「Part X preview」字樣，提示家長「練習版近似、不是完整正式題型」。

| 目前 P3 type | 對應正式 part | 狀態 | 主要差距 |
| --- | --- | --- | --- |
| `picture-choice` | **RW1 / RW2 preview** | 🟡 形式接近、缺 yes/no 互動 | 沒有原生 yes/no 答案型態；scene image 多題共用未支援 |
| `word-choice` | **RW3 preview（看圖認字 / 反向）** | 🟡 同題型反向（看字選圖 → 看圖選字） | 真正 RW3 是看圖**拼字**輸入，需 spelling-input；本 type 是看字選圖反向 |
| `multiple-choice` | **RW4 preview / 詞彙選擇預備** | 🟡 部分對齊 | 真正 RW4 是短文 / 句子填空 + word bank，需 multi-blank；mc 是單句 4 選 1（P3-9-C 小修文案改為「短句選字 / 詞彙選擇」更精確） |
| `matching` | **RW5 preview / 故事理解預備** | 🟡 形式接近、答題型不同 | 真正 RW5 是 one-word answer + picture-story；matching 是配對 |

### 第三層：尚未支援的正式題型

需 P3-9-B 後續刀數 + P3-9-C UI 才能落地；列為未來開發路線圖。

| 正式 part | 狀態 | 需要新增 |
| --- | --- | --- |
| **L1** 場景圖 + 人物位置連線 | ⬜ 尚未支援 | sceneImage + `imageHotspots` schema + 點擊互動 UI |
| **L2** 聽對話寫 name / number（完整對話 + 多 row 表格） | ⬜ 尚未支援 | 多 row 表格 schema + speaker 標記 + 數字 / 文字鍵盤切換 |
| **L4** 聽指令塗色（真正塗色互動） | ⬜ 尚未支援 | colorPalette + instructions 結構 + SVG 點擊填色 |
| **RW1** 完整圖句判斷（yes/no） | ⬜ 尚未支援 | `true-false` 子題型 / `answerStyle: "yes-no"` metadata + 大型 ✓/✗ 按鈕 |
| **RW2** 共用 scene image yes/no（多題共用） | ⬜ 尚未支援 | `sceneGroup` / `sharedSceneImage` schema + 場景圖固定版面 |
| **RW3** 看圖拼字 | ⬜ 尚未支援 | `spelling-input` 子題型 / `inputMode: "spelling"` metadata + 嚴格拼字比對 |
| **RW4** 多空格短文 + word bank | ⬜ 尚未支援 | `multiBlankAnswers: string[]` + `wordBank: string[]` schema + 拖曳互動 |
| **RW5** picture-story + one-word answer | ⬜ 尚未支援 | `imageSequence: string[]` schema + `expectedAnswerType: "one-word"` 嚴格單字比對 |
| **Speaking SP1~SP4** | ⬜ 不在 P3 範圍 | 整段 P4 Speaking Examiner Agent（狀態機 + TTS + 錄音 + STT） |

### 三層對應表的硬邊界

- 上述所有對應**都是「自製練習題型對正式 parts 的逐步對齊」**——**還不是官方題庫**。
- 「目前較接近 / preview / 尚未支援」是進度分級，不是品質分級。
- UI 文案已在題目卡 header 對應顯示「Part X」/ 「Part X preview」字樣（P3-6-A.1 / P3-9-B / P3-9-C 小修），協助家長辨識「對齊度」。
- **不是完整正式題型**——多項細節差距見上表「主要差距」/「需要新增」欄。
- **未來會逐步新增更精準的 part-specific types 或 metadata**——具體進度由 P3-9-B（schema / metadata 實作）與 P3-9-C（part-specific UI 實作）推進。

### `getStarterPartInfo()` 與本表的關係

`components/QuizPlay.tsx` 既有的 `getStarterPartInfo(question)` 純函式 helper 把 6 題型映射到對應 Part 標示（`partLabel` + `zhTitle`）。**P3-9-B 第一刀**已升級為 metadata-first（先讀 `question.starterPart`，缺值才 fallback 依 `question.type`）；**P3-9-C 小修**已加 (starterPart, question.type) 組合特殊覆寫（例如 `RW4 + multiple-choice` → 「Part 4 preview：短句選字 / 詞彙選擇」），對齊本表第二層「preview 文案需精準」需求。

---

## v2 後續實作優先順序建議（v2 新增）

> 依目前專案狀態（P3 schema / vocabulary / SVG / 既有 helpers / `getStarterPartInfo` 已 metadata-first）提出 8 項實作優先順序。**理由考量**：(a) schema 改動小先做、(b) 教學價值高先做、(c) 配合既有 SVG / vocabulary / 自製音檔策略。

### 排序

1. **L3 聽音選圖 + TTS 音檔**（最高優先）
   - schema 已支援（`listening-choice` + `optionType: "image"`）；只需補 TTS 音檔（屬 P2-4C-2B-2 / P3-4）。
   - 教學價值高——孩子能立即練到「聽音 → 選圖」核心技能。
   - 既有 `q-lc-001` 範例已就位 metadata、可直接擴張為 image-options 版。

2. **RW3 拼字輸入模式**
   - 對應使用者明確需求（單字拼字測驗模式，已寫進 P2-4C-2B-2 ROADMAP）。
   - 第一版可用 `fill-blank` 自由填空版 + `expectedAnswerType: "spelling"` metadata 標示嚴格比對；不需要新題型。
   - schema 改動小（仍走 fill-blank）。
   - 「spelling must be correct」嚴格比對對應正式考試規則。

3. **RW1 true-false / tick-cross**
   - 可作為新 question type（`true-false`）或 multiple-choice 的子模式（`answerStyle: "yes-no"` metadata）。
   - schema 改動小；UI 改成大型 ✓ / ✗ 按鈕即可。
   - 對齊 RW1 正式 part 形式。

4. **RW4 fill-blank 強化（往多空格 + word bank 方向）**
   - 對應正式 RW4 核心結構。
   - schema 改動較大：需 `multiBlankAnswers: string[]` + `wordBank: string[]`；需 P3-9-B 後續刀數。
   - UI 需「拖曳填空 / 點選候選詞」互動，屬 P3-9-C 範圍。

5. **RW5 picture-story + one-word answer**
   - 對應正式 RW5 核心結構。
   - schema 改動大：需 `imageSequence: string[]` + `expectedAnswerType: "one-word"` 嚴格單字比對。
   - UI 需 3 張圖橫向排版 + one-word 輸入框，屬 P3-9-C 範圍。
   - 「spelling must be correct」嚴格比對對應正式規則。

6. **L2 name / number input**
   - 類似 fill-blank 自由填空變體 + audio + `expectedAnswerType: "name" | "number"` metadata 標示。
   - schema 改動小。
   - 適合 AI 仿真題出題（對話腳本 + 標準答案明確）。

7. **L4 color instruction**
   - 第一版可用 `listening-choice` + image options 模擬「選顏色 / 選物件」（拆兩個子題型）。
   - 真正塗色互動（SVG 點擊填色）屬未來。
   - 配合既有 color-class SVG（red / blue / one / two 等）+ 對應 vocabulary。

8. **L1 scene hotspot / 人物位置連線**（最低優先）
   - 複雜度最高（需 sceneImage + `imageHotspots` schema + 點擊熱區互動）。
   - 第一版可先做「簡化選人 / 選位置 / 選物件」多選題版（已在 L1 模板段描述）。
   - 完整 hotspot 互動建議放最後或拆成多刀。

### 排序理由總結

- **1~3** 屬「schema 已支援或微調即可」+「教學價值高」+「容易產出 AI 仿真題」的組合，建議**最先做**。
- **4~5** 需 schema 升級（`multiBlankAnswers` / `imageSequence`），但都對應正式考試**核心題型**，建議**在 P3 階段內完成**。
- **6~7** 屬中等難度，可與其他項目交替；L4 真正塗色互動可推後。
- **8** 屬完整 part-specific UI，建議**放最後或拆成多刀**。

### 跨項目共通要求

每項實作都應遵守：

- **自製題目** + 自製圖片 / 音檔 + 人工審核 + **不複製官方原文**（見 `docs/OFFICIAL_RESOURCES.md` AI 仿真題素材策略 + `docs/AI_QUESTION_GENERATION.md` 來源規則硬邊界）。
- 對應 `docs/PRODUCT_SPEC.md`「目前明確不做」清單：不下載官方 PDF / 圖片 / 音檔；不複製官方題目 / 歷屆題；不爬蟲。
- UI 文案保留「練習版近似對應、不代表官方題目」立場——透過「Part X preview」/「練習版」字樣明示。

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
- **v2**（2026-05-09，P3-7-B 第一輪官方 format 校正）：
  - **新增「官方 format 摘要」段**——Listening 4 parts / 20 Q / 20 min / heard twice，R&W 5 parts / 25 Q / 20 min / spelling must be correct，Speaking 4 parts / 3-5 min（不在 P3 範圍）+「本專案使用方式」邊界。
  - **校正 9 個 Part 模板描述**（L1~L4 + RW1~RW5）：每個 Part 補官方規則（heard twice / spelling must be correct / 1~2 examples per part）+ 補練習版邊界與 schema 差距描述。
  - **「目前 P3 schema 對應表」分三層**：第一層已較接近正式 Part 的題型（listening-choice / fill-blank）+ 第二層 preview / 預備型題型（picture-choice / word-choice / multiple-choice / matching）+ 第三層尚未支援的正式題型（L1 / L2 / L4 hotspot 互動 + 完整 RW1~RW5 + Speaking SP1~SP4）；明示「這些都還不是官方題庫，只是自製練習題型對正式 parts 的逐步對齊」。
  - **新增「v2 後續實作優先順序建議」段**——8 項排序（L3 + TTS 音檔最先 / RW3 拼字輸入 / RW1 yes-no / RW4 多空格 / RW5 picture-story / L2 / L4 / L1 hotspot 最後）+ 排序理由 + 跨項目共通要求（不複製官方原文）。
  - 仍是練習版近似對應，**不複製官方題目 / 圖片 / 音檔 / sample paper 內容**——硬邊界與 v1 一致。
  - **後續若人工瀏覽 handbook / sample paper 後發現更精確的描述**，可升 v3（屬 P3-7-B 後續刀數 + P3-7-D「sample / mock test toolkit 觀察筆記」範圍）。
- **v2.4**（2026-05-10，P3-9-C 第三刀後續 L3 3 選項對齊正式 Cambridge L3）：`q-lc-001` 從 4 選項（apple / banana / cat / dog）調整為 **3 選項 A/B/C**（apple / banana / cat），對齊正式 Cambridge Starters L3 的 3 張圖選項版面；移除 dog 選項。`components/QuizPlay.tsx` `ListeningChoiceView` image 分支 grid 從 `grid-cols-2` 升級為 `grid-cols-2 sm:grid-cols-3`——手機 2 欄（第 3 張自然換行至第二列獨佔一格）/ 桌機 3 欄（A B C 同一列），對齊官方 L3 3 並排視覺。L3 模板段標題、互動方式、未來功能清單、schema 對應表 `listening-choice` 條目皆同步更新；DATA_SCHEMA jsonc 範例改為 3 個 ImageOption。**仍未做**：多題 L3 題庫 / 更完整 L3 Part 3 題型模板（example handling / heard-twice UI）。**硬邊界不變**。
- **v2.3**（2026-05-10，P3-9-C 第三刀後續 L3 圖選項視覺第一版）：L3 模板段升級為「P3-9-C 第三刀已實作 A/B/C/D 圖選項視覺」狀態——`q-lc-001` 切到 `optionType: "image"` + 4 張 ImageOption（apple/banana/cat/dog）；UI render 2x2 圖卡 + 左上角 A/B/C/D 標籤 + 隱藏英文單字（避免聽力答案外洩） + 圖片缺檔 fallback 改用標籤字母（不再用 value 首字母）。schema 對應表第一層 `listening-choice` 條目同步更新（✅ 已加 A/B/C/D 視覺標籤）。**仍未做**：限制選項為 3 張對齊正式 L3 / 補 `banana.svg` 等缺檔圖 / 多題 L3 題庫（屬 P3-9-C 後續刀數）。**硬邊界不變**：不複製官方題目 / 不下載官方圖片音檔。
- **v2.2**（2026-05-10，P3-9-C 第三刀 RW1 true-false 題型落地）：RW1 模板段升級為「P3-9-C 第三刀已實作 true-false 題型」狀態——含本專案練習版目標、題目互動方式、需要的資料欄位、`getStarterPartInfo` 細分覆寫（RW1 + true-false → 「Part 1：看圖判斷 yes / no」）、目前 P3 schema 是否已支援（✅ 完整支援）、未來需要補哪些功能；schema 對應表第一層補 `true-false → RW1` 一筆（🟢 較接近，最直接對齊）；**picture-choice 仍保留作為 RW1 / RW2 preview 第二層**——兩種題型並存（picture-choice = 圖 + 4 文字選項；true-false = 圖 + 1 句描述 + Yes / No 大按鈕）。
- **v2.1**（2026-05-10，P3-9-C 第一刀 L3 audio 準備版）：在 L3 模板段補 `audioSrc?` optional 欄位說明 + UI fallback 機制（音檔載入失敗自動降級為文字練習，不 crash 頁面）+「聽兩次」UI 提示對應「heard twice」官方規則。資料層 `data/p3-example-questions.json` `q-lc-001` 已補 `audioSrc: /audio/starters/l3/q-lc-001.mp3`（實體 mp3 尚未產生，UI 自動 fallback 文字）。**仍未做** 真實 TTS 音檔產生 / 多題 L3 題庫 / 音檔快取（屬 P2-4C-2B-2 / P3-9-C 後續）。**硬邊界不變**：本專案不下載官方音檔，只能是自製或 TTS 自製。
