# Claude Code 回報 · P3-9-C Codex 驗收後 Low issue 小修

任務日期：2026-05-12
任務性質：**Codex 驗收後 Low issue 小修——文件 / 註解同步**。Codex 已恢復運作，已對 P3-9-C「RW3 多題拼字題庫第一版」（2026-05-10 完成）進行完整驗收，**結論：有條件通過**——核心功能、資料一致性、型別 / UI 覆蓋、`lint` / `typecheck` / `build`、瀏覽器 smoke test 全綠，僅留 2 個 Low issue 屬文件 / 註解描述與實際資料不同步。本輪只修這 2 個 Low issue，**未動任何功能 / 邏輯 / schema / 題目 / UI / 圖片 / 音檔**。所有硬邊界全遵守：未碰 OpenAI / TTS / 音檔；未新增題目 / 圖片 / audio；未下載官方素材 / 未使用官方題目；未改 schema / 型別 / UI 邏輯 / `RW_TYPE_ORDER` 實際數值；未改 Listening / RW1 yes/no / RW3 spelling 行為；未做 Speaking Agent / 錄音 / STT；未部署；未動後端 / DB / 登入；未處理 npm audit；未 commit API key / `.env` / `.env.local`。

## 【本輪修改摘要】

**Low issue #1**（`README.md` 題數文字過時）：`/quiz` 段落「9 題對應為 q-lc-001 → L3 聽音選圖 ...」更正為「**13 題對應為** q-lc-001 → L3 聽音選圖 ...」。同段落後續描述本已涵蓋 q-tf-001 / q-tf-002 / q-sp-001 ~ q-sp-004，僅前置數字未隨資料擴張同步；本輪只動「9」→「13」三個字元，後文不動。題目組成與 `data/exam-papers.example.json` `sourceMix` 比對一致：**1 題 Listening（q-lc-001）+ 12 題 Reading & Writing**（q-mc-001 / q-pc-001 / q-tf-001 / q-tf-002 / q-wc-001 / q-sp-001 / q-sp-002 / q-sp-003 / q-sp-004 / q-fb-001 / q-fb-002 / q-mt-001）= 13 題；`sourceMix` 為 `ai_generated: 9` + `custom: 4` = 13 題。

**Low issue #2**（`app/quiz/page.tsx` 排序註解過時）：`sortQuestionsForStarters` 函式上方 JSDoc 註解仍保留舊版 R&W 題型序列「`picture-choice → word-choice → multiple-choice → fill-blank → matching`」，缺 `true-false` / `spelling`；更正為「`picture-choice → true-false → word-choice → spelling → multiple-choice → fill-blank → matching`」對齊實際 `RW_TYPE_ORDER` 0-7 序號與本檔頂部 `RW_TYPE_ORDER` 上方註解一致。**未動 `RW_TYPE_ORDER` 實際數值**（已是 8 個正確值 0-7：listening-choice 0 / picture-choice 1 / true-false 2 / word-choice 3 / spelling 4 / multiple-choice 5 / fill-blank 6 / matching 7）+ **未動 `sortQuestionsForStarters` 函式邏輯**（沿用 stable sort filter + sort）。

兩處修正均為**純文件 / 註解描述同步**，零功能 / 邏輯 / 資料變動。`npm run lint` / `typecheck` / `build` 全綠。**P3-9-C 仍 🟡，P3 仍 🟡——未把任何整體階段標完成**；roadmap 不需新增 ✅ 條目（屬上一輪 ✅ 條目的描述補丁）。

## 【修改檔案清單】

新增 0 份；修改 3 份；未動任何 source code 邏輯 / 資料 / schema / UI / 圖片 / 音檔：

