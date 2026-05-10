# Project Roadmap

階段以 P 為單位，由淺入深。✅ 表示已完成、🟡 進行中、⬜ 未開始。

---

## P1 基礎架構（✅ 已完成）

- ✅ Next.js + TypeScript + Tailwind 初始化
- ✅ 資料夾結構：`app/`、`components/`、`data/`、`lib/`、`public/{images,audio}`、`docs/`
- ✅ 首頁 + 兩個入口（複習區 / 測驗區）
- ✅ 範例 `vocabulary.json` 與 `quizzes.json`
- ✅ 已建立 `lib/data.ts` 基礎資料載入 helper（type-safe 匯出 `vocabulary` / `quizzes`，供 P2、P3 串接使用）
- ✅ 文件骨架（README、AI_DEV_WORKFLOW、ROADMAP、PRODUCT_SPEC、DATA_SCHEMA、TASK_ROUTER）
- ✅ `npm run lint` / `typecheck` / `build` 全綠
- ✅ AI workflow 文件規範補齊（語言規則、Codex 驗收前置閱讀）
- ✅ Codex 驗收手冊建立（`docs/CODEX_VALIDATION_RUNBOOK.md`）
- ✅ AGENTS.md / CLAUDE.md 規則指向整理

### 可選 housekeeping（不阻擋 P2）

- ⬜ 加入 `.editorconfig`
- ⬜ 加入簡單的 GitHub repo / 遠端

## P2 單字複習（🟡 進行中）

> 註：`lib/data.ts` 的型別安全載入 helper 已於 P1 完成。P2 重點是**頁面串接與互動 UI**，不再重做 helper 本身。
> UI / UX 一律遵守 `docs/PRODUCT_SPEC.md` 的「國小低年級使用者設計原則」與「單字複習主流程」。
> 主流程於本輪起改為 **A~Z 字母入口 → 字母總覽 → 單字詳情**；原 category tab 模式保留為未來補充模式。

### P2-1 基礎資料串接與單字卡能力（已完成）

- ✅ `/review` 串接 `lib/data.ts` 的 `vocabulary`
- ✅ 單字卡 UI：圖片區 + 英文 + 中文 + 例句 + 發音按鈕
- ✅ 圖片 fallback：缺圖時改為首字母色塊（client 預載 + 初始 placeholder）
- ✅ 發音播放 fallback：缺音檔或播放失敗時顯示「音檔準備中」提示

### P2-2 A~Z 字母入口與字母總覽

- ✅ `/review` 主入口改為 A~Z 字母網格（後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`，`/review` 改為複習中心首頁）
- ✅ 字母按鈕顯示該字母目前單字數；無單字字母淡化 / 不可點
- ✅ 新增 `/review/letter/[letter]` 字母總覽頁，列出該字母所有單字
- ✅ 補入 `lib/vocabularyNavigation.ts` helper（letter status、word list、word navigation）

### P2-3 單字詳情頁與跨字母順序導覽

- ✅ 新增 `/review/word/[id]` 單字詳情頁（重用 `VocabularyCard` 與 fallback 邏輯）
- ✅ 詳情頁「上一個 / 下一個」依整體 A~Z 順序前進，自動跨字母
- ✅ 第一個單字 disabled 上一個、最後一個單字 disabled 下一個
- ✅ 詳情頁提供「回 X 總覽」返回連結

### P2-4A 單字補強 + 詳情頁翻牌互動

- ✅ 補強 `data/vocabulary.json` 至 54 筆，覆蓋 17 個字母與全部 11 個分類（每筆沿用既有 schema、placeholder image / audio path）
- ✅ `VocabularyCard` 新增 `revealMode` prop，初始隱藏中文翻譯與例句
- ✅ `/review/word/[id]` 啟用翻牌：「🔍 看答案」/「🙈 再想一次」雙態切換；切換上一個 / 下一個自動回到收起狀態（靠父層 `key={current.id}` remount）

### P2-4B 複習中心首頁與複習類型入口

> `/review` 與 `/quiz` 分工：`/review` 複習中心**只負責分項能力練習**（5 張主入口卡）；考卷、歷屆 / sample 題、AI 仿真題、交卷評分等屬 `/quiz` 測驗區。複習中心可在頁面底部放一個低視覺層級的輔助提示連到 `/quiz`，但不作為主入口卡。

- ✅ `/review` 改為複習中心首頁（**5 張主入口卡**，不再是 A~Z 字母網格）
- ✅ A~Z 單字複習移到 `/review/words`，原 `/review/letter/[letter]` 與 `/review/word/[id]` 動線完整保留
- ✅ 看圖練習入口（卡片顯示「準備中」，未來連到 `/review/picture` 或類似路徑）
- ✅ 聽力練習入口（卡片顯示「準備中」）
- ✅ 句型練習入口（卡片顯示「準備中」）
- ✅ 位置 / 顏色 / 數量入口（卡片顯示「準備中」）
- ✅ 底部輔助提示「想做完整考卷？請到測驗區。」連到 `/quiz`（**視覺層級低於主入口卡**，避免讓人誤把考卷功能當成複習中心主功能；`/quiz` 仍維持骨架，本輪未動）
- ✅ 平板同 Wi-Fi 使用策略補入 `README.md` 與 `docs/PRODUCT_SPEC.md`

### P2-4C 真實素材與複習類型實作（🟡 進行中）

> 註：本子階段把舊版 P2-4B 的「真實素材」收尾任務，與 P2-4B 新增的「準備中」入口未來實作合併在同一階段。
> 各個複習類型（看圖、聽力、句型、位置 / 顏色 / 數量）的具體實作細節，待 ChatGPT 收斂為獨立任務單後再交給 Claude Code 動工。

#### P2-4C-1 看圖練習第一版（已完成）

- ✅ 新增 `/review/picture` 看圖練習頁（server page + `<PicturePractice>` client 元件）
- ✅ 題型「看圖選英文」4 選 1
- ✅ Deterministic 選項生成（避免 hydration mismatch）：正確答案 + 後 3 個 vocabulary 循環取，正確答案位置 = `index % 4`
- ✅ 點選後即時答對 / 答錯回饋，鼓勵語氣，答錯顯示正確答案
- ✅ 「下一題」按鈕切換，全部題庫循環，無 crash
- ✅ 圖片缺檔 fallback（與 `VocabularyCard` 同風格：首字母 + 「圖片準備中」、client 預載成功才切真圖）
- ✅ 進度指示「第 X 題 / 共 N 題」
- ✅ `/review` 看圖練習卡片從 coming-soon 改為 ready，連 `/review/picture`
- ✅ 不做分數保存、不做交卷、不做 localStorage（屬 `/quiz` 測驗區範圍）

#### P2-4C-2A 看英文選圖第二題型（已完成）

- ✅ `/review/picture` 新增題型切換 tab（看圖選字 / 看字選圖），預設「看圖選字」
- ✅ 切換題型時自動 reset 到第 1 題，狀態完全重置
- ✅ 新增 `WordToImageQuestion`：題目顯示英文單字（sky-50 區塊區別於圖片題目區）+ 4 個圖片選項（grid-cols-2，每個用 `<PracticeImage>`，缺圖時 fallback 顯示首字母）
- ✅ 即時答對 / 答錯回饋：答對顯示「🎉 答對了！」，答錯顯示「差一點點！正確答案是 {word} 那張圖」+ 鼓勵語
- ✅ 答對 / 答錯視覺與看圖選字一致（emerald / rose / 淡化）；答錯時錯選項 rose、正確圖片仍 emerald 高亮
- ✅ 「下一題」按鈕循環，全題庫 54 題無 crash
- ✅ 抽出 file-private `PracticeImage` 元件，看圖選字大圖與看字選圖選項小圖共用，size 由 prop 控制（lg / sm）
- ✅ 抽出 file-private `NextButton` 元件，兩題型共用
- ✅ Deterministic 選項生成沿用 P2-4C-1 同一個 `buildOptions` helper

#### P2-4C-2B-1 小批圖片素材接入與 fallback 回歸（已完成）

- ✅ 新增 10 個自製 SVG 圖像素材到 `public/images/`（apple / cat / dog / book / red / blue / one / two / mother / father）
- ✅ 風格統一：`viewBox="0 0 200 200"` + 淡黃 `#fef3c7` 背景，純圖形（color 用色塊不放單字文字、避免洩漏答案）
- ✅ 更新 `data/vocabulary.json` 中對應 10 筆的 `image` 從 `.png` 改為 `.svg`，其餘 44 筆 placeholder path 維持，讓 fallback 仍可測
- ✅ `<PracticeImage>` / `<VocabularyCard>` 圖片預載與 fallback 邏輯**未動**——`<img>` + `new window.Image()` 對 SVG 原生支援，與 PNG 行為一致
- ✅ 不下載 Cambridge 官方圖片、不下載歷屆考題圖片、不使用網路抓圖、不使用版權外部素材

#### P2-4C-2B-2 後續複習類型與素材（🟡 部分進行中）

- ⬜ 補更多自製 SVG / PNG 圖片素材（往剩下 44 個未補圖單字推進）
- 🟡 真實音檔（建議用 TTS 自製，避免官方版權）——**P3-9-C 第一刀已落地第一個 L3 listening 自製 TTS 音檔**（`public/audio/starters/l3/q-lc-001.m4a`，macOS `say` + `afconvert` 流程）；完整流程與硬邊界文件 `docs/TTS_AUDIO_WORKFLOW.md` 已就位；**P2 vocabulary 音檔仍 ⬜**——需逐筆補 54 字單字音檔
- ⬜ 補齊更多單字（往未覆蓋字母 I / K / L / N / Q / U / V / X / Z 推進）
- ⬜ 聽力練習實作（聽單字 / 聽句子、選圖片）
- ⬜ 句型練習實作（`This is...` / `I can see...` / `There is...`）
- ⬜ 位置 / 顏色 / 數量練習實作（介系詞、顏色 + 名詞、數字 + 名詞）
- ⬜ 視需要再啟用 category 補充模式入口（既有元件已保留）
- ⬜ **單字閱讀練習模式**：圖片 + 英文 + 可顯示中文 + 「下一個」；屬 review 區（不是正式考卷）；視需要可作為 `/review/words` 詳情頁的補充模式
- ⬜ **單字拼字測驗模式**：只顯示圖片、不顯示英文答案、孩子自己拼字輸入、可按「看答案」、「下一題」；屬 review 區獨立練習模式（**對應正式 Cambridge Starters Reading & Writing Part 3 結構**，但不是 `/quiz` 考卷流程）

## P3 考前練習與題庫（🟡 進行中）

> P3 是「測驗區」的完整路線，從題目資料、素材策略、各題型一直到模擬考與錯題複習。
> P3-1 已完成（schema / 型別 / 範例資料 / 文件）；P3-2 ~ P3-6 皆 ⬜，請暫不要動。
> 詳細產品方向見 `docs/PRODUCT_SPEC.md`「測驗與考前練習方向」。
> P3 涵蓋了原 P4「題型擴充」與原 P5「模擬考」的內容；舊章節保留作為歷史紀錄（見下文）。

### P3-1 考題資料 schema 擴充（已完成）

> 範圍：本子階段只做**資料 schema / 型別 / 範例資料 / 文件**，**不做** UI / localStorage 實際讀寫 / AI 出題工具 / 匯入工具。

- ✅ `QuestionSource` 字串字面量（`official_sample` / `past_paper` / `ai_generated` / `custom`）寫入 `lib/types.ts`
- ✅ `QuestionType` discriminator（`multiple-choice` / `picture-choice` / `word-choice` / `listening-choice` / `fill-blank` / `matching`）寫入 `lib/types.ts`
- ✅ `BaseQuestion` 共用欄位：`id` / `type` / `source` / `prompt` / `explanation` / `image` / `audio` / `difficulty` / `topic` / `promptVersion`
- ✅ 6 個題型專屬型別：`ExamMultipleChoiceQuestion` / `PictureChoiceQuestion` / `WordChoiceQuestion` / `ListeningChoiceQuestion` / `FillBlankQuestion` / `MatchingQuestion`，皆 extend `BaseQuestion`；`ExamQuestion` discriminated union 統合
- ✅ Listening 題目特化欄位：`audio` 必填、可選 `transcript`、`ttsScript`、`optionType`
- ✅ `ExamPaper` 完整考卷型別：`examPaperId` / `title` / `description` / `sections` / `sourceMix` / `createdAt` / `updatedAt`
- ✅ `ExamSection` / `SourceMix` 配套型別
- ✅ `ExamSessionState` localStorage 狀態型別：含 `examSessionId` / `examPaperId` / `questionOrder` / `answers` / `currentIndex` / `submitted` / `score` / `wrongQuestionIds` / `createdAt` / `updatedAt` / `schemaVersion`，附 `ExamAnswerMap` 配套
- ✅ schema 完整寫入 `docs/DATA_SCHEMA.md`「P3 考前練習：題庫 / 考卷 / Session schema」段，含 6 題型 + ExamPaper + Session + localStorage key 命名提案 + 「不在 P3-1 範圍」清單
- ✅ 範例資料：新增 `data/p3-example-questions.json`（7 題涵蓋 6 題型）與 `data/exam-papers.example.json`（1 份範例考卷），不被 `lib/data.ts` import，純 schema 演示
- ✅ 既有 `MultipleChoiceQuestion` / `QuizQuestion` / `Quiz` / `data/quizzes.json` 完全不動，舊 schema 與新 schema 並存

### P3-2 本機資料匯入流程（🟡 進行中）

> 範圍拆兩個子階段：P3-2-A 規劃 / 文件（純人工流程，本輪完成）；P3-2-B 自動化工具（未來，本輪不做）。

#### P3-2-A 資料夾規劃與 SOP 文件（已完成）

- ✅ 建立 `source_materials/` 資料夾結構：`samples/` / `past_papers/` / `ai_generated/` / `custom/` 四個子目錄各對應一個 `QuestionSource`，皆有 `.gitkeep` 保留
- ✅ 撰寫 `source_materials/README.md` 匯入 SOP：用途定位、資料夾與 `source` 對應、可放 / 禁止做、git 政策、建議流程、命名規範、與 P3-1 schema 關係、不在 P3-2-A 範圍清單
- ✅ `source_materials/.gitignore` 排除原始二進位（PDF / 圖片 / 音檔 / 影片 / 壓縮檔），保留純文字（`.md` / `.txt` / `.csv` / `.json` / `.gitkeep`）
- ✅ 範例草稿檔 `source_materials/custom/example-question-draft.md`：欄位對照表 + 7 個範例（覆蓋 6 題型，自製內容、不抄真題）+ 命名規範 + 提醒
- ✅ `docs/DATA_SCHEMA.md` 補「本機素材匯入流程（P3-2-A）」一節：三層資料分工、`source` ↔ 整理區子目錄對應、工作流程圖、P3-2-A vs P3-2-B 範圍切分、嚴禁清單
- ✅ 第一版**不做**自動網路爬蟲（已寫入 `source_materials/README.md` 與 DATA_SCHEMA 兩處）

#### P3-2-B 自動化工具（尚未開始）

- ⬜ 整理後文字 / CSV → `data/*.json` 的轉換工具（CLI 或 script）
- ⬜ 圖片素材命名規範 helper / 批次重命名工具
- ⬜ 音檔素材命名規範 helper（含 TTS 自動生成 wrapper，例如 macOS `say -o` 包裝）
- ⬜ JSON schema 驗證 helper（對齊 `lib/types.ts` 的 `ExamQuestion` 確保整理出的題目欄位完整）

### P3-3 AI 仿真題生成規劃（🟡 進行中）

> 範圍拆兩個子階段：P3-3-A 文件 / prompt 範本（本輪完成）；P3-3-B 實際 AI 工具串接（未來，本輪不做）。

#### P3-3-A AI 仿真題 Prompt 標準格式（已完成）

- ✅ 撰寫 `docs/AI_QUESTION_GENERATION.md` 規格文件（10 個 section：定位 / 難度原則 / 來源規則硬邊界 / 題型範圍 / 草稿輸出格式 / 轉換流程 / 品質檢查 6 項 / 與 P3-1 + P3-2-A 對齊 / 不在 P3-3 範圍 / 版本化）
- ✅ 撰寫 `source_materials/ai_generated/prompt-template.md` 可直接複製給 AI 使用的 prompt 範本（v1）：角色 / 年齡 / 6 題型 / 可調參數 / 類 YAML 草稿格式 / 硬邊界 / 8 項自我檢查
- ✅ 撰寫 `source_materials/ai_generated/example-ai-questions.md` AI 草稿範例：6 題覆蓋 6 種題型（`q-ai-mc-001` / `q-ai-pc-001` / `q-ai-wc-001` / `q-ai-lc-001` / `q-ai-fb-001` / `q-ai-mt-001`），id 與既有 P3-1 範例不撞名；附自我檢查紀錄與整理者提醒
- ✅ 草稿欄位定義：`imagePrompt`（描述自製插畫需求）/ `ttsScript`（描述自製音檔腳本）/ `promptVersion`（出題 prompt 版本，便於回溯品質）
- ✅ 強制 `source: "ai_generated"`、嚴禁假裝為 `official_sample` / `past_paper` / `custom`
- ✅ `docs/DATA_SCHEMA.md` 補「AI 仿真題草稿與正式題庫的關係（P3-3）」一節：草稿 → 審核 → 正式題庫流程圖、草稿欄位 vs 正式 schema 對應表、P3-3-A 範圍切分
- ✅ 已新增 prompt v1 第一批人工試跑草稿 `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`：8 題覆蓋 6 題型（mc × 2 / pc × 1 / wc × 1 / lc × 2 / fb × 1 / mt × 1），id 用 `q-ai-v1-*-001/002` 與既有不撞名，附完整人工品質檢查紀錄表（10 項全 ✓）+ 「需要日後調整」分析（含對 P2-4C-2B-2 圖片 / 音檔素材的依賴）

