# 正式練習資料補齊規劃（P3-10 umbrella）

> 對應 P3-10「正式練習資料補齊與 web resource collector」。本檔是 P3-10 系列的**總覽**，把 import / collector / normalize 三份規劃文件串起來，並定義「最小可玩正式練習資料包」的目標。
>
> 本檔屬**規劃文件**；實際 schema 與 UI 行為仍以 [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) 與 `lib/types.ts` 為準。

最新整理：2026-05-13。

---

## A. 為什麼需要這份規劃

目前狀態（截至 2026-05-13）：

- `/quiz` 已支援 8 種題型（multiple-choice / picture-choice / word-choice / listening-choice / fill-blank / matching / true-false / spelling）。
- 範例考卷只有 13 題（1 listening + 12 R&W），距離小朋友完整練習仍差太遠。
- Listening 自製 TTS 僅 q-lc-001 一題（OpenAI v2 examiner voice）。
- 自製 SVG 11 張，距離 54 個 vocabulary 完整覆蓋仍差 43 張。
- **目前 `/quiz` 仍是題型功能驗證版，尚非正式完整練習資料包**。

P3-10 的目標是建立一條**可重複、可審計、可擴張**的正式練習資料補齊路徑，後續才能逐步把題庫從 13 題擴張到「最小可玩資料包」乃至更完整。

---

## B. 三份子規劃文件

正式練習資料補齊涉及三個獨立但串聯的環節：

| 子計畫 | 文件 | 範圍 |
| --- | --- | --- |
| **資料匯入流程與來源欄位** | [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md)（P3-10-A） | 7 種 sourceType / 三層架構 / 正式資料欄位要求 / 最小可玩資料包目標 |
| **Web resource collector / crawler** | [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md)（P3-10-B） | crawler 規格 / 三種模式（index-only / full-text / asset-aware） / `scripts/web_resource_collect.mjs` 最小原型 |
| **匯入題目 normalize 流程** | [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md)（P3-10-C） | 對齊 8 種題型 / reviewStatus 5 狀態機 / id 規則 / 必填 vs 選填 |
| **Discovery crawler（自動找來源）** | [`docs/DISCOVERY_CRAWLER_PLAN.md`](./DISCOVERY_CRAWLER_PLAN.md)（P3-10-D-2） | search query → search provider → URL normalize / dedupe / classify → resource index → collector queue；`scripts/discover_resources.mjs` 最小原型 |

依序閱讀順序：先讀 import plan（了解目標與三層架構） → 讀 collector plan（了解 Layer 2 input） → 讀 normalize plan（了解 Layer 3 接口） → 讀 discovery plan（了解上游自動發現機制如何餵給 collector）。

---

## C. 正式練習資料的合法來源

對齊 [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) B 段，正式練習資料補齊可以來自：

1. **crawler / collector 匯入**——透過 `scripts/web_resource_collect.mjs` 抓取網頁素材 → imported source dataset → normalize → 正式 paper
2. **user_verified sources**——使用者驗證可用的網路來源（已自行承擔使用責任）
3. **official resources**——Cambridge 官方公開資源（僅人工瀏覽參考、**不複製題目 / 圖片 / 音檔**；硬邊界與 [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) 一致）
4. **third_party resources**——第三方教學網站 / 出版社（需確認授權；圖片 / 音檔不直接使用、改自製）
5. **ai_generated**——AI 出題（含 OpenAI normalizer / 人工 prompt 產出；必須走 human review）
6. **custom / handmade**——維護者 / 教師 / 家長手寫題（內部來源；reviewStatus 升級較快）

**但進入正式 practice data 前，每種來源都需要**：

- **normalize**：對齊 `ExamQuestion` discriminated union 與 8 種題型 schema
- **source 標示**：每題保留 `source` / `sourceUrl` / `sourceName` / `sourceType` / `provenance`
- **reviewStatus**：走 `imported_raw` → `ai_normalized` → `human_review_required` → `approved_for_practice` 流程
- **最後 approved_for_practice**：只有此狀態的題目才能進正式 quiz / review

這條規則對所有來源類型（包含 `custom` / `handmade`）一致，沒有例外。

---

## D. 最小可玩正式練習資料包目標

對應 [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) E 段：

