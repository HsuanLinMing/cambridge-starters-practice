# Claude Code 回報 · P2-4A 單字補強 + 詳情頁翻牌互動

任務日期：2026-05-07
任務性質：P2-4A 實作；不進入 P3、不新增 `/quiz` / 完整考卷 Session / localStorage 等任何 P3 功能。

## 【本輪修改摘要】

完成 P2-4A 兩件事：

1. **vocabulary 擴充至 54 筆**（從 12 筆 +42 筆）：覆蓋 17 個字母（A B C D E F G H J M O P R S T W Y）、全部 11 個分類；依字典序排列；無重複 id；schema 不變、沿用 placeholder image / audio path（既有 fallback 直接生效）。
2. **單字詳情頁加入翻牌互動**：在 `components/VocabularyCard.tsx` 新增 `revealMode?: boolean` prop（預設 false 保留 P2-1 行為），詳情頁傳 `revealMode` 啟用。初始隱藏 `translation` / `exampleEn` / `exampleZh`，由「🔍 看答案」按鈕翻開、「🙈 再想一次」按鈕收起；切換上一個 / 下一個時透過父層 `key={current.id}` remount 自動回到收起狀態。

文件同步：`PROJECT_ROADMAP.md` 將 P2-4 拆為 P2-4A（已完成）/ P2-4B（真實素材、補齊更多單字、category 補充模式，尚未開始）；`README.md` 更新「目前功能」（54 字 + 翻牌描述）；`docs/PRODUCT_SPEC.md` 在「單字複習主流程」第 3 步補一句翻牌設計與切換歸零行為。

`npm run lint` / `typecheck` / `build` 三項全綠，路由總數從 44 升至 86（26 letter + 54 word + 6 root），全部 SSG prerender。Dev smoke test 11 條路由 200，跨字母 prev/next（含 J→M 跨過 K/L 兩個無單字字母）正確，邊界（ant 上一個 / yellow 下一個）disabled 正確，dev log 無 hydration 警告、無 runtime error，`/` 與 `/quiz` 標題未變動。

## 【修改檔案清單】

修改：

- `data/vocabulary.json`：12 筆 → **54 筆**，依字典序重排。
- `components/VocabularyCard.tsx`：加 `revealMode?: boolean` prop 與 `revealed` state；初始 placeholder「先想想看，再翻開答案吧！」；翻牌按鈕用 `violet-400/500`（看答案）與 `slate-200` ring 白底（再想一次）。
- `app/review/word/[id]/page.tsx`：對 `<VocabularyCard>` 傳入 `revealMode`。
- `PROJECT_ROADMAP.md`：P2-4 拆為 P2-4A（3 條 ✅）/ P2-4B（4 條 ⬜）；變更紀錄追加 2026-05-07 一筆。
- `README.md`：「目前功能」段更新 `/review/word/[id]` 描述（含翻牌、自動收起）與單字數（12 → 54）。
- `docs/PRODUCT_SPEC.md`：「單字複習主流程」第 3 步補翻牌互動行為與切換歸零。
- `reports/claude_last_report.md`：本回報檔。

未動：`AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`、`docs/DATA_SCHEMA.md`、`AGENTS.md`、`CLAUDE.md`、`app/page.tsx`、`app/quiz/`、`app/review/page.tsx`、`app/review/letter/[letter]/page.tsx`、`components/CategoryTabs.tsx`、`components/VocabularyReview.tsx`、`components/EntryCard.tsx`、`components/BackToHome.tsx`、`lib/data.ts`、`lib/types.ts`、`lib/categories.ts`、`lib/vocabularyNavigation.ts`、`data/quizzes.json`、`public/`、`package.json`。

## 【核心邏輯說明】

### A. vocabulary 補強

策略：以 Cambridge Starters 常見主題為主，每個分類補 2~10 筆。54 筆分布：

