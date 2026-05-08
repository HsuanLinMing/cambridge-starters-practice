# Claude Code 回報 · P3-6-B-3 第一刀：完整結果頁與每題詳解

任務日期：2026-05-09
任務性質：**程式碼實作**——P3-6-B-3 第一刀（結果頁每題詳解列表）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只做結果頁詳解；**未做** 錯題複習獨立頁 / `/quiz/wrong` 路由 / 正式歷史紀錄頁 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler；**未動** `lib/types.ts` / `data/*.json` / `lib/examSessionStorage.ts`；未升 `schemaVersion`；未新增依賴 / 處理 npm audit；未部署、未新增後端 / DB / 登入。

## 【本輪修改摘要】

`/quiz` 結果頁從「上半部統計 + 重新測驗」升級為「上半部統計 + **每題詳解列表** + 重新測驗」。`components/QuizPlay.tsx` 新增 5 個純函式 helper（`getQuestionStatus` 三態、`formatUserAnswer`、`formatCorrectAnswer`、`getQuestionPromptDisplay`、`getExplanationDisplay`）+ `STATUS_STYLES` 三色配色表（emerald 答對 / rose 答錯 / amber 未作答）+ `QuestionDetailCard` 子元件。每張卡片顯示：第幾題 + Section + Part 標示 + 狀態 chip + 題目文字版 + 你的答案 + 正確答案 + 說明。

ResultView props 簡化為 `{ questions, answers, onRestart }`（內部即時計算 total / correctCount / answeredCount，避免 caller 重複計算）。matching 用閱讀型描述、未作答顯示「尚未作答」並不算對、無 `explanation` 時依狀態給鼓勵性 fallback。

`PROJECT_ROADMAP.md` P3-6-B-3 從 ⬜ 升為 ✅（7 條 ✅）；P3-6-B 整體仍 🟡（B-4 / B-5 仍 ⬜，符合任務單「不要把 P3-6-B 整體標完成」）。`README.md` `/quiz` 條目補結果頁每題詳解段。

