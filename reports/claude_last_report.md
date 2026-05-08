# Claude Code 回報 · P3 / P4 / P5 Roadmap 擴充：官方資源、AI 仿真題、Speaking Examiner Agent 規劃

任務日期：2026-05-08
任務性質：**純文件 / Roadmap 規劃**。**Codex 暫停期由 Claude 自測**。本輪不寫任何程式碼、不做爬蟲、不下載官方素材、不串 AI API、不做 TTS / 錄音 / STT / Speaking UI / localStorage / `/quiz` 修改、不新增依賴、不處理 npm audit、不部署、不新增後端 / DB / 登入。

## 【本輪修改摘要】

把專案的長期路線從「Listening / Reading & Writing 主線」擴充到「**完整 Cambridge Pre A1 Starters 仿真考試系統**」——加入官方資源人工整理、AI 仿真題流程、Listening / R&W Part 模板，並把 P4 從歷史佔位改寫為 **Speaking Examiner Agent 模擬考官系統**（agent-based flow，9 個子項），P5 改寫為 **完整仿真考試體驗**。

關鍵點：

- **Speaking 不是單次 AI 批改、而是 agent**：P4 全章節以 Speaking Examiner Agent 為核心，含狀態機（`currentPart` / `currentQuestionIndex` / `examinerPrompt` / `expectedAnswerType` / `childResponse` / `transcript` / `feedback` / `score` / `nextAction`），加 TTS 考官語音、麥克風錄音、STT、追問 / 下一題控制、評分器、session 紀錄、弱點分析共 9 子項。
- **AI 評分邊界重新對齊**：「目前明確不做」清單把「不做 AI 評分」改寫為「**不做客觀題的 AI 評分**」（answer 在 data 可比對者一律比對），並明示 **P4 Speaking Examiner Agent 提供的「口說練習回饋」不是 AI 評分**——是鼓勵性練習建議。
- **官方資源整理原則就位**：新增「**官方資源與歷史題整理原則**」段（`source_materials/README.md`）+ P3-7「官方資源索引與人工整理流程」（roadmap），明確「可以做：保存連結與人工筆記、自製題、AI 仿真題、自繪圖片、自製音檔」與「不可做：爬蟲、commit 官方 PDF / 圖片 / 音檔、複製歷屆題、用網路圖片當正式素材、聲稱 AI 題是官方題、外部 URL 進題庫」。
- **長期方向首次寫進 README**：明示專案長期會往完整 Starters 仿真系統發展、目前在 P3、Speaking 屬 P4 後續、AI 回饋僅作練習建議。
- **免責語句處處標示**：`AI 練習回饋，非官方考試分數`（ROADMAP × 3 / PRODUCT_SPEC × 1）+「練習回饋，非官方成績」（ROADMAP × 1 / PRODUCT_SPEC × 1）等表述貫穿四份文件。

