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
- 目前 13 題大多是 `ai_generated` / `custom` 自製題（9 + 4）；**屬「題型驗證 dev / example seed」、不視為正式匯入版完成依據**。

P3-10 的目標是建立一條**可重複、可審計、可擴張**的正式練習資料補齊路徑，後續才能逐步把題庫從 13 題擴張到「最小可玩資料包」乃至更完整。

> **方向修正（P3-10-L，2026-05-14）**：正式匯入版**只接受可追溯來源**——以 **官方 sample paper / 官方學習資料 / 歷屆考題 / 可追溯來源的 Starters 練習資料**為主。**`ai_generated` 不得用來補正式題庫數量**；`custom` 只作輔助。詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)。

---

## B. 三份子規劃文件

正式練習資料補齊涉及三個獨立但串聯的環節：

| 子計畫 | 文件 | 範圍 |
| --- | --- | --- |
| **資料匯入流程與來源欄位** | [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md)（P3-10-A） | 7 種 sourceType / 三層架構 / 正式資料欄位要求 / 最小可玩資料包目標 |
| **Web resource collector / crawler** | [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md)（P3-10-B） | crawler 規格 / 三種模式（index-only / full-text / asset-aware） / `scripts/web_resource_collect.mjs` 最小原型 |
| **匯入題目 normalize 流程** | [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md)（P3-10-C） | 對齊 8 種題型 / reviewStatus 5 狀態機 / id 規則 / 必填 vs 選填 |
| **Discovery crawler（自動找來源）** | [`docs/DISCOVERY_CRAWLER_PLAN.md`](./DISCOVERY_CRAWLER_PLAN.md)（P3-10-D-2） | search query → search provider → URL normalize / dedupe / classify → resource index → collector queue；`scripts/discover_resources.mjs` 最小原型 |
| **正式來源優先匯入規則 + Source Registry** | [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)（P3-10-L / P3-10-M / P3-10-N / P3-10-O） | source-first 原則 / 7 種 sourceKind / source registry 欄位 / 匯入規則硬邊界 / 正式流程定位 / E-bis 段：discovery → source registry generated workflow / E-bis-5 段：collector / normalizer / single-URL gate / E-bis-6 段：build CLI `--merge-with` 保留 reviewer 編輯 |
| **Reviewer 端到端操作手冊** | [`docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`](./SOURCE_FIRST_PIPELINE_RUNBOOK.md)（P3-10-P） | 11 步可照跑命令 / reviewer 審核 7 項標準 / before-after 編輯範例 / 不可 commit 清單 / 10 條 troubleshooting / ASCII + Mermaid 流程圖 |

依序閱讀順序：先讀 source-registry plan（**了解來源優先規則與下游 gate**）→ 讀 import plan（了解目標與三層架構） → 讀 collector plan（了解 Layer 2 input） → 讀 normalize plan（了解 Layer 3 接口） → 讀 discovery plan（了解上游自動發現機制如何餵給 collector）。

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

**source-first 原則（P3-10-L，2026-05-14）**：

