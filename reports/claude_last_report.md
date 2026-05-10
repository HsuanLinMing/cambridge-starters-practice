# Claude Code 回報 · P3-9-C：RW3 看圖拼字輸入第一版

任務日期：2026-05-10
任務性質：**Schema + 資料 + UI 元件 + 文件**——`/quiz` 新增 `spelling` 題型對齊正式 Cambridge Starters Reading & Writing Part 3「看圖拼字」核心練習形式。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪硬邊界全遵守：未碰 OpenAI / TTS / 音檔 / 重產音檔；未新增 audio / 圖片（重用既有 `apple.svg`）；未下載官方素材；未使用官方題目；未新增大量題目（只新增 1 題 q-sp-001）；未改 Listening 行為（仍 OpenAI v2 + transcript 隱藏）；未改 L3 audio / options（仍 3 張 A/B/C）；未改 RW1 yes/no UI；未做 Speaking Agent / 錄音 / STT；未部署；未動後端 / DB / 登入；未處理 npm audit；未 commit API key / `.env` / `.env.local`。

## 【本輪修改摘要】

`lib/types.ts` `QuestionType` union 加 `"spelling"` + 新增 `SpellingQuestion` discriminated union 成員（`image` / `prompt` / `answer` 必填，含完整 docstring 說明與 `word-choice` / `fill-blank` 差異）；`ExamQuestion` union 同步 extend。`components/QuizPlay.tsx` 新增 `<SpellingView>` 元件（圖大圖 `aspect-square` + `<PromptText>` 提示語 + 大型 `<input type="text">` text-3xl 文字、停 autoCapitalize / autoCorrect / autoComplete / spellCheck 避免行動裝置干擾孩子拼字）+ `isCorrect` 加 spelling case（**normalize 比對**：trim + toLowerCase 比對 → `apple` / `Apple` / `APPLE` / `"  apple  "` 答對；**不做 fuzzy matching**：`aple` 算錯，對齊「spelling must be correct」精神）+ `getStarterPartInfo` 加 (RW3, spelling) 細分覆寫顯示「Part 3：看圖拼字」+ fallback switch 加 case "spelling" + (RW3, word-choice) 細分顯示「Part 3：看圖認字（看字選圖 preview）」+ `QuestionView` switch 加 case "spelling" 派發 `<SpellingView>`；`formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` 對 spelling 走 default 路徑（直接顯示 raw 字串）；`SpellingQuestion` 已加入 imports。`app/quiz/page.tsx` `RW_TYPE_ORDER` 加 `spelling: 4`（接在 `word-choice: 3` 之後，從認字到拼字）+ `multiple-choice` / `fill-blank` / `matching` 整體 +1（5 / 6 / 7）；TS Record 完整覆蓋避免排序 NaN。`data/p3-example-questions.json` 新增 1 題 `q-sp-001`（`source: "ai_generated"` / `image: "/images/apple.svg"` 重用既有 SVG / `prompt: "Look at the picture. Write the word."` / `answer: "apple"` / `explanation: "圖片是蘋果，所以正確單字是 apple。"` / `starterPart: "RW3"` 完整 metadata / `expectedAnswerType: "text"` / `skillFocus: ["spelling", "vocabulary"]` / `promptVersion: "starters-rw3-spelling-v1"`）；位置在 q-wc-001 之後維持 RW3 連續分區。`data/exam-papers.example.json` reading-writing section.questionIds 加 `q-sp-001`（緊接 q-wc-001 之後）+ `sourceMix.ai_generated` 從 5 升 6 + description 從「7 題」改「10 題混合題型，含聽力、看字選圖、yes/no、看圖拼字」+ section description 加「看圖拼字」。文件 4 份同步：`docs/DATA_SCHEMA.md` 6 題型表加 spelling 一列 + 詳細 schema 說明段（jsonc 範例 + 6 條要點 + 與 word-choice / fill-blank 並存差異說明）+ 7 題範例 metadata 表升級為 10 題（補 q-tf-001 / q-tf-002 / q-sp-001）；`docs/STARTERS_PART_TEMPLATES.md` 升 v2.5：RW3 模板段升級為「P3-9-C 第三刀後續已實作 spelling 題型」狀態（含完整本專案練習版目標 / 互動方式 4 步 / 資料欄位 / 目前 schema 完整支援 ✅ / 未來需要補哪些功能 5 條）+ schema 對應表第一層加 spelling → RW3 🟢 一筆 + 第三層 RW3 從 ⬜ 改 ✅ 第一版；`README.md` `/quiz` 條目題型順序加 `true-false` / `spelling` + q-sp-001 描述 + 從「6 題型最小渲染」升「8 題型」；`PROJECT_ROADMAP.md` P3-9-C「⬜ RW3 拼字輸入 + 看答案 / 再試一次 / 下一題」改 ✅「RW3 看圖拼字輸入第一版」+ 新增 2 條 ⬜（多題拼字題庫 + 更精準對齊正式 Starters RW3 格式），P3-9-C 從 22 條 ✅ 升為 23 條 ✅。`npm run lint` / `typecheck` / `build` 全綠 + dev smoke 全綠。**P3-9-C 仍 🟡，P3 仍 🟡——未把任何整體階段標完成**。

