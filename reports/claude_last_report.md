# Claude Code 回報 · P3-6-B-4 第二刀：再練習錯題 inline 模式

任務日期：2026-05-09
任務性質：**程式碼實作**——P3-6-B-4 第二刀（結果頁 inline retry mode）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只做 retry inline mode；**未做** 獨立錯題頁 / `/quiz/wrong` 路由 / `wrongQuestionIds` 持久化 / 錯題歷史紀錄 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler；**未動** `lib/types.ts` / `data/*.json` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx`；未升 `QUIZ_SESSION_SCHEMA_VERSION`；未新增依賴 / 處理 npm audit；未部署、未新增後端 / DB / 登入。

## 【本輪修改摘要】

`/quiz` 結果頁加「再練習這些題目（N）」rose-400 系按鈕（僅 reviewCount > 0 時顯示），按下進入 **inline retry mode**——amber 系 banner「🔁 再練習模式：只練習錯題與未作答題」+ 進度「再練習 第 X / Y 題」（retry-relative）+ 直接交卷 / 返回完整結果按鈕。完成後顯示新的 `RetryResultView`：amber banner 重申「不會覆蓋原始測驗分數」+ 統計 + 鼓勵語 + retry 每題詳解（用原始試卷 index 對齊「第 N 題」）+ 「↩ 回到完整測驗結果」+「🔁 重新測驗（清除原始與再練習進度）」+ 回首頁 link。

retry mode 純 React in-memory state（4 個新 state：`retryQuestionIds: string[] | null` / `retryAnswers` / `retryIndex` / `retrySubmitted`）+ 5 個 handler；**不**新增路由、**不**存 localStorage、**不**升 schemaVersion、**不**新增 `wrongQuestionIds`、**不**覆蓋原始測驗分數。重整頁面後因 localStorage 仍是 submitted=true 的原始 session，使用者會回到完整結果頁（retry state 自然丟失，符合任務單預期）。

`PROJECT_ROADMAP.md` P3-6-B-4 從「3 條 ✅ + 3 條 ⬜」升為「6 條 ✅ + 3 條 ⬜」（新增：再練習入口 / inline retry mode / 不新增路由不升 schemaVersion 三條 ✅）；P3-6-B 整體仍 🟡。`README.md` `/quiz` 條目補 retry mode 說明。

零依賴新增、未升 schemaVersion、未動 localStorage schema、未動 `lib/types.ts` / `data/*.json`。`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全綠。

## 【修改檔案清單】

修改 4 份：

- `components/QuizPlay.tsx`：
  - 新增 4 個 retry state hooks（`retryQuestionIds: string[] | null` / `retryAnswers` / `retryIndex` / `retrySubmitted`）+ derived（`inRetry` / `retryIdSet` / `retryQuestions` / `retryTotal`）。
  - 新增 5 個 retry handler（`handleStartRetry` / `handleExitRetry` / `handleSelectRetryAnswer` / `handleRetryNext` / `handleRetrySubmitNow`）+ 共用 `resetRetryState` helper。
  - 修改 `handleRestart`：除既有清 localStorage + 重置 session + restoredHint 外，加 `resetRetryState()` 同時重置 retry state。
  - 修改主元件渲染分支：在 `total === 0` 之後、`session.submitted` 之前插入 `if (inRetry)` 分支（內含 retry submitted → `<RetryResultView>` / retry not-submitted → 內聯 retry quiz JSX）；`<ResultView>` 呼叫加 `onStartRetry={handleStartRetry}` prop。
  - retry quiz JSX 內聯：amber 系 banner「🔁 再練習模式…」+ `<strong>不會覆蓋</strong>`（修 markdown `**` 在 JSX 不渲染的 bug）+ 段落徽章 / Part 標示重複利用既有 helpers + 進度「再練習 第 X / Y 題」+ QuestionView + 「下一題」/「看再練習結果」按鈕 + 底部 chip 「📝 直接交卷」/「↩ 返回完整結果」。
  - `ResultView` props 新增 `onStartRetry: (ids: string[]) => void`；reviewCount > 0 時 render rose-400「🔁 再練習這些題目（{reviewCount}）」按鈕，位於詳解列表與重新測驗之間；onClick 傳 `statuses.filter(s => s.status === "incorrect" || s.status === "unanswered").map(s => s.question.id)`。
  - 新增 `RetryResultView` 元件（位於 ResultView 與 QuestionView 之間）：amber banner + 🌱 圖示 + 「再練習完成！」標題 + 答對 N/Y + 雙欄統計（已作答 / 未作答）+ 4 段鼓勵語（依答對率分級）+ retry 每題詳解（重複利用 `QuestionDetailCard`，用 `originalIndexById` map 取原始試卷 index）+ 「↩ 回到完整測驗結果」amber-400 主按鈕 + 「🔁 重新測驗」slate-200 ring 次按鈕 + 回首頁 link。
- `PROJECT_ROADMAP.md`：P3-6-B-4 從「3 ✅ + 3 ⬜」升為「6 ✅ + 3 ⬜」（補三條 ✅：再練習入口 / inline retry mode / 不新增路由不升 schemaVersion）；變更紀錄追加 2026-05-09。
- `README.md`：「目前功能」`/quiz` 條目補 retry mode 段（rose-400 按鈕 / amber 系 banner / retry 進度 / RetryResultView 結構 / 不覆蓋原始分數）。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / `app/quiz/page.tsx` / 任何 `app/review/*` / `components/PicturePractice.tsx` / `VocabularyCard.tsx` / `ReviewHubCard.tsx` / `BackToHome.tsx` / 所有 docs / source_materials / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. retry state 純 in-memory（不污染 localStorage）

```ts
const [retryQuestionIds, setRetryQuestionIds] = useState<string[] | null>(null);
const [retryAnswers, setRetryAnswers] = useState<Record<string, string>>({});
const [retryIndex, setRetryIndex] = useState(0);
const [retrySubmitted, setRetrySubmitted] = useState(false);
```

`retryQuestionIds === null` 是「非 retry 模式」哨兵值；非 null 即為「retry 模式中」，元素為錯題 + 未作答題的 id 清單。`retryAnswers` 與 `session.answers` 完全分離，retry 作答不污染原始 session。

**重整頁面後行為**：localStorage 中只有 `session`（含 `submitted: true` + 原始 `answers`），retry state 是 React state、頁面重整即丟失。Hydration 後 QuizPlay 看到 `session.submitted = true` + `inRetry = false` → 顯示 `ResultView`（完整結果頁）。**這是預期行為**——重整等於「離開 retry 模式回到完整結果」。

### 2. 渲染分支順序（retry mode 取代既有 submitted 結果頁渲染）

```
1. total === 0 → EmptyState
2. inRetry && retrySubmitted → <RetryResultView>
3. inRetry && !retrySubmitted → 內聯 retry quiz JSX
4. session.submitted → <ResultView onStartRetry={handleStartRetry} />
5. !current → FallbackError
6. else → 一般 quiz JSX
```

retry mode 在 (2)(3) 取代 session.submitted 的 (4)——當使用者按「再練習這些題目」進入 retry，session 仍是 submitted=true 但 UI 切到 retry。`handleExitRetry` 把 retryQuestionIds 設回 null，回到 (4) 完整結果頁。

### 3. retry index 顯示策略：retry-relative for progress, original for detail cards

| 場景 | index 顯示 | 用意 |
| --- | --- | --- |
| Retry quiz 進度（題目卡頂端） | retry-relative（`再練習 第 X / Y 題`，Y = retry 題數） | 讓孩子看到 retry 範圍進度，不被原始試卷編號干擾 |
| Retry result detail 卡片（每張卡片頭部「第 N 題」） | **原始試卷 index**（用 `originalIndexById` map） | 讓家長辨識「這是試卷第 5 題」對齊整份試卷編號 |

實作：`RetryResultView` 用 `const originalIndexById = new Map(allQuestions.map((q, i) => [q.id, i]))`，渲染時 `index={originalIndexById.get(q.id) ?? 0}` 傳給 `QuestionDetailCard`。任務單明示「再練習模式題號顯示以 retry 題數計算」對應 quiz 進度；result detail 沒明示，本輪選擇「原始試卷 index」對家長友善。

### 4. retry quiz JSX 內聯（不抽 component）

retry quiz 與一般 quiz UI 結構幾乎相同（段落徽章 + Part 標示 + QuestionView + 下一題按鈕 + 底部 chip），但**有兩個差異**：

1. retry quiz 有頂端 amber banner 提示模式 + 不覆蓋原始分數聲明。
2. retry quiz 進度顯示為「再練習 第 X / Y 題」（retry-relative），非「第 X 題 / 共 N 題」。
3. retry quiz 底部 chip 是「直接交卷 + 返回完整結果」，非「直接交卷 + 重新測驗」。

抽共用 component 會引入 props 設計成本（要多傳 7~10 個 props）。**選擇內聯**——讓兩種模式 JSX 各自清晰，差異一目瞭然。retry quiz JSX 共 ~80 行，contained 於 inRetry 分支內。

### 5. ResultView 中的 reviewIds 計算

```tsx
onClick={() =>
  onStartRetry(
    statuses
      .filter(
        (s) =>
          s.status === "incorrect" || s.status === "unanswered",
      )
      .map((s) => s.question.id),
  )
}
```

inline 計算 review ids（incorrect + unanswered）並傳入 `onStartRetry` callback。**沒**用 useMemo——對 7 題的計算成本可忽略；onClick 不在 hot path，每次 render 計算也不影響。

### 6. handleRestart 同時重置 retry state

```ts
const handleRestart = () => {
  clearSession();
  setSession(createEmptySession(paperId, questions));
  setRestoredHint(false);
  resetRetryState();  // 同時重置 retry 4 個 state
};
```

避免「retry mode 中按重新測驗 → localStorage 清掉 + 原始 session 重置 → 但 retryQuestionIds 仍非 null → 仍渲染 retry mode」的 bug。**單一事實來源**：`handleRestart` 是「徹底清空，回到第一題」入口，包含 retry。

### 7. JSX 中的 markdown 修正

實作中曾在 JSX text 寫 `**不會覆蓋**` 期望粗體渲染——但 JSX text 不解析 markdown，會把 `**` 字面顯示。發現後改用 `<strong className="font-bold">不會覆蓋</strong>` 元素，兩處 banner（retry quiz banner + RetryResultView banner）皆已修正。

### 8. 沒做的事（嚴守任務單禁止清單）

- 沒新增 `/quiz/wrong` 路由
- 沒做獨立錯題複習頁
- 沒新增 `wrongQuestionIds` localStorage 欄位
- 沒升 `QUIZ_SESSION_SCHEMA_VERSION`（仍為 1）
- 沒做正式歷史紀錄頁
- 沒做計時器
- 沒做 Speaking / TTS / 錄音 / STT / AI API / crawler
- 沒下載官方 PDF / 圖片 / 音檔
- 沒複製官方題目 / 歷屆題
- 沒新增題目
- 沒修改 `data/*.json`
- 沒大改 `lib/types.ts`（完全沒動）
- 沒做 P3-9-B schema / metadata 大升級
- 沒做 P3-2-B 轉換工具
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
| `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 聽音選圖 / 直接交卷 / 重新測驗 | ✓ |
| 首次進入不含「再練習這些題目」/「再練習模式」/「本次再練習結果」/「回到完整測驗結果」/「每題詳解」/「不會覆蓋」（submitted=false 時 ResultView / RetryResultView / retry quiz 皆不渲染、字串只在 client JS chunk 內） | ✓ |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn 訊息 | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + lint / typecheck / build）通過。

需要使用者瀏覽器互動驗收：

1. **結果頁有錯題 / 未作答時，顯示「再練習這些題目」**：作答 1~2 題（一對一錯）+ 留空 5 題 + 直接交卷 → 應在詳解列表下方看到 rose-400 系按鈕「🔁 再練習這些題目（6）」。
2. **全對時，不顯示該按鈕**：作答全部 7 題且全對 → 詳解列表下方**不**顯示再練習按鈕（reviewCount = 0）；但「重新測驗」按鈕仍正常顯示。
3. **點按鈕後進入再練習模式**：按「再練習這些題目」chip → 畫面切換為 retry quiz：頂端 amber banner「🔁 再練習模式…」+ 副標含 `<strong>不會覆蓋</strong>` 粗體 + 段落徽章 + Part 標示 + 進度「再練習 第 1 題 / 共 6 題」+ 第一題（原試卷的第一個錯題或未作答題）+ 下一題按鈕 + 底部 chip「📝 直接交卷」+「↩ 返回完整結果」。
4. **再練習模式只顯示錯題與未作答題**：依序作答 6 題 retry → 進度從 1/6 到 6/6 → 不會出現原本答對的題目。
5. **再練習模式題號顯示以 retry 題數計算**：每題卡片頂端顯示「再練習 第 X / 共 Y 題」（retry-relative，Y = 6），**不顯示**原試卷編號（避免干擾）。
6. **再練習完成後顯示本次再練習結果**：retry 第 6 題按「看再練習結果」→ 切到 `RetryResultView`：amber banner「🔁 本次再練習結果」+ 副標重申「不會覆蓋」+ 🌱 圖示 + 「再練習完成！」標題 + 統計（答對 N / 6、已作答 X / 6、未作答 6-X）+ 鼓勵語 + 「再練習每題詳解」+ 6 張 detail card（**用原始試卷 index 顯示「第 N 題」對齊整份試卷編號**）。
7. **可以回到完整測驗結果**：retry result 頁按「↩ 回到完整測驗結果」amber-400 按鈕 → 切回完整 ResultView，原本的統計 + 詳解 + filter chip 全部恢復。
8. **原始測驗分數不被覆蓋**：流程 7 後，完整結果頁的「答對 N / 7」+ 詳解每題狀態與作答前一致——retry 作答**沒影響**原始分數。
9. **重新測驗仍清 session**：在完整結果頁 OR retry result 頁按「🔁 重新測驗」→ localStorage 清空 + 回第一題（DevTools Application → Local Storage 確認）。
10. **retry mode 中重整頁面回到完整結果**：在 retry quiz / retry result 中按 F5 → 因 localStorage 仍是 submitted=true 的原始 session，重整後跳回完整 ResultView（retry state 隨 React state 丟失）。**這是預期行為**——retry 是 in-memory 模式。
11. **既有路由回歸**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常、翻牌功能、看圖練習互動皆無破壞。

預期完整流程示意：

```
作答 7 題 → 直接交卷
↓
[完整結果頁]
🎉 完成了！
答對 N / 7 題
[全部 7][只看錯題 X][只看未作答 Y][需要再練習 5]
(7 張詳解卡片)
[🔁 再練習這些題目（5）]   ← 新按鈕（rose-400）
[🔁 重新測驗]
回首頁

↓ 點「再練習這些題目（5）」

[retry quiz]
🔁 再練習模式：只練習錯題與未作答題
本次再練習結果**不會覆蓋**原始測驗分數…

[Section X · Listening｜聽力練習]
Part 3：聽音選圖
再練習 第 1 題 / 共 5 題
(題目)
[下一題 →]
[📝 直接交卷] [↩ 返回完整結果]

↓ 答完 5 題 → 「看再練習結果」

[RetryResultView]
🔁 本次再練習結果
再練習結果**不會覆蓋**原始測驗分數…

🌱 再練習完成！
答對 N / 5 題
(統計)
鼓勵語

再練習每題詳解
[第 2 題 (原試卷)] (狀態 / 你的答案 / 正確答案 / 說明)
[第 4 題 (原試卷)] (...)
…

[↩ 回到完整測驗結果]   ← 主按鈕（amber-400）
[🔁 重新測驗（清除原始與再練習進度）]   ← 次按鈕
回首頁

↓ 點「↩ 回到完整測驗結果」

[完整結果頁]   ← 原始分數仍是 N / 7，retry 作答未覆蓋
```

## 【仍未處理】

- **P3-6-B-4 後續刀數**：
  - 錯題複習頁可獨立進入（屬下一刀，需新路由 `/quiz/wrong` 或類似）。
  - 錯題狀態於 localStorage 保存（`wrongQuestionIds` 對齊 `ExamSessionState`，需升 `QUIZ_SESSION_SCHEMA_VERSION = 2` + 寫對應 migration）。
  - 錯題歷史紀錄（跨 session 累積錯題）。
- **P3-6-B-5 計時器**（1 條 ⬜）：未來模擬考計時器。
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

1. **retry state 不存 localStorage 的取捨**：依任務單明示「第一版可完全使用 in-memory state，不寫入 localStorage」，本輪刻意不存。**不便場景**：使用者在 retry 第 3 題重整頁面 → retry 進度全失，直接跳回完整結果頁。**設計取捨**——避免污染 session schema 與升 schemaVersion。若 5/12 後 Codex 或使用者反饋此體驗不便，下一輪可考慮加 sessionStorage（不存 localStorage）保存 retry 中間狀態。
2. **retry 完成後不合併回原始 answers**：依任務單明示「第一版可以不合併，避免污染原本分數」。**潛在疑惑**：使用者可能會想「我 retry 答對了某題，原始分數應該也更新吧？」——但不更新。UI 已多處標明「不會覆蓋原始測驗分數」（retry quiz banner + RetryResultView banner），但 5/12 後 Codex 驗收建議確認此語意對家長是否清楚。
3. **rose-400 vs emerald 配色衝突**：「再練習這些題目」按鈕用 rose-400（紅色系）強調「需要再練習」感；但既有 detail card 中 incorrect 也是 rose 系。視覺上可能讓使用者覺得「按了會看到一片紅」。**設計選擇**——rose 強調「需要關注」、與「重新測驗」amber-400 區分；若使用者反饋過於強烈，下一輪可改為 amber-500 或 sky-500。
4. **retry quiz 進度「再練習 第 X / 共 Y 題」與一般 quiz「第 X 題 / 共 N 題」用詞差異**：刻意區分讓使用者意識到 retry 範圍（Y 是 retry 題數，不是整份 N）。**Codex 驗收提醒**：在 retry mode 中題目卡頂端進度顯示應該是「再練習 第 1 題 / 共 5 題」而非「第 2 題 / 共 7 題」（後者會誤導使用者覺得仍在原始試卷中）。
5. **retry result 詳解卡片用原始試卷 index**：刻意用原始 index 讓家長能對齊「這是試卷第 5 題」。但詳解卡片頭部「第 5 題」與 retry quiz 進度「再練習 第 1 題」會出現編號跳動（同一題在 retry quiz 是「第 1 題 retry」、在 retry result detail 是「第 5 題 原試卷」）。**設計選擇**——quiz 進度給孩子（retry-relative 簡單）/ result detail 給家長（原試卷 index 對齊）。Codex 驗收提醒注意此差異是設計而非 bug。
6. **`<strong className="font-bold">不會覆蓋</strong>` 在小一友善視覺中的衝擊**：粗體強調「不會覆蓋」可能讓家長警覺有機制不對，但目的是強調「retry 不影響原始分數」這個重要承諾。**Codex 驗收提醒**：若視覺過於警示，可改為 `<span className="font-semibold">` 或加底線。
7. **retry mode JSX 內聯導致 QuizPlay.tsx 變長**：本輪後 `components/QuizPlay.tsx` 約 1100 行。**未來建議**：當這個檔案超過 1500 行時，考慮抽出 `components/QuizPlay/RetryMode.tsx` / `ResultView.tsx` / `QuestionViews.tsx` 等 sub-component。本輪不抽，避免破壞現有結構。
8. **handleStartRetry / handleRestart 重置時序**：若使用者在 retry result 按「重新測驗」→ `handleRestart` 同時重置 session 與 retry state。**race risk 已處理**：`resetRetryState()` 是 sync setState 序列、與 `setSession()` 在同 React batch 中合併、單次 re-render 跳到 `total === 0` 之後的「!current」OR 一般 quiz 第 1 題（依 questions 而定，本範例 questions.length > 0 所以走 quiz 第 1 題）。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」11 個檢核點在 Mac + 平板區網 IP 上跑。重點：流程 1（按鈕只在 reviewCount > 0 時顯示）、流程 3-7（retry mode 完整 flow）、流程 8（原始分數不被覆蓋）、流程 10（重整回到完整結果）、流程 11（既有路由回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - retry mode 在不同 reviewCount（0 / 1 / 5 / 7）下視覺與 UX。
   - retry index 顯示策略（quiz retry-relative vs result original）是否被家長正確理解。
   - amber banner 中的 `<strong>` 視覺強度。
   - rose-400 按鈕 vs amber-400「重新測驗」配色區分是否清楚。
   - retry mode 與 sessionStorage / URL search param 的整合可能（針對風險點 1）。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-7-B 動工**（依 P3-7-A 11 條校正清單對 STARTERS_PART_TEMPLATES.md 校正）——文件層任務、低風險。
   - 路線 B：**P3-9-B 第一刀**（`starterSection` / `starterPart` / `skillFocus` 加 types + 7 題範例補 metadata）——schema 升級第一步。
   - 路線 C：**P3-6-B-4 第三刀**：把 retry state 加到 sessionStorage（不存 localStorage、不升 schemaVersion；避免 reload 時 retry 進度全失）；或把 retry answers 可選擇地合併回 session.answers（屬「再練習過的題目分數可疊加」進階模式）。
   - 路線 D：**P3-6-B-4 第四刀**：獨立 `/quiz/wrong` 路由 + `wrongQuestionIds` 升 schemaVersion 到 v2 + migration（最大改動）。
   - 路線 E：**P2-4C-2B-2 補真實音檔 / 補圖**。
4. **retry sessionStorage 升級**（建議下一輪做，若使用者反饋風險點 1）：用 `sessionStorage.setItem("csp:retry-session", JSON.stringify({ retryQuestionIds, retryAnswers, retryIndex, retrySubmitted }))` 在每次 retry state 變動時寫入；hydration 時優先讀 sessionStorage（與 localStorage session 並存、無 schema 衝突）。
5. **若使用者覺得 retry result 詳解卡片用原始試卷 index 過於跳躍**（風險點 5）：可加一個小註記在卡片頭部「（原試卷第 N 題）」字樣，明示對應關係。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪在 P3-6-B-4 加 3 條 ✅（從 3✅+3⬜ 升為 6✅+3⬜）；P3-6-B 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-6-B-4 錯題詳解與錯題複習**：6 條 ✅（filter / 數量 / 空狀態 / 再練習入口 / inline retry mode / 不新增路由不升 schemaVersion）+ 3 條 ⬜（獨立錯題複習頁 / wrongQuestionIds 升 v2 + migration / 錯題歷史紀錄）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C**：本輪未動。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅（第一版不計時）+ 1 條 ⬜（未來計時器）；本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住。
- 變更紀錄追加 2026-05-09 一筆。

P3 整體仍 🟡 進行中；P3-6-B 仍 🟡 進行中（B-1 / B-2 / B-3 完成、B-4 部分完成 6/9、B-5 部分完成）；**符合任務單「不要把 P3-6-B-4 整體標完成、不要把 P3-6-B 整體標完成、不要把 P3-6 整體標完成、不要把 P3 整體標完成」要求**。
