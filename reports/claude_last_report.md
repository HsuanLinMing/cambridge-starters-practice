# Claude Code 回報 · P2-4B 小修：複習中心移除考題練習主卡

任務日期：2026-05-07
任務性質：P2-4B 小修，**不進入 P2-4C，不進入 P3**。

## 【本輪修改摘要】

依使用者重新確認的產品分工（`/review` 負責分項能力練習、`/quiz` 負責完整考卷）做兩件事：

1. **移除 `/review` 複習中心的「考題練習」主入口卡**：原 6 卡 → 5 卡。新增頁面底部小型輔助提示「想做完整考卷？請到 測驗區 →」連到 `/quiz`，視覺層級明顯低於 5 張主卡（slate-500 文字、無卡片框、無 emoji）。`/quiz` 仍維持骨架未動。
2. **修 Codex 指出的文件同步問題**：`docs/PRODUCT_SPEC.md` 第 112 行「單字複習主流程」第 2 步原寫「返回 `/review` 的按鈕」，現實作已是返回 `/review/words`，本輪文件對齊。

文件同步：
- `docs/PRODUCT_SPEC.md`「主要功能（願景）」段重寫，明示 `/review` ↔ `/quiz` 分工，把複習區從「6 入口」改為「5 主入口 + 底部輔助提示」。
- `README.md`「目前功能」段對齊（5 張主卡 + 底部輔助提示）。
- `PROJECT_ROADMAP.md` P2-4B 條目從 6 主入口改為 5 主入口 + 1 底部提示；P2-2 歷史條目補一句「後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`」註記；變更紀錄追加 2026-05-07 一筆。

`npm run lint` / `typecheck` / `build` 三項全綠，路由總數仍 87。Dev smoke test 8 條路由 200，無 hydration / runtime error。

## 【修改檔案清單】

修改：

- `app/review/page.tsx`：
  - 移除 6 張卡中的「考題練習」（原 ready 卡連 `/quiz`）。
  - 5 張主卡仍用同一個 grid（`sm:grid-cols-2`，因為 5 卡仍可在 2 欄佈局排得勻稱：3+2 或單欄堆疊）。
  - 新增 `<aside>` 區塊：`mt-10` 與主卡片區拉開距離、`text-center text-sm text-slate-500` 字級小、淺色；提示文案「想做完整考卷？請到 測驗區 →」，「測驗區」用 `<Link href="/quiz">` 包裹，font-semibold 加粗 + underline-offset hover 才出現底線，避免太搶。
  - 新增 `import Link from "next/link";`。
- `docs/PRODUCT_SPEC.md`：
  - 「主要功能（願景）」段整段重寫，**段首明示 `/review` ↔ `/quiz` 分工**，列出 5 個複習主入口（單字 / 看圖 / 聽力 / 句型 / 位置 · 顏色 · 數量），明示「考題練習不再列為複習中心的主入口卡片；複習中心可在底部放一個小型輔助提示連到 `/quiz`，但視覺層級低於 5 張主卡片。」測驗區段補列「完整考卷 Session、交卷評分、錯題紅色標示、簡單講解、再練習錯題」。
  - 「單字複習主流程」第 2 步空字母 fallback 描述：返回路徑從 `/review` → `/review/words`（**修 Codex 指出的文件同步問題**）。
- `README.md`「目前功能」第 2 條（`/review`）：
  - 從「6 個入口卡」改為「5 張主入口卡」。
  - 移除「考題練習」字樣。
  - 補一句「頁面底部另有一個小型輔助提示連到 `/quiz` 測驗區，視覺層級低於 5 張主卡，避免讓人誤把考卷功能當成複習中心主功能」。
- `PROJECT_ROADMAP.md`：
  - P2-2 條目「`/review` 主入口改為 A~Z 字母網格」補一句註記：「（後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`，`/review` 改為複習中心首頁）」。
  - P2-4B 區塊新增前言註解：「`/review` 與 `/quiz` 分工：`/review` 複習中心**只負責分項能力練習**；考卷、歷屆 / sample 題、AI 仿真題、交卷評分等屬 `/quiz` 測驗區。複習中心可在頁面底部放一個低視覺層級的輔助提示連到 `/quiz`，但不作為主入口卡。」
  - P2-4B 第 1 條「6 個入口卡」→「5 張主入口卡」。
  - P2-4B 第 7 條從「考題練習入口連到 `/quiz`」改為「底部輔助提示『想做完整考卷？請到測驗區。』連到 `/quiz`（**視覺層級低於主入口卡**，避免讓人誤把考卷功能當成複習中心主功能；`/quiz` 仍維持骨架，本輪未動）」。
  - 變更紀錄追加 2026-05-07 一筆描述本輪小修。
