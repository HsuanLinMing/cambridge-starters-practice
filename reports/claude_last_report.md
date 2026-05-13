# Claude Code 回報 · P3-10-A：正式資料匯入型 Crawler 與題庫資料管線（規劃 + 最小原型）

任務日期：2026-05-13
任務性質：**Schema 不動 + 規劃文件 + 最小 CLI 原型 + example 資料 + .gitignore / README / ROADMAP 同步**——建立「正式練習資料匯入 pipeline」的三層架構（resource index / imported source dataset / formal practice data）、規劃 7 種 `sourceType` 與 5 種 `reviewStatus`、寫最小 collector CLI 原型驗證端到端可跑。本輪硬邊界全遵守：未新增大量正式題目；未動 `data/p3-example-questions.json` / `data/exam-papers.example.json` 既有內容；未下載大量圖片 / 音檔；未做 PDF parser；未呼叫 OpenAI；未重產 TTS；未改 UI / schema / quiz / review 流程；未做 Speaking Agent；未接後端 / DB / 登入；未處理 npm audit；未部署；未 commit API key / `.env` / `.env.local`；**未新增任何 npm 依賴**（collector 使用 Node 18+ 內建 fetch + regex）。

## 【本輪修改摘要】

新增 4 份繁體中文規劃文件 + 3 個 example JSON + 1 個 collector CLI 原型 + `.gitignore` / `README.md` / `PROJECT_ROADMAP.md` 同步。

- **文件層**：`docs/PRACTICE_DATA_PLAN.md`（umbrella）引用三份子計畫 `PRACTICE_DATA_IMPORT_PLAN.md`（A 目標 / B 7 種 sourceType / C 三層架構 7 步流程 / D 16 欄位要求 / E 最小可玩資料包目標 / F 9 條後續擴充 / G 與既有文件關係） + `WEB_RESOURCE_COLLECTOR_PLAN.md`（A 6 條硬邊界 / B 三種模式 index-only / full-text / asset-aware / C 輸出格式 + 7 種 candidateType / D CLI flag 7 個 / E 與 normalizer 分工 / F 6 條後續擴充） + `QUESTION_IMPORT_NORMALIZATION_PLAN.md`（A 目標 / B 8 種題型對齊 / C 輸出格式 + id 規則 / D reviewStatus 5 狀態機 + 不允許轉換 / E normalizer 實作建議 / F 與既有文件關係）。
- **資料層**：3 個 example JSON commit 在 `data/imported/`：`resource-index.example.json`（3 筆 official / third_party / user_provided 範例）、`source-document.example.json`（2 筆含 cleanedText / headings / assets / extractedCandidates / provenance / reviewStatus 範例）、`normalized-questions.example.json`（3 筆 spelling / true-false / multiple-choice 範例，含完整 source / provenance / reviewStatus 欄位）。
- **工具層**：`scripts/web_resource_collect.mjs` v0.1 — **零依賴**最小 CLI 原型，支援 index-only / full-text 兩個模式；含 CLI 7 個 flag、HTML 簡單 regex 解析（title / description / h1~h6 / links / img / audio / video）、5 種 candidate 偵測規則（RW3 提示語 / RW1 yes/no 句 / 含 ____ 填空 / 編號題目 / 逗號分隔詞彙）、resourceType 粗略推斷（pdf_link / worksheet / sample_paper / video_page / vocabulary_list / info_page / unknown）；非 HTML content-type 印 warning（PDF / image / audio 屬未來 asset-aware）；fetch 失敗 / 超時走 exit 1。
- **流程層**：`.gitignore` 加 `data/imported/*.generated.json` + `research_cache/` + `tmp_crawl/` + `.local_research/`（example 仍 commit）；`README.md` 文件索引補 4 條 + 加「目前 /quiz 仍是題型功能驗證版，尚非正式完整練習資料包」說明 + 4 個 P3-10 文件連結；`PROJECT_ROADMAP.md` 在 P3-9-C 段與 P4 段之間插入完整 P3-10 段（含 P3-10-A / B / C ✅ 描述 + P3-10-D~K 8 條 ⬜ 後續待辦 + 三層架構 / 硬邊界說明）。

