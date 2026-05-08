# Claude Code 回報 · P3-6-A 小修：題型順序更接近正式 Starters

任務日期：2026-05-08
任務性質：P3-6-A 小修。**Codex 暫停期由 Claude 自測**；不進入 P3-6-B、不修改 JSON 資料、不做 Speaking。

## 【本輪修改摘要】

`/quiz` 題目排序與畫面段落標示調整為更接近正式 Cambridge Starters 結構：

- **題目排序**：`app/quiz/page.tsx` 新增 file-private `sortQuestionsForStarters()` helper，把 P3-1 範例 7 題依「Section 1 Listening（`listening-choice`）→ Section 2 Reading & Writing（`picture-choice` → `word-choice` → `multiple-choice` → `fill-blank` → `matching`）」重新排序。**不修改 JSON 來源**（`data/p3-example-questions.json` 與 `data/exam-papers.example.json` 一行未動）。
- **區段徽章**：`components/QuizPlay.tsx` 新增 `SECTION_LABELS` 對照與 `getSectionTag()` helper；題目卡頂端加區段徽章——sky 系（Listening）vs amber 系（R&W）配色區別 + 「聽力練習」/「閱讀與書寫練習」中文小字 + 既有「第 X 題 / 共 N 題」進度行。
- **頁首文案**：`app/quiz/page.tsx` 補一行「順序：Listening → Reading & Writing」說明。
- **Speaking 不做**（明確排除，本專案範圍）。
- **其餘流程完全保留**：選答案、下一題、完成畫面、答對 N/M、重新開始、fill-blank normalize、matching 閱讀型「我看完了」、listening 顯示 transcript（不播音檔）。

`npm run lint` / `typecheck` / `build` 三項全綠，路由 88 不變。Dev smoke test 8 條路由 200，dev log 無 hydration / runtime error。

## 【修改檔案清單】

修改：

- `app/quiz/page.tsx`：新增 `RW_TYPE_ORDER` 對照表（Record\<QuestionType, number\>）+ `sortQuestionsForStarters()` 純函式 helper；在 page render 前對 `flatQuestions` 套用排序產出 `questions` 傳給 `<QuizPlay>`；頁首文案補「順序：Listening → Reading & Writing」。
- `components/QuizPlay.tsx`：新增 `SectionTag` type、`SECTION_LABELS` 對照表（{ number, en, zh }）、`getSectionTag(question)` helper；改寫題目卡頂端 header——把單行進度改為三列結構：徽章（sky-100 listening / amber-100 R&W）+ 中文小字 + 進度行。
- `PROJECT_ROADMAP.md`：P3-6-A 子分區補一條 ✅；變更紀錄追加 2026-05-08 一筆。
- `README.md`：「目前功能」`/quiz` 條目擴寫為「Section 1 Listening → Section 2 Reading & Writing + 配色徽章 + Speaking 不做」。
- `reports/claude_last_report.md`：本回報檔。

未動：所有 `data/*.json`、`lib/types.ts`、`lib/data.ts`、所有 `app/review/`、所有其他 `components/`（含 `PicturePractice` / `VocabularyCard` / `ReviewHubCard`）、所有 `public/`、所有 `docs/*`、`AGENTS.md` / `CLAUDE.md`、`AI_DEV_WORKFLOW.md`、`source_materials/`、`package.json`。

## 【核心邏輯說明】

### 1. 排序在 server page 而非 client component

```tsx
// app/quiz/page.tsx (server)
const flatQuestions = questionOrder
  .map((id) => questionsById.get(id))
  .filter((q): q is ExamQuestion => q !== undefined);
const questions = sortQuestionsForStarters(flatQuestions);  // ← 排序在 server
return <QuizPlay questions={questions} />;
```

**為什麼**：

- 排序是純函式且 deterministic，server 與 client 結果一致——適合 SSG / SSR 在 server 跑一次即可。
- `<QuizPlay>` 只負責「按 props 順序播」，不需知道排序邏輯，職責切乾淨。
- 未來若想換另一種排序（例如打散、依難度排），只需動 page.tsx 的 helper，`<QuizPlay>` 完全不動。

### 2. 為什麼用「兩段 + 段內 sort」而非單一 sort

```ts
function sortQuestionsForStarters(questions: ExamQuestion[]): ExamQuestion[] {
  const listening = questions.filter((q) => q.type === "listening-choice");
  const readingWriting = [...questions]
    .filter((q) => q.type !== "listening-choice")
    .sort((a, b) => RW_TYPE_ORDER[a.type] - RW_TYPE_ORDER[b.type]);
  return [...listening, ...readingWriting];
}
```

