# Task Router

決定一個任務該交給誰。配合 `AI_DEV_WORKFLOW.md` 的「任務風險分級」一起看。

> 自 2026-05-20 起，本專案改採**風險分級派工**：先由 ChatGPT 判斷任務風險（低 / 中 / 高），再決定交給 Claude Code 或 Codex；**不再固定**「Claude 實作 → Codex 驗收」單一流程。

---

## 路由總覽

| 風險 | 主要實作者 | 驗收 | 典型任務 |
| --- | --- | --- | --- |
| **低風險** | Claude Code | Claude 自查；通常不需要 Codex 重型驗收 | 文件、README / Roadmap、文案、AppStrings、小型 UI 文案、不影響核心流程的小修 |
| **中風險** | Claude Code | Codex 視情況輕量驗收（不一定開 emulator / 實機） | 一般功能、非核心 UI flow、小型 widget、不涉及平台 / 權限 / 相機 / ML Kit / 效能的功能調整 |
| **高風險** | Codex 直接實作 / 診斷 / 自測 | Codex 自測 + 使用者實機補驗 | iOS / Android、camera / camera lifecycle、ML Kit / bbox / 座標、權限 / 相簿 / 檔案、效能 / 卡頓 / lifecycle、build / test 失敗、package 導入、需要實機確認的核心功能 |

> 風險定義詳見 `AI_DEV_WORKFLOW.md` 的「任務風險分級」一節。

---

## 什麼任務交給 Claude Code（低風險為主、中風險可接）

主軸：**低風險文件 / 文案 / 小修**。

- 文件更新：`README.md`、`PROJECT_ROADMAP.md`、`docs/*.md`、`AI_DEV_WORKFLOW.md`
- 文案 / AppStrings / 多語系前置字串整理
- 低風險 UI 文案、小型 widget、不影響核心流程的小修
- Roadmap 狀態收尾（在規則允許範圍內，最多到「待驗收」）
- 文件一致性修正
- 中風險任務可由 Claude 實作，後續視情況由 Codex 輕量驗收

特徵：**有具體輸入、有可驗證的完成條件，且未涉及平台 / 相機 / 權限 / build / lifecycle / ML Kit / 效能 / package**。

---

## 什麼任務交給 Codex（高風險主力 + 驗收）

主軸：**高風險工程 + debug + 驗收**。

- 高風險功能實作：camera / camera preview / camera lifecycle、ML Kit、bbox mapping、座標轉換、權限、相簿、檔案儲存、效能 / 卡頓 / ANR / lifecycle、package 導入
- bug 診斷與修正、iOS / Android build 問題
- `npm run lint` / `typecheck` / `build` / `runbook:check`、未來 Flutter 專案的 `flutter analyze` / `test` / `build`
- emulator / 實機 smoke
- git diff 檢查
- 對單一檔案做 code review、比較兩種寫法的取捨
- 中風險任務的輕量驗收
- 高風險任務的完整驗收

Codex 高風險任務可直接實作並自測，但仍**不自行 commit / push**。

---

## 何時應改派 Codex 接手

下列情境出現時，應停止 Claude 繼續處理該任務，重新分派給 Codex：

- 舊任務混入（任務範圍與原任務單偏離）
- 多次修不到問題（連續嘗試 ≥ 2 次仍未解決）
- 回報內容不可信（描述與實際 diff 對不上）
- 修改範圍失控（超出任務單明示的 scope）
- 任務實際風險高於原本預估（例如低風險文件任務動工後發現需要改 camera lifecycle）

流程：

1. ChatGPT 重新評估風險並切分任務。
2. 必要時請 Codex **先給診斷與假設**（不直接改檔），再交回 Codex 或 Claude 動手。
3. 動手者完成後依各自回報格式回報；必要時再交 Codex 驗收。

---

## 什麼任務交給 ChatGPT（不在 CLI 內）

- 規格討論、Roadmap 取捨
- **風險判斷（低 / 中 / 高）與任務分派決定**
- UX / 互動流程的腦力激盪
- 把使用者需求翻譯成 Claude / Codex 看得懂的任務單
- 收斂多輪修改後的「下一步」（驗收 / 修正 / commit / push 由使用者決定）

ChatGPT 不直接動程式碼。它的產出是**清楚的任務單 + 明確的風險標示**。

---

## 任務交付的最小資訊

不論交給誰，任務單至少包含：

- 目標（一句話）
- **風險等級（低 / 中 / 高）與理由**
- 範圍（要做什麼 / 不要做什麼）
- 完成條件（怎麼算做完）
- 要改 / 不要改 的檔案
- 期望的回報格式（Claude / Codex 各依本專案標準格式）