- `reports/claude_last_report.md`：本回報檔。

未動：`AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`、`docs/DATA_SCHEMA.md`、`AGENTS.md`、`CLAUDE.md`、`app/page.tsx`、`app/quiz/page.tsx`、`app/review/words/page.tsx`、`app/review/letter/[letter]/page.tsx`、`app/review/word/[id]/page.tsx`、所有 `components/*`（含 `ReviewHubCard`）、所有 `lib/*`、`data/vocabulary.json`、`data/quizzes.json`、`public/`、`package.json`。

## 【核心邏輯說明】

### 1. 為何「考題練習」不能留在 `/review` 主卡

從產品分工看，`/review` 與 `/quiz` 負責的學習動作根本不同：

| 路由 | 負責 | 一次操作的範圍 |
| --- | --- | --- |
| `/review` 複習中心 | **分項能力練習**：背單字、看圖、聽力、句型 | **單一題型 / 單一字** 反覆練 |
| `/quiz` 測驗區 | **完整考卷體驗**：sample / 歷屆 / AI 仿真整份卷 | **整份考卷** + 評分 |

如果 `/review` 主卡同時放「考題練習」連到 `/quiz`，會造成兩個誤解：
1. 小朋友以為「考題練習」是另一種**分項能力**（其實是完整考卷模式）。
2. 開發者 / Codex 以為 `/review` 與 `/quiz` 在做同一件事，未來可能 implementations 互相滲透（例如把 Session 邏輯放進 `/review`）。

把考題練習從 `/review` 主卡移除是**規格層的硬切**，不是 UI 層偷工。

### 2. 為何要保留底部「輔助提示」

完全拿掉「`/review` → `/quiz`」的指向也不理想——小朋友複習完一輪、想立刻測一下，從複習中心可直接過去比較順。所以：

- **保留**：底部小型 `<aside>` 提示「想做完整考卷？請到 測驗區 →」。
- **降階處理**：
  - 不是卡片：純文字 + inline link，沒有 border、shadow、emoji、card padding。
  - 視覺層級：`text-sm text-slate-500`（vs 主卡的 `text-xl font-bold text-slate-900`）。
  - 距離：`mt-10` 與主卡 grid 拉開距離，明確不屬於同一視覺群組。
  - link 樣式：`font-semibold text-slate-700 underline-offset-2 hover:underline`——明顯可點但不喧賓奪主。

這個設計呼應 PRODUCT_SPEC 新文「視覺層級低於 5 張主卡片」的硬要求，可被未來 Codex 驗收引述。

### 3. 為何 5 卡仍用 `sm:grid-cols-2` 而非改成 3 欄

原本 6 卡 2 欄是 3+3 平均；改 5 卡 2 欄變成 3+2（最後一卡單獨佔一格、右側留白）。考慮過：

- **改 3 欄**（`sm:grid-cols-3`）：5 卡會變 3+2，但因為螢幕寬度不固定、3 欄在小型平板上每張卡會太窄。
- **改 5 欄**（`sm:grid-cols-5`）：每張卡太瘦，文字會擠。
- **保留 2 欄**：3+2 在視覺上沒問題（最後一卡左對齊），且未來新增 1 個複習類型（例如 P2-4C 補上「主題單字」）就重新變回 6 卡 2 欄 3+3。**為了未來新增方便，2 欄是最不需要再改的選擇**。

最終決定：保留 `sm:grid-cols-2`，視覺上 3+2，可接受。

### 4. PRODUCT_SPEC「主要功能（願景）」整段重寫的理由

原版主要功能段把 `/review`、`/quiz`、模擬考、進度記錄混在同一個 bullet list，分工不明顯。本輪重寫成：