vs 用單一 sort + listening 給最高優先：

- 兩段做法**閱讀更直觀**：先講 listening、再講 R&W，與正式考卷結構一一對應。
- 兩段內各自 stable sort（同題型維持原始 JSON 順序）；單 sort 在處理多題同類型時也 stable，但邏輯不夠對齊「考卷分段」概念。
- `RW_TYPE_ORDER` 對 `listening-choice` 給 0 是 dummy 值（永遠不會走到 sort 比較），但保留以滿足 TypeScript `Record<QuestionType, number>` 完整性。

### 3. 區段徽章的視覺區別

```tsx
const sectionAccent =
  sectionTag === "listening"
    ? "bg-sky-100 text-sky-800"
    : "bg-amber-100 text-amber-800";
```

- **Listening**：sky 系（淡藍）—— 與 `/review/picture` 看字選圖的 sky-50 題目區語意一致（題目方向「聽 / 看英文」用 sky 系）。
- **Reading & Writing**：amber 系（淡黃）—— 與整站主色一致。
- 使用者切換到第 2 題（picture-choice，R&W 段）時，徽章會從 sky 變成 amber，**第一眼即傳達**「我們從聽力進到閱讀與書寫了」。

### 4. 徽章內容三層遞減

```
[Section 1 · Listening]    ← 徽章（圓角膠囊，font-bold 可見）
聽力練習                    ← 中文小字（text-xs slate-500）
第 1 題 / 共 7 題           ← 進度（text-sm semibold slate-500）
```

設計理由：

- 第一行**正式名稱**用英文（對齊 Cambridge Starters 官方稱呼）+ Section 編號。
- 第二行**中文** 給家長/小一可讀。
- 第三行**進度** 既有設計保留，與前一版 P3-6-A 一致，避免使用者「找不到第幾題」的迷失感。
- 徽章用 `inline-flex` 與 `rounded-full`，視覺對齊像考試官方標籤的感覺。

### 5. RSC payload vs visible HTML 的觀察

Smoke test 中發現一個**有趣但不是 bug**的現象：grep 搜尋「Which one is a fruit?」（mc 題的 prompt）會在 `/quiz` SSR HTML 中**命中 1 次**，但 visible `<h2>` 內並沒有這個字串（visible HTML grep `<h2>...</h2>` 命中 0）。

原因：`<QuizPlay questions={...}>` 把全 7 題當 props 傳給 client component，**所有題目的 prompt 都被序列化進 React Server Components 的 `<script>` payload**（給 client hydration 用），但只有當前題（第 1 題 listening）會在 visible DOM 中渲染。

驗證方式（已執行）：

| 字串 | 在 RSC payload 中（位置 byte offset） | 在 visible `<h2>` 中 |
| --- | --- | --- |
| `What does the boy want?`（lc） | 3796（位置最小，第 1 題） | ✓ 在 `<p>` 內（不是 h2，是 listening 的 transcript） |
| `What is this?`（pc） | 13502 | ✗ 0 |
| `Which one is a fruit?`（mc） | 14324 | ✗ 0 |
| `The sky is`（fb sky） | 14596 | ✗ 0 |
| `I have a`（fb 自由） | 14860 | ✗ 0 |

RSC payload 內位置遞增順序即排序後的順序：listening → picture → word（無唯一字串可測） → multiple → fill-blank sky → fill-blank 自由 → matching（中文 prompt）。**排序正確**。

### 6. 沒做的事（嚴守任務單禁止清單）

- 沒新增題目資料 / 修改 `data/*.json`
- 沒做 Speaking
- 沒做 localStorage / ExamSession 持久化
- 沒做交卷頁 / 錯題詳解 / 完整結果頁
- 沒做 AI API
- 沒做 P3-2-B 轉換工具
- 沒把 `source_materials` 草稿轉正式 JSON
- 沒新增圖片 / 音檔 / SVG / 依賴 / 測試框架
- 沒部署 / 後端 / DB / 登入

## 【測試結果】

自動驗收（Claude 自測）：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。新 `RW_TYPE_ORDER: Record<QuestionType, number>` 對 6 個題型 key 完整覆蓋；`SECTION_LABELS: Record<SectionTag, ...>` 對 2 個 tag 完整覆蓋。
- `npm run build` → **通過**：路由總數仍 88、`/quiz` 仍 prerender 為 Static、與 P3-6-A 第一版一致。

