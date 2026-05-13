# Claude Code 回報 · P3-10-D-3：Discovery → Collector 自動 pipe（部分完成）

任務日期：2026-05-13
任務性質：**discovery output 接 collector 的批次 pipe CLI 第一版**——讀 `discovered-resources.generated.json` 內 `shouldCollect=true` 條目，依 `collectorMode` 分流到 collector helper（full-text / index-only / asset HEAD-only），產出 batch 結構 `source-documents.batch.generated.json`。本輪硬邊界全遵守：未做 AI normalizer；未呼叫 OpenAI；未把 source document 轉正式題庫（`data/p3-example-questions.json` / `data/exam-papers.example.json` 完全不動）；未新增正式題目；未下載 PDF / image / audio binary（PDF asset 只 HEAD 抓 metadata、body 完全沒拉）；未解析 PDF；未產生 TTS；未改 UI / quiz / review / schema；未接後端 / DB / 登入；未處理 npm audit；未部署；未 commit `.env.local`；未 commit `.generated.json`（已 `git check-ignore` 確認）；未 commit `.claude/settings.local.json`；未紀錄真實 API key。

## 【本輪修改摘要】

新增 `scripts/collect_discovered_resources.mjs` v0.1（discovery → collector pipe CLI）+ 對 `scripts/web_resource_collect.mjs` 做最小、非破壞性 refactor，讓 pipe 能透過 `import` 重用 collector helper：

1. **新增 pipe CLI `scripts/collect_discovered_resources.mjs` v0.1**——~370 行；分 5 段（常數 / CLI parsing / helpers / HEAD-only fetch / 單筆 entry 處理 / main）；支援 6 個 flag：`--input`（預設 `data/imported/discovered-resources.generated.json`） / `--out`（預設 `data/imported/source-documents.batch.generated.json`） / `--limit`（預設 5、防呆） / `--only-should-collect`（預設 yes） / `--dry-run`（預設 no） / `--help`。
2. **三種處理策略分流**：
   - **HTML + collectorMode=full-text** → 重用 collector `buildSourceDocumentEntry`（產出 source-document 含 cleanedText / headings / links / assets / extractedCandidates）；`document.kind = "source_document"`。
   - **HTML + collectorMode=index-only** → 重用 collector `buildResourceIndexEntry`（產出 resource-index entry）；`document.kind = "resource_index"`。
   - **resourceType ∈ { pdf, image, audio, video }** → 只發 HEAD、不下載 body；產 `document.kind = "asset_metadata"` 含 `httpStatus` / `contentType` / `contentLength` / `method: "HEAD"`；warnings 含 `asset_collection_not_implemented`（pdf 多一筆 `pdf_parser_not_implemented`）。
3. **三種 skip 路徑**：
   - `skipped_not_should_collect`（shouldCollect=false 且 --only-should-collect=yes）
   - `skipped_missing_url`（entry 缺 url）
   - `skip_due_to_limit`（超過 --limit 上限的 eligible 條目）
4. **Rate limit / safety**：每 fetch 之間 `sleep(500)`；HTTP timeout 沿用 collector `DEFAULT_TIMEOUT_MS=15000`；單筆 fetch / parse 失敗時記 error + `status=failed` 並繼續下一筆、整批不中斷。
5. **`scripts/web_resource_collect.mjs` 最小 refactor**（CLI 行為完全不變）——把 `main()` 包進 `import.meta.url === pathToFileURL(process.argv[1]).href` 判斷 + 新增 `export { COLLECTOR_VERSION, COLLECTOR_USER_AGENT, DEFAULT_TIMEOUT_MS, fetchUrl, buildResourceIndexEntry, buildSourceDocumentEntry, buildWarnings }`。原 CLI（`node scripts/web_resource_collect.mjs --mode ... --url ...`）仍照舊跑 main；只有透過 `import` 時不會觸發 CLI flow。
6. **Output 統一 batch 結構**：`{ batchId, createdAt, source, input, dryRun, summary, items[] }`，每 item 保留 discovery provenance（`sourceQueryId` / `sourceQuery` / `score` / `reasons` / `reviewStatus` / `discoveryProvenance`）+ 處理結果（`status` / `warnings` / `error` / `collectedAt` / `document`）。
7. **`.gitignore` 加** `data/imported/source-documents.batch.generated.json`（與 discovery / search-results / source-document / normalized-questions 等既有 generated 檔案一起）；段落標題更新為「P3-10-A / P3-10-D-2 / P3-10-D-2B / P3-10-D-3」。
8. **文件同步**——`docs/DISCOVERY_CRAWLER_PLAN.md` G 段 6 階段表格擴張（加 step 2 pipe） + pipe 與 collector 分工說明 + M 段 v3 升級紀錄；`docs/WEB_RESOURCE_COLLECTOR_PLAN.md` F 段尾段補 D-3 pipe 落地說明 + v1.2 微調紀錄；`docs/PRACTICE_DATA_PLAN.md` F 段 P3-10-D-2B 子條目下加 P3-10-D-3 子條目；`PROJECT_ROADMAP.md` P3-10-D-3 條目從 ⬜ 改 🟡 + 完整本輪修改清單與測試結果摘要。