```
## 主要功能（願景）

[段首明示 /review ↔ /quiz 分工 + 兩條規則]

### 複習區（/review）：5 個主入口
[5 條 bullet]
[底部輔助提示說明]

### 測驗區（/quiz）
[列出考卷 Session 等內容]

### 模擬考
[既有內容]

### 進度記錄（本地）
[既有內容]
```

把 `/review` 與 `/quiz` 用三級標題拆開，更難混淆。「考題練習不再列為複習中心的主入口卡片」這條用粗黑字明寫，給未來 Codex 驗收一條可援引的條文。

### 5. 「空字母頁返回路徑」修正

PRODUCT_SPEC 第 112 行原寫：

> 若該字母沒有單字（理論上不會走到這條路），顯示溫和提示與返回 `/review` 的按鈕。

但 `/review/letter/[letter]/page.tsx` 上輪已改為返回 `/review/words`（避免使用者多走一步）。本輪把文件對齊：

> 若該字母沒有單字（理論上不會走到這條路），顯示溫和提示與返回 `/review/words` 的按鈕。

實作驗證：`/review/letter/z`（z 無單字）SSR HTML 含 2 個 `href="/review/words"`（頂部返回 link + 空字母 fallback 按鈕），與文件一致。

### 6. ROADMAP P2-2 註記

P2-2 條目「`/review` 主入口改為 A~Z 字母網格」這句寫於 P2-2 完成當下、但已於 P2-4B 過時。如果讀者只看 P2-2 條目可能誤以為「現在 `/review` 仍是 A~Z 字母網格」。本輪在條目末尾補一句註記：