### Vocabulary review

- 至少 **30 個常用單字**可在 `/review/words` / `/review/letter/*` / `/review/picture` 練習
- 對應 SVG 至少 20 張（目前 11 張）
- 對應發音音檔（屬 P2-4C-2B-2 範圍）

### Quiz demo paper

- Listening 至少 3 題
- RW1 yes/no 至少 4 題
- RW3 spelling 至少 8 題
- RW4 fill-blank 至少 3 題
- Matching 至少 2 題

**目前距離**：L3 缺 2 題、RW1 缺 2 題、RW3 缺 4 題；RW4 / matching 已達標。

---

## E. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) | P3-10 階段條目 |
| [`docs/PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | 「目前明確不做」清單 + 第一階段不下載官方素材邊界 |
| [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) | 既有 `QuestionSource` 字面量 + 8 種題型 schema |
| [`docs/STARTERS_PART_TEMPLATES.md`](./STARTERS_PART_TEMPLATES.md) | 各 Part 練習版描述與必填欄位 |
| [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) | 官方資源人工瀏覽邊界 |
| [`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md) | AI 仿真題 prompt 規範（normalizer 可重用） |
| [`docs/TTS_AUDIO_WORKFLOW.md`](./TTS_AUDIO_WORKFLOW.md) | 自製 TTS 流程（補多題 Listening 需要） |
| [`docs/USER_TEST_NOTES.md`](./USER_TEST_NOTES.md) | 實機觀察影響「最小可玩資料包」規模決策 |

---

## F. 後續刀數對應

依 PROJECT_ROADMAP P3-10 段：