- 正式匯入版的主線是 `official_sample` / `official_learning_material` / `past_paper`。
- **`ai_generated` 不得用來補正式題庫數量**——僅允許作為草稿 / 臨時練習 / 題型驗證 seed。
- **`custom` 只作輔助 / fallback**，不應混入 official / past_paper 報告中。
- `third_party_practice` **不可** 直接標成 `official_sample` 或 `past_paper`。
- 來源不明的資料**不得**進 normalizer → 必須先進 source registry（[`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)）→ 人工審核 → 標 `approved_for_import`。

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

> **方向修正（P3-10-L，2026-05-14）**：上述「最小可玩」題量目標仍有效，但**補題方法**改為 **source-first**——不再用 AI 補題。**未達標的 part（L3 / RW1 / RW3）應透過 source registry approved sources 產生新題**；既有 ai_generated 題仍可保留為 dev / example seed，但**不計入正式匯入版完成度**。

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
| [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) | source-first 原則 / source registry 結構 / 下游 normalizer gate（P3-10-L） |
| [`docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`](./SOURCE_FIRST_PIPELINE_RUNBOOK.md) | Reviewer 端到端操作手冊（P3-10-P）：reviewer 對照本檔規範跑實際流程的單一入口 |

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
- 🟡 P3-10-E：AI normalizer 原型（rule-based / mock-ai 第一版）——**部分完成**（2026-05-13）：新增 `scripts/normalize_collected_sources.mjs` v0.1，讀 P3-10-D-3 pipe output `source-documents.batch.generated.json`、對 `status=collected` + `document.kind=source_document` 條目跑 rule-based draft；無 candidates 出 observation 而**不硬造題**；asset_metadata / resource_index 直接 skip 並保留原因；所有 draft 一律 `reviewStatus=needs_human_review` + `isReadyForPractice=false`；mode=rule-based / mock-ai 兩種、openai 模式 exit 2（屬未來範圍）。**未做**：openai mode（需 OPENAI_API_KEY / prompt / 成本管控）/ 自動 approve / 寫入正式題庫 / answer / options 推斷（本輪保守不猜，留給 reviewer 手補）
- 🟡 P3-10-F：匯入題目人工審核流程（CLI + JSON workflow 第一版）——**部分完成**（2026-05-13）：新增 `scripts/review_normalized_questions.mjs` v0.1（prepare-review / validate-reviewed 兩 mode）；prepare-review 從 P3-10-E normalizer 篩 `status=draft + reviewStatus=needs_human_review + isReadyForPractice=false + draft!=null` 條目 → 預填 reviewerFields template（`approved=false` / `approvedForPractice=false` / finalQuestion 留空 answer/options）→ 寫 `data/imported/reviewed-questions.generated.json`；validate-reviewed 對 reviewer 編輯後條目跑 schema + 題型驗證（true-false yes/no / CHOICE_TYPES options>=2 + answer 對應 options） → 印 console summary + 寫 `data/imported/review-validation.generated.json`；兩檔皆 gitignore；**仍不寫正式題庫**（`data/p3-example-questions.json` / `data/exam-papers.example.json` 完全未動）；正式寫入屬 P3-10-K。**未做**：approved → 正式題庫的轉換 CLI（P3-10-K） / Review UI dashboard / 多 reviewer 簽核 / openai mode
    - 🟡 P3-10-F 後續：reviewed output 覆寫保護 / merge-with——**部分完成**（2026-05-13）：CLI 升 v0.2；`--out` 已存在但未指定 `--overwrite` / `--merge-with` 時 **exit 2**（避免無聲覆寫 reviewer 編輯）；新增 `--overwrite yes|no`（預設 no）與 `--merge-with <existing>`（依 mergeKey 合併並保留 reviewerFields / reviewStatus；orphaned 條目保留標 `status: orphaned_existing_review`）；mergeKey 規則：優先 `sourceItemId + candidate_index`、fallback `sourceItemId + prompt + questionType + starterPart`；source provenance 以最新 input 為準；新增 summary 欄位 `merged` / `orphaned` / `overwritten` + top-level `batchWarnings[]` 收錄 `output_exists_requires_overwrite_or_merge` / `overwrite_enabled` / `merged_from_existing_review` / `orphaned_existing_review` 4 個 code；`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` 升 v3.1（F-pre-7 新增 5 個子段）；`docs/PRACTICE_DATA_IMPORT_PLAN.md` C-5 步補覆寫保護說明。CLI 5 種 regression 全綠：(1) out 不存在 → 正常建立 / (2) out 已存在 + 無 flag → exit 2 / (3) `--overwrite yes` → 覆寫 + batchWarnings 含 overwrite_enabled / (4) `--merge-with` fixture（fx-001 approved 保留 / fx-002 WIP 保留 / fx-003-new 新建 / fx-old orphaned）→ merged=2 / orphaned=1 / (5) validate-reviewed merge 結果 → passedValidation=1 / skippedNotApproved=3 全部正確
- ⬜ P3-10-G：Vocabulary 圖片 / SVG 補齊第一批
- ⬜ P3-10-H：RW3 spelling **source-first** 題庫擴充（**不是 AI 補題**——必須透過 source registry approved sources 產生）
- ⬜ P3-10-I：RW1 yes/no **source-first** 題庫擴充（**不是 AI 補題**）
- ⬜ P3-10-J：L3 listening **source-first** 多題補齊（**不是 AI 補題**）
- 🟡 P3-10-K 第二刀：first practice paper 組裝 / paper-level metadata——**部分完成**（2026-05-14）：新增 `scripts/assemble_practice_paper.mjs` v0.1（preview / write 兩 mode + `--write yes` 雙開關）；讀 `data/p3-example-questions.json` 全部 ExamQuestion → 依 `starterSection` 分組成 listening / reading-writing / speaking（沒題目的 section 不出現），統計 `sourceMix`（QuestionSource union 4 種），對 9 個 Cambridge Starters Parts（L1-L4 / RW1-RW5）檢查覆蓋率（缺少標 `insufficient_questions_for_part`），組成完整 `ExamPaper`（含 examPaperId / title / description / sections / sourceMix / createdAt / updatedAt 對齊 lib/types.ts）；duplicate paper id 偵測（preview 標 `duplicate_paper_id` / write 整批 exit 2）；empty questions 仍寫 preview + warning `no_questions_available`；**不挑題、不重排、不硬造題、不切換 `/quiz` 載入來源**（lib/data.ts 完全未動）。`.gitignore` 加 `data/imported/practice-paper.preview.generated.json`；`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` 升 v4.2（F-pre-8-g 7 子段）；`docs/PRACTICE_DATA_IMPORT_PLAN.md` C 段加第 7 步 + 原 7 步降為 8。**未做**：section 內題目排序 / Speaking section / lib/data.ts 載入邏輯整合（屬 P3-10-K 第三刀）/ Cambridge Starters 官方題量對齊（Listening 20Q / R&W 25Q）
- 🟡 P3-10-R：Runbook extended offline smoke for review / approve / assemble preview——**部分完成**（2026-05-17）：`scripts/runbook_smoke_check.mjs` v0.1 → **v0.2**：擴充 4 個新檢查（[9] review prepare-review fixture / [10] validate-reviewed fixture / [11] approve reviewed preview fixture / [12] assemble paper preview fixture）+ 3 個新 safety check（forbidden generated paths 存在狀態 / approve preview target hash / assemble preview papers hash）+ 強化 cleanup（包進 `try/finally`；未預期 exception 也會清 workdir；workdir 未建立則跳過、不 crash）。所有 approve / assemble 一律 **preview only**，不 `--mode write`、不 `--write yes`、`--target` / `--papers` 都用 `/tmp` 的 `[]` array、跑完前後 hash stable。`runbook:check` 連跑兩次皆 PASS、exit 0、cleanup 後無 `/tmp/cambridge-starters-runbook-smoke-*` 殘留。同時修 P3-10-Q Codex Low：runbook 章節順序由「9 / 11 / 10」修正為「9 / 10 / 11」（smoke 在版本紀錄之前）；smoke 段子段全部改回 10-X 編號；升 runbook v1.2。
- 🟡 P3-10-Q：Runbook offline smoke script / `runbook:check`——**部分完成**（2026-05-16）：新增 `scripts/runbook_smoke_check.mjs` v0.1（完全離線、不對外抓取、不改正式題庫）+ `package.json` 新增 `runbook:check` npm script（無新依賴）。Smoke 包含 8 個檢查（9 個 CLI `--help` × 1 / build registry / validate / merge / validate merged / collect dry-run on example / approved gate fixture in /tmp / normalize gate fixture in /tmp）+ 3 個 safety check（formal data SHA256 stable / smoke output 全在 `os.tmpdir()`）。執行 `npm run runbook:check` 兩次（含 cleanup 驗證）皆 PASS、exit 0；formal data 整輪未動。同時修 P3-10-P Codex Low：`docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md` 第 1 段流程總覽明確把 `validate source registry` 列為步驟 4（原本暗含於步驟 5）；新增離線 smoke check 段共 6 子段（用法 / 8 項檢查 / 安全保證 / 不代表的事 / 何時跑 / 失敗排查）；升 runbook v1.1。
- 🟡 P3-10-P：Source-first pipeline reviewer runbook——**部分完成**（2026-05-15）：新增 [`docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`](./SOURCE_FIRST_PIPELINE_RUNBOOK.md) v1，把 P3-10-L / M / N / O 已落地工具整理成 reviewer 可照跑的端到端操作手冊。9 個 CLI 命令逐一對齊各自 `--help` 實際輸出（discover_resources v0.2 / build_source_registry v0.2 / validate_source_registry v0.1.1 / collect_discovered_resources v0.2 / web_resource_collect v0.1 / normalize_collected_sources v0.2 / review_normalized_questions v0.2 / approve_reviewed_questions v0.1.1 / assemble_practice_paper v0.1），無新增不存在命令、無更動 script 行為。10 個段落（流程總覽 / 11 步命令 / reviewer 審核 7 項標準 / before-after 編輯範例 / 5 段不可 commit 清單 + 安全 checklist / 10 條 troubleshooting / 本階段不要做 / ASCII + Mermaid 流程圖 / 文件索引）。雙層審核（來源層 approved_for_import + 題目層 approved_for_practice）+ 雙開關保護（`--mode write` + `--write yes`）處處標示。**未修改任何 script、任何 schema、任何正式題庫 / 正式 paper、未動 UI**；純文件交付。
- 🟡 P3-10-O：Source Registry merge / preserve tool——**部分完成**（2026-05-15）：`scripts/build_source_registry.mjs` v0.1 → **v0.2**：新增 `--merge-with <existing-source-registry.json>` flag。Merge key 主要為 `normalizeSourceUrlForGate(sourceUrl)`、fallback 為 `title|sourceUrl`。命中既有條目時保留 14 個 reviewer 編輯欄位（sourceId / sourceKind / publisher / publisherType / language / level / exam / partsCovered / accessType / collectionStatus / reviewStatus / provenanceNotes / rightsNotes / collectedAt / lastCheckedAt）+ title / fileType 條件式 preserve；sourceUrl 一律保留 existing。Orphan entries（既有但不在新 discovery 中）保留附加在 output 尾、不降級 reviewStatus。新 entries（無 match）的 sourceId 從 `src-gen-001` 起算且自動避開既有 ids。`--merge-with` 防護：檔案不存在 / 非 JSON / 非 array / 條目缺 sourceId / sourceUrl / duplicate sourceId → exit 2 + 不寫 output。Console summary 補 `merged` / `newEntries` / `orphaned` / `approvedPreserved` / `existingTotal` counters。/tmp fixture 全綠：a 保留 approved_for_import + rightsNotes / b 保留 needs_manual_check / c 新 pending_review / orphan 保留 approved_for_import + rightsNotes / output 通過 validator / duplicate exit 2 / non-array exit 2 / missing fields exit 2 / non-existent path exit 2 / deterministic 重跑 byte-identical / idempotent（merge → output → merge again byte-identical）/ sourceId 衝突避讓正確（existing 占 `src-gen-001` 時新 entries 從 `src-gen-002` 起）。
- 🟡 P3-10-N：Collector / Normalizer approved_for_import gate——**部分完成**（2026-05-15）：新增共用 helper `scripts/source_registry_gate.mjs`（4 個函式：`normalizeSourceUrlForGate` / `loadSourceRegistry` / `buildApprovedUrlSet` / `classifyUrlAgainstRegistry`），三個下游 CLI 新增 optional `--source-registry <path>` flag：`scripts/collect_discovered_resources.mjs` v0.2（pipe 版，gate 在 eligible 前）、`scripts/normalize_collected_sources.mjs` v0.2（gate 套用於 source_document.url，未命中 approved 不產 draft / observation）、`scripts/web_resource_collect.mjs` v0.1（單 URL 版，gate 拒絕時 exit 0 不 fetch / 不寫檔）；URL normalization v0.1：lowercase host / strip trailing slash（pathname=/ 除外）/ 保留 search / 移除 fragment；**絕對不做** domain-level 放行；3 種 reason code：`skipped_not_in_source_registry` / `skipped_source_not_approved_for_import` / `skipped_invalid_url_for_gate`；summary 加 `sourceRegistry` 區塊。5 種 fixture 端到端測試全綠（A 1 approved + 2 not approved + 1 not-in-registry / B 0 approved / C no --source-registry 既有行為 / D invalid registry exit 2 / E URL normalization 案例含尾斜線、大寫 host、含 fragment）；docs 同步 4 份。**未做**：approved_for_practice 整合 / multi-round merge / 更激進的 URL normalization（utm_*）。
- 🟡 P3-10-M：Source registry generated workflow——**部分完成**（2026-05-15）：新增 `scripts/build_source_registry.mjs` v0.1，把 discovery output（`discovered-resources.{example,generated}.json`）保守轉成 `data/imported/source-registry.generated.json`（**全部 pending_review / needs_manual_check，絕不 approved_for_import**）；deterministic sourceId（`src-gen-001` ... 由 input 順序產生）；dedup by `normalizedUrl ?? url`；`publisher / publisherType / sourceKind` 保守推論 + 一致性自動降級（hostname 不在 OFFICIAL_HOSTNAMES allowlist → 自動降為 third_party_practice、不假裝 official）；`partsCovered` 從 disc.detectedExamParts 過濾 ALLOWED_PARTS（空則 `["unknown"]`，不亂猜）；CLI flags：`--input` / `--out` / `--mode build` / `--limit 20` / `--help`。CLI 跑 example input → 6/6 通過 `scripts/validate_source_registry.mjs`；deterministic 重跑驗證 identical；fixture 測試確認 duplicate URL / 無 URL / fake official hostname 都正確處理；`.gitignore` 已 ignore generated registry（P3-10-L 補入）；docs/SOURCE_REGISTRY_PLAN.md 補 E-bis 段（v1.1）；docs/DISCOVERY_CRAWLER_PLAN.md 升 v3.2；docs/PRACTICE_DATA_IMPORT_PLAN.md C 段第 0 步補 build CLI 用法（升 v1.2）。**未做**：collector / normalizer 的 program-layer source-registry gate；approved_for_import 後續整合；多輪 history / 進度追蹤
- 🟡 P3-10-K：first practice paper 組裝與驗收 / approved → 正式題庫轉換 CLI——**部分完成（含 Codex 修補）**（2026-05-14）：新增 `scripts/approve_reviewed_questions.mjs` v0.1.1（preview / write 兩 mode + `--write yes` 雙開關）；讀 P3-10-F reviewed-questions + review-validation + target 三檔；5-AND 篩選；7 種題型轉換規則保守；matching / listening-image-choice → unsupported_question_type skip；preview JSON 永遠寫；starterPart 依 type fallback；不自動補 spellingHint / letterScramble / topic 等選填。**v0.1.1 修補**（Codex 有條件通過後）：(a) duplicate id 拆兩種：`duplicate_id_in_target`（target 既有同 id）+ `duplicate_id_in_batch`（同批 ready items 內 id 重複，**兩筆同時 skip 不 silent 寫入**），任一觸發 write mode 整批拒絕 exit 2；summary 補 `duplicateIdsInTarget` / `duplicateIdsInBatch`（`duplicateIds` 仍記聯集）；(b) `finalQuestion.source` 對齊 `QuestionSource` union（official_sample / past_paper / ai_generated / custom），空值預設 custom、非 union 值 → status=failed + error `invalid_question_source`（**不** silent fallback）；reviewer 若想表達 user_provided / third_party 應保留於 reviewerNotes / discovery provenance。**未做**：matching template 擴張；Review UI dashboard；`--rollback` flag；P3-10-K「first practice paper 組裝與驗收」的 paper-level metadata（sourceMix / sections）整合屬獨立刀數

---

## G. 版本

- **v1**（2026-05-13）：第一版——P3-10 umbrella 規劃；引用三份子文件（import / collector / normalize）；定義最小可玩資料包目標；列出後續刀數對應。
- **v1.7**（2026-05-17）：新增 P3-10-R 條目——Runbook extended offline smoke for review / approve / assemble preview；`scripts/runbook_smoke_check.mjs` v0.1 → v0.2 擴充 4 檢查 + 3 safety + 強化 cleanup；F 段加 🟡 P3-10-R 條目（位於 P3-10-Q 之後）；附帶修 P3-10-Q Codex Low：runbook 章節順序修正為 9 / 10 / 11；runbook 升 v1.2。本次調整**未修改任何 CLI 行為**；scripts/ 內既有 9 個 CLI 一律不動；正式題庫 / 正式 paper / UI / schema 皆未動。
- **v1.6**（2026-05-16）：新增 P3-10-Q 條目——Runbook offline smoke script / `runbook:check`；新增 `scripts/runbook_smoke_check.mjs` v0.1 + `package.json` 加 `runbook:check` npm script；F 段加 🟡 P3-10-Q 部分完成條目（位於 P3-10-P 之後）；附帶修 P3-10-P Codex Low：runbook 第 1 段流程總覽明確列 `validate source registry`、新增 runbook 離線 smoke check 6 子段、runbook 升 v1.1。本次調整**未修改任何 CLI 行為**；scripts/ 內既有 9 個 CLI 一律不動；正式題庫 / 正式 paper / UI / schema 皆未動。
- **v1.5**（2026-05-15）：新增 P3-10-P 條目——Source-first pipeline reviewer runbook；新增 [`docs/SOURCE_FIRST_PIPELINE_RUNBOOK.md`](./SOURCE_FIRST_PIPELINE_RUNBOOK.md) v1（reviewer 端到端操作手冊，整合 P3-10-L / M / N / O 工具）；B 段表格加 SOURCE_FIRST_PIPELINE_RUNBOOK 條目；E 段「與既有文件的關係」加 SOURCE_FIRST_PIPELINE_RUNBOOK 條目；F 段加 🟡 P3-10-P 部分完成條目（位於 P3-10-O 之後）。本輪**純文件交付**，未修改任何 script / schema / 正式題庫 / UI。
- **v1.4**（2026-05-15）：新增 P3-10-O 條目——Source Registry merge / preserve tool；`scripts/build_source_registry.mjs` v0.2 新增 `--merge-with` flag；reviewer 編輯欄位保留；orphan 保留；sourceId 自動衝突避讓；invalid merge-with → exit 2。F 段加入 🟡 P3-10-O 部分完成條目（位於 P3-10-N 之後）。本次調整**不修改** schema / 正式題庫 / UI / `/quiz` 載入邏輯；僅 1 個 CLI 加 flag + 文件同步。
- **v1.3**（2026-05-15）：新增 P3-10-N 條目——Collector / Normalizer approved_for_import gate；三個 CLI（collect pipe / normalizer / single-URL collector）新增 `--source-registry` flag；URL normalization v0.1 規則；共用 helper `scripts/source_registry_gate.mjs`；5 種 fixture 端到端測試。F 段加入 🟡 P3-10-N 部分完成條目（位於 P3-10-M 之後）。本次調整**不修改** schema / 正式題庫 / UI / `/quiz` 載入邏輯；僅新增 helper + 3 個 CLI 加 flag + 文件同步。
- **v1.2**（2026-05-15）：新增 P3-10-M 條目——Source registry generated workflow（`scripts/build_source_registry.mjs` v0.1：discovery output → source-registry generated JSON，pending_review / needs_manual_check 預設、**絕不** approved_for_import、保守推論 + 一致性降級）；B 段表格 SOURCE_REGISTRY_PLAN 對應條目加 P3-10-M 引用 + E-bis 段補充說明；F 段加入 🟡 P3-10-M 部分完成條目。本次調整**不修改** schema / 正式題庫 / UI / `/quiz` 載入邏輯；僅新增一個 CLI + 文件同步。
- **v1.1**（2026-05-14）：新增 P3-10-L 條目——正式來源優先匯入規則 + Source Registry；B 段補引用 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)；C 段補 source-first 5 條原則；D 段補方向修正（最小可玩 part 補題改 source-first）；E 段補 SOURCE_REGISTRY_PLAN 對齊關係；F 段 P3-10-H / I / J 改為 source-first 題庫擴充（**不是** AI 補題）。本次調整**不修改** schema / 正式題庫 / UI；僅文件 + example registry + 可選 validator CLI。
