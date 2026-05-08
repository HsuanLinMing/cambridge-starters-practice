# Claude Code 回報 · P3-6-B-4 第一刀：結果頁錯題 / 未作答篩選

任務日期：2026-05-09
任務性質：**程式碼實作**——P3-6-B-4 第一刀（結果頁 inline filter）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只做結果頁 inline filter；**未做** 獨立錯題複習頁 / `/quiz/wrong` 路由 / `wrongQuestionIds` 持久化 / 正式歷史紀錄頁 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler；**未動** `lib/types.ts` / `data/*.json` / `lib/examSessionStorage.ts`；未升 `QUIZ_SESSION_SCHEMA_VERSION`；未新增依賴 / 處理 npm audit；未部署、未新增後端 / DB / 登入。

## 【本輪修改摘要】

`/quiz` 結果頁加「全部 / 只看錯題 / 只看未作答 / 需要再練習」inline filter——4 個 chip buttons 排在「每題詳解」標題下方，每個 chip 右側內嵌 count badge（amber selected / white unselected）；篩選結果為空時顯示 emerald 系友善空狀態提示。`components/QuizPlay.tsx` 在 file scope 新增 `DetailFilter` type + `FILTER_LABELS` + `FILTER_ORDER` + `EMPTY_STATE_MESSAGES`；ResultView 內加 `useState<DetailFilter>("all")`、一次計算 statuses 陣列、4 個 count、filter 過濾邏輯。

`PROJECT_ROADMAP.md` P3-6-B-4 從 ⬜ 升為 🟡 進行中（3 條 ✅：filter / 數量 / 空狀態 + 3 條 ⬜：再練習錯題入口 / 獨立錯題複習頁 / wrongQuestionIds）；P3-6-B 整體仍 🟡 進行中。`README.md` `/quiz` 條目補結果頁篩選段。

