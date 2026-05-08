# Claude Code 回報 · P3-3-A AI 仿真題 Prompt 標準格式

任務日期：2026-05-08
任務性質：P3-3-A 文件 / prompt 範本 / 草稿範例。**不串 AI API、不寫 Node script / CLI、不做 `/quiz` UI**。

## 【本輪修改摘要】

P3-3 階段升 🟡 進行中，本輪完成 **P3-3-A**（規格文件 + prompt 範本 + 草稿範例）。P3-3-B（實際 AI 工具串接）仍 ⬜。

- **新增 `docs/AI_QUESTION_GENERATION.md`** 規格文件 10 個 section：定位（不是官方真題、是依風格自製）、難度原則（小一友善 6 條）、來源規則硬邊界（必標 `ai_generated` + 7 個 ❌）、6 種題型範圍、草稿輸出格式（類 YAML）、轉換流程圖、品質檢查 6 項、與 P3-1 / P3-2-A 對齊、不在 P3-3 範圍、Prompt 版本化政策。
- **新增 `source_materials/ai_generated/prompt-template.md`** v1：可直接複製給 AI（ChatGPT / Claude）使用的 prompt 範本。包含角色設定（Cambridge Starters 兒童英文出題助手）、年齡（國小一年級）、6 題型可調參數、類 YAML 草稿格式範例（含 word-choice / matching 巢狀結構）、8 項自我檢查、與 custom 草稿差異對照表、版本歷史。
- **新增 `source_materials/ai_generated/example-ai-questions.md`** 草稿範例：6 題覆蓋 6 種題型（`q-ai-mc-001` / `q-ai-pc-001` / `q-ai-wc-001` / `q-ai-lc-001` / `q-ai-fb-001` / `q-ai-mt-001`），id 與既有 P3-1 範例（`data/p3-example-questions.json`）不撞名。每題附 `imagePrompt` / `ttsScript` / `promptVersion` 草稿欄位、自我檢查紀錄、整理者提醒。
- **`docs/DATA_SCHEMA.md`** 補「AI 仿真題草稿與正式題庫的關係（P3-3）」一節：草稿 → 審核 → 正式題庫流程圖、草稿欄位 vs 正式 schema 對應表、`source` 強制 `ai_generated`、P3-3-A 範圍 vs P3-3-B vs 永久不做（AI 評分）。
- **`PROJECT_ROADMAP.md`** P3-3 階段升 🟡，子分區拆 P3-3-A（已完成 6 條 ✅）+ P3-3-B（5 條 ⬜，含「AI 評分永久不做」）；變更紀錄追加 2026-05-08 一筆。
- **`README.md`** 「下一步」第 2 條補一行 P3-3-A 已完成。

`npm run lint` / `typecheck` / `build` 三項全綠，路由 88 不變。本輪零程式碼變動。

## 【修改檔案清單】

新增：

- `docs/AI_QUESTION_GENERATION.md`：8,284 bytes，10 個 section 規格文件。
- `source_materials/ai_generated/prompt-template.md`：6,752 bytes，可複製給 AI 的 prompt 範本（v1）。
- `source_materials/ai_generated/example-ai-questions.md`：5,906 bytes，6 題自製草稿範例。

修改：

- `docs/DATA_SCHEMA.md`：檔末新增「AI 仿真題草稿與正式題庫的關係（P3-3）」整節；前面 P3-1 schema 與 P3-2-A 整理流程不動。
- `PROJECT_ROADMAP.md`：P3-3 章節重寫，加 P3-3-A 子分區（6 條 ✅）+ P3-3-B 子分區（5 條 ⬜）；變更紀錄追加。
- `README.md`：「下一步」第 2 條條列補 P3-3-A 已完成、P3-3-B 列入未開始清單。
- `reports/claude_last_report.md`：本回報檔（覆蓋 P3-2-A 那輪報告）。