## 【修改檔案清單】

新增 0 份；修改 8 份：

- `lib/types.ts`：(a) `QuestionType` union 加 `"spelling"` 字面量；(b) 新增 `SpellingQuestion` type（image / prompt / answer 必填，含完整 docstring 說明與 word-choice / fill-blank 差異）；(c) `ExamQuestion` discriminated union 加進。
- `components/QuizPlay.tsx`：(a) imports 加 `SpellingQuestion`；(b) `getStarterPartInfo()` 加 (RW3, spelling) → 「Part 3：看圖拼字」+ (RW3, word-choice) → 「Part 3：看圖認字（看字選圖 preview）」細分覆寫 + fallback switch 加 case "spelling"；(c) `isCorrect()` 加 spelling case（normalize 比對，不做 fuzzy matching）；(d) `QuestionView` switch 加 case "spelling" 派發 `<SpellingView>`；(e) 新增 `<SpellingView>` 元件——圖大圖 + `<PromptText>` 提示語 + 大型 `<input>` 輸入框（停 autoCapitalize / autoCorrect / autoComplete / spellCheck，避免行動裝置干擾）+ 提示語「大小寫與前後空白不計」。
- `app/quiz/page.tsx`：`RW_TYPE_ORDER` 加 `spelling: 4`（接在 `word-choice: 3` 之後）+ multiple-choice / fill-blank / matching 整體 +1。
- `data/p3-example-questions.json`：新增 `q-sp-001`（apple.svg 重用 / Look at the picture. Write the word. / answer apple / explanation / RW3 metadata 完整）；位置在 q-wc-001 之後 q-tf-002 之前。
- `data/exam-papers.example.json`：(a) reading-writing section.questionIds 加 `q-sp-001`（緊接 q-wc-001 之後）；(b) `sourceMix.ai_generated` 從 5 升 6；(c) paper-level description 從「7 題」改「10 題混合題型，含聽力、看字選圖、yes/no、看圖拼字」；(d) section description 加「看圖拼字」。
- `docs/DATA_SCHEMA.md`：(a) 6 題型表加 spelling 一列；(b) 新增 spelling 詳細 schema 說明段（範例 jsonc + 6 條要點 + 與 word-choice / fill-blank 並存差異）；(c) 7 題範例 metadata 表升級為 10 題（含 q-tf-001 / q-tf-002 / q-sp-001）。
- `docs/STARTERS_PART_TEMPLATES.md`：(a) RW3 模板段升級為「v2 校正 + P3-9-C 第三刀後續看圖拼字輸入第一版」+ 完整本專案練習版目標 / 互動方式 4 步 / 資料欄位 / 目前 schema 完整支援 ✅ / 未來需要補哪些功能 5 條；(b) schema 對應表第一層加 `spelling → RW3` 🟢 一筆；(c) 第三層 RW3 從 ⬜ 改 ✅ 第一版；(d) 版本段加 v2.5（2026-05-10，P3-9-C 第三刀後續 RW3 看圖拼字輸入第一版）。
- `README.md`：(a) `/quiz` 條目題型順序段把 R&W 順序從 `picture-choice → word-choice → multiple-choice → fill-blank → matching` 改為 `picture-choice → true-false → word-choice → spelling → multiple-choice → fill-blank → matching`；(b) 9 題對應段加「q-sp-001 → RW3 看圖拼字輸入」描述（含 P3-9-C 第三刀後續、apple.svg + Look at the picture. Write the word. + answer apple + normalize 比對 + 行動裝置設定）；(c) 「6 題型最小渲染」改「8 題型最小渲染」。
- `PROJECT_ROADMAP.md`：P3-9-C 「⬜ RW3 拼字輸入 + 看答案 / 再試一次 / 下一題」改 ✅「RW3 看圖拼字輸入第一版（P3-9-C 第三刀後續，2026-05-10）」（含完整本輪修改清單：types union / SpellingQuestion / SpellingView / isCorrect normalize / getStarterPartInfo / QuestionView dispatch / RW_TYPE_ORDER 4 / q-sp-001 範例 / exam-papers questionIds / sourceMix / 4 份 doc 同步）；新增 2 條 ⬜（未來 RW3 多題拼字題庫 + 未來更精準對齊正式 Starters RW3 格式：缺字提示版 / 看答案按鈕 / 與 review 區整合）。