`npm run lint` / `typecheck` / `build` 全綠（88 routes 不變、**無新依賴**）。**P3-10 整體仍 🟡（A/B/C ✅ + D 🟡 + D-2 🟡 + D-2B 🟡 + D-3 🟡 + E~K ⬜）；P3-10-D / P3-10 / P3 整體仍 🟡——未把任何整體階段標完成**。

## 【修改檔案清單】

新增 1 份；修改 6 份；未動既有題目 / 圖片 / 音檔 / UI / quiz / review / schema / data / 題庫：

新增：
- **`scripts/collect_discovered_resources.mjs`**：v0.1 pipe CLI 共 ~370 行；分 5 段（常數 / CLI arg parsing / helpers / HEAD fetch + entry 處理 / main）；無新 npm 依賴（純 Node 內建 + 從 `web_resource_collect.mjs` import）。

修改：
- **`scripts/web_resource_collect.mjs`**：在 `main().catch(...)` 上方加 `pathToFileURL` import + `isCliInvocation` 判斷；底下加 ES module `export { COLLECTOR_VERSION, COLLECTOR_USER_AGENT, DEFAULT_TIMEOUT_MS, fetchUrl, buildResourceIndexEntry, buildSourceDocumentEntry, buildWarnings }`；**整檔僅新增 ~17 行 / 改 0 行 / 刪 0 行**；既有 CLI 行為、輸出 JSON 結構、warnings 處理完全不變。
- **`.gitignore`**：加一行 `data/imported/source-documents.batch.generated.json`；段落標題更新為「P3-10-A / P3-10-D-2 / P3-10-D-2B / P3-10-D-3」。
- **`docs/DISCOVERY_CRAWLER_PLAN.md`**：G 段「與現有 collector 的關係」表格從 5 階段擴張到 6 階段（加 step 2 pipe）+ 新增 4 點「pipe 與 collector 分工」說明；M 段加 v3 升級紀錄保留 v2.1 / v2 / v1。
- **`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`**：F 段「後續擴充」尾段補 P3-10-D-3 pipe 落地說明（5 條：直接讀 discovery output / web_resource_collect.mjs 微 refactor / asset 只 HEAD / 統一 batch 輸出 / pipe 不寫單筆 generated）；J 段「版本」加 v1.2 微調紀錄。
- **`docs/PRACTICE_DATA_PLAN.md`**：F 段 P3-10-D-2B 子條目後新增 P3-10-D-3 子項目，標籤「🟡 部分完成」+ 完整本輪修改摘要。
- **`PROJECT_ROADMAP.md`**：P3-10-D-3 條目從 `⬜` 改 `🟡 部分完成`，補完整本輪修改清單（pipe CLI 6 flag / 3 種處理策略 / 3 種 skip 路徑 / collector refactor 非破壞性 / .gitignore / 文件同步） + 4 種測試結果 + 未做清單。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `app/page.tsx` / `components/QuizPlay.tsx` / 其他 components / `data/p3-example-questions.json`（13 題完整保留）/ `data/exam-papers.example.json` / `data/vocabulary.json` / `data/quizzes.json` / `data/imported/*.example.json`（6 個範例完整保留）/ `public/images/` / `public/audio/` / `scripts/discover_resources.mjs`（v0.2 完整保留）/ `scripts/generate_openai_tts_sample.mjs` / `docs/PRACTICE_DATA_IMPORT_PLAN.md` / `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` / `docs/PRODUCT_SPEC.md` / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/CODEX_VALIDATION_RUNBOOK.md` / `docs/TASK_ROUTER.md` / `docs/USER_TEST_NOTES.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `README.md`（本輪沒新文件入口；既有 DISCOVERY_CRAWLER_PLAN 入口仍指向同一份）/ `.env.example`（沒新 env 需求）/ `source_materials/*` / `package.json`（**無新依賴**）/ `node_modules/`。

## 【Pipe CLI 說明】

### 9 段檔案結構

