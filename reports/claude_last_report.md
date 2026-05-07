# Claude Code 回報 · P1 Codex 驗收後文件小修

任務日期：2026-05-07
任務性質：依 Codex「有條件通過」回饋做最小文件修補，**不進入 P2、不動程式碼**。

## 【本輪修改摘要】

依 Codex 驗收回饋做三處文件小修：
1. `docs/CODEX_VALIDATION_RUNBOOK.md` 第 6 節改寫為驗收導向 9 段格式（取代原本沿用 Claude 的修改回報格式）。
2. `README.md` 文件索引與資料夾結構補上 `docs/CODEX_VALIDATION_RUNBOOK.md` 與 `reports/`。
3. `PROJECT_ROADMAP.md` 在 P1 補記 `lib/data.ts` helper 已完成、把 P2 對應條目改寫為精準的「`/review` 串接」描述，避免把 P2 功能誤標為完成。

`npm run lint` / `typecheck` / `build` 三項全綠。

## 【修改檔案清單】

- `docs/CODEX_VALIDATION_RUNBOOK.md`（修改第 6 節）
- `README.md`（資料夾結構、文件索引兩處小修）
- `PROJECT_ROADMAP.md`（P1 補一條、P2 改寫一條、變更紀錄補一筆）
- `reports/claude_last_report.md`（重寫，本回報檔）

未動：`AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md`、`docs/PRODUCT_SPEC.md`、`docs/DATA_SCHEMA.md`、`AGENTS.md`、`CLAUDE.md`、`app/`、`components/`、`lib/`、`data/`、`public/`、`package.json`。

## 【核心邏輯說明】

### 1. Runbook 第 6 節（驗收導向 9 段）

從原本「Codex 沿用 Claude Code 修改回報格式」改為**獨立的驗收 9 段**：

```
本輪驗收摘要 / 驗收檔案清單 / 檢查了哪些流程 /
發現的問題 / 風險點 / 建議的最小修補點 /
測試結果 / 最後結論 / 後續建議 / Roadmap 同步檢查
```

關鍵設計：

- 用「驗收檔案清單」「檢查了哪些流程」取代 Claude 那邊的「修改檔案清單」「核心邏輯說明」，明確點出 Codex 工作是「看」不是「改」。
- 新增【最後結論】單獨一段，必須三選一明寫：`驗收通過` / `有條件通過` / `未通過`。本輪 Codex 給的「有條件通過」就是這一格的範例。
- 同節補上「Codex 驗收的幾條鐵律」：通常不修改檔案、修補點寫在【建議的最小修補點】、不直接更新 roadmap、回報用繁體中文。
- 補一張對照表「與 Claude Code 回報格式的差異」，讓兩種格式一眼可分。

### 2. README 索引補完

- 資料夾結構區塊新增 `reports/` 一行，註解寫「Claude / Codex 回報檔案輸出位置」。
- 文件索引補兩條：`docs/CODEX_VALIDATION_RUNBOOK.md` 與 `reports/`，後者明示範例 `reports/claude_last_report.md`。
- 其餘段落原樣保留，避免大幅重寫。

### 3. Roadmap 精修

問題：原 P2 第一條「`lib/data.ts` 載入 vocabulary 並 export 型別安全的清單」其實在 P1 已完成（`lib/data.ts` 內 export `vocabulary` / `quizzes`），保留會誘導下一輪 Claude 把 P2 當成已完成。

調整：

- P1 已完成項目新增一行：「已建立 `lib/data.ts` 基礎資料載入 helper（type-safe 匯出 `vocabulary` / `quizzes`，供 P2、P3 串接使用）」。
- P2 章節最前頭加一段註：「`lib/data.ts` 的型別安全載入 helper 已於 P1 完成。P2 重點是**頁面串接與互動 UI**，不再重做 helper 本身。」
- P2 原第一條重寫為「`/review` 串接 `lib/data.ts` 的 `vocabulary`，實作分類與單字卡顯示」，狀態保持 ⬜（因為 `/review` 實際 UI 仍未開始）。
- 變更紀錄追加一筆 2026-05-07 條目，描述本輪三項修改。

## 【新增了哪些能力】

