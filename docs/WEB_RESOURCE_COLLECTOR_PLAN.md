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

---

## G. 版本

- **v1**（2026-05-13）：第一版——P3-10-B 規劃文件 + `scripts/web_resource_collect.mjs` 最小 CLI 原型；支援 index-only / full-text；候選偵測為簡單 regex；無依賴新增（Node 內建 fetch + regex）。