`npm run lint` / `typecheck` / `build` 三項全綠（88 routes 不變、無新依賴）+ collector CLI 兩種模式在 https://example.com 實測通過：HTTP 200 / 寫出符合 schema 的 generated JSON / linksCount / candidates 偵測正確 / gitignore 對 `.generated.json` 生效、對 `.example.json` 不生效（精確分流）。

**P3-9-C 仍 🟡（26 條 ✅）；P3 整體新增 P3-10 段，仍 🟡——未把任何整體階段標完成**。

## 【修改檔案清單】

新增 8 份；修改 3 份；未動既有題目 / 圖片 / 音檔 / UI / schema / 既有 quiz 行為：

新增（8）：

- `docs/PRACTICE_DATA_PLAN.md` — P3-10 umbrella 規劃（引用三份子計畫、最小可玩資料包目標、合法來源 6 種、後續刀數 P3-10-D~K 對應）
- `docs/PRACTICE_DATA_IMPORT_PLAN.md` — P3-10-A 主規劃（A 目標 / B 7 種 sourceType 表 / C 三層架構 7 步 / D 16 欄位 / E 最小可玩資料包 / F 9 條後續擴充 / G 與既有文件關係 / H 版本）
- `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` — P3-10-B 規劃（A 6 條硬邊界 / B 三種模式 / C 輸出格式 + 7 種 candidateType / D CLI flag / E 與 normalizer 分工 / F 6 條後續擴充 / G 版本）
- `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` — P3-10-C 規劃（A 目標 / B 8 種題型對齊 / C 輸出格式 + id 規則 + 必填 vs 選填 / D reviewStatus 5 狀態機 + 不允許轉換 / E normalizer 實作建議 / F 與既有文件關係 / G 版本）
- `data/imported/resource-index.example.json` — Layer 1 範例（3 筆 official / third_party / user_provided）
- `data/imported/source-document.example.json` — Layer 2 範例（2 筆含 cleanedText / headings / links / assets / extractedCandidates / provenance / reviewStatus: imported_raw）
- `data/imported/normalized-questions.example.json` — Layer 3 範例（3 筆 spelling / true-false / multiple-choice，含 16 欄位 + source / sourceType / sourceUrl / sourceName / provenance / reviewStatus）
- `scripts/web_resource_collect.mjs` — P3-10-B v0.1 collector CLI（**零依賴**，~370 行；index-only / full-text 兩個模式；hard-coded 不下載 asset / 不繞 robots / 不假裝 UA）

修改（3）：

- `.gitignore` — 加 P3-10-A 區段（4 條 generated 檔名 + 3 個 dir：`research_cache/` / `tmp_crawl/` / `.local_research/`）；`.example.json` 仍可 commit
- `README.md` — 文件索引補 4 條 P3-10 規劃文件 + 在「目前進度仍在 P3 階段」段尾補一句「目前 /quiz 仍是題型功能驗證版，尚非正式完整練習資料包；後續會透過 web resource collector / imported dataset / question normalizer 逐步補齊正式練習資料」+ 4 個文件連結
- `PROJECT_ROADMAP.md` — 在 P3-9-C 段與 P4 段之間插入完整 P3-10 段（標題 + 三層架構 / 硬邊界 / 規劃文件連結 + 子分區 P3-10-A / B / C ✅ + 後續待辦 P3-10-D~K 8 條 ⬜）

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / `components/QuizPlay.tsx` / 其他 components / `data/p3-example-questions.json`（13 題完整保留）/ `data/exam-papers.example.json`（10 questionIds + sourceMix 9+4 = 13 不變）/ `data/vocabulary.json` / `data/quizzes.json` / `public/images/`（11 個自製 SVG 全保留）/ `public/audio/`（OpenAI v2 + v1 + macOS say 三版皆保留）/ `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md`（**注意**：本輪文件中提到「擴張為 7 種 sourceType」屬規劃層，schema 變更走獨立 PR、本輪未動）/ `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `docs/USER_TEST_NOTES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `package.json`（**無新依賴**）/ `scripts/generate_openai_tts_sample.mjs` / 既有依賴 / `node_modules/`。

