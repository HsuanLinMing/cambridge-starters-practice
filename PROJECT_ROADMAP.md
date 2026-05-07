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

#### P2-4C-2 後續複習類型與素材（尚未開始）

- ⬜ 真實圖片（自繪或 placeholder 256×256 PNG，分批補上）
- ⬜ 真實音檔（建議用 TTS 自製，避免官方版權）
- ⬜ 補齊更多單字（往未覆蓋字母 I / K / L / N / Q / U / V / X / Z 推進）
- ⬜ 看圖練習擴充：第二題型「看英文選圖」（Reading & Writing 真實考試常見變體）
- ⬜ 聽力練習實作（聽單字 / 聽句子、選圖片）
- ⬜ 句型練習實作（`This is...` / `I can see...` / `There is...`）
- ⬜ 位置 / 顏色 / 數量練習實作（介系詞、顏色 + 名詞、數字 + 名詞）
- ⬜ 視需要再啟用 category 補充模式入口（既有元件已保留）

## P3 考前練習與題庫（⬜ 規劃中）

> P3 是「測驗區」的完整路線，從題目資料、素材策略、各題型一直到模擬考與錯題複習。
> **本階段尚未開工**；所有子項皆為 ⬜，請暫不要把任何 P3 子項標為進行中或完成。
> 詳細產品方向見 `docs/PRODUCT_SPEC.md`「測驗與考前練習方向」。
> P3 涵蓋了原 P4「題型擴充」與原 P5「模擬考」的內容；舊章節保留作為歷史紀錄（見下文）。

### P3-1 考題資料 schema 擴充

- ⬜ Question 型別支援 `source` 欄位：`official_sample` / `past_paper` / `ai_generated` / `custom`
- ⬜ Question 型別支援題型 discriminator（`multiple-choice` / `listening` / `matching` / `fill-blank` / `pick-image` / `pick-word` …）
- ⬜ 支援欄位：題幹文字、選項、答案、解析、難度、主題、圖片路徑、音檔路徑
- ⬜ Listening 題目特化欄位（`audio` 必填、可選 `transcript`、`ttsScript`）
- ⬜ schema 變更同步寫入 `docs/DATA_SCHEMA.md`

### P3-2 本機資料匯入流程

- ⬜ 設計 `source_materials/` 資料夾結構（PDF / 圖片 / 音檔 / 整理後文字 各自子目錄）
- ⬜ 在 `docs/` 補一份匯入 SOP（手動把素材放進指定子資料夾）
- ⬜ 後續工具：把整理後文字 / CSV 轉成 `data/quizzes.json` 或 `data/papers/*.json`
- ⬜ 第一版**不做**自動網路爬蟲

### P3-3 AI 仿真題生成規劃

- ⬜ 撰寫「給 AI 的出題 prompt」標準格式（含風格、難度、題型、目標年齡）
- ⬜ AI 輸出直接落入既有 quiz JSON schema
- ⬜ 同步輸出 TTS script（給 listening 題）與 image prompt（給看圖題）
- ⬜ 標記 `source: "ai_generated"` 並附 prompt 版本號
- ⬜ 題目品質原則：小一友善、可愛、活潑、清楚

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