`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）；零程式碼變動。

## 【修改檔案清單】

修改 4 份文件：

- **`PROJECT_ROADMAP.md`**：
  - 在 P3-6 計時相關段之後新增 **P3-7（官方資源索引與人工整理流程）**、**P3-8（AI 仿真題生成流程）**、**P3-9（正式題型模板化，含 Listening Part 1~4 + R&W Part 1~5 模板，明示 Speaking 不在 P3）** 三個 ⬜ 子分區。
  - 把 **P4「題型擴充 ⬜ 已併入 P3-4 / P3-5」歷史佔位章節**整段替換為 **P4 Speaking Examiner Agent 模擬考官系統**，含重要免責 callout + 與「不做 AI 評分」邊界相容性說明 + 9 個子項（P4-1 流程設計 / P4-2 狀態機設計 / P4-3 TTS 考官語音 / P4-4 錄音與播放 / P4-5 STT / P4-6 追問 / 下一題控制 / P4-7 AI 口說評分器 / P4-8 session 紀錄與家長檢視 / P4-9 弱點分析）。
  - 把 **P5「模擬考 ⬜ 已併入 P3-6」歷史佔位章節**整段替換為 **P5 完整仿真考試體驗**——Listening + R&W + Speaking 串成完整模擬考、TTS 考官貫穿、成績紀錄 / 家長檢視 / 弱點分析 / 錯題與口說弱點複習。
  - 章末附「歷史對照」一行說明舊 P4 / P5 內容已併入 P3-4 / P3-5 / P3-6（指向變更紀錄 2026-05-07）。
  - **「目前明確不做」清單**把「AI 評分」改寫為「**客觀題的 AI 評分**」並加例外說明：P4 Speaking Examiner Agent 的口說練習回饋不是 AI 評分；客觀題 AI 評分仍維持不做；補一條「自動下載官方 PDF / 圖片 / 音檔」（即使本機）。
  - **變更紀錄**追加 2026-05-08 一筆完整摘要。
- **`docs/PRODUCT_SPEC.md`**：
  - 在「測驗與考前練習方向 → 與小一設計原則的關係」之後、「第一版 MVP 範圍」之前新增 **長期目標：自家仿真 Starters 模擬考系統** 一節，含「設計原則」+ **Speaking Examiner Agent**（agent-based flow 完整描述：扮演考官、不是單次批改、TTS、錄音、STT、追問、狀態機欄位、localStorage 紀錄、鼓勵語氣、AI 分數定位、UI 標示、不做等級對應）+「完整仿真考試體驗（P5）」。
  - **「目前明確不做 → AI / 自動化」段**重寫為四條：客觀題不做 AI 評分 / Speaking 練習回饋例外 / 不做爬蟲 / 不下載官方 PDF / 圖片 / 音檔（指向 P3-7）。
- **`source_materials/README.md`**：
  - 在「⚠️ 禁止做」與「Git 政策」之間新增 **官方資源與歷史題整理原則** 一節，分「✅ 可以做」（6 條：保存官方連結、人工題型筆記、自製題、AI 仿真題、自繪圖片、自製音檔）與「❌ 不可做」（6 條：爬蟲、commit 官方 PDF / 圖片 / 音檔、複製歷屆題、網路圖片當正式素材、聲稱 AI 題是官方題、官方 URL 進題庫資料），結尾一句總結。
- **`README.md`**：
  - 在「目前功能」與「下一步」之間新增 **長期方向** 一節（4 個發展點 + 目前進度 P3 + Speaking 屬 P4 後續 + AI 回饋僅作練習建議的免責 + 三份文件指向）。

未動：`lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / 任何 components / 任何 app routes / `docs/DATA_SCHEMA.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TASK_ROUTER.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/.gitignore` / 各題型草稿 markdown / 既有圖片 / 音檔 / SVG / `package.json` / 任何依賴。

## 【核心邏輯說明】

### 1. P4 Speaking 從「單次 AI 批改」升級為「Examiner Agent 狀態機」

最關鍵的設計取捨：使用者明示「不要設計成 single-shot AI prompt」。本輪 P4 章節核心架構是 **agent-based flow**——

- **狀態機概念**：每個 turn 維持 9 個欄位（`currentPart` / `currentQuestionIndex` / `examinerPrompt` / `expectedAnswerType` / `childResponse` / `transcript` / `feedback` / `score` / `nextAction`），由 `nextAction` 驅動 turn 切換（`next-question` / `follow-up` / `end-part` / `end-session`）。
- **Agent 角色與台詞**：友善 Cambridge Starters 口說考官；考官台詞固定模板（Welcome / Now we're going to … / Thank you, well done!）。
- **流程**：考官提問（TTS）→ 小孩錄音 → STT 轉文字 → Agent 判斷 → 進下一題 / 追問 / 結束。
- **追問邏輯**：答案合理 → 鼓勵 → 下一題；答案聽不清楚或太短 → 簡單追問；答案不相關 → 友善 redirect。每題追問次數上限 2 次避免小朋友卡住。
- **不糾正細節文法**：以「能溝通」為合格門檻。