| 分類 | 筆數 | 字 |
| --- | --- | --- |
| animals | 10 | ant, bird, cat, cow, dog, duck, fish, frog, horse, mouse |
| food | 9 | apple, banana, bread, cake, egg, milk, orange, rice, water |
| school | 8 | bag, book, chair, desk, pen, pencil, ruler, teacher |
| family | 6 | baby, boy, father, friend, girl, mother |
| colors | 6 | black, blue, green, red, white, yellow |
| numbers | 5 | one, two, three, four, five |
| body | 3 | eye, foot, hand |
| actions | 3 | jump, run, sit |
| home | 2 | door, house |
| weather | 1 | sun |
| other | 1 | tree |

字母覆蓋：A=2、B=9、C=4、D=4、E=2、F=7、G=2、H=3、J=1、M=3、O=2、P=2、R=4、S=2、T=4、W=2、Y=1，共 17 字母 ✅；I / K / L / N / Q / U / V / X / Z 仍 disabled（共 9 個），保留給 P2-4B 補齊。

例句皆自製短句（`I see a cat.` / `I drink milk.` / `Wash your hands.`），未引用任何官方歷屆原文。

排序：依英文 `word.localeCompare(..., "en")` 字典序（與 `lib/vocabularyNavigation.ts` 內部排序一致），方便人工維護。

### B. 翻牌互動

#### `revealMode` prop 設計

```tsx
type VocabularyCardProps = {
  item: VocabularyItem;
  /** revealMode 開啟時，初始隱藏中文翻譯與例句... */
  revealMode?: boolean;
};
```

**預設 false** 是有意設計：

- `<VocabularyReview>`（P2-1 時的元件，目前已不被頁面 import）若日後啟用「category 補充模式」（P2-4B 規劃），仍會拿到舊版「直接顯示全部」行為，不會被翻牌行為驚到。
- `/review/word/[id]/page.tsx` 明確傳入 `revealMode`，意圖清楚。

#### `revealed` state 重置策略

不在 `useEffect` 內監聽 `item.id` 變動 setState（會被 React 19 的 `react-hooks/set-state-in-effect` 規則擋下）。改用既有的父層 key remount：

```tsx
// app/review/word/[id]/page.tsx
<VocabularyCard item={nav.current} revealMode />
```

詳情頁是換 URL → page 重新渲染 → `<VocabularyCard>` 自然 unmount/mount → `useState(false)` 初始化 → `revealed` 自動回到 `false`。**沒有寫任何重置邏輯**，靠 React 元件生命週期。

#### Hydration 安全性

- `revealed` 初始值是純 `false`，不依賴任何 client-only API。
- SSR 與 client 第一次 render 結果一致（都顯示「看答案」按鈕、不顯示 translation / 例句）。
- 點擊「看答案」是 client onClick，純 client-side state update，無 mismatch。

實測 dev log 無 hydration warning。

#### 視覺與小一友善

- 「看答案」按鈕：`violet-400/500` 紫色，配 🔍 emoji，min-h-14（≥ 56px touch）。
- 「再想一次」按鈕：白底 `slate-200` ring，配 🙈 emoji，相同尺寸。兩態高度一致避免畫面跳動。
- 隱藏狀態下 translation 區塊用 `text-transparent` 顯示「？」保留同樣高度（`text-2xl ~ text-3xl`），避免翻牌時整張卡上下抖動。
- 例句區隱藏時顯示 placeholder「先想想看，再翻開答案吧！」（`text-slate-400` 暗色），維持區塊 visual mass。
- 翻牌按鈕只在 `revealMode === true` 時 render，未啟用時不會多出空 `<div>`。

### C. 文件同步策略

- **ROADMAP**：P2-4 拆為 P2-4A / P2-4B 兩個子分區。本輪 P2-4A 三條全部翻 ✅；P2-4B 四條維持 ⬜（真實圖片、真實音檔、補齊更多單字、category 補充模式）。**P2 整體仍 🟡 進行中**，因為 P2-4B 尚未開工——任務單明示不要把整個 P2 標完成。
- **README**：「目前功能」段內擴寫詳情頁描述為「中文意思、英文例句、中文例句**初始隱藏**，由『🔍 看答案』/『🙈 再想一次』按鈕翻牌顯示」，並更新單字數。
- **PRODUCT_SPEC**：在「單字複習主流程」第 3 步加一條翻牌互動描述，明示「切換到新單字時，翻牌狀態會自動回到『收起』」對齊實作。

