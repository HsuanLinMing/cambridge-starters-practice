# Claude Code 回報 · P3-9-C：RW3 字母重組版第一版

任務日期：2026-05-13
任務性質：**Schema 最小擴充 + 資料補欄位 + UI 條件渲染 + 文件**——RW3 spelling 題型加 optional `letterScramble?: string`，UI 顯示打散字母提示但**不參與比對 / 不做拖曳 / 不做點選組字**。本輪由 GPT 開規格 / Claude 實作；上輪「RW3 缺字提示版第一版」已通過 Codex 驗收。硬邊界全遵守：未碰 OpenAI / TTS / 音檔；未呼叫 OpenAI API / 未重產音檔；未新增 audio / 圖片；未下載官方素材 / 未使用官方題目；**未新增題目**（4 題 q-sp-001~004 完整保留只補欄位）；未改 Listening 行為（仍 OpenAI v2 + transcript 隱藏）；未改 L3 audio / options（仍 3 張 A/B/C）；未改 RW1 yes/no UI；未改 spelling `answer`；**未移除 `spellingHint`**（保留並先於 letterScramble 顯示）；未做 fuzzy matching；未做拖曳字母 / 點選字母組字；未做 Speaking Agent / 錄音 / STT；未部署；未動後端 / DB / 登入；未處理 npm audit；未 commit API key / `.env` / `.env.local`。

## 【本輪修改摘要】

`lib/types.ts` `SpellingQuestion` 加 optional `letterScramble?: string` 欄位（含完整 docstring 標 P3-9-C 第三刀後續、2026-05-13 新增、用途範例 `p p a l e` / `t a c` / `g d o` / `o b k o`、**只用於 UI 顯示提示、絕不參與 `answer` 比對、`isCorrect` 不讀此欄位、`normalize` 完全不變、第一版不做拖曳 / 點選組字互動**、字串內容自由 / 建議空格分隔每個字母提升小一可讀性、可與 `spellingHint` 並存於同一題）；`BaseQuestion` / `QuestionType` / `ExamQuestion` 完全不動——optional 欄位只擴 `SpellingQuestion` 不影響其他題型；既有 `spellingHint` 欄位 / docstring 完全不動。`components/QuizPlay.tsx` `<SpellingView>` 在既有 spellingHint 區塊**之後**、輸入框**之前**加條件渲染區塊：`{question.letterScramble && (...)}` → 淡紫 `bg-violet-50` 提示區（與 spellingHint 區塊 `bg-sky-50` 視覺區別「缺字 vs 重組」兩種不同形式的視覺輔助）+ 小標籤「字母重組」（`text-xs font-semibold tracking-wider text-violet-600` 同 spellingHint 標籤樣式但配色 violet 系）+ 大字 scramble 字串（`font-mono text-3xl/4xl font-black tracking-[0.4em]` 與 spellingHint 完全同樣式，提升並排兩個區塊時的一致性）；既有 spellingHint 區塊保留並先顯示——一題可同時顯示「缺字提示」+「字母重組」兩種視覺輔助；`isCorrect` / `normalize` / `formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` / `getStarterPartInfo` / `RW_TYPE_ORDER` / 結果頁 `<QuestionDetailCard>` / Listening / RW1 yes/no UI / L3 圖卡完全不動。`data/p3-example-questions.json` 4 題 q-sp-001~004 皆補 `letterScramble`：apple → `"p p a l e"`、cat → `"t a c"`、dog → `"g d o"`、book → `"o b k o"`；其他欄位（含既有 spellingHint / image / prompt / answer / explanation / source / topic / promptVersion / RW3 metadata）全保留；未新增題目 / 圖片 / 音檔；`exam-papers.example.json` questionIds / sourceMix / description 全部不動（題目數仍 13 題、`ai_generated: 9` + `custom: 4`）。文件 4 份同步：`docs/DATA_SCHEMA.md` spelling 段 jsonc 範例補 `letterScramble` 欄位 + 要點段補完整說明（optional / UI only / 不參與 isCorrect / 第一版不做拖曳組字 / 可與 spellingHint 並存）+ UI 渲染段補淡紫區塊描述；`docs/STARTERS_PART_TEMPLATES.md` 升 v2.8：RW3 模板未來功能清單把「字母重組版」標 ✅ + schema 對應表 spelling 條目補「字母重組版已第一版落地」+ 加 1 條未來 ⬜「字母重組互動進階（拖曳 / 點選組字 / 觸控友善）」；`README.md` `/quiz` q-sp 段補「淡紫字母重組區塊 + 4 題 scramble 字串」描述；`PROJECT_ROADMAP.md` P3-9-C「⬜ 未來 RW3 字母重組版」改 ✅「RW3 字母重組版第一版」含完整本輪修改清單 + 新增 1 條 ⬜「未來 RW3 字母重組互動進階」+ 既有「未來 RW3 review 區獨立練習模式」/「未來 RW3 看答案 / 再試一次按鈕」⬜ 保留，P3-9-C 從 25 條 ✅ 升為 26 條 ✅。`npm run lint` / `typecheck` / `build` 全綠 + dev smoke 全綠。**P3-9-C 仍 🟡，P3 仍 🟡——未把任何整體階段標完成**。

