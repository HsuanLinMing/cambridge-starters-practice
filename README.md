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
- `/quiz`：測驗區骨架（尚未串資料）
- 範例資料：54 個單字（覆蓋 17 個字母、11 個主題分類）、1 份 4 題小測驗
- 文件骨架：roadmap、產品規格、資料 schema、AI 協作流程、任務分流

## 下一步

依 `PROJECT_ROADMAP.md` 推進：

1. **P2-4C-2B-2 複習中心後續擴充**：`/review/picture` 看圖練習已包含兩種題型（看圖選字、看字選圖）且第一批 10 個自製 SVG 圖像素材已接入，後續可補：補更多自製圖片素材（往剩下 44 個未補圖單字推進）、聽力練習、句型練習、位置 / 顏色 / 數量練習、TTS 音檔，以及補齊更多單字（I / K / L / N / Q / U / V / X / Z）。翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成、看圖練習第一版已於 P2-4C-1 完成、看字選圖第二題型已於 P2-4C-2A 完成、第一批圖片素材已於 P2-4C-2B-1 完成，皆不再列入待辦。
2. **P3 考前練習與題庫（進行中）**：
   - **P3-1 考題資料 schema 擴充（已完成）**：`QuestionSource` / 6 種 `QuestionType` / `BaseQuestion` / 6 個題型專屬型別 / `ExamPaper` / `ExamSection` / `ExamSessionState` 寫入 `lib/types.ts`，配套文件寫入 `docs/DATA_SCHEMA.md`，範例資料 `data/p3-example-questions.json` / `data/exam-papers.example.json`。**僅資料設計、未做 UI / localStorage 實際讀寫**。
   - **P3-2-A 本機素材匯入流程：規劃 / 文件（已完成）**：建立 `source_materials/` 資料夾骨架（`samples/` / `past_papers/` / `ai_generated/` / `custom/` 四個子目錄各對應一個 `QuestionSource`）+ `.gitignore` 排除原始 PDF / 圖片 / 音檔 + 主 README + 範例草稿格式。**純人工流程，未寫任何自動化程式**。
   - **P3-3-A AI 仿真題 Prompt 標準格式（已完成）**：新增 `docs/AI_QUESTION_GENERATION.md` 規格文件（10 sections：定位 / 難度原則 / 來源規則硬邊界 / 6 題型 / 草稿輸出格式 / 轉換流程 / 品質檢查 6 項 / 對齊 P3-1 + P3-2-A / 不在 P3-3 範圍 / 版本化）+ `source_materials/ai_generated/prompt-template.md`（v1，可直接複製給 AI 使用）+ `source_materials/ai_generated/example-ai-questions.md`（6 題自製草稿覆蓋 6 題型）+ `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`（prompt v1 第一批人工試跑草稿，8 題，附完整品質檢查紀錄）。**僅文件 / prompt 範本 / 草稿範例，未串 AI API、未做自動轉換工具，這批草稿尚未進正式題庫**。
   - **P3-2-B（自動化轉換工具）/ P3-3-B（實際 AI 工具串接）/ P3-4（Listening 題型）/ P3-5（Reading & Writing 題型）/ P3-6（完整考卷 Session、交卷與錯題複習）仍未開始**。
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
- `docs/TASK_ROUTER.md` — 任務分流規則
- `docs/CODEX_VALIDATION_RUNBOOK.md` — Codex 驗收與排查手冊
- `reports/` — Claude / Codex 回報檔案輸出位置（例如 `reports/claude_last_report.md`）
