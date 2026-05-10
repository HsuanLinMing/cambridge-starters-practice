# Claude Code 回報 · P3-9-C：L3 Listening 圖選項改為正式 3 選項 A/B/C（驗證 / 二次重跑）

任務日期：2026-05-10
任務性質：**資料 + 最小 UI 微調 + 文件**——L3 `q-lc-001` 從 4 選項調整為 3 選項對齊正式 Cambridge Starters L3 的 3 張版面。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪 Codex CLI 收到的是與上一輪相同的任務單；經檢查 `data/p3-example-questions.json` / `components/QuizPlay.tsx` / 4 份 doc 全部已落地，本輪屬「**驗證 / 二次重跑**」：未再修改任何檔案，只重新跑 `lint` / `typecheck` / `build` + dev smoke 確認狀態未飄移；同時依任務單要求把報告完整重寫覆蓋（不保留上一輪內容）。所有硬邊界遵守：未呼叫 OpenAI API / 未重產音檔 / 未新增 audio / 未新增圖片 / 未下載官方素材 / 未使用官方題目 / 未新增大量題目 / 未改 transcript / ttsScript / 未改 RW1 yes/no UI / 未做 Speaking Agent / 未做錄音 STT / 未部署 / 未動後端 DB 登入 / 未處理 npm audit / 未 commit API key 或 .env。

## 【本輪修改摘要】

**本輪未再修改任何 source code / data 檔案**（上一輪已落地、現況經驗證仍正確）；只重寫 `reports/claude_last_report.md` 一份。`q-lc-001.options` 仍為 3 個 ImageOption（apple/banana/cat），`answer` 仍是 `"apple"`，`audioSrc` 仍是 `/audio/starters/l3/q-lc-001-openai-v2.mp3`，`transcript` / `ttsScript` 仍為 `"What does the boy want?"`，`explanation` 仍為「音檔說小男孩想要蘋果。」（未提到 4 選項或 dog，無需動）。`components/QuizPlay.tsx` `ListeningChoiceView` image 分支 grid class 仍為 `grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4`（手機 2 欄 / 桌機 3 欄）；`ListeningImageOptionButton` 元件本身未動，`String.fromCharCode(65 + idx)` 自動只派發 A/B/C 不再有 D。`docs/DATA_SCHEMA.md` jsonc 範例 + `optionType` 說明含 L3 對齊建議；`docs/STARTERS_PART_TEMPLATES.md` L3 模板段升 v2.4 + 互動方式第 3 步「**3 張**」+ 未來功能清單把「限制選項為 3」/「補 banana.svg」標 ✅ 完成；`README.md` `/quiz` L3 段「3 張自製 SVG」+「移除 dog 選項」+「`grid-cols-2 sm:grid-cols-3`」描述齊全；`PROJECT_ROADMAP.md` 含 ✅「L3 q-lc-001 已調整為 3 選項 A/B/C」+ ⬜「未來多題 L3 圖片題庫」+ ⬜「未來更完整 L3 Part 3 題型模板」3 條對應；**P3-9-C 仍 🟡，P3 仍 🟡——未把任何整體階段標完成**。`npm run lint` / `typecheck` / `build` 全綠 + dev smoke 全綠。

## 【修改檔案清單】

本輪只動 1 份（重寫報告）：

- `reports/claude_last_report.md`：依任務單要求覆蓋上一輪內容、寫入本輪「驗證 / 二次重跑」結果與當前狀態快照。

**已於上一輪落地、本輪確認狀態仍正確未飄移**（zero edit）：