- ✅ P3-10-A：正式資料匯入流程與來源欄位規劃（本檔 + PRACTICE_DATA_IMPORT_PLAN.md）
- ✅ P3-10-B：Web resource collector 規劃與最小 CLI 原型（WEB_RESOURCE_COLLECTOR_PLAN.md + scripts/web_resource_collect.mjs）
- ✅ P3-10-C：Question import normalization 規劃（QUESTION_IMPORT_NORMALIZATION_PLAN.md）
- 🟡 P3-10-D：collector 實測與第一批來源匯入——**部分完成**（2026-05-13）：collector 對 yle.tw / certificate.tw 兩個真實 URL 完成 index-only + full-text 測試；補強 non-2xx / non-HTML / fetch failure / timeout 行為（warnings 欄位 + non-HTML 跳過解析）；補 mode / retrievedAt 欄位；docs/WEB_RESOURCE_COLLECTOR_PLAN.md 新增 G / H / I 三段 + 升 v1.1。**未做**：多 URL 批次模式 / asset-aware 下載 / 第一批 source-document 正式 import（待後續刀數）
  - 🟡 P3-10-D-2：Discovery crawler（自動找資料來源）——**部分完成**（2026-05-13）：新增 [`docs/DISCOVERY_CRAWLER_PLAN.md`](./DISCOVERY_CRAWLER_PLAN.md)（query 4 類 17 條 / search provider 5 種，先支援 manual-json + mock / URL 分類 4 軸：sourceType / resourceType / level / detectedExamParts / scoring 規則 / 與 collector 銜接策略） + `scripts/discover_resources.mjs` v0.1 最小 CLI 原型（無新依賴）+ 3 份 example JSON（`discovery-queries.example.json` 17 筆 / `search-results.example.json` 10 queries 13 results / `discovered-resources.example.json` 6 筆涵蓋 official / third_party / shopping 降權 / Movers 降權 / 中文來源）。**未做**：外部 search API（Bing / Google CSE / SerpAPI）/ 自動 pipe 給 collector（待 P3-10-D-3）/ AI 分類 / dashboard
    - 🟡 P3-10-D-2B：Discovery crawler 接真實 Search Provider 第一版——**部分完成（happy path verified）**（2026-05-13）：CLI 升 v0.2、provider adapter 化（拆出 `runManualJsonProvider` / `runMockProvider` / `runBraveSearchProvider`）；新增 **Brave Search API** 真實 provider（端到端 query → Brave Search → search-results.generated.json → discovered-resources.generated.json）；新增 `--query-file` / `--limit-per-query` / `--query-limit` / `--search-out` 4 個 flag；新增 rate-limit / safety（每 query 500ms delay / 預設 query-limit 20 / 單 query 失敗不中斷整批）；`.env.example` 加 `BRAVE_SEARCH_API_KEY` placeholder；`.gitignore` 加 `data/imported/search-results.generated.json`；`docs/DISCOVERY_CRAWLER_PLAN.md` 補 D-1 5 provider 比較表 + D-2 硬邊界更新 + I 段 CLI flag 更新 + L 後續擴充 + N 段 Brave Search happy path 實測紀錄 + M v2.1 升級紀錄；缺 API key 時 CLI 優雅 exit 2 並印申請步驟。**Brave Search happy path 已由使用者本機小量實測成功**（`--query-limit 1 --limit-per-query 1`，回傳 1 筆 PDF candidate：`lebusanglais.com` Pre A1 Starters sample paper，score=8、shouldCollect=true、reviewStatus=discovered_candidate），詳見 [`docs/DISCOVERY_CRAWLER_PLAN.md`](./DISCOVERY_CRAWLER_PLAN.md) N 段；happy path 驗證**仍不代表正式題庫匯入完成**——後續仍需 P3-10-D-3（pipe collector）/ E（AI normalize）/ F（人工審核）/ K（寫入正式題庫）才會進 `/quiz`。**未做**：Tavily / Bing / Google CSE / SerpAPI 落地；discovery → collector pipe（屬 P3-10-D-3）；AI scoring；`.env.local` 自動載入
  - 🟡 P3-10-D-3：Discovery → Collector 自動 pipe——**部分完成**（2026-05-13）：新增 `scripts/collect_discovered_resources.mjs` v0.1 pipe CLI（讀 `discovered-resources.generated.json` 內 `shouldCollect=true` 條目、依 `collectorMode` 分流至 collector helper、產出 batch 結構 `source-documents.batch.generated.json`）；支援 `--input` / `--out` / `--limit`（預設 5、防呆）/ `--only-should-collect`（預設 yes）/ `--dry-run`（預設 no）/ `--help`；對 HTML 重用 collector 既有 `buildSourceDocumentEntry`（full-text）/ `buildResourceIndexEntry`（index-only）；對 pdf / image / audio / video **不下載 body**、只用 HEAD 抓 metadata + 加 `asset_collection_not_implemented`（pdf 多 `pdf_parser_not_implemented`）warnings；單筆失敗記 error 並繼續下一筆、整批不中斷；每 fetch 之間 500ms delay；`scripts/web_resource_collect.mjs` 微調：把 `main()` 包進「是否為直接 CLI 呼叫」判斷 + 加 `export` helper（CLI 行為完全不變）；`.gitignore` 加 `data/imported/source-documents.batch.generated.json`；CLI 跑 3 種測試全綠：(1) dry-run（happy path 1 筆 PDF → status=dry_run）/ (2) real 小量 limit=1（PDF HEAD only：HTTP 200 / contentType `application/pdf` / contentLength 6914257 bytes，**body 未下載**）/ (3) skip 邏輯（shouldCollect=false / missing url / limit 截斷皆正確分類）+ HTML branch 用 yle.tw fixture 驗證（status=collected / kind=source_document / headings=4 / links=50 / 重用 collector 規則）。**仍不代表正式題庫匯入完成**——後續需 P3-10-E（AI normalize）/ F（人工審核）/ K（approved_for_practice + 進正式題庫）。**未做**：asset 下載到 tmp_crawl/ / PDF parser / multi-batch history / AI normalizer
- ⬜ P3-10-E：AI normalizer 原型（需 OpenAI API）
- ⬜ P3-10-F：匯入題目人工審核流程
- ⬜ P3-10-G：Vocabulary 圖片 / SVG 補齊第一批
- ⬜ P3-10-H：RW3 spelling 題庫擴充到最小可玩數量
- ⬜ P3-10-I：RW1 yes/no 題庫擴充
- ⬜ P3-10-J：L3 listening 多題補齊
- ⬜ P3-10-K：first practice paper 組裝與驗收

---

## G. 版本

- **v1**（2026-05-13）：第一版——P3-10 umbrella 規劃；引用三份子文件（import / collector / normalize）；定義最小可玩資料包目標；列出後續刀數對應。
