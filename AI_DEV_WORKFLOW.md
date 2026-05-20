# AI Dev Workflow

本檔定義本專案的 AI 協作規範。所有人 / Agent 在動工前先讀過這份文件。

> 自 2026-05-20 起，本專案改採**風險分級協作模式**：由 ChatGPT 判斷任務風險（低 / 中 / 高），再依風險決定交給 Claude Code 或 Codex。**不再固定**「Claude 實作 → Codex 驗收」單一流程。

## 三個角色分工

| 角色 | 主要用途 |
| --- | --- |
| **ChatGPT** | 規格討論、優先順序、**風險判斷（低 / 中 / 高）**、決定分派對象、產出任務單、收斂回報、決定下一步、維護 Roadmap 方向。出口是「想清楚 + 分派清楚」。 |
| **Claude Code（CLI 優先）** | **低風險任務主力**：文件更新、README / Roadmap / AppStrings 等文字整理、低風險 UI 文案、不涉及相機 / 權限 / iOS lifecycle / ML Kit / 效能 / package / build 的小型 widget 修改、文件一致性修正。**不再預設為所有程式實作者**。 |
| **Codex（CLI 或桌面版）** | **高風險工程主力 / debug 主力 / 驗收主力**：高風險功能實作、bug 診斷與修正、iOS / Android build 問題、camera / ML Kit / 權限 / 效能 / package 導入、`flutter analyze` / `test` / `build`、emulator / 實機 smoke、git diff 檢查；可作為中風險任務的輕量驗收。 |

原則：

- **想清楚 + 判風險 → ChatGPT**
- **低風險文件 / 小修 → Claude Code**
- **高風險工程 / debug / 驗收 → Codex**

## 任務風險分級

ChatGPT 在派工前先把任務歸到下列三級之一，**Claude / Codex 接到任務時也要再自我核對一次風險**：

### 低風險

涵蓋：

- 文件更新（`README.md` / `PROJECT_ROADMAP.md` / `docs/*.md` / `AI_DEV_WORKFLOW.md` 等）
- 文案 / AppStrings / 多語系前置字串整理
- 小型 UI 文案調整、不影響核心流程的小修
- Roadmap 狀態收尾（在規則允許範圍內）

處理方式：

- **Claude Code 處理**，Claude 自查即可
- 通常不需要 Codex 重型驗收

### 中風險

涵蓋：

- 一般功能、非核心 UI flow
- 小型 widget
- 不涉及平台 / 權限 / 相機 / ML Kit / 效能的功能調整

處理方式：

- **Claude Code 實作**
- **Codex 視情況輕量驗收**（不一定開 emulator / 實機）

### 高風險

涵蓋：

- iOS / Android 相關
- camera / camera preview / camera lifecycle
- ML Kit、bbox mapping、座標轉換
- 權限 / 相簿保存 / 檔案儲存
- 效能 / 卡頓 / ANR / lifecycle
- build / test 失敗、package 導入
- 需要實機確認的核心功能

處理方式：

- **Codex 直接實作或診斷 + 自測**
- 使用者實機補驗
- **Claude 不作為主要實作者**

> 若任務原本判低 / 中風險，動工後發現實際風險明顯升級（例如修改範圍失控、混入 build / 平台層問題），應立刻停止當前 agent，將任務改派 Codex；同時請 ChatGPT 重新評估與切分。

## 工具使用規則

### Claude Code

- **CLI 優先**。低風險文件 / 小修任務直接給 CLI，不要在桌面版用拖拉檔案的方式做大型修改。
- 動工前先確認任務符合「低風險」描述；若任務出現高風險特徵（相機 / 權限 / build / lifecycle / ML Kit / 效能 / package），**先停下回報 ChatGPT 重新分派**，不要硬接。
- 完成後請用本檔下方的「回報格式」回覆；**Claude 不自行 commit / push**。
- 若連續多次修不到問題、或 ChatGPT 判斷 Claude 回報內容不可信，應停止讓 Claude 繼續修改該任務，改交 Codex。

### Codex

- 可用 CLI 或桌面版。
- 適合：
  - 高風險功能實作（camera / ML Kit / 權限 / 效能 / build / lifecycle / package）
  - 已經有錯誤訊息 / stack trace，要找線索並修正
  - 對單一檔案做獨立 review
  - 驗收 Claude 寫好的修改（中風險時的輕量驗收 / 高風險時的完整驗收）
  - `npm run lint` / `typecheck` / `build` / `runbook:check`，或未來 Flutter 專案的 `flutter analyze` / `test` / `build`
- **Codex 不自行 commit / push**，除非使用者明確要求。
- Codex 直接實作並自測通過時，可同步更新 `PROJECT_ROADMAP.md` 對應條目狀態；驗收若僅「部分通過」或「未通過」，只能在回報中提出 Roadmap 狀態建議，不得自行標記完成。

### ChatGPT

- 不直接動程式碼。
- 負責**風險判斷**與**分派決定**：每個任務都要先標出風險、決定交給 Claude 或 Codex，再產出任務單。
- 收斂 Claude / Codex 的回報，決定下一步（驗收、修正、commit / push）。
- 維護 `PROJECT_ROADMAP.md` 方向；實際翻牌動作依下方「Roadmap 狀態規則」。

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
- **Claude 完成功能或文件修改後，最多只能建議「待驗收」**——在回報的「Roadmap 同步檢查」欄位明確指出：
  - 哪一條建議從 ⬜ → 待驗收（不是直接 ✅）
  - 是否有新發現需要插入新項目
- **Codex 驗收通過後，才可把對應項目改成「已完成」（✅）**。
- **若任務由 Codex 直接實作並自測通過**，Codex 可同步更新 `PROJECT_ROADMAP.md` 對應條目狀態。
- **Codex 若驗收部分通過或不通過**，不應改成已完成，只能提出 Roadmap 狀態建議。
- 高風險任務即使 Codex 自測通過，也可能需要使用者實機補驗後才 commit / push。
- 由 ChatGPT 收斂方向；Claude 不主動改 Roadmap 檔案除非被明確指派為文件更新任務。

## Commit / Push 規則

- **所有 commit / push 由使用者決定**，除非使用者明確要求 AI 代為操作。
- Claude Code **不自行** commit / push。
- Codex **不自行** commit / push（高風險自測通過後仍交回使用者實機補驗）。
- 不得 commit 下列檔案（即使被指派為文件更新也一樣）：
  - `.env.local`
  - `*.generated.json`
  - `.claude/settings.local.json`

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