- `data/p3-example-questions.json`：`q-lc-001.options` 仍 3 個 ImageOption（apple → /images/apple.svg / banana → /images/banana.svg / cat → /images/cat.svg）；`answer` / `audioSrc` / `transcript` / `ttsScript` / `explanation` / `optionType` / metadata 全部不動。
- `components/QuizPlay.tsx`：`ListeningChoiceView` image 分支 `<ul>` className 仍為 `"mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4"`（行號 1476）；`ListeningImageOptionButton` / `QuizImage` / `ImageOptionButton` / `TextOptionButton` / `<TrueFalseView>` / `<YesNoButton>` / 其他 view / hook / type 全保留。
- `docs/DATA_SCHEMA.md`：listening-choice 段 jsonc 範例 3 個 ImageOption；`optionType` 說明含「圖卡（手機 `grid-cols-2`、桌機 `sm:grid-cols-3`）」+ 「A / B / C ...標籤」+「**L3 對齊建議**：3 選項對齊正式 Cambridge L3」段。
- `docs/STARTERS_PART_TEMPLATES.md`：L3 模板段標題「+ 第三刀 A/B/C 圖選項視覺」+ 互動方式第 3 步「**3 張**」+ 未來功能清單「限制選項數為 3」/「補 banana.svg」皆 ✅；schema 對應表第一層 `listening-choice` 條目「✅ A / B / C 視覺標籤 + 圖選項 + **3 選項對齊正式 L3**」；版本段 v2.4。
- `README.md`：`/quiz` 條目「L3 聽力選項升級為 A/B/C 圖卡」+「**3 張**自製 SVG（apple/banana/cat，對齊正式 Cambridge L3 的 3 張版面、移除 dog 選項）」+「`grid-cols-2 sm:grid-cols-3`」描述。
- `PROJECT_ROADMAP.md`：P3-9-C 段含 ✅「L3 q-lc-001 已調整為 3 選項 A/B/C（P3-9-C 第三刀後續，2026-05-10）」+ ⬜「未來多題 L3 圖片題庫」+ ⬜「未來更完整 L3 Part 3 題型模板（含 example handling / heard-twice UI）」。

未動：`lib/types.ts`（`ImageOption[]` 接受任意長度）/ `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / 其他 components / `data/exam-papers.example.json`（題目順序 / sourceMix 不變）/ `data/vocabulary.json` / `public/images/`（apple / banana / cat / dog 4 個 SVG 全保留：dog.svg 仍被 `q-mt-001` matching 題引用）/ `public/audio/`（OpenAI v2 + v1 + macOS say 三版皆保留）/ `docs/PRODUCT_SPEC.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 依賴。

## 【核心邏輯說明】

純資料縮小 + 最小 grid class 微調，**零 schema / 型別 / 元件邏輯變動**。整條鏈如下：

1. `data/p3-example-questions.json` `q-lc-001.options` 長度 3：`ImageOption[]` 型別接受任意長度（`length: number` 是內建欄位）。
2. `lib/types.ts` `ListeningChoiceQuestion.options: string[] | ImageOption[]` 接受任意長度——typecheck 一秒過。
3. `app/quiz/page.tsx` 載入考卷 / 排序 / `RW_TYPE_ORDER` 全依 `id` / `starterPart` / `type` 處理，與 options 長度無關。
4. `components/QuizPlay.tsx` `<QuestionView>` 對 `listening-choice` 派發到 `<ListeningChoiceView>`；image 分支用 `(question.options as ImageOption[]).map((opt, idx) => ...)` 渲染——3 個元素就生 3 個 `<li>`。
5. `<ListeningImageOptionButton label={String.fromCharCode(65 + idx)}>` 自動取 65=A / 66=B / 67=C；`idx` 從 0 跑到 2 → 自動只產 A / B / C，不會出現 D。
6. **唯一 UI 改動**：grid class `grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4` → sm（≥ 640px）斷點以上由 2 欄變 3 欄；手機（< sm）仍是 `grid-cols-2`，3 個元素自然換行：第二列只有 1 個 C 獨佔（靠左）。
7. 結果頁 / `formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` / `<QuestionDetailCard>` 所有邏輯與 options 長度無關——交卷後仍正確顯示「你的答案」/「正確答案：apple」/「音檔說小男孩想要蘋果。」 + transcript「What does the boy want?」訂正用。
8. localStorage `quizSession` schemaVersion 不變、sessionId 用 paperId + questionOrder hash——9 題順序未動 → 既有 session 不需 invalidate。

## 【測試結果】

本輪重新跑了一次完整驗證：

