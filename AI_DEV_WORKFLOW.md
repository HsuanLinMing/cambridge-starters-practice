# AI Dev Workflow

本檔定義本專案的 AI 協作規範。所有人/Agent 在動工前先讀過這份文件。

## 三個角色分工

| 角色 | 主要用途 |
| --- | --- |
| **ChatGPT** | 規格討論、Roadmap 對齊、產品決策、資料設計、寫文件草稿。出口是「想清楚」。 |
| **Claude Code（CLI 優先）** | 主要的程式實作者：寫 / 改檔、跑指令、跑測試、修 bug。出口是「程式可跑」。 |
| **Codex（CLI 或桌面版）** | 補位角色：交叉檢查、第二意見、針對特定錯誤訊息排查、針對單一檔案做 review。 |

原則：

- **想清楚 → ChatGPT**
- **動手做 → Claude Code**
- **再看一次 / 排查 → Codex**

## 工具使用規則

### Claude Code

- **CLI 優先**。所有實作任務直接給 CLI，不要在桌面版用拖拉檔案的方式做大型修改。
- 大任務先用一句話講清楚目標、範圍、不做什麼，再交給 CLI。
- 完成後請用本檔下方的「回報格式」回覆。

### Codex

- 可用 CLI 或桌面版。
- 適合：
  - 已經有錯誤訊息／stack trace，要找線索
  - 想對某個檔案做獨立 review
  - 需要第二意見驗證 Claude 的修改

### ChatGPT

- 不直接動程式碼。
- 任務完成後，把 Claude 的回報貼回 ChatGPT，讓 ChatGPT 同步更新 roadmap 與下一步。

## 回報格式（Claude Code 完成任務後必填）

```
## 【本輪修改摘要】
## 【修改檔案清單】
## 【核心邏輯說明】
## 【新增了哪些能力】
## 【新增/調整測試】
## 【測試結果】
## 【仍未處理】
## 【後續建議】
## 【Roadmap 同步檢查】
```

每個區塊保持簡短，一句到三句即可。沒有就寫「無」。

## Roadmap 同步規則

- 主檔：`PROJECT_ROADMAP.md`
- 完成一個 P 階段的事項時，Claude 在回報的「Roadmap 同步檢查」欄位明確指出：
  - 哪一條從 ⬜ → ✅
  - 是否有新發現需要插入新項目
- 由 ChatGPT 收斂後實際更新 roadmap 檔案；Claude 不主動改 roadmap 檔案除非被明確指派。

## Scope 控制原則

> **不要做沒被要求的事。**

- 一輪只做一件主軸任務。多個任務拆多輪。
- 不要因為「順手」就重構不相關的程式碼。
- 不要新增當前 roadmap 不需要的依賴。
- 不要產生大量註解 / 文件，除非任務明確要求。
- 不確定要不要做的事 → 寫進「後續建議」而不是直接做。

## 語言與文件規範

本專案的語言規則拆成「文件 / UI 文案」與「程式碼識別字」兩條。

### 一律使用繁體中文

下列內容請使用繁體中文撰寫：

- `README.md`
- `PROJECT_ROADMAP.md`
- `docs/*.md`（所有產品 / 資料 / 任務文件）
- `reports/*.md`
- Claude Code 的回報
- Codex 的回報
- UI 顯示文字（畫面上看得到的字）
- 任務說明與驗收說明

如果發現有英文撰寫的舊文件，後續任務應**優先改寫為繁體中文**，不要新建另一份英文版本。

### 程式碼命名維持英文

下列識別字保持英文：

- 變數名稱
- 函式名稱
- React component 名稱
- TypeScript `type` / `interface` 名稱
- JSON 欄位名稱（key）
- 檔案 / 資料夾命名（依各語言或框架的慣例）

### 技術名稱不需要硬翻

下列技術名稱原樣保留，不要硬翻成中文：

- Next.js
- React
- TypeScript
- Tailwind CSS
- App Router
- ESLint
- Node.js / npm / pnpm
- 其他第三方套件、CLI、服務名稱

### 翻譯原則

清楚、好維護、工程師容易理解為主。**不需要文學化**。

- 中英混排時，英文與中文之間留一個半形空白（例如：「執行 npm run build」）。
- 程式碼區塊內不需要翻譯，原樣呈現。
- 錯誤訊息、log、stack trace 直接貼原文，不必翻譯。

## Codex 驗收前置閱讀

Codex 在執行任何驗收 / 排查任務之前，必須先讀過以下文件：

1. `AI_DEV_WORKFLOW.md`（本檔）
2. `docs/CODEX_VALIDATION_RUNBOOK.md`
3. `PROJECT_ROADMAP.md`
4. `README.md`
5. `docs/TASK_ROUTER.md`

視任務性質，再加讀：

- `docs/PRODUCT_SPEC.md`（涉及功能範圍 / MVP 邊界時）
- `docs/DATA_SCHEMA.md`（涉及 `data/*.json` 或 `lib/types.ts` 時）

如果 `docs/CODEX_VALIDATION_RUNBOOK.md` 尚未存在，Codex 必須在回報中明確標註：

> 目前尚未找到 `docs/CODEX_VALIDATION_RUNBOOK.md`。

並先依 `AI_DEV_WORKFLOW.md` 與 `docs/TASK_ROUTER.md` 執行驗收，不要跳過驗收，也不要自行擴張 scope 補寫這份手冊。

## 環境慣例

- 套件管理：`npm`（除非未來改 `pnpm`，到時再更新本檔）
- Node：依 `.nvmrc` 或專案根目錄當下版本（目前以本機 Node 23+ 為準）
- 測試指令：尚未導入測試框架。導入時更新本節。