## 【修改檔案清單】

新增 0 份；修改 6 份；未動圖片 / 音檔 / 既有 UI 邏輯 / 既有題目資料：

- `lib/types.ts`：`SpellingQuestion` 加 optional `letterScramble?: string` 欄位（含完整 docstring 說明）；既有 `spellingHint?: string` 欄位 / docstring / `BaseQuestion` / `QuestionType` / `ExamQuestion` 完全不動。
- `components/QuizPlay.tsx`：`<SpellingView>` 在 spellingHint 區塊之後 / 輸入框之前加 `{question.letterScramble && (...)}` 條件渲染——淡紫 `bg-violet-50` 提示區（小標籤「字母重組」+ violet-600 配色 + font-mono text-3xl/4xl font-black tracking-[0.4em] 大字間距）；既有 spellingHint 區塊 / `<SpellingView>` 本體其他結構 / 輸入框 / 提示行完全保留；`isCorrect` / `normalize` / 其他 view / hook / type 全不動。
- `data/p3-example-questions.json`：4 題 q-sp-001~004 各加 1 行 `letterScramble` 欄位（`"p p a l e"` / `"t a c"` / `"g d o"` / `"o b k o"`）；既有 spellingHint / 其他欄位 / 其他 9 題完全不動。
- `docs/DATA_SCHEMA.md`：spelling 段 jsonc 範例補 `letterScramble` entry + 要點段補完整說明（optional 標籤、UI only、不參與 isCorrect、第一版不做拖曳 / 點選組字、4 題已補狀態、字串格式建議、可與 spellingHint 並存）+ UI 渲染段補「淡紫提示區塊」描述；其他段落不動。
- `docs/STARTERS_PART_TEMPLATES.md`：(a) schema 對應表第一層 `spelling` 條目補「字母重組版已第一版落地（2026-05-13）」；(b) RW3 模板「未來需要補哪些功能」清單把「字母重組版」標 ✅ 2026-05-13 第一版完成；(c) 版本段加 v2.8（2026-05-13，P3-9-C 第三刀後續 RW3 字母重組版第一版）。
- `README.md`：`/quiz` 條目 q-sp-001~004 描述補「2026-05-13 補字母重組版第一版」+「淡紫字母重組區塊（標籤「字母重組」+ font-mono 大字間距：`p p a l e` / `t a c` / `g d o` / `o b k o`）」+「兩種 UI 視覺輔助皆**僅 UI 提示、不參與 `isCorrect`、第一版不做拖曳 / 點選組字**」描述；其他敘述不動。
- `PROJECT_ROADMAP.md`：P3-9-C「⬜ 未來 RW3 字母重組版（屬正式 RW3 第二種變體）」改 ✅「RW3 字母重組版第一版（P3-9-C 第三刀後續，2026-05-13）」含完整本輪修改清單；新增 1 條 ⬜「未來 RW3 字母重組互動進階（拖曳字母塊 / 點選字母組字 / 觸控友善）」；既有「未來 RW3 review 區獨立練習模式」/「未來 RW3 看答案 / 再試一次按鈕」⬜ 保留；P3-9-C 從 25 條 ✅ 升為 26 條 ✅。