這個結構讓未來實作時可以把 Agent 想成一個「跑 turn-based loop 的協調者」，而不是「一個 prompt 跑完」——降低了 single-shot AI 評分的可靠度焦慮，也對齊真實考試 examiner 的互動結構。

### 2. AI 評分邊界重新對齊（客觀題 vs Speaking 開放回答）

舊 ROADMAP / PRODUCT_SPEC 把「**不做 AI 評分**」當成硬邊界。但 P4 引入 Speaking Examiner Agent 後必然涉及對開放式回答的 AI 回饋，所以需要重新切分：

| 類型 | 評分方式 | 定位 |
| --- | --- | --- |
| 客觀題（mc / pc / wc / lc / fb / mt） | `answer` 直接比對 | 自動評分（不交給 AI） |
| Speaking 開放回答（Part 1~4） | Agent 給觀察點回饋 | **練習建議 / 不是考試評分** |

兩處改寫：

- **`PROJECT_ROADMAP.md`「目前明確不做」**：把單行「AI 評分」改為「**客觀題的 AI 評分**」並加 `> 例外說明` callout 明示 P4 Speaking 練習回饋不是 AI 評分。
- **`docs/PRODUCT_SPEC.md`「目前明確不做 → AI / 自動化」**：四條重寫，前兩條把客觀題 AI 評分（不做）與 Speaking 練習回饋（不是評分）並列，明示後者 UI 處處標示「練習回饋 / 不是官方成績」、不對外宣稱能預測 Cambridge 官方分數、不做 Pre A1 / A1 / A2 等級對應。

P4 章節開頭也有 `⚠️ 與既有「不做 AI 評分」邊界的關係` callout，讓未來輪次的 Claude / Codex / ChatGPT 一眼看到此切分。

### 3. 免責語句「AI 練習回饋，非官方考試分數」貫穿全文件

避免日後使用者或家長誤解，本輪刻意在多處標示「練習回饋 / 不是官方成績」：

- ROADMAP P4 章節開頭 `⚠️ 重要免責` callout（4 條：練習回饋 / 不預測官方分數 / 不當正式證明 / UI 必標）
- ROADMAP P4-7 AI 口說評分器：`UI 標示「**AI 練習回饋，非官方考試分數**」必出現在每個評分畫面`
- ROADMAP P5 末條：`AI 評分一律標示「**練習回饋，非官方考試分數**」`
- PRODUCT_SPEC 長期目標 → Speaking Examiner Agent 段：「AI 分數只能作為練習回饋，不是 Cambridge 官方成績」「UI 必須清楚標示」「不做 Cambridge 等級對應宣稱」
- README 長期方向：「AI 提供的口說回饋僅作為鼓勵性練習建議，不是 Cambridge 官方成績；本專案不會聲稱能預測官方分數，也不做能力等級對應」

`grep` 驗證：`AI 練習回饋，非官方考試分數` 在 ROADMAP × 3、PRODUCT_SPEC × 1；`練習回饋，非官方成績` 在 ROADMAP × 1、PRODUCT_SPEC × 1。

### 4. P3-7 / P3-8 / P3-9 的分工

| 子分區 | 主軸 | 與舊規劃關係 |
| --- | --- | --- |
| **P3-7 官方資源索引與人工整理流程** | 連結 + 人工筆記，**不下載 / 不爬蟲 / 不轉入正式題庫** | 全新；新增 `docs/OFFICIAL_RESOURCES.md`（規劃中） |
| **P3-8 AI 仿真題生成流程** | 把 P3-3 prompt + P3-7 題型結構對齊成完整工作流 | 是 P3-3 的「流程文件」延伸；API 串接仍屬 P3-3-B |
| **P3-9 正式題型模板化** | Listening Part 1~4 + R&W Part 1~5 結構化模板 | 把 P3-6-A 的 `getStarterPartInfo()` 升級為結構化模板；Speaking 不在 P3 |

