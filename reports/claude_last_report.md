# Claude Code 回報 · P3-9-C：L3 A / B / C / D 圖選項視覺第一版

任務日期：2026-05-10
任務性質：**UI + 資料 + 文件**——L3 listening 選項從文字改為圖卡並加 A / B / C / D 標籤對齊正式 Cambridge L3 視覺；同時隱藏英文單字避免聽力答案外洩。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只動 1 個 component（QuizPlay）+ 1 個 data 檔（q-lc-001 options）+ 4 份 doc；**未動** schema 型別（既有 `optionType: "image"` + `ImageOption[]` 已支援，零型別變動）/ 音檔（仍用 OpenAI v2）/ transcript 隱藏行為（P3-9-C 第二刀策略保留）/ RW1 true-false 行為（仍 9 題、yes/no 1+1 平衡）/ 圖片素材（重用既有 apple / cat / dog SVG，banana 仍缺檔走 fallback）；未呼叫 OpenAI API / 未重產音檔 / 未新增 audio / 未下載官方素材 / 未使用官方題目 / 未新增圖片 / 未新增大量題目 / 未做 Speaking Agent / 未 commit API key。

## 【本輪修改摘要】

`q-lc-001` 切到圖選項：`optionType: "text"` → `"image"`，`options` 從 `["apple", "banana", "cat", "dog"]` 改為 4 個 `ImageOption`（apple / banana / cat / dog 各對應 `/images/<name>.svg`）；`audioSrc` 不變（仍 OpenAI v2）、`transcript` / `ttsScript` / `answer` / `explanation` / metadata 全部不動。`components/QuizPlay.tsx` 新增 file-private `ListeningImageOptionButton` 元件——左上角 A / B / C / D 圓形標籤（selected 時 amber-500 / unselected 時 sky-500，h-7 w-7 sm:h-8 sm:w-8 / text-sm font-black 對齊既有 sky 系 listening 配色），**不顯示 `option.value` 英文單字**（避免聽力答案外洩，這是 L3 圖選項的關鍵安全行為），`fallbackInitial` 改用標籤字母而非 value 首字母（缺檔時也不會露出答案首字）；`ListeningChoiceView` image 分支從 `(opt) => <ImageOptionButton>` 改為 `(opt, idx) => <ListeningImageOptionButton label={String.fromCharCode(65 + idx)}>` 派發 A/B/C/D；text 分支保留（未來若有 listening 文字選項題仍可走原路徑）。文件 4 份同步：`docs/DATA_SCHEMA.md` listening-choice 段補 P3-9-C 第三刀 A/B/C/D 視覺 + 隱藏 value 英文 + fallback 改用標籤字母說明，jsonc 範例升級為 image 版；`docs/STARTERS_PART_TEMPLATES.md` L3 模板段標題加「+ 第三刀 A/B/C/D 圖選項視覺」+ 內容更新對應狀態 + schema 對應表第一層 listening-choice 條目同步、版本段加 v2.3；`README.md` `/quiz` 條目補 L3 圖卡升級說明；`PROJECT_ROADMAP.md` P3-9-C「L3 A / B / C 圖選項視覺」⬜ 改 ✅ + 新增 1 條 ⬜（未來限制選項為 3 對齊正式 L3、補 banana.svg、多題 L3 題庫）；P3-9-C 從 19 條 ✅ 升為 20 條 ✅。零依賴新增、零 schema / 型別變動。`npm run lint` / `typecheck` / `build` 全綠 + dev smoke 全綠。

## 【修改檔案清單】

修改 6 份，未新增任何檔案：