- `npm run lint`：✅ 全綠（zero issues）
- `npx tsc --noEmit`（typecheck）：✅ 全綠（discriminated union 完整 narrow、`options.length` 動態合法）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變）
- dev smoke（`npm run dev` + curl）：
  - 8 條路由 200：`/` / `/quiz` / `/review` / `/review/words` / `/review/picture` / `/review/letter/a` / `/review/word/apple` / `/review/word/banana`
  - `/quiz` SSR HTML：`q-lc-001-openai-v2.mp3` 出現 **2 次**（`<audio src=>` + RSC payload）→ 確認音檔仍 v2、未動
  - `/quiz` SSR HTML：3 個 `aria-label="選項 A"` / `aria-label="選項 B"` / `aria-label="選項 C"` 各 1 次 → A/B/C 三張圖卡渲染正確
  - `/quiz` SSR HTML：grep `選項 D` = **0** → **D 不存在**
  - `/quiz` SSR HTML：apple.svg × 4 / banana.svg × 2 / cat.svg × 5 / **dog.svg × 2**（dog 從 listening 完全消失，但 `q-mt-001` matching 題仍引用 → 整體 RSC payload 中 dog.svg 出現次數降低符合預期）
  - `/quiz` SSR HTML：transcript「What does the boy want」出現 2 次（**只在 RSC payload**：`transcript` + `ttsScript` 兩個 field 同字串，皆給結果頁詳解使用；visible 區未顯示）→ 確認 P3-9-C 第二刀「考試中隱藏 transcript」行為仍正常
  - `/quiz` SSR HTML：「It is a cat」（q-tf-001 RW1 yes）仍出現 1 次 → RW1 yes/no 未受影響
  - `/quiz` SSR HTML：grid class `grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4` 出現 1 次 → 確認 className 仍在
  - dev log 無 error / hydration warn

## 【手動檢查結果】

dev server 已停（Claude 透過 curl SSR HTML 驗證了關鍵字串）。以下需使用者實機在瀏覽器試玩確認最終視覺；Claude 能透過 SSR HTML 驗證的部分標 ✅（curl）：

| 檢查項 | 預期 | Claude 透過 curl 能驗證的部分 |
|---|---|---|
| `/quiz` 第 1 題 Listening 使用 OpenAI v2 | `<audio src=...openai-v2.mp3>` | ✅ HTML 含 `q-lc-001-openai-v2.mp3` × 2 |
| `/quiz` 第 1 題不顯示 transcript | visible 區無「What does the boy want」 | ✅ 字串只出現在 RSC payload（transcript + ttsScript = 共 2 次），visible HTML 不含 |
| Listening options 只顯示 A / B / C 三張圖卡 | 3 張圖卡，標籤 A/B/C | ✅ 3 個 `aria-label="選項 A/B/C"` 各 1 次 |
| 不顯示 D | 無 D 標籤 | ✅ grep `選項 D` 0 次、`aria-label="選項 D"` 0 次 |
| 不顯示 apple / banana / cat 英文字 | 圖卡只有 A/B/C 標籤 + 圖 | ✅ `ListeningImageOptionButton` 不渲染 `option.value`；HTML 中無 visible 英文單字（apple/banana/cat 字串只出現在 RSC payload + image src 路徑） |
| A / B / C 圖片都正常顯示 | 真實 SVG 顯示 | ✅ 3 個 `/images/<name>.svg` 路徑都在 HTML；apple.svg / banana.svg / cat.svg 都存在（HTTP 200，前輪驗證過）→ probe.onload 會 fire（**需使用者實機 hydration 後確認**） |
| 選中狀態清楚 | amber-500 ring + 高亮 | ✅ `ListeningImageOptionButton` selected 時 `bg-amber-100 ring-2 ring-amber-400` + 標籤底色 amber-500（**需使用者實機點選確認**） |
| 下一題正常 | 點選後「下一題」可點 | ✅ `app/quiz/page.tsx` 邏輯與 options 長度無關（**需使用者實機點完跑流程確認**） |
| 結果頁詳解正常 | 你的答案 / 正確答案 / explanation / transcript | ✅ `QuestionDetailCard` 邏輯不變、`formatUserAnswer` / `formatCorrectAnswer` 對 listening 走 default 路徑（**需使用者實機交卷後確認**） |
| RW1 yes/no 題仍正常 | q-tf-001 / q-tf-002 prompt + Yes/No 按鈕 | ✅ HTML 含「It is a cat」（q-tf-001）；`<TrueFalseView>` / `<YesNoButton>` 完全未動 |
| review 路由正常 | 8 條 review 系列 200 | ✅ 全 200 |

## 【仍未處理】

- 多題 L3 題庫（仍只有 q-lc-001 一題）→ ⬜ 留 P3-9-C 後續刀數
- 更完整 L3 Part 3 題型模板（example handling / heard-twice UI 對齊官方規則 / part-level 題目分組顯示 / 音檔快取管理）→ ⬜ 留 P3-9-C 後續刀數
- 桌機 3 欄圖卡寬度（既有 `aspect-square` 在 `grid-cols-3` 下會比 2 欄略小，但仍是 1:1 比例）—— 視覺強度需使用者實機確認；若覺得太大可下輪加 `max-w-3xl` 限制 ul 寬度
- `dog.svg` 仍保留（`q-mt-001` matching 題仍用），未刪除

