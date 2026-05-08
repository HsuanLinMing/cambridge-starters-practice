# Claude Code 回報 · P3-3-A-1 人工試跑 AI 仿真題 prompt v1

任務日期：2026-05-08
任務性質：P3-3-A 收尾——人工依 prompt v1 規格產出 8 題試跑草稿。**未串 AI API、未寫任何程式 / CLI、未做自動轉換工具、未實作 `/quiz` UI**。

## 【本輪修改摘要】

P3-3-A 增加一份人工試跑草稿驗證 prompt v1 規格的實務品質：

- **新增 `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`**：8 題自製 AI 仿真題草稿，覆蓋 6 題型（mc × 2 / pc × 1 / wc × 1 / lc × 2 / fb × 1 / mt × 1），題目分配對齊任務單建議。每題 id 用 `q-ai-v1-<題型>-<流水號>` 格式，與既有 `data/p3-example-questions.json`（`q-mc-001` 等）與 `source_materials/ai_generated/example-ai-questions.md`（`q-ai-mc-001` 等）皆**不撞名**。
- 全部標 `source: ai_generated` + `promptVersion: starters-v1`，題幹用 vocabulary 既有字（apple / cat / dog / book / red / blue / mother / father / chair / run / jump / sit）；color 類圖片以 `imagePrompt` 強調「無文字、無單字」對齊 PRODUCT_SPEC「素材策略」。
- 檔末附**人工品質檢查紀錄表**（10 項全 ✓）+ 「需要日後調整」分析（含對 P2-4C-2B-2 圖片 / 音檔素材的依賴）+ 「後續流程」說明（草稿→人工審→`data/*.json` 轉檔 + 補素材依賴）。
- **`PROJECT_ROADMAP.md`** P3-3-A 子分區補一條「✅ 已新增 prompt v1 第一批人工試跑草稿…」；變更紀錄追加 2026-05-08 一筆。
- **`README.md`** 「下一步」第 2 條 P3-3-A 那行補一句說明 batch01 已新增、明示「這批草稿尚未進正式題庫」。

`npm run lint` / `typecheck` / `build` 三項全綠，路由 88 不變。本輪零程式碼變動。

## 【修改檔案清單】

新增：

- `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`：8 題草稿 + 完整品質檢查紀錄。

修改：

- `PROJECT_ROADMAP.md`：P3-3-A 子分區末尾追加一條 ✅；變更紀錄追加 2026-05-08 一筆。
- `README.md`：「下一步」第 2 條 P3-3-A 那行補 batch01 說明 + 「尚未進正式題庫」提醒。
- `reports/claude_last_report.md`：本回報檔（覆蓋 P3-3-A 那輪報告）。

未動：所有 `app/`、所有 `components/`、所有 `lib/`（含 `lib/types.ts`）、所有 `data/*.json`、所有 `public/`（無新增 SVG / 音檔）、`AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`、`docs/PRODUCT_SPEC.md`、`docs/DATA_SCHEMA.md`、`docs/AI_QUESTION_GENERATION.md`、`AGENTS.md`、`CLAUDE.md`、`source_materials/README.md` / `custom/example-question-draft.md` / `.gitignore` / 其餘 ai_generated 既有檔（`prompt-template.md` / `example-ai-questions.md`）、`package.json`。

## 【核心邏輯說明】

### 1. id 命名 `q-ai-v1-*` 與既有完全不撞

三個 id 命名空間並存：

| 命名空間 | 出處 | 範例 |
| --- | --- | --- |
| `q-<題型>-<流水號>` | `data/p3-example-questions.json`（P3-1 schema 演示） | `q-mc-001` / `q-fb-002` 等 |
| `q-ai-<題型>-<流水號>` | `source_materials/ai_generated/example-ai-questions.md`（P3-3-A 草稿範例） | `q-ai-mc-001` 等 |
| `q-ai-v1-<題型>-<流水號>` | 本輪新增（P3-3-A-1 prompt v1 試跑） | `q-ai-v1-mc-001` / `q-ai-v1-mc-002` 等 |

未來 prompt 改版到 `starters-v2` 時，建議用 `q-ai-v2-*`，依此類推。**版本 prefix** 讓未來 audit「哪批題目用哪版 prompt 出的」一目了然，與題目本身的 `promptVersion` 欄位互相印證。

### 2. 題目主題用 vocabulary 既有字

所有 8 題的主要單字（題幹 / 選項 / 答案）都從 vocabulary 既有 54 字選出：

