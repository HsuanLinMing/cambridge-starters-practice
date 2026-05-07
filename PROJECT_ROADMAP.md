# Project Roadmap

階段以 P 為單位，由淺入深。✅ 表示已完成、🟡 進行中、⬜ 未開始。

---

## P1 基礎架構（🟡 進行中）

- ✅ Next.js + TypeScript + Tailwind 初始化
- ✅ 資料夾結構：`app/`、`components/`、`data/`、`lib/`、`public/{images,audio}`、`docs/`
- ✅ 首頁 + 兩個入口（複習區 / 測驗區）
- ✅ 範例 `vocabulary.json` 與 `quizzes.json`
- ✅ 已建立 `lib/data.ts` 基礎資料載入 helper（type-safe 匯出 `vocabulary` / `quizzes`，供 P2、P3 串接使用）
- ✅ 文件骨架（README、AI_DEV_WORKFLOW、ROADMAP、PRODUCT_SPEC、DATA_SCHEMA、TASK_ROUTER）
- ✅ `npm run lint` / `typecheck` / `build` 全綠
- ✅ AI workflow 文件規範補齊（語言規則、Codex 驗收前置閱讀）
- ✅ Codex 驗收手冊建立（`docs/CODEX_VALIDATION_RUNBOOK.md`）
- ✅ AGENTS.md / CLAUDE.md 規則指向整理
- ⬜ 加入 `.editorconfig`（可選）
- ⬜ 加入簡單的 GitHub repo / 遠端（可選）

## P2 單字複習（⬜ 未開始）

> 註：`lib/data.ts` 的型別安全載入 helper 已於 P1 完成。P2 重點是**頁面串接與互動 UI**，不再重做 helper 本身。

- ⬜ `/review` 串接 `lib/data.ts` 的 `vocabulary`，實作分類與單字卡顯示
- ⬜ 複習區：以分類（colors / animals / food …）切 tab
- ⬜ 單字卡 UI：圖片 + 英文 + 中文 + 例句
- ⬜ 發音播放（HTMLAudioElement，靜態 mp3）
- ⬜ 「翻牌」式互動：先看圖猜，再翻看答案
- ⬜ 真實圖片與發音檔（先 placeholder，再分批補上）

## P3 基礎測驗（⬜ 未開始）

- ⬜ `quizzes.json` 載入並渲染選擇題
- ⬜ 一題一頁的流程：作答 → 即時對錯 → 下一題
- ⬜ 結算頁：分數、答錯題目回顧
- ⬜ 至少一份 10–15 題的小測驗

## P4 題型擴充（⬜ 未開始）

- ⬜ Listening：播音檔 → 選正確單字 / 圖片
- ⬜ Matching：左右兩列拖曳或點選配對
- ⬜ Fill-in-the-blank：句子缺空單字
- ⬜ 題型 schema 統一進 `lib/types.ts`

## P5 模擬考（⬜ 未開始）

- ⬜ 完整 Cambridge Starters 題組（Listening + Reading & Writing）
- ⬜ 計時器
- ⬜ 一次作答完再批改
- ⬜ 結果可儲存（先 localStorage，之後再考慮後端）

---

## 變更紀錄

- 2026-05-07：初版建立。
- 2026-05-07：P1 收尾——`lint` / `typecheck` / `build` 全綠；補齊 AI workflow 語言規範與 Codex 驗收前置閱讀；新增 `docs/CODEX_VALIDATION_RUNBOOK.md`；整理 `AGENTS.md` / `CLAUDE.md` 為短指向。
- 2026-05-07：Codex 驗收後文件小修——將 runbook 第 6 節改為驗收導向 9 段格式；README 文件索引補上 runbook 與 `reports/`；P1 補記 `lib/data.ts` helper 已完成、P2 對應條目改寫為「`/review` 串接」精準描述，避免把 P2 功能誤標為完成。