#### P3-3-B 實際 AI 工具串接（尚未開始）

- ⬜ AI API 客戶端串接（OpenAI / Anthropic / Claude SDK 等）
- ⬜ 自動把 AI 草稿轉成正式 `data/*.json`（屬 P3-2-B 範圍，未來合併）
- ⬜ 自動圖像生成 wrapper（如有需要，先評估自製素材策略）
- ⬜ 自動 TTS 生成 wrapper（macOS `say -o` 或雲端 TTS）
- ⬜ AI 評分功能：**永久不做**（見「目前明確不做」清單）

### P3-4 Listening 題型第一版

- ⬜ 聽音選圖（播音檔 → 三 / 四選一圖）
- ⬜ 聽句子選答案
- ⬜ 支援 audio path 與 TTS path 兩種來源
- ⬜ 缺音檔時 fallback：「音檔準備中」（沿用 P2 機制）

### P3-5 Reading & Writing 題型第一版

- ⬜ 看圖選字
- ⬜ 選字填空（給選項版的 fill blank）
- ⬜ Matching / 連連看
- ⬜ Fill in the blanks（自由填空，比對忽略大小寫與前後空白）
- ⬜ 簡單拼字（看圖拼字）

### P3-6 完整考卷 Session、交卷與錯題複習（🟡 進行中）

> 階段拆兩個子階段：P3-6-A 最小可玩第一版（本輪完成）；P3-6-B 持久化 / 操作 / 結果頁完整版（未來）。
> 既有「完整考卷生成 / 作答進度保存 / 考卷操作 / 交卷與結果頁 / 計時相關」5 個分區為 P3-6-B 完整目標；本輪只做 P3-6-A 最小可跑版。

#### P3-6-A `/quiz` 最小可玩流程第一版（已完成）

- ✅ `/quiz` 從骨架升級為**可實際操作**的測驗頁（server page 載入 P3-1 範例資料 + `<QuizPlay>` client 元件管狀態）
- ✅ 讀取 `data/exam-papers.example.json` 第一份考卷 + `data/p3-example-questions.json` 7 題；依 sections 順序平鋪 questionOrder
- ✅ 進度顯示「第 X 題 / 共 N 題」+ 6 題型最小渲染（multiple-choice / picture-choice / word-choice / listening-choice / fill-blank 選項版 + 自由填空版 / matching 閱讀型）
- ✅ 一題一頁流程：未答題「下一題」disabled、答完可前進、最後一題顯示「看結果」
- ✅ 完成畫面：「答對 N / M 題」+ 依答對率四級鼓勵文案 + 「🔁 重新開始」按鈕 + 回首頁 link
- ✅ matching 題用閱讀型（顯示 pairs + 「我看完了」）作答；計分時視為「答完即正確」
- ✅ fill-blank 自由填空（無 options）用 text input，比對忽略大小寫與前後空白（對齊 schema 規則）
- ✅ listening 題顯示 transcript / ttsScript 文字（最小可玩，**不播放音檔**——音檔自製屬 P2-4C-2B-2 範圍）
- ✅ 圖片缺檔 fallback：file-private `<QuizImage>` 元件（與 `<PracticeImage>` 同模式但獨立，避免動 P2-4C 既有元件）；`new window.Image()` 預載成功才切真圖
- ✅ `lib/data.ts` 最小擴充：新增 `p3ExampleQuestions` / `p3ExamplePapers` export，舊 `vocabulary` / `quizzes` 不動
- ✅ 第一版**不計時**（對齊 PRODUCT_SPEC「測驗與考前練習方向 → 完整考卷 Session → 計時相關」）
- ✅ 純 React local state，**無 localStorage / 後端 / DB**
- ✅ 題目排序貼近正式 Cambridge Starters：Section 1 Listening（`listening-choice`）→ Section 2 Reading & Writing（`picture-choice` → `word-choice` → `multiple-choice` → `fill-blank` → `matching`）；題目卡頂端顯示對應段落徽章（sky 系 / amber 系），不修改 JSON 來源
- ✅ 題目卡加 Part 標示對齊正式 Cambridge Pre A1 Starters parts 架構：`getStarterPartInfo()` helper 把 6 題型映射到對應 Part（lc → Part 3 聽音選圖；pc → Part 1 / Part 2 preview 看圖判斷 / 看圖選答案；wc → Part 3 看圖認字 / 拼字練習；mc → Part 4 preview 短句選字；fb → Part 4 短文 / 句子填空；mt → Part 5 preview 圖文配對 / 故事理解預備）；徽章合併段落英文｜中文「Listening｜聽力練習」/「Reading & Writing｜閱讀與書寫練習」，徽章下方獨立行顯示「Part X：題型中文」；頁首補小字「目前為練習版，題型逐步對齊正式 Cambridge Starters」避免使用者誤解為完整正式考卷

#### P3-6-B 持久化 / 操作 / 結果頁完整版（🟡 進行中）

> 詳細產品方向見 `docs/PRODUCT_SPEC.md` 的「測驗與考前練習方向 → 完整考卷 Session」。
>
> 子分區：P3-6-B-1（localStorage 持久化，已完成）+ P3-6-B-2（繼續作答 / 重新測驗 / 直接交卷，已完成）+ P3-6-B-3（完整結果頁與每題詳解）+ P3-6-B-4（錯題詳解與錯題複習）+ P3-6-B-5（計時器）。

##### P3-6-B-1 localStorage Session 持久化（已完成）

- ✅ 新增 `lib/examSessionStorage.ts` helper：集中處理 localStorage key (`cambridge-starters-practice:quiz-session:v1`)、`loadSession` / `saveSession` / `clearSession` / `createEmptySession` / `isCompatibleSession`、`schemaVersion = 1` 檢查、try/catch 防壞資料 / SSR 環境（`typeof window === "undefined"`）造成頁面崩潰
- ✅ Session 欄位精簡版：`schemaVersion` / `paperId` / `questionOrder` / `currentIndex` / `answers`（key = 題目 id、value = 字串）/ `submitted` / `startedAt` / `updatedAt` / `submittedAt`（可選）
- ✅ 與 `lib/types.ts` 的 `ExamSessionState` 概念對齊但**精簡**：第一刀不存 `examSessionId` / `score` / `wrongQuestionIds` 等欄位（屬 P3-6-B-3+ 範圍）
- ✅ `components/QuizPlay.tsx` 三個獨立 state（currentIndex / answers / submitted）改為單一 `session` state；hydration 後嘗試從 localStorage 恢復；session 變更後自動寫回 localStorage
- ✅ 不相容情境（schemaVersion / paperId / questionOrder 任一不符 / JSON parse 失敗 / SecurityError 等）一律丟棄舊 session 並建立新 session，**頁面不 crash**
- ✅ 嚴守邊界：只存使用者作答狀態；不存官方資料、不存圖片本體、不存音檔本體

##### P3-6-B-2 繼續作答 / 重新測驗 / 直接交卷（已完成）

- ✅ **繼續作答**：重新整理 / 重開分頁時，若 localStorage 中有同 paperId + questionOrder 的 session 則自動恢復 currentIndex / answers / submitted；畫面頂端顯示 emerald 系小提示「🔁 已恢復上次作答進度」（按下方「重新測驗」可清除重來）；首次點選任何答案後提示自動消失
- ✅ **重新測驗**：題目卡下方加灰底 chip 按鈕「🔁 重新測驗」；按下後 `clearSession()` + 建立新 session（currentIndex = 0、answers = {}、submitted = false）；無 confirm dialog（依任務單）
- ✅ **直接交卷**：題目卡下方加 amber 系 chip 按鈕「📝 直接交卷」；按下後 submitted = true + submittedAt 寫入；立即進結果頁
- ✅ **結果頁**：顯示「答對 N / 共 M 題」+「已作答 X / 共 M」+「未作答 M-X 題」雙欄統計（emerald / rose 配色）+ 鼓勵文案（依答對率四級）+「重新測驗」按鈕（清 session、回第一題）；未作答題目算錯，UI 明示「未作答的題目算錯」鼓勵語
- ✅ 完成畫面的「重新測驗」與題目卡下方「重新測驗」共用同一個 `handleRestart`（清 localStorage + 建立新 session + 隱藏 restored 提示）
- ✅ 對應 `app/quiz/page.tsx` 補 `paperId` prop 傳給 `<QuizPlay>`（從 `paper.examPaperId` 讀，目前是 `starters-mock-001`）
- ✅ React 19 `react-hooks/set-state-in-effect` 規則：localStorage 讀取的 setState 透過 `queueMicrotask` 包成非同步 callback，與既有 `QuizImage` 的 `probe.onload` 模式一致

##### P3-6-B-3 完整結果頁與每題詳解（已完成）

> 第一刀：在現有結果頁加「每題詳解列表」（每題卡片：第幾題 / Section / Part / 題目 / 狀態 / 你的答案 / 正確答案 / 說明）。**不**新增獨立錯題頁、**不**新增 `/quiz/wrong` 路由、**不**升 schemaVersion、**不**存 score / wrongQuestionIds 到 localStorage（屬 P3-6-B-4 範圍）。

- ✅ 結果頁顯示每題作答 vs 正確答案——`QuestionDetailCard` 元件（每題一張卡片，emerald 答對 / rose 答錯 / amber 未作答三色配色）
- ✅ 顯示簡單講解（小一友善語氣，鼓勵 > 懲罰）——優先顯示 `BaseQuestion.explanation`；無 explanation 時依狀態給鼓勵性 fallback（「答得很好！」/「再想一下，下次一定可以的～」/「下次可以再試一次～」）
- ✅ 顯示正確答案——`formatCorrectAnswer()` helper：option-based 與 fill-blank 直接顯示 `question.answer`；matching 顯示「本題目前為閱讀型練習，完成即算正確」
- ✅ 顯示使用者答案——`formatUserAnswer()` helper：option-based 與 fill-blank 直接顯示 `answer` 字串；matching `_done` token 顯示「已完成閱讀配對練習」；未作答顯示「尚未作答」
- ✅ 未作答題目清楚標示——amber 系視覺 + 「未作答」chip + 「尚未作答」用字，列入未作答計數，**不算對**
- ✅ 從 `session.answers` 即時計算每題對錯——**不**升 schemaVersion，**不**動 localStorage schema
- ✅ 重新整理結果頁仍保持 submitted 狀態（既有 P3-6-B-1 hydration 機制即可——`submitted: true` + `submittedAt` 由 localStorage 自動恢復）
- ✅ 重複利用既有 `getSectionTag()` + `getStarterPartInfo()` + `isCorrect()` + `isAnswered()` + `MATCHING_DONE_TOKEN` helpers，沒新增 `lib/types.ts` 欄位

##### P3-6-B-4 錯題詳解與錯題複習（🟡 進行中）

> 第一刀（filter）：在 P3-6-B-3 結果頁詳解列表上加 inline filter（全部 / 只看錯題 / 只看未作答 / 需要再練習），純 React local state、不存 localStorage。
> 第二刀（retry mode）：結果頁加「再練習這些題目」按鈕進入 inline retry mode；retry quiz / retry result 全部用 React in-memory state，**不**新增 `/quiz/wrong` 路由 / **不**升 schemaVersion / **不**新增 `wrongQuestionIds` localStorage 欄位 / **不**覆蓋原始測驗分數（屬後續刀數）。

- ✅ 結果頁支援全部 / 錯題 / 未作答 / 需要再練習篩選——`DetailFilter` type 4 個值（all / incorrect / unanswered / review）+ ResultView 內 React local state；review = incorrect ∪ unanswered（matching 完成後算 correct，不出現在 review）
- ✅ 篩選按鈕顯示數量——`FILTER_LABELS` + `FILTER_ORDER` + 4 個 chip buttons（aria-pressed 切換 amber / white 配色），每個 chip 右側 inline 數字 badge 顯示對應 count（all = total / incorrect / unanswered / review = incorrect + unanswered）
- ✅ 空狀態提示——`EMPTY_STATE_MESSAGES` 三段友善文字（incorrect → 「太棒了，目前沒有答錯的題目！」/ unanswered → 「很好，這次每一題都有作答！」/ review → 「全部都很棒，這次沒有需要再練習的題目！」）；emerald 系空狀態卡片
- ✅ 結果頁新增「再練習這些題目」入口——rose 系按鈕，僅 reviewCount > 0 時顯示，按鈕文案含 reviewCount 數字（例如「🔁 再練習這些題目（5）」），位於詳解列表與重新測驗之間；按下傳 incorrect + unanswered 的題目 id 給 `handleStartRetry`
- ✅ 支援 inline retry mode——`QuizPlay` 加 4 個 React state（`retryQuestionIds: string[] | null` / `retryAnswers` / `retryIndex` / `retrySubmitted`）+ 5 個 handler（startRetry / exitRetry / selectRetryAnswer / retryNext / retrySubmitNow），retry quiz 內聯 JSX（amber 系 banner「🔁 再練習模式」+ 進度「再練習 第 X / Y 題」+ 直接交卷 / 返回完整結果按鈕）；retry mode 完成後顯示 `RetryResultView`（amber 系 banner 含 `<strong>不會覆蓋</strong>` 強調 + 統計 + 鼓勵語 + retry 每題詳解 + 回到完整測驗結果按鈕 + 重新測驗按鈕 + 回首頁）；retry result detail 卡片用 **原始試卷 index**（讓家長辨識「第 N 題」對齊整份試卷編號），retry quiz progress 用 **retry-relative index**（「再練習 第 X / Y 題」）
- ✅ retry mode 不新增路由、不升 schemaVersion——純 in-memory state、不存 localStorage、不污染既有 session schema；reload 後因 localStorage 仍是 submitted=true 的原始 session，使用者會回到完整結果頁（retry state 自然丟失）；handleRestart 同步重置 retry state（透過 `resetRetryState` helper）
- ⬜ 錯題複習頁可獨立進入（不透過完整考卷；屬下一刀，需新路由 `/quiz/wrong` 或類似）
- ⬜ 錯題狀態於 localStorage 保存（`wrongQuestionIds` 對齊 `ExamSessionState`，需升 `QUIZ_SESSION_SCHEMA_VERSION` 到 v2 + 寫對應 migration；屬下一刀）
- ⬜ 錯題歷史紀錄（屬下一刀，跨 session 累積錯題）

##### P3-6-B-5 計時器（⬜ 未開始）

- ✅ **第一版不計時**（已於 P3-6-A 落實——`/quiz` UI 無計時器）
- ⬜ 未來若加入模擬考計時器：設為可選功能、預設關閉

### P3-7 官方資源索引與人工整理流程（🟡 進行中）

> 建立 Cambridge Pre A1 Starters **官方公開資源的連結索引與人工筆記**，作為自製題的「題型結構參考」。本階段純文件，**不下載任何官方檔案、不爬蟲、不把官方 sample 題目轉入正式題庫**。
>
> 子分區：P3-7-A（索引文件第一版，已完成）+ P3-7-B（format 對 P3-9 模板逐項校正，🟡 第一輪完成）+ P3-7-C（wordlist 對自家 vocabulary 分類校正）+ P3-7-D（sample / mock toolkit 題型觀察筆記）。

#### P3-7-A 官方資源索引文件第一版（已完成）