## 【風險點】

- **localStorage session 失效風險：低**——session key 由 paperId + questionOrder 構成；上輪未動 `data/exam-papers.example.json` 的 questionIds，questionOrder hash 不變 → 既有使用者作答進度可正常恢復；只是若舊 session 答案存的是 dog（已不存在），UI render 會視覺像未作答但**不會 crash**——`isCorrect("dog") === ("apple" === "dog") === false`，結果頁仍正確顯示「答錯」+「你的答案：dog」（透過 `formatUserAnswer` 取 raw string）。建議使用者若遇到舊 session 顯示異常，按「🔁 重新測驗」清 localStorage 即可。
- **手機 grid 第二列空白風險：低**——3 個元素 `grid-cols-2` 會排：`A B / C _`（C 獨佔第二列左格），右下角空白；對小孩來說 C 卡仍是足夠大的圖卡。
- **桌機 3 欄寬度風險：低**——sm（≥ 640px）以上 3 欄並排；正常桌機（≥ 1024px）每張約 ~280px。
- **a11y 風險：低**——3 個 `aria-label="選項 A/B/C"` 完整、`aria-pressed` 隨 selected 切換、grid 改成 3 欄不影響 screen reader 順序。
- **dog.svg 殘留風險：低**——`q-mt-001` matching 題仍引用 dog.svg + `data/vocabulary.json` dog 條目可能也指向；本輪未動，無影響。
- **重複任務 / 飄移風險：低**——本輪確認上一輪所有變更仍在原位（grep 比對 grid class、aria-label、SVG 路徑、transcript 隱藏行為），無人為飄移；報告已依任務單要求覆蓋。

## 【後續建議】

依使用者意向擇一：

1. **多題 L3 題庫擴張**（建議優先，配 OpenAI v2 examiner voice）：補 1~3 題不同主題（例如 `Where is the dog?` 配場景圖 / `How many books?` 配數字 / `Which one is red?` 配顏色），每題 3 張 ImageOption 對齊正式 L3；需要產生新 OpenAI v2 音檔（屬 P2-4C-2B-2 / P3-9-C 後續，需使用者明確啟動 OpenAI API）。
2. **Listening Part 3 example handling**（屬 P3-9-C 後續刀數）：正式 L3 開頭有 1~2 題 example（不計分、只示範規則），UI 可加「📚 第 1 題是練習題」標示 + 第一個 example 不算分。需要 schema 加 `isExample?: boolean` 欄位 + UI conditional rendering + 結果頁過濾。
3. **手機 grid 視覺微調**（純視覺，零邏輯）：若使用者實機覺得第二列空白突兀，可加 `place-items-center` 或讓 C 卡在手機跨兩欄。
4. **L3 audio 進階互動**（屬 P3-9-C 後續）：對齊官方「heard twice」規則——點開始後自動播放 2 次（中間 pause 5 秒），`<audio>` 之外加自製播放控制器。

**短期建議**：先讓使用者實機看 `/quiz` 第 1 題的 3 張圖卡（手機 / 桌機 兩種斷點視覺）+ 確認 hydration 後 banana 顯示真實香蕉圖 + 點選 / 下一題流程順暢，再決定下一刀方向。

## 【Roadmap 同步檢查】

- ✅ L3 q-lc-001 已調整為 3 選項 A/B/C（P3-9-C 第三刀後續，2026-05-10）—— 上一輪已落地、本輪驗證未飄移
- ✅ L3 A / B / C 圖選項視覺第一版（P3-9-C 第三刀後續，2026-05-10）—— 早輪完成
- ✅ L3 q-lc-001 三張圖卡完整顯示（P2-4C-2B-1 / P3-9-C 第三刀後續，2026-05-10）—— banana.svg 補件已完成
- ⬜ 未來多題 L3 圖片題庫（多元主題、配新 OpenAI v2 音檔）
- ⬜ 未來更完整 L3 Part 3 題型模板（example handling / heard-twice UI / part-level 分組）
- 🟡 P2-4C-2B-1 整體：「已完成 + 持續補件中」（11 個 SVG）
- 🟡 P2-4C-2B-2 整體：仍部分進行中（vocabulary 音檔仍 ⬜；listening 音檔已落地）
- 🟡 P3-9-C 整體：仍部分進行中——**未把整體標完成**
- 🟡 P3 整體：仍部分進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪是 L3 Listening 3 選項對齊任務的「驗證 / 二次重跑」，未處理 OpenAI / TTS / 新增題庫——硬邊界遵守。