## 【Collector 原型說明】

`scripts/web_resource_collect.mjs` v0.1 設計重點：

### CLI 介面

```bash
# index-only：只抓 metadata
node scripts/web_resource_collect.mjs --mode index-only --url https://example.com

# full-text：抓 metadata + cleanedText + headings + links + assets + candidates
node scripts/web_resource_collect.mjs --mode full-text --url https://example.com \
  --source-type user_verified

# 完整 flag
node scripts/web_resource_collect.mjs --help
```

支援 7 個 flag：`--mode` / `--url` / `--source-type` / `--source-name` / `--out` / `--timeout` / `--help`。

### 技術選擇

- **零新依賴**：使用 Node 18+ 內建 `fetch` / `AbortController` / `node:fs/promises` / `node:path` / `node:url`。
- **HTML 解析用 regex**：簡單但脆弱；對 well-formed HTML 可用、對 SPA / JS 渲染頁面會抓不到內容（已在文件標示為已知限制）。
- **AbortController + timeout**：預設 15 秒超時。
- **UA 誠實標識**：`cambridge-starters-practice-collector/0.1`；不假裝瀏覽器。

### 候選偵測規則（5 條 v0.1）

1. `Look at the picture` + `Write the word` → 推斷 `spelling` / RW3，confidence 0.9
2. `yes/no` / `It is a X.` 句樣 → 推斷 `true-false` / RW1，confidence 0.6
3. 含 `____` 或 `_ _ _` 填空 → 推斷 `fill-blank` / RW4（也可能 RW3），confidence 0.5
4. 編號題目（`1. `, `2) ` 開頭） → 題型 null（需後續判別），confidence 0.4
5. 逗號分隔短字母 list（如 `cat, dog, bird`） → 推斷 vocabulary / RW3，confidence 0.6

未來 P3-10-D / E 可用 AI 取代 regex 偵測，提升 confidence 與多元主題支援。

### 硬邊界（已寫進 docstring）

- 不爬蟲式批次抓（一次只處理一個 URL）
- 不繞 robots.txt
- 不假裝 user agent
- 不下載 asset 到 `public/`（asset-aware 模式屬未來）
- 不送 PII / cookie / 不登入
- 不串 OpenAI / 雲端 API

### 輸出檔案

- index-only → `data/imported/resource-index.generated.json`（覆寫）
- full-text → `data/imported/source-document.generated.json`（覆寫）
- 多筆 URL 累積屬 P3-10-D 範圍、本輪不實作

## 【Import / Normalization 規劃摘要】

### 三層架構（[`docs/PRACTICE_DATA_IMPORT_PLAN.md`](../docs/PRACTICE_DATA_IMPORT_PLAN.md) C 段）

```
Layer 1：resource index            （URL / title / 來源 metadata）
   ↓
Layer 2：imported source dataset   （crawler / collector 抓回的 raw / semi-structured）
   ↓
Layer 3：formal practice data      （normalize 後 + reviewStatus + 進 quiz / review）
```

7 步流程：resource index 建立 → collector 抓取 → imported source dataset 保存 → AI normalize → 人工檢查 → 轉 formal practice data → quiz / review 使用。

### 7 種 sourceType（B 段）

`official` / `third_party` / `user_provided` / `user_verified` / `ai_generated` / `custom` / `handmade`

任何進 imported dataset 或正式 practice data 的題目都必須標 `source` + `sourceType`，每種來源的使用前置要求皆已寫成表格。

### 5 種 reviewStatus（[`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](../docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md) D 段）