Dev smoke test：

| 驗證項 | 結果 |
| --- | --- |
| 8 條路由（`/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz`）全 200 | ✓ |
| `/quiz` SSR 第 1 題為 listening：含 `>Listening<`（徽章英文）、「聽力練習」、「聽聽看（音檔準備中」、`What does the boy want?` transcript | ✓ |
| `/quiz` 頁首文案「順序：Listening → Reading & Writing」（HTML 中以 `&amp;` escape） | ✓ |
| `/quiz` visible `<h2>` 中**不含**其他題目 prompt（`What is this?` / `Which one is a fruit?` / `The sky is ___` 全 0） | ✓ |
| `/quiz` RSC payload 內題目順序：lc 位置 3796 → pc 位置 13502 → mc 位置 14324 → fb sky 位置 14596 → fb 自由 位置 14860 | ✓ 遞增 |
| `/review/word/apple` 翻牌「看答案」按鈕 + 跨字母 prev=ant / next=baby | ✓ |
| `/review/picture` 兩 tab 仍正常（看圖選字 / 看字選圖） | ✓ |
| Dev log error / warn / hydration 訊息 | ✓ 全無 |

## 【手動檢查結果】

> 因 Codex 暫停（5/12 恢復），本輪僅做 SSR HTML + 程式碼結構推斷的「應該成立」檢查。未做完整瀏覽器互動人類驗證。

**Claude 自測通過（基於 SSR + typecheck + 程式碼推斷）**：

- ✅ `/quiz` 可開啟、第 1 題為 listening、徽章 sky 系（Listening · 聽力練習）。
- ✅ 排序順序正確（RSC payload byte offset 遞增）：lc → pc → wc → mc → fb 選項 → fb 自由 → mt。
- ✅ 視覺 visible HTML 第 1 題只渲染 listening，其他題目仍在 client state 等待切換。
- ✅ 既有 `/review/*` 路由 8 條全 200，apple 翻牌與看圖練習皆未被破壞。

**建議等 5/12 Codex 恢復後補驗（瀏覽器互動）**：

1. **Section 切換視覺**：第 1 題（listening）徽章是 sky 配色 + 「Listening · 聽力練習」；點下一題到第 2 題（picture-choice）徽章變 amber 配色 + 「Reading & Writing · 閱讀與書寫練習」。
2. **完整 7 題流程**：依序 listening → picture-choice → word-choice → multiple-choice → fill-blank（選項）→ fill-blank（自由填空）→ matching → 完成畫面。
3. **完成畫面**：「答對 N/7 題」+ 鼓勵文案 + 「🔁 重新開始」。
4. **重新開始**：點 🔁 後回到第 1 題（listening）、徽章重新顯示 sky 系。
5. **小一友善視覺**：徽章夠大、不擠、配色與文字對比清楚。
6. **回歸**：`/`、`/review/*` 全部不變，沒有意外破壞。

## 【仍未處理】

- **P3-6-B 全部未開始**：localStorage 持久化、4 個操作（繼續作答 / 離開這份考卷 / 重新測驗 / 直接交卷，本輪只有「重新開始」）、完整結果頁（每題對錯 + 紅色標示 + 正確答案 + 講解）、錯題複習頁、計時器（可選功能）。
- Listening 真實音檔（屬 P2-4C-2B-2）。
- Quiz 題庫遷移（P3-2-B + 人工審核）。
- 舊 Quiz / MultipleChoiceQuestion 統一遷移（待 P3-6-B）。
- P2-4C-2B-2 全部 7 條 ⬜。
- P3-2-B / P3-3-B / P3-4 / P3-5 全部 ⬜。
- P1 兩條可選 housekeeping。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 特別注意。