```
scripts/collect_discovered_resources.mjs
├── Section 0：常數（PIPE_VERSION / DEFAULT_LIMIT / INTER_FETCH_DELAY_MS / ASSET_RESOURCE_TYPES / HELP_TEXT 預設路徑）
├── Section 1：CLI arg parsing
│   ├── parseYesNo（共用 yes/no 字面量驗證）
│   └── parseArgs（6 個 flag：--input / --out / --limit / --only-should-collect / --dry-run / --help）
├── Section 2：helpers（sleep / readJsonFile / writeJson / makeBatchId）
├── Section 3：HEAD-only fetch（給 pdf / image / audio / video 用，**不下載 body**）
├── Section 4：單筆 entry 處理
│   ├── makeBaseItem（保留 discovery provenance）
│   ├── buildCollectorArgs（對應 collector helper 簽章）
│   ├── processAssetEntry（HEAD only + warnings）
│   ├── processHtmlEntry（重用 collector buildSourceDocumentEntry / buildResourceIndexEntry）
│   └── processOne（dispatcher：dry-run / asset / html）
└── Section 5：main
    ├── 讀 input / 驗證 array
    ├── 分流 eligible vs skipped（含 3 種 skip 路徑：not_should_collect / missing_url / due_to_limit）
    ├── 跑 eligible（with delay）
    └── 寫 batch JSON
```

### CLI 介面

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--input` | 選填 | `data/imported/discovered-resources.generated.json` | discovery output JSON |
| `--out` | 選填 | `data/imported/source-documents.batch.generated.json` | batch output JSON（覆寫式） |
| `--limit` | 選填 | `5` | 最多處理 N 筆 eligible；超過的 eligible 標 `skip_due_to_limit` |
| `--only-should-collect` | 選填 | `yes` | `yes` 時 shouldCollect ≠ true 直接 skip；`no` 時全部進 eligible |
| `--dry-run` | 選填 | `no` | `yes` 時不 fetch URL；item.status="dry_run"；warnings 含 dry_run code |
| `--help` | 選填 | — | 印 usage |

### exit code

| 情況 | exit code |
| --- | --- |
| 成功 | 0 |
| 未預期錯誤（整批 abort） | 1 |
| CLI 參數錯 / input 檔不存在 / JSON parse 失敗 | 2 |

## 【Dry-run 測試結果】

```
$ node scripts/collect_discovered_resources.mjs \
    --input data/imported/discovered-resources.generated.json \
    --out data/imported/source-documents.batch.generated.json \
    --limit 5 --dry-run yes

[pipe] input=.../discovered-resources.generated.json out=.../source-documents.batch.generated.json limit=5 only-should-collect=yes dry-run=yes
[pipe] [1/1] [dry-run] discoveredResourceId=disc-gen-0001 resourceType=pdf collectorMode=index-only url=https://www.lebusanglais.com/.../Pre-A1-Starters-Sample-Paper.pdf
[pipe] wrote batch — totalInput=1 eligible=1 collected=0 dryRun=1 skipped=0 failed=0
exit=0
```

`source-documents.batch.generated.json` 內容（節選）：

```jsonc
{
  "batchId": "batch-2026-05-13T08-28-31-234Z",
  "createdAt": "2026-05-13T08:28:31.234Z",
  "source": "collect_discovered_resources.mjs@v0.1",
  "input": "/.../discovered-resources.generated.json",
  "dryRun": true,
  "summary": { "totalInput": 1, "eligible": 1, "collected": 0, "dryRun": 1, "skipped": 0, "failed": 0 },
  "items": [
    {
      "discoveredResourceId": "disc-gen-0001",
      "url": "https://www.lebusanglais.com/.../Pre-A1-Starters-Sample-Paper.pdf",
      "sourceQueryId": "dq-en-official-001",
      "sourceQuery": "Cambridge Pre A1 Starters sample paper",
      "sourceType": "third_party",
      "resourceType": "pdf",
      "level": "Pre A1 Starters",
      "score": 8,
      "reasons": ["keyword_starters", "keyword_pre_a1", "keyword_sample_paper"],
      "reviewStatus": "discovered_candidate",
      "collectorMode": "index-only",
      "discoveryProvenance": { "discoveryVersion": "discover_resources.mjs@v0.2", "searchProvider": "brave-search", "rank": 1 },
      "status": "dry_run",
      "warnings": [ { "code": "dry_run", "message": "dry-run：未實際 fetch。計畫策略：HEAD only（resourceType=pdf）+ warnings: asset_collection_not_implemented + pdf_parser_not_implemented" } ],
      "error": null,
      "collectedAt": "...",
      "document": null
    }
  ]
}
```

✅ dry-run 行為正確：未實際 fetch URL；status=`dry_run`；warnings 解釋實跑時會走的策略；保留所有 discovery provenance（sourceQueryId / sourceQuery / score / reasons / reviewStatus / discoveryProvenance）。

## 【Real collect 小量測試結果】

### 主測試：limit=1 對使用者本機 happy path PDF

```
$ node scripts/collect_discovered_resources.mjs \
    --input data/imported/discovered-resources.generated.json \
    --out data/imported/source-documents.batch.generated.json \
    --limit 1