- ✅ 新增 `docs/OFFICIAL_RESOURCES.md`（v1，2026-05-08），用繁體中文撰寫；明示「只保存連結與人工筆記、不下載官方 PDF / 圖片 / 音檔、不複製官方題目 / 歷屆題、不做自動爬蟲、不把官方 sample 題目轉入正式題庫、不使用網路圖片當正式素材」。
- ✅ **用途與硬邊界**：對齊 PRODUCT_SPEC「目前明確不做」、source_materials/README「官方資源與歷史題整理原則」、AI_QUESTION_GENERATION「來源規則硬邊界」三處硬邊界，列出 7 條 ✅ 可以做（保存連結 / 人工筆記 / wordlist 整理方向 / sample paper 觀察筆記 / mock test toolkit 流程觀察 / 官方題型結構轉自製題規則 / 自製圖片與音檔）+ 9 條 ❌ 不可做（爬蟲 / 自動下載 PDF / 圖片 / 音檔 / commit 官方檔案 / 複製 sample 題目 / 複製歷屆題 / 網路圖片當正式素材 / data JSON 放官方 URL / 聲稱 AI 題是官方題）。
- ✅ **索引格式**：每筆條目 8 欄位（資源名稱 / 官方用途 / 本專案用途 / 可參考內容 / 不可直接使用內容 / 對應 Roadmap / 對應文件 / 連結）；連結欄位由人工從主入口導航後驗證填入，**v1 不預先填入 sub-page URL** 避免 AI 生成過時資訊。
- ✅ **A 段 官方考試格式與 parts**：4 個條目（A-1 Cambridge English 主站 / A-2 Pre A1 Starters 考試資訊頁 / A-3 Test format 頁 / A-4 Handbook for teachers）。
- ✅ **B 段 官方 preparation / sample resources**：4 個條目（B-1 Preparation 頁 / B-2 Sample papers 入口 / B-3 Wordlist 入口 → 連到 C 段 / B-4 Mock test toolkit 入口 → 連到 D 段）。
- ✅ **C 段 Wordlist / vocabulary 方向**：C-1 wordlist 條目 + C-2 5 條使用原則（可作 vocabulary 範圍參考 / 不複製整份 PDF / 自家 `data/vocabulary.json` 為主 / 分類概念對齊既有 11 個 VocabularyCategory / 未來人工整理需確認來源）+ C-3 與 P3-7-C 對接。
- ✅ **D 段 Sample papers / mock test toolkit 方向**：D-1 sample papers 5+5 對照表（可參考題型順序 / 互動方式 / 題目數量 / 音檔節奏 / 場景設計；不複製題目 / 圖片 / 音檔 / 答題單 / 場景圖原檔）+ D-2 mock test toolkit 4+4 對照表 + D-3 與 P3-7-D 對接。
- ✅ **用官方資源校正 P3-9 模板**：11 條檢查清單（L1 互動描述 / L2 answer type / L3 聽音選圖 / L4 顏色塗色指令 / RW1 圖句判斷 / RW2 大圖 yes/no / RW3 看圖拼字 / RW4 短文填空 / RW5 故事圖 one-word / `getStarterPartInfo()` preview 對應調整 / `STARTERS_PART_TEMPLATES.md` 是否升 v2）+ 校正動作的非目的（不抄官方原文 / 不要求 100% 還原 / 不轉 sample 為 data JSON）。
- ✅ **AI 仿真題素材來源策略**：6 條 ✅ 應使用（官方題型結構 / 本專案 vocabulary / 自製 imagePrompt / 自製 ttsScript / 自製 explanation / 人工審核）+ 6 條 ❌ 不應使用（官方題目全文 / 官方圖片 / 官方音檔 / 歷屆題原文 / 網路圖片 / 外部 URL）+ 違反時的處理 SOP。
- ✅ **與其他文件的關係**：對齊 PRODUCT_SPEC / source_materials/README / STARTERS_PART_TEMPLATES / AI_QUESTION_GENERATION / DATA_SCHEMA / PROJECT_ROADMAP 六處關係表。
- ✅ **版本標記** v1 + v2 後續規劃（等 P3-7-B / P3-7-C / P3-7-D 動工後回填 sub-page URL 與人工筆記檔指向）。

#### P3-7-B 官方 format 對 P3-9 模板逐項校正（🟡 進行中）

> 依 `docs/OFFICIAL_RESOURCES.md` 的「用官方資源校正 P3-9 模板」11 條清單，人工瀏覽官方 format / Handbook / sample 後逐項校正 `docs/STARTERS_PART_TEMPLATES.md`。
>
> 第一輪（已完成）：依官方公開 format 公開說明（Listening 4 parts / 20 Q / 20 min / heard twice，R&W 5 parts / 25 Q / 20 min / spelling must be correct，Speaking 4 parts / 3-5 min）校正 9 個 Part 模板描述；`docs/STARTERS_PART_TEMPLATES.md` 升 v2；補三層分級對應表 + 8 項 v2 後續實作優先順序建議。
> 第二 / 三輪（未開始）：handbook / sample papers / mock test toolkit 人工逐頁觀察筆記後可能升 v3。

- ✅ 已依官方 format 公開說明校正 P3-9 模板 v2（`docs/STARTERS_PART_TEMPLATES.md` 升 v2）
- ✅ 已補 Listening / Reading & Writing format 摘要（4 parts / 20 Q / 20 min vs 5 parts / 25 Q / 20 min）+ Speaking 預留說明
- ✅ 已補 spelling must be correct / each recording heard twice / 1~2 examples per part 三條官方規則
- ✅ 已校正 L1~L4 / RW1~RW5 模板描述（補官方規則 + 練習版邊界 + schema 差距）
- ✅ 已補目前 P3 schema 對應表分級（三層：已較接近 / preview / 尚未支援）
- ✅ 已補 v2 後續實作優先順序建議（8 項排序，L3 + TTS 音檔最先 / L1 hotspot 最後）
- ⬜ 後續 handbook / sample paper 人工逐頁觀察筆記（屬 P3-7-D 範圍延伸）
- ⬜ 後續 P3-9 v3 校正（依人工筆記結果）
- ⬜ 後續 wordlist / vocabulary coverage 校正（屬 P3-7-C 範圍）

#### P3-7-C 官方 wordlist 對自家 vocabulary 分類校正（⬜ 未開始）

> 依 `docs/OFFICIAL_RESOURCES.md` C 段，人工瀏覽官方 wordlist 後輸出**覆蓋差距分析**（不抄整份字表）。

- ⬜ 撰寫 `source_materials/notes/wordlist-coverage.md`（規劃中）：自家 vocabulary 對齊官方 wordlist 的主題覆蓋度與字數差距分析
- ⬜ 確認 `lib/types.ts` 的 `VocabularyCategory` 11 個分類是否需要新增 / 改名
- ⬜ 依差距分析給 P2-4C-2B-2 補字優先序建議
- ⬜ 不整份複製官方表格

#### P3-7-D Sample / mock test toolkit 題型觀察筆記（⬜ 未開始）

> 依 `docs/OFFICIAL_RESOURCES.md` D 段，人工瀏覽官方 sample papers + mock test toolkit 後輸出**結構觀察筆記**（不複製題目 / 圖片 / 音檔）。

- ⬜ 撰寫 `source_materials/notes/sample-paper-observations.md`（規劃中）：每 Part 一段題型互動 / 題數 / 音檔節奏觀察筆記
- ⬜ 撰寫 `source_materials/notes/mock-test-flow.md`（規劃中）：模擬考流程節奏的人工筆記，給 P5 完整仿真考試體驗 / P4 Speaking Agent 考官台詞模板參考
- ⬜ 兩份筆記檔皆只放人工觀察、不放官方檔案；連結指向官方公開頁面而非下載連結
- ⬜ 觀察結果回饋 P3-9-A 模板（若有形式偏差）

### P3-8 AI 仿真題生成流程（⬜ 未開始）

> 把 P3-3 的 prompt 範本與 P3-7 整理出的題型結構對齊，建立**完整的人工 + AI 仿真題生成工作流**。本子階段強調流程設計與文件，**不做** API 串接（API 串接屬 P3-3-B）。

- ⬜ 流程文件：根據 P3-7 整理的官方題型格式 + 本專案 `data/vocabulary.json` 自家單字，生成自製練習題
- ⬜ 強制標 `source: "ai_generated"`；**絕不聲稱是官方題**
- ⬜ **絕不複製 / 改寫 / 變形歷屆題或官方 sample 原文**
- ⬜ AI Editor 角色：把 AI 草稿對齊既有 prompt-template、檢查 6 題型欄位完整、補 `imagePrompt` / `ttsScript` / `promptVersion`
- ⬜ 人工審核：Cambridge Starters 風格 / 小一友善語氣 / 答案正確性 / 圖片與音檔可實作性
- ⬜ 流程：**先進 `source_materials/ai_generated/`，經審核後**轉正式 `data/*.json`
- ⬜ 與 P3-2-B（自動轉換工具）配合：審核後的草稿可由轉換工具批次轉 JSON

### P3-9 正式題型模板化（🟡 進行中）

> 把目前 generic 6 題型對齊到 Cambridge Pre A1 Starters **正式 Parts 結構**，建立可重用的「題型模板」，作為 P3-8 AI 出題流程的**輸入參考**。**Speaking 先不在 P3 實作**，留給 P4 Speaking Examiner Agent 統一處理。
>
> 子分區：P3-9-A（文件第一版，已完成）+ P3-9-B（schema / metadata 實作，🟡 第一刀完成）+ P3-9-C（part-specific quiz UI 實作，未開始）。

#### P3-9-A 正式題型模板文件第一版（已完成）

- ✅ 新增 `docs/STARTERS_PART_TEMPLATES.md` 第一版（v1，2026-05-08），用繁體中文撰寫；明示是「自製練習模板」，不是官方題庫、不複製官方題目；硬邊界與 PRODUCT_SPEC「目前明確不做」對齊。
- ✅ 大架構：明示三段（Listening Part 1~4 / Reading & Writing Part 1~5 / **Speaking 不在 P3，留 P4**）。
- ✅ 整理 **Listening Part 1~4** 模板，每個 Part 含 12 欄位：
  - 官方方向簡述 / 本專案練習版目標 / 題目互動方式 / 需要的資料欄位 / `imagePrompt` 建議 / `ttsScript` 建議 / `answer` 型態 / 目前 P3 schema 是否已支援 / 未來需要補哪些功能 / 是否需要圖片 / 是否需要音檔 / 是否適合 AI 仿真題生成
  - L1：大圖 + 人物 / 物件位置連線；本專案第一版簡化為「看圖 + 聽句子 + 選人物 / 選位置」
  - L2：聽對話寫 name / number；本專案第一版做「聽句子 + 文字輸入」
  - L3：聽音選 A/B/C 圖；目前 `listening-choice` 最接近，schema 已支援
  - L4：聽指令塗顏色；本專案第一版做「聽句子 + 選顏色 / 選物件」，真正塗色 UI 屬 P3-9-C
- ✅ 整理 **Reading & Writing Part 1~5** 模板，每個 Part 含 10 欄位（無 `ttsScript` / 無音檔欄位）：
  - RW1：看圖 + 句子 yes/no；對應 `true-false` / `picture-choice` 未來版本
  - RW2：看大圖回答 yes/no；需要 scene image + 多題共用結構（schema 待補）
  - RW3：看圖拼字；對應「只顯示圖片不顯示英文，孩子自己拼字」未來單字拼字測驗模式（P2-4C-2B-2 / P3-9-C）
  - RW4：短文 / 句子填空；目前 `fill-blank` 單空格已支援，多空格短文待補
  - RW5：看故事圖一字答案；需要 3 張圖 / scene image + one-word answer（schema 待補）