- `data/p3-example-questions.json`：`q-lc-001` `optionType: "text"` → `"image"`；`options` 從 `["apple", "banana", "cat", "dog"]` 改為 4 個 `{ value, image }`（apple → /images/apple.svg / banana → /images/banana.svg / cat → /images/cat.svg / dog → /images/dog.svg）。其他 8 題完全不動。
- `components/QuizPlay.tsx`：(a) 新增 file-private `ListeningImageOptionButton` 元件（含 docstring 標 P3-9-C 第三刀，A/B/C/D 角落標籤 + 不顯示英文單字 + fallback 用標籤字母），插在既有 `ImageOptionButton` 之後、`QuizImage` 之前；(b) `ListeningChoiceView` image 分支改用 `(opt, idx)` 配 `String.fromCharCode(65 + idx)` 派發 `<ListeningImageOptionButton>`；text 分支保留不動。其他元件 / view / hook / type 全不動。
- `docs/DATA_SCHEMA.md`：listening-choice 段 jsonc 範例從 text 版改為 image 版（含 4 個 ImageOption + answer "apple"）；`optionType` bullet 補 P3-9-C 第三刀 A/B/C/D 視覺說明 + 隱藏英文單字 + fallback 改用標籤字母（不再用 value 首字母避免洩漏答案）。
- `docs/STARTERS_PART_TEMPLATES.md`：(a) L3 模板段標題從「v2 校正 + P3-9-C 第一刀 audio 準備」改為「v2 校正 + P3-9-C 第一刀 audio 準備 + 第三刀 A/B/C/D 圖選項視覺」+ 本專案練習版目標段補 P3-9-C 第三刀已實作 image 選項 + A/B/C/D 標籤 + 隱藏英文單字 + 缺檔 fallback；(b)「未來需要補哪些功能」清單把「UI 加 A / B / C 標籤覆蓋在圖片角落」改為刪除線標 ✅ 完成 + 補「未來限制選項為 3 對齊正式 L3」+「補 banana.svg 等缺檔圖」+ TTS 音檔流程標 ✅；(c) schema 對應表第一層 `listening-choice` 條目補「P3-9-C 第三刀已加 A / B / C / D 視覺標籤 + 圖選項」；(d) 版本段加 v2.3（2026-05-10，P3-9-C 第三刀後續 L3 圖選項視覺第一版）。
- `README.md`：`/quiz` 條目「Listening 題在正式練習時隱藏文字稿」段後追加「L3 聽力選項升級為 A/B/C/D 圖卡」說明（含 q-lc-001 切到 image / 4 張 SVG / 2x2 圖卡 + 角落標籤 / 隱藏 value 英文 / fallback 改用標籤字母 / banana.svg 仍缺檔走 fallback 屬已知狀態）。其他敘述不動。
- `PROJECT_ROADMAP.md`：P3-9-C「L3 A / B / C 圖選項視覺」⬜ 改 ✅ 並擴寫成完整一段（檔案動點 + 元件設計 + fallback 安全行為 + 4 份 doc 同步）；新增 1 條 ⬜「未來 L3 限制選項數為 3（對齊正式 Cambridge L3 的 3 張版面）/ 補 banana.svg 等缺檔選項圖 / 多題 L3 題庫」；P3-9-C 從 19 條 ✅ 升為 20 條 ✅。

新增檔案：0。
未動：`lib/types.ts`（`ImageOption` / `ListeningChoiceQuestion` / `optionType` 既有支援，零型別變動）/ `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / 其他 components / `data/exam-papers.example.json`（題目順序 / sourceMix 不變）/ `docs/PRODUCT_SPEC.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 既有 audio 檔案（OpenAI v2 + v1 + macOS say 三版皆保留）/ 既有 SVG 圖片（apple / cat / dog 重用，banana 仍缺檔由 fallback 處理）/ 依賴。

## 【未做事項（明確排除）】

- 未呼叫 OpenAI API / Google / Azure / 任何雲端 TTS API
- 未重產音檔 / 未新增 audio 檔案（OpenAI v2 + v1 + macOS say 三版皆保留）
- 未下載官方音檔 / 圖片 / sample paper / 歷屆題
- 未使用官方題目原文
- 未新增圖片素材（banana.svg 仍缺檔走 fallback；理想是未來補圖但本輪不做）
- 未新增大量題目（題庫 9 題不變）
- 未做 Speaking Agent / 錄音 / STT
- 未 commit API key / `.env` / `.env.local`
- 未新增依賴 / 未處理 npm audit / 未升 localStorage schemaVersion / 未部署 / 未後端 / 未 DB / 未登入

## 【動手前自我檢查】

- [x] 讀 `AI_DEV_WORKFLOW.md`（語言規則 / Scope 控制 / 9 段回報格式 / 硬邊界）
- [x] 讀 `docs/TASK_ROUTER.md`（本輪屬 UI + 資料 + 文件，由 Claude Code 處理）
- [x] 讀 `PROJECT_ROADMAP.md` P3-9-C 條目確認上輪基準（19 條 ✅）
- [x] 確認 `lib/types.ts` `ListeningChoiceQuestion` 已支援 `optionType?: "text" | "image"` + `options: string[] | ImageOption[]`（schema 零變動）
- [x] 確認 `public/images/` apple / cat / dog SVG 存在；banana 缺檔（fallback 機制能撐住）
- [x] 確認任務硬邊界：未呼叫 OpenAI API / 未重產音檔 / 未新增 audio / 未下載官方素材 / 未使用官方題目 / 未新增圖片 / 未新增大量題目 / 未做 Speaking Agent / 未 commit API key

## 【測試 / 驗證紀錄】

