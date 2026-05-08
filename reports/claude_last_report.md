# Claude Code 回報 · P2-4C-2B-1 小修：移除 SVG 答案 metadata

任務日期：2026-05-08
任務性質：P2-4C-2B-1 小修，**只動 10 個 SVG 的 root 屬性**，未動任何程式碼 / 資料 / 文件。

## 【本輪修改摘要】

修 Codex 指出的唯一條件：10 個自製 SVG 的 root `<svg>` 帶有答案字樣的 `aria-label`（例如 `aria-label="apple"`、`aria-label="red color"`、`aria-label="blue color"`、`aria-label="one star"`、`aria-label="two stars"` 等），雖然視覺上不會顯示，但若嚴格解讀「SVG 內容不應寫出英文答案」，這些 `aria-label` 仍算殘留。

採**任務單建議的方案 A**：

- 移除 `role="img"` 與 `aria-label="..."`。
- 加上 `aria-hidden="true"`。

理由：外層 React `<img>` 已由 `alt` 提供描述（在 `PracticeImage` 與 `VocabularyCard` 內 caller 傳入），SVG 檔案內部不需要重複提供答案型 aria-label。

10 個檔案各只動 root 第一行；其餘 SVG 內部 shape / path / circle / rect 完全不動，圖案視覺與上輪 P2-4C-2B-1 完全一致。

`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）；dev smoke test 確認 10 個 SVG 仍 200、`apple.svg` / `red.svg` 內容已不含答案字樣、8 條既有路由全 200、`/review/word/apple` 仍指向 svg 且翻牌正常、`/review/word/jump` 仍 fallback、`/quiz` 仍骨架；dev log 無 error / warn / hydration。

## 【修改檔案清單】

修改：

- `public/images/apple.svg` — root：`role="img" aria-label="apple"` → `aria-hidden="true"`
- `public/images/cat.svg` — root：`role="img" aria-label="cat"` → `aria-hidden="true"`
- `public/images/dog.svg` — root：`role="img" aria-label="dog"` → `aria-hidden="true"`
- `public/images/book.svg` — root：`role="img" aria-label="book"` → `aria-hidden="true"`
- `public/images/red.svg` — root：`role="img" aria-label="red color"` → `aria-hidden="true"`
- `public/images/blue.svg` — root：`role="img" aria-label="blue color"` → `aria-hidden="true"`
- `public/images/one.svg` — root：`role="img" aria-label="one star"` → `aria-hidden="true"`
- `public/images/two.svg` — root：`role="img" aria-label="two stars"` → `aria-hidden="true"`
- `public/images/mother.svg` — root：`role="img" aria-label="mother"` → `aria-hidden="true"`
- `public/images/father.svg` — root：`role="img" aria-label="father"` → `aria-hidden="true"`
- `reports/claude_last_report.md`：本回報檔。

未動：所有 SVG 內部圖形（`<rect>` / `<circle>` / `<polygon>` / `<path>` / `<ellipse>` / `<line>`）、`data/vocabulary.json`、`PicturePractice.tsx`、`VocabularyCard.tsx`、`PracticeImage`（內含於 `PicturePractice.tsx`）、所有 app routes、`README.md`、`PROJECT_ROADMAP.md`、`docs/PRODUCT_SPEC.md`、`docs/DATA_SCHEMA.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`、`AI_DEV_WORKFLOW.md`、`AGENTS.md`、`CLAUDE.md`、`data/quizzes.json`、`public/audio/`、`package.json`。

## 【核心邏輯說明】

### 1. 採方案 A（`aria-hidden="true"`）而非方案 B（中性 `aria-label`）

任務單同時提供兩個方案，並建議優先採 A。原因如下：

- **避免雙重描述衝突**：caller 端 `<img alt="...">` 已是 SVG 的可訪問描述（例如 `<PracticeImage>` 在看圖選字題目傳 `alt="看看這張圖片"`、看字選圖選項傳 `alt="${opt.word} 的圖片"`）；如果 SVG root 再寫一個 `aria-label`，會造成輔助科技讀到兩層、語意層級不清。
- **`aria-hidden="true"` 是 W3C 推薦做法**：當圖像作為已被外層描述過的裝飾性 / 內容圖時，應在 SVG 上 `aria-hidden="true"` 讓輔助科技直接跳過 SVG 內部結構，使用 `<img alt>` 作為唯一可訪問入口。這是 SVG / ARIA 規範對「inline svg via img tag」的明確建議。
- **降低答案洩漏面向**：徹底移除「SVG 內任何能被讀取的英文文字」，未來若有人用瀏覽器 devtools 看 raw SVG 也不會在 metadata 看到單字答案。
- **方案 B 容易未來踩坑**：如果用 `aria-label="picture"` 之類的中性字串，未來補新 SVG 時可能有人不小心又寫成具體單字（例如 `aria-label="dog"`）；方案 A 的 `aria-hidden="true"` 是**規則最簡單**的 pattern——「SVG 永遠不暴露語意給輔助科技、語意完全交給外層 alt」，未來補圖只要照抄 root 即可，不會再犯錯。

### 2. 為什麼不需要動 component

`PracticeImage` 與 `VocabularyCard` 已正確處理 `alt`：

```tsx
// PicturePractice.tsx
<PracticeImage item={current} alt="看看這張圖片" size="lg" />
<PracticeImage item={opt} alt={`${opt.word} 的圖片`} size="sm" />