[pipe] [1/1] discoveredResourceId=disc-gen-0001 resourceType=pdf collectorMode=index-only url=https://www.lebusanglais.com/.../Pre-A1-Starters-Sample-Paper.pdf
[pipe] wrote batch — totalInput=1 eligible=1 collected=1 dryRun=0 skipped=0 failed=0
exit=0
```

generated `items[0].document`（節選）：

```jsonc
{
  "status": "collected",
  "warnings": [
    { "code": "asset_collection_not_implemented", "message": "本輪 D-3 不下載 / 不解析 asset（pdf / image / audio / video）；僅以 HEAD 抓 metadata..." },
    { "code": "pdf_parser_not_implemented", "message": "PDF parser 屬 P3-10 後續刀數（需評估 pdfjs-dist / pdf-parse 依賴）..." }
  ],
  "document": {
    "kind": "asset_metadata",
    "url": "https://www.lebusanglais.com/.../Pre-A1-Starters-Sample-Paper.pdf",
    "httpStatus": 200,
    "contentType": "application/pdf",
    "contentLength": 6914257,    // 6.9MB — 注意 body 完全未下載，只 HEAD 拿到此 header
    "method": "HEAD",
    "retrievedAt": "2026-05-13T08:28:40.082Z",
    "pipeVersion": "collect_discovered_resources.mjs@v0.1",
    "collectorVersion": "web_resource_collect.mjs@v0.1",
    "note": "asset metadata only — body 未下載、未解析"
  }
}
```

✅ PDF asset 行為正確：HEAD 拿到 200 / `application/pdf` / 6914257 bytes（6.9MB），但**body 完全未下載**——這是本輪硬邊界（不下載 PDF）的關鍵驗證；warnings 明確標 `asset_collection_not_implemented` + `pdf_parser_not_implemented`，告知 reviewer 「本筆 entry 仍需 P3-10 後續刀數的 asset-aware / PDF parser 才能取出題目內容」。

### 附加測試：HTML full-text 分支（自製 fixture）

為驗證 HTML 分支重用 collector 邏輯，自製暫存 fixture（已清理）對 `https://www.yle.tw/download.asp` 跑 pipe：

```
[pipe] [1/1] discoveredResourceId=disc-fixture-html-001 resourceType=page collectorMode=full-text url=https://www.yle.tw/download.asp
[pipe] wrote batch — totalInput=1 eligible=1 collected=1 dryRun=0 skipped=0 failed=0
```

result item：
- `status: "collected"`
- `document.kind: "source_document"`（**重用** `buildSourceDocumentEntry`）
- `document.title: "劍橋國際英語認證 輔考資源 官方免費資源下載"`
- `document.contentType: "text/html"`
- `document.httpStatus: 200`
- `document.headings.length: 4`
- `document.links.length: 50`
- `document.assets.length: 26`
- `document.cleanedTextLength: 269`
- `document.extractedCandidates.length: 0`
- `warnings: []`（HTML 2xx case 無 warnings）
- discovery provenance（`sourceQueryId` / `sourceQuery` / `score` / `reasons` / `reviewStatus`）全部保留

✅ HTML 分支端到端通過；與 P3-10-D collector 既有行為 **zero regression**。

### 附加測試：3 種 skip 路徑（自製 fixture）

對 4 筆 fixture（shouldCollect=false / missing url / 2 筆 eligible，limit=1）跑 dry-run：

| item | discoveredResourceId | status | warnings.code |
| --- | --- | --- | --- |
| [0] | disc-skip-001（shouldCollect=false） | `skipped` | `skipped_not_should_collect` |
| [1] | disc-skip-002（無 url） | `skipped` | `skipped_missing_url` |
| [2] | disc-skip-004（eligible 但超 limit） | `skipped` | `skip_due_to_limit` |
| [3] | disc-skip-003（eligible 內，第 1 筆） | `dry_run` | `dry_run` |

summary：`{"totalInput":4,"eligible":2,"collected":0,"dryRun":1,"skipped":3,"failed":0}`

✅ 3 種 skip 路徑分類正確；eligible 計算正確（4 - 1 not_should_collect - 1 missing_url = 2）；dry-run 流程不被 skip 攔截、限制仍生效。

## 【Batch output 格式檢查】