未動：所有 `app/` 路由、所有 `components/`、所有 `lib/`（含 `lib/types.ts` P3 型別）、所有 `data/*.json`（含 P3-1 範例、P3-2-A 草稿）、所有 `public/`、`AI_DEV_WORKFLOW.md`、`docs/TASK_ROUTER.md`、`docs/CODEX_VALIDATION_RUNBOOK.md`、`docs/PRODUCT_SPEC.md`、`AGENTS.md`、`CLAUDE.md`、`source_materials/README.md`（P3-2-A 主文件）、`source_materials/custom/example-question-draft.md`（P3-2-A 範例）、`source_materials/.gitignore`、`package.json`。

## 【核心邏輯說明】

### 1. 三檔分工：規格 / 範本 / 範例

| 檔案 | 角色 | 讀者 |
| --- | --- | --- |
| `docs/AI_QUESTION_GENERATION.md` | **規格層**：定義什麼是 AI 仿真題、品質檢查標準、與 schema 對齊 | 維護者 / Codex / ChatGPT |
| `source_materials/ai_generated/prompt-template.md` | **工具層**：可直接複製給 AI 的 prompt 主體（v1） | 任何想用 AI 出題的人 |
| `source_materials/ai_generated/example-ai-questions.md` | **範例層**：示範 AI 草稿應該長什麼樣 + 自我檢查紀錄 | AI 出題者 + 人類整理者 |

三檔職責切乾淨：未來 prompt 改版（v1 → v2）只動 `prompt-template.md`；schema 變動只動規格文件；範例可隨時補新批次。

### 2. 為什麼 AI 草稿用「類 YAML」而非 JSON

- **AI 對人類友善的格式更穩**：類 YAML（`key: value`）比嚴格 JSON 容易寫對；AI 生成 JSON 時容易漏 comma、引號跳脫、巢狀錯位。
- **與 P3-2-A custom 草稿一致**：`source_materials/custom/example-question-draft.md` 已採類 YAML，所有草稿層格式統一。
- **正式 schema 仍是 JSON**：未來 P3-2-B 轉換工具負責「類 YAML → JSON」，AI 不直接吐 JSON。
- **降低 AI 出題失敗率**：實務上請 AI 出 JSON 時格式錯誤率高；類 YAML 即使有小錯（多空格、多冒號），人類整理者也能很快修。

### 3. 為什麼新增 `imagePrompt` / `ttsScript` / `promptVersion` 三個草稿欄位

| 欄位 | 用途 | 是否進正式 schema |
| --- | --- | --- |
| `imagePrompt` | 描述「自製插畫應該畫什麼」（例如「黃色彎月形香蕉，簡單卡通風格」），給人類整理者用以自繪 SVG | **不進**——轉檔時換成 `image: "/images/<id>.svg"` 路徑 |
| `ttsScript` | 描述「TTS 應該唸什麼」，給人類整理者用 macOS `say -o` 等工具自製 | **進**——`ListeningChoiceQuestion.ttsScript` 已是 P3-1 schema 的正式欄位 |
| `promptVersion` | 標記出題 prompt 的版本（例如 `starters-v1`），未來 prompt 改版時可回溯 | **進**——`BaseQuestion.promptVersion` 已是 P3-1 schema 的正式欄位 |

`imagePrompt` 是純草稿欄位（規格文件明示「不進正式 schema」）。如果未來決定接 AI 圖像生成（DALL-E / Stable Diffusion），可考慮把它加進正式 schema；屆時需先更新 `lib/types.ts` 與 `docs/DATA_SCHEMA.md` P3-1 schema 段。本輪不做。

### 4. AI id 命名 `q-ai-<題型>-<流水號>`：與既有不撞名

P3-1 既有範例（`data/p3-example-questions.json`）的 id：`q-mc-001` / `q-pc-001` / `q-wc-001` / `q-lc-001` / `q-fb-001` / `q-fb-002` / `q-mt-001`。

P3-3-A AI 範例的 id：`q-ai-mc-001` / `q-ai-pc-001` / `q-ai-wc-001` / `q-ai-lc-001` / `q-ai-fb-001` / `q-ai-mt-001`。

**插入 `ai-` 中間段**避免撞名，未來轉成正式題庫時也保留來源辨識。`prompt-template.md` 內明寫此規則，給 AI 出題時遵守。