// PracticeImage 內
<img src={item.image} alt={alt} className="h-full w-full object-contain" />
```

外層 React 渲染的 `<img>` 永遠帶 `alt`，SVG 內 `aria-hidden="true"` 不會破壞輔助科技的描述路徑——alt 仍會被讀出。視覺上完全一致。

### 3. 答案字樣全清光的驗證

10 個 SVG 各自 grep 對應單字：

- `apple.svg` 不含 `apple` ✓
- `cat.svg` 不含 `cat` ✓
- `dog.svg` 不含 `dog` ✓
- `book.svg` 不含 `book` ✓
- `red.svg` 不含 `red` ✓
- `blue.svg` 不含 `blue` ✓
- `one.svg` 不含 `one` ✓
- `two.svg` 不含 `two` ✓
- `mother.svg` 不含 `mother` ✓
- `father.svg` 不含 `father` ✓

額外**交叉檢查**（10 個 SVG 中不應出現任意 10 個答案字樣中的任何一個）：全部 0 命中 ✓。

確認沒殘留其他洩漏向量：

| 檢查項 | 命中數 | 結論 |
| --- | --- | --- |
| `<text>` | 0 | ✓ 沒文字節點 |
| `<title>` | 0 | ✓ 沒標題 |
| `<desc>` | 0 | ✓ 沒描述 |
| `<image>`（外部圖片） | 0 | ✓ 純向量 |
| `aria-label` | 0 | ✓ 全部換成 `aria-hidden` |
| 外部 URL（除 SVG namespace） | 0 | ✓ 唯一的 `http://www.w3.org/2000/svg` 是 W3C SVG XML namespace 規範必要識別字，不是外部資源載入 |

> **註**：SVG 規範要求 root 必須宣告 `xmlns="http://www.w3.org/2000/svg"`，這個字串看起來像 URL 但實際上是 XML namespace 識別，瀏覽器不會去 fetch 它，無安全 / 答案洩漏疑慮。grep 寬條件命中 10 行（每個 SVG root 都有）屬正常。

### 4. 行為等價性確認

修改前：SVG 渲染 → 輔助科技讀到「apple」/「red color」/「blue color」等英文 → 答案在 SVG metadata 層洩漏。

修改後：SVG 渲染 → 輔助科技見 `aria-hidden="true"` → 跳過 SVG 內部 → 讀取 `<img alt>`（中文）→ 例如「看看這張圖片」、「apple 的圖片」（看字選圖選項，但這層 alt 是 caller 傳給選項按鈕，本來就有單字 word；看圖選字題目 alt 是中性「看看這張圖片」）。

關鍵：**看圖選字的題目區（圖片是題幹）alt = 「看看這張圖片」中性字串**——所以即使輔助科技讀 alt 也不會洩漏答案；整體答案洩漏管道已關閉。看字選圖選項區的 alt 含 word，但那是「選項文字 = 圖片中要選的單字」本來就要透露的（不然輔助科技使用者根本沒辦法選），與題目方向一致。

### 5. 沒做的事（嚴守任務單禁止清單）

- 沒動 `data/vocabulary.json`、所有 components、所有 routes、所有 docs、所有 README/ROADMAP。
- 沒新增 / 刪除 SVG。
- 沒重新設計 SVG 圖案（內部 shape 全部 byte-for-byte 不變）。
- 沒下載任何外部素材。
- 沒新增 `<text>`、沒在其他屬性藏答案。
- 沒進入 P2-4C-2B-2 / P3、沒新增 `/quiz` 功能 / localStorage / 分數保存 / 依賴 / 測試框架。

## 【新增了哪些能力】

無新功能。本輪純 SVG metadata 修補，把答案洩漏面向關閉。

副效應：補圖規則更精簡——「未來補新 SVG 時 root 只用 `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">`」這條 pattern 可以直接抄，不需要為每個單字想 aria-label，也避免新單字英文又跑回 metadata。

## 【新增/調整測試】

無。任務單明確禁止導入測試框架。本輪以 grep + curl 人工 smoke test。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：88 條路由全部 SSG / Static prerender，與上輪一致。

SVG 內容驗證（grep）：

- 對應單字逐字檢查：10 個 SVG 全部 0 命中。
- 交叉檢查（任意 SVG 含任意 10 個答案字樣）：全部 0 命中。
- 其他 metadata 洩漏向量（`<text>` / `<title>` / `<desc>` / `<image>` / `aria-label` / 外部 URL）：全部 0（唯一 `http://www.w3.org/2000/svg` 為 W3C SVG namespace，非外部資源）。
- 10 個 root 全部加上 `aria-hidden="true"`。