| 題 | 用到的單字（皆 vocabulary 既有） |
| --- | --- |
| 1. q-ai-v1-mc-001 | apple、red、blue、green、yellow |
| 2. q-ai-v1-mc-002 | dog、book、chair（table 是干擾，非 vocabulary） |
| 3. q-ai-v1-pc-001 | cat、dog、bird、frog |
| 4. q-ai-v1-wc-001 | red、blue、green、yellow |
| 5. q-ai-v1-lc-001 | book、dog、cat、apple |
| 6. q-ai-v1-lc-002 | mother、father、friend、teacher |
| 7. q-ai-v1-fb-001 | run、sit、jump（eat 是干擾，非 vocabulary） |
| 8. q-ai-v1-mt-001 | cat、dog、book、apple |

選擇策略：

- **題目主軸字（answer）**：永遠是 vocabulary 既有，避免冷僻。
- **干擾選項**：90% 來自 vocabulary 既有；少數選有意義的「非 vocabulary 但小一聽過」字（如 `table` / `eat`）作為合理干擾。
- **避開可能撞既有 P3-1 範例的題幹**：例如 P3-1 的 q4 是「How many cats? 🐱🐱」/「two」，本輪刻意不出類似題；P3-1 的 q2 是「Which one is a fruit?」，本輪改用「An apple is ___」走「顏色 + 名詞」題型而非「分類」。

### 3. color 類題（題 4）的「無文字」強制

題 4 word-choice 中 4 個圖片選項是 red / blue / green / yellow 純色塊。`imagePrompt` 一律寫：

```
「紅色色塊，圓形，無文字，無單字」
「藍色色塊，圓形，無文字，無單字」
...
```

這是對齊：

- `docs/PRODUCT_SPEC.md`「素材策略 → 圖片」：「color 類單字（red / blue …）的圖片**不要在圖內放單字英文**，避免看圖選字題型直接洩漏答案」。
- 既有 `public/images/red.svg` / `public/images/blue.svg`（P2-4C-2B-1）的設計實踐——純色塊 + 高光，無 `<text>` 元素。
- `docs/AI_QUESTION_GENERATION.md` 第 7 節品質檢查的「無外部 URL」與「適合小一程度」精神。

### 4. 不在本輪做的事（明示依賴未來 P 階段）

題目對未來素材有依賴，本輪刻意明示在「需要日後調整」表中：

| 題 | 依賴 | 屬哪一階段 |
| --- | --- | --- |
| 4 | `green.svg` / `yellow.svg` 自製 SVG 尚未存在 | P2-4C-2B-2（補圖） |
| 5、6 | `q-ai-v1-lc-001.mp3` / `q-ai-v1-lc-002.mp3` 自製音檔尚未存在 | P2-4C-2B-2（TTS 音檔） |
| 8 | 4 張圖（cat / dog / book / apple）**已存在** ✓ | （無依賴，可直接轉 JSON） |

明示這些依賴，避免未來輪次誤把本批題直接轉進 `data/*.json`，導致缺素材時 `/quiz` 渲染壞掉。

### 5. 為什麼用「人工試跑」而不是真的呼叫 AI

任務單明示「不要串 OpenAI API / Anthropic API / 寫 Node script / CLI」。本輪是**人工依 prompt v1 規格出題**，目的是：

- **驗證 prompt v1 的實務品質**：在「最理想」（人工有意識遵守）情境下，題目結構是否合理、品質檢查清單是否實用。
- **建立基準**：未來真實 AI 生成時，可比對「真 AI」與「人工試跑」的差異——若 AI 生成偏向某種瑕疵（答案位置都在第一格、語氣偏正式、題幹太長），就知道需要遞增 `starters-v2` 並記錄修改要點。
- **預先發現規格漏洞**：本輪寫題過程中即發現 color 類題目的「無文字」強制需要明寫進 imagePrompt（雖然 PRODUCT_SPEC 已寫，但 prompt-template 與本批草稿都需要重複強調）。

### 6. 人工品質檢查 10 項全 ✓

依 `docs/AI_QUESTION_GENERATION.md` 第 7 節 6 項 + `prompt-template.md` 第 8 項自我檢查 + 本輪額外加 id 不撞名 / 題型分配兩項，共 10 項：

