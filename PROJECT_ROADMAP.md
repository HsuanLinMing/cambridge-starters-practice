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

#### P2-4C-2B-2 後續複習類型與素材（尚未開始）

- ⬜ 補更多自製 SVG / PNG 圖片素材（往剩下 44 個未補圖單字推進）
- ⬜ 真實音檔（建議用 TTS 自製，避免官方版權）
- ⬜ 補齊更多單字（往未覆蓋字母 I / K / L / N / Q / U / V / X / Z 推進）
- ⬜ 聽力練習實作（聽單字 / 聽句子、選圖片）
- ⬜ 句型練習實作（`This is...` / `I can see...` / `There is...`）
- ⬜ 位置 / 顏色 / 數量練習實作（介系詞、顏色 + 名詞、數字 + 名詞）
- ⬜ 視需要再啟用 category 補充模式入口（既有元件已保留）

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

### P3-6 完整考卷 Session、交卷與錯題複習

> 詳細產品方向見 `docs/PRODUCT_SPEC.md` 的「測驗與考前練習方向 → 完整考卷 Session」。

#### 完整考卷生成

- ⬜ 一次生成一整份完整考卷（不是隨機單題模式）
- ⬜ 一份考卷可包含多題型混合（Listening、Matching、Fill in the blanks、看圖選字、看字選圖、選圖題、選字題）
- ⬜ 同一份考卷內可混合多種來源（`official_sample` / `past_paper` / `ai_generated` / `custom`）
- ⬜ 整套 Cambridge Starters 樣式題組（Listening + Reading & Writing）

#### 作答進度保存（localStorage）

- ⬜ 使用瀏覽器 localStorage 保存未完成考卷 Session
- ⬜ 至少保存：`examSessionId` / `examPaperId` / `questionOrder` / `answers` / `currentIndex` / `submitted` / `score` / `wrongQuestionIds`
- ⬜ 下次進入時可偵測未完成 Session 並提示「繼續作答」
- ⬜ 不上後端 / 不上雲端 / 不做登入（見 ROADMAP 末尾「目前明確不做」）

#### 考卷操作

- ⬜ 繼續作答（從 `currentIndex` 接著做）
- ⬜ 離開這份考卷（保留進度回首頁，下次可繼續）
- ⬜ 重新測驗（放棄目前 Session、開新 Session，需確認提示避免誤觸）
- ⬜ 直接交卷（未答題視為未作答，立刻進入評分）

#### 交卷與結果頁

- ⬜ 計算分數（答對 N / 總 M、附鼓勵性視覺如星星 / 百分比）
- ⬜ 錯題以紅色標示
- ⬜ 顯示正確答案
- ⬜ 顯示簡單講解（小一友善語氣，鼓勵 > 懲罰）
- ⬜ 「再練習錯題」入口（後續功能延伸）
- ⬜ 結果留存於 localStorage，不上後端 / 雲端

#### 計時相關

- ⬜ **第一版不計時**
- ⬜ 未來若加入模擬考計時器：設為可選功能、預設關閉

## P4 題型擴充（⬜ 已併入 P3-4 / P3-5）

> 此章節原規劃已併入新版 P3-4「Listening 題型第一版」與 P3-5「Reading & Writing 題型第一版」。
> 保留章節作為歷史紀錄；下一輪 ROADMAP 整理時可移除或精簡。

- 原條目：
  - ⬜ Listening：播音檔 → 選正確單字 / 圖片 → 已併入 **P3-4**
  - ⬜ Matching：左右兩列拖曳或點選配對 → 已併入 **P3-5**
  - ⬜ Fill-in-the-blank：句子缺空單字 → 已併入 **P3-5**
  - ⬜ 題型 schema 統一進 `lib/types.ts` → 已併入 **P3-1**

## P5 模擬考（⬜ 已併入 P3-6）

> 此章節原規劃已併入新版 P3-6「完整考卷 Session、交卷與錯題複習」。
> 保留章節作為歷史紀錄；下一輪 ROADMAP 整理時可移除或精簡。

- 原條目：
  - ⬜ 完整 Cambridge Starters 題組（Listening + Reading & Writing）→ 已併入 **P3-6**
  - ⬜ 計時器 → 已併入 **P3-6**（預設可關閉）
  - ⬜ 一次作答完再批改 → 已併入 **P3-6**
  - ⬜ 結果可儲存（先 localStorage，不上後端 / 雲端）→ 已併入 **P3-6**

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
- AI 評分（自動判答用資料中的 `answer` 比對；AI 出題仍規劃中見 P3-3）
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
