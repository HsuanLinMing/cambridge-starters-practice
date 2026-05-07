# Claude Code 入口指引

本檔是給 Claude Code 的最小入口提示。詳細規範一律以 `AI_DEV_WORKFLOW.md` 為準。

## 開工前請先讀

1. [`AI_DEV_WORKFLOW.md`](./AI_DEV_WORKFLOW.md) — AI 協作規範總綱（語言規則、Scope 控制、回報格式）。
2. [`docs/TASK_ROUTER.md`](./docs/TASK_ROUTER.md) — 確認本輪任務該不該由 Claude Code 處理。
3. [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md) — 了解目前在哪個 P 階段。

涉及功能或資料時再加讀 [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) 與 [`docs/DATA_SCHEMA.md`](./docs/DATA_SCHEMA.md)。

## Claude Code 的角色

- 主要負責**實作**：寫 / 改檔、跑指令、修 bug。
- 不負責驗收。如需驗收，交由 Codex 依 [`docs/CODEX_VALIDATION_RUNBOOK.md`](./docs/CODEX_VALIDATION_RUNBOOK.md) 執行。
- 不主動修改 `PROJECT_ROADMAP.md` 的勾選狀態，除非任務明確指派。

## 完成後

依 `AI_DEV_WORKFLOW.md` 的「回報格式」回覆，使用繁體中文。

@AGENTS.md