```
imported_raw → ai_normalized → human_review_required → approved_for_practice
                                                       │
                                                       └→ rejected
```

**只有 `approved_for_practice` 才能進正式 quiz / review**（未來 P3-10-K 落實 `lib/data.ts` 過濾邏輯）；不允許 `rejected → approved_for_practice` 直接跳；不允許 `imported_raw → approved_for_practice` 跳過 normalize + review。

### 8 種題型對齊（normalize plan B 段）

對齊既有 `QuestionType` discriminated union：multiple-choice / picture-choice / word-choice / listening-choice / fill-blank / matching / true-false / spelling；normalizer 出 candidate 時必須 one-of。

## 【Practice data plan 摘要】

[`docs/PRACTICE_DATA_PLAN.md`](../docs/PRACTICE_DATA_PLAN.md) umbrella 摘要：

- **為什麼需要**：`/quiz` 只 13 題、距離小朋友完整練習仍差太遠；P3-10 建立可重複 / 可審計 / 可擴張的補齊路徑。
- **三份子計畫**：PRACTICE_DATA_IMPORT_PLAN（import 流程）+ WEB_RESOURCE_COLLECTOR_PLAN（crawler 規格 + 已實作的最小 CLI 原型）+ QUESTION_IMPORT_NORMALIZATION_PLAN（normalize 流程）。
- **合法來源 6 種**：crawler / collector 匯入、user_verified、official、third_party、ai_generated、custom / handmade；皆需 normalize + source 標示 + reviewStatus + approved_for_practice 才能進正式 quiz。
- **最小可玩資料包目標**：Vocabulary 30 字 / SVG 20 張、Quiz demo paper = L3 ≥ 3 / RW1 ≥ 4 / RW3 ≥ 8 / RW4 ≥ 3 / Matching ≥ 2；目前距 L3 缺 2、RW1 缺 2、RW3 缺 4，RW4 / matching 達標。
- **後續刀數**：P3-10-D（collector 實測 + asset-aware） / -E（AI normalizer） / -F（人工審核流程） / -G（vocab 圖補齊） / -H（RW3 擴充） / -I（RW1 擴充） / -J（L3 多題） / -K（first practice paper 組裝）。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues；初次跑警告 unused eslint-disable 已修正）
- `npx tsc --noEmit`（typecheck）：✅ 全綠（純文件 + 純 .mjs script + JSON example、零 TypeScript 型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變；無新依賴）
- gitignore 驗證：✅ `git check-ignore` 確認 `*.generated.json` 三個檔名被精確排除；`*.example.json` 三個檔名仍可 commit。

## 【Collector 測試結果】

兩種模式皆已在 https://example.com（IANA 提供的公共範例網域）實測通過：

### index-only 模式

```
$ node scripts/web_resource_collect.mjs --mode index-only --url https://example.com
[collector] mode=index-only url=https://example.com sourceType=unknown
[collector] fetched status=200 contentType=text/html
[collector] index-only summary: title="Example Domain" resourceType=unknown linksCount=1
[collector] wrote .../data/imported/resource-index.generated.json
exit=0
```

輸出 `resource-index.generated.json` 含完整 16 欄位（id / url / title / sourceDomain / sourceType / sourceName / resourceType / description / h1 / linksCount / httpStatus / contentType / retrievedAt / collectorVersion / notes）。`title` 抓到 "Example Domain"；`linksCount` = 1（與該頁面實際只有 1 個外連結對應）。

### full-text 模式

```
$ node scripts/web_resource_collect.mjs --mode full-text --url https://example.com \
    --source-type user_verified
[collector] mode=full-text url=https://example.com sourceType=user_verified
[collector] fetched status=200 contentType=text/html
[collector] full-text summary: title="Example Domain" headings=1 links=1 assets=0 candidates=0 cleanedTextLength=142
[collector] wrote .../data/imported/source-document.generated.json
exit=0
```