零依賴新增、未升 schemaVersion、未動 localStorage schema、未動 `lib/types.ts` / `data/*.json`、filter 純 React local state（不存 localStorage、重整後回預設 all）。`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全綠。

## 【修改檔案清單】

修改 4 份：

- `components/QuizPlay.tsx`：
  - 新增 `DetailFilter` type 4 個值（all / incorrect / unanswered / review）。
  - 新增 `FILTER_LABELS` / `FILTER_ORDER` / `EMPTY_STATE_MESSAGES` 三個 file-level const。
  - ResultView 內加 `useState<DetailFilter>("all")` + 一次計算 statuses 陣列 + 4 個 count（correctCount 仍計算供統計用）+ filterCounts record + filteredStatuses 過濾邏輯。
  - 「每題詳解」標題下方插入 4 個 filter chip buttons（flex-wrap + center + amber-300 selected / white unselected + 內嵌 count badge）。
  - 篩選結果為空時改 render emerald 系空狀態卡片（含對應 friendly message）；非空時 render filteredStatuses 為 QuestionDetailCard list（保留原 index 顯示「第 N 題」對齊整份試卷編號）。
- `PROJECT_ROADMAP.md`：P3-6-B-4 從 ⬜ 升為 🟡（3 條 ✅ + 3 條 ⬜，附說明 sub-text 說明本輪邊界）；變更紀錄追加 2026-05-09。
- `README.md`：「目前功能」`/quiz` 條目補結果頁 4 個 filter chip + count badge + 空狀態提示段。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / 任何 `app/*` 路由（含 `app/quiz/page.tsx`）/ `components/PicturePractice.tsx` / `VocabularyCard.tsx` / `ReviewHubCard.tsx` / `BackToHome.tsx` / 所有 docs / source_materials / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. `DetailFilter` 4 個字串字面量 + 4 個 chip + 4 個 count

```ts
type DetailFilter = "all" | "incorrect" | "unanswered" | "review";

const FILTER_LABELS: Record<DetailFilter, string> = {
  all: "全部",
  incorrect: "只看錯題",
  unanswered: "只看未作答",
  review: "需要再練習",
};
```

`review = incorrect ∪ unanswered`——刻意用集合語意而非另一個獨立狀態，因為 `getQuestionStatus` 仍是三態（correct / incorrect / unanswered）。filter 過濾邏輯在 ResultView 中：

```ts
const filteredStatuses = statuses.filter((s) => {
  if (detailFilter === "all") return true;
  if (detailFilter === "incorrect") return s.status === "incorrect";
  if (detailFilter === "unanswered") return s.status === "unanswered";
  return s.status === "incorrect" || s.status === "unanswered"; // review
});
```

不在 `getQuestionStatus` 加第四個狀態 `review`——避免污染既有「答對 / 答錯 / 未作答」三態語意。

### 2. statuses 陣列一次計算共用

```ts
const statuses = questions.map((q, i) => ({
  question: q,
  index: i,
  status: getQuestionStatus(q, answers[q.id]),
}));
```

之前 P3-6-B-3 ResultView 跑兩次 filter 計算 correctCount / answeredCount。本輪改為先 map 出 statuses，再對 statuses 跑 5 次 filter（correctCount / incorrectCount / unansweredCount / filterCounts.review = incorrect+unanswered + filteredStatuses）——`getQuestionStatus` 仍只跑一次（每題）。perf 對 7 題完全沒問題，且讓 filter / count 邏輯一致。

`statuses` 元素含原始 `index`，filter 後 QuestionDetailCard 仍取原 index 渲染「第 N 題」。**重要**：如果使用者選「只看錯題」，可能看到「第 2 題」+「第 5 題」+「第 7 題」(skip 第 1/3/4/6)——這是預期行為，讓家長看到的編號對齊整份試卷。

### 3. 空狀態三段友善提示

```ts
const EMPTY_STATE_MESSAGES: Record<DetailFilter, string> = {
  all: "目前沒有題目。",
  incorrect: "太棒了，目前沒有答錯的題目！",
  unanswered: "很好，這次每一題都有作答！",
  review: "全部都很棒，這次沒有需要再練習的題目！",
};
```

`all` 的訊息「目前沒有題目。」屬 edge case（總題數 0），實務上 `/quiz` 會在 QuizPlay 主元件層先擋下（顯示「目前沒有題目，請稍後再來。」），不會走到 ResultView 的 all 空狀態。為了 type 完整覆蓋仍列出。

訊息均符合 PRODUCT_SPEC「測驗與考前練習方向 → 講解語氣小一友善」+「鼓勵 > 懲罰」原則。

### 4. chip button 視覺與互動

```tsx
<button
  type="button"
  onClick={() => setDetailFilter(key)}
  aria-pressed={selected}
  className={
    "flex min-h-10 items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold shadow-sm transition focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-200 sm:text-sm " +
    (selected
      ? "bg-amber-300 text-slate-900 ring-2 ring-amber-400"
      : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50")
  }
>
  <span>{FILTER_LABELS[key]}</span>
  <span className={...badge styles...}>{filterCounts[key]}</span>
</button>
```

aria-pressed 切換給螢幕閱讀器使用；focus-visible ring 給鍵盤使用者；count badge 使用更小的字級（11px black）+ 內嵌底色（selected 時 amber-100 / unselected 時 slate-100）以視覺區分標籤與數字。

### 5. filter 不存 localStorage（純 React local state）

依任務單明示「filter 不需要保留，重整後回到預設 all 可接受」。`useState` 在 ResultView 內，重整時 ResultView 重新 mount（因為 QuizPlay 的 hydration 會先渲染題目卡再切到結果頁）→ filter reset 為 "all"。

不存 localStorage 的好處：
- 不用升 `QUIZ_SESSION_SCHEMA_VERSION`。
- 不用寫 migration。
- 不污染 session schema（filter 是 view-state、不是作答資料）。

### 6. 沒做的事（嚴守任務單禁止清單）

- 沒新增 `/quiz/wrong` 路由
- 沒做錯題複習獨立頁
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
| `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 直接交卷 / 重新測驗 | ✓ |
| 首次進入不含「每題詳解」/ 4 個 filter label / 空狀態提示文字（submitted=false 時 ResultView 不渲染、字串只在 client JS chunk 內） | ✓ |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn 訊息 | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + lint / typecheck / build）通過。

需要使用者瀏覽器互動驗收：

1. **作答幾題後直接交卷**：先答 1~2 題（故意答錯一題、答對一題），其餘留空。按 amber「📝 直接交卷」。
2. **「全部」filter 顯示 7 題**：預設 selected 是「全部 7」（amber 配色）。下方詳解列表顯示 7 張卡片（含答對 / 答錯 / 未作答各狀態）。
3. **「只看錯題」只顯示 incorrect 題**：點「只看錯題 X」chip → 切到 amber selected → 詳解列表只顯示 rose 系卡片。卡片標題仍是原始「第 N 題」（不重新編號）。
4. **「只看未作答」只顯示 unanswered 題**：點「只看未作答 Y」chip → 切到 amber selected → 詳解列表只顯示 amber 系卡片。
5. **「需要再練習」顯示 incorrect + unanswered**：點「需要再練習 Z」chip → 詳解列表顯示 rose + amber 系卡片混合（依原始順序）。
6. **全對時的友善空狀態**：作答全部 7 題、全部答對、按下一題完成。在「只看錯題 0」/「只看未作答 0」/「需要再練習 0」filter 下應分別看到：
   - 只看錯題：「太棒了，目前沒有答錯的題目！」（emerald 系）
   - 只看未作答：「很好，這次每一題都有作答！」（emerald 系）
   - 需要再練習：「全部都很棒，這次沒有需要再練習的題目！」（emerald 系）
7. **重新整理結果頁仍保留結果頁**：在結果頁按 F5 → 應仍在結果頁、詳解列表完整顯示。
8. **filter 重整後回預設 all**：F5 後 filter 應回到「全部」（依任務單明示「filter 不需要保留，重整後回到預設 all 可接受」）。
9. **重新測驗仍清 session**：在結果頁按「🔁 重新測驗」→ localStorage 應清空 + 回第一題。
10. **既有路由回歸**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常、翻牌功能、看圖練習互動皆無破壞。

預期結果頁範例（用 P3-1 範例 7 題、答對 2 題、答錯 1 題、未作答 4 題）：

```
🎉 完成了！
答對 2 / 7 題
已作答 3 / 7    未作答 4 題
未作答的題目算錯；下次可以再試試看～
做得不錯，再多練幾次會更厲害！

每題詳解
[全部 7]  [只看錯題 1]  [只看未作答 4]  [需要再練習 5]
        ↑ amber selected

(列表 7 張卡片：emerald / rose / amber 三色混合)

[🔁 重新測驗]
回首頁
```

按「需要再練習 5」chip：

```
[全部 7]  [只看錯題 1]  [只看未作答 4]  [需要再練習 5]
                                        ↑ amber selected

(列表 5 張卡片：1 張 rose + 4 張 amber)
```

按「只看錯題 1」chip：

```
[全部 7]  [只看錯題 1]  [只看未作答 4]  [需要再練習 5]
          ↑ amber selected

(列表 1 張 rose 卡片)
```

## 【仍未處理】

- **P3-6-B-4 後續刀數**：
  - 「再練習錯題」入口（把錯題撈出來重做一輪）。
  - 錯題複習頁可獨立進入（屬下一刀，需新路由 `/quiz/wrong`）。
  - 錯題狀態於 localStorage 保存（`wrongQuestionIds` 對齊 `ExamSessionState`，需升 `QUIZ_SESSION_SCHEMA_VERSION = 2` + 寫 migration）。
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

1. **filter 不存 localStorage 的取捨**：依任務單明示「重整後回到預設 all 可接受」，本輪刻意不存。**潛在不便**：使用者在「只看錯題」狀態下重整，會跳回「全部」——若使用者反饋此體驗，下一輪可考慮把 filter 存 sessionStorage（不存 localStorage 因為跨 tab 同步沒意義）或加入 URL search param `?filter=incorrect`。
2. **filter 過濾後 index 仍是原始順序**：QuestionDetailCard 顯示「第 N 題」用原始 index（即使 filter 後也保持原始編號）。**好處**：家長看到「第 5 題」就知道是試卷第 5 題。**壞處**：filter 後序列不連續（看到「第 2 題、第 5 題、第 7 題」）。設計選擇——**對家長友善 > 對使用者連續**。
3. **「review」filter 與「需要再練習」中文標籤的設計取捨**：本輪沿用任務單建議 `review` 字串字面量 + 「需要再練習」中文標籤。**review 是英文 schema、需要再練習是 UI 文案**——兩者有意分離。未來若新增 `mistakes` / `gaps` 等更精細分類，schema 仍可保持 4 個值。
4. **「需要再練習」count 與「答對」count 的視覺權重**：上半部統計只顯示 「答對 / 已作答 / 未作答」三個數字；下方 chip 只顯示 「全部 / 錯題 / 未作答 / 需要再練習」。**「答對」與「需要再練習」視覺上是互補關係**——家長可能會想「答對 = total - 需要再練習」？實際是「答對 + 需要再練習 = total」（matching 完成的算 correct）。本輪不在 chip 加「答對 X」chip 避免重複；若使用者反饋疑惑，可在 README 或 PRODUCT_SPEC 補充說明。
5. **chip 在小螢幕的擠壓風險**：4 個 chip 在 <360px 螢幕用 flex-wrap 會自然換行（最多 2 行）。Tailwind `flex-wrap items-center justify-center gap-2`已就位。**Codex 驗收時建議在 iPhone 12 mini 視覺檢查**。
6. **getQuestionStatus 的 matching 處理**：matching 完成後（answer = `_done`）算 `correct`，不出現在 review。**任務單明示**「matching 完成後算 correct，不應出現在 review」。本輪實作正確。**但**：matching 未完成時算 unanswered（會出現在 review），這是合理的。
7. **空狀態提示「太棒了，目前沒有答錯的題目！」與全對 cheer 文案重疊**：當使用者全對且按「只看錯題」chip → 看到 emerald「太棒了…」；上半部 cheer 也是 emerald「全部答對！太厲害了！🎉」。**雙重慶祝**——對小一友善但可能略顯冗餘。本輪沿用任務單建議文案。
8. **chip 數字 badge 與「答對」雙欄統計的重複**：上半部「未作答 N」+ chip「只看未作答 N」+「需要再練習 N+M」。**N 出現兩次**（上半部 + chip），略重複。本輪保留兩處——上半部給整體統計、chip 給 filter 互動入口。Codex 驗收時若覺得擠，可在後續刀數合併。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」10 個檢核點在 Mac + 平板區網 IP 上跑。重點：流程 3~5（三個 filter chip 切換），流程 6（全對時三個空狀態），流程 8（filter 重整後回 all），流程 10（既有路由回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 4 個 chip 在不同螢幕寬（手機 / 平板 / 桌機）的視覺對齊。
   - chip aria-pressed 切換是否被螢幕閱讀器正確讀出。
   - matching 完成後在「需要再練習」中是否正確被排除。
   - filter 切換時的 React re-render 是否平順（無 flash）。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-6-B-4 第二刀**——加「再練習錯題」按鈕（在 review filter 下顯示，按下重新進 quiz、`questionOrder` 只含錯題與未作答題）；不需要新路由、不需要升 schemaVersion。
   - 路線 B：**P3-7-B 動工**（依 P3-7-A 11 條校正清單對 STARTERS_PART_TEMPLATES.md 校正）。
   - 路線 C：**P3-9-B 第一刀**（`starterSection` / `starterPart` / `skillFocus` 加 types + 7 題範例補 metadata）。
   - 路線 D：**P3-6-B-4 第三刀**——獨立 `/quiz/wrong` 路由 + `wrongQuestionIds` 升 schemaVersion 到 v2 + migration（最大改動）。
   - 路線 E：**P2-4C-2B-2 補真實音檔 / 補圖**。
4. **filter URL search param**（建議下一輪做）：把 filter 寫入 `?filter=incorrect` 等 query，讓重整或分享連結時保留 filter 狀態。實作成本低（useSearchParams + useRouter），體驗大幅提升。
5. **filter sessionStorage**（替代方案）：若不想用 query string，可考慮 sessionStorage 保存 filter（單個分頁的 lifecycle）；不污染 localStorage 也不需 schemaVersion 升級。
6. **加「答對」chip 補對稱性**：若使用者反饋「為什麼有錯題 chip 沒答對 chip」，可在後續刀數加 `correct` 第五個 filter 值；schema 字面量擴張為 5 個。但要注意這可能讓 chip 排版擠在小螢幕。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪只升 P3-6-B-4 從 ⬜ → 🟡（3 條 ✅ + 3 條 ⬜）；P3-6-B 整體仍 🟡（B-5 仍 1 條 ✅ + 1 條 ⬜）。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-6-B-4 錯題詳解與錯題複習**（升為 🟡）：3 條 ✅（filter / 數量 / 空狀態）+ 3 條 ⬜（再練習錯題入口 / 獨立錯題複習頁 / wrongQuestionIds）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C**：本輪未動。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅（第一版不計時）+ 1 條 ⬜（未來計時器）；本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住。
- 變更紀錄追加 2026-05-09 一筆。

P3 整體仍 🟡 進行中；P3-6-B 仍 🟡 進行中（B-1 + B-2 + B-3 完成、B-4 部分完成、B-5 部分完成），**符合任務單「不要把 P3-6-B-4 整體標完成、不要把 P3-6-B 整體標完成、不要把 P3-6 整體標完成、不要把 P3 整體標完成」要求**。