- Codex 驗收回報自此有獨立、明確的 9 段格式，跟 Claude 的修改回報不會再混用。
- 新進 Agent 從 README 一眼看得到 Codex 驗收手冊與 reports 輸出位置，文件地圖完整。
- Roadmap 對 P1/P2 的描述更精準，避免下一輪把 P2 誤判為已開工。

## 【新增/調整測試】

無。本輪純文件改動，依任務單明確禁止導入測試框架。

## 【測試結果】

- `npm run lint` → **通過**（0 警告、0 錯誤）。
- `npm run typecheck` → **通過**（`tsc --noEmit` 無輸出，exit code 0）。
- `npm run build` → **通過**：

  ```
  ▲ Next.js 16.2.5 (Turbopack)
  ✓ Compiled successfully in 1056ms
    Running TypeScript ... Finished TypeScript in 652ms
  ✓ Generating static pages using 7 workers (6/6) in 167ms

  Route (app)
  ┌ ○ /
  ├ ○ /_not-found
  ├ ○ /quiz
  └ ○ /review
  ○  (Static)  prerendered as static content
  ```

`/`、`/review`、`/quiz` 三條路由維持靜態 prerender。`npm run dev` 純文件改動，依 runbook 第 4 節可略過，未在本輪重啟。

## 【仍未處理】

- P1 兩條可選項目：`.editorconfig`、GitHub repo / 遠端，狀態維持 ⬜（依任務單未指派）。
- `npm audit` 的 2 個 moderate 警告：依任務單禁止處理，未動。
- `AI_DEV_WORKFLOW.md` 第 40 行的「回報格式」段落仍寫「（Claude Code 完成任務後必填）」，未動；Codex 的回報格式現在以 runbook 第 6 節為準。兩處不衝突，但若日後想集中規範，可再調整（屬非本輪 scope）。
- `AGENTS.md` 與 `CLAUDE.md` 未動，內容已是上一輪整理過的短指向，本輪也不需要再加 runbook 或 reports/ 的索引（已透過 `AGENTS.md` 中既有的「必讀文件」表格與 README 涵蓋）。

## 【後續建議】

1. **請 Codex 再跑一次驗收**：依本輪改寫後的「驗收 9 段」格式，把 P1 整體（含 runbook、README、roadmap 三處新修）做一次回歸驗收，作為新格式的首次實戰使用。
2. **P2 開工前的最後一哩**：請 ChatGPT 收斂 P2 「`/review` 串接 `lib/data.ts`」這條的詳細任務單——分類切 tab 的 UX、單字卡的翻牌互動、發音播放在 `/audio/*.mp3` 不存在時的 fallback 行為。資料 helper 已備妥，下一輪 Claude Code 直接從頁面動工即可。
3. **AI_DEV_WORKFLOW.md 的 Codex 段落微調（可延後）**：第 27–33 行只列了 Codex 的「適合場景」，沒指向 runbook 第 6 節。日後若想讓任何角色從 workflow 主檔點得到 Codex 回報格式，可加一行「回報格式請見 `docs/CODEX_VALIDATION_RUNBOOK.md` 第 6 節」。本輪未動以維持最小修補。
4. **`.editorconfig`（可選）**：若希望統一空白／換行，可在 P1 收尾時順手補一份兩三行的 `.editorconfig`；不影響功能，視 ChatGPT 是否要納入本階段而定。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際翻牌：

- ✅ **P1 新增**：「已建立 `lib/data.ts` 基礎資料載入 helper」——本輪補記為已完成（事實上 P1 初版時就完成，先前 roadmap 漏記）。
- 🔁 **P2 改寫**：原 ⬜「`lib/data.ts` 載入 vocabulary 並 export 型別安全的清單」 → ⬜「`/review` 串接 `lib/data.ts` 的 `vocabulary`，實作分類與單字卡顯示」。狀態仍為 ⬜（功能尚未動工），但描述更精準。

P1 仍剩兩條可選項目（`.editorconfig`、GitHub repo / 遠端）為 ⬜，由 ChatGPT 決定是否在本階段處理。P2 / P3 / P4 / P5 其餘項目本輪皆未動，狀態維持 ⬜。

P1 階段標題仍為「🟡 進行中」；本輪未把它改為 ✅，因為 P1 仍有兩條可選項目未決。是否將 P1 結束、進 P2，請 ChatGPT 決策後在下一輪指派 Claude Code 翻牌。