| # | 檢查項 | 結果 |
| --- | --- | --- |
| 1 | 8 題全部 `source: ai_generated` | ✓ 8 / 8 |
| 2 | 8 題全部 `promptVersion: starters-v1` | ✓ 8 / 8 |
| 3 | answer 出現在 options（matching 例外） | ✓ 7 題（mt 由 pairs 順序定義） |
| 4 | 無官方 / 歷屆題內容 | ✓ |
| 5 | 無外部 URL（`http://` / `https://`） | ✓ |
| 6 | explanation 鼓勵語氣 | ✓ |
| 7 | 英文題幹 ≤ 10 字 | ✓ 最長 5 字 |
| 8 | 避開冷僻字 / 雙重否定 / 文化背景假設 | ✓ |
| 9 | id 與既有不撞名 | ✓ 用 `q-ai-v1-*` 格式 |
| 10 | 題型分配對齊任務單建議 | ✓ mc × 2 / pc × 1 / wc × 1 / lc × 2 / fb × 1 / mt × 1 |

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒串 OpenAI / Anthropic API
- 沒寫 Node script / CLI / 自動轉換工具
- 沒修改 `lib/types.ts` / 任何 `data/*.json`
- 沒實作 `/quiz` UI / 完整考卷流程
- 沒做 localStorage 實際保存 / 交卷頁 / 錯題頁
- 沒新增圖片 / 音檔 / SVG（雖然 batch01 草稿提到 chair / green / yellow 圖與 lc 音檔需求，但實際素材未動，明示依賴 P2-4C-2B-2）
- 沒下載任何官方 / 歷屆 / 網路素材
- 沒放 Cambridge 官方真題內容（題幹用基礎句型 `An apple is ___` / `A ___ can run` / `What is this` / `I have a book` / `My mother is happy today` / `I can ___ fast` 等，全自製）
- 沒新增依賴 / 測試框架
- 沒部署 / 後端 / DB / 登入

## 【新增了哪些能力】

- 規格層首次有「prompt v1 已被人工試跑驗證」的紀錄，給未來真實 AI 生成時的**對照基準**。
- 8 題草稿日後可作為 P3-2-B 自動轉換工具的**測試樣本**——讓轉換工具能用真實內容跑端到端。
- batch01 末尾的「需要日後調整」表把素材依賴明寫，避免未來輪次無意間把本批題直接轉進 `data/*.json` 造成 `/quiz` 渲染壞掉。
- `q-ai-v1-*` id 命名規則確立後，未來 prompt 改版（v2 / v3）可沿用相同模式，便於 audit。

## 【新增/調整測試】

無。任務單明確禁止導入測試框架。本輪純文件變動，無程式碼可測。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：路由總數仍 88、全部 SSG / Static prerender，與 P3-3-A / P3-2-A / P3-1 完全一致。

新檔內容驗證（grep）：

| 驗證項 | 結果 |
| --- | --- |
| 8 題 id 全到（`q-ai-v1-mc-001` / `q-ai-v1-mc-002` / `q-ai-v1-pc-001` / `q-ai-v1-wc-001` / `q-ai-v1-lc-001` / `q-ai-v1-lc-002` / `q-ai-v1-fb-001` / `q-ai-v1-mt-001`） | ✓ |
| 與既有 P3-1 範例 id（`q-mc-001` 等）不撞名 | ✓ 0 命中 |
| 與既有 example-ai-questions.md（`q-ai-mc-001` 等）不撞名 | ✓ 0 命中 |
| `source: ai_generated` 出現次數 | 9 行（8 題 + 1 行檢查紀錄表中描述） |
| `promptVersion: starters-v1` 出現次數 | 9 行（8 題 + 1 行檢查紀錄表中描述） |
| 無外部 URL | ✓（grep 命中 1 行是檢查紀錄表中**描述**「無外部 URL（`http://` / `https://`）」字面，不是真 URL） |
| 不含官方真題痕跡關鍵字（`official sample paper` / `歷屆考題原文` / `Cambridge Assessment`） | ✓ 全 0 |
| 題型分配 | ✓ mc × 2、pc × 1、wc × 1、lc × 2、fb × 1、mt × 1 = 8，符合任務單建議 |

依 runbook 第 4 節，純文件改動可略過 `npm run dev`。

## 【仍未處理】