> （後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`，`/review` 改為複習中心首頁）

不改 P2-2 條目本體（保留歷史紀錄），只補註記。下一輪 ROADMAP 整理時可決定是否進一步精簡。

### 7. 沒動的東西

- **`/quiz` 完全沒動**——任務單明示。
- **路由總數沒變**（仍 87）：本輪只調整 `/review` 渲染內容，未新增 / 刪除路由。
- **ReviewHubCard 元件沒動**：本輪只在 `/review` 頁面少 render 一個 `<ReviewHubCard>`，元件本身不需要修改。
- **`/review/words`、`/review/letter/[letter]`、`/review/word/[id]` 都沒動**：本輪只動 `/review` 頂層頁面與 PRODUCT_SPEC 的一行返回路徑文字。

## 【新增了哪些能力】

- 規格層首次有「**`/review` ↔ `/quiz` 分工**」可援引條文，未來 Codex 驗收 / ChatGPT 收斂任務時可直接引述。
- `/review` 視覺層級乾淨：5 張同級主卡 + 1 個明顯次級的底部提示，小朋友一眼就能分辨「主要要做的事」與「另一個地方還有東西可以做」。
- ROADMAP P2-2 歷史條目補註記後，**閱讀 ROADMAP 不再需要從頭看到 P2-4B 才理解現在 `/review` 不是字母網格**——P2-2 條目就先預告了這層演進。
- 文件三方對齊（PRODUCT_SPEC / ROADMAP / README）：5 主入口 + 底部輔助提示在三處一致。

## 【新增/調整測試】

無。任務單明確禁止導入測試框架。本輪以 curl + grep 人工 smoke test 為驗收。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：

  ```
  ▲ Next.js 16.2.5 (Turbopack)
  ✓ Generating static pages using 9 workers (87/87) in 211ms
  Route (app)
  ┌ ○ /  ├ ○ /_not-found  ├ ○ /quiz  ├ ○ /review
  ├ ● /review/letter/[letter]  (a..z 共 26)
  ├ ● /review/word/[id]        (54 paths)
  └ ○ /review/words
  ```

  87 條路由不變、全部 SSG / Static prerender。

人工 smoke test（dev server + curl）：

| 驗證項 | 結果 |
| --- | --- |
| `/`、`/quiz` 200 + 標題未動 | ✓ |
| `/review` 200 | ✓ |
| `/review` 含「單字複習」「看圖練習」「聽力練習」「句型練習」「位置 / 顏色 / 數量」5 個主卡片標題 | ✓ 各 1 命中 |
| `/review` **不再含**「考題練習」 | ✓ 0 命中 |
| `/review` 含「想做完整考卷？請到」+「測驗區」底部提示文字 | ✓ 各 1 命中 |
| `/review` 的 `href="/quiz"` 只有 1 個（在 aside 內，不在 ReviewHubCard 主卡內） | ✓（aside 內 1 個、主卡內 0 個） |
| `/review/words` 200，「回複習中心」link、17 enabled 字母 | ✓ |
| `/review/letter/a` 200，「回單字複習」link 指向 `/review/words` | ✓ |
| `/review/letter/z` 空字母 fallback：「這個字母還沒有單字」+「回單字複習」按鈕 + 2 個 `href="/review/words"`（頂部 link + fallback 按鈕） | ✓ |
| `/review/word/apple` visible HTML 不含 `<p>蘋果</p>`、含「看答案」按鈕、跨字母 prev=ant / next=baby | ✓ |
| Dev log error / warn / hydration | ✓ 全無 |

## 【仍未處理】

- P2-4C 8 條（真實圖片 / 真實音檔 / 補齊更多單字 / 4 個複習類型實作 / category 補充模式）。
- P3 6 個子階段全 ⬜，本輪不開工。
- P1 兩條可選 housekeeping。
- `npm audit` 兩個 moderate 警告。
- `docs/DATA_SCHEMA.md` 對 Question / Exam Session 型別擴充（屬 P3-1）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P2-4B 小修回歸**：
   - 開瀏覽器確認 `/review` 視覺：5 張同級主卡 + 底部單行提示，提示「測驗區 →」可點到 `/quiz`，但**外觀明顯不像**主卡。
   - 點 4 個 coming-soon 卡片：應**完全無法**進入。
   - `/review/letter/z`（或任何空字母）的「回單字複習」按鈕回到 `/review/words` 而非 `/review`。
   - 文件三方對齊：PRODUCT_SPEC / ROADMAP / README 的「`/review` 5 主入口」描述一致。
2. **下一輪實作建議**（請 ChatGPT 收斂 P2-4C 任務單）：
   - 路線 A：補單字到 I / K / L / N / Q / U / V / X / Z 讓字母網格 26 字母全 enabled。
   - 路線 B：先做「看圖練習」實作（最接近真實考試的 Reading & Writing 第一題型），用既有 54 筆 vocabulary + 簡單看圖選字流程，把第一個 coming-soon 卡片點亮。
   - 路線 C：先做 TTS 音檔（macOS `say -o`）+ 「聽力練習」實作。
3. **底部提示文案微調建議**（**本輪未做**，列入觀察）：目前是「想做完整考卷？請到 測驗區 →」。觀察小朋友實際使用後若家長覺得語氣太正式，可考慮：「想試試看完整考卷嗎？去 測驗區 看看 →」之類更口語的版本。本輪不過度設計。
4. **`<aside>` 與 SEO / a11y**：當前 `<aside>` 用法符合 HTML5 語意（次要相關內容），對輔助科技友善。如果 P2-4C 之後 `/review` 內容變多，可再評估是否要加 `aria-label="去測驗區"` 之類的輔助標籤。
5. **不要把 `<aside>` 升級成卡片**：若未來討論「底部提示是不是也該加 emoji / border」，請先回 PRODUCT_SPEC「主要功能（願景）」段「視覺層級低於主卡」這條條文檢查，避免逐步漂移回「6 卡」。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中（P2-4C 尚未開工）。
  - ✅ **P2-2**：條目本體不動，**末尾補一句註記**「後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`，`/review` 改為複習中心首頁」。
  - ✅ **P2-4B**：條目從「6 個入口卡」改為「5 張主入口卡 + 1 個底部輔助提示」。**狀態仍全部 ✅**——本輪是收緊既有完成項的描述，不是新工作。
  - ⬜ **P2-4C**：未動。
  - P2-1 / P2-3 / P2-4A 維持 ✅。
- ⬜ **P3**：仍「⬜ 規劃中」，6 個子階段全 ⬜。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動，本輪未引入登入 / 後端 / 資料庫 / 雲端同步、未真的部署 Vercel、未動 `/quiz`、未進入 P2-4C / P3。
- 變更紀錄追加 2026-05-07 一筆，描述本輪小修。

**沒有任何條目從 ⬜ 翻為 ✅ 或 🟡**，符合任務單「不要把任何 P3 子項標成完成」「P2 整體仍維持進行中」「P2-4C 仍未開始」「P3 仍是規劃中」要求。