零依賴新增、未升 schemaVersion、未動 localStorage schema。`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全綠。

## 【修改檔案清單】

修改 4 份：

- `components/QuizPlay.tsx`：
  - 新增 5 個純函式 helper（getQuestionStatus / formatUserAnswer / formatCorrectAnswer / getQuestionPromptDisplay / getExplanationDisplay）。
  - 新增 `STATUS_STYLES` 三色配色 record。
  - 新增 `QuestionDetailCard` 子元件（`<li>` 結構 + emerald / rose / amber 三色背景 + 狀態 chip + 題目文字 + 雙欄答案 + 說明）。
  - ResultView props 改為 `{ questions, answers, onRestart }`，內部計算統計；插入 `<section aria-label="每題詳解">` 區段於統計與按鈕之間。
  - QuizPlay 主元件呼叫 ResultView 時改傳 `questions={questions} answers={session.answers}`，移除 caller 端 correctCount / answeredCount 計算（簡化）。
- `PROJECT_ROADMAP.md`：P3-6-B-3 從 ⬜ 升為 ✅（7 條 ✅）；變更紀錄追加 2026-05-09。
- `README.md`：「目前功能」`/quiz` 條目補結果頁每題詳解段（emerald / rose / amber 三色 + 8 個顯示欄位 + matching / 未作答 / 無 explanation 處理規則）。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / 任何 `app/review/*` 路由 / `app/quiz/page.tsx` / `components/PicturePractice` / `VocabularyCard` / `ReviewHubCard` / `BackToHome` / 所有 docs / source_materials / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. 三態 `QuestionStatus`：correct / incorrect / unanswered

```ts
type QuestionStatus = "correct" | "incorrect" | "unanswered";

function getQuestionStatus(question, answer) {
  if (!isAnswered(answer)) return "unanswered";
  return isCorrect(question, answer) ? "correct" : "incorrect";
}
```

重複利用 P3-6-A 既有的 `isAnswered` / `isCorrect` helper，保持判分邏輯單一事實來源。`STATUS_STYLES` record 把三態映射到 5 個 Tailwind class（背景 / 邊框 / chip / 圖示 / 標籤）+ 中文標籤——讓 `QuestionDetailCard` 不用 if/else 拆分，直接 `STATUS_STYLES[status]` 取出。

### 2. 答案格式化 4 個 helper

| Helper | 規則 |
| --- | --- |
| `formatUserAnswer` | 未作答 → 「尚未作答」；matching `_done` token → 「已完成閱讀配對練習」；其他直接顯示 `answer` 字串 |
| `formatCorrectAnswer` | matching → 「本題目前為閱讀型練習，完成即算正確」；其他直接顯示 `question.answer`（option-based 與 fill-blank 自由填空都成立） |
| `getQuestionPromptDisplay` | listening → `transcript` / `ttsScript`；word-choice → 「這個英文單字是「X」」；picture-choice / matching 缺 prompt → fallback 文字；其他 → `question.prompt` |
| `getExplanationDisplay` | 優先 `BaseQuestion.explanation`；fallback 三段鼓勵性文字（依狀態） |

刻意不重複貼大圖 / 大音檔到結果頁——詳解列表是文字版概覽，給家長辨識，不是讓孩子重做。如果家長想看圖，可按重新測驗回到題目卡。

### 3. ResultView props 簡化

舊版：`{ total, correctCount, answeredCount, onRestart }`，caller QuizPlay 端要先 filter 兩次計算 correctCount + answeredCount。

新版：`{ questions, answers, onRestart }`，ResultView 內部計算。**好處**：

- caller 端少 6 行重複邏輯。
- 「per-question 詳解」自然就近取資料（直接從 questions / answers 取）。
- 統計與詳解計算共用同一份資料，無不一致風險。

### 4. matching 在詳解列表的兩種狀態

| 狀態 | 觸發 | userAnswer 顯示 | correctAnswer 顯示 |
| --- | --- | --- | --- |
| `unanswered` | 沒按過「我看完了」 | 尚未作答 | 本題目前為閱讀型練習，完成即算正確 |
| `correct` | 按過「我看完了」（answer = `_done`） | 已完成閱讀配對練習 | 本題目前為閱讀型練習，完成即算正確 |

理論上 matching 不會出現 `incorrect` 狀態——`_done` 是唯一被視為 answered 的值；其他值（如使用者直接編輯 localStorage 改 answer）會被 `isCorrect` 判錯。`formatUserAnswer` 對非 `_done` 的 matching answer 顯示「（未完成）」作為 defensive fallback。

### 5. 未作答清楚標示（鼓勵 > 懲罰）

未作答題的 amber 配色（不是 rose），刻意與「答錯」視覺區分——鼓勵小朋友 / 家長理解「下次補答」而非「失敗」。`getExplanationDisplay` 對未作答使用「下次可以再試一次～」鼓勵語；無 explanation 的答錯題用「再想一下，下次一定可以的～」；無 explanation 的答對題用「答得很好！繼續加油！」。三段都對齊 PRODUCT_SPEC「測驗與考前練習方向 → 交卷與結果頁 → 講解語氣小一友善」段。

### 6. 重新整理結果頁仍保持 submitted

不需要改任何 code——既有 P3-6-B-1 的 hydration 機制（`session.submitted = true` 由 localStorage 恢復）即可。瀏覽器重整 → useState init 給空 session → microtask 從 localStorage 讀出 submitted=true → setSession 重新渲染 → ResultView 顯示。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒做錯題複習獨立頁（屬 P3-6-B-4）
- 沒新增 `/quiz/wrong` 路由
- 沒做正式歷史紀錄頁
- 沒做計時器（屬 P3-6-B-5）
- 沒做 Speaking / TTS / 錄音 / STT / AI API / crawler
- 沒下載官方 PDF / 圖片 / 音檔
- 沒複製官方題目 / 歷屆題
- 沒新增題目
- 沒修改 `data/*.json`
- 沒大改 `lib/types.ts`（完全沒動）
- 沒做 P3-9-B schema / metadata 大升級
- 沒做 P3-2-B 轉換工具
- 沒升 `QUIZ_SESSION_SCHEMA_VERSION`（仍為 1）
- 沒新增 `score` / `wrongQuestionIds` 到 storage（每題對錯從 `session.answers` 即時計算）
- 沒新增依賴 / 處理 npm audit
- 沒部署 / 後端 / DB / 登入

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static、`Generating static pages 88/88`）。

Dev smoke test：

| 驗證項 | 結果 |
| --- | --- |
| 8 條路由 200（`/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz`） | ✓ |
| `/quiz` SSR 第 1 題仍是 listening + Listening 徽章 + 聽音選圖 + 直接交卷 / 重新測驗按鈕 | ✓ |
| 首次進入 visible HTML 不含「每題詳解」（submitted=false 時應隱藏） | ✓ |
| RSC payload 含全部 7 題的 prompt / id（`Which one is a fruit?` / `q-fb-002` / `I have a`），讓 hydration 後 ResultView 能組裝完整詳解 | ✓ |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn 訊息 | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + lint / typecheck / build）通過。

需要使用者瀏覽器互動驗收：

1. **作答幾題後直接交卷**：先答 1~2 題（故意答錯一題、答對一題），其餘留空。按題目卡下方 amber「📝 直接交卷」。
2. **結果頁顯示每題詳解**：應看到上半部統計（答對 N / M、已作答 X / M、未作答 M-X、鼓勵語）+ 下方「每題詳解」標題 + 7 張卡片。
3. **答對題顯示正確**：emerald 系背景 + 「✓ 答對」chip + 你的答案（emerald 字色）= 正確答案（emerald 字色）+ 鼓勵說明。
4. **答錯題顯示錯誤**：rose 系背景 + 「✗ 答錯」chip + 你的答案（rose 字色）≠ 正確答案（emerald 字色）+ 「再想一下，下次一定可以的～」或既有 explanation。
5. **未作答題顯示未作答**：amber 系背景 + 「? 未作答」chip + 你的答案 = 「尚未作答」（amber 字色）+ 正確答案（emerald 字色）+ 「下次可以再試一次～」或既有 explanation。
6. **使用者答案 / 正確答案都有顯示**：每張卡片皆有「你的答案」+「正確答案」雙欄。
7. **explanation 有顯示**：本範例 7 題每題都有 explanation 欄位（見 `data/p3-example-questions.json`），應顯示原 explanation 而非 fallback 鼓勵語。
8. **重新測驗仍會清 session**：在結果頁按「🔁 重新測驗」→ localStorage 應清空（DevTools Application → Local Storage 確認）+ 回第一題。
9. **重新整理結果頁仍保持 submitted**：在結果頁按 F5 → 應仍在結果頁、詳解列表完整顯示。
10. **既有路由回歸**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常、翻牌功能、看圖練習互動皆無破壞。

預期結果頁範例（用 P3-1 範例 7 題、全部留空、按直接交卷）：

```
🎉 完成了！
答對 0 / 7 題
已作答 0 / 7    未作答 7 題
未作答的題目算錯；下次可以再試試看～
沒關係，再試一次一定會更好！

每題詳解
[第 1 題 · Section 1 Listening · Part 3]  [? 未作答]   ← amber 卡片
題目：What does the boy want?
你的答案：尚未作答             正確答案：apple
說明：音檔說小男孩想要蘋果。

[第 2 題 · Section 2 Reading & Writing · Part 1 / Part 2 preview]  [? 未作答]
題目：What is this?
你的答案：尚未作答             正確答案：apple
說明：圖片是紅色的圓形水果，是 apple。

…（其餘 5 題同樣 amber）

[🔁 重新測驗]
回首頁
```

## 【仍未處理】

- **P3-6-B-4 錯題複習獨立頁**（3 條 ⬜）：再練習錯題入口、獨立錯題複習頁、`wrongQuestionIds` 對齊 ExamSessionState。
- **P3-6-B-5 計時器**（1 條 ⬜）：未來模擬考計時器（可選功能、預設關閉）。
- **P3-7-B / P3-7-C / P3-7-D 全部 ⬜**（官方資源校正 P3-9 模板 / wordlist 對 vocabulary 校正 / sample / mock test toolkit 觀察筆記）。
- **P3-8 全部 ⬜**（AI 仿真題生成流程文件）。
- **P3-9-B / P3-9-C 全部 ⬜**（schema / metadata 實作 / part-specific UI）。
- **P4 Speaking Examiner Agent 全部 ⬜**；`docs/SPEAKING_EXAMINER_AGENT_DESIGN.md` 規劃中文件未建立。
- **P5 完整仿真考試體驗 ⬜**。
- **P2-4C-2B-2 全部 ⬜**（單字閱讀模式、拼字測驗模式、TTS 真實音檔、補圖、聽力 / 句型 / 位置練習）。
- **P3-2-B / P3-3-B / P3-4 / P3-5 全部 ⬜**。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **每題詳解列表長度**：當前 7 題 → 7 張卡片，每張約 130~180px 高，總長度約 1000~1300px。手機 / 平板上需要滾動才能看完。**建議**：未來 P3-6-B-4 動工時，可考慮加「只顯示錯題」/「只顯示未作答」filter（toggle button），讓家長快速找重點。本輪不做。
2. **大量 explanation 缺漏 fallback 的依賴**：本範例 7 題每題都有 `explanation`，所以 fallback 鼓勵語不會出現在第一手檢核。**建議**：使用者驗收時可故意修改 `data/p3-example-questions.json` 把某題 explanation 移除 → 確認 fallback「下次可以再試一次～」/「再想一下，下次一定可以的～」/「答得很好！」三個語句正常出現（記得改完還原檔案）。
3. **picture-choice 的「（看圖選字題）」fallback**：當 picture-choice 沒有 `prompt` 時，詳解卡片顯示「題目：（看圖選字題）」。家長無法從文字辨識具體哪題（因為沒有圖）。**建議**：未來可考慮在詳解卡片加 thumbnail（屬 P3-6-B-4 範圍）；本輪只做文字版。
4. **matching 「正確答案：本題目前為閱讀型練習，完成即算正確」訊息**：當 matching 是 `correct` 狀態時，「你的答案」與「正確答案」兩欄都圍繞 emerald 配色 + 看似重複（前者「已完成閱讀配對練習」、後者「本題目前為閱讀型練習，完成即算正確」）。**設計原意**：你的答案是「行為描述」、正確答案是「規則描述」。但視覺上可能看起來冗餘。未來 P3-6-B-4 / P3-9-C 把 matching 升級為真正的拖曳配對後，這兩欄會自然分化。
5. **「未作答」amber 配色與「Reading & Writing」段落徽章 amber 衝突風險**：題目卡頂端的段落徽章是 amber-100；詳解卡片的「未作答」也是 amber-50 + amber-200 ring。視覺上類似但不重疊（前者在題目卡內、後者在結果卡內）。**建議**：使用者實測時注意是否會混淆；若混淆可改未作答為 yellow / slate 系。本輪沿用 amber 因為它與「警示但不嚴厲」的小一友善語氣相符。
6. **R&W 段內 multiple-choice 的「Part 4 preview」字樣**：詳解卡片頭部顯示 `Section 2 Reading & Writing · Part 4 preview`。家長可能疑惑「為什麼有 preview」。已在 P3-9-A `STARTERS_PART_TEMPLATES.md` 與 `/quiz` 頁首練習版聲明標明，但詳解卡片本身沒有重複提示——若使用者反饋疑惑，下一輪可在結果頁頂端再加一行小字「Part 標示為練習版近似對應」。
7. **`session.answers` 即時計算成本**：每次渲染 ResultView 都跑兩次 `questions.filter`（correctCount + answeredCount）+ 7 次 `getQuestionStatus`（每張卡片）。對 7 題完全沒問題，但若未來題量上百，可考慮 useMemo。本輪沿用最簡寫法。
8. **重整結果頁時的 hydration race**：localStorage 中 submitted=true 的 session 在 microtask 中被讀出，然後 setSession 觸發重新渲染為結果頁。理論上有「先看到題目第 1 題、再閃成結果頁」的 race。**dev mode 自測未觀察到閃動**，但可能因網速 / CPU 負載差異。Codex 驗收時建議在低速 CPU 模擬下測一次。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」10 個檢核點在 Mac + 平板區網 IP 上跑。重點：流程 2~5（emerald / rose / amber 三色配色 + chip 對齊）、流程 7（explanation 顯示）、流程 8（重新測驗清 localStorage）、流程 10（既有路由回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 每張詳解卡片的雙欄答案對齊（emerald 答對綠字 / rose 答錯紅字 / amber 未作答橙字）。
   - matching `_done` token 處理是否正確（不要顯示 `_done` 字面）。
   - fill-blank 自由填空 + 選項版兩種顯示是否一致。
   - hydration race 在低速 CPU 模擬下是否會閃動。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-6-B-4 第一刀**——錯題複習獨立模式：在結果頁加 toggle「只看錯題 / 看全部」；點 toggle 後詳解列表只顯示 incorrect + unanswered 題；不需要新路由 / 新 localStorage 欄位（filter 純前端）。
   - 路線 B：**P3-7-B 動工**（依 P3-7-A 11 條校正清單對 STARTERS_PART_TEMPLATES.md 校正）。
   - 路線 C：**P3-9-B 第一刀**（`starterSection` / `starterPart` / `skillFocus` 加 types + 7 題範例補 metadata）。
   - 路線 D：**P3-6-B-4 第二刀**——獨立 `/quiz/wrong` 路由 + `wrongQuestionIds` 升 schemaVersion 到 v2 + migration。
   - 路線 E：**P2-4C-2B-2 補真實音檔 / 補圖**。
4. **詳解列表的 filter（建議 B-4 動工時加）**：toggle button 或 segmented control「全部 / 只看錯題 / 只看未作答」，不新增 localStorage 欄位、不新路由，純 React state 即可。
5. **picture-choice 詳解 thumbnail（建議 B-4 動工時考慮）**：在詳解卡片加小型圖片預覽（重用 `QuizImage` size="sm"），讓家長辨識題目時更直覺。但會增加結果頁高度與 perf 成本，需評估。
6. **R&W 段內 Part 編號跳動的家長提示**：若使用者反饋疑惑，在結果頁頂端 cheer 下方加一行「※ Part 標示為練習版近似對應，正式 Cambridge 考試結構詳見 STARTERS_PART_TEMPLATES.md」（可選）。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪只升 P3-6-B-3 從 ⬜ → ✅（7 條 ✅）；P3-6-B 整體仍 🟡（B-4 / B-5 仍未開始）。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - ✅ **P3-6-B-3 完整結果頁與每題詳解**（本輪完成）：7 條任務全 ✅。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B-4 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C**：本輪未動。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅（第一版不計時）+ 1 條 ⬜（未來計時器）；本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住。
- 變更紀錄追加 2026-05-09 一筆。

P3 整體仍 🟡 進行中；P3-6-B 仍 🟡 進行中（B-1 + B-2 + B-3 完成、B-4 / B-5 未開始或部分完成），**符合任務單「不要把 P3-6-B 整體標完成、不要把 P3-6 整體標完成、不要把 P3 整體標完成」要求**。