### 5. 自我檢查 8 項硬邊界

prompt 範本要求 AI 生成完**自己跑**這 8 項檢查：

1. 答案在選項中（matching 例外）
2. 所有 source 是 `ai_generated`
3. 所有題目附 `promptVersion: starters-v1`
4. explanation 鼓勵語氣
5. 完全無官方 / 歷屆題內容
6. 完全無外部 URL
7. 英文題幹 ≤ 10 字、選項清楚
8. 避開冷僻字、雙重否定、文化背景假設

最後要求 AI 用一段固定收尾話：

> ✅ 全部 N 題已通過自我檢查清單 1~8 項。
> ✅ 全部標記 source: ai_generated、promptVersion: starters-v1。
> ✅ 沒有引用任何官方真題、歷屆題、外部 URL 或官方素材。

這條收尾話不是裝飾——是給人類整理者的「明示確認」，避免 AI 偷懶輸出後沒檢查。如果 AI 沒附這段，整批退回。

### 6. ROADMAP P3-3 拆 P3-3-A / P3-3-B

舊 P3-3 共 5 條 ⬜：

```
- ⬜ 撰寫「給 AI 的出題 prompt」標準格式（含風格、難度、題型、目標年齡）
- ⬜ AI 輸出直接落入既有 quiz JSON schema
- ⬜ 同步輸出 TTS script（給 listening 題）與 image prompt（給看圖題）
- ⬜ 標記 `source: "ai_generated"` 並附 prompt 版本號
- ⬜ 題目品質原則：小一友善、可愛、活潑、清楚
```

本輪實作為 P3-3-A 6 條 ✅：

- ✅ `docs/AI_QUESTION_GENERATION.md` 規格文件
- ✅ `prompt-template.md` v1（含風格、難度、題型、目標年齡可調參數）
- ✅ `example-ai-questions.md` 6 題覆蓋 6 題型
- ✅ 草稿欄位定義（`imagePrompt` / `ttsScript` / `promptVersion`）
- ✅ 強制 `source: "ai_generated"`
- ✅ `docs/DATA_SCHEMA.md` 補對應節

> 注意：舊條目「**AI 輸出直接落入既有 quiz JSON schema**」字面上偏向「直接寫 JSON」，但實務上採類 YAML 草稿 → 人工 / P3-2-B 轉換 → JSON 的兩階段流程更穩。本輪在規格文件中明示這個架構選擇，並把「AI 輸出直接寫 JSON」這條視為過時表述。

P3-3-B 5 條 ⬜（未開始）：

- ⬜ AI API 客戶端串接（OpenAI / Anthropic / Claude SDK 等）
- ⬜ 自動把 AI 草稿轉成正式 `data/*.json`（屬 P3-2-B 範圍）
- ⬜ 自動圖像生成 wrapper（先評估自製素材策略）
- ⬜ 自動 TTS 生成 wrapper（macOS `say -o` 或雲端 TTS）
- ⬜ AI 評分功能：**永久不做**（見「目前明確不做」清單）

P3-3 階段標 🟡（已開工）；P3-3-A 已完成；P3-3-B 仍未開工，所以 P3-3 整體不能標完成——符合任務單「不要把 P3 整體標完成」「不要進 P3-4 / P3-5 / P3-6」要求。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒實作 AI 生成工具
- 沒串 OpenAI / Anthropic API
- 沒寫 Node script / CLI
- 沒做自動匯入工具
- 沒實作 `/quiz` UI / 完整考卷流程
- 沒做 localStorage 實際保存 / 交卷頁 / 錯題頁
- 沒新增圖片 / 音檔 / SVG
- 沒下載官方圖片 / 歷屆題圖片
- 沒爬網路
- 沒放 Cambridge 官方真題內容（範例 6 題全自製，題幹用基礎句型 `I see a ___` / `What is this` / `I have a ___` 等）
- 沒新增依賴 / 測試框架
- 沒處理 npm audit
- 沒部署 / 後端 / DB / 登入
- 沒動 PRODUCT_SPEC / TASK_ROUTER / CODEX_VALIDATION_RUNBOOK / AI_DEV_WORKFLOW / AGENTS / CLAUDE / `lib/types.ts` / 任何 `data/*.json`

