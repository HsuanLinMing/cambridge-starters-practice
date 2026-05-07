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

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
