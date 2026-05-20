# Agents

本檔是給所有 AI Agent（Claude Code、Codex、ChatGPT）的入口指引。**動工前先讀完規則文件，不要憑直覺操作。**

## 必讀文件

| 主題 | 文件 |
| --- | --- |
| AI 協作規範（總綱） | [`AI_DEV_WORKFLOW.md`](./AI_DEV_WORKFLOW.md) |
| 任務分流規則 | [`docs/TASK_ROUTER.md`](./docs/TASK_ROUTER.md) |
| Codex 驗收手冊 | [`docs/CODEX_VALIDATION_RUNBOOK.md`](./docs/CODEX_VALIDATION_RUNBOOK.md) |
| 產品規格與 MVP 邊界 | [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) |
| 資料格式 | [`docs/DATA_SCHEMA.md`](./docs/DATA_SCHEMA.md) |
| 開發路線圖 | [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md) |

文件有衝突時，以 `AI_DEV_WORKFLOW.md` 為準。

## AI 協作分工（2026-05-20 起）

本專案採**風險分級協作模式**，不再固定「Claude 實作 / Codex 驗收」作為唯一預設流程。每個任務先判斷低 / 中 / 高風險，再決定交付對象。

- **ChatGPT**：需求討論、風險判斷、分派 Claude Code / Codex、整理回報、判斷下一步。
- **Claude Code**：低風險文件 / 文案 / 小修主力；中風險任務可依任務單處理，但若發現高風險特徵應停止並回報。
- **Codex**：高風險工程、debug、build / test / smoke、驗收主力；可直接處理高風險任務並自測。

Claude Code / Codex 都不自行 commit / push，除非使用者明確要求。

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