- `README.md`：`/quiz` 條目單一字元修正「9 題對應為」→「13 題對應為」（同段「8 題型最小渲染」、`sourceMix` 描述、q-tf / q-sp 系列描述本已正確、未動）。
- `app/quiz/page.tsx`：`sortQuestionsForStarters` 函式上方 JSDoc 註解 Section 2 序列補 `true-false` 與 `spelling`（從 5 個 type 補為 7 個 type，順序對齊 `RW_TYPE_ORDER` 1-7）；`RW_TYPE_ORDER` 物件本身 / `sortQuestionsForStarters` 函式邏輯 / 其他 imports / metadata 全部不動。
- `reports/claude_last_report.md`：依任務單要求覆蓋上一輪內容，寫入本輪 Codex 驗收後小修回報。

未動：`lib/types.ts`（`SpellingQuestion` / `QuestionType` union / `ExamQuestion` 全保留）/ `lib/data.ts` / `lib/examSessionStorage.ts` / `components/QuizPlay.tsx`（`<SpellingView>` / `<ListeningChoiceView>` / `<TrueFalseView>` / `isCorrect` / `normalize` / `getStarterPartInfo` / `RW_TYPE_ORDER` 等全保留）/ 任何 `app/review/*` / `app/page.tsx` / 其他 components / `data/p3-example-questions.json`（13 題全保留：q-lc-001 + q-mc-001 + q-pc-001 + q-tf-001 + q-tf-002 + q-wc-001 + q-sp-001~004 + q-fb-001 + q-fb-002 + q-mt-001）/ `data/exam-papers.example.json`（questionIds / sourceMix / description 全保留）/ `data/vocabulary.json` / `data/quizzes.json` / `public/images/`（11 個自製 SVG 全保留）/ `public/audio/`（OpenAI v2 + v1 + macOS say 三版皆保留）/ `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `PROJECT_ROADMAP.md`（本輪屬上一輪 ✅「RW3 多題拼字題庫第一版」條目的文件補丁、無需再加 ✅ 或 ⬜）/ `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 依賴。**Listening 行為完全未動**：q-lc-001 仍 OpenAI v2 audioSrc / 仍 3 選項 A/B/C / transcript 仍隱藏；**RW1 yes/no UI 完全未動**：`<TrueFalseView>` / `<YesNoButton>` / formatYesNoDisplay 全保留 / q-tf-001 + q-tf-002 不動；**RW3 spelling 行為完全未動**：`<SpellingView>` / `isCorrect` / `normalize` / 4 題 q-sp-001~004 全保留。

## 【核心邏輯說明】

**零邏輯變動**——本輪兩處修正皆為文件 / 註解描述補丁，與運行時行為脫鉤：

1. **README.md「9 題」→「13 題」**：純使用者 / 開發者文件描述；不影響任何程式碼路徑。題目實際數量由 `data/exam-papers.example.json` `sections[].questionIds` 決定（已是 13 題）+ `sourceMix.ai_generated + sourceMix.custom` 校驗（9 + 4 = 13）；前輪「RW3 多題拼字題庫第一版」資料 / sourceMix 已升級為 13 題、唯獨 README 這個前置數字未隨改、Codex 驗收抓出此 drift。修正後 README 描述與資料一致。
2. **`app/quiz/page.tsx` `sortQuestionsForStarters` JSDoc 註解**：純 JSDoc 文字，TypeScript / Next.js 編譯時剝離；不影響 runtime。`RW_TYPE_ORDER` 物件實際 0-7 序號（`Record<QuestionType, number>` 型別、exhaustive 強約束）一直正確，typecheck 已驗證；只是函式上方的「人類可讀說明」沒同步更新。修正後註解描述與 `RW_TYPE_ORDER` 對齊、與本檔頂部 `RW_TYPE_ORDER` 上方註解（line 10-13，已是正確 7 個 type 順序）描述一致。