- `npm run lint`：✅ 全綠（zero issues）
- `npx tsc --noEmit`：✅ 全綠（discriminated union narrow 完整、ListeningImageOptionButtonProps 型別完整）
- `npm run build`：✅ 88 routes 全部 static prerendered（路由數不變）
- dev smoke test（`npm run dev` + curl）：
  - 8 條路由 200：`/` / `/quiz` / `/review` / `/review/words` / `/review/picture` / `/review/letter/a` / `/review/word/apple` / `/review/word/banana`
  - `/quiz` SSR HTML 含 `q-lc-001-openai-v2.mp3` 出現 2 次（一次 `<audio src=>`、一次 RSC payload）→ 確認音檔仍 v2、未被改動
  - `/quiz` SSR HTML visible 含 4 個 `aria-label="選項 A/B/C/D"` 按鈕 → 確認新元件 render 出 4 張圖卡 + A/B/C/D 標籤
  - `/quiz` SSR HTML visible 出現「選項 A」「選項 B」「選項 C」「選項 D」各 1 次 → A/B/C/D 標籤實際顯示
  - `/quiz` SSR HTML 「What does the boy want」出現 1 次（**僅在 RSC payload 中**，給結果頁詳解使用；visible 區未顯示）→ 確認 P3-9-C 第二刀「考試中隱藏 transcript」行為仍正常
  - 4 個 SVG 路徑都出現在 HTML 中：apple.svg × 4 / banana.svg × 2 / cat.svg × 5 / dog.svg × 3 → 4 張 ImageOption 全部 render（cat / dog 出現次數較多因 q-tf-001 / q-tf-002 / q-mt-001 也用到）
  - 「圖片準備中」fallback 出現 1 次 → 對應 banana.svg 缺檔正確走 fallback（其他三張 SVG 都載入成功，無 fallback）
  - 「It is a cat」（q-tf-001 RW1 yes/no 描述）仍出現 → 確認 RW1 行為未受影響
  - dev log 無 error / hydration warn

## 【需要使用者確認 / 後續】

- 使用者實機在瀏覽器試玩 L3 第 1 題：(a) 確認看到 4 張圖卡 + 左上角 A / B / C / D 圓形標籤；(b) 確認**沒看到 apple / banana / cat / dog 英文字**（聽力答案不外洩）；(c) 確認點選後高亮（amber-500 selected ring）+ 「下一題」按鈕變可點；(d) 確認音檔仍是 OpenAI v2（按播放鈕應聽到自然語速版）；(e) 確認 banana 那張顯示「B + 圖片準備中」fallback；(f) 確認交卷後結果頁詳解顯示 transcript 「What does the boy want?」（訂正用）+ 顯示「你的答案：apple」/「正確答案：apple」。
- 若使用者實機回饋圖卡太小 / 標籤位置不對 / 配色不夠醒目 / 想改成 3 張（對齊正式 L3）→ 屬下一刀（可調整 grid-cols / 標籤大小 / 顏色 / 限制選項數）。
- 若使用者希望補 `banana.svg` 自製 SVG → 屬未來素材補件（建議找與既有 apple.svg 風格一致的單一物件、無背景、無英文字版本）。
- Codex 5/12 後完整總驗收：建議重點檢查 `/quiz` SSR + Hydration + a11y（aria-label / aria-pressed / role）+ 視覺對比度（A/B/C/D 標籤 vs 圖片背景）+ 多裝置 viewport（手機 grid-cols-2 是否擠）。

## 【Roadmap / Status 更新】

- P2-4C-2B-2：仍 🟡（部分進行中，L3 第一個自製音檔 + 流程文件 + OpenAI v2 切換已落地；P2 vocabulary 音檔仍 ⬜）
- P3-9-C：仍 🟡，**從 19 條 ✅ 升為 20 條 ✅**（新增「L3 A / B / C / D 圖選項視覺第一版」）+ 1 條新 ⬜（未來限制 3 張 / 補 banana.svg / 多題 L3 題庫）
- 整體 P3：仍 🟡（P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A ✅；P3-6-B-4 部分 ✅ / P3-7-B 部分 ✅ / P3-9-B 部分 ✅ / **P3-9-C 部分 ✅（20 條）** / P3-6-B-5 部分 ✅；P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8 全 ⬜）
- P4 / P5：仍 ⬜

## 【下一步建議】

主要兩個方向，依使用者意向擇一：

1. **L3 視覺微調 / 對齊正式 Cambridge L3**（屬 P3-9-C 後續刀數，本檔內延伸）
   - 限制 L3 選項數為 3（目前 4 張 A/B/C/D，正式 L3 是 3 張 A/B/C）—— 需 schema-level 支援或在 data 層改成 3 個 ImageOption；UI grid 可從 grid-cols-2 調整為 grid-cols-3 或保留 2 行排版
   - 補 `banana.svg` 自製 SVG（與既有 apple.svg 風格一致：紅 / 黃單一物件、無背景、無英文字）
   - 加 1~2 題 L3 題庫（多題練習，多元主題：where is...? / how many...? / which one is...?）配 OpenAI v2 audio
2. **RW1 yes/no 多題擴張 + 多元主題**（屬 P3-9-C 第三刀後續，與 L3 不同 part 並行）
   - 目前 RW1 只 2 題（q-tf-001 cat-yes / q-tf-002 cat-no），可補 dog / apple / book / red / blue / one / two 等不同主題的 yes / no 對
   - 共用 cat.svg + dog.svg + apple.svg + book.svg 等既有 SVG，避免新圖

短期內若僅做使用者驗收 / 細節微調，建議先停一刀讓使用者實機試玩，依回饋再決定是 L3 微調或 RW1 擴張。
