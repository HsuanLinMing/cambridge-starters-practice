# 網路資源 Collector / Crawler 規劃（P3-10-B）

> 對應 P3-10「正式練習資料補齊與 web resource collector」。本檔規劃**抓取網頁素材**的 crawler / collector 設計與 CLI 介面。
>
> 本檔屬**規劃文件**；最小 CLI 原型已於 P3-10-B 落地在 `scripts/web_resource_collect.mjs`。

最新整理：2026-05-13。

---

## A. 目標

本 collector 為「正式練習資料 import pipeline」的 Layer 2 入口（見 [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) C 段流程）。具體用途：

- **抓取網頁 metadata**：title / description / h1 / sourceDomain，供 Layer 1 resource index 補欄位。
- **抓取網頁正文**：cleaned text，供後續 AI normalizer 解析。
- **抓取題目文字**：偵測類題目 block（編號 / 含 `?` 的問句 / 含 ____ 的填空），存入 candidates。
- **抓取 worksheet / sample paper 結構**：headings 階層、表格 cell、`<ol>` / `<ul>` 條列。
- **抓取 vocabulary list**：以 detected pattern 識別「字母 + 中文 / 字母 + 圖」清單。
- **下載或記錄圖片 / 音檔 / PDF**（asset-aware 模式，本輪不實作）：記 `assets[]` URL + alt + type；正式 practice data 仍**不直接使用**這些下載資產，只作 normalize 參考。
- **讓 AI 進一步整理成題目資料**：collector 不出最終題目，只出半結構 `source-document.generated.json`；P3-10-E AI normalizer 再做。

**硬邊界**：