輸出 `source-document.generated.json` 含完整欄位（id / resourceId / sourceUrl / sourceName / sourceType / importedAt / contentType / title / description / headings / cleanedText / cleanedTextLength / links / assets / extractedCandidates / provenance / reviewStatus）。`cleanedText` 142 字、`headings` 1 個（h1 "Example Domain"）、`links` 1 個（iana.org/domains/example）、`extractedCandidates` 0 個（example.com 是純說明頁、無題目 / 詞彙樣式 → candidate 偵測正確返回空）。

**網路環境**：本機 dev sandbox 對 example.com 可達；若使用者在其他環境跑遇 fetch 失敗、collector 會走 exit 1 並印錯誤、不會硬編假結果。

## 【仍未處理】

依任務單範圍，本輪只做 P3-10-A / B / C 三個子分區的規劃 + 最小原型；以下是 P3-10 後續刀數（已寫進 ROADMAP）：

- ⬜ P3-10-D：collector 實測與第一批來源匯入（含 asset-aware 模式 + 多 URL 批次）
- ⬜ P3-10-E：AI normalizer 原型（需 OpenAI API + 出 `normalized-questions.generated.json`）
- ⬜ P3-10-F：匯入題目人工審核流程（含 review dashboard 草稿、批次 approve / reject）
- ⬜ P3-10-G：Vocabulary 圖片 / SVG 補齊第一批（往 20+ 張推進）
- ⬜ P3-10-H：RW3 spelling 題庫擴充到最小可玩數量（≥ 8 題）
- ⬜ P3-10-I：RW1 yes/no 題庫擴充（≥ 4 題）
- ⬜ P3-10-J：L3 listening 多題補齊（≥ 3 題配新 OpenAI v2 音檔）
- ⬜ P3-10-K：first practice paper 組裝與驗收（`approved_for_practice` 篩選邏輯落地）

其他既有 ⬜ 條目皆未動：RW3 字母重組互動進階 / RW3 review 區獨立練習 / 看答案 / 再試一次 / 嚴格 spelling 開關 / 結果頁 No ✗ 視覺改善（USER_TEST_NOTES 跨期觀察）。

## 【風險點】

- **schema 變更未實際落實風險：中**——規劃文件中提到「7 種 sourceType」/「5 種 reviewStatus」屬規劃層，但 `lib/types.ts` 既有 `QuestionSource` 仍是 4 種字面量（`official_sample` / `past_paper` / `ai_generated` / `custom`）。建議下一輪走獨立 schema 升級 PR：把 `QuestionSource` 改為 7 種對齊文件，並加 `ReviewStatus` 字面量；本輪故意不動 schema 避免一次刀面過大、Codex 較難驗收。
- **collector 抓取行為法務 / robots 風險：低**——文件已寫明「不繞 robots.txt」「使用者自行決定是否跑」；UA 誠實標識；不下載 asset；目前實測只用 example.com 公共範例網域；硬邊界已寫進 docstring。
- **HTML 解析脆弱性：中**——regex-based 解析對 SPA / JS 渲染頁面會抓不到內容；對 well-formed HTML 可用。建議 P3-10-D 加 fallback 機制（例如失敗時 warn 而非 silent return empty）。
- **gitignore 範圍精確性風險：低**——已用 `git check-ignore` 驗證 `*.generated.json` 排除、`*.example.json` 仍 commit；範本 example 是「文件範本」性質、適合 commit。
- **無依賴策略的可擴張性：中**——Node 內建 fetch + regex 對「最小原型」夠用；若未來 P3-10-D 要做 PDF parser / SPA 渲染，仍需引入依賴（pdfjs-dist / cheerio / playwright），屬獨立決策刀面。
- **未動 `data/p3-example-questions.json` 是刻意的**：本輪 example JSON 都放在 `data/imported/` 獨立目錄；既有 13 題不受影響。

## 【後續建議】

依任務單已開好 P3-10-D ~ K 8 條 ⬜，建議優先順序：

