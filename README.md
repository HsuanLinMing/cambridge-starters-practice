# Cambridge Starters Practice

自用的 Cambridge Starters 複習與模擬測驗系統，同時用來練習 CLI AI 開發 workflow。

## 專案介紹

這是一個個人練習專案，目標：

- 做出可自用的 Cambridge Starters 複習 / 測驗系統（單字複習 + 模擬考）
- 練習以 Claude Code / Codex / ChatGPT 協作的開發流程

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

## 目前功能

- 首頁：標題＋兩張入口卡片（複習區 / 測驗區）
- `/review`：複習區骨架（尚未串資料）
- `/quiz`：測驗區骨架（尚未串資料）
- 範例資料：8 個單字、1 份 4 題小測驗
- 文件骨架：roadmap、產品規格、資料 schema、AI 協作流程、任務分流

## 下一步

依 `PROJECT_ROADMAP.md` 推進：

1. P2 單字複習：載入 `vocabulary.json`，做出單字卡 UI（圖片 / 例句 / 發音）
2. P3 基礎測驗：以 `quizzes.json` 跑完整選擇題流程＋計分
3. P4 題型擴充：Listening / Matching / Fill-blank
4. P5 模擬考：完整題組與時間限制

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
