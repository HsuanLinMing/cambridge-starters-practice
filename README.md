# Cambridge Starters Practice

本機自用的 Cambridge Starters 考前練習工具，同時用來練習 Claude Code CLI / Codex AI 協作開發流程。

## 專案介紹

這是一個**本機自用**練習專案，明確用途：

- **給自家小朋友 Cambridge Starters 考前練習**（首要目標）。
- **練習 Claude Code CLI / Codex / ChatGPT 協作流程**（工程目的）。

明確邊界：

- 第一版**不部署、不上線、不公開服務**，只在本機跑（`npm run dev` / `npm run build` 自用）。
- 第一版**不做登入、不做付費、不做雲端同步、不做公開部署**。
- 資料以本機 JSON / 本機素材為主，不接後端、不接資料庫。
- 考完後可能不再長期維護，因此優先追求**考前實用**，不追求完整商業產品規格。

詳細產品定位與「目前明確不做」清單見 [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md)。

優先採用簡單、清楚、可擴充的架構，不過度設計。

## 技術棧

- [Next.js](https://nextjs.org/) (App Router)
- React 19 + TypeScript
- Tailwind CSS v4
- ESLint (`eslint-config-next`)

資料目前以本地 JSON 為來源（`data/vocabulary.json`、`data/quizzes.json`），第一版不接資料庫。

## 如何啟動

```bash
npm install
npm run dev
```

預設 http://localhost:3000

其他常用：

```bash
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm run build       # 產出正式 build
```

## 在平板上使用（同 Wi-Fi 區網）

本專案目前**不部署 Vercel、不公開上線**——因為未來可能會放官方 sample / 歷屆考題素材，避免外流。第一階段使用方式是 **Mac 本機啟動 Next.js dev server，平板透過同 Wi-Fi 區網 IP 開啟網站**。

操作步驟：

1. 在 Mac 上啟動 dev server：

   ```bash
   npm run dev
   ```

   啟動後終端機會印類似：

   ```
   - Local:         http://localhost:3000
   - Network:       http://192.168.x.x:3000
   ```

   `Network` 那行就是平板可用的網址。

2. 若 `Network` 那行沒出現、或想顯式綁所有網路介面：

   ```bash
   npm run dev -- --hostname 0.0.0.0
   ```

   若需要手動查 Mac 的 Wi-Fi IP（多半是 `en0`）：

   ```bash
   ipconfig getifaddr en0
   ```

3. 平板與 Mac 連同一個 Wi-Fi，瀏覽器（建議 iPad Safari）開啟：

   ```
   http://<你的 Mac IP>:3000
   ```

4. iPad Safari 可從分享選單選「加入主畫面」，讓小朋友像 App 一樣開啟。

> Vercel 等公開部署只保留為**未來可選方案**，且前提是：不放官方素材，或全部改用自製 / 可公開素材。目前不改 Flutter、不打包 App。

## 目前功能

- 首頁：標題＋兩張入口卡片（複習區 / 測驗區）
- `/review`：**複習中心首頁**（負責分項能力練習）——5 張主入口卡：單字複習（已實作）、看圖練習（已實作）、聽力練習、句型練習、位置 / 顏色 / 數量（後 3 個目前為「準備中」狀態，卡片淡化、不可點）。頁面底部另有一個小型輔助提示連到 `/quiz` 測驗區，視覺層級低於 5 張主卡，避免讓人誤把考卷功能當成複習中心主功能
- `/review/words`：A~Z 字母入口（依資料動態顯示每字母單字數）
- `/review/letter/[letter]`：字母總覽頁，列出該字母開頭的單字
- `/review/word/[id]`：單字詳情頁——大圖、英文、發音按鈕；中文意思、英文例句、中文例句**初始隱藏**，由「🔍 看答案」/「🙈 再想一次」按鈕翻牌顯示。圖片 / 音檔皆有缺檔 fallback；上一個 / 下一個依整體 A~Z 順序前進、自動跨字母、切換時自動收起答案
- `/review/picture`：**看圖練習**——頁面頂部 tab 切換兩種題型，預設「看圖選字」：
  - **看圖選字**：圖片區（缺圖時顯示首字母 + 「圖片準備中」fallback）+ 4 個英文選項按鈕。
  - **看字選圖**：英文單字題目區（淡藍背景與看圖選字的淡黃區別）+ 4 個圖片選項（每個選項缺圖時各自顯示首字母 fallback）。
  - 共通：deterministic 選項生成（避免 hydration mismatch）、即時答對 / 答錯鼓勵回饋（答錯顯示正確答案）、答對 emerald / 答錯 rose / 其他選項淡化、「下一題」循環全題庫；切換題型自動回到第 1 題且狀態完全重置。**不做分數保存、不做交卷、不做 localStorage**——那些屬 `/quiz` 測驗區範圍。
  - 圖片素材：第一批 10 個自製 SVG 已接入（apple / cat / dog / book / red / blue / one / two / mother / father），其餘 44 個單字仍是 placeholder path、由 fallback 處理；不使用 Cambridge 官方圖片、歷屆考題圖片或網路抓圖
- `/quiz`：**測驗區 P3-6-A + P3-6-B-1 / P3-6-B-2**——載入 P3-1 範例考卷（`data/exam-papers.example.json` + `data/p3-example-questions.json`），題目排序貼近正式 Cambridge Starters：**Section 1 Listening（`listening-choice`）→ Section 2 Reading & Writing（`picture-choice` → `word-choice` → `multiple-choice` → `fill-blank` → `matching`）**；題目卡頂端三列：段落徽章（「Section 1 · Listening｜聽力練習」sky 配色 / 「Section 2 · Reading & Writing｜閱讀與書寫練習」amber 配色）+ **Part 標示行**（lc → Part 3 聽音選圖；pc → Part 1 / Part 2 preview 看圖判斷 / 看圖選答案；wc → Part 3 看圖認字 / 拼字練習；mc → Part 4 preview 短句選字；fb → Part 4 短文 / 句子填空；mt → Part 5 preview 圖文配對 / 故事理解預備）+ 進度行；頁首補小字「目前為練習版，題型逐步對齊正式 Cambridge Starters」。6 題型最小渲染、一題一頁、未答題「下一題」disabled、最後一題顯示「看結果」。**作答進度自動保存於本機 localStorage**（key `cambridge-starters-practice:quiz-session:v1`，由 `lib/examSessionStorage.ts` 集中處理）——重新整理 / 重開分頁可恢復進度（同 paperId + questionOrder 才恢復、不相容自動丟棄）；恢復時畫面頂端顯示 emerald 系小提示「🔁 已恢復上次作答進度」首次點選後消失。題目卡下方加兩個 chip 按鈕：**「📝 直接交卷」**（提前進結果頁，未作答題算錯）+ **「🔁 重新測驗」**（清 localStorage、回第一題、無 confirm dialog）。**結果頁**顯示「答對 N / 共 M 題」+「已作答 X / 共 M」+「未作答 M-X 題」雙欄統計（emerald / rose 配色）+ 鼓勵文案 + 重新測驗，並在下方加 **「每題詳解」清單**（每題一張卡片，emerald 答對 / rose 答錯 / amber 未作答三色配色，每張卡片顯示：第幾題 + Section + Part 標示 + 狀態 chip + 題目文字版 + 你的答案 + 正確答案 + 說明；matching 顯示「已完成閱讀配對練習」、未作答顯示「尚未作答」並不算對；無 `explanation` 時依狀態顯示鼓勵性 fallback）。圖片缺檔 fallback（首字母 + 「圖片準備中」）；listening 不播音檔，先顯示 transcript 文字（音檔自製屬 P2-4C-2B-2）；**Speaking 不做**。**錯題複習獨立頁 / 正式歷史紀錄頁 / 計時器** 屬 P3-6-B-4 / P3-6-B-5，本輪未做
- 範例資料：54 個單字（覆蓋 17 個字母、11 個主題分類）、1 份 4 題小測驗
- 文件骨架：roadmap、產品規格、資料 schema、AI 協作流程、任務分流

## 長期方向

本專案的長期目標是逐步做成接近真正 **Cambridge Pre A1 Starters 的自家模擬考系統**：

- 完整 Listening + Reading & Writing + Speaking 模擬考流程
- TTS 假考官貫穿全流程（Listening 提示 + Speaking 互動）
- AI 仿真題 + 人工審核（先進 `source_materials/ai_generated/`、經審核後轉正式 JSON）
- 家長檢視 / 錯題複習 / 弱點分析（皆走本機 localStorage）

**目前進度仍在 P3 階段**——題庫 schema、AI 出題 prompt 規劃、`/quiz` 最小可玩流程已落地；**正式 Starters parts 模板文件第一版**已寫進 [`docs/STARTERS_PART_TEMPLATES.md`](./docs/STARTERS_PART_TEMPLATES.md)（覆蓋 Listening Part 1~4 + Reading & Writing Part 1~5 模板與目前 schema 對應表，**目前仍是練習版近似對應**，未來會依模板逐步對齊 L1~L4 + RW1~RW5）。**官方資源索引文件第一版**已寫進 [`docs/OFFICIAL_RESOURCES.md`](./docs/OFFICIAL_RESOURCES.md)——整理 Cambridge Pre A1 Starters 公開資源入口、人工筆記方向、AI 仿真題素材來源策略、P3-9 模板校正清單；**官方資源只作為人工參考與題型理解，不下載、不複製、不 commit 官方素材**；AI 仿真題會依官方題型結構 + 自家 vocabulary + 自製 imagePrompt / ttsScript + 人工審核產生（不使用官方題目全文 / 官方圖片 / 官方音檔 / 歷屆題原文 / 網路圖片 / 外部 URL）。Listening 真實音檔、完整考卷 Session、part-specific schema / metadata 與 quiz UI 實作（P3-9-B / P3-9-C）、官方 format / wordlist / sample 對 P3-9 模板的逐項校正（P3-7-B / P3-7-C / P3-7-D）等仍規劃中。**Speaking 留到 P4 Speaking Examiner Agent**——P3-9-A 模板**只整理 Listening + Reading & Writing**，Speaking Part 1~4（SP1~SP4）的模板未來歸屬於 P4 動工前置文件 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md`（規劃中）。

**Speaking / TTS 假考官 / 麥克風錄音 / Speech-to-text / AI 口說回饋屬後續 P4 階段**——P4 設計為 **Speaking Examiner Agent（口說考官代理）**，agent-based flow 帶小朋友走完 Speaking Part 1~4，**不是單次丟一句給 AI 批改**。所有 AI 提供的口說回饋僅作為**鼓勵性練習建議**，**不是 Cambridge 官方成績**；本專案不會聲稱能預測官方分數，也不做能力等級對應。

詳細階段規劃見 [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md) 的 P3-7 / P3-8 / P3-9 + P4 + P5；長期目標、Speaking Examiner Agent 設計與「目前明確不做」邊界見 [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) 的「**長期目標：自家仿真 Starters 模擬考系統**」與「**目前明確不做**」；官方資源整理原則見 [`source_materials/README.md`](./source_materials/README.md) 的「**官方資源與歷史題整理原則**」。

## 下一步

依 `PROJECT_ROADMAP.md` 推進：

1. **P2-4C-2B-2 複習中心後續擴充**：`/review/picture` 看圖練習已包含兩種題型（看圖選字、看字選圖）且第一批 10 個自製 SVG 圖像素材已接入，後續可補：補更多自製圖片素材（往剩下 44 個未補圖單字推進）、聽力練習、句型練習、位置 / 顏色 / 數量練習、TTS 音檔，以及補齊更多單字（I / K / L / N / Q / U / V / X / Z）。翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成、看圖練習第一版已於 P2-4C-1 完成、看字選圖第二題型已於 P2-4C-2A 完成、第一批圖片素材已於 P2-4C-2B-1 完成，皆不再列入待辦。
2. **P3 考前練習與題庫（進行中）**：
   - **P3-1 考題資料 schema 擴充（已完成）**：`QuestionSource` / 6 種 `QuestionType` / `BaseQuestion` / 6 個題型專屬型別 / `ExamPaper` / `ExamSection` / `ExamSessionState` 寫入 `lib/types.ts`，配套文件寫入 `docs/DATA_SCHEMA.md`，範例資料 `data/p3-example-questions.json` / `data/exam-papers.example.json`。**僅資料設計、未做 UI / localStorage 實際讀寫**。
   - **P3-2-A 本機素材匯入流程：規劃 / 文件（已完成）**：建立 `source_materials/` 資料夾骨架（`samples/` / `past_papers/` / `ai_generated/` / `custom/` 四個子目錄各對應一個 `QuestionSource`）+ `.gitignore` 排除原始 PDF / 圖片 / 音檔 + 主 README + 範例草稿格式。**純人工流程，未寫任何自動化程式**。
   - **P3-3-A AI 仿真題 Prompt 標準格式（已完成）**：新增 `docs/AI_QUESTION_GENERATION.md` 規格文件（10 sections：定位 / 難度原則 / 來源規則硬邊界 / 6 題型 / 草稿輸出格式 / 轉換流程 / 品質檢查 6 項 / 對齊 P3-1 + P3-2-A / 不在 P3-3 範圍 / 版本化）+ `source_materials/ai_generated/prompt-template.md`（v1，可直接複製給 AI 使用）+ `source_materials/ai_generated/example-ai-questions.md`（6 題自製草稿覆蓋 6 題型）+ `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`（prompt v1 第一批人工試跑草稿，8 題，附完整品質檢查紀錄）。**僅文件 / prompt 範本 / 草稿範例，未串 AI API、未做自動轉換工具，這批草稿尚未進正式題庫**。
   - **P3-6-A `/quiz` 最小可玩流程第一版（已完成）**：`/quiz` 從骨架升級為可實際操作的測驗頁，載入 P3-1 範例考卷渲染 6 題型 + 完成畫面。新增 `components/QuizPlay.tsx` client 元件、`lib/data.ts` 補 `p3ExampleQuestions` / `p3ExamplePapers` export。**純 React local state，不做 localStorage / 交卷頁 / 錯題詳解 / 計時**——那些屬 P3-6-B。
   - **P3-2-B（自動化轉換工具）/ P3-3-B（實際 AI 工具串接）/ P3-4（Listening 題型）/ P3-5（Reading & Writing 題型）/ P3-6-B（完整考卷 Session 持久化、4 個操作、結果頁、錯題詳解）仍未開始**。
   - 未來測驗區會支援**一次生成一整份完整考卷**（多題型混合），可保存未完成進度（以瀏覽器 localStorage 為主，下次進來繼續作答），並提供「繼續作答 / 離開這份考卷 / 重新測驗 / 直接交卷」四個操作；交卷後評分、錯題以紅色標示、顯示正確答案與小一友善講解。題目來源標記 `official_sample` / `past_paper` / `ai_generated` / `custom`，第一階段**不做自動爬蟲、不下載官方圖片**，**第一版不計時、不登入、不接後端 / 雲端**。詳見 `docs/PRODUCT_SPEC.md` 的「測驗與考前練習方向」、`docs/DATA_SCHEMA.md` 的 P3 schema 與「本機素材匯入流程」、以及 `source_materials/README.md`。

## 資料夾結構

```
app/                  # Next.js App Router 頁面
components/           # React 元件
data/                 # 本地 JSON 題庫與單字資料
lib/                  # 型別、資料載入工具
public/
  images/             # 單字圖片
  audio/              # 單字發音
docs/                 # 產品 / 資料 / 任務文件
reports/              # Claude / Codex 回報檔案輸出位置
```

## 文件索引

- `AI_DEV_WORKFLOW.md` — AI 協作規範
- `PROJECT_ROADMAP.md` — 開發路線圖
- `docs/PRODUCT_SPEC.md` — 產品規格
- `docs/DATA_SCHEMA.md` — 資料結構
- `docs/STARTERS_PART_TEMPLATES.md` — Cambridge Pre A1 Starters 正式題型模板（P3-9-A）
- `docs/OFFICIAL_RESOURCES.md` — Cambridge Pre A1 Starters 官方資源索引與人工整理流程（P3-7-A）
- `docs/AI_QUESTION_GENERATION.md` — AI 仿真題 prompt 規格（P3-3）
- `docs/TASK_ROUTER.md` — 任務分流規則
- `docs/CODEX_VALIDATION_RUNBOOK.md` — Codex 驗收與排查手冊
- `reports/` — Claude / Codex 回報檔案輸出位置（例如 `reports/claude_last_report.md`）