## 【新增了哪些能力】

- 規格層首次有「請 AI 出題」的**完整可援引文件**：定位、難度、來源、6 題型、輸出格式、品質檢查、轉換流程一次到位。
- 工具層首次有**可直接複製給 AI**的 prompt 範本（v1），降低未來實際出題門檻；只要把 `prompt-template.md` 主體貼給 AI 就能跑。
- 範例層首次有**自我檢查紀錄**範本：未來 AI 真實生成題後，可照 `example-ai-questions.md` 末尾的格式留紀錄，給 Codex 驗收一個明確標準。
- DATA_SCHEMA「草稿欄位 vs 正式 schema」對應表釐清三個欄位（`imagePrompt` / `ttsScript` / `notes`）的命運：哪些進正式 schema、哪些不進。
- prompt 版本化政策（`starters-v1`）+ `promptVersion` 必填欄位讓未來改版時可回溯出題品質。

## 【新增/調整測試】

無。任務單明確禁止導入測試框架。本輪純文件變動，無程式碼可測。

## 【測試結果】

自動驗收：

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**：路由總數仍 88、全部 SSG / Static prerender，與 P3-2-A / P3-1 / P2-4C-2B-1 完全一致。

新檔結構驗證：

```
docs/AI_QUESTION_GENERATION.md                         (8,284 bytes)
source_materials/ai_generated/
├── .gitkeep                                           (上輪)
├── example-ai-questions.md                            (5,906 bytes，新增)
└── prompt-template.md                                 (6,752 bytes，新增)
```

範例 AI 題目品質驗證（grep）：

| 驗證項 | 結果 |
| --- | --- |
| 6 題 id 命中（`q-ai-mc-001` / `q-ai-pc-001` / `q-ai-wc-001` / `q-ai-lc-001` / `q-ai-fb-001` / `q-ai-mt-001`） | ✓ |
| 與既有 P3-1 範例 id（`q-mc-001` 等）不撞名 | ✓ |
| 6 題全部 `source: ai_generated` | ✓ |
| 範例內無外部 URL（`http://` / `https://`） | ✓（grep 命中 1 行是「自我檢查紀錄」中**描述**「未出現 `http://` / `https://`」的字面，不是真的外部 URL） |
| 不含官方真題痕跡關鍵字（`official sample paper` / `歷屆考題原文` / `Cambridge Assessment`） | ✓ 全 0 命中 |
| prompt-template 含完整自我檢查 | ✓ |

依 runbook 第 4 節，純文件改動可略過 `npm run dev`。

## 【仍未處理】

- **P3-3-B 全部 5 條 ⬜**：AI API 串接、自動草稿 → JSON 轉換（與 P3-2-B 重疊）、自動圖像生成、自動 TTS、AI 評分（永久不做）。
- **P3-2-B 全部 4 條 ⬜**。
- **P3-4 ~ P3-6 全部 ⬜**：Listening 題型、Reading & Writing 題型、完整考卷 Session 與錯題複習。
- **P2-4C-2B-2 全部 7 條 ⬜**：補更多圖片素材、聽力 / 句型 / 位置 · 顏色 · 數量練習等。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。
- **舊 type 統一遷移**（待 P3-6 動工 `/quiz` UI 時做）。

## 【後續建議】

1. **請 Codex 用「驗收 9 段」做 P3-3-A 文件層回歸**：
   - 翻 `docs/AI_QUESTION_GENERATION.md` 確認 10 個 section 完整、6 項品質檢查清楚、與 P3-1 / P3-2-A 對齊正確。
   - 翻 `source_materials/ai_generated/prompt-template.md` 確認 prompt 主體可直接複製、8 項自我檢查到位、版本歷史框架建立。
   - 翻 `source_materials/ai_generated/example-ai-questions.md` 確認 6 題覆蓋 6 題型、id 不撞名既有、`source` / `promptVersion` 全對、自我檢查紀錄完整。
   - 翻 `docs/DATA_SCHEMA.md` 末段「AI 仿真題草稿與正式題庫的關係」確認流程圖正確、草稿欄位對應表清楚。
   - 確認 ROADMAP P3-3 標 🟡、P3-3-A 全 ✅、P3-3-B 全 ⬜（含 AI 評分永久不做）。