整條鏈完全不變：`/quiz` SSR → `p3ExamplePapers[0]` → `sections.flatMap(questionIds)` → map `questionsById` → `sortQuestionsForStarters` → listening 先、R&W 按 `RW_TYPE_ORDER` 升序 stable sort → 渲染順序 q-lc-001 / q-pc-001 / q-tf-001 / q-tf-002 / q-wc-001 / q-sp-001 / q-sp-002 / q-sp-003 / q-sp-004 / q-mc-001 / q-fb-001 / q-fb-002 / q-mt-001（共 13 題）。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues；ESLint 不檢查 JSDoc 註解內容）
- `npx tsc --noEmit`（typecheck）：✅ 全綠（純註解 / 文件變動、零型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變；Next.js Turbopack 編譯時剝離 JSDoc 註解）
- dev smoke：未跑——本輪兩處修正皆為文件 / 註解，運行時行為完全與前輪一致；前輪 dev smoke（2026-05-10）已驗證 13 題完整載入 RSC payload + Listening v2 + L3 A/B/C + RW1 yes/no + RW3 4 題 spelling + 8 條 review 路由全 200。Codex 驗收（2026-05-11~12）瀏覽器 smoke 亦已通過。

## 【手動檢查結果】

本輪修正僅影響「文件描述」與「JSDoc 註解」，**運行時行為完全不變**——使用者實機畫面 / 互動與前輪一致。Claude 透過 grep 二次確認文件已同步：

| 檢查項 | 預期 | Claude 透過 grep / build 驗證 |
|---|---|---|
| README 題數文字已更正 | `「13 題對應為」` 出現 1 次 | ✅ grep `9 題對應為` = 0；grep `13 題對應為` = 1 |
| README 後續描述本已正確 | q-tf-001 / q-tf-002 / q-sp-001~004 描述齊全 | ✅ 前輪已寫入；本輪未動 |
| `app/quiz/page.tsx` 註解已同步 | R&W 7 個 type 序列含 true-false / spelling | ✅ grep `picture-choice → true-false → word-choice → spelling` = 1 |
| `RW_TYPE_ORDER` 實際數值未變 | 8 個 type 序號 0-7 | ✅ 未動該物件；typecheck 強約束 `Record<QuestionType, number>` exhaustive 通過 |
| Listening 仍 OpenAI v2 | audioSrc 不變 | ✅ 未動 data / UI |
| RW1 yes/no 仍正常 | q-tf-001 / q-tf-002 不變 | ✅ 未動 data / UI |
| RW3 4 題 spelling 仍正常 | q-sp-001~004 不變 | ✅ 未動 data / UI |
| review 路由仍正常 | 8 條 200 | ✅ 未動 review 區、build 88 routes 全綠 |

## 【仍未處理】

依任務單範圍，本輪只修 2 個 Low issue；以下為**前輪以前已記錄、本輪未處理**的項目（屬未來範圍）：

- 未來 RW3 缺字提示版（部分字母 + 底線：例如 `c _ t` / `b _ _ k`）→ ⬜ 留 P3-9-C 後續進階形式
- 未來 RW3 review 區獨立練習模式（不交卷的拼字練習）→ ⬜ 留 P2-4C-2B-2 範圍
- 未來「看答案」/「再試一次」按鈕（與 retry mode 整合）→ ⬜ 留 P3-9-C 後續
- 未來嚴格 spelling must be correct 開關（目前已是嚴格比對；未來若有寬鬆模式需設計切換）
- 未來更多 RW3 主題題目（目前 4 題覆蓋 food / animals × 2 / school 三大類）
- 未來多題 L3 圖片題庫（仍只有 q-lc-001 一題）
- 未來更完整 L3 Part 3 題型模板（example handling / heard-twice UI / part-level 分組）
- P2-4C-2B-2 vocabulary 音檔仍 ⬜ 大批待補
- P4 Speaking Examiner Agent 仍 ⬜ 未開始

## 【風險點】