- ✅ **目前 P3 schema 對應表**：6 題型 → 正式 part 對應狀態，明示「練習版近似對應、不是完整正式題型、未來逐步新增更精準 part-specific types 或 metadata」。對齊 `components/QuizPlay.tsx` 的 `getStarterPartInfo()`。
- ✅ **未來題型資料欄位建議**：列 `starterSection` / `starterPart` / `skillFocus` / `ttsScript` / `imagePrompt` / `expectedAnswerType` / `difficulty` 升級 + 其他建議欄位（imageHotspots / sharedSceneImage / images[] / colorPalette / instructions[] / wordBank / multiBlankAnswers）；明示**本輪只寫建議，不修改 `lib/types.ts` / `data/*.json` / 任何 components**。
- ✅ **AI 仿真題 prompt 如何使用模板**：寫出 8 步流程（選 section + part → 套用 part template → 限制 vocabulary → 生成 imagePrompt / ttsScript → 生成 answer / explanation → 人工審核 → 進 source_materials → 轉正式 data JSON），對齊 P3-3 / P3-8 既有規劃；建議未來 prompt-template v2 加 `starterSection` / `starterPart` 必填參數。
- ✅ **與 P4 Speaking Examiner Agent 的關係**：明示 P3 不實作 Speaking、SP1~SP4 模板未來歸屬 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md`（規劃中），AI 回饋不是 Cambridge 官方成績、處處標示「AI 練習回饋，非官方考試分數」。
- ✅ 與其他文件關係表：列出與 `docs/DATA_SCHEMA.md` / `docs/AI_QUESTION_GENERATION.md` / `source_materials/README.md` / `PROJECT_ROADMAP.md` / `docs/PRODUCT_SPEC.md` 的分工。
- ✅ 文件版本標記：v1（2026-05-08）。

#### P3-9-B part-specific schema / metadata 實作（🟡 進行中）

> 把 P3-9-A 模板中的「未來題型資料欄位建議」實際寫進 `lib/types.ts` 與 `data/*.json`。需配合 DATA_SCHEMA 同步更新。
>
> 第一刀（已完成）：4 個 metadata 字面量類型 + BaseQuestion 4 個 optional 欄位 + 7 題範例補 metadata + Quiz Part 顯示優先讀 metadata + DATA_SCHEMA 補新一節。
> 後續刀數（未開始）：ttsScript / imagePrompt 升正式 schema 評估 + difficulty 字面量升級 + part-specific question types + metadata validator + 多題共用 scene image + 多空格 fill-blank + 多圖序列等。

- ✅ 新增 `StarterSection` / `StarterPart` / `SkillFocus` / `ExpectedAnswerType` 字串字面量類型（`lib/types.ts`）
- ✅ `BaseQuestion` 補 4 個 optional metadata 欄位（`starterSection` / `starterPart` / `skillFocus` / `expectedAnswerType`）；既有資料相容（缺值時 UI fallback）
- ✅ 7 題範例（`data/p3-example-questions.json`）補 starter metadata；不改 prompt / answer / options / explanation
- ✅ `getStarterPartInfo()` / `getSectionTag()` 優先讀 metadata，缺值才 fallback 到依 `question.type` 推導；新增 `STARTER_PART_DISPLAY` map（13 個 part 含 SP1~SP4 預留）
- ✅ `getStarterPartInfo()` 升級為支援 `(starterPart, question.type)` 細分文案（P3-9-C 小修）：RW4 + multiple-choice 顯示「Part 4 preview：短句選字 / 詞彙選擇」（解決 P3-9-B 第一刀的 mc → RW4「短文 / 句子填空」文案落差）；其他 (part, type) 組合維持 default map 文案；fallback 路徑保留
- ✅ `docs/DATA_SCHEMA.md` 補「Starters part metadata（P3-9-B）」一節（用途 / 邊界 / 欄位說明 / 範例 jsonc / 7 題對應表 / 不在 P3-9-B 第一刀範圍）+「UI 文案細分（依 `question.type` 微調）」對照表
- ⬜ `ttsScript` / `imagePrompt` 是否升為正式 schema 欄位（vs 只在草稿層）的決策
- ⬜ `difficulty` 升級為 `"starter-easy"` / `"starter-medium"` 字面量評估
- ⬜ part-specific question types（例如 `true-false` / `spelling-input`；對應 RW1 / RW3）
- ⬜ metadata validator helper（runtime 檢查 metadata 與 type 是否一致；例如 listening-choice 應對應 starterSection: "listening"）
- ⬜ 多題共用 scene image 結構（`sceneGroup` / `sharedSceneImage`，給 RW2 用）
- ⬜ 多空格 fill-blank 結構（`multiBlankAnswers: string[]`，給 RW4 多空格用）
- ⬜ `images: string[]` 多圖序列（給 RW5 用）
- ⬜ 拼字輸入結構（`spelling-input` 子題型 / `inputMode` metadata，給 RW3 用）
- ⬜ yes-no 答題型態（`true-false` 子題型 / `answerStyle: "yes-no"` metadata，給 RW1 / RW2 用）
- ⬜ Listening hotspot / colorPalette / instructions（給 L1 / L4 進階版用）

#### P3-9-C part-specific quiz UI 實作（🟡 進行中）

> 把 P3-9-A 模板中各 Part 的 UI 細節寫進 `components/QuizPlay.tsx` 或拆分新 components；依 P3-9-B 的 schema 渲染。
>
> 第一刀 L3 audio 準備版（已完成）：listening-choice 補 `audioSrc?` optional 欄位 + `<audio controls>` UI + 載入失敗 fallback 文字 + 聽兩次小提示。

- ✅ L3 listening-choice 支援 optional `audioSrc`（`lib/types.ts` ListeningChoiceQuestion 補 optional 欄位 + 音檔三欄位關係註解）
- ✅ L3 UI 支援 `<audio controls src={audioSrc}>` audio player（`components/QuizPlay.tsx` ListeningChoiceView 重構）
- ✅ 無音檔 / 載入失敗時 fallback 顯示 transcript / ttsScript 文字練習（audioStatus state + onCanPlay / onError 切換 + 友善「音檔準備中」訊息）
- ✅ 「聽兩次」UI 提示（💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習）
- ✅ `data/p3-example-questions.json` `q-lc-001` 補 `audioSrc: /audio/starters/l3/q-lc-001.mp3`（實體 mp3 未產生，UI 自動降級為文字練習）
- ✅ `docs/DATA_SCHEMA.md` listening-choice 補 audioSrc 欄位說明 + transcript / ttsScript / audioSrc 三者關係表 + 硬邊界
- ✅ `docs/STARTERS_PART_TEMPLATES.md` L3 模板補 audioSrc 支援說明（升 v2.1）
- ✅ 建立自製 TTS 音檔流程文件 `docs/TTS_AUDIO_WORKFLOW.md`（macOS `say` + `afconvert` 完整步驟；硬邊界：不串雲端 API / 不下載官方音檔 / 不用網路 mp3；命名規則 / 路徑 / 人工檢查 6 項 / git 政策 / 雲端 TTS 評估規劃）
- ✅ 建立 `public/audio/starters/l3/` 路徑
- ✅ q-lc-001 第一個自製音檔產生：`public/audio/starters/l3/q-lc-001.m4a`（macOS `say` 產生 AIFF + `afconvert -f m4af -d aac` 轉 m4a；AAC 格式約 12 KB / 1.86 秒；瀏覽器原生支援）；`data/p3-example-questions.json` audioSrc 從 `.mp3` 改為 `.m4a` 對齊實體檔案
- ⬜ 多題 L3 音檔（目前只有 1 題範例）
- ⬜ 音檔品質檢查流程（自動化，目前用 `docs/TTS_AUDIO_WORKFLOW.md`「人工檢查」6 項手動確認）
- ⬜ 未來雲端 TTS 評估（OpenAI / Google / Azure，目前不串 API）
- ⬜ 音檔快取 / 管理策略（避免每次 reload 重新下載）
- ⬜ L1 場景圖 + 4 選項（含可選 hotspot 互動）
- ⬜ L2 文字輸入 name / number（鍵盤切換）
- ⬜ L3 A / B / C 圖選項視覺
- ⬜ L4 簡化版選顏色 / 選物件 UI；真正塗色互動屬後續延伸
- ⬜ RW1 大型 ✓ / ✗ 按鈕
- ⬜ RW2 場景圖固定 + 下方多題滾動
- ⬜ RW3 拼字輸入 + 看答案 / 再試一次 / 下一題
- ⬜ RW4 多空格短文 + 字詞 bank 拖拉
- ⬜ RW5 多圖序列 + one-word 輸入
- ⬜ `getStarterPartInfo()` 升級為從 `question.starterPart` 讀（取代依 `question.type` 推導）

## P4 Speaking Examiner Agent 模擬考官系統（⬜ 未開始）

> 設計一個「**Speaking Examiner Agent（口說考官代理）**」，扮演 Cambridge Starters 口說考官，帶小朋友走完 Speaking Part 1~4 模擬流程。**不是單次丟一句回答給 AI 批改**，而是 agent-based flow——有固定角色設定、流程狀態、考官台詞、題目順序、回合控制與評分規則。
>
> ⚠️ **重要免責**：
> - AI 口說分數**只是練習回饋**，不是 Cambridge 官方成績
> - **不聲稱能預測官方分數**
> - **不把 AI 評分當成正式證明**
> - UI 必須清楚標示「**AI 練習回饋，非官方考試分數**」
>
> ⚠️ **與既有「不做 AI 評分」邊界的關係**：本檔末尾「目前明確不做」清單的「不做 AI 評分」指**客觀題（multiple-choice / fill-blank / matching 等 answer 在資料中可比對的題）的自動評分**——這條維持。Speaking 屬開放式回答，Agent 提供的是「鼓勵性練習回饋」而非「考試評分」，定位明確不同；UI 與文案處處標示「練習回饋 / 不是官方成績」。

### P4-1 Speaking Part 1~4 流程設計

- ⬜ Part 1：請小孩指出 / 放置物件，或回答圖卡相關問題
- ⬜ Part 2：針對大圖問問題（What's this? Where is the …?）
- ⬜ Part 3：針對小圖卡問問題（一系列短問句）
- ⬜ Part 4：問個人問題（What's your name? How old are you? Do you like …?）
- ⬜ 每 part 流程圖：考官提問 → 小孩錄音 → STT 轉文字 → Agent 判斷 → 進入下一題或追問
- ⬜ 與正式 Cambridge Pre A1 Starters Speaking 結構對齊，但**所有題目自製、不引用官方題目原文**

### P4-2 Examiner Agent 狀態機設計

> Agent 不是無狀態的單次 AI prompt，而是**有狀態機**控制整個 Speaking session：

- ⬜ 狀態機欄位：
  - `currentPart`（1 / 2 / 3 / 4）
  - `currentQuestionIndex`
  - `examinerPrompt`（考官台詞，給 TTS 用）
  - `expectedAnswerType`（yes-no / single-word / short-phrase / personal-info）
  - `childResponse`（音檔 blob / 本機 path）
  - `transcript`（STT 轉出的文字）
  - `feedback`（Agent 給的鼓勵性回饋）
  - `score`（pronunciation / vocabulary / response relevance / confidence 等觀察點，**僅作練習回饋**）
  - `nextAction`（next-question / follow-up / end-part / end-session）
- ⬜ Agent 角色設定：友善 Cambridge Starters 口說考官；以鼓勵為主、不打斷
- ⬜ 流程驅動：依 `nextAction` 決定下一個 turn 是「下一題 / 追問 / 結束 part / 結束 session」
- ⬜ 考官台詞固定模板（Welcome / Now we're going to … / Thank you, well done!）

### P4-3 TTS 考官語音

- ⬜ Agent 的 `examinerPrompt` 透過 TTS 播放（Web Speech API / 雲端 TTS / macOS `say` 任選）
- ⬜ 考官語音風格：友善、清晰、語速適中（小一友善）
- ⬜ **不下載 / 不引用官方考官音檔**
- ⬜ 缺 TTS 時 fallback：螢幕顯示考官台詞文字（仍可進行）

### P4-4 小孩錄音與播放

- ⬜ 瀏覽器 MediaRecorder 取得麥克風錄音
- ⬜ 錄音可在本機回放（在交給 STT 之前小朋友可重錄）
- ⬜ 錄音檔以 blob / 本機路徑保存（**不上傳雲端、不送外部伺服器**）
- ⬜ UI 大按鈕（🎤 開始錄音 / ⏹ 停止 / ▶ 試聽 / 👍 提交）
- ⬜ 缺麥克風 / 拒絕授權時友善提示，可改用打字回答（fallback）

### P4-5 Speech-to-text 轉文字

- ⬜ 將錄音轉文字（Web Speech API SpeechRecognition / 雲端 STT / 本機 whisper.cpp 等任選）
- ⬜ 轉文字結果即為 `transcript`，交給 Agent 判斷
- ⬜ 支援英文（小朋友母語非英文，可能有口音；STT 容錯需務實）
- ⬜ STT 失敗時顯示「沒聽清楚，再說一次？」鼓勵性提示

### P4-6 Agent 追問 / 下一題控制

- ⬜ Agent 依 `transcript` + `expectedAnswerType` 判斷：
  - 答案合理 → 給鼓勵 → 下一題
  - 答案聽不清楚或太短 → 簡單追問（Could you say it again? / Tell me more!）
  - 答案不相關 → 友善 redirect（重複考官提問或換種說法）
- ⬜ 追問次數上限（避免小朋友卡住）：每題最多 2 次追問，否則直接進下一題
- ⬜ 不糾正小朋友細節文法錯誤——以「能溝通」為合格門檻

### P4-7 AI 口說評分器

> 評分定位是**練習回饋**，不是官方考試分數。

- ⬜ 評分維度（觀察點，不是正式評分）：
  - **Pronunciation**：發音清晰度（高 / 中 / 加油）
  - **Vocabulary**：是否使用合適單字
  - **Response relevance**：是否回答到問題
  - **Confidence**：說話流暢度與停頓
- ⬜ 整體鼓勵語：「你很棒！繼續加油」「這次很流暢喔」「下次可以試試說得長一點」
- ⬜ UI 標示：「**AI 練習回饋，非官方考試分數**」**必出現在每個評分畫面**
- ⬜ **不做 Cambridge 等級對應宣稱**（不寫「相當於 Pre A1 / A1 / A2」之類）
- ⬜ 評分結果僅作為**練習建議**

### P4-8 Speaking session 紀錄與家長檢視

- ⬜ 每個 Speaking session 保存於 localStorage（沿用 P3-6-B Session 模式）
- ⬜ 每回合紀錄：`part` / `examinerPrompt` / `ttsScript` / `childAudio`（path 或 blob ref）/ `transcript` / `feedback` / `score`（observations）
- ⬜ 家長檢視頁面：可回放整段 session、看 Agent 回饋、看小朋友 transcript
- ⬜ **不上後端、不上雲端、不做跨裝置同步**

### P4-9 弱點分析與複習建議

- ⬜ 從多次 session 紀錄中匯總常見弱點（哪些 part 容易卡住、哪些單字常聽不懂）
- ⬜ 提出**鼓勵性**複習建議：「最近 What's your name? 答得很好！要不要練練 Where is the …?」
- ⬜ 連結回 `/review` 對應分項練習（單字 / 句型 / 聽力）
- ⬜ **不做能力等級評定，不做進度焦慮提示**

## P5 完整仿真考試體驗（⬜ 未開始）

> 把 P3 的 Listening + Reading & Writing 與 P4 的 Speaking 串起來，給小朋友**接近真考流程**的整套體驗。仍是本機自用、不上雲、不上線。

- ⬜ 完整模擬考流程：Listening → Reading & Writing → Speaking 一條龍
- ⬜ TTS 考官流程貫穿（Listening 也由 TTS 主考；Speaking 由 P4 Examiner Agent 接管）
- ⬜ 成績紀錄：客觀題分數（answer 比對）+ Speaking Agent 回饋（明示為練習回饋，非官方成績）
- ⬜ 家長檢視：完整 session 回顧、各 part 表現、Speaking 錄音回放
- ⬜ 弱點分析：跨多次模擬考的趨勢觀察（鼓勵語氣，**不做能力評級**）
- ⬜ 錯題與口說弱點複習：把「答錯題」+「Speaking 不流暢的回合」匯整成下次練習清單
- ⬜ 仍維持「目前明確不做」：不上雲、不上線、不做帳號、不做雲端同步、不做付費
- ⬜ AI 評分一律標示「**練習回饋，非官方考試分數**」

> 歷史對照：原 P4「題型擴充」內容已併入 P3-4 / P3-5 / P3-1；原 P5「模擬考」內容已併入 P3-6（見變更紀錄 2026-05-07）。本輪起 P4 / P5 重新聚焦 Speaking Examiner Agent 與完整仿真考試體驗，舊條目不再保留歷史佔位章節。

---

## 目前明確不做（不在 Roadmap 範圍）

下列項目**不會出現在任何 P 階段的近期任務**。本專案是本機自用工具，不部署、不上線、不商業化（詳見 `docs/PRODUCT_SPEC.md` 的「產品定位」與「目前明確不做」）。

- 登入 / 註冊 / 會員系統 / 多使用者權限
- 付費 / 訂閱 / 金流 / 方案購買
- 公開部署（Vercel / Netlify / Cloudflare 等）
- App Store / Google Play 上架；行動 App 包裝
- 後端 API / 資料庫 / 雲端同步 / 學習進度上雲
- 後台管理介面
- 自動網路爬蟲抓題（素材一律使用者手動匯入）
- **客觀題的 AI 評分**（multiple-choice / fill-blank / matching 等 answer 在資料中可比對的題型，一律以 `answer` 比對為準，不交給 AI；AI 出題仍規劃中見 P3-3 / P3-8）
- 自動下載官方 PDF / 圖片 / 音檔（即使本機也不下載；連結與人工筆記則整理於 P3-7）

> 例外說明：**P4 Speaking Examiner Agent 提供的「口說練習回饋」不是 AI 評分**——定位是**鼓勵性練習建議**而非考試分數，UI 與文案處處標示「練習回饋 / 不是官方成績」，不對外宣稱能預測 Cambridge 官方分數。客觀題的 AI 評分仍維持不做。
- 多語系（除中英對照以外）
- 完整 SEO / 行銷頁

> 本節是給未來輪次 Claude / Codex / ChatGPT 的硬邊界：**不要把上列項目塞進新增的 P 階段或子階段**。如果某個項目真的需要打開（例如要分享給其他家長使用），請先在 `docs/PRODUCT_SPEC.md` 「目前明確不做」開關狀態，再回到本節。

---

## 變更紀錄

- 2026-05-07：初版建立。
- 2026-05-07：P1 收尾——`lint` / `typecheck` / `build` 全綠；補齊 AI workflow 語言規範與 Codex 驗收前置閱讀；新增 `docs/CODEX_VALIDATION_RUNBOOK.md`；整理 `AGENTS.md` / `CLAUDE.md` 為短指向。
- 2026-05-07：Codex 驗收後文件小修——將 runbook 第 6 節改為驗收導向 9 段格式；README 文件索引補上 runbook 與 `reports/`；P1 補記 `lib/data.ts` helper 已完成、P2 對應條目改寫為「`/review` 串接」精準描述，避免把 P2 功能誤標為完成。
- 2026-05-07：P1 收尾收斂為「✅ 已完成」、housekeeping 改為可選分區；P2 進入「🟡 進行中」，完成 P2-1 單字複習頁第一版（分類切換、單字卡、圖片與音檔 fallback）；`docs/PRODUCT_SPEC.md` 補入「國小低年級使用者設計原則」。
- 2026-05-07：P2 主流程重構為 A~Z 字母入口 → 字母總覽 → 單字詳情；新增 `lib/vocabularyNavigation.ts`、`/review/letter/[letter]`、`/review/word/[id]`；補 4 筆 sample 單字（ant / book / boy / cow）以驗證跨字母 next；P2 章節拆為 P2-1 ~ P2-4，本輪完成 P2-2、P2-3；`docs/PRODUCT_SPEC.md` 補入「單字複習主流程」一節，category tab 改定位為未來補充模式。
- 2026-05-07：補 P3「考前練習與題庫」規劃——重寫 P3 章節為 6 個子階段（P3-1 考題資料 schema 擴充、P3-2 本機資料匯入流程、P3-3 AI 仿真題生成規劃、P3-4 Listening 題型第一版、P3-5 Reading & Writing 題型第一版、P3-6 模擬考與錯題複習）；原 P4 / P5 內容已併入新版 P3，章節標題改為「已併入 P3-x」並保留作為歷史紀錄；`docs/PRODUCT_SPEC.md` 新增「複習內容擴充方向」與「測驗與考前練習方向」兩節，並把 AI 出題從「暫不做」清單移出（AI 評分仍維持暫不做）。本輪 P3 全部子項皆維持 ⬜，未開工；P2 仍維持 🟡 進行中。
- 2026-05-07：清理產品範圍——`docs/PRODUCT_SPEC.md` 重寫「產品目標」為「產品定位」，明示本專案為本機自用工具、不部署、不商業化、考完後可能不再長期維護；把「暫不做的功能」改名為「目前明確不做」並依「帳號 / 部署 / 雲端 / AI / 其他」分組擴充清單（含登入、付費、雲端同步、公開部署、App 上架、多使用者權限、後台管理、商業化營運等）。本檔 ROADMAP 末尾新增「目前明確不做（不在 Roadmap 範圍）」一節，給未來輪次硬邊界；P5 末條歷史條目「之後再考慮後端」改為「不上後端 / 雲端」對齊 P3-6。本輪零程式碼變動；P2 仍 🟡，P3 仍 ⬜ 規劃中。
- 2026-05-07：補完整考卷 Session 規劃——`docs/PRODUCT_SPEC.md`「測驗與考前練習方向」新增「完整考卷 Session」一節，含 4 個子小節（Session 概念、作答進度保存、考卷操作、交卷與結果頁），明確第一版不計時、保存以 localStorage 為主（含 8 個欄位）、操作含「繼續作答 / 離開這份考卷 / 重新測驗 / 直接交卷」、結果頁含分數 / 紅色錯題 / 正確答案 / 簡單講解 / 再練習錯題入口；`PROJECT_ROADMAP.md` 將 P3-6 標題從「模擬考與錯題複習」改為「**完整考卷 Session、交卷與錯題複習**」並重寫條目（依完整考卷生成 / 作答進度保存 / 考卷操作 / 交卷與結果頁 / 計時相關 5 組分區）；P5 章節對 P3-6 的指向敘述同步對齊新名字。本輪零程式碼變動，未引入登入 / 後端 / 資料庫 / 雲端同步；P3 全部子項仍 ⬜ 規劃中，P2 仍 🟡 進行中。
- 2026-05-07：完成 P2-4A——`data/vocabulary.json` 從 12 筆擴充至 54 筆（覆蓋 17 字母 / 11 分類，依字典序排列）；`components/VocabularyCard.tsx` 新增 `revealMode` prop（預設 false 保留 P2-1 行為），詳情頁啟用後初始隱藏 translation / exampleEn / exampleZh，由「🔍 看答案」/「🙈 再想一次」雙態切換；切換上一個 / 下一個時靠 `key={current.id}` remount 自動回到收起狀態；`app/review/word/[id]/page.tsx` 對 `<VocabularyCard>` 傳入 `revealMode`。P2-4 章節拆為 P2-4A（已完成）與 P2-4B（真實素材、補齊更多單字、category 補充模式，尚未開始），P2 整體仍 🟡 進行中。
- 2026-05-07：完成 P2-4B——`/review` 從 A~Z 字母網格改為**複習中心首頁**，含 6 個入口卡（單字複習、看圖練習、聽力練習、句型練習、位置 / 顏色 / 數量、考題練習）；新增 `components/ReviewHubCard.tsx` 支援 ready / coming-soon 兩態（後者卡片淡化、不可點、顯示「準備中」徽章）；A~Z 字母網格搬到 `/review/words`，`/review/letter/[letter]` 返回 link 從「回字母選擇」改為「回單字複習」（指向 `/review/words`）；單字複習與考題練習為 ready，其餘四個入口為 coming-soon。文件同步：`README.md` 新增「在平板上使用（同 Wi-Fi 區網）」章節說明 Mac dev server + 平板區網 IP + iPad Safari 加入主畫面 + Vercel 僅作未來可選方案，並修正「下一步」（翻牌互動已於 P2-4A 完成、複習中心首頁已於 P2-4B 完成，故移出待辦）；`docs/PRODUCT_SPEC.md` 在「產品定位」補「第一階段使用方式：Mac 本機 + 平板同 Wi-Fi」、把「主要功能（願景）」的複習區改寫為複習中心 6 入口、「單字複習主流程」進入點改為 `/review/words`。原 P2-4B「真實素材」內容遷移到新 P2-4C 並合併本輪「準備中」入口的未來實作。本輪未動 `/quiz`、未引入登入 / 後端 / 資料庫 / 雲端同步、未真的部署 Vercel。P2 仍 🟡 進行中（P2-4C 尚未開工），P3 仍 ⬜ 規劃中。
- 2026-05-07：P2-4B 小修——`/review` 複習中心**移除「考題練習」主入口卡**（原 6 卡 → 5 卡），改為頁面底部小型輔助提示「想做完整考卷？請到測驗區」連到 `/quiz`，視覺層級低於 5 張主卡；明確 `/review`（分項能力練習）與 `/quiz`（完整考卷、歷屆 / sample 題、AI 仿真題、交卷評分）的分工。`docs/PRODUCT_SPEC.md` 主要功能段改寫為「`/review` 5 入口 + 底部輔助提示」並修正「單字複習主流程」第 2 步空字母頁返回路徑為 `/review/words`（修 Codex 指出的文件同步問題）；`PROJECT_ROADMAP.md` P2-4B 條目從 6 主入口改為 5 主入口 + 1 底部提示，P2-2 條目補一句「後續已於 P2-4B 將 A~Z 字母入口搬到 `/review/words`」註記。本輪未動其他路由、未動 `/quiz`、未進入 P2-4C 或 P3。
- 2026-05-07：完成 P2-4C-1——新增 `/review/picture` 看圖練習頁第一版（題型：看圖選英文 4 選 1）。新增 `components/PicturePractice.tsx`（client 元件）含 `PicturePractice` parent（管 `index`）+ 私有 `PictureQuestion`（用 `key={index}` remount 隔離 `selectedSlot` / `imageStatus`，避開 React 19 `react-hooks/set-state-in-effect`）。Deterministic 選項生成：正確答案 + 後 3 個 vocabulary 循環取、正確答案位置 = `index % 4`，避免 hydration mismatch；圖片預載沿用 P2-1 修補後機制（client `new window.Image()` 預載成功才切真圖）；缺圖 fallback 顯示首字母 + 「圖片準備中」與 `VocabularyCard` 一致；答對 / 答錯即時回饋（鼓勵語氣，答錯顯示正確答案）；「下一題」按鈕在未答題時 disabled，全部題庫循環無 crash。`/review` 看圖練習卡從 coming-soon 改為 ready 連 `/review/picture`。文件同步：P2-4C 拆出 P2-4C-1（已完成）+ P2-4C-2（未開始，含真實素材、聽力、句型、位置 / 顏色 / 數量、看圖第二題型）；`README.md` 目前功能補 `/review/picture` 條目；`docs/PRODUCT_SPEC.md` 主要功能（願景）的看圖練習從「規劃中」改為「第一版已實作（4 選 1 看圖選英文）」。本輪未動 `/quiz`、未引入登入 / 後端 / 雲端、未新增 localStorage / 分數保存 / 真實素材 / 依賴 / 測試框架。P2 仍 🟡 進行中（P2-4C 仍進行中），P3 仍 ⬜ 規劃中。
- 2026-05-07：完成 P2-4C-2A——`/review/picture` 新增題型切換 tab + 第二題型「看字選圖」。`components/PicturePractice.tsx` 重構：parent 加 `mode` state（`"image-to-word"` / `"word-to-image"`），新增 `ModeSwitch` tab 元件、把舊 `PictureQuestion` 改名為 `ImageToWordQuestion` 並新增 `WordToImageQuestion`；抽出 file-private `PracticeImage`（看圖選字大圖與看字選圖選項小圖共用，size lg / sm 由 prop 控制）與 `NextButton`（兩題型共用）。`buildOptions` deterministic helper 沿用 P2-4C-1 同一個。看字選圖題目區用 `bg-sky-50` 區別於看圖選字的 `bg-amber-50` 圖片區，視覺提示題型方向不同；4 個圖片選項用 `grid-cols-2`，缺圖 fallback 顯示首字母（size sm），答對 emerald / 答錯 rose / 其他淡化 + opacity-60 視覺一致。模式切換時自動 reset `index = 0` 與 `selectedSlot = null`（依靠子元件 `key={index}` remount + parent setState 雙重保證）。文件同步：ROADMAP 把舊 P2-4C-2 內「看圖第二題型」條目升級為已完成的 P2-4C-2A 子分區（共 8 條 ✅），舊 7 條未開始項目移到新 P2-4C-2B；`README.md` 目前功能段更新 `/review/picture` 描述為「兩種題型」+ tab 切換 + 不做分數保存的硬邊界；`docs/PRODUCT_SPEC.md` 主要功能（願景）的看圖練習從「第一版已實作（4 選 1 看圖選英文）」更新為「兩個方向都已實作（看圖選英文 + 看英文選圖）」。本輪未動 `/quiz`、未動 `/review` 卡片（description 上輪已寫「看圖選英文、看英文選圖」覆蓋兩題型）、未引入登入 / 後端 / 雲端 / localStorage / 分數保存 / 真實素材 / 依賴 / 測試框架。P2 仍 🟡 進行中（P2-4C-2B 尚未開工），P3 仍 ⬜ 規劃中。
- 2026-05-07：完成 P2-4C-2B-1——`/review/picture` 第一批真實圖片素材接入。新增 10 個自製 SVG（`public/images/{apple,cat,dog,book,red,blue,one,two,mother,father}.svg`），統一 `viewBox="0 0 200 200"` + 淡黃背景；color 類（red / blue）刻意只用色塊不放單字文字以免洩漏看圖選字答案；其他 8 個用簡單形狀組合（蘋果 = 紅圓+綠葉+棕梗、book = 攤開的書 + 文字行模擬、one/two = 1 / 2 顆星星、mother/father = 簡單頭像）。`data/vocabulary.json` 中 10 筆對應 item 的 `image` 從 `.png` 改為 `.svg`，其餘 44 筆 placeholder path 維持以續測 fallback。`<PracticeImage>` / `<VocabularyCard>` 圖片預載 + fallback 邏輯**完全未動**——`<img>` 與 `new window.Image()` 對 SVG 原生支援，行為與 PNG 一致。文件同步：ROADMAP 把舊 P2-4C-2B 拆為 P2-4C-2B-1（已完成 5 條）+ P2-4C-2B-2（未開始 7 條，將「補真實圖片」條目改寫為「往剩下 44 個未補圖單字推進」）；`README.md` 目前功能段補一段「第一批 10 個自製 SVG 已接入；其餘單字仍 fallback」、「下一步」改為 P2-4C-2B-2 並把第一批圖片素材移出待辦；`docs/PRODUCT_SPEC.md`「測驗與考前練習方向」素材策略段補入「自製簡單 SVG 圖像素材作為第一階段策略」；`docs/DATA_SCHEMA.md` 補一句 `image` 可指向 svg / png 任一靜態資源。本輪未動 `/quiz`、未動所有 components / helpers、未引入登入 / 後端 / 雲端 / localStorage / 真實音檔 / 新單字 / 依賴 / 測試框架，未下載任何官方 / 歷屆 / 網路圖片。P2 仍 🟡 進行中（P2-4C-2B-2 尚未開工），P3 仍 ⬜ 規劃中。
- 2026-05-08：完成 P3-1——P3 階段從「⬜ 規劃中」進入「🟡 進行中」，但**僅 P3-1 完成、P3-2 ~ P3-6 全部仍 ⬜**。本輪只做資料 schema / 型別 / 範例資料 / 文件，**不做** UI / localStorage 實際讀寫 / AI 出題工具 / 匯入工具。`lib/types.ts` 新增 P3 完整型別與 P1~P2 既有型別並存：`QuestionSource`（4 種來源）、`QuestionType`(6 種題型)、`BaseQuestion` 共用欄位、6 個題型專屬型別（`ExamMultipleChoiceQuestion` / `PictureChoiceQuestion` / `WordChoiceQuestion` / `ListeningChoiceQuestion` / `FillBlankQuestion` / `MatchingQuestion`）、`ExamQuestion` discriminated union、`ImageOption` / `MatchingPair` 配套、`ExamPaper` / `ExamSection` / `SourceMix`、`ExamSessionState` / `ExamAnswerMap` localStorage 狀態（含 `schemaVersion = 1` 給未來 migration）。`docs/DATA_SCHEMA.md` 把舊「未來題型擴充方向」整段改寫為「P3 考前練習：題庫 / 考卷 / Session schema」，含 6 題型範例 jsonc + ExamPaper + Session 完整欄位表 + localStorage key 命名提案 + 「不在 P3-1 範圍」清單。新增 `data/p3-example-questions.json`（7 題涵蓋 6 題型）與 `data/exam-papers.example.json`（1 份範例考卷），不被 `lib/data.ts` import，純 schema 演示供 Codex 驗收與 P3-2 / P3-3 開工參考。**舊 schema 完全未動**：`MultipleChoiceQuestion` / `QuizQuestion` / `Quiz` / `data/quizzes.json` 一行未改，舊新並存。本輪未動 `/quiz`、未動所有 components / pages / `lib/data.ts`、未實作 localStorage / 交卷 / 錯題複習 / AI 出題 / 匯入工具，未引入新依賴 / 測試框架。P2 仍 🟡 進行中（P2-4C-2B-2 尚未開工），P3 為 🟡 進行中（僅 P3-1 ✅）。
- 2026-05-08：完成 P3-2-A 本機素材匯入流程（規劃 / 文件層）——P3-2 階段升 🟡 進行中，子階段拆 P3-2-A（已完成）+ P3-2-B（自動化工具，未開始）。新增 `source_materials/` 資料夾骨架：`samples/` / `past_papers/` / `ai_generated/` / `custom/` 四個子目錄各對應一個 `QuestionSource`，全部含 `.gitkeep`。新增 `source_materials/.gitignore` 排除原始 PDF / 圖片（jpg / jpeg / png / gif / webp / bmp / tiff）/ 音檔（mp3 / wav / m4a / ogg / aac / flac）/ 影片 / 壓縮檔等二進位，保留純文字（.md / .txt / .csv / .json / .gitkeep）；雖然本專案不公開 repo，但仍預留版權保險。撰寫 `source_materials/README.md` 主文件：用途定位（不是正式公開資料庫，只是本機整理區）、資料夾與 source 對應表、可放 / 禁止做（含「不爬蟲、不下載官方圖片、不放外部 URL」三條硬邊界）、git 政策、建議流程 5 步、命名規範、與 P3-1 schema 關係、不在 P3-2-A 範圍。新增 `source_materials/custom/example-question-draft.md`：欄位對照表 + 7 個自製範例覆蓋 6 題型（multiple-choice / picture-choice / word-choice / listening-choice / fill-blank 兩版 / matching）、明示「非官方真題」、命名建議含題型前綴對照表、解析語氣鼓勵 > 懲罰提醒。`docs/DATA_SCHEMA.md` 補「本機素材匯入流程（P3-2-A）」一節：三層資料分工表（整理區 / 正式題庫 / 靜態素材）、`source` ↔ 整理區子目錄對應表、工作流程概念圖、P3-2-A vs P3-2-B 範圍切分、嚴禁清單。`README.md`「下一步」第 2 條更新明示 P3-2-A 已完成、P3-2-B 與 P3-3 ~ P3-6 仍未開始。本輪**未寫任何自動化程式 / CLI**、未實作 `/quiz` UI、未做 localStorage 實際保存、未做交卷 / 錯題頁、未做 AI 出題工具、未爬網路、未下載任何官方圖片或音檔、未放 Cambridge 官方真題內容、未新增 SVG / 依賴 / 測試框架、未動 PRODUCT_SPEC / TASK_ROUTER / CODEX_VALIDATION_RUNBOOK / AI_DEV_WORKFLOW / AGENTS / CLAUDE 任一文件。順手修 `reports/claude_last_report.md` 中 P3-1 那輪「4 種 source 都有出現」的過時敘述，改為「schema 支援 4 種；範例使用 custom / ai_generated」。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 ✅、P3-2-A ✅、P3-2-B / P3-3 / P3-4 / P3-5 / P3-6 全 ⬜）。
- 2026-05-08：完成 P3-3-A AI 仿真題 Prompt 標準格式——P3-3 階段升 🟡 進行中，子階段拆 P3-3-A（已完成）+ P3-3-B（實際 AI 工具串接，未開始）。新增 `docs/AI_QUESTION_GENERATION.md` 規格文件 10 個 section：定位（不是官方真題、是依風格自製）、難度原則（小一友善、單句短、選項清楚、不刁鑽、不冷僻、不挫折）、來源規則硬邊界（必標 `ai_generated`、不假裝 official_sample / past_paper、不引用官方 / 歷屆題、不放外部 URL）、6 種題型範圍、草稿輸出格式（類 YAML）、轉換流程圖、品質檢查 6 項、與 P3-1 / P3-2-A 對齊、不在 P3-3 範圍、Prompt 版本化政策。新增 `source_materials/ai_generated/prompt-template.md`（v1）：可直接複製給 AI（ChatGPT / Claude）使用的 prompt 範本，含角色設定（Cambridge Starters 兒童英文出題助手）、年齡設定（國小一年級）、6 題型可選參數、類 YAML 草稿格式範例（含 word-choice / matching 巢狀結構）、8 項自我檢查、與 custom 草稿差異對照表、版本歷史。新增 `source_materials/ai_generated/example-ai-questions.md`：6 題自製 AI 草稿覆蓋 6 種題型（`q-ai-mc-001` / `q-ai-pc-001` / `q-ai-wc-001` / `q-ai-lc-001` / `q-ai-fb-001` / `q-ai-mt-001`），id 與既有 P3-1 範例（`data/p3-example-questions.json`）不撞名；附 `imagePrompt` / `ttsScript` / `promptVersion` 草稿欄位、自我檢查紀錄、整理者提醒。`docs/DATA_SCHEMA.md` 補「AI 仿真題草稿與正式題庫的關係（P3-3）」一節：草稿 → 審核 → 正式題庫流程圖、草稿欄位 vs 正式 schema 對應表（`imagePrompt` / `ttsScript` / `notes` 哪些保留 / 不保留）、`source` 強制 `ai_generated`、P3-3-A 範圍 vs P3-3-B 範圍 vs 永久不做（AI 評分）。`README.md`「下一步」第 2 條補一行 P3-3-A 已完成。本輪**未寫任何 AI 工具 / CLI**、未串 OpenAI / Anthropic API、未實作 `/quiz` UI、未做 localStorage / 交卷 / 錯題頁、未爬網路、未下載任何官方圖片 / 音檔、未放 Cambridge 官方真題內容、未新增 SVG / 依賴 / 測試框架、未動 PRODUCT_SPEC / TASK_ROUTER / CODEX_VALIDATION_RUNBOOK / AI_DEV_WORKFLOW / AGENTS / CLAUDE / `lib/types.ts` / 任何 `data/*.json`。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 ✅、P3-2-A ✅、P3-3-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6 全 ⬜）。

- 2026-05-08：P3-3-A 收尾——新增 prompt v1 第一批人工試跑草稿 `source_materials/ai_generated/2026-05-08-starters-v1-batch01.md`，8 題覆蓋 6 題型（mc × 2 / pc × 1 / wc × 1 / lc × 2 / fb × 1 / mt × 1），id 用 `q-ai-v1-*-001/002` 格式與既有 `data/p3-example-questions.json` / `example-ai-questions.md` 皆不撞名。題目全部標 `source: ai_generated` + `promptVersion: starters-v1`；題幹用 vocabulary 既有字（apple / cat / dog / book / red / blue / mother / father / chair / run / jump / sit）；color 類圖片以 `imagePrompt` 強調「無文字、無單字」對齊 PRODUCT_SPEC「素材策略」。檔末附**人工品質檢查紀錄表**（10 項全 ✓：source / promptVersion / answer 在 options / 無官方歷屆題內容 / 無外部 URL / 鼓勵語氣 / 題幹 ≤ 10 字 / 避冷僻字 / id 不撞名 / 題型分配對齊任務單），並逐題分析「需要日後調整」（綠 / 黃色塊 SVG 與 lc 音檔依賴 P2-4C-2B-2，補齊前不能進正式 JSON）。`README.md`「下一步」第 2 條補一行說明 prompt v1 試跑草稿已新增。本輪**未串 AI API、未寫任何程式 / CLI、未做自動轉換工具、未實作 `/quiz` UI**、未動 `lib/types.ts` / 任何 `data/*.json` / 所有 components / pages / `lib/`、未新增圖片 / 音檔 / SVG / 依賴 / 測試框架，未爬網路、未下載任何官方 / 歷屆 / 網路素材、未放 Cambridge 官方真題內容。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 ✅、P3-2-A ✅、P3-3-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6 全 ⬜）。
- 2026-05-08：完成 P3-6-A `/quiz` 最小可玩流程第一版——P3-6 階段升 🟡 進行中，子分區拆 P3-6-A（已完成）+ P3-6-B（持久化 / 操作 / 結果頁完整版，未開始）。`/quiz` 從骨架升級為可實際操作的測驗頁：server page (`app/quiz/page.tsx`) 載入 `data/exam-papers.example.json` 第一份考卷與 `data/p3-example-questions.json` 7 題，依 sections 順序平鋪 questionOrder → 傳給新增的 client 元件 `<QuizPlay>` (`components/QuizPlay.tsx`) 管 state（純 React local，無 localStorage）。6 題型最小渲染：multiple-choice / picture-choice / word-choice 用 amber 系按鈕；listening-choice 顯示 transcript / ttsScript 文字（不播音檔，自製屬 P2-4C-2B-2）；fill-blank 選項版用按鈕 + 自由填空版用 text input（比對忽略大小寫與前後空白）；matching 用閱讀型「我看完了」按鈕作答（計分視為「答完即正確」）。一題一頁：未答題「下一題」disabled、最後一題顯示「看結果」、完成畫面顯示「答對 N/M 題」+ 四級鼓勵文案（全對 / ≥70% / ≥40% / 其他）+ 🔁「重新開始」按鈕 + 回首頁 link。圖片缺檔 fallback：file-private `<QuizImage>`（與 `<PracticeImage>` 同模式但獨立，避免動 P2-4C 既有元件），`new window.Image()` 預載成功才切真圖。`lib/data.ts` 最小擴充：新增 `p3ExampleQuestions` / `p3ExamplePapers` export，舊 `vocabulary` / `quizzes` 一行不動。原 P3-6 5 分區的計時段「第一版不計時」翻 ✅（對齊本輪實作）；其餘 4 分區（完整考卷生成 / 作答進度保存 / 考卷操作 / 交卷與結果頁）保留為 P3-6-B 目標。`README.md` 目前功能補 `/quiz` 條目 + 「下一步」P3-6-A 已完成、P3-6-B 仍規劃中。本輪**零依賴新增**、未做 localStorage / 交卷頁 / 錯題詳解 / AI 評分、未串 API、未動 `lib/types.ts` / `data/*.json` / 任何 `/review` 路由 / 任何 components 既有檔（含 `PicturePractice`、`VocabularyCard`）、未爬網路、未下載任何官方 / 歷屆 / 網路素材、未放 Cambridge 官方真題內容、未新增圖片 / 音檔 / SVG。Codex 暫停期（5/12 恢復）期間由 Claude 自測通過：lint / typecheck / build 三項全綠 + dev smoke test 8 條路由 200 + `/quiz` SSR 結構驗證（標題 / 進度 / 第一題 listening 內容 / 4 選項 / disabled 按鈕 / 完成畫面字串初始 0）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 ✅、P3-2-A ✅、P3-3-A ✅、P3-6-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B 全 ⬜）。
- 2026-05-08：P3-6-A 小修——調整 `/quiz` 題型順序更接近正式 Cambridge Starters 考卷結構。`app/quiz/page.tsx` 新增 file-private `sortQuestionsForStarters()` helper，把 P3-1 範例 7 題依「Section 1 Listening（`listening-choice`）→ Section 2 Reading & Writing（`picture-choice` → `word-choice` → `multiple-choice` → `fill-blank` → `matching`）」重新排序；不修改 `data/p3-example-questions.json` 與 `data/exam-papers.example.json`。`components/QuizPlay.tsx` 新增 `SECTION_LABELS` 對照與 `getSectionTag()` helper；題目卡頂端加區段徽章（sky-100 / amber-100 兩色配色區別 listening 與 R&W 段）+「聽力練習」/「閱讀與書寫練習」中文小字 + 既有「第 X 題 / 共 N 題」進度行。`app/quiz/page.tsx` 頁首文案補「順序：Listening → Reading & Writing」。**Speaking 不做**（本專案明確排除）。其餘流程（選答案、下一題、完成畫面、答對 N/M、重新開始、fill-blank normalize、matching 閱讀型「我看完了」、listening 顯示 transcript 不播音檔）完全保留。本輪零依賴新增，未動 `lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / 任何 `/review/` 路由 / 其他 components。Codex 暫停期由 Claude 自測通過：lint / typecheck / build 三項全綠 + dev smoke test 8 條路由 200 + visible HTML 第 1 題為 listening（含「Listening」徽章 + 「聽力練習」中文 + transcript）+ RSC payload 內 7 題位置遞增順序符合 listening → picture → multiple → fill-blank 排序。P3-6-A 增加一條 ✅；P3-6-B 仍 ⬜，P3 整體仍 🟡 進行中。
- 2026-05-10：完成 L3 第一個自製 TTS 音檔（P2-4C-2B-2 + P3-9-C）——本機自製音檔流程落地，**只用本機 macOS `say` + `afconvert`，不串雲端 TTS API、不下載官方音檔**。建立 `public/audio/starters/l3/` 目錄；用 `say -o /tmp/q-lc-001.aiff "What does the boy want?"` 產生 AIFF（86 KB）+ `afconvert -f m4af -d aac` 轉成 m4a（**12 KB / 1.86 秒 / AAC 22050 Hz / 31696 bps**），檔案放到 `public/audio/starters/l3/q-lc-001.m4a`；`data/p3-example-questions.json` `q-lc-001` audioSrc 從 `.mp3` 改為 `.m4a` 對齊實體檔案；瀏覽器原生支援 m4a / AAC（Chrome / Safari / Firefox / Edge 全支援）。新增 `docs/TTS_AUDIO_WORKFLOW.md`（v1）：用途 / 硬邊界（**✅ 可做：macOS `say` + `afconvert` 本機流程、自錄音、未來雲端 TTS 評估**；**❌ 不可做：串雲端 TTS API、下載官方音檔、複製官方 sample 音檔、用網路 mp3、第三方教學機構錄音、官方 PDF 內嵌音檔**）+ 完整 step 1~6 流程（say AIFF → afconvert m4a → 清理 → 驗證 → 更新 audioSrc → 本機驗證）+ 一行 shell 範例 + 命名規則（`<question-id>.m4a`）+ 路徑（`public/audio/starters/<part>/<id>.m4a`）+ audioSrc 對應規則（4 條：本專案內音檔 ✅ / 外部 CDN ❌ / Data URL ❌ / 官方 sample paper ❌）+ **人工檢查 6 項**（檔案存在性 / 格式正確 / 可播放 / 內容正確 / 長度合理 / 音量合理）+ git 政策（自製 m4a 可 commit / AIFF 不可 / 官方 / 網路 / 個資錄音不可 / 避免錯誤 commit 3 法）+ 第二階段雲端 TTS 評估（OpenAI / Google / Azure / Web Speech API 4 方案比較，**目前不串**，未來若採用需先在 PRODUCT_SPEC「目前明確不做」開放）+ 與其他文件關係表 + 版本 v1。`README.md` `/quiz` 條目補「第一個自製音檔已產生於 `public/audio/starters/l3/q-lc-001.m4a`」+ 文件索引追加 `docs/TTS_AUDIO_WORKFLOW.md`。`PROJECT_ROADMAP.md`：(a) P3-9-C「真實自製 TTS 音檔產生」/「多題 L3 題庫」/「音檔快取管理」3 條 ⬜ 改為「3 ✅（流程文件 / 路徑 / q-lc-001 第一個音檔）+ 4 ⬜（多題音檔 / 音檔品質檢查流程 / 雲端 TTS 評估 / 音檔快取管理）」；(b) P2-4C-2B-2「真實音檔」⬜ 改 🟡（部分進行中）+ 寫明 P3-9-C 第一刀已落地第一個 L3 音檔 + P2 vocabulary 音檔仍 ⬜；P2-4C-2B-2 整體 header 從「尚未開始」改「🟡 部分進行中」；P3-9-C 整體仍 🟡。**未做** OpenAI / Google / Azure / 任何雲端 TTS API / 不下載官方音檔 / 不複製官方 sample 音檔 / 不新增 listening 題目 / 不改題目答案 / 不改非 listening 題目 / 不做 Speaking / 錄音 / STT / AI API / crawler / 後端 / DB / 登入 / 不新增依賴 / 不處理 npm audit / 不部署 / 不升 localStorage schemaVersion。**未動** `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / `components/QuizPlay.tsx` / 任何 `app/review/*` / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/DATA_SCHEMA.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有 SVG / vocabulary 音檔 / `package.json` / 依賴。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 audio 元素 + audioSrc 指向新 m4a 檔 + 「正式考試中錄音會播放兩次」聽兩次提示 + transcript 仍顯示 + 新增 audio 檔可由瀏覽器以 200 fetched + `afinfo` 確認 m4a / AAC 編碼正確 + 既有 `/review` 路由完整回歸 + dev log 無 error / hydration / warn。P2 升 🟡 進行中（P2-4C-2B-2 部分 🟡）；P3 仍 🟡 進行中（P3-9-C 從 7 條 ✅ 升為 10 條 ✅）。
- 2026-05-10：完成 P3-9-C 第一刀 L3 聽音選圖 + audio 準備版——`/quiz` listening 題型補 optional `audioSrc` 欄位 + `<audio controls>` UI + 載入失敗 fallback 文字 + 聽兩次小提示。`lib/types.ts` `ListeningChoiceQuestion` 補 `audioSrc?: string` optional 欄位（保留既有 `audio: string` 必填、`transcript?` / `ttsScript?` optional），補完整 docstring 說明三欄位關係（audio = legacy / audioSrc = 本專案自製音檔路徑 / transcript = 字幕 / ttsScript = TTS 腳本）+ audioSrc 硬邊界（嚴禁指向官方音檔或外部 URL，只能是 `public/audio/` 下的本機自製檔）。`data/p3-example-questions.json` 唯一一題 listening (`q-lc-001`) 補 `audioSrc: /audio/starters/l3/q-lc-001.mp3`；不改 `audio` legacy 欄位、不改 transcript / ttsScript / options / answer / metadata；實體 mp3 尚未產生，UI 自動 fallback 文字。`components/QuizPlay.tsx` `ListeningChoiceView` 重構：新增 `AudioStatus` type（`loading` / `ready` / `missing`）+ `useState` 初始依 `audioSrc` 是否存在；audioSrc 存在且未 error 時 render `<audio controls src={audioSrc} onCanPlay={...} onError={...}>` + 「💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習」小提示；audioSrc 缺值或 onError 觸發後 setState `missing` → 隱藏 audio 元素 + 顯示「音檔準備中，先用文字練習」amber-700 提示；transcript / ttsScript 文字始終顯示於下方（保留現有顯示能力）。setState 在 onCanPlay / onError 事件 handler 中觸發，不在 effect body，避開 React 19 `react-hooks/set-state-in-effect` 規則。`docs/DATA_SCHEMA.md` listening-choice 段補 `audioSrc?: string` 欄位說明 + transcript / ttsScript / audioSrc 三者關係 4 列表格 + UI 顯示策略 3 段（成功載入 / 缺值 / 載入失敗）+ audioSrc 硬邊界 4 條（不指向官方音檔、不下載官方 sample paper 音檔、只能是 public/audio/ 下本機自製檔、可填佔位 fallback 自動降級）。`docs/STARTERS_PART_TEMPLATES.md` L3 段標題改為「v2 校正 + P3-9-C 第一刀 audio 準備」+ 內容補 audioSrc 支援、UI fallback 機制、聽兩次提示對應「heard twice」官方規則；版本段加 v2.1（2026-05-10）紀錄；硬邊界不變。`PROJECT_ROADMAP.md` P3-9-C 從 ⬜ 升為 🟡 進行中（7 條 ✅：audioSrc 欄位 / audio controls UI / fallback / 聽兩次提示 / q-lc-001 metadata / DATA_SCHEMA 補段 / STARTERS_PART_TEMPLATES 升 v2.1；3 條 ⬜：真實 TTS 音檔產生 / 多題 L3 題庫 / 音檔快取管理；其他 part-specific UI 條目保留 ⬜）；P3-9 整體仍 🟡。`README.md` `/quiz` 條目補 audioSrc 支援 + fallback 說明。**未做** 真正 TTS 音檔產生 / 不串 TTS API / 不下載官方音檔 / 不新增多題 listening 題 / 不改題目答案 / 不改非 listening 題目 / 不做 Speaking / 不做錄音 / 不做 STT / 不做 AI API / 不新增 crawler / 不升 localStorage schemaVersion / 不做 `/quiz/wrong`。**未動** `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `app/*` 路由 / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有圖片 / 音檔 / `package.json` / 依賴。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅（6 / 9）/ P3-7-B 部分 ✅（6 / 9）/ P3-9-B 部分 ✅（6 / 13）/ P3-9-C 部分 ✅（7 / 17）/ P3-6-B-5 部分 ✅（1 / 2）；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：完成 P3-7-B 第一輪官方 format 校正——`docs/STARTERS_PART_TEMPLATES.md` 升 **v2**（依官方公開 format 說明校正）；本輪純文件，**零程式碼變動**。**STARTERS_PART_TEMPLATES.md v2 主要變更**：(a) 標題改為「P3-9-A 起，v2 校正版」+ 頂端 callout 標 v2 日期；(b) 新增「**官方 format 摘要**」段（Listening 4 parts / 20 Q / 20 min / heard twice + R&W 5 parts / 25 Q / 20 min / spelling must be correct + Speaking 4 parts / 3-5 min 不在 P3）+「本專案使用方式」邊界；(c) 校正 9 個 Part 模板（L1~L4 + RW1~RW5）描述，每個 Part 補官方規則（heard twice / spelling must be correct / 1~2 examples per part）+ 練習版邊界與 schema 差距；(d) 「目前 P3 schema 對應表」改為**三層分類**——第一層已較接近正式 Part 的題型（listening-choice → L3 preview/部分支援、fill-blank → RW4 partial）+ 第二層 preview / 預備型題型（picture-choice → RW1/RW2 preview、word-choice → RW3 preview 反向、multiple-choice → RW4 preview / 詞彙選擇預備、matching → RW5 preview / 故事理解預備）+ 第三層尚未支援的正式題型（L1 hotspot 互動、L2 多 row 表格、L4 真正塗色、RW1 yes-no 子題型、RW2 sceneGroup、RW3 spelling-input、RW4 multiBlankAnswers + wordBank、RW5 imageSequence + one-word、Speaking SP1~SP4）；明示「這些都還不是官方題庫，只是自製練習題型對正式 parts 的逐步對齊」。(e) 新增「**v2 後續實作優先順序建議**」段（8 項排序：L3 + TTS 音檔最先 / RW3 拼字輸入 / RW1 yes-no / RW4 多空格 / RW5 picture-story / L2 / L4 / L1 hotspot 最後）+ 排序理由 + 跨項目共通要求（不複製官方原文）。(f) 版本段保留 v1（2026-05-08）+ 新增 v2（2026-05-09）紀錄。**OFFICIAL_RESOURCES.md 同步更新**：在「用官方資源校正 P3-9 模板」段補「**P3-7-B 第一輪校正狀態（2026-05-09）**」子段——記錄 11 條校正清單第 1~11 全條第一輪通過、`STARTERS_PART_TEMPLATES.md` 已升 v2、後續第二 / 三輪校正待辦（handbook / sample paper / mock test toolkit 人工筆記、wordlist 覆蓋分析）；版本段加 v1.1（P3-7-B 第一輪校正進度更新）+ v2 規劃調整為「等第二 / 三輪校正後升」。**PROJECT_ROADMAP.md** P3-7-B 從 ⬜ 升為 🟡 進行中（6 條 ✅：v2 升級 / format 摘要 / 三條官方規則 / L1~L4 + RW1~RW5 模板校正 / schema 對應表分級 / v2 後續實作優先順序；3 條 ⬜：後續 handbook / sample paper 人工筆記、後續 v3 校正、後續 wordlist 校正）；P3-7 整體仍 🟡（A 已完成、B 第一輪完成、C 與 D 仍 ⬜）。**README.md** 補一句「`docs/STARTERS_PART_TEMPLATES.md` 已升 v2，依官方公開 format 說明校正」。本輪**未動** `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / 任何 `app/*` 路由 / 任何 components / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有圖片 / 音檔 / `package.json` / 依賴。**本輪未做** crawler / 不下載官方 PDF / 圖片 / 音檔 / 不複製官方題目 / 不複製 sample paper 題目 / 不新增題目 / 不修改 data 或 types / 不改 /quiz UI / 不做 TTS / 錄音 / STT / AI API / Speaking UI / localStorage / quiz 功能；無新增依賴 / 無處理 npm audit / 無部署 / 無新增後端 / DB / 登入。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅（6 / 9）/ P3-7-B 部分 ✅（6 / 9）/ P3-9-B 部分 ✅（6 / 13）/ P3-6-B-5 部分 ✅（1 / 2）；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8 / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：P3-9-C 小修——`/quiz` Part 顯示文案依 (metadata, question.type) 組合精準化。`components/QuizPlay.tsx` `getStarterPartInfo(question)` 在原有 metadata-first / type-fallback 邏輯之前加一條 (starterPart, type) 組合特殊覆寫：**`RW4 + multiple-choice` → 「Part 4 preview：短句選字 / 詞彙選擇」**，解決 P3-9-B 第一刀回報中風險點 1 的 mc → RW4「短文 / 句子填空」文案落差（q-mc-001「Which one is a fruit?」之前籠統顯示為「Part 4：短文 / 句子填空」，現顯示更精準的「短句選字 / 詞彙選擇 preview」）；其他 (part, type) 組合維持 default `STARTER_PART_DISPLAY` map 文案（`RW4 + fill-blank` → Part 4 短文 / 句子填空、`RW1 + picture-choice` → Part 1 看圖判斷 / 看圖選答案、`RW3 + word-choice` → Part 3 看圖認字 / 拼字練習、`RW5 + matching` → Part 5 圖文配對 / 故事理解預備、`L3 + listening-choice` → Part 3 聽音選圖 等）；fallback 路徑保留——metadata 缺值仍依 `question.type` 推導（保留「Part X preview」字樣於 fallback 路徑）。helper 註解補完整邏輯說明（metadata 決定對齊目標 / question.type 協助練習版細分 / 仍是練習版近似對應，不代表官方題目）。`docs/DATA_SCHEMA.md` 在 Starters part metadata 段新增「UI 文案細分（依 `question.type` 微調）」一節：含 6 列對照表（5 個明示組合 + default fallback）+ 3 條設計原則（STARTER_PART_DISPLAY default + getStarterPartInfo 特殊覆寫 + 增加新組合只需加 if）+ 3 條目的（解決文案落差 / 維持 metadata-first / 仍是練習版近似對應不代表官方題目）。`PROJECT_ROADMAP.md` P3-9-B 由 5 條 ✅ 升為 6 條 ✅（新增 `getStarterPartInfo()` 升級為 (starterPart, type) 細分文案）；DATA_SCHEMA 條目末尾補「+ UI 文案細分對照表」；P3-9 / P3-9-B / P3-9-C 整體仍 🟡。`README.md` `/quiz` 條目把 `q-mc-001` mapping 從「RW4 短文 / 句子填空」改為「RW4 preview 短句選字 / 詞彙選擇」，並補一句「Part 顯示已改為 metadata-first，並可依題型微調練習版文案」。**未動** `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / 其他 components / 任何 `app/*` 路由 / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有圖片 / 音檔 / `package.json` / 依賴；**未升** localStorage `QUIZ_SESSION_SCHEMA_VERSION`；**未做**完整 P3-9-C UI / validator / ttsScript-imagePrompt schema / `/quiz/wrong` / 獨立錯題頁 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-9-B 升為 6 條 ✅ + 7 條 ⬜，P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A 維持 ✅；P3-6-B-4 仍 6✅+3⬜；P3-6-B-5 仍 1✅+1⬜；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：完成 P3-9-B 第一刀——把 Starters part metadata 落地進 schema、範例資料與 `/quiz` UI；不一次加入所有未來欄位、不改 UI 大版面、不新增題目。`lib/types.ts` 新增 4 個字串字面量類型：`StarterSection`（listening / reading-writing / **speaking 預留**）、`StarterPart`（L1~L4 / RW1~RW5 / **SP1~SP4 預留**共 13 個值）、`SkillFocus`（listening / vocabulary / spelling / reading / writing / speaking）、`ExpectedAnswerType`（choice / text / number / name / color / one-word / spoken）；`BaseQuestion` 補 4 個 optional 欄位（`starterSection?` / `starterPart?` / `skillFocus?[]` / `expectedAnswerType?`），不破壞 discriminated union、不新增 part-specific question types。`data/p3-example-questions.json` 7 題各補 metadata（依任務單明示 mapping：q-mc-001 → RW4 / q-pc-001 → RW1 / q-wc-001 → RW3 / q-lc-001 → L3 / q-fb-001 → RW4 / q-fb-002 → RW4 / q-mt-001 → RW5），不改 prompt / answer / options / explanation。`components/QuizPlay.tsx` 新增 `STARTER_PART_DISPLAY` map（13 個 part：L1 聽句子配人物 / 物件位置、L2 聽對話寫 name / number、L3 聽音選圖、L4 聽指令 · 顏色 / 物件、RW1 看圖判斷 / 看圖選答案、RW2 看大圖回答 yes / no、RW3 看圖認字 / 拼字練習、RW4 短文 / 句子填空、RW5 圖文配對 / 故事理解預備、SP1~SP4 P4 預留）；`getStarterPartInfo()` / `getSectionTag()` 優先讀 `question.starterPart` / `question.starterSection` metadata，缺值時 fallback 到依 `question.type` 推導（保留「Part X preview」字樣於 fallback 路徑）；fallback 路徑保留所以舊資料完全相容；新增 `StarterPart` import 從 `@/lib/types`。`docs/DATA_SCHEMA.md` 補「Starters part metadata（P3-9-B）」一節（用途 / 邊界 / 4 欄位說明表 / 範例 jsonc / 7 題範例的 metadata 對應表 / 不在 P3-9-B 第一刀範圍 6 條）。`PROJECT_ROADMAP.md` P3-9-B 從 ⬜ 升為 🟡（5 條 ✅：types / BaseQuestion 欄位 / 7 題範例 metadata / Quiz Part 顯示優先讀 metadata / DATA_SCHEMA 補段；7 條 ⬜：ttsScript / imagePrompt 評估、difficulty、part-specific types、validator、sceneGroup、multi-blank、imageSequence 等）；P3-9 整體仍 🟡。`README.md` 「目前功能」`/quiz` 條目補：範例題目已補 Starters section / part metadata、`/quiz` Part 顯示優先讀題目 metadata、目前仍是練習版近似對應、Speaking metadata 預留不在 P3 實作。**未做** ttsScript / imagePrompt 升正式 schema / difficulty 字面量升級 / part-specific question types / metadata validator / 多題共用 scene image / 多空格 fill-blank / 多圖序列 / Speaking UI / TTS / 錄音 / STT / AI API / crawler / `/quiz/wrong` / 獨立錯題頁 / 計時器 / 完整 P3-9-C UI / localStorage schemaVersion 升級。**未動** `lib/data.ts` / 任何 `app/*` 路由 / 其他 components / `lib/examSessionStorage.ts` / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有圖片 / 音檔 / `package.json` / 依賴。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 聽音選圖 / 直接交卷 / 重新測驗（metadata 帶 starterPart=L3，與 fallback 顯示一致）+ `/review/word/apple` 翻牌完整回歸 + dev log 無 error / hydration / warn。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅（6 / 9）/ P3-9-B 部分 ✅（5 / 12）/ P3-6-B-5 部分 ✅（1 / 2）；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：完成 P3-6-B-4 第二刀——`/quiz` 結果頁加「再練習這些題目」inline retry mode，純 React in-memory state，**不**新增 `/quiz/wrong` 路由 / **不**升 `QUIZ_SESSION_SCHEMA_VERSION` / **不**新增 `wrongQuestionIds` localStorage 欄位 / **不**覆蓋原始測驗分數。`components/QuizPlay.tsx` 加 4 個新 state（`retryQuestionIds: string[] | null` / `retryAnswers` / `retryIndex` / `retrySubmitted`）+ 5 個 handler（`handleStartRetry` / `handleExitRetry` / `handleSelectRetryAnswer` / `handleRetryNext` / `handleRetrySubmitNow`）+ `resetRetryState` helper 給 `handleRestart` 同時重置 retry state；`inRetry = retryQuestionIds !== null` derived；`retryIdSet` + `retryQuestions = questions.filter(...)` + `retryTotal` derived。**渲染分支順序**：total=0 → inRetry+retrySubmitted（RetryResultView）→ inRetry+!retrySubmitted（retry quiz JSX 內聯）→ session.submitted（ResultView 加 onStartRetry prop）→ !current → 一般 quiz；retry mode 取代既有 session.submitted 結果頁渲染。**Retry quiz JSX 內聯**：amber 系 banner「🔁 再練習模式：只練習錯題與未作答題」+ 副標「本次再練習結果<strong>不會覆蓋</strong>原始測驗分數；隨時可按下方『返回完整結果』回到原始結果頁」+ 段落徽章 / Part 標示重複利用既有 helpers + 進度「再練習 第 X / Y 題」（retry-relative）+ QuestionView + 「下一題」/「看再練習結果」按鈕 + 底部 chip 「📝 直接交卷」/「↩ 返回完整結果」。**新增 `RetryResultView` 元件**：amber 系 banner 含「🔁 本次再練習結果」+ 副標重申不覆蓋原始分數 + 🌱 重新嘗試圖示 + 「再練習完成！」標題 + 答對 N/Y + 雙欄統計（已作答 / 未作答）+ 4 段鼓勵語（依答對率分級）+ 「再練習每題詳解」section + 重複利用 `QuestionDetailCard`（用 `originalIndexById` map 取原始試卷 index、確保「第 N 題」對齊整份試卷）+ 「↩ 回到完整測驗結果」主按鈕（amber-400）+「🔁 重新測驗（清除原始與再練習進度）」次按鈕 + 回首頁 link。**ResultView props 新增** `onStartRetry: (ids: string[]) => void`；reviewCount > 0 時顯示「🔁 再練習這些題目（{reviewCount}）」rose-400 按鈕，位於詳解列表與重新測驗之間；按下傳 `statuses.filter(s => s.status === "incorrect" || s.status === "unanswered").map(s => s.question.id)`。修兩處 markdown `**` syntax 在 JSX 中無法 render 的 bug → 改用 `<strong className="font-bold">` 包裹「不會覆蓋」。**Codex 暫停期由 Claude 自測**通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 Listening / 聽音選圖 / 直接交卷 / 重新測驗 + 首次進入不含「再練習這些題目」/「再練習模式」/「本次再練習結果」/「回到完整測驗結果」/「每題詳解」/「不會覆蓋」（因 submitted=false 時 ResultView / RetryResultView / retry quiz 皆不渲染、字串只在 client JS chunk 內）+ `/review/word/apple` 翻牌完整回歸 + dev log 無 error / hydration / warn。`PROJECT_ROADMAP.md` P3-6-B-4 從「3 條 ✅ + 3 條 ⬜」升為「6 條 ✅ + 3 條 ⬜」（加：「再練習這些題目」入口 / inline retry mode / 不新增路由不升 schemaVersion）；P3-6-B 整體仍 🟡（B-1 / B-2 / B-3 完成；B-4 部分完成；B-5 仍 1 條 ✅ + 1 條 ⬜）。`README.md` `/quiz` 條目補 retry mode 說明（rose-400 按鈕 / amber 系 banner / 不覆蓋原始分數 / 完成後可回完整結果）。本輪未動 `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / `app/quiz/page.tsx` / 任何 `app/review/*` / 其他 components / 所有 docs / source_materials / `package.json` / 依賴。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅（6 / 9）；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B-5 部分 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：完成 P3-6-B-4 第一刀——`/quiz` 結果頁加「全部 / 只看錯題 / 只看未作答 / 需要再練習」inline filter，純 React local state、零依賴新增、未動 localStorage。`components/QuizPlay.tsx` 在 file scope 新增 `DetailFilter` type（4 個字串字面量 all / incorrect / unanswered / review）+ `FILTER_LABELS` + `FILTER_ORDER` + `EMPTY_STATE_MESSAGES` 三段友善空狀態提示；ResultView 內加 `useState<DetailFilter>("all")`、一次計算 `statuses` 陣列（每題 question / index / status，後續四個 count 與 filter 共用）、computed `incorrectCount` / `unansweredCount` / `reviewCount` / `filterCounts` record；4 個 chip buttons 排在「每題詳解」標題下方（flex-wrap + center + amber-300 selected / white unselected + 內嵌 count badge）；空狀態時顯示 emerald 系卡片含對應友善訊息（incorrect → 「太棒了，目前沒有答錯的題目！」/ unanswered → 「很好，這次每一題都有作答！」/ review → 「全部都很棒，這次沒有需要再練習的題目！」）；filter 過濾仍保留原始 `index` 顯示「第 N 題」對齊整份試卷編號。matching 完成後算 correct，不出現在 review／incorrect / unanswered 任何 filter。**不**新增 `/quiz/wrong` 路由、**不**新增 `wrongQuestionIds` localStorage 欄位、**不**升 `QUIZ_SESSION_SCHEMA_VERSION`、**不**做正式歷史紀錄頁、**不**做計時器、**不**動 `lib/types.ts` / `data/*.json` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何其他 components / 任何 docs。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 直接交卷 / 重新測驗 + 首次進入不含「每題詳解」/ 4 個 filter chip / 空狀態提示文字（因 submitted=false 時 ResultView 不渲染、字串只在 client JS chunk 內）+ `/review/word/apple` 翻牌完整回歸 + dev log 無 error / hydration / warn。`PROJECT_ROADMAP.md` P3-6-B-4 從 ⬜ 升為 🟡 進行中（3 條 ✅：filter / 數量 / 空狀態；3 條 ⬜：再練習錯題入口 / 獨立錯題複習頁 / wrongQuestionIds 升 v2 + migration）；P3-6-B 整體仍 🟡 進行中（B-1 / B-2 / B-3 完成；B-4 部分完成；B-5 計時器仍 ⬜）。`README.md` `/quiz` 條目補結果頁篩選段。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-09：完成 P3-6-B-3 第一刀——`/quiz` 結果頁加「每題詳解列表」。`components/QuizPlay.tsx` 新增 5 個純函式 helper（`getQuestionStatus` 三態 / `formatUserAnswer` / `formatCorrectAnswer` / `getQuestionPromptDisplay` / `getExplanationDisplay`）+ `STATUS_STYLES` 三色配色表（emerald 答對 / rose 答錯 / amber 未作答）+ `QuestionDetailCard` 子元件（每題卡片含：第幾題 + Section + Part + 狀態 chip + 題目文字版 + 你的答案 / 正確答案雙欄 + 說明）；ResultView props 從 `total / correctCount / answeredCount` 改為 `questions / answers`，內部即時計算統計，避免重複計算邏輯；保留既有「答對 N / M + 已作答 X / M + 未作答 M-X + 鼓勵文案 + 重新測驗」上半部視覺；結果頁底部插入新區段「每題詳解」`<section aria-label="每題詳解">` + 卡片清單。每題型答案格式化：multiple-choice / picture-choice / word-choice / listening-choice 顯示選到的字串值（`answer` 即 label 或 ImageOption.value）；fill-blank 選項版顯示選的選項，自由填空版顯示輸入文字；matching `_done` token 顯示「已完成閱讀配對練習」、正確答案顯示「本題目前為閱讀型練習，完成即算正確」；未作答顯示「尚未作答」、不算對。題目顯示文字版（不複製大圖 / 大音檔給家長辨識）：listening 用 `transcript` / `ttsScript`；word-choice 顯示「這個英文單字是「X」」；picture-choice / matching 用 prompt 或備援文字；multiple-choice / fill-blank 用 prompt。explanation 優先顯示 `BaseQuestion.explanation`，無 explanation 時依狀態給三段鼓勵性 fallback。**不**新增獨立錯題頁 / `/quiz/wrong` 路由 / 錯題 localStorage / 歷史紀錄頁；**不**升 `schemaVersion`、**不**動 `lib/types.ts` / `data/*.json` / 任何 `app/review/*` 路由 / `lib/examSessionStorage.ts`；**不**新增依賴。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 聽音選圖 / 直接交卷 / 重新測驗 + 首次進入不含「每題詳解」（因 submitted=false）+ RSC payload 含全部 7 題資料供 hydration 後 ResultView 組裝（`Which one is a fruit?` / `q-fb-002` / `I have a` 等命中）+ `/review/word/apple` 翻牌完整回歸 + dev log 無 error / hydration / warn。`PROJECT_ROADMAP.md` P3-6-B-3 從 ⬜ 升為 ✅（7 條 ✅）；P3-6-B 整體仍 🟡 進行中（B-1 / B-2 / B-3 完成；B-4 錯題複習獨立頁、B-5 計時器仍 ⬜）。`README.md` `/quiz` 條目補結果頁每題詳解段。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B-4 / P3-6-B-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-08：完成 P3-6-B-1 + P3-6-B-2——`/quiz` 從「一次性 React state」升級為「可保存進度的 Exam Session 第一版」，這是 P3-6-B 的第一刀。新增 `lib/examSessionStorage.ts` helper（150 行）：localStorage key `cambridge-starters-practice:quiz-session:v1`、`schemaVersion = 1`、`createEmptySession` / `loadSession` / `saveSession` / `clearSession` / `isCompatibleSession` 純函式 + 完整 try/catch（防 JSON parse 失敗 / SecurityError / SSR 環境 / `typeof window === "undefined"`） + `isQuizSessionShape` runtime shape 驗證；session 欄位精簡（schemaVersion / paperId / questionOrder / currentIndex / answers / submitted / startedAt / updatedAt / submittedAt 可選），與 `lib/types.ts` 的 `ExamSessionState` 概念對齊但**不存** `examSessionId` / `score` / `wrongQuestionIds`（屬 P3-6-B-3+）。`components/QuizPlay.tsx` 三個獨立 state（currentIndex / answers / submitted）改為單一 `session` state；hydration 後嘗試從 localStorage 恢復；session 變更後自動寫回 localStorage；setState in effect 透過 `queueMicrotask` 包成非同步 callback 避開 React 19 `react-hooks/set-state-in-effect` 規則（與既有 `QuizImage` 的 `probe.onload` 模式一致）；新增 `hydrated` flag 避免 race（初始 empty session 蓋掉舊 session）；不相容情境（schemaVersion / paperId / questionOrder 任一不符 / JSON parse 失敗）一律丟棄舊 session 並建立新 session、頁面不 crash。**繼續作答**：自動恢復進度 + emerald 系小提示「🔁 已恢復上次作答進度」（首次點選任何答案後消失）。**重新測驗**：題目卡下方灰底 chip 按鈕，無 confirm dialog（依任務單），清 session + 回第一題 + answers 清空 + submitted = false。**直接交卷**：題目卡下方 amber chip 按鈕，submitted + submittedAt 寫入後立即進結果頁。**結果頁**改寫：答對 N / M + 已作答 X / M + 未作答 M-X 三段（emerald / rose 配色）+ 鼓勵文案 + 「未作答的題目算錯」明示 + 重新測驗。`app/quiz/page.tsx` 補 `paperId` prop 傳給 `<QuizPlay>`（從 `paper.examPaperId` 讀 `starters-mock-001`）。`PROJECT_ROADMAP.md` P3-6-B 從單一 ⬜ 拆為五段：**P3-6-B-1**（6 條 ✅）+ **P3-6-B-2**（7 條 ✅）+ **P3-6-B-3** 完整結果頁與每題詳解（4 條 ⬜）+ **P3-6-B-4** 錯題詳解與錯題複習（3 條 ⬜）+ **P3-6-B-5** 計時器（1 條 ✅ 第一版不計時 + 1 條 ⬜ 未來計時器）；P3-6-B 整體狀態 ⬜ → 🟡。**未做**完整每題詳解 / 錯題複習頁 / 正式歷史紀錄 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler。**未動** `lib/types.ts` / `data/*.json` / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 任何 `app/review/*` 路由 / `components/PicturePractice` / `components/VocabularyCard` / 既有圖片 / 音檔 / SVG / `package.json` / 任何依賴。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）+ dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 聽力練習 / Part 3：聽音選圖 / 直接交卷按鈕 / 重新測驗按鈕 / paperId `starters-mock-001` 在 RSC payload + 首次進入 visible HTML 不含「已恢復上次作答進度」（因為初始空 session）+ 既有 `/review/word/apple` 翻牌與跨字母 ant/baby 完整回歸 + dev log 無 error / hydration / warn；helper 邏輯透過 Node 8 項單測通過（createEmptySession / 5 種不相容情境 / JSON 圓規 / bad JSON 處理）。`README.md` `/quiz` 條目補 localStorage 與基本操作說明。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-7-A / P3-9-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B-3 / P3-6-B-4 / P3-6-B-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-08：完成 P3-7-A 官方資源索引文件第一版——本輪純文件，**零程式碼變動**。新增 `docs/OFFICIAL_RESOURCES.md`（v1）：用繁體中文撰寫，明示「只保存連結與人工筆記、不下載官方 PDF / 圖片 / 音檔、不複製官方題目 / 歷屆題、不做自動爬蟲、不把官方 sample 題目轉入正式題庫、不使用網路圖片當正式素材」7 條硬邊界。**用途與硬邊界**：對齊 PRODUCT_SPEC「目前明確不做」/ source_materials/README「官方資源與歷史題整理原則」/ AI_QUESTION_GENERATION「來源規則硬邊界」三處，列出 7 條 ✅ 可以做 + 9 條 ❌ 不可做。**索引格式**：每筆條目 8 欄位（資源名稱 / 官方用途 / 本專案用途 / 可參考內容 / 不可直接使用內容 / 對應 Roadmap / 對應文件 / 連結）；連結欄位由人工從主入口導航後驗證填入，**v1 不預先填入特定 sub-page URL** 避免 AI 生成過時資訊。**A 段官方考試格式與 parts**（4 條目：Cambridge English 主站 / Pre A1 Starters 考試資訊頁 / Test format 頁 / Handbook for teachers）。**B 段 preparation / sample resources**（4 條目：Preparation 頁 / Sample papers 入口 / Wordlist 入口 → C 段 / Mock test toolkit 入口 → D 段）。**C 段 Wordlist / vocabulary 方向**：C-1 wordlist 條目 + C-2 5 條使用原則（範圍參考、不複製整份 PDF、自家 data/vocabulary.json 為主、分類概念對齊既有 11 個 VocabularyCategory、未來整理需確認來源）+ C-3 與 P3-7-C 對接。**D 段 Sample / mock test toolkit 方向**：D-1 sample papers 5+5 對照表（可參考題型順序 / 互動方式 / 題目數量 / 音檔節奏 / 場景設計；不複製題目 / 圖片 / 音檔 / 答題單 / 場景圖原檔）+ D-2 mock test toolkit 4+4 對照表 + D-3 與 P3-7-D 對接。**用官方資源校正 P3-9 模板**：11 條檢查清單（L1~L4 + RW1~RW5 + getStarterPartInfo preview + STARTERS_PART_TEMPLATES 升 v2）+ 校正動作非目的（不抄原文 / 不要求 100% 還原 / 不轉 sample 為 data JSON）。**AI 仿真題素材來源策略**：6 條 ✅ 應使用（官方題型結構 / 本專案 vocabulary / 自製 imagePrompt / 自製 ttsScript / 自製 explanation / 人工審核）+ 6 條 ❌ 不應使用（官方題目全文 / 官方圖片 / 官方音檔 / 歷屆題原文 / 網路圖片 / 外部 URL）+ 違反時處理 SOP。**與其他文件關係表**：對齊 PRODUCT_SPEC / source_materials/README / STARTERS_PART_TEMPLATES / AI_QUESTION_GENERATION / DATA_SCHEMA / PROJECT_ROADMAP 六處。`PROJECT_ROADMAP.md` 把 P3-7 從單一 ⬜ 拆為四段：**P3-7-A**（11 條 ✅，本輪完成）+ **P3-7-B** format 對 P3-9 模板逐項校正（11 條 ⬜，未開始）+ **P3-7-C** wordlist 對自家 vocabulary 分類校正（4 條 ⬜，未開始）+ **P3-7-D** sample / mock test toolkit 題型觀察筆記（4 條 ⬜，未開始）；P3-7 整體狀態 ⬜ → 🟡 進行中。`README.md`「長期方向」段補一段官方資源索引文件指向 + 文件索引追加 `docs/OFFICIAL_RESOURCES.md`。`source_materials/README.md`「官方資源與歷史題整理原則」段補一句「**詳細官方資源連結索引請看 `docs/OFFICIAL_RESOURCES.md`**」交叉指向。本輪**未動** `lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / `/quiz` UI / 任何 components / 所有 app routes / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/STARTERS_PART_TEMPLATES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md`；**未寫**爬蟲、未下載官方 PDF / 圖片 / 音檔、未複製官方題目 / 歷屆題、未新增官方資源檔案到 source_materials、**未新增**任何題目資料、**未做** AI API / TTS / 錄音 / STT / Speaking UI / localStorage / 結果頁 / 錯題頁、**未新增**依賴、**未處理** npm audit、**未部署**、**未新增**後端 / DB / 登入。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-7-A / P3-9-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-08：完成 P3-9-A 正式題型模板文件第一版——本輪純文件，**零程式碼變動**。新增 `docs/STARTERS_PART_TEMPLATES.md`（v1）：用繁體中文撰寫，明示「自製練習模板，不是官方題庫、不複製官方題目」+ 硬邊界（不抄歷屆題 / 不下載官方素材 / 不爬蟲 / 不外部 URL / 沒有「官方題」這個 source 值）。完整三大段架構（Listening Part 1~4 / Reading & Writing Part 1~5 / **Speaking 不在 P3，留 P4**）。**Listening Part 1~4** 模板每 Part 12 欄位（官方方向 / 練習版目標 / 互動方式 / 資料欄位 / imagePrompt / ttsScript / answer 型態 / 目前 schema 是否支援 / 未來補哪些功能 / 是否需要圖片 / 是否需要音檔 / 是否適合 AI 仿真）；L1 大圖位置連線（簡化為選人 / 選位置）/ L2 對話寫 name / number（簡化為文字輸入）/ L3 聽音選 A/B/C 圖（最接近現有 listening-choice）/ L4 聽指令塗顏色（簡化為選顏色 / 選物件）。**Reading & Writing Part 1~5** 模板每 Part 10 欄位（同上去掉 ttsScript 與音檔）；RW1 看圖 + 句子 yes/no（對應 true-false / picture-choice 未來版）/ RW2 大場景圖回答 yes/no（需要 scene image + 多題共用，schema 待補）/ RW3 看圖拼字（對應「只顯示圖片不顯示英文，孩子自己拼字」未來單字拼字測驗模式）/ RW4 短文 / 句子填空（對應現有 fill-blank，多空格待補）/ RW5 看故事圖一字答案（需要 3 張圖 / scene + one-word answer，schema 待補）。**目前 P3 schema 對應表**：listening-choice → L3 preview / picture-choice → RW1 / RW2 preview / word-choice → RW3 preview（看圖認字反向） / multiple-choice → RW4 preview / fill-blank → RW4 / matching → RW5 preview，明示「練習版近似對應、不是完整正式題型」。**未來題型資料欄位建議**：starterSection / starterPart（含 SP1~SP4 對齊 P4）/ skillFocus / ttsScript / imagePrompt / expectedAnswerType（choice / text / number / name / color / one-word / spelling / spoken）/ difficulty（starter-easy / starter-medium）/ 其他（imageHotspots / sharedSceneImage / images[] / colorPalette / instructions[] / wordBank / multiBlankAnswers）；**明示本輪只寫建議，不修改 lib/types.ts / 任何 data JSON**。**AI 仿真題 prompt 如何使用模板**：8 步流程（選 section + part → 套用 part template → 限制 vocabulary → 生成 imagePrompt / ttsScript → 生成 answer / explanation → 人工審核 → 進 source_materials → 轉正式 data JSON），對齊 P3-3 / P3-8。**與 P4 Speaking Examiner Agent 關係**：P3 不實作 Speaking、SP1~SP4 模板未來歸屬 `docs/SPEAKING_EXAMINER_AGENT_DESIGN.md`（規劃中）、AI 回饋不是官方成績、處處標示。`PROJECT_ROADMAP.md` P3-9 從單一 ⬜ 子分區拆為三段：**P3-9-A**（10 條 ✅，本輪完成）+ **P3-9-B** part-specific schema / metadata 實作（11 條 ⬜，未開始）+ **P3-9-C** part-specific quiz UI 實作（10 條 ⬜，未開始）；P3-9 整體狀態 ⬜ → 🟡 進行中。`README.md`「長期方向」段補一段說明已新增正式 Starters parts 模板文件、目前仍是練習版近似對應、未來會依模板逐步對齊 L1~L4 + RW1~RW5、Speaking 留 P4。本輪**未動** `lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / `/quiz` UI / 任何 components / 所有 app routes / 任何素材；**未做** localStorage / 完整結果頁 / 錯題頁 / Speaking UI / TTS / 錄音 / STT / AI API / crawler / 部署 / 後端 / DB / 登入；**未下載**官方 PDF / 圖片 / 音檔；**未複製**官方題目 / 歷屆題；**未新增**依賴；**未處理** npm audit。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（路由 88 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-9-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B / P3-7 / P3-8 / P3-9-B / P3-9-C 全 ⬜），P4 / P5 仍 ⬜。
- 2026-05-08：P3 / P4 / P5 Roadmap 擴充——本輪只做文件 / Roadmap 規劃，**零程式碼變動**。`PROJECT_ROADMAP.md` 新增 P3-7（官方資源索引與人工整理流程）/ P3-8（AI 仿真題生成流程）/ P3-9（正式題型模板化，含 Listening Part 1~4 + R&W Part 1~5 模板，Speaking 不在 P3 實作）三個子分區皆 ⬜；P4 章節從歷史佔位「題型擴充 ⬜ 已併入 P3-4 / P3-5」**重新聚焦為「Speaking Examiner Agent 模擬考官系統」**，9 個子項全 ⬜（P4-1 流程設計 / P4-2 狀態機設計 / P4-3 TTS 考官語音 / P4-4 錄音與播放 / P4-5 STT / P4-6 追問 / 下一題控制 / P4-7 AI 口說評分器 / P4-8 session 紀錄與家長檢視 / P4-9 弱點分析）；P5 章節從歷史佔位「模擬考 ⬜ 已併入 P3-6」**重新聚焦為「完整仿真考試體驗」**——Listening + Reading & Writing + Speaking 串成完整模擬考、TTS 考官貫穿、成績紀錄 / 家長檢視 / 弱點分析 / 錯題與口說弱點複習；P4 / P5 重要免責語「AI 口說分數只是練習回饋，不是 Cambridge 官方成績」「不聲稱能預測官方分數」「不把 AI 評分當成正式證明」「UI 必須標示『AI 練習回饋，非官方考試分數』」處處標示。「目前明確不做」清單把「AI 評分」改寫為**「客觀題的 AI 評分」**並加例外說明：P4 Speaking Examiner Agent 的口說練習回饋不是 AI 評分、是鼓勵性練習建議；客觀題 AI 評分仍維持不做。`docs/PRODUCT_SPEC.md` 新增「**長期目標：自家仿真 Starters 模擬考系統**」一節，含設計原則、Speaking Examiner Agent agent-based flow 設計（狀態機概念、考官台詞、回合控制、評分定位）、完整仿真考試體驗（P5）；「目前明確不做 → AI / 自動化」段同步重寫為「客觀題不做 AI 評分」+ Speaking 練習回饋例外。`source_materials/README.md` 新增「**官方資源與歷史題整理原則**」一節，列「可以做」（保存連結、人工筆記、自製題、AI 仿真題、自製圖片 / 音檔）與「不可做」（爬蟲、commit 官方 PDF / 圖片 / 音檔、複製歷屆題、用網路圖片當正式素材、聲稱 AI 題是官方題、外部 URL 進題庫資料）兩組明確邊界。`README.md` 新增「**長期方向**」一節，明示專案長期會往完整 Starters 仿真考試系統發展、目前仍在 P3 階段、Speaking / TTS / 錄音 / STT / AI 口說回饋屬 P4 後續、AI 回饋僅作練習建議不是官方成績。本輪**未動** `lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / 任何 components / 任何 app routes / `docs/DATA_SCHEMA.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `docs/TASK_ROUTER.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `AGENTS.md` / `CLAUDE.md`；**未寫**爬蟲、未下載官方 PDF / 圖片 / 音檔 / 歷屆題、**未新增**任何題目資料、**未做** AI API / TTS / 錄音 / STT / AI 評分 / Speaking UI / localStorage / `/quiz` 功能修改、**未新增**依賴、**未處理** npm audit、**未部署**、**未新增**後端 / DB / 登入。Codex 暫停期由 Claude 自測通過：`npm run lint` / `typecheck` / `build` 三項全綠（path 88 routes 不變）。P2 仍 🟡 進行中，P3 仍 🟡 進行中（P3-1 / P3-2-A / P3-3-A / P3-6-A ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-6-B / P3-7 / P3-8 / P3-9 全 ⬜），P4 / P5 重新進入 Roadmap 雷達但全部 ⬜。
- 2026-05-08：P3-6-A 小修——`/quiz` 對齊正式 Cambridge Pre A1 Starters parts 架構。`components/QuizPlay.tsx` 新增 `StarterPartInfo` type 與 `getStarterPartInfo()` 純函式 helper，把 6 題型映射到對應 Part 的近似標示：listening-choice → Part 3「聽音選圖」；picture-choice → Part 1 / Part 2 preview「看圖判斷 / 看圖選答案」；word-choice → Part 3「看圖認字 / 拼字練習」；multiple-choice → Part 4 preview「短句選字」；fill-blank → Part 4「短文 / 句子填空」；matching → Part 5 preview「圖文配對 / 故事理解預備」。題目卡 header 三列改寫：徽章合併段落英文｜中文「Section 1 · Listening｜聽力練習」/「Section 2 · Reading & Writing｜閱讀與書寫練習」（sky-100 / amber-100 配色）+ 第二行獨立顯示「Part X：題型中文」+ 第三行既有「第 X 題 / 共 N 題」進度。`app/quiz/page.tsx` 頁首補一行小字「目前為練習版，題型逐步對齊正式 Cambridge Starters」，避免使用者誤解為完整官方考卷；明示這是練習版近似對應、Speaking 不做、listening 真實音檔尚未實作。`PROJECT_ROADMAP.md` P3-6-A 子分區補一條 ✅；P2-4C-2B-2 補兩條未來規劃（單字閱讀練習模式、單字拼字測驗模式對應正式 Reading & Writing Part 3，皆屬 review 區獨立練習，**本輪不實作**）。`README.md` 同步「目前功能」`/quiz` 條目補 Part 標示說明。本輪零依賴新增、未動 `lib/types.ts` / `lib/data.ts` / 任何 `data/*.json` / 任何 `/review/` 路由 / 任何其他 components；未實作單字閱讀模式 / 拼字測驗模式 / Speaking / localStorage / 完整結果頁 / 錯題頁 / AI API。Codex 暫停期由 Claude 自測通過：lint / typecheck / build 三項全綠 + dev smoke test 8 條路由 200 + `/quiz` SSR 第 1 題 visible HTML 含「Part 3：聽音選圖」字串 + 徽章合併段落英文中文「Listening｜聽力練習」+ 頁首練習版聲明。P3-6-A ✅ 增加一條，P3 整體仍 🟡 進行中。