1. **題型分布不均的視覺體驗**：範例 7 題中 listening 只有 1 題、R&W 有 6 題。第 1 題後就立刻切到 R&W 段，徽章配色變化只發生一次。當 P3-2-B 之後正式題庫進來題數變多（例如 listening 5 題、R&W 15 題），徽章切換頻率會變得更自然，這條本身無 bug。
2. **`RW_TYPE_ORDER` 對 `listening-choice` 給 0 dummy 值**：在 R&W 段的 sort 永遠不會比較到 listening（已被 filter 掉），dummy 值不會影響行為。但若未來新增更多 R&W 題型（例如 P3 schema 加 `speaking-choice`），需要記得在這個對照表加新 key。
3. **`/quiz` 仍是 Static prerender**：即使是 client component 互動，外層 page 仍 SSG。徽章在 SSR 階段就以第 1 題的 sky 系渲染；hydration 後若使用者跳到第 2 題會切到 amber——理論上不會 mismatch，因為 SSR 階段 `currentIndex = 0`、client 初始也是 0。實測 dev log 無 hydration warning。
4. **`questions` 排序後 `currentIndex` 對應的 question id 改變**：`<QuizPlay key={current.id}>` 的 key 在切換題時會自動 remount question view，所以 sort 後的 questions 順序與既有 React state 一致。但**重新整理 / 重新開始**會重新從 server 拿到 sort 後的順序（純函式 deterministic 結果一致），不會出現「上次重新整理時順序不一樣」的怪異情況。
5. **無 localStorage 仍**：使用者點到第 5 題時重整 = 回到第 1 題（純 React local state）。這是 P3-6-A 的設計範圍，P3-6-B 才補。
6. **Speaking 不做但徽章只兩種**：若使用者問「為什麼沒有 Speaking？」答案在 PRODUCT_SPEC「目前明確不做」與本輪 README 補充「Speaking 不做」。`SectionTag` 寫死兩個值（`"listening"` / `"reading-writing"`），未來若要支援 Speaking 需要擴充 type union 與 `SECTION_LABELS`。

## 【後續建議】

1. **5/12 Codex 恢復後跑 P3-6-A 小修瀏覽器人工驗收**：依「手動檢查結果」段的 6 項清單跑一遍。重點：徽章配色切換、7 題完整流程、視覺對比清楚。
2. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-6-A 觀察修補**——5/12 Codex 驗收後若有 UX 瑕疵（例如徽章太小、配色對比不夠、進度行位置偏移），先做小修。
   - 路線 B：**P3-6-B 第一刀 localStorage 持久化**——schema 已在 P3-1 定好（`ExamSessionState` + `schemaVersion: 1`），可寫 `lib/examSession.ts` helper。
   - 路線 C：**P2-4C-2B-2 補真實 TTS 音檔**讓 listening 真的有聲音。
   - 路線 D：**P3-2-B 轉換工具**把 batch01 草稿轉成正式 JSON，題目數量從 7 升到 15+。
3. **題型順序的微調空間**：本輪採「pc → wc → mc → fb → mt」順序；實際使用後若家長覺得 mc 應該在 pc 之前（純文字題比看圖題更熱身），可在 `RW_TYPE_ORDER` 改一行。本輪不過度設計。
4. **未來新增段落（如果需要）**：若 P3-6-B 加入「Speaking」或「混合題型」段，需擴充 `SectionTag` union + `SECTION_LABELS` + `getSectionTag()` 邏輯。建議在那時把 `getSectionTag` 抽成 `lib/quizSection.ts` 純函式，與 sort helper 一起搬出來。本輪不做。
5. **徽章視覺微調**：目前 sky-100 / amber-100 偏淺；若家長覺得對比不夠，可改 sky-200 / amber-200。本輪維持與站內既有色階一致（sky-50 / amber-50 / amber-100 已在 review 動線使用）。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中；所有 P2 勾選未動。
- 🟡 **P3**：仍 🟡 進行中。
  - ✅ **P3-1**：未動。
  - 🟡 **P3-2**：未動（P3-2-A ✅、P3-2-B ⬜）。
  - 🟡 **P3-3**：未動（P3-3-A ✅、P3-3-B ⬜）。
  - ⬜ **P3-4 / P3-5**：未動。
  - 🟡 **P3-6 完整考卷 Session、交卷與錯題複習**：仍 🟡 進行中。
    - ✅ **P3-6-A `/quiz` 最小可玩流程第一版**：上輪 11 條 ✅，本輪追加一條「✅ 題目排序貼近正式 Cambridge Starters：Section 1 Listening → Section 2 Reading & Writing + 段落徽章」共 12 條 ✅。
    - 計時相關「第一版不計時」維持 ✅。
    - ⬜ **P3-6-B 持久化 / 操作 / 結果頁完整版**：未動。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動，本輪未引入登入 / 後端 / 雲端 / localStorage / 真實素材 / 依賴 / 測試框架，未做 Speaking、未實際做交卷 / 錯題詳解，未串 AI API、未爬網路、未下載任何官方 / 歷屆 / 網路素材、未放 Cambridge 官方真題內容。
- 變更紀錄追加 2026-05-08 一筆。

P3 整體仍未完成；**符合任務單「不要把 P3-6 整體標完成」「不要把 P3 整體標完成」「不要進 P3-6-B」要求**。