P3-9 明確排除 Speaking，避免與 P4 範圍混淆——Speaking Part 模板由 P4 Speaking Examiner Agent 統一處理。

### 5. 官方資源整理原則「兩段平行」設計

`source_materials/README.md` 與 `PROJECT_ROADMAP.md` P3-7 都標明「可以做 / 不可做」邊界。兩處有意保持平行（同樣的 6 + 6 條清單與同樣的措辭）：

- `source_materials/README.md` 是給整理者（家長 / Claude / ChatGPT）執行時的 SOP。
- `PROJECT_ROADMAP.md` P3-7 是給未來輪次 AI 任務分配時的硬邊界。

ROADMAP 那段是條目化任務清單（給未來 P3-7 動工時打勾），`source_materials/README.md` 那段是執行時規範（每次整理素材都該重看一次）。

### 6. 沒做的事（嚴守任務單禁止清單）

- 沒寫任何 crawler / 爬蟲程式碼
- 沒下載任何官方 PDF / 圖片 / 音檔 / 歷屆題
- 沒新增任何題目資料 / `data/*.json`
- 沒做 AI API / TTS / 錄音 / STT / AI 評分 / Speaking UI / localStorage / `/quiz` 功能修改
- 沒新增依賴
- 沒處理 npm audit
- 沒部署
- 沒新增後端 / DB / 登入

## 【測試結果】

> 本輪純文件變動，但任務單明示要跑三項驗證。

- `npm run lint` → **通過**（0 警告 0 錯誤；ESLint 不檢查 markdown，純跑通過程式碼確認沒被誤動）。
- `npm run typecheck` → **通過**（exit 0；TypeScript 編譯零變動）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static、`Generating static pages 88/88 in 240ms`）。
- 結構抽檢：
  - ROADMAP 三段 P3-7 / P3-8 / P3-9 標題就位（line 263 / 276 / 288）
  - ROADMAP P4 章節改寫成功（line 307 開頭，9 個子項 P4-1 ~ P4-9 全到 line 319 / 328 / 346 / 353 / 361 / 368 / 377 / 391 / 398）
  - ROADMAP P5 改寫成功（line 405）
  - PRODUCT_SPEC 長期目標 + Speaking Examiner Agent + 完整仿真考試體驗段就位（line 269 / 284 / 306）
  - source_materials/README 官方資源整理原則 + 可 / 不可做雙段就位（line 58 / 62 / 71）
  - README 長期方向就位（line 108）
  - 免責語句處處可見（grep 命中數合理）

## 【仍未處理】

- **P3-6-B 全部未開始**（localStorage / 4 操作 / 結果頁 / 錯題複習 / 計時器）。
- **P3-7 / P3-8 / P3-9 全部未開始**（本輪僅規劃，未動工）：
  - `docs/OFFICIAL_RESOURCES.md` 尚未建立（屬 P3-7 動工範圍）。
  - `docs/STARTERS_PART_TEMPLATES.md`（規劃中名字）尚未建立（屬 P3-9 動工範圍）。
  - P3-8 的人工 + AI 工作流文件尚未撰寫（屬 P3-8 動工範圍）。
- **P4 Speaking Examiner Agent 全部未開始**（9 子項皆 ⬜）。
- **P5 完整仿真考試體驗未開始**。
- **P2-4C-2B-2 全部未開始**（單字閱讀模式、拼字測驗模式、TTS 真實音檔、補圖、聽力 / 句型 / 位置練習）。
- **P3-2-B / P3-3-B / P3-4 / P3-5 全部未開始**。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【後續建議】

1. **5/12 Codex 恢復後跑文件驗收**：請 Codex 重點檢查
   - P4 Speaking Examiner Agent 章節是否與 PRODUCT_SPEC「Speaking Examiner Agent」段措辭一致。
   - 「目前明確不做」清單在 ROADMAP 與 PRODUCT_SPEC 兩處的 AI 評分邊界是否互相 cross-reference 正確。
   - 「官方資源整理原則」在 `source_materials/README.md` 與 P3-7 兩處的 6 + 6 條是否平行。
   - 免責語句是否在每個提到 AI 評分的場合都標示。
2. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-7 官方資源索引動工**——撰寫 `docs/OFFICIAL_RESOURCES.md` 第一版，含 Cambridge English Starters wordlist 對照。
   - 路線 B：**P3-9 部分動工**——把 P3-6-A 的 `getStarterPartInfo()` 升級為結構化模板，撰寫 `docs/STARTERS_PART_TEMPLATES.md` 第一版（Listening Part 1~4 + R&W Part 1~5 的題目數 / 選項類型 / 敘述模板 / `imagePrompt` / `ttsScript` 模板）。
   - 路線 C：**P3-6-B 第一刀**——localStorage Session 持久化（schema 已在 P3-1 定好）。
   - 路線 D：**P2-4C-2B-2 補真實音檔**或補圖。
   - 路線 E：**P3-2-B 轉換工具**第一刀。
3. **P4 動工前先補規劃**：P4 涉及瀏覽器 API（MediaRecorder / SpeechRecognition）+ 可能的雲端依賴（雲端 STT / 雲端 TTS），動工前建議先寫一份 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md` 細部設計（狀態機介面、台詞模板、評分維度權重、UI 草稿、權限提示流程），避免直接跳實作。
4. **Speaking Examiner Agent 與 P4 的 AI 依賴**：未來實作時應評估「本機 only / 雲端 STT-TTS / 純前端 Web Speech API」三條路線的取捨；建議優先 Web Speech API（純前端、不上雲、與「目前明確不做」相容性最高），雲端方案僅作備援。
5. **官方資源連結整理時**：建議只放主要入口（cambridgeenglish.org 的 Pre A1 Starters 主頁、wordlist PDF 公開頁），逐項連結配人工筆記，避免抓「子頁面 / 直接下載連結」誤踩版權邊界。
6. **正式題型模板化**：撰寫 P3-9 的 Part 模板時建議直接以 P3-1 既有 `ExamQuestion` discriminated union 為輸入，每個 Part 模板輸出至少含「題目數、選項類型、敘述模板、imagePrompt 模板、ttsScript 模板」5 欄位；模板要能反向當作 P3-8 AI 出題的 prompt 變數。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪**只新增 P3-7 / P3-8 / P3-9 三個 ⬜ 子分區**，沒勾任何 ✅。
  - ✅ P3-1 / P3-2-A / P3-3-A / P3-6-A：上輪起維持 ✅，本輪未動。
  - ⬜ P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B：本輪未動。
  - ⬜ **P3-7 官方資源索引與人工整理流程**（新增）：8 條任務全 ⬜。
  - ⬜ **P3-8 AI 仿真題生成流程**（新增）：7 條任務全 ⬜。
  - ⬜ **P3-9 正式題型模板化**（新增）：5 條任務全 ⬜（Listening Part 1~4 + R&W Part 1~5 + 模板升級 + 模板輸出 + Speaking 排除）。
- ⬜ **P4**：本輪**從歷史佔位重啟為「Speaking Examiner Agent 模擬考官系統」**，9 個子項全 ⬜（P4-1 ~ P4-9）。
- ⬜ **P5**：本輪**從歷史佔位重啟為「完整仿真考試體驗」**，8 條任務全 ⬜。
- ➕ **目前明確不做**：把「AI 評分」改寫為「客觀題的 AI 評分」並加例外說明（P4 Speaking 練習回饋不是 AI 評分）；補一條「自動下載官方 PDF / 圖片 / 音檔」。
- 變更紀錄追加 2026-05-08 一筆。

P3 整體仍 🟡 進行中；P4 / P5 重新進入 Roadmap 雷達，但全部 ⬜，**符合任務單「本輪只做文件與 Roadmap 規劃，不做功能實作」要求**。
