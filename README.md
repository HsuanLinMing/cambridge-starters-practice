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
- `/review`：**複習中心首頁**（負責分項能力練習）——5 張主入口卡：單字複習（已實作）、看圖練習、聽力練習、句型練習、位置 / 顏色 / 數量（後 4 個目前為「準備中」狀態，卡片淡化、不可點）。頁面底部另有一個小型輔助提示連到 `/quiz` 測驗區，視覺層級低於 5 張主卡，避免讓人誤把考卷功能當成複習中心主功能
- `/review/words`：A~Z 字母入口（依資料動態顯示每字母單字數）
- `/review/letter/[letter]`：字母總覽頁，列出該字母開頭的單字
- `/review/word/[id]`：單字詳情頁——大圖、英文、發音按鈕；中文意思、英文例句、中文例句**初始隱藏**，由「🔍 看答案」/「🙈 再想一次」按鈕翻牌顯示。圖片 / 音檔皆有缺檔 fallback；上一個 / 下一個依整體 A~Z 順序前進、自動跨字母、切換時自動收起答案
- `/quiz`：測驗區骨架（尚未串資料）
- 範例資料：54 個單字（覆蓋 17 個字母、11 個主題分類）、1 份 4 題小測驗
- 文件骨架：roadmap、產品規格、資料 schema、AI 協作流程、任務分流

## 下一步

依 `PROJECT_ROADMAP.md` 推進：

1. **P2-4C 複習中心擴充與素材補強**：把「準備中」的看圖 / 聽力 / 句型 / 位置 · 顏色 · 數量四個入口逐步補上實作；同步補齊 I / K / L / N / Q / U / V / X / Z 等字母的單字、真實圖片、TTS 音檔。翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成，故不再列入待辦。
2. **P3 考前練習與題庫（規劃中）**：考題資料 schema 擴充、本機資料匯入流程、AI 仿真題生成、Listening 與 Reading & Writing 題型、完整考卷 Session 與錯題複習。未來測驗區會支援**一次生成一整份完整考卷**（多題型混合），可保存未完成進度（以瀏覽器 localStorage 為主，下次進來繼續作答），並提供「繼續作答 / 離開這份考卷 / 重新測驗 / 直接交卷」四個操作；交卷後評分、錯題以紅色標示、顯示正確答案與小一友善講解。題目來源標記 `official_sample` / `past_paper` / `ai_generated` / `custom`，第一階段不做自動爬蟲，**第一版不計時、不登入、不接後端 / 雲端**。詳見 `docs/PRODUCT_SPEC.md` 的「測驗與考前練習方向」。

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