未動：`lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx`（`RW_TYPE_ORDER` 不變）/ 任何 `app/review/*` / `app/page.tsx` / 其他 components / `data/exam-papers.example.json`（questionIds / sourceMix / description 全保留、13 題不變）/ `data/vocabulary.json` / `data/quizzes.json` / `public/images/`（11 個自製 SVG 全保留）/ `public/audio/`（OpenAI v2 + v1 + macOS say 三版皆保留）/ `docs/PRODUCT_SPEC.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 依賴。**Listening 行為完全未動**：q-lc-001 仍 OpenAI v2 audioSrc / 仍 3 選項 A/B/C / transcript 仍隱藏；**RW1 yes/no UI 完全未動**：`<TrueFalseView>` / `<YesNoButton>` / formatYesNoDisplay 全保留 / q-tf-001 + q-tf-002 不動；**spelling answer 完全未動**：4 題 q-sp-001~004 的 `answer`（apple / cat / dog / book）逐字保留、normalize 比對行為一致；**spellingHint 完全保留**：4 題 q-sp-001~004 的 spellingHint（`a _ _ l e` / `c _ t` / `d _ g` / `b _ _ k`）逐字保留、UI 區塊先於 letterScramble 顯示。

## 【核心邏輯說明】

整條鏈與 v2.7（spellingHint）完全同款：

1. **Schema 層**（`lib/types.ts`）：`SpellingQuestion` extends `BaseQuestion`，再加 optional `letterScramble?: string`（與既有 `spellingHint?: string` 並列）；TypeScript 對 union narrow / exhaustive 檢查不受影響；既有 4 題若沒填 `letterScramble` 不會 break、新題仍可不填。**型別系統強制保證 4 個 RW3 題已補欄位仍符合 SpellingQuestion**。
2. **資料層**（`data/p3-example-questions.json`）：4 題 q-sp-001~004 各加 1 行 `letterScramble` 字串、保留 spellingHint；JSON parse 後 spelling 物件多 1 個 string 欄位，符合新型別。
3. **UI 渲染層**（`<SpellingView>`）：條件式 `{question.letterScramble && <scramble-block>}` —— letterScramble 存在時 render 淡紫提示區、缺值時跳過該區塊（純舊行為）。Scramble 區塊放在既有 spellingHint 區塊之後 / `<input>` 之前，視覺流程「圖 → 提示語 → 缺字提示（若有）→ 字母重組（若有）→ 輸入框 → 比對提示」自然引導從「簡單提示」往「進階提示」遞進。CSS 設計：
   - `bg-violet-50` 與 spellingHint 區塊 `bg-sky-50` 視覺區別（缺字 = sky 系 / 重組 = violet 系），對小一視覺區辨「兩個提示是不同的東西」
   - 與圖片區 `bg-amber-50` / 輸入框 `border-amber-200` 也明顯區別 → 不會混淆「答案 vs 提示」
   - `font-mono text-3xl sm:text-4xl font-black tracking-[0.4em]` 與 spellingHint 完全同字型樣式 → 兩個區塊並排時視覺一致、字寬等寬
4. **比對層**（`isCorrect`）：**完全不變**——`question.type === "spelling"` 仍走 `normalize(answer) === normalize(question.answer)`；`spellingHint` 與 `letterScramble` 都不參與比對：
   - `apple` / `Apple` / `APPLE` / `"  apple  "` 答對（normalize 一致）
   - `cat` / `Cat` / `CAT` 答對；`dog` / `Dog` / `DOG` 答對；`book` / `Book` / `BOOK` 答對
   - `aple` / `kat` / `dawg` / `buk` 答錯（不做 fuzzy matching、hint 與 scramble 都不參與）
   - 空字串 → `isAnswered` 擋 → 未作答狀態
5. **結果頁層**：`<QuestionDetailCard>` / `formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` 對 spelling 走 default 路徑——直接顯示 raw user answer / question.answer / question.prompt + 中文 explanation；**不顯示 spellingHint / letterScramble**（避免結果頁混淆「答案 vs 提示」，與上輪設計一致）。
6. **a11y**：scramble 區塊未加 aria-label / role（純視覺輔助、screen reader 仍依 `<input>` 的 `aria-label="看圖拼字輸入框"` 朗讀）；scramble 字串對 screen reader 可朗讀「p p a l e」屬合理朗讀。
7. **localStorage session 一致性**：`sessionId` 由 paperId + questionOrder hash；本輪 questionOrder 與題目順序 / id / type 全不變（只多 1 個 optional 欄位）→ hash 不變 → 既有使用者作答進度可正常恢復 / 不需 invalidate。**對使用者影響**：之前的測驗進度繼續有效；新功能完全 backwards-compatible（與上輪 spellingHint 一致）。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues；optional 欄位不影響 lint rules）
- `npx tsc --noEmit`（typecheck）：✅ 全綠（discriminated union narrow 完整、optional `letterScramble?: string` 不影響其他題型 case 的 exhaustive 檢查；4 題既有資料補欄位後仍符合 `SpellingQuestion[]`）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變）
- dev smoke（`npm run dev` + curl）：
  - 8 條路由 200：`/` / `/quiz` / `/review` / `/review/words` / `/review/picture` / `/review/letter/a` / `/review/word/apple` / `/review/word/banana`
  - `/quiz` SSR HTML：4 個 letterScramble 字串各出現 1 次（`p p a l e` / `t a c` / `g d o` / `o b k o`）→ 4 題 scramble 完整載入 RSC payload
  - `/quiz` SSR HTML：4 個 spellingHint 字串各出現 1 次（`a _ _ l e` / `c _ t` / `d _ g` / `b _ _ k`）→ 既有 hint 完整保留
  - `/quiz` SSR HTML：13 題 id 全部仍出現（q-lc-001 × 4 / 其他 12 題各 × 1）→ 13 題完整載入
  - `/quiz` SSR HTML：`q-lc-001-openai-v2.mp3` 出現 2 次 → Listening 仍 OpenAI v2
  - `/quiz` SSR HTML：3 個 `aria-label="選項 A/B/C"` + grep `選項 D` = 0 → L3 仍 3 張 A/B/C 圖卡
  - `/quiz` SSR HTML：transcript「What does the boy want」出現 2 次（RSC payload only：transcript + ttsScript 兩 field 同字串）→ 考試中隱藏 transcript 行為仍正常
  - `/quiz` SSR HTML：「It is a cat」（q-tf-001 RW1 yes）+「It is a dog」（q-tf-002 RW1 no）各 1 次 → RW1 yes/no 未受影響
  - dev log 無 error / hydration warn

## 【手動檢查結果】

dev server 已停。以下需使用者實機在瀏覽器試玩確認最終視覺；Claude 能透過 SSR HTML 驗證的部分標 ✅（curl）：

| 檢查項 | 預期 | Claude 透過 curl 能驗證的部分 |
|---|---|---|
| `/quiz` 第 1 題 Listening 仍使用 OpenAI v2 | `<audio src=...openai-v2.mp3>` | ✅ HTML 含 `q-lc-001-openai-v2.mp3` × 2 |
| L3 options 仍是 A/B/C 三張圖卡 | 3 張圖 + A/B/C + 無 D | ✅ 3 個 `aria-label="選項 A/B/C"`、grep `選項 D` = 0 |
| RW1 yes/no 題仍正常 | q-tf-001 / q-tf-002 prompt + Yes/No 按鈕 | ✅ HTML 含「It is a cat」+「It is a dog」 |
| RW3 spelling 四題仍存在 | 4 題 q-sp-001~004 連續排在第 6-9 題 | ✅ 4 個 q-sp-XXX id 全部在 RSC payload |
| RW3 spelling 題仍顯示缺字提示 | 4 題各仍 render 淡藍 spellingHint 區 | ✅ 4 個 spellingHint 字串都仍在 RSC payload + `<SpellingView>` 既有條件渲染保留 |
| RW3 spelling 題新增顯示字母重組 | 4 題各 render 淡紫 letterScramble 區 | ✅ 4 個 letterScramble 字串都在 RSC payload + `<SpellingView>` 新條件渲染已實作 → **需使用者實機點到第 6-9 題確認視覺** |
| q-sp-001 顯示 p p a l e | scramble 字串 `p p a l e` | ✅ grep `p p a l e` × 1 |
| q-sp-002 顯示 t a c | scramble 字串 `t a c` | ✅ grep `t a c` × 1 |
| q-sp-003 顯示 g d o | scramble 字串 `g d o` | ✅ grep `g d o` × 1 |
| q-sp-004 顯示 o b k o | scramble 字串 `o b k o` | ✅ grep `o b k o` × 1 |
| 輸入完整正確單字仍答對 | apple / cat / dog / book + 各種大小寫 + 前後空白 | ✅ `isCorrect` spelling case 不變（normalize 比對），hint / scramble 都不參與 |
| 錯拼仍答錯 | aple / kat / dawg / buk 等 | ✅ 不做 fuzzy matching、hint / scramble 都不參與 |
| 結果頁詳解正常 | 4 題 spelling 各自顯示題目 / 你的答案 / 正確答案 / 中文 explanation | ✅ 結果頁 helper 全保留、未動；hint / scramble 在結果頁刻意不顯示避免混淆 → **需使用者實機交卷後確認視覺** |
| review 路由正常 | 8 條 review 系列 200 | ✅ 全 200 |

## 【仍未處理】

- 字母重組互動進階：拖曳字母塊 / 點選字母組字 / 觸控友善 → ⬜ 留 P3-9-C 後續（任務單明示第一版只顯示打散字母）
- review 區獨立拼字練習模式（不交卷的拼字練習）→ ⬜ 留 P2-4C-2B-2 範圍
- 「看答案」/「再試一次」按鈕（與 retry mode 整合）→ ⬜ 留 P3-9-C 後續
- 嚴格 spelling must be correct 開關 / 寬鬆模式切換（目前已是嚴格比對）→ ⬜ 留未來
- 結果頁是否顯示 spellingHint / letterScramble：本輪沿用上輪設計，刻意不顯示避免混淆「答案 vs 提示」；若使用者實機回饋希望結果頁也看到 hint / scramble 可下輪再加（屬視覺微調）
- 更多 RW3 題目 / 更精準官方 RW3 兩變體模板 → ⬜ 持續補件
- 未來多題 L3 圖片題庫 / 更完整 L3 Part 3 題型模板 → ⬜ 留 P3-9-C 後續

## 【風險點】

- **回歸風險：低**——optional 欄位 + 條件渲染、零既有邏輯變動；若某題沒填 `letterScramble`（如未來新題）UI 自動跳過 scramble 區塊回到舊行為；既有 spellingHint 行為與 v2.7 一致；lint / typecheck / build 全綠 + dev smoke 4 scramble 字串 + 4 hint 字串 + 13 題 id + Listening / L3 / RW1 全部驗證未動。
- **兩個提示區塊視覺擁擠風險：低**——spellingHint（sky-50）+ letterScramble（violet-50）並排時都佔約 80px 高度，加圖（aspect-square 約 280-360px）+ 提示語 + 輸入框，整題卡總高度約 700-800px（手機）；對小一適合但需要捲動看完整題。**仍需使用者實機觀察**：若家長覺得題卡過長 / 兩區塊重疊或擁擠，可下輪改成單一複合區塊或加 collapse 機制。
- **a11y 風險：低**——scramble 字串對 screen reader 可朗讀（純文字 inline content）；輸入框 aria-label 不變；條件渲染不影響 focus 順序；兩個提示區塊使用語義化標籤而非純樣式。
- **localStorage session 失效風險：無**——questionOrder / id / type 全不變、hash 不變；既有使用者作答進度繼續有效（與 v2.7 一致）。
- **scramble 視覺強度 vs 答案外洩風險：低 - 中**——scramble 字串列出所有字母（不論順序）→ 視覺上比 spellingHint 更接近「答案露字較多」；如孩子先看 spellingHint「a _ _ l e」再看 scramble「p p a l e」，幾乎可直接推測拼字。**屬設計使然**：兩種提示分別對應「位置感」與「字母組成」不同學習目標；若家長覺得對某些孩子太簡單，可在 data 層拿掉 spellingHint 或 letterScramble 其中一個（一題仍可只有一種提示）。
- **比對行為 fuzzy 風險：無**——`isCorrect` 完全不變、`normalize` 完全不變、hint / scramble 都不參與 → 嚴格 spelling must be correct 精神維持。
- **JSON 大小 / 載入風險：可忽略**——4 個短字串增量極小（單題 + ~10 字元、4 題共 + ~40 字元）；對 RSC payload 影響可忽略。

## 【後續建議】

依使用者意向擇一（皆屬未來範圍、本輪硬邊界不做）：

1. **字母重組互動進階**（屬正式 RW3 第二變體完整實作）：把 letterScramble 字串拆成可拖曳 / 可點選的字母塊；孩子按順序拖曳 / 點選字母組字、自動驗證；需要新元件 + 觸控事件處理；屬中等規模新功能。
2. **「看答案 / 再試一次」按鈕**（屬 P3-9-C 後續）：與 retry mode 結合，spelling 題答錯後可按「再試一次」清空 input、答對後按「看答案」進下一題；零後端、純 React state。
3. **review 區獨立拼字練習模式**（屬 P2-4C-2B-2）：把 spelling 邏輯抽 hook 給 `/review/word/[id]` 加「拼字練習」tab；可擴展到全部 54 個 vocabulary 條目；零交卷 / 零分數。
4. **更多 RW3 主題題目**（最低成本路徑）：補 red / blue / one / two / mother / father / banana 等用既有 SVG 的題目；每題加對應 spellingHint + letterScramble；零新圖、零新邏輯。
5. **提示視覺微調**（純視覺）：若使用者實機覺得兩個提示區塊太占空間、太顯眼，可下輪加 collapse 或合併成一個複合區塊；或依 metadata 決定顯示哪一種（避免兩個提示同時顯示太洩答案）。

**短期建議**：先讓使用者實機跑完整 13 題（特別是第 6-9 題 4 連發 RW3 spelling）觀察兩種提示同時顯示的視覺強度 + 試各種輸入（正確 / 大小寫 / 錯拼 / 空白）+ 交卷看結果頁詳解 + 確認 RW1 / L3 / Listening / review 都未受影響，再決定下一刀方向。**Codex 完整驗收建議重點**：(1) 條件渲染 `{question.letterScramble && ...}` 對舊資料（缺欄位）行為一致；(2) spellingHint + letterScramble 同時顯示的視覺強度（緊湊度 / 配色對比 / a11y）；(3) hint / scramble 都不參與 `isCorrect`（spelling case 比對行為與 v2.7 一致）；(4) localStorage session backwards-compat；(5) UI 區塊先後順序合理（spellingHint 先 / letterScramble 後）。

## 【Roadmap 同步檢查】

- ✅ RW3 字母重組版第一版（P3-9-C 第三刀後續，2026-05-13）—— 本輪完成
- ✅ RW3 缺字提示版第一版（2026-05-12 完成）
- ✅ RW3 多題拼字題庫第一版（2026-05-10 完成）
- ✅ RW3 看圖拼字輸入第一版（更早輪完成）
- ⬜ 未來 RW3 字母重組互動進階（拖曳字母塊 / 點選字母組字 / 觸控友善）
- ⬜ 未來 RW3 review 區獨立練習模式（不交卷的拼字練習，屬 P2-4C-2B-2）
- ⬜ 未來 RW3 看答案 / 再試一次按鈕（與 retry mode 整合）
- ⬜ 未來更精準對齊正式 Starters RW3 格式（嚴格 spelling 開關 / 寬鬆模式切換）
- ✅ L3 q-lc-001 已調整為 3 選項 A/B/C
- ✅ L3 q-lc-001 三張圖卡完整顯示
- ⬜ 未來多題 L3 圖片題庫
- ⬜ 未來更完整 L3 Part 3 題型模板
- 🟡 P2-4C-2B-1 整體：「已完成 + 持續補件中」（11 個 SVG）
- 🟡 P2-4C-2B-2 整體：仍部分進行中（vocabulary 音檔仍 ⬜；listening 音檔已落地）
- 🟡 P3-9-C 整體：仍部分進行中——**未把整體標完成**（從 25 條 ✅ 升為 26 條 ✅）
- 🟡 P3 整體：仍部分進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪是 RW3 字母重組版第一版，**只做顯示打散字母提示**——未做拖曳、未做點選組字、未處理 OpenAI / TTS / Listening / Speaking、未新增題目；硬邊界遵守。