- **回歸風險：極低**——純文件 / JSDoc 註解修改、運行時零影響；lint / typecheck / build 三項全綠驗證；前輪已通過 Codex 完整驗收（瀏覽器 smoke test 包含），本輪無新動作。
- **localStorage session 失效風險：無**——前輪（2026-05-10）questionOrder 升 13 題時已導致舊 session 自動 invalidate，截至 2026-05-12 使用者若有開過 `/quiz` 應已建立新 13 題 session；本輪未動 questionOrder / paperId / schemaVersion，hash 不變、既有 session 繼續有效。
- **註解 drift 累積風險：低**——當前兩個 drift 來源皆是「資料 / 程式碼變了但文件沒同步」；建議未來每次擴張 R&W 題型或題目數時，把對應 README / JSDoc 的同步動作納入 PR checklist（屬流程改善範圍、非本輪）。
- **Codex 驗收結論落實風險：低**——Codex 驗收「有條件通過」的 2 個 Low issue 都已處理；驗收結論可升級為「通過」。

## 【後續建議】

依使用者意向擇一（皆屬未來範圍、本輪硬邊界不做）：

1. **正式對 Codex 報告本輪修補結果**：可請 Codex 重新驗收，確認 2 個 Low issue 已消解，驗收狀態從「有條件通過」升為「通過」。
2. **RW3 缺字提示版**（屬正式 RW3 進階形式）：schema 加 `spellingHint?: string` 欄位 + `<SpellingView>` 加 conditional render；零後端、純 client。
3. **RW3 review 區獨立練習模式**（屬 P2-4C-2B-2）：把 spelling 邏輯抽 hook 給 `/review/word/[id]`；可擴展到 54 個 vocabulary 條目。
4. **多題 L3 圖片題庫**（屬 P3-9-C 後續，配 OpenAI v2 examiner voice）：需要產生新自製音檔（須使用者明確啟動 OpenAI API）。
5. **PR / commit 流程小工具**：加 pre-commit hook 檢查 README / JSDoc 與 data 之間的數字一致性，避免未來再出現「9 → 13」這類 drift；屬工程體質改善。

**短期建議**：把 2 個 Low issue 修補通知 Codex、請其重新驗收確認；之後依使用者偏好決定下一刀（RW3 進階版 / L3 多題 / 其他 Part）。

## 【Roadmap 同步檢查】

- 本輪屬「上一輪 ✅『RW3 多題拼字題庫第一版』條目」的文件 / 註解 drift 修補，**未新增 ✅ 或 ⬜ 條目**——P3-9-C 仍 24 條 ✅、未動。
- ✅ RW3 多題拼字題庫第一版（前輪 2026-05-10 完成、本輪僅修補 README / JSDoc 同步問題）
- ✅ RW3 看圖拼字輸入第一版（更早輪完成）
- ⬜ 未來 RW3 缺字提示版（部分字母 + 底線）
- ⬜ 未來 RW3 review 區獨立練習模式
- ⬜ 未來更精準對齊正式 Starters RW3 格式
- ✅ L3 q-lc-001 已調整為 3 選項 A/B/C（前輪完成）
- ✅ L3 q-lc-001 三張圖卡完整顯示（前輪完成）
- ⬜ 未來多題 L3 圖片題庫
- ⬜ 未來更完整 L3 Part 3 題型模板
- 🟡 P2-4C-2B-1 整體：「已完成 + 持續補件中」（11 個 SVG）
- 🟡 P2-4C-2B-2 整體：仍部分進行中（vocabulary 音檔仍 ⬜；listening 音檔已落地）
- 🟡 P3-9-C 整體：仍部分進行中——**未把整體標完成**（仍 24 條 ✅）
- 🟡 P3 整體：仍部分進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪是 Codex 驗收後 Low issue 小修，只修 README 題數文字與 `app/quiz/page.tsx` 排序註解；不做新功能、未改題目資料 / schema / UI / Listening / RW1 / RW3 行為——硬邊界遵守。Codex 驗收「有條件通過」的 2 個 Low issue 皆已處理，狀態可升為「通過」。