未動：`lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `app/review/*` / `app/page.tsx` / 其他 components / `data/vocabulary.json` / `data/quizzes.json` / `public/images/`（apple.svg 重用、未產生新圖）/ `public/audio/`（OpenAI v2 + v1 + macOS say 三版皆保留）/ `docs/PRODUCT_SPEC.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 依賴。**Listening 行為完全未動**：q-lc-001 仍 OpenAI v2 audioSrc / 仍 3 選項 A/B/C / transcript 仍隱藏；**RW1 yes/no UI 完全未動**：`<TrueFalseView>` / `<YesNoButton>` / formatYesNoDisplay 全保留 / q-tf-001 + q-tf-002 不動。

## 【核心邏輯說明】

整條鏈如下：

1. **Schema 層**（`lib/types.ts`）：`QuestionType` 加 `"spelling"` 字面量 → discriminated union 自動 narrow；`SpellingQuestion = BaseQuestion & { type: "spelling"; image: string; prompt: string; answer: string }` 三必填欄位；`ExamQuestion` union 加進。`BaseQuestion.metadata` optional 欄位（`starterSection` / `starterPart` / `skillFocus` / `expectedAnswerType`）由 q-sp-001 補齊 → `getStarterPartInfo` 優先讀 metadata。
2. **資料層**（`data/p3-example-questions.json`）：q-sp-001 完整 metadata；位置在 q-wc-001（RW3 認字）之後 q-tf-002（RW1 之後）之前。但實際 R&W 段排序由 `RW_TYPE_ORDER` 決定（不是 JSON 順序）。
3. **排序層**（`app/quiz/page.tsx`）：`RW_TYPE_ORDER` `spelling: 4` → 與 `word-choice: 3` 緊接，渲染順序為 picture-choice (q-pc-001) → true-false (q-tf-001 / q-tf-002) → word-choice (q-wc-001) → **spelling (q-sp-001)** → multiple-choice (q-mc-001) → fill-blank (q-fb-001 / q-fb-002) → matching (q-mt-001)。`/quiz` 第 1 題仍是 listening (q-lc-001)；R&W 段第 1 題是 q-pc-001、第 5 題是 q-sp-001。
4. **UI 層**（`<SpellingView>`）：圖大圖（`aspect-square w-full` + `bg-amber-50` 同既有 picture-choice 的圖片區塊風格）+ `<PromptText>`（既有元件，h2 大字 amber-50 系）+ 大型 `<input>`（`text-3xl font-bold` 比 fill-blank 的 `text-2xl` 大一階對應「看圖拼字」是核心題型；`autoCapitalize="none"` / `autoCorrect="off"` / `autoComplete="off"` / `spellCheck={false}` 避免行動裝置自動修正干擾孩子拼字）+ 提示行「大小寫與前後空白不計」（家長 / 孩子預期管理）。
5. **比對層**（`isCorrect`）：spelling case 走 `normalize(answer) === normalize(question.answer)`（既有 `normalize` helper：`s.trim().toLowerCase()`）。**不做 fuzzy matching**：
   - `apple` → normalize "apple" === "apple" ✅
   - `Apple` → normalize "apple" === "apple" ✅
   - `APPLE` → normalize "apple" === "apple" ✅
   - `"  apple  "` → normalize "apple" === "apple" ✅
   - `aple` → normalize "aple" !== "apple" ❌（對齊正式 RW3 「spelling must be correct」精神，少一個字母即錯）
   - `""` → `isAnswered` 先擋（length 0 → 未作答狀態，不進 isCorrect）。
6. **結果頁層**：`formatUserAnswer` 對 spelling 走 default 路徑直接回 raw string（保留使用者實際輸入），`formatCorrectAnswer` 回 `question.answer`（"apple"），`getQuestionPromptDisplay` 走 default 回 `question.prompt`（"Look at the picture. Write the word."）作訂正用題目文字；`<QuestionDetailCard>` 自動套用既有 emerald / rose / amber 三色配色。
7. **localStorage session 一致性**：`sessionId` 由 paperId + questionOrder hash；本輪 questionOrder 從 9 題升 10 題 → hash 變化 → 既有舊 session 自動 invalidate（`isCompatibleSession` 回 false → 讀 stored 失敗 → 新 session）。**對使用者影響**：之前的測驗進度會清空、需要重做。任務單未明示需保留 session，故視為可接受副作用；未來若想 backwards-compat 可改用更寬鬆的 sessionId 策略，但屬未來範圍。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues）
- `npx tsc --noEmit`（typecheck）：✅ 全綠（discriminated union exhaustive 檢查通過：`QuestionView` switch / `getStarterPartInfo` switch / `isCorrect` 的 spelling case 全部 narrow 正確；`RW_TYPE_ORDER` 是 `Record<QuestionType, number>` 強型別，加 spelling 後仍 exhaustive）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變）
- dev smoke（`npm run dev` + curl）：
  - 8 條路由 200：`/` / `/quiz` / `/review` / `/review/words` / `/review/picture` / `/review/letter/a` / `/review/word/apple` / `/review/word/banana`
  - `/quiz` SSR HTML：`q-lc-001-openai-v2.mp3` 出現 2 次（audio src + RSC payload）→ 確認 Listening 仍 OpenAI v2、未動
  - `/quiz` SSR HTML：3 個 `aria-label="選項 A/B/C"`（L3 listening 仍 3 張 A/B/C 圖卡）+ grep `選項 D` = 0 → L3 未變動
  - `/quiz` SSR HTML：transcript「What does the boy want」出現 2 次（**只在 RSC payload**：transcript + ttsScript 兩 field 同字串，皆給結果頁詳解使用；visible 區未顯示）→ 確認 P3-9-C 第二刀「考試中隱藏 transcript」仍正常
  - `/quiz` SSR HTML：q-sp-001 出現在 RSC payload（grep `q-sp-001` × 1）+ prompt 「Look at the picture」出現 1 次 → q-sp-001 完整 metadata 已載入
  - `/quiz` SSR HTML：「spelling」字串出現 4 次（type / promptVersion suffix / skillFocus 等多處）→ 確認新型別 / 新 metadata 都在 RSC payload
  - `/quiz` SSR HTML：「starterPart\":\"RW3」出現 2 次 → q-wc-001 + q-sp-001 兩題 RW3 metadata 都已 serialize
  - `/quiz` SSR HTML：10 題 id 全部出現在 RSC payload（q-lc-001 / q-mc-001 / q-pc-001 / q-tf-001 / q-tf-002 / q-wc-001 / q-sp-001 / q-fb-001 / q-fb-002 / q-mt-001）→ 完整 paper 已載入
  - `/quiz` SSR HTML：「It is a cat」（q-tf-001 RW1 yes）+「It is a dog」（q-tf-002 RW1 no）各 1 次 → RW1 yes/no 行為未受影響
  - dev log 無 error / hydration warn

## 【手動檢查結果】

dev server 已停。以下需使用者實機在瀏覽器試玩確認最終視覺；Claude 能透過 SSR HTML 驗證的部分標 ✅（curl）：

| 檢查項 | 預期 | Claude 透過 curl 能驗證的部分 |
|---|---|---|
| `/quiz` 第 1 題 Listening 仍使用 OpenAI v2 | `<audio src=...openai-v2.mp3>` | ✅ HTML 含 `q-lc-001-openai-v2.mp3` × 2 |
| `/quiz` 第 1 題仍不顯示 transcript | visible 區無「What does the boy want」 | ✅ 字串只出現在 RSC payload（× 2，transcript + ttsScript），visible HTML 不含 |
| L3 options 仍是 A/B/C 三張圖卡 | 3 張圖 + A/B/C 標籤 + 無 D | ✅ 3 個 `aria-label="選項 A/B/C"`、grep `選項 D` = 0 |
| RW1 yes/no 題仍正常 | q-tf-001 / q-tf-002 prompt + Yes/No 按鈕 | ✅ HTML 含「It is a cat」+「It is a dog」 |
| RW3 spelling 題顯示圖片與輸入框 | q-sp-001 第 5 題 R&W：apple 大圖 + Look at the picture. Write the word. + 大型 input | ✅ q-sp-001 完整 metadata 在 RSC payload + image apple.svg + prompt 字串；`<SpellingView>` 元件已 render（typecheck 通過）→ **需使用者實機點到第 5 題（R&W 第 5 題 = 整體第 6 題：q-lc-001 → q-pc-001 → q-tf-001 → q-tf-002 → q-wc-001 → q-sp-001）確認視覺** |
| 輸入 apple 應答對 | normalize "apple" === "apple" | ✅ `isCorrect` spelling case 已實作（normalize 比對） |
| 輸入 APPLE 應答對 | normalize "apple" === "apple" | ✅ 同上 |
| 輸入前後空白的 apple 應答對 | normalize "  apple  " === "apple" | ✅ 同上 |
| 輸入 aple 應答錯 | normalize "aple" !== "apple" | ✅ 不做 fuzzy matching，`isCorrect` 回 false |
| 結果頁詳解正常 | q-sp-001 顯示題目 + 你的答案 + 正確答案 apple + explanation | ✅ `formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` 對 spelling 走 default 路徑（直接回 raw 字串 / question.answer / question.prompt） → **需使用者實機交卷後確認視覺** |
| review 路由正常 | 8 條 review 系列 200 | ✅ 全 200 |

## 【仍未處理】

- 多題 RW3 拼字題庫（仍只有 q-sp-001 一題）→ ⬜ 留 P3-9-C 後續刀數
- 缺字提示版（部分字母 + 底線：例如 `a _ _ l e`）→ ⬜ 留 P3-9-C 後續進階形式
- 「看答案」/「再試一次」按鈕（與 retry mode 整合）→ ⬜ 留 P3-9-C 後續
- 與 review 區獨立練習模式整合（不交卷的拼字練習）→ ⬜ 屬 P2-4C-2B-2 範圍
- 嚴格 spelling must be correct 開關（目前已是嚴格比對；未來若有寬鬆模式需設計切換）→ ⬜ 留未來
- 圖內仍可能露出英文字風險：apple.svg 是純圖無文字 ✅；未來補新題時須維持「圖內無英文字」慣例
- `data/quizzes.json`（P1~P2 舊 type）未動，仍是 `MultipleChoiceQuestion` only

## 【風險點】

- **localStorage session 失效風險：中**——本輪 questionOrder 從 9 題升 10 題 → sessionId hash 變化 → 既有使用者的舊 session 自動 invalidate（isCompatibleSession 回 false），重整後從第 1 題重新開始。**對使用者影響**：之前的測驗進度會清空。任務單未明示需保留，視為可接受副作用。
- **手機輸入框體驗風險：低**——已停 autoCapitalize / autoCorrect / autoComplete / spellCheck，行動裝置不會自動把首字母變大寫或推薦完整單字（這是 RW3 拼字測驗的正確設定，避免幫孩子作弊）；但孩子可能初次接觸時不習慣手動小寫，可由家長口頭引導。
- **a11y 風險：低**——`<input>` 有 `aria-label="看圖拼字輸入框"` + 提示語放外層 `<PromptText>`（h2 標籤），screen reader 可正確朗讀題目順序；focus ring 用 `ring-amber-200` 與既有 fill-blank 一致。
- **比對嚴格度風險：低**——「不做 fuzzy matching」對齊正式「spelling must be correct」精神；但若孩子打 `apple ` 含尾空白會被 trim → 算對（這是設計使然，不算錯）；若孩子打 `aple` 算錯（無部分給分），與正式考試一致。
- **q-sp-001 與 q-wc-001 答案重複（兩題 answer 都是 apple）風險：低**——q-wc-001 是「看字選圖」（題目 prompt 是英文 apple、4 圖選項選 apple 那張）；q-sp-001 是「看圖拼字」（題目圖是 apple、自由輸入 apple）。**雖然答案皆為 apple，但題型不同 → 不同訓練目標**（前者認字、後者拼字），對小一練習而言屬合理重複；未來補多題時可分散主題避免重複。
- **重複任務 / 飄移風險：低**——上一輪完成 L3 3 選項後本輪不動 L3、不動 Listening、不動 RW1，所有未動清單都實際透過 grep / dev smoke 二次驗證。

## 【後續建議】

依使用者意向擇一：

1. **多題 RW3 拼字題庫擴張**（建議優先）：補 1~3 題不同主題（例如 `book` / `cat` / `red` / `one` / `mother` 配既有 SVG），每題重用既有圖片 + 不同 answer 字串；零新圖、零新 OpenAI；屬最小 churn 高 leverage 的方向。
2. **缺字提示版**（屬正式 RW3 進階形式）：schema 加 `spellingHint?: string`（例如 `"a _ _ l e"`）；UI render 為單獨灰色字 + 紅色底線；孩子在 input 中拼完整字。
3. **看答案 / 再試一次按鈕**（屬 P3-9-C 後續）：與 retry mode 結合，spelling 題答錯後可按「再試一次」清空 input、答對後按「看答案」進下一題；零後端、純 React state。
4. **review 區獨立拼字練習模式**（屬 P2-4C-2B-2）：把 RW3 spelling 邏輯抽成 file-private helper / hook，給 `/review/word/[id]` 加「拼字練習」tab；不交卷、無分數、純練習。
5. **嚴格 vs 寬鬆比對切換**：若家長偏好「拼錯一個字母仍鼓勵」，可加 `strictSpelling: boolean` metadata + 寬鬆比對策略（例如 Levenshtein distance ≤ 1 算對）；屬未來 metadata 範圍。

**短期建議**：先讓使用者實機跑完整 10 題（特別是第 6 題 q-sp-001 spelling）+ 試各種輸入（apple / Apple / APPLE / "  apple  " / aple / 空字串）+ 交卷看結果頁詳解 + 確認 RW1 / L3 / Listening / review 都未受影響，再決定下一刀方向。

## 【Roadmap 同步檢查】

- ✅ RW3 看圖拼字輸入第一版（P3-9-C 第三刀後續，2026-05-10）—— 本輪完成
- ⬜ 未來 RW3 多題拼字題庫
- ⬜ 未來更精準對齊正式 Starters RW3 格式（缺字提示版 / 看答案按鈕 / 與 review 區整合）
- ✅ L3 q-lc-001 已調整為 3 選項 A/B/C（前輪完成，本輪驗證未飄移）
- ✅ L3 q-lc-001 三張圖卡完整顯示（前輪完成）
- ⬜ 未來多題 L3 圖片題庫
- ⬜ 未來更完整 L3 Part 3 題型模板
- 🟡 P2-4C-2B-1 整體：「已完成 + 持續補件中」（11 個 SVG）
- 🟡 P2-4C-2B-2 整體：仍部分進行中（vocabulary 音檔仍 ⬜；listening 音檔已落地）
- 🟡 P3-9-C 整體：仍部分進行中——**未把整體標完成**（從 22 條 ✅ 升為 23 條 ✅）
- 🟡 P3 整體：仍部分進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪是 RW3 看圖拼字輸入第一版，未處理 OpenAI / TTS / Listening / Speaking——硬邊界遵守。

題目總數從 9 題升 10 題（exam paper 含 1 題 listening + 9 題 R&W：q-mc-001 / q-pc-001 / q-tf-001 / q-tf-002 / q-wc-001 / **q-sp-001** / q-fb-001 / q-fb-002 / q-mt-001）。`sourceMix.ai_generated` 從 5 升 6；`sourceMix.custom` 4 不變；total 10 題。