2. **首次實際使用 prompt 範本的建議步驟**（請 ChatGPT 收斂）：
   1. 從 `prompt-template.md` 主體區塊複製到 ChatGPT 或 Claude 對話。
   2. 視需要調整可調參數（題型清單、每題型題數、主題）。
   3. 收到 AI 輸出後逐項對照 8 項自我檢查。
   4. 通過後存到 `source_materials/ai_generated/<日期>-<topic>-batch01.md`。
   5. 由維護者依 6 項品質檢查審核。
   6. 通過審核 → 由人工整理（或未來 P3-2-B 工具）轉成 `data/*.json`。
3. **下一輪建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**直接跑一次實際 AI 出題流程**（人工把 prompt 貼給 AI、收到答案、人工審、不需要寫程式），把 prompt v1 在實務中驗證；若有問題遞增 v2。
   - 路線 B：**P3-2-B 文字 → JSON 轉換工具**（Node script），把 AI 草稿與 custom 草稿都能一次轉。
   - 路線 C：**P3-6 完整考卷 Session UI 第一版**（用既有 P3-1 範例 + AI 生成的少量題目做最小可玩流程）。
4. **`imagePrompt` 是否進正式 schema 的決策時機**：等到接 AI 圖像生成工具時再決定。本輪明示「不進」是保守選擇，避免 schema 過早擴張。
5. **本輪 prompt v1 預期會迭代**：實際使用後若 AI 生成題目偏向某種瑕疵（例如答案位置都在第一格、解析語氣偏正式），需加強 prompt 對應段落，遞增為 `starters-v2` 並在版本歷史記錄。

## 【Roadmap 同步檢查】

對照 `PROJECT_ROADMAP.md`，本輪實際變動：

- ✅ **P1**：未動。
- 🟡 **P2**：仍 🟡 進行中（P2-4C-2B-2 尚未開工）；所有 P2 勾選未動。
- 🟡 **P3**：仍 🟡 進行中。
  - ✅ **P3-1**：未動。
  - 🟡 **P3-2 本機資料匯入流程**：未動。
    - ✅ P3-2-A：未動。
    - ⬜ P3-2-B：未動。
  - 🟡 **P3-3 AI 仿真題生成規劃**：階段標題從「⬜」升到「🟡 進行中」。
    - ✅ **P3-3-A AI 仿真題 Prompt 標準格式（本輪 6 條全翻 ✅）**：
      - 規格文件 `docs/AI_QUESTION_GENERATION.md`
      - prompt 範本 v1
      - 草稿範例 6 題覆蓋 6 題型
      - 草稿欄位定義（`imagePrompt` / `ttsScript` / `promptVersion`）
      - 強制 `source: "ai_generated"`
      - DATA_SCHEMA 補對應節
    - ⬜ **P3-3-B 實際 AI 工具串接**：5 條 ⬜（AI API 串接 / 草稿 → JSON 自動化 / 圖像生成 / TTS / AI 評分永久不做）。
  - ⬜ **P3-4 / P3-5 / P3-6**：未動。
- ⬜ **P4 / P5**：仍「⬜ 已併入 P3-x」。
- ➕ **目前明確不做**：未動，本輪未引入登入 / 後端 / 雲端 / localStorage / 真實素材 / 依賴 / 測試框架，未串 AI API、未爬網路、未下載任何官方 / 歷屆 / 網路素材、未放 Cambridge 官方真題內容、未實作 `/quiz` UI。
- 變更紀錄追加 2026-05-08 一筆。

P3 整體仍未完成；**符合任務單「不要把 P3 整體標成完成」「不要進 P3-4 / P3-5 / P3-6」「不要把 P3-2-B 標完成」要求**。
