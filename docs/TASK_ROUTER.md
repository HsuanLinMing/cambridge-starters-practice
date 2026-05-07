# Task Router

決定一個任務該交給誰。配合 `AI_DEV_WORKFLOW.md` 一起看。

---

## 什麼任務交給 Claude Code

主軸：**動手寫 / 改 / 跑**。

- 新增頁面、元件、路由
- 改造既有元件、抽 hook、調整 Tailwind 樣式
- 新增 / 修改 `data/*.json`、`lib/types.ts`
- 接 `vocabulary.json` / `quizzes.json` 到頁面
- 跑 `npm run lint`、`typecheck`、`dev`、`build`，並修復出錯
- 寫 / 改測試（未來導入測試框架後）
- 修明確的 bug：有錯誤訊息或重現步驟
- 撰寫 / 更新文件骨架（README / docs/*）

特徵：**有具體輸入、有可驗證的完成條件**。

---

## 什麼任務交給 Codex

主軸：**第二意見 / 局部排查**。

- 對單一檔案做 code review（「這支元件設計合理嗎？」）
- 已有 stack trace，要快速猜可能原因
- 想對 Claude 寫好的程式做交叉檢查
- 比較兩種寫法的差異與取捨
- 解釋一段不熟的程式（library 的 internal）

特徵：**問題範圍小、想要另一個視角**。

---

## 什麼任務先 Codex 排查、再 Claude 修正

當問題滿足以下任一條件時，先讓 Codex 找出方向，再交給 Claude 動手：

- 報錯訊息很長 / stack trace 跨多個檔案
- Claude 連續嘗試 ≥ 2 次仍未解決同一個 bug
- 涉及 build / Next.js 設定 / TypeScript 較深的型別錯誤
- 涉及第三方套件版本相容性

流程：

1. 把錯誤訊息 + 相關檔案路徑丟給 Codex，請它**只給診斷與假設**，不要直接改檔。
2. 把 Codex 的診斷整理成 1–3 句話的方向 + 具體要改的檔案 / 行號。
3. 把這份「修改指令」交給 Claude Code 執行。
4. Claude 完成後依「回報格式」回報；必要時再回 Codex 驗收。

---

## 什麼任務交給 ChatGPT（不在 CLI 內）

- 規格討論、roadmap 取捨
- UX / 互動流程的腦力激盪
- 把使用者需求翻譯成 Claude / Codex 看得懂的任務描述
- 收斂多輪修改後的「下一步」

ChatGPT 不直接動程式碼。它的產出是**清楚的任務單**。

---

## 任務交付的最小資訊

不論交給誰，至少包含：

- 目標（一句話）
- 範圍（要做什麼 / 不要做什麼）
- 完成條件（怎麼算做完）
- 要改 / 不要改 的檔案
- 期望的回報格式（Claude 用本專案標準格式）