`data/imported/source-documents.batch.generated.json` 結構：

```jsonc
{
  "batchId": "batch-<ISO timestamp with separators>",       // 任務單建議格式
  "createdAt": "<ISO 8601>",
  "source": "collect_discovered_resources.mjs@v0.1",
  "input": "<absolute input path>",
  "dryRun": true | false,
  "summary": {
    "totalInput": <int>,
    "eligible": <int>,
    "collected": <int>,
    "dryRun": <int>,
    "skipped": <int>,
    "failed": <int>
  },
  "items": [
    {
      // 保留 discovery 上游 metadata
      "discoveredResourceId": "disc-gen-XXXX",
      "url": "https://...",
      "sourceQueryId": "dq-...",
      "sourceQuery": "...",
      "sourceType": "official | third_party | user_verified | unknown",
      "resourceType": "pdf | image | audio | video | page | worksheet | ...",
      "level": "Pre A1 Starters | A1 Movers | A2 Flyers | unknown",
      "detectedExamParts": ["L1" | "L2" | ... | "unknown"],
      "score": <int>,
      "reasons": [...],
      "reviewStatus": "discovered_candidate",
      "collectorMode": "full-text | index-only",
      "discoveryProvenance": { "discoveryVersion", "searchProvider", "rank" },
      // 本輪處理結果
      "status": "collected | dry_run | skipped | failed",
      "warnings": [ { "code": "...", "message": "..." } ],
      "error": null | "...",
      "collectedAt": "<ISO 8601>",
      "document": null | { "kind": "source_document | resource_index | asset_metadata", ... }
    }
  ]
}
```

### 檢查清單（任務單規範 + 自查）

| 檢查項 | 結果 |
| --- | --- |
| output 是否存在 | ✅ `data/imported/source-documents.batch.generated.json` 已寫 |
| summary 是否合理 | ✅ totalInput / eligible / collected / dryRun / skipped / failed 加總一致；7 種 status 嚴格遵守字面量 |
| items 是否有 discoveredResourceId / url / status | ✅ 每筆都有；missing-url skip case 仍保留 discoveredResourceId 與 null url |
| PDF / non-HTML 是否被當 HTML 亂解析 | ✅ **未**：asset 走 HEAD-only 分支、document.kind="asset_metadata"、無 headings / links / cleanedText 等 HTML 欄位 |
| generated output 是否被 gitignore 排除 | ✅ `.gitignore:52` 命中 `data/imported/source-documents.batch.generated.json` |
| 保留 discovered resource provenance | ✅ `discoveryProvenance.{discoveryVersion, searchProvider, rank}` |
| 保留 sourceQueryId / sourceQuery | ✅ 每筆都有 |
| 保留 score / reasons | ✅ 每筆都有 |
| 保留 reviewStatus | ✅ `discovered_candidate` 透傳 |
| 不寫正式題庫 | ✅ `data/p3-example-questions.json` / `data/exam-papers.example.json` 完全未動 |

## 【PDF / non-HTML 處理策略】

### 觸發條件

`resourceType ∈ { pdf, image, audio, video }` 即進入 asset 分支（無論 `collectorMode` 為何）。

### 處理流程（asset 分支）