- ❌ **不爬蟲式批次抓**——本 collector 是「逐 URL 手動跑」的工具；無 spider / 無 follow-link / 無 sitemap 解析。
- ❌ **不繞 robots.txt**——任何被 robots 禁止的 URL，使用者自行決定是否跑（不在腳本內 enforce，但建議手動 check）。
- ❌ **不假裝 user agent**——CLI 預設 UA 為 `cambridge-starters-practice-collector/0.1`，誠實標識用途。
- ❌ **不下載官方音檔 / 圖片到 public/**——asset 下載只能進 `tmp_crawl/`（已 gitignore）；正式素材改自製。
- ❌ **不送 PII / 不帶 cookie / 不登入**。
- ❌ **不串 OpenAI / 雲端 API**——collector 是純 fetch + parse，無 AI。

---

## B. Collector 模式

設計三種模式對應不同抓取深度：

### 1. index-only

只抓最淺的 metadata，給 resource index 補欄位。

抓的欄位：
- `url`
- `title`（從 `<title>` 取）
- `description`（從 `<meta name="description">` 取）
- `h1`（第一個 `<h1>` 文字）
- `links`（簡單 link count）
- `resourceType`（依 URL 與內容做粗略推斷：info_page / vocabulary_list / worksheet / pdf_link / video_page / unknown）
- `sourceDomain`
- `retrievedAt`

輸出：`data/imported/resource-index.generated.json`（單筆或 array）。

### 2. full-text

抓網頁正文 + 候選題目 block。

抓的欄位：
- 上述 index-only 全部
- `headings`：`[{ level, text }, ...]` 對齊 h1~h6
- `cleanedText`：去 script / style / nav / footer / header / 多餘空白後的純文字
- `links[]`：`{ href, text }`，去重前 N 個
- `assets[]`：偵測 `<img>` / `<audio>` / `<video>` 的 src + alt + type（記錄 URL，**不下載**）
- `extractedCandidates[]`：簡單規則偵測類題目 / 字彙 / 指令 block；每筆 `{ candidateType, text, likelyQuestionType, likelyStarterPart, confidence, notes }`

候選偵測規則（第一版簡單規則，未來可換 AI 識別）：
- 開頭數字 + `.` / `)` → `candidateType: "question"`
- 含 `____` 或 `_ _ _` → 可能 fill-blank / spelling
- 含 `?` → 可能 multiple-choice / listening question
- 含 `Look at the picture` → 可能 spelling / RW3
- 含 `Yes / No` 字樣 → 可能 RW1 true-false
- 含字母重複的 list（如 `cat, dog, bird, fish`）→ 可能 vocabulary

輸出：`data/imported/source-document.generated.json`。

### 3. asset-aware（**本輪不實作**）

在 full-text 基礎上**下載** asset 到本機暫存目錄（`tmp_crawl/`），記錄：
- pdf URL → 嘗試下載 PDF（需要 PDF parser，屬 P3-10-D 後續）
- image URL → 下載圖片到 `tmp_crawl/images/<hash>.png`（**不**進 `public/`）
- audio URL → 下載音檔到 `tmp_crawl/audio/<hash>.mp3`
- worksheet link → 跟 PDF 同模式
- file metadata：size / mime / sha256

本輪屬「先設計文件、後實作」；待 P3-10-D 確認需求後再做。

---

## C. 輸出格式

### resource-index 範例（已 commit `data/imported/resource-index.example.json`）

每筆至少包含：

```jsonc
{
  "id": "res-001",
  "url": "https://www.cambridgeenglish.org/exams-and-tests/starters/",
  "title": "Cambridge English Pre A1 Starters — official page",
  "sourceDomain": "cambridgeenglish.org",
  "sourceType": "official",              // 對齊 PRACTICE_DATA_IMPORT_PLAN B 段 7 種
  "resourceType": "info_page",           // info_page / vocabulary_list / worksheet / pdf_link / sample_paper / video_page / unknown
  "level": "Pre A1 Starters",
  "detectedExamParts": ["L1","L2","L3","L4","RW1","RW2","RW3","RW4","RW5"],
  "language": "en",
  "summary": "...",
  "retrievedAt": "2026-05-13T00:00:00.000Z",
  "notes": "..."
}
```

### source-document 範例（已 commit `data/imported/source-document.example.json`）

每筆至少包含：

```jsonc
{
  "id": "doc-001",
  "resourceId": "res-002",
  "sourceUrl": "https://example.org/...",
  "sourceName": "...",
  "sourceType": "third_party",
  "importedAt": "2026-05-13T00:00:00.000Z",
  "contentType": "text/html",
  "title": "...",
  "description": "...",
  "headings": [
    { "level": 1, "text": "..." }
  ],
  "cleanedText": "...",
  "links": [
    { "href": "...", "text": "..." }
  ],
  "assets": [
    { "type": "image", "url": "...", "alt": "..." }
  ],
  "extractedCandidates": [
    {
      "candidateType": "question",        // question | vocabulary | instruction | audio | image | worksheet | unknown
      "text": "...",
      "likelyQuestionType": "spelling",   // 對齊 QuestionType union 之一，或 null
      "likelyStarterPart": "RW3",         // L1~L4 / RW1~RW5 / SP1~SP4，或 null
      "confidence": 0.8,
      "notes": "..."
    }
  ],
  "provenance": {
    "collectorVersion": "web_resource_collect.mjs@v0.1",
    "collectorMode": "full-text",
    "fetcherUserAgent": "cambridge-starters-practice-collector/0.1"
  },
  "reviewStatus": "imported_raw"
}
```

### extractedCandidates 候選類型

- `question`：類題目 block（編號開頭 / 含 ? / 含 ____）
- `vocabulary`：類單字清單 / 主題詞彙
- `instruction`：類指示語（Look at the picture / Listen and choose）
- `audio`：類音檔引用區塊
- `image`：類圖片引用區塊
- `worksheet`：類 worksheet 章節（含多題）
- `unknown`：無法判別

---

## D. CLI 設計

實作於 `scripts/web_resource_collect.mjs`（v0.1，本輪最小原型）。

### index-only

```bash
node scripts/web_resource_collect.mjs --mode index-only --url https://example.com
```

預設輸出：`data/imported/resource-index.generated.json`（覆寫；多筆累積屬 P3-10-D）。

### full-text

```bash
node scripts/web_resource_collect.mjs --mode full-text --url https://example.com --source-type user_verified
```

預設輸出：`data/imported/source-document.generated.json`（覆寫）。

支援的 flag：

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--mode` | 必填 | — | `index-only` / `full-text` |
| `--url` | 必填 | — | 要抓的 URL |
| `--source-type` | 選填 | `unknown` | 對齊 PRACTICE_DATA_IMPORT_PLAN B 段 7 種；只記在 metadata，不影響抓取 |
| `--source-name` | 選填 | `<sourceDomain>` | 來源可讀名稱 |
| `--out` | 選填 | 預設輸出路徑 | 覆寫輸出檔案路徑 |
| `--timeout` | 選填 | `15000` | fetch timeout (ms) |
| `--help` | 選填 | — | 印 usage |

---

## E. 與 AI normalizer 的分工

| 階段 | 工具 | 產出 |
| --- | --- | --- |
| 1. resource index | 人工 / 未來腳本 | `data/imported/resource-index.{example,generated}.json` |
| 2. collector 抓取 | `scripts/web_resource_collect.mjs` | `data/imported/source-document.generated.json`（含 candidate 半結構） |
| 3. AI normalizer | 未實作（P3-10-E，需 OpenAI API） | `data/imported/normalized-questions.generated.json`（含 reviewStatus 字段） |
| 4. 人工審核 | 維護者 | reviewStatus 升級 / 修正 prompt / 對齊自家 SVG |
| 5. 寫入 formal data | 維護者 commit | `data/p3-example-questions.json` 或 `data/practice-questions.json` |

Collector 與 AI normalizer 都是**單向、可重跑**的工具——重跑只覆寫 `.generated.json`，不影響 `.example.json` 與正式 `data/*.json`。

---

## F. 後續擴充

依重要性：

1. **多 URL 批次模式**（P3-10-D）：把 resource index 整份餵給 collector，產出 source-document array。
2. **asset-aware 模式實作**（P3-10-D）：下載 image / audio / PDF 到 `tmp_crawl/`；正式 practice data 仍**不**直接使用。
3. **PDF parser**（屬中等規模，需評估 pdfjs-dist 依賴）：把 sample paper PDF → text + image 結構。
4. **更聰明的 candidate 偵測**：用 AI（OpenAI / 在本機 GGUF）取代第一版 regex；提升 confidence 準確度。
5. **collector report**：每次跑完印一份 summary（抓了 N 筆 / 哪些 candidate / 哪些 asset），供維護者快速 review。
6. **collector 對接 normalizer**：直接觸發 next stage（pipe 模式）。

本輪只完成 1 + 2 模式的最小原型（index-only / full-text）；其他屬 P3-10-D 後續。

**Discovery crawler 上游**：P3-10-D-2 已建立 `scripts/discover_resources.mjs` 與 `docs/DISCOVERY_CRAWLER_PLAN.md`——後續批次 collector 模式應從 `data/imported/discovered-resources.generated.json` 內 `shouldCollect = true` 的條目讀 URL；`collectorMode` 欄位已標明該 URL 適合 `full-text` 還是 `index-only`，可直接作為 collector 跑批的 hint。

**P3-10-D-3 pipe（2026-05-13 落地）**：`scripts/collect_discovered_resources.mjs` v0.1 已實作 discovery → collector pipe：
- 直接讀 `data/imported/discovered-resources.generated.json` 內 `shouldCollect=true` 的條目，依 `collectorMode` 分流到 collector 既有的 `buildSourceDocumentEntry`（full-text）/ `buildResourceIndexEntry`（index-only）。
- 為了讓 pipe 能 `import`，本檔對應的 `scripts/web_resource_collect.mjs` 做了**小幅 refactor**：把 `main()` 包進「是否為直接 CLI 呼叫」判斷 + 加 `export { fetchUrl, buildResourceIndexEntry, buildSourceDocumentEntry, buildWarnings, COLLECTOR_VERSION, COLLECTOR_USER_AGENT, DEFAULT_TIMEOUT_MS }`。**CLI 行為完全不變**——直接 `node scripts/web_resource_collect.mjs --mode ... --url ...` 仍照舊跑 `main()`；只有透過 `import` 時不會觸發 CLI flow。
- pipe 對 pdf / image / audio / video **不下載 binary**——只用 HEAD 抓 metadata（contentType / contentLength / httpStatus）+ 加 `asset_collection_not_implemented` / `pdf_parser_not_implemented` warnings；正式 asset-aware 下載 + PDF parser 仍屬未來範圍。
- 輸出統一為 batch 結構 `data/imported/source-documents.batch.generated.json`（已 gitignore）；不寫單筆 `resource-index.generated.json` / `source-document.generated.json`（避免與既有 collector CLI 單 URL 輸出衝突）。

---

## G. Non-2xx / Non-HTML / Fetch failure 處理策略（P3-10-D 補強）

P3-10-D 實測後對 collector 補了三種異常狀況的處理；v0.1 行為固化如下：

| 狀況 | exit code | output JSON 變化 | 是否仍寫檔 |
| --- | --- | --- | --- |
| HTTP 200~299 + HTML | 0 | `warnings: []`（空陣列） | ✅ 寫 |
| **HTTP 非 2xx**（404 / 403 / 500 等） | **0**（仍寫檔以便人工檢查） | `warnings` push `{ code: "non_2xx_status", message }` | ✅ 寫；`httpStatus` 反映真實狀態碼 |
| **non-HTML content-type**（image / pdf / audio / video / binary 等） | **0** | `warnings` push `{ code: "non_html_content_type", message }` + 解析欄位全給空（headings / links / assets / cleanedText / extractedCandidates） | ✅ 寫；reviewer 可從 warnings + contentType 判斷 |
| **fetch failure**（DNS / network / TLS / abort） | **1** | 不寫 generated JSON | ❌ 不寫 |
| **timeout**（超過 `--timeout` ms） | **1** | 不寫 generated JSON | ❌ 不寫 |
| **缺 `--url` / `--mode` 不對 / unknown arg** | **2** | 不寫 generated JSON | ❌ 不寫；印 HELP_TEXT 到 stderr |

**設計原則**：collector 是「最佳努力把抓到的東西寫進 generated JSON」，**不是 quality gate**——quality gate 屬 normalizer + human review。404 / 非 HTML 的內容仍寫檔以保留證據；warnings 陣列讓 reviewer 一眼看到需要注意的點。

> **source-first 邊界（P3-10-L，2026-05-14；P3-10-N 程式層 gate 已落地，2026-05-15）**：collector 設計上仍是「逐 URL 跑」的工具，但 P3-10-N 起 `scripts/web_resource_collect.mjs` 與 pipe 版 `scripts/collect_discovered_resources.mjs` 兩個 CLI 都新增 optional `--source-registry <path>` flag：
>
> - **單 URL collector**（`web_resource_collect.mjs` v0.1）：提供 `--source-registry` 時，於 fetch 前對 `--url` 套用 gate；未命中 approved → exit 0 不 fetch、不寫檔（保留與 pipe 版一致的「gate 拒絕不算錯誤」語義）。
> - **Pipe collector**（`collect_discovered_resources.mjs` v0.2）：提供 `--source-registry` 時，於 eligible 之前對每筆 discovered URL 套用 gate；未命中 approved 的 URL 一律 skipped + 對應 reason code，不進入 fetch / HEAD 流程。
>
> URL normalization 規則：lowercase host / strip trailing slash（pathname=/ 除外）/ 保留 search / 移除 fragment；**絕對不做** domain-level 放行。
>
> 詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) E-bis-5 段。

---

## H. Duplicate URL / 重抓策略

當前實作（v0.1）：

- **同一 URL 重跑時 generated JSON 完全覆寫**——僅保留最新一次抓取的結果，舊內容遺失。
- **無歷史版本機制**——不寫 `data/imported/history/` 或時間戳檔名。
- **無多 URL 批次模式**——一次 CLI 呼叫只處理一個 URL。

未來批次模式（屬 P3-10-D 後續刀數）建議規範：

- **去重 key**：使用 `normalizedUrl`（將 scheme 統一為 https、移除 trailing slash、移除 fragment / utm_*、按字典序排序 query params）+ `sourceDomain`；同 normalizedUrl 視為同來源。
- **保留 retrievedAt**：每筆都帶 `retrievedAt`，批次模式應在 source-document array 內保留同 URL 多次抓取記錄（按 retrievedAt 排序）。
- **更新策略候選**：
  - A. **always replace**：批次模式遇到既有 normalizedUrl 直接以新 fetch 結果取代（v0.1 等同；簡單但會丟失歷史）。
  - B. **append history**：保留所有歷史抓取，array 內按 retrievedAt 由新到舊；reviewer 可比對內容變化。
  - C. **diff-only append**：只在 cleanedText hash 與既有最新版本不同時才 append；介於 A / B 之間。
- **是否保留歷史版本留待後續決策**：目前傾向 P3-10-D 後續實作時走 B（append history），預設保留全部抓取記錄、靠 reviewStatus + warnings + retrievedAt 排序在 UI 上顯示；但**不是本檔最終決策**，等 collector 有實際多次抓取需求時再敲定。

**v0.1 注意**：因為是覆寫式，使用者跑多 URL 時若直接 chain CLI 呼叫，每次都會把上一次結果蓋掉；想保留多筆請手動 `mv` 到不同檔名，或等 P3-10-D 後續批次模式上線。

---

## I. Output JSON 欄位（P3-10-D 補強）

P3-10-D 在原 schema 之上補了三個欄位，**保持向後相容**（example JSON 仍可用）：

| 欄位 | 適用模式 | 值 | 用途 |
| --- | --- | --- | --- |
| `mode` | 兩者 | `"index-only"` / `"full-text"` | 標示這筆 entry 是哪種模式產的，未來合併 array 時可區分 |
| `retrievedAt` | index-only（既有）+ **full-text 新增** | ISO 8601 | full-text 之前只有 `importedAt`，補一致 |
| `warnings` | 兩者新增 | `Array<{ code, message }>` | 標示異常（non-2xx / non-HTML 等）；正常情況為空陣列 |

example JSON（`data/imported/*.example.json`）刻意**不補這三欄**——保留 v0.1 原貌；generated JSON 才會出現。reviewer / 後續 normalizer 應該對 example / generated 兩種 schema 都相容。

---

## J. 版本

- **v1.4**（2026-05-15，P3-10-N：Collector / Normalizer approved_for_import gate）：G 段尾段重寫——P3-10-N 已落地程式層 gate；`scripts/web_resource_collect.mjs` 新增 optional `--source-registry <path>` flag，提供時於 fetch 前 gate（exit 0 不 fetch、不寫檔當 gate 拒絕）；pipe 版 `scripts/collect_discovered_resources.mjs` v0.2 同樣新增 `--source-registry` flag。URL normalization 規則：lowercase host / strip trailing slash / 保留 search / 移除 fragment；不做 domain-level 放行。
- **v1.3**（2026-05-14，P3-10-L：source-first 邊界補充）：G 段尾段補 source-first 邊界——上游應只把 source registry `approved_for_import` 的 URL 餵 collector；未來批次 / pipe 模式應檢查 source registry。**本輪不改 collector 程式碼、不改既有 example JSON**；純文件補一層 source-first 邊界說明。
- **v1.2**（2026-05-13，P3-10-D-3 微調）：F 段尾段補 P3-10-D-3 pipe 落地說明；`scripts/web_resource_collect.mjs` 加 `export` + `main()` 包進 entry-script 判斷（CLI 行為完全不變）；新增 `data/imported/source-documents.batch.generated.json` 排除到 `.gitignore`。**collector 核心邏輯與輸出 JSON 結構皆未改**。
- **v1.1**（2026-05-13，P3-10-D 補強）：補 `warnings: []` 陣列、`mode` 欄位、`retrievedAt` 對齊；non-HTML 跳過 regex 解析；non-2xx 仍寫檔但帶 warning；G / H / I 三段新增到本檔。collector 行為仍向後相容 example JSON，腳本 `COLLECTOR_VERSION` 仍為 `web_resource_collect.mjs@v0.1`（屬補強、非破壞性升級）。
- **v1**（2026-05-13）：第一版——P3-10-B 規劃文件 + `scripts/web_resource_collect.mjs` 最小 CLI 原型；支援 index-only / full-text；候選偵測為簡單 regex；無依賴新增（Node 內建 fetch + regex）。