人工 smoke test（dev server + curl）：

| 驗證項 | 結果 |
| --- | --- |
| 10 個 SVG dev server serve 仍 200 | ✓ |
| dev server 回傳的 `apple.svg` 內容不含 `apple` | ✓ 0 命中 |
| dev server 回傳的 `red.svg` 內容不含 `red` | ✓ 0 命中 |
| `/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz` 全部 200 | ✓ |
| `/review/word/apple` RSC payload 仍含 `/images/apple.svg`、翻牌「看答案」按鈕仍正常 | ✓ |
| `/review/word/jump` RSC payload 仍含 `/images/jump.png`、SSR HTML 含 fallback「圖片準備中」 | ✓ |
| Dev log error / warn / hydration | ✓ 全無 |

## 【仍未處理】

- P2-4C-2B-2 全部 7 條（補更多圖片 / 真實音檔 / 補單字 / 聽力 / 句型 / 位置 · 顏色 · 數量 / category 補充模式）。
- P3 6 個子階段全 ⬜，本輪不開工。
- P1 兩條可選 housekeeping。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。
- `docs/DATA_SCHEMA.md` 對 Question / Exam Session 型別擴充（屬 P3-1）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P2-4C-2B-1 小修最終確認**：grep 10 個 SVG 內容（不含對應答案字樣、無 `<text>` / `<title>` / `<desc>` / `<image>` / `aria-label`）；瀏覽器確認 `/review/picture` 各題型圖案視覺與上輪完全一致（沒有任何視覺差異，本輪只是 metadata 變動）；輔助科技讀屏（如 macOS VoiceOver）確認 `<img alt>` 仍正常被讀出，SVG 內部不再洩漏英文。
2. **未來補新 SVG 的 SOP（隱形規則）**：root 一律抄
   ```
   <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
   ```
   不要再加 `role="img"` 或 `aria-label`；alt 由外層 `<PracticeImage>` / `<VocabularyCard>` caller 傳入。建議在 P2-4C-2B-2 開始補大量新圖時，可以在 `docs/DATA_SCHEMA.md` 或新增 `public/images/README.md` 把這條 pattern 寫成規範條文，避免共同維護者再犯。本輪未動 docs（任務單明示）。
3. **「答案洩漏邊界」可以納入 Codex 驗收手冊**：建議在 `docs/CODEX_VALIDATION_RUNBOOK.md` 第 5 節「檢查清單」新增一項「圖片素材檢查」——對 `public/images/*.svg` grep 對應單字應全 0、grep `<text>` / `<title>` / `<desc>` / `aria-label` 應全 0。本輪未動 runbook（屬「不要改文件」範圍）；下一次 ROADMAP / runbook 整理時可一併補。
4. **長期方向**：等真實素材覆蓋率 ≥ 50%（27 / 54 個單字有圖）時可評估改回 `next/image` 利用 image optimization；屆時 SVG 也會經 `next/image` 處理，`<svg aria-hidden="true">` 配合外層 `next/image` 的 `alt` 仍是正確 pattern。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中。
  - ✅ **P2-4C-2B-1**：上輪 5 條已標 ✅，本輪只是把 SVG metadata 進一步收斂（移除答案字樣 aria-label），屬已完成項的精修，**未新增也未翻動勾選狀態**。「不下載 Cambridge 官方圖片、不下載歷屆考題圖片、不使用網路抓圖、不使用版權外部素材」這條本輪繼續成立，加上更嚴格的「SVG 內容不寫出英文答案」也已對齊。
  - 🟡 **P2-4C-2B 階段**：仍 🟡。
  - ⬜ **P2-4C-2B-2**：7 條 ⬜，未動。
  - 🟡 **P2-4C 階段**：仍 🟡。
  - P2-1 / P2-2 / P2-3 / P2-4A / P2-4B / P2-4C-1 / P2-4C-2A 維持 ✅。
- ⬜ **P3**：仍「⬜ 規劃中」，6 個子階段全 ⬜。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動。本輪未引入登入 / 後端 / 雲端 / localStorage / 分數保存 / 真實音檔 / 大量新單字 / 依賴 / 測試框架，未下載任何官方 / 歷屆 / 網路圖片，未動 `/quiz`、未真的部署 Vercel。
- 變更紀錄**未追加**新一筆——本輪屬 P2-4C-2B-1 完成項的細節精修（移除答案 metadata），上輪那筆變更紀錄已涵蓋「不下載官方圖片 / 不使用版權外部素材」的核心精神。本輪只是把實作面的 metadata 對齊文字精神。

**沒有任何條目從 ⬜ 翻為 ✅ 或 🟡**，符合任務單「不要新增功能」「不要進入 P2-4C-2B-2」「不要進入 P3」「不要改 PROJECT_ROADMAP」要求。