1. 加 `asset_collection_not_implemented` warning，告知 reviewer「本輪不下載 / 不解析」。
2. 若 resourceType === `pdf`，再加一筆 `pdf_parser_not_implemented` warning。
3. 對 URL 發 `HEAD` 請求（method=HEAD、accept=*/*、UA=`cambridge-starters-practice-collector/0.1`、redirect=follow、timeout=15s）。
4. 取 response headers：`status` / `content-type` / `content-length`。**不讀 body**（`fetch` 不會把 body 拉下來，因為我們從不 `await res.text()` / `res.arrayBuffer()`）。
5. 若 HTTP 非 2xx，加 `non_2xx_status` warning（asset metadata 仍記）。
6. 若 fetch 拋例外（DNS / TLS / abort / 405 HEAD not allowed），整筆 status="failed" + 記 error，繼續下一筆。
7. document 結構：
   ```jsonc
   {
     "kind": "asset_metadata",
     "url": "...",
     "httpStatus": 200,
     "contentType": "application/pdf",
     "contentLength": 6914257,
     "method": "HEAD",
     "retrievedAt": "...",
     "pipeVersion": "collect_discovered_resources.mjs@v0.1",
     "collectorVersion": "web_resource_collect.mjs@v0.1",
     "note": "asset metadata only — body 未下載、未解析"
   }
   ```

### 與 HTML 分支的差異

| 面向 | HTML 分支 | Asset 分支 |
| --- | --- | --- |
| HTTP method | GET（collector 既有 `fetchUrl`） | HEAD only |
| Body 處理 | `await res.text()`（讀進 HTML 解析） | **不讀 body** |
| document.kind | `source_document` 或 `resource_index` | `asset_metadata` |
| 額外欄位 | title / description / headings / cleanedText / links / assets / extractedCandidates / warnings | httpStatus / contentType / contentLength / method / note |
| HTML regex 解析 | ✅ 跑 collector buildSourceDocumentEntry / buildResourceIndexEntry | ❌ 完全不跑 |
| warnings | 沿用 collector `buildWarnings`（non-2xx / non-HTML） | pipe 自加 `asset_collection_not_implemented` + 可能 `pdf_parser_not_implemented` + 可能 `non_2xx_status` |

### 為何選 HEAD 而非 Range GET

- **HEAD 最節能**：服務端不送 body，**bandwidth 與時間都最少**（6.9MB PDF 用 GET 即使我們不讀也會佔頻寬）。
- **HEAD 失敗 fallback 留給後續刀數**：少數網站不支援 HEAD（回 405 / 501）；本輪 v0.1 設計是「HEAD 失敗 → status=failed + 記 error 繼續」；fallback 到 Range GET 屬未來範圍（如果 D-3 實測發現特定 host 不支援 HEAD 才補）。
- **避免誤把 binary 當 HTML 解析**：HEAD 本身沒 body，從根本上避免 regex 亂跑 PDF 內容；對齊任務單「要避免把 binary 當 HTML 解析」要求。

### 未來路徑

- ⬜ asset-aware 下載（下 PDF / image / audio 到 `tmp_crawl/`、記 sha256 / 檔案大小驗證、不進 `public/`）—— 屬未來 P3-10 後續刀數。
- ⬜ PDF parser（pdfjs-dist / pdf-parse）—— 屬中等規模、需評估依賴；P3-10-D / E 後續刀數。
- ⬜ HEAD-not-supported fallback（Range GET 1 byte）—— 視實際遇到的 host 決定要不要做。

## 【測試結果】

- `npm run lint`：✅ 全綠（zero issues；新 pipe CLI 與微改 collector 皆通過 ESLint）
- `npm run typecheck`（`tsc --noEmit`）：✅ 全綠（純 `.mjs` script + 純文件、零 TypeScript 型別影響）
- `npm run build`：✅ **88 routes** 全部 static prerendered（路由數不變、無新依賴）
- pipe CLI 3 種主測試：
  - ✅ Test 0 `--help` → exit 0 / 印完整 usage + Pipe 行為 + Hardcoded constraints
  - ✅ Test 1 dry-run（happy path 1 筆 PDF） → totalInput=1 / eligible=1 / dryRun=1 / status=dry_run / warnings 含 dry_run code / 未實際 fetch
  - ✅ Test 2 real `--limit 1`（PDF asset） → status=collected / kind=asset_metadata / HEAD / contentType=`application/pdf` / contentLength=6914257 / **body 未下載**
- pipe CLI 附加測試（自製 fixture 已清理）：
  - ✅ HTML full-text 分支（yle.tw）：status=collected / kind=source_document / headings=4 / links=50 / assets=26 / cleanedTextLength=269 / 重用 collector 規則 zero regression
  - ✅ 3 種 skip 路徑：shouldCollect=false / missing url / limit 截斷皆正確分類
- collector CLI regression：✅ `node scripts/web_resource_collect.mjs --help` 仍正常輸出 25 行 usage；`import('./scripts/web_resource_collect.mjs')` 不觸發 main()、回傳 7 個 export 名稱
- gitignore：✅ 三個 `.generated.json` 都已 ignore（`.gitignore:50` / `:51` / `:52`）；3 個 `.example.json` 不被 ignore

## 【仍未處理】

依任務單範圍（P3-10-D-3 屬部分完成）：

- ⬜ **asset 下載 / asset-aware 模式**：本輪只 HEAD；下載 PDF / image / audio 到 `tmp_crawl/`（gitignored）+ 記 sha256 + mime 屬未來範圍（P3-10 後續刀數）。
- ⬜ **PDF parser**（pdfjs-dist / pdf-parse）：屬中等規模、需評估依賴；P3-10-D 後續刀數。
- ⬜ **multi-batch history**：本輪是「每次跑完全覆寫 `source-documents.batch.generated.json`」；無歷史。未來可加 `--append yes` 或 `data/imported/batches/<batchId>.json` 多檔保留。
- ⬜ **discovery 重跑時 batch 增量更新**：若 discovery 重跑後新增了候選 URL，目前 pipe 仍跑全部 eligible；無「只跑新增的」邏輯。
- ⬜ **AI normalizer**（屬 P3-10-E）：把 source-document / asset-metadata 餵 AI 出題目草稿；需 OpenAI API。
- ⬜ **人工審核流程**（屬 P3-10-F）：reviewStatus 升 `approved_for_practice` 才能進正式題庫。
- ⬜ **K 寫入正式題庫**（屬 P3-10-K）：本輪硬邊界不動。
- ⬜ **HEAD 失敗 fallback to Range GET**：少數網站不支援 HEAD；本輪 v0.1 fail-fast；後續視實測情況補。
- ⬜ **多 URL 並發**：本輪是 sequential + 500ms delay；對 50+ URL 跑批會慢；未來可加可控併發（如 3 個並發）+ per-host rate-limit。
- ⬜ **真實 Brave Search → pipe 完整鏈路實測**：使用者本機只跑了 1 query × 1 result 的 happy path；pipe 也只對該 1 筆跑過 limit=1；未實測過「多筆 candidates 同時 pipe」的真實場景。

P3-10-E / F / G / H / I / J / K 共 7 條 ⬜ 仍未動（屬未來範圍）。

## 【風險點】

- **collector refactor 對既有 CLI 行為的回歸：低**——僅加 `import { pathToFileURL }` + 一個 `if` 包住 `main().catch()` + 一個 `export` 區塊；CLI direct invocation 路徑完全不變。已驗證 `node scripts/web_resource_collect.mjs --help` 仍輸出原 25 行 usage、`import()` 不觸發 main。但若有人未來在 collector 加新 module-top-level side effect，import 時可能觸發；建議所有 collector module-level code 都保持 side-effect-free（目前是、未來要維持）。
- **PDF HEAD 行為依賴 server 支援：中**——少數 web server（特別是 CDN / asset host）對 HEAD 回 405 / 501；本輪 v0.1 在這種情況下 status=failed + error 訊息，reviewer 仍能從 batch JSON 看到「URL 是哪個、為什麼失敗」。實測 `lebusanglais.com` PDF HEAD 200 ✅，但如果未來 candidates 含其他 host 可能會碰到。建議下一輪 P3-10-D-3 後續刀數補 Range GET fallback。
- **HEAD 抓到的 contentLength 不保證是真實 body 大小：低**——某些 server 用 `Transfer-Encoding: chunked` 不回 Content-Length；本實作 fallback 為 `null`。document.contentLength=null 不算錯誤、只是「未知」。
- **pipe 不寫單筆 generated 與 collector CLI 單 URL 模式的潛在衝突：低**——collector CLI 直接 invoke 仍寫 `resource-index.generated.json` / `source-document.generated.json`；pipe 寫 `source-documents.batch.generated.json`。三個檔案各自獨立、互不覆寫。但 reviewer 若同時用兩種模式，需自己記住哪個是哪個；建議短期內統一只用 pipe。
- **single batch file 覆寫式：中**——pipe 每次跑覆寫整檔；若 reviewer 想保留歷史比對，需手動 `cp` 改檔名。屬已知限制、未做 history。任務單未要求 history。
- **discovery → pipe 之間的 race：低**——若 discovery 仍在跑（brave-search 多 query），pipe 同時跑會讀到不完整的 `discovered-resources.generated.json`。本輪未做 lock；通常使用者是 sequential 跑、不會撞。建議文件層提示「先等 discovery 完成」。
- **HTTP 5xx 整批處理時不重試：低**——目前單筆 fail-and-continue；無 retry / backoff。未來若 brave 大批量結果中有暫時性 5xx，會丟掉那筆。建議下一輪 P3-10-D-3 後續加 exponential backoff retry（屬已標的「未處理」）。
- **third-party PDF 授權邊界：中**（與 D-2B happy path 報告同個風險點）—— `lebusanglais.com` PDF 是第三方教學網站、屬 `sourceType: third_party`，**HEAD 拿 metadata 不違反任何授權邊界**（沒下載內容）；但 future asset 下載 + PDF parse 必須先確認來源授權，這在 N-3 / `docs/PRACTICE_DATA_IMPORT_PLAN.md` B 段已明示。
- **PIPE_VERSION 為硬編字串：低**——`"collect_discovered_resources.mjs@v0.1"`；版本升級時需手改、與 collector / discovery 一致（`COLLECTOR_VERSION` / `DISCOVERY_VERSION`）。屬目前已知模式。
- **HEAD UA 與 collector 相同：低**——pipe 沿用 `COLLECTOR_USER_AGENT = "cambridge-starters-practice-collector/0.1"`；對外仍誠實標識為 collector，不偽裝瀏覽器。

## 【後續建議】

1. **下一步走 P3-10-E AI normalizer**——本輪已把 discovery → pipe → batch 鏈路打通；下一階段把 `source-documents.batch.generated.json` 內 HTML `kind=source_document` 條目餵 AI normalize 出題目草稿（不直接送 PDF binary、不送 third-party 全文，先以自家素材 + 自製 imageprompt / ttsScript 為主）。
2. **PDF parser 評估**（與 1 並行）：本輪實測證明 `lebusanglais.com` Pre A1 Starters sample paper 是 6.9MB PDF；要轉成正式題庫得先解析。建議短期內評估 `pdfjs-dist`（純 JS、無 native dependency）vs `pdf-parse`（有 native dep）vs 改走 OpenAI vision / OCR；屬獨立刀數。
3. **multi-URL pipe 實測**（使用者擴量實測時走）：建議使用者下一次跑 Brave 用 `--query-limit 3 --limit-per-query 3`（9 calls）取多筆 candidates，再用 `node scripts/collect_discovered_resources.mjs --limit 9` pipe 跑批，可實測多筆 entries 的 500ms delay、skip 邏輯、與 sequential fetch 整體耗時。
4. **HEAD fallback to Range GET**（若實測碰到 405 Method Not Allowed）：屬已標未處理；建議遇到時再補。
5. **`--append` 或 batch history**：若 reviewer 想長期保留 batch 紀錄（例如「2026-05-13 跑了哪些 candidate」），建議下一輪 P3-10-D-3 後續刀數加 `data/imported/batches/<batchId>.json` 多檔保留 + `manifest.json` 索引；本輪 v0.1 不做。
6. **pipe → AI normalizer pipe 整合**（屬 P3-10-E）：把本輪 batch output 作為 AI normalizer input；reviewStatus 升級為 `ai_normalized` / `human_review_required`；不要直接 commit、由 maintainer 手動 review。
7. **collector module 維護準則**：本輪對 collector 做了非破壞 refactor；未來任何 module-level 改動務必保持 side-effect-free，避免 import 時觸發。建議在 `web_resource_collect.mjs` 頭 docstring 加一條「module-level side-effect free」備註（非本輪範圍）。

**短期建議**：先讓 Codex 驗收本輪 P3-10-D-3 部分完成（驗 pipe CLI 6 flag / 3 種分流 / 3 種 skip / HEAD 不下載 body / batch output 結構 / collector refactor zero regression / lint / typecheck / build 全綠）；確認通過後再決定下一刀（建議 P3-10-E AI normalizer 或使用者擴量實測 + multi-URL pipe）。

## 【Roadmap 同步檢查】

- 🟡 **P3-10-D-3**：Discovery → Collector 自動 pipe——**部分完成**（2026-05-13）—— 本輪完成
- 🟡 P3-10-D-2B：Discovery crawler 接真實 Search Provider 第一版（仍 🟡 happy path verified）
- 🟡 P3-10-D-2：Discovery crawler 自動找資料來源（仍 🟡）
- ✅ P3-10-A：正式資料匯入流程與來源欄位規劃
- ✅ P3-10-B：Web resource collector 規劃與最小 CLI 原型
- ✅ P3-10-C：Question import normalization 規劃
- 🟡 P3-10-D：collector 實測與第一批來源匯入（仍 🟡 部分完成）
- ⬜ P3-10-E：AI normalizer 原型
- ⬜ P3-10-F：匯入題目人工審核流程
- ⬜ P3-10-G：Vocabulary 圖片 / SVG 補齊第一批
- ⬜ P3-10-H：RW3 spelling 題庫擴充
- ⬜ P3-10-I：RW1 yes/no 題庫擴充
- ⬜ P3-10-J：L3 listening 多題補齊
- ⬜ P3-10-K：first practice paper 組裝與驗收
- 🟡 P3-10 整體：本輪後仍 🟡（A/B/C ✅ + D 🟡 + D-2 🟡 + D-2B 🟡 + D-3 🟡 + E~K ⬜）—— **未把整體標完成**
- 🟡 P3-9-C 整體：仍 🟡（26 條 ✅）
- 🟡 P3 整體：仍 🟡 進行中——**未把整體標完成**
- ⬜ P4 / P5：仍未開始

**特別注意**：本輪只做 Discovery → Collector pipe，**不做 AI normalizer、不轉正式題庫、不下載或解析 PDF**；`data/p3-example-questions.json` / `data/exam-papers.example.json` / `public/images/` / `public/audio/` 皆完整保留未動；P3-10-D-3 標 🟡 部分完成、未誇大為完整完成；P3-10-D / P3-10 / P3 整體仍 🟡。