## 【新增了哪些能力】

- 詳情頁支援**翻牌複習模式**：先看圖 + 英文 + 發音、按鈕翻看中文 + 例句，模擬「自我測試」的學習節奏，比一次顯示全部更有複習感。
- vocabulary 從 8 個有效字母升級到 **17 個字母覆蓋**（A 到 Y 跳著但連續），讓字母網格畫面更豐富、可演示更多跨字母 next 場景（J → M 已實測跨過 K / L）。
- 各 11 個分類都至少有 1 字，未來「category 補充模式」啟用後立即可用，不需先回頭補資料。
- `<VocabularyCard>` 的 `revealMode` prop 為日後可能新增的「測驗區看圖選字」「快閃複習卡」等情境提供同一個元件的兩種使用方式，避免重複實作。

## 【新增/調整測試】

無。任務單明確禁止導入測試框架。本輪以人工 smoke test（curl + grep）為驗收手段，覆蓋 11 條路由、4 個跨字母 next 案例、2 個邊界 disabled、SSR HTML 翻牌初始狀態。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：

  ```
  ▲ Next.js 16.2.5 (Turbopack)
  ✓ Generating static pages using 9 workers (86/86) in 267ms
  Route (app)
  ┌ ○ /  ├ ○ /_not-found  ├ ○ /quiz  ├ ○ /review
  ├ ● /review/letter/[letter]  (a..z 共 26)
  └ ● /review/word/[id]        (54 paths)
  ```

人工 smoke test（dev server + curl）：

| 驗證項 | 結果 |
| --- | --- |
| `/`、`/review`、`/quiz` 仍 200 | ✓ |
| `/review/letter/{a,b,c,y,z}` 全 200 | ✓（z 顯示「這個字母還沒有單字」溫和提示） |
| `/review/word/{ant,apple,baby,jump,yellow}` 全 200 | ✓ |
| `/review` 顯示 17 個 enabled 字母（aria-label 含單字數） | ✓（A=2、B=9、C=4、D=4、E=2、F=7、G=2、H=3、J=1、M=3、O=2、P=2、R=4、S=2、T=4、W=2、Y=1，合計 54） |
| `/review` 顯示 9 個 disabled 字母 | ✓ |
| 跨字母 next：apple → baby（A→B） | ✓ |
| 跨字母 next：jump → milk（J→M，跨過 K/L 無單字字母） | ✓ |
| 第一字 ant：上一個 disabled（aria-disabled span × 1） | ✓ |
| 最後字 yellow：下一個 disabled（aria-disabled span × 1） | ✓ |
| `/review/word/apple` SSR 翻牌**visible HTML** 不含 `<p>蘋果</p>` 與 `<p>I like a red apple.</p>` | ✓ 0 命中 |
| `/review/word/apple` SSR 含「看答案」按鈕（aria-label="顯示中文意思與例句"） | ✓ 1 命中 |
| `/review/word/apple` SSR 含 placeholder「先想想看，再翻開答案吧！」 | ✓ 1 命中 |
| `/review/word/apple` SSR 含發音按鈕（aria-label="播放 apple 的發音"） | ✓ 1 命中 |
| Dev log error / warn / hydration 訊息 | ✓ 全無 |

> **註**：SSR HTML 的 RSC payload（`<script>` 內的 React Server Component props 序列化）會包含完整 props 物件，因此 `grep -c '蘋果'` 整份 HTML 會命中 1。但 **visible HTML（`<p>` tag 內）不含 translation / 例句**，hydration 後 client 也仍以 `revealed=false` render，未洩漏答案。

## 【仍未處理】