- **batch01 進正式題庫**：等 `green.svg` / `yellow.svg` / `q-ai-v1-lc-001.mp3` / `q-ai-v1-lc-002.mp3` 補齊後，才能轉成 `data/*.json`（屬 P2-4C-2B-2 + 未來 P3-2-B 範圍）。
- **真實 AI 生成試跑**：本輪是人工試跑；下一輪可實際把 prompt v1 主體貼給 ChatGPT / Claude，比對「真 AI」與「人工試跑」差異；若有偏差，遞增 `starters-v2`。
- **P3-3-B 全部 5 條 ⬜**：AI API 串接 / 草稿 → JSON 自動化 / 圖像生成 / TTS / AI 評分（永久不做）。
- **P3-2-B 全部 4 條 ⬜**。
- **P3-4 / P3-5 / P3-6 全部 ⬜**：Listening 題型、Reading & Writing 題型、完整考卷 Session 與錯題複習。
- **P2-4C-2B-2 全部 7 條 ⬜**：補更多圖片素材、聽力 / 句型 / 位置 · 顏色 · 數量練習等。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P3-3-A-1 文件層回歸**：
   - 翻 `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md` 確認 8 題覆蓋 6 題型、id 不撞名既有、`source` / `promptVersion` 全對、品質檢查表 10 項全 ✓、需要日後調整表清楚標出對 P2-4C-2B-2 的素材依賴。
   - 翻 ROADMAP P3-3-A 子分區確認新增條目正確、變更紀錄追加。
   - 翻 README「下一步」P3-3-A 那行確認補了 batch01 說明 + 「尚未進正式題庫」提醒。
   - **建議特別檢查**：題目語意與選項對應是否合理（例如題 5 「I have a book」的干擾選項 dog / cat / apple 是否會讓小朋友混淆）；若有題目實務上不適合，可建議調整。
2. **下一輪建議優先序（請 ChatGPT 收斂）**：
   - 路線 A（建議優先）：**真正跑一次 AI 生成試跑**——把 `prompt-template.md` 主體貼給 ChatGPT 或 Claude，產出 batch02（命名 `2026-05-XX-starters-v1-batch02.md`），與本輪人工 batch01 做對比。若 AI 偏向某種瑕疵，遞增 `starters-v2` 並記錄。
   - 路線 B：**P2-4C-2B-2 補 green / yellow / chair SVG**，讓 batch01 中題 4、題 8 的素材依賴解鎖，可開始考慮轉成 `data/*.json`。
   - 路線 C：**P3-2-B 文字 → JSON 轉換工具**，把 batch01 作為測試樣本，驗證轉換工具能正確處理類 YAML 草稿格式。
3. **prompt v1 從本輪人工試跑觀察到的微調建議**（給 v2 用）：
   - **color 類圖片的「無文字、無單字」要求**已在 batch01 的 imagePrompt 強調，建議在 `prompt-template.md` 第「word-choice options 格式」段對 color 類加一個明示範例（目前範例用 apple / cat / dog / book）。
   - **干擾選項是否一律來自 vocabulary**：本輪 batch01 中題 2 用了 `table`、題 7 用了 `eat` 作干擾（vocabulary 沒有），雖合理但若想要「題目所有字皆 vocabulary」更穩，可在 v2 加這條規則。
   - **explanation 是否一定中英對照**：本輪 batch01 的解析全部中文；若考慮給家長 / 老師看時也要英文版，可在 v2 加 `explanationEn` 欄位。本輪不做。
4. **batch01 是否要轉 `data/*.json`**：**目前不建議**。轉檔前需先補 green / yellow / chair SVG 與 lc 音檔（屬 P2-4C-2B-2）；且 P3-6 `/quiz` UI 尚未實作，即使轉了也無法渲染。建議等 P3-6 第一版 `/quiz` 上線時，挑 batch01 中**素材依賴最少**的題（題 1、題 2、題 7 純文字題）優先轉。
5. **本輪未動 PRODUCT_SPEC**：既有「測驗與考前練習方向 → AI 仿真題」段已涵蓋本輪精神（題型對齊、風格對齊、目標建立信心、TTS 自製、image prompt 同步輸出），與本輪實踐一致；不需動。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中（P2-4C-2B-2 尚未開工）；所有 P2 勾選未動。
- 🟡 **P3**：仍 🟡 進行中。
  - ✅ **P3-1**：未動。
  - 🟡 **P3-2**：未動（P3-2-A ✅、P3-2-B ⬜）。
  - 🟡 **P3-3 AI 仿真題生成規劃**：仍 🟡。
    - ✅ **P3-3-A**：上輪 6 條 ✅，本輪追加一條「✅ 已新增 prompt v1 第一批人工試跑草稿」共 7 條 ✅。
    - ⬜ **P3-3-B**：5 條 ⬜（含 AI 評分永久不做）。
  - ⬜ **P3-4 / P3-5 / P3-6**：未動。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動，本輪未串 AI API、未爬網路、未下載任何官方 / 歷屆 / 網路素材、未放 Cambridge 官方真題內容、未引入登入 / 後端 / 雲端 / localStorage / 真實素材 / 依賴 / 測試框架、未實作 `/quiz` UI、未真的部署 Vercel。
- 變更紀錄追加 2026-05-08 一筆。

P3 整體仍未完成；**符合任務單「不要把 P3-3 整體標完成」「不要把 P3-3-B 標完成」「不要把 P3-2-B 標完成」「不要進 P3-4 / P3-5 / P3-6」要求**。
