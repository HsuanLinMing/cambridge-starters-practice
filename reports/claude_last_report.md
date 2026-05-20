# Codex 回報 · AI 協作分工文件殘留修正

## 【本輪修改摘要】

本輪依 2026-05-20 新版風險分級協作模式，修正仍停留在「Claude 主要實作 / Codex 驗收」舊敘述的入口文件。同步補強 `CLAUDE.md`、`AGENTS.md` 與 `docs/CODEX_VALIDATION_RUNBOOK.md` 的角色描述，並保留歷史紀錄中的舊字樣作為過去任務背景。

## 【修改檔案清單】

- `CLAUDE.md`
- `AGENTS.md`
- `docs/CODEX_VALIDATION_RUNBOOK.md`
- `reports/claude_last_report.md`

## 【舊分工殘留檢查】

搜尋關鍵字 / 模式：

- `Claude.*實作`
- `實作.*Claude`
- `Codex.*驗收`
- `驗收.*Codex`
- `主要負責實作`
- `Codex.*第二意見`
- `Claude.*Codex`
- `Claude.*→.*Codex`
- `固定.*Claude`
- `Codex 只`
- `改檔交給 Claude`
- `先 Codex 排查、再 Claude 修正`

發現並修正：

- `CLAUDE.md`：原本寫「主要負責實作」與「不負責驗收，交由 Codex」，已改為 Claude Code 低風險文件 / 小修主力，中風險視任務單，高風險停止並回報交 Codex。
- `AGENTS.md`：原本只有必讀文件，缺新版角色摘要；已補 ChatGPT / Claude Code / Codex 三方風險分級分工。
- `docs/CODEX_VALIDATION_RUNBOOK.md`：原本回報格式段落仍說 Codex「不是動手實作」，排查段落仍說「改檔交給 Claude Code」；已改成驗收 / 排查任務適用該格式，高風險 debug / 工程任務可由 Codex 直接修正並自測。
- `reports/claude_last_report.md`：上一份報告明確指出 `CLAUDE.md` / `AGENTS.md` 尚未修，已用本輪 Codex 回報覆蓋。

判斷可保留的歷史 / 合理字樣：

- `AI_DEV_WORKFLOW.md` / `docs/TASK_ROUTER.md` 中「不再固定 Claude 實作 → Codex 驗收」是新版規則說明，不是舊流程殘留。
- `docs/TASK_ROUTER.md` 中「中風險任務可由 Claude 實作，後續視情況由 Codex 輕量驗收」符合新版分級。
- `docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md` 中正式題庫 preview / write 前需要 Codex 驗收，是 P3-10 source-first pipeline 的安全 gate，不是通用固定 Claude → Codex 流程。
- `PROJECT_ROADMAP.md` 的過往變更紀錄保留歷史語境，未改功能階段狀態。

## 【新分工同步內容】

`CLAUDE.md`：

- 明確寫 Claude Code 是低風險文件 / 小修主力。
- 明確寫 Claude Code 不再是所有程式主要實作者。
- 補低 / 中 / 高風險處理方式。
- 補 build / package / 平台 / 權限 / camera / ML Kit / lifecycle / 效能 / 實機核心流程等高風險特徵時停止並回報。
- 補 Claude Code 不自行 commit / push。

`AGENTS.md`：

- 補 ChatGPT：需求討論、風險判斷、分派、整理回報、判斷下一步。
- 補 Claude Code：低風險文件 / 文案 / 小修主力，中風險依任務單，高風險停止回報。
- 補 Codex：高風險工程、debug、build / test / smoke、驗收主力。
- 明確不再固定 Claude 實作 / Codex 驗收。
- 明確 Claude Code / Codex 都不自行 commit / push。

`docs/CODEX_VALIDATION_RUNBOOK.md`：

- 將 Codex 回報格式限定為「驗收 / 排查任務」適用。
- 補 Codex 直接實作高風險工程或 debug 修正時，依任務單回報修改檔案、測試結果與風險。
- 將排查速查末段改為依任務單判斷：只診斷時不改檔；若 Codex 是高風險 debug / 工程主力，可直接修正並自測。

## 【測試結果】

- `npm run lint`：通過。
- `npm run typecheck`：通過。
- `npm run build`：通過，Next.js build 成功，static pages 仍為 88。
- `npm run runbook:check`：通過，overall PASS。

## 【Roadmap 狀態檢查】

- 沒有修改 `PROJECT_ROADMAP.md` 的任何功能階段狀態。
- 沒有把任何未完成功能標成完成。
- 本輪只是 AI 協作分工文件一致性修正。
- P3-10 / P3 / P4 / P5 狀態沒有被本輪誤改。

## 【仍未處理】

- 無本輪必修項目。
- 歷史紀錄中的舊字樣仍保留作為過去任務脈絡；目前判斷不影響新版規則。

## 【風險點】

- 工作樹中既有 `.claude/settings.local.json` 仍顯示 modified；本輪未修改、未 stage，但 commit 前仍需確認不要納入。
- 專案內歷史紀錄很長，未來搜尋「Claude 實作 / Codex 驗收」仍會命中歷史段落；判讀時需區分「現在規則」與「過去紀錄」。

## 【後續建議】

- 後續任務單可固定加一行「風險等級：低 / 中 / 高」，避免 agent 自行套舊流程。
- 若未來再新增 agent 入口文件，請直接引用 `AI_DEV_WORKFLOW.md` 與 `docs/TASK_ROUTER.md`，不要重新手寫一份容易漂移的角色分工。