- P2-4B 四條（真實圖片、真實音檔、補齊更多單字到 I/K/L/N/Q/U/V/X/Z、category 補充模式）。
- P3 6 個子階段全 ⬜，本輪不開工。
- P1 兩條可選 housekeeping。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。
- `docs/DATA_SCHEMA.md` 對 Question / Exam Session 型別擴充（屬 P3-1）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P2-4A 回歸驗收**：
   - 開瀏覽器確認 `/review/word/apple` 初始**畫面上**真的看不到「蘋果」與「I like a red apple.」（curl SSR 已驗證 visible HTML 不含；瀏覽器 client 端 hydration 後也應一致）。
   - 點「🔍 看答案」後 translation + 例句出現；點「🙈 再想一次」後收起。
   - 點「下一個」後 baby 頁初始仍是收起狀態，不殘留 apple 的翻牌狀態。
   - `/review` 字母網格 17 個 enabled、9 個 disabled，視覺上 disabled 字母明顯淡化、不可點。
   - jump → milk 跨字母（K / L 無單字）在瀏覽器點下一個確實跳到 milk。
2. **P2-4B 建議優先序（請 ChatGPT 收斂）**：
   1. **補單字到 I / K / L / N / Q / U / V / X / Z**：只要每字母 1~2 字（建議 ice cream / kid / lion / nose / queen / umbrella / very / box / zoo 等小一可懂的字），就能讓 26 個字母全 enabled。Q / X / Z 要小心選不會太冷僻的字。
   2. **真實素材**：先 TTS 自製音檔（macOS `say -o file.mp3` 最快），再自繪或生成 256×256 PNG。建議從最常用的 10 字（apple / cat / dog / book / red / blue / one / two / mother / father）開始。
   3. **翻牌互動的小型 A/B 試驗**：實際給家中小朋友用，看「看答案」按鈕被點的時機是「真的回想完」還是「直接點開」；若多半直接點開，可考慮加一個小延遲或「先看 3 秒」提示。本輪僅做最小可用版，不過度設計。
   4. **category 補充模式**：若使用後覺得 A~Z 模式以外還需要「以分類複習」，再啟用 `<VocabularyReview>` + `<CategoryTabs>`（本輪未動，仍可 typecheck）；建議掛在 `/review/by-category` 路徑，與主流程分開。
3. **`<img>` 改回 `next/image` 的時機**：等 P2-4B 真實圖片就位（建議至少 10 字有真圖）後再評估，本輪維持 `<img>` 因為素材未齊。
4. **可選優化**（**本輪未做**）：翻牌按鈕加一個輕微 `transition` 動畫（例如 translation 段 fade-in）。但任務單明示「不要做大型動畫」，目前的 hover transition 已經足夠；fade 如要加，建議 200ms 內、`opacity` 屬性即可，不要做 3D flip。
5. **navigation helper 擴充建議**：若 P3 quiz 結算頁要顯示「答錯題目所屬字母」，可在 `lib/vocabularyNavigation.ts` 加 `getLetterForId(id)` 純函式而非各處重算。本輪不動。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際翻牌：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中（P2-4B 尚未開工，**請暫不要把 P2 整體標 ✅**）。
  - ✅ **P2-4A 單字補強 + 詳情頁翻牌互動（本輪 3 條全翻）**：
    - vocabulary 擴充至 54 筆
    - `VocabularyCard` 新增 `revealMode` prop
    - `/review/word/[id]` 啟用翻牌（含切換歸零）
  - ⬜ **P2-4B 真實素材與後續強化**：4 條 ⬜（真實圖片、真實音檔、補齊更多單字、category 補充模式）。
  - P2-1 / P2-2 / P2-3 維持 ✅。
- ⬜ **P3**：仍「⬜ 規劃中」，6 個子階段全 ⬜，未開工。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」，未動。
- ➕ **目前明確不做**：未動，本輪未引入登入 / 後端 / 資料庫 / 雲端同步 / 付費 / 部署 / 測試框架 / 新依賴 / 真實素材。
- 變更紀錄追加 2026-05-07 一筆。

P2 整體未完成，**符合任務單「P2 整體是否完成請依 P2-4 是否還有未完成項目判斷」「不要把 P3 標成進行中」要求**。
