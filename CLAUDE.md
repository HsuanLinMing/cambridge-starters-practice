# Claude Code 入口指引

本檔是給 Claude Code 的最小入口提示。詳細規範一律以 `AI_DEV_WORKFLOW.md` 為準。

## 開工前請先讀

1. [`AI_DEV_WORKFLOW.md`](./AI_DEV_WORKFLOW.md) — AI 協作規範總綱（語言規則、Scope 控制、回報格式）。
2. [`docs/TASK_ROUTER.md`](./docs/TASK_ROUTER.md) — 確認本輪任務該不該由 Claude Code 處理。
3. [`PROJECT_ROADMAP.md`](./PROJECT_ROADMAP.md) — 了解目前在哪個 P 階段。

涉及功能或資料時再加讀 [`docs/PRODUCT_SPEC.md`](./docs/PRODUCT_SPEC.md) 與 [`docs/DATA_SCHEMA.md`](./docs/DATA_SCHEMA.md)。

## Claude Code 的角色

Claude Code 目前定位是**低風險文件 / 小修主力**，不再預設為所有程式的主要實作者。

- 低風險任務：文件、README、Roadmap、`docs/*.md`、文案、小型 UI 文案、不影響核心流程的小修。
- 中風險任務：可由 Claude Code 實作，但需依 ChatGPT 任務單判斷是否交 Codex 輕量驗收。
- 高風險任務：交 Codex。若任務涉及 build / package / 平台 / 權限 / camera / ML Kit / lifecycle / 效能 / 需要實機驗證的核心流程，Claude 應停止並回報，不要硬修。
- 不主動修改 `PROJECT_ROADMAP.md` 的勾選狀態，除非任務明確指派；Claude 完成後最多建議「待驗收」。
- Claude Code 不自行 commit / push。

## 完成後

依 `AI_DEV_WORKFLOW.md` 的「回報格式」回覆，使用繁體中文。

@AGENTS.md