1. **P3-10-G + H + I + J 「資料量擴充先行」**（最低風險高 leverage）：用既有 `custom` / `handmade` sourceType 補 RW3 / RW1 / L3 題目，先把「最小可玩資料包」湊齊；不依賴 crawler / normalizer。
2. **P3-10-D collector 實測 + asset-aware**（中等規模，需評估 robots / 法務）：先針對自己挑選的 3~5 個 user_verified URL 跑 full-text；觀察 candidate 偵測準確度；之後決定是否做 asset-aware 下載。
3. **P3-10-E AI normalizer 原型**（需 OpenAI API）：把 collector 抓回的 source-document 跑 AI normalizer 產草稿題；建議與 P3-10-D 同期動工以驗證整條 pipeline。
4. **P3-10-K first practice paper 組裝**（需 schema 升級）：把 `lib/types.ts` `QuestionSource` 從 4 種升 7 種 + 加 `ReviewStatus` 字面量；`lib/data.ts` 加 `approved_for_practice` 過濾；建議 schema 升級走獨立 PR。
5. **建議 GPT 接力**：本輪規劃文件可作為 GPT 設計 P3-10-D ~ K 任務單的基礎；每個子分區建議獨立任務單、不要一次塞太多刀面。

**短期建議**：先讓 Codex 驗收本輪規劃 + collector 最小原型（驗 example JSON schema 合理、CLI 端到端可跑、文件邏輯一致、gitignore 精確）；確認通過後再決定下一刀。

## 【Roadmap 同步檢查】

- ✅ P3-10-A：正式資料匯入流程與來源欄位規劃（2026-05-13）—— 本輪完成
- ✅ P3-10-B：Web resource collector 規劃與最小 CLI 原型（2026-05-13）—— 本輪完成
- ✅ P3-10-C：Question import normalization 規劃（2026-05-13）—— 本輪完成
- ⬜ P3-10-D：collector 實測與第一批來源匯入
- ⬜ P3-10-E：AI normalizer 原型
- ⬜ P3-10-F：匯入題目人工審核流程
- ⬜ P3-10-G：Vocabulary 圖片 / SVG 補齊第一批
- ⬜ P3-10-H：RW3 spelling 題庫擴充到最小可玩數量
- ⬜ P3-10-I：RW1 yes/no 題庫擴充
- ⬜ P3-10-J：L3 listening 多題補齊
- ⬜ P3-10-K：first practice paper 組裝與驗收
- ✅ RW3 字母重組版第一版（前輪 2026-05-13 完成）
- ✅ RW3 缺字提示版第一版（2026-05-12 完成）
- ✅ RW3 多題拼字題庫第一版（2026-05-10 完成）
- ✅ RW3 看圖拼字輸入第一版
- ⬜ RW3 字母重組互動進階 / review 區獨立練習 / 看答案 / 再試一次按鈕 / 嚴格 spelling 開關
- ⬜ USER_TEST_NOTES 跨期觀察與提示策略調整（2026-05-13 開啟）
- ✅ L3 q-lc-001 已調整為 3 選項 A/B/C
- ✅ L3 q-lc-001 三張圖卡完整顯示
- ⬜ 未來多題 L3 圖片題庫
- 🟡 P2-4C-2B-1 整體：「已完成 + 持續補件中」（11 個 SVG）
- 🟡 P2-4C-2B-2 整體：仍部分進行中（vocabulary 音檔仍 ⬜；listening 音檔已落地）
- 🟡 P3-9-C 整體：仍 🟡（仍 26 條 ✅）
- 🟡 **P3-10 整體：本輪新增、3 條 ✅（A / B / C）+ 8 條 ⬜（D~K）**
- 🟡 P3 整體：仍部分進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪目標是建立正式資料匯入 pipeline 與最小 collector 原型；collector 輸出先進 `data/imported/`，後續再透過 normalizer 與 reviewStatus 進正式 practice data。未新增大量正式題目、未動既有 13 題、未新增依賴、未呼叫 OpenAI——所有硬邊界遵守。
