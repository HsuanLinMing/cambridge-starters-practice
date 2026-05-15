# Discovery Crawler 規劃（P3-10-D-2）

> 對應 P3-10「正式練習資料補齊與 web resource collector」P3-10-D 後續。本檔規劃**自動發現題庫 / 歷屆考題 / 學習資源來源**的 discovery crawler 架構與 CLI 介面。
>
> 本檔屬**規劃文件**；最小 CLI 原型於 `scripts/discover_resources.mjs`（v0.1，本輪只支援 manual-json provider）。

最新整理：2026-05-13。

---

## A. 目標

P3-10-D 第一輪已讓 `scripts/web_resource_collect.mjs` 能對「使用者提供的 URL」做 index-only / full-text 抓取與分析；但目前的瓶頸是：

- 使用者每次都得**手動找 URL 餵給 collector**，沒有「自動找候選來源」的能力。
- collector 無法主動發現新的 Cambridge Starters 練習資源、歷屆考題、worksheet、單字表。

**Discovery crawler 用於自動尋找下列類型的候選來源：**

- Cambridge Starters 題庫
- Cambridge Starters 歷屆考題
- Pre A1 Starters sample paper
- Pre A1 Starters worksheet
- Starters vocabulary / word list
- Starters listening practice
- Starters reading writing practice
- Starters learning resources
- 其他與 Pre A1 Starters 相關的教學資料 / 練習頁

Discovery crawler 與 `web_resource_collect.mjs`（content collector）職責分明：

| 工具 | 範圍 | 不做 |
| --- | --- | --- |
| **discovery crawler**（本檔） | search query → search provider → candidates → URL normalization / dedupe / classify → resource index | **不抓 URL 內容**；**不下載 PDF / image / audio**；**不轉題目** |
| **content collector**（`web_resource_collect.mjs`） | 已知 URL → fetch HTML → 抽 metadata / cleanedText / candidates → source-document | **不發現新 URL**；**不分類 query** |
| **AI normalizer**（P3-10-E，未實作） | source-document → 對齊 schema 草稿 | **不直接 commit 正式題庫** |

對應的長期目標：建立一條 **「自動發現 → collector 抓取 → AI normalize → 人工審核 → approved_for_practice」** 的單向流水線，讓「題庫補齊」從人工逐 URL 找升級為「人工只負責審核 + 把關」。

---

## B. 資料流程

完整 discovery → collector → normalizer 串接（本檔只實作步驟 1~7；8 起屬其他子計畫）：

```
1. query set                  （discovery-queries.example.json，定義要找什麼）
   ↓
2. search provider            （manual-json / mock / future-bing-api / future-google-cse / future-serpapi）
   ↓
3. search results             （search-results.example.json，每筆含 title / url / snippet）
   ↓
4. URL normalization          （統一 https / 移除 trailing slash / 移除 fragment / 移除 utm_* / 排序 query params）
   ↓
5. URL dedupe                 （以 duplicateKey 去重；同 URL / 同 normalized URL 視為同來源）
   ↓
6. source classification      （依 title / snippet / url 推 sourceType / resourceType / level / detectedExamParts）
   ↓
7. resource index             （discovered-resources.generated.json，每筆含 score / reasons / shouldCollect）
   ↓
[7.5 source registry gate]    （**P3-10-L**：將 shouldCollect=true 條目登錄 source-registry，pending_review；人工審核 → approved_for_import）
   ↓
8. collector queue            （把 source registry `approved_for_import` 的條目餵給 web_resource_collect.mjs；屬 P3-10-D-3）
   ↓
9. collector full-text / metadata 抓取（既有 P3-10-D collector）
   ↓
10. AI normalizer             （屬 P3-10-E）
```

> **步驟 7.5（source-first gate，P3-10-L，2026-05-14；P3-10-M build CLI 已落地，2026-05-15）**：discovery 找到的候選 URL **不直接餵 collector**；應先透過 `scripts/build_source_registry.mjs` 自動轉成 `data/imported/source-registry.generated.json` 的 pending_review / needs_manual_check entries，再人工審核標 `approved_for_import` 後才能進步驟 8+。**P3-10-M 已落地 build CLI**（discovery → registry generated 一步到位、deterministic、保守推論、絕不輸出 `approved_for_import`）；下一刀 collector / normalizer 的 program-layer source-registry gate 屬未來範圍。詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) E-bis 段。

每一層都應該**可重跑、可審計**：

- discovery CLI 重跑覆寫 `discovered-resources.generated.json`；
- 不污染 `*.example.json`；
- 不寫正式 `data/p3-example-questions.json`；
- 不下載任何網頁內容、不發 HTTP 請求到候選 URL 本身（只讀 search-results 餵入的 JSON）。

---

## C. 搜尋 query 設計

Query 分四類（對應 `data/imported/discovery-queries.example.json`）：

### C-1. official / sample paper

| query | language | targetLevel |
| --- | --- | --- |
| `Cambridge Pre A1 Starters sample paper` | en | Pre A1 Starters |
| `Pre A1 Starters sample test PDF` | en | Pre A1 Starters |
| `Cambridge Starters listening sample paper` | en | Pre A1 Starters |
| `Cambridge Starters reading writing sample paper` | en | Pre A1 Starters |

### C-2. 題庫 / practice

| query | language | targetLevel |
| --- | --- | --- |
| `Cambridge Starters practice questions` | en | Pre A1 Starters |
| `Pre A1 Starters practice test` | en | Pre A1 Starters |
| `Starters reading writing practice` | en | Pre A1 Starters |
| `Starters listening practice` | en | Pre A1 Starters |

### C-3. worksheet / vocabulary

| query | language | targetLevel |
| --- | --- | --- |
| `Pre A1 Starters word list` | en | Pre A1 Starters |
| `Cambridge Starters vocabulary worksheet` | en | Pre A1 Starters |
| `Starters picture vocabulary` | en | Pre A1 Starters |
| `Starters spelling worksheet` | en | Pre A1 Starters |

### C-4. 中文來源

| query | language | targetLevel |
| --- | --- | --- |
| `劍橋 Starters 題庫` | zh-TW | Pre A1 Starters |
| `劍橋兒童英檢 Starters 歷屆試題` | zh-TW | Pre A1 Starters |
| `Pre A1 Starters 練習題` | zh-TW | Pre A1 Starters |
| `Starters 單字表` | zh-TW | Pre A1 Starters |
| `劍橋 Starters 聽力 練習` | zh-TW | Pre A1 Starters |

Query 結構（對應 example JSON 欄位）：

- `id`：唯一識別字串（建議 `q-<lang>-<area>-<nnn>`）
- `query`：實際送 search provider 的 query 文字
- `language`：`en` / `zh-TW`
- `targetLevel`：通常為 `Pre A1 Starters`（未來可擴充 Movers / Flyers）
- `targetResourceTypes`：陣列；可包含 `sample_paper` / `worksheet` / `vocabulary_list` / `page` / `listening_practice` / `reading_writing_practice` 等
- `expectedExamParts`：陣列；可包含 `L1`~`L4` / `RW1`~`RW5`（未來可加 `SP1`~`SP4`）
- `notes`：人工備註

---

## D. Search provider 策略

本專案先支援 provider abstraction；P3-10-D-2 v0.1 只實作 `manual-json` 與 `mock`，P3-10-D-2B v0.2 新增 `brave-search` 真實 provider；其他外部 API 仍屬未來範圍。

### D-1. Provider 比較表（評估後決策）

| provider | 是否本輪實作 | 是否需 API key | 易接 Node fetch | result 易轉 title/url/snippet/rank | 免費額度 / 成本 | 優點 | 缺點 | 建議優先度 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| **Brave Search API** | ✅ v0.2 | ✅ `BRAVE_SEARCH_API_KEY` | ✅ 簡單 REST，headers 帶 `X-Subscription-Token`，回 JSON | ✅ `web.results[]` 含 `title` / `url` / `description`，可直接對應 | **使用者自行依官方頁面確認**（有免費 tier 也可付費升級；不在本檔硬寫） | (1) 獨立索引、不依賴 Google / Bing；(2) 隱私導向、無 user tracking；(3) JSON 簡單 | (1) 索引較 Google 小，long-tail query 可能漏；(2) 中文長尾 query 命中率可能低於 Google | **1（本輪實作）** |
| Tavily Search API | ⬜ | ✅ `TAVILY_API_KEY` | ✅ JSON REST | ✅ 為 LLM-friendly 設計，欄位整齊 | **使用者自行依官方頁面確認** | (1) LLM-friendly response shape；(2) 提供 raw / summary 兩種 mode；(3) Free tier 額度給 LLM 應用設計 | (1) 較新、長期穩定性需觀察；(2) 部分 query 結果偏 LLM 摘要而非「原始 web search」 | 2（Brave 不適合 / 不夠時的備援） |
| Bing Web Search v7 | ⬜ | ✅ Azure key | ✅ JSON REST，但 Azure 流程較重 | ✅ `webPages.value[]` | **使用者自行依官方頁面確認**（Azure quota） | (1) 索引廣、中文友善；(2) 與 Google 結果差異大、互補性高 | (1) 需 Azure account；(2) 計費較複雜；(3) Microsoft 對 API 政策變動較頻 | 3 |
| Google Programmable Search / Custom Search JSON API | ⬜ | ✅ API key + cx（CSE 設定 ID） | ✅ JSON REST，但需先建 CSE | ✅ `items[]` 含 `title` / `link` / `snippet` | **使用者自行依官方頁面確認**（free quota 較低） | (1) Google 索引覆蓋最廣 | (1) free quota 每天上限低；(2) 必須先建 Programmable Search Engine、cx 設定流程重；(3) **無法用同 endpoint 取得「全 web」結果**——只能限定到 CSE 設定的網域子集 | 4 |
| SerpAPI | ⬜ | ✅ `SERPAPI_API_KEY` | ✅ JSON REST | ✅ 整理過的 organic results | **使用者自行依官方頁面確認**（純付費） | (1) 可代理多個 search engine（Google / Bing / DuckDuckGo 等）；(2) result schema 統一 | (1) **純付費、沒有真正的 free tier**；(2) 走第三方代理會違反一些 search engine 的 ToS（SerpAPI 自身已處理，但專案需評估） | 5 |

**本輪選擇 Brave Search API 的理由**：

1. 任務單明示優先順序為 Brave > Tavily > Bing > Google CSE > SerpAPI；Brave 為第一順位。
2. Brave Search API 的 REST endpoint 與 response shape **最接近本專案既有 search-results.json schema**（title / url / description / rank），對應成本最低。
3. 中文 query 雖然不一定完美命中，但 Brave 對 starters / sample paper 等英文 query 已足夠；中文長尾 query 仍可在後續用 manual-json 補。
4. **不硬編價格 / quota**——使用者必須依官方頁面確認方案；本檔僅標 placeholder。
5. 後續若 Brave 不適用，可依同 adapter pattern 增 `tavily-search` 等 provider（未實作但 CLI HELP 已預留 future-* 字面量）。

### D-2. 本輪硬邊界

- ❌ **不硬編 API key**——CLI 沒有 `--api-key` flag；key 一律從 env `BRAVE_SEARCH_API_KEY` 讀；缺 key 時 **exit 2** 並印申請步驟。
- ❌ **不直接爬 Google / Bing 搜尋結果頁**——任何 search result 都來自合法 search API（本輪走 Brave）或人工整理（manual-json）。
- ❌ **不偽裝 user-agent**——Brave provider 標 `cambridge-starters-practice-discovery/0.2`；CLI 不模擬瀏覽器 UA、不繞 captcha。
- ❌ **不在 CLI 內呼叫 OpenAI / 任何雲端 AI API**——discovery CLI 是 search + rule-based 分類，無 AI。
- ❌ **不 follow discovered URL**——discovery 自身只取 search result 的 title / url / snippet；不對候選 URL 發 HTTP 請求（那是 collector 的職責）。
- ❌ **不自動 pipe 給 collector**——pipe 屬 P3-10-D-3。
- ❌ **不 commit `.env` / `.env.local`**——既有 `.gitignore` 已排除 `.env*`、`!.env.example`。
- ❌ **不 commit `search-results.generated.json` / `discovered-resources.generated.json`**——已 gitignore。
- 若 `--provider` 不是 `manual-json` / `mock` / `brave-search`，CLI 必須 **exit 2** 並印明確提示「未支援的 provider」。

---

## E. URL 分類規則

Discovery 階段對每筆 search result 做粗略分類；最終分類由 normalizer / human review 修正。

### E-1. sourceType（對齊 `docs/PRACTICE_DATA_IMPORT_PLAN.md` B 段 + 縮減為 4 種）

| sourceType | 含義 | 舉例 hostname |
| --- | --- | --- |
| `official` | Cambridge English 官方域名 | `cambridgeenglish.org` / `cambridge.org` |
| `third_party` | 第三方教學網站 / 出版社 / 部落格 | `cambridgeesol.com.tw` / `yle.tw` / `certificate.tw` / `oxfordowl.co.uk` 等 |
| `user_verified` | 使用者預先驗證過的網路來源（與 user_provided 差別：來自網路抓取後使用者確認 OK） | 由 query config 內 `notes` 或 search result `sourceProvider` 標識 |
| `unknown` | 分類規則無法判定 | 預設 fallback |

Discovery 階段預設 fallback `sourceType: unknown`；reviewer / normalizer 後續可改。

### E-2. resourceType

| resourceType | 觸發條件（任一） |
| --- | --- |
| `search_result` | 預設 fallback（純 search engine entry） |
| `page` | 普通 HTML 頁面、無特定子類型 |
| `pdf` | URL 結尾 `.pdf` 或 title / snippet 含 `PDF` |
| `worksheet` | title / snippet / url 含 `worksheet` |
| `vocabulary_list` | title / snippet 含 `word list` / `vocabulary list` / `wordlist` / `單字表` |
| `sample_paper` | title / snippet 含 `sample paper` / `sample test` / `mock test` / `歷屆` / `歷屆試題` |
| `listening_practice` | title / snippet 含 `listening practice` / `聽力練習` / `聽力測驗` |
| `reading_writing_practice` | title / snippet 含 `reading writing practice` / `reading & writing` / `閱讀練習` / `寫作練習` |
| `image` | URL 結尾 `.png` / `.jpg` / `.jpeg` / `.gif` / `.svg` / `.webp` |
| `audio` | URL 結尾 `.mp3` / `.m4a` / `.wav` / `.ogg` |
| `video` | hostname 含 `youtube` / `youtu.be` / `vimeo` / `dailymotion`，或 URL 結尾 `.mp4` |
| `unknown` | 規則無法判定（補底） |

優先順序：assets（pdf / image / audio / video）→ 特定主題（sample_paper / vocabulary_list / worksheet / listening / reading_writing）→ page / search_result 通用補底。

### E-3. level

| level | 觸發條件 |
| --- | --- |
| `Pre A1 Starters` | title / snippet / url 含 `pre a1` / `pre-a1` / `starters` / `劍橋兒童英檢` / 中文「劍橋 Starters」 |
| `A1 Movers` | 含 `movers` / `劍橋 Movers` |
| `A2 Flyers` | 含 `flyers` / `劍橋 Flyers` |
| `unknown` | 規則無法判定 |

本輪 query 全部對 Pre A1 Starters；Movers / Flyers 結果**保留但標 level 不同**，方便人工 review；不丟資料。

### E-4. detectedExamParts

| part | 觸發 keyword |
| --- | --- |
| `L1` | `listening part 1` / `L1` / `Listen and draw lines` |
| `L2` | `listening part 2` / `L2` / `Listen and write` |
| `L3` | `listening part 3` / `L3` / `Listen and tick` |
| `L4` | `listening part 4` / `L4` / `Listen and colour` |
| `RW1` | `reading writing part 1` / `RW1` / `Yes / No` / `Tick or Cross` |
| `RW2` | `reading writing part 2` / `RW2` / `Read and write` |
| `RW3` | `reading writing part 3` / `RW3` / `spelling` / `Look at the picture, write the word` / `拼字` |
| `RW4` | `reading writing part 4` / `RW4` / `fill in the gap` / `gap-fill` / `填空` |
| `RW5` | `reading writing part 5` / `RW5` / `Read the story` / `配對` |
| `unknown` | 預設補底 |

可同時匹配多個（一個 page 可能同時含 L1 / L2 / RW1 等多個 part）；結果為陣列。

---

## F. 排除 / 降權規則

本檔規劃下列規則，**不一定本輪全部實作完整**；先做基本版（明顯無關 / shopping / Movers/Flyers / duplicate URL），其餘留給後續。

### F-1. 明顯無關內容降權

- 觸發 keyword：`amazon` / `ebay` / `buy now` / `shop` / `cart` / `購物` / `購買` / 含明顯 product page schema
- 行動：`score -= 3`、`reasons` push `"shopping_or_product_page"`、`shouldCollect = false`

### F-2. 非 Starters / 非 Pre A1 降權

- 觸發：level === `unknown` 且 title / snippet 完全不含 `starters` / `pre a1` / `劍橋` 等核心關鍵字
- 行動：`score -= 2`、`reasons` push `"not_pre_a1_starters"`、`shouldCollect = false`

### F-3. Movers / Flyers 保留但降權

- 觸發：level === `A1 Movers` 或 `A2 Flyers`
- 行動：`score -= 1`、`reasons` push `"non_target_level"`、`shouldCollect` 仍可為 `true`（待 reviewer 決定）

### F-4. shopping / product page 降權

- 同 F-1（兩者部分重疊；F-1 偏一般電商、F-4 偏 product listing）。
- 觸發：URL 含 `/product/` / `/products/` / `/store/` / `/buy/`
- 行動：`score -= 3`、reasons 同 F-1

### F-5. duplicate URL 去重

- 觸發：兩筆以上 search result 對應同一 `duplicateKey`（見下）
- 行動：保留第一筆（保留最高 score 的那筆）、其餘 reasons push `"duplicate_url"`、`shouldCollect = false`
- 不刪資料；保留所有候選便於 reviewer 看到重複情況

### F-6. tracking query 移除

- 觸發：URL 含 `utm_*` / `gclid` / `fbclid` / `mc_*` / `ref=` 等 tracking parameters
- 行動：normalizedUrl 移除這些 params；不扣 score、不影響 shouldCollect（這是 URL 規範化、不是品質判斷）

### F-7. 內容太短 low confidence

- 觸發：snippet 長度 < 20 字
- 行動：`score -= 1`、`reasons` push `"snippet_too_short"`、`shouldCollect` 仍可為 `true`（snippet 短不代表內容差）

### F-8. duplicateKey 規則

`duplicateKey` 用於去重，依下列順序產出：

1. 取 normalizedUrl 的 `protocol + hostname + pathname`（去 search params / fragment）
2. 全部轉小寫
3. trailing slash 統一移除

例：`https://www.yle.tw/download.asp?utm_source=fb&id=3` → `duplicateKey: "https://www.yle.tw/download.asp"`

同 duplicateKey 即視為同來源；reviewer 可在 review 階段決定要不要併或保留多筆。

---

## G. 與現有 collector 的關係

Discovery crawler **只負責找 URL 與分類候選來源**；它**不抓網頁內容**、**不下載任何 asset**、**不轉題目**。

| 階段 | 工具 | 輸入 | 輸出 | 是否實際發 HTTP |
| --- | --- | --- | --- | --- |
| 1. **discovery** | `scripts/discover_resources.mjs`（v0.2） | `discovery-queries.example.json` + `search-results.example.json` 或 Brave Search API | `discovered-resources.generated.json` + `search-results.generated.json` | manual-json/mock ❌；brave-search ✅ |
| 2. **discovery → collector pipe**（P3-10-D-3 本輪新增） | `scripts/collect_discovered_resources.mjs`（v0.1） | `discovered-resources.generated.json` 內 `shouldCollect=true` 條目 | `source-documents.batch.generated.json`（batch 結構） | ✅（HTML 走 collector，asset 只 HEAD） |
| 3. **collector**（單 URL 模式仍可用） | `scripts/web_resource_collect.mjs`（P3-10-B / D 既有） | 單一 URL | `resource-index.generated.json` 或 `source-document.generated.json` | ✅ |
| 4. **AI normalize** | （未實作，P3-10-E） | source-document | `normalized-questions.generated.json` | ❌ |
| 5. **human review** | 維護者 | normalized-questions | reviewStatus 升級 | ❌ |
| 6. **commit 正式題庫** | 維護者 | approved_for_practice 條目 | `data/p3-example-questions.json` | ❌ |

**P3-10-D-3 pipe 與 collector 的分工**：
- pipe `collect_discovered_resources.mjs` **重用** collector 的 `fetchUrl` / `buildSourceDocumentEntry` / `buildResourceIndexEntry` 三個 helper（透過 ESM `export` / `import` 整合，避免邏輯重複）。
- pipe **只對 HTML** 走 collector 完整 full-text / index-only 流程；對 PDF / image / audio / video **只 HEAD** 拿 metadata（content-type / content-length / status），**body 不下載 / 不解析**。
- pipe **不寫**單筆的 `resource-index.generated.json` / `source-document.generated.json`（保留給 collector CLI 單 URL 模式用）；統一寫 batch 結構 `source-documents.batch.generated.json`。
- pipe 不接 OpenAI、不轉正式題庫；HTML 候選 `extractedCandidates` 仍只是 regex 探測、不是題目。

### Collector mode 對應建議

`discovered-resources.generated.json` 每筆會帶 `collectorMode`，給未來 pipe 模式參考（本輪不實作 pipe）：

| resourceType | 建議 collectorMode | 備註 |
| --- | --- | --- |
| `page` / `worksheet` / `vocabulary_list` / `sample_paper` / `reading_writing_practice` / `listening_practice` | `full-text` | 抓 HTML 正文與 candidates |
| `pdf` | `index-only`（asset-aware 未來實作前先 index）；P3-10 後續刀加 PDF parser 時改為 `asset-aware` | PDF 需先評估 dependency |
| `image` | `index-only`（asset-aware future） | 不下載；只記 URL / alt |
| `audio` | `index-only`（asset-aware future） | 同 image |
| `video` | `index-only` | 影片需另設計（屬未來範圍） |
| `search_result` / `unknown` | `index-only` | 補底 |

**本輪不實作自動 pipe**：discovery 跟 collector 之間仍靠人工挑選；自動 pipe（讀 `discovered-resources.generated.json` 批次跑 collector）屬 P3-10-D-3 範圍。

---

## H. discovery scoring 規則（v0.1）

簡單 rule-based 加分扣分；輸出 `score`（任意整數，正負皆可）與 `reasons`（陣列）供 reviewer 看。

### H-1. 加分

| 條件（title / snippet / url 任一觸發） | 加分 | reasons |
| --- | --- | --- |
| 含 `starters`（不分大小寫） | +3 | `keyword_starters` |
| 含 `pre a1` / `pre-a1` | +3 | `keyword_pre_a1` |
| 含 `cambridge` | +2 | `keyword_cambridge` |
| 含 `sample paper` / `sample test` / `mock test` | +2 | `keyword_sample_paper` |
| 含 `practice` / `practice test` / `practice questions` | +1 | `keyword_practice` |
| 含 `worksheet` | +1 | `keyword_worksheet` |
| 含 `word list` / `vocabulary list` / `wordlist` | +2 | `keyword_word_list` |
| 含 `listening practice` / `listening test` | +1 | `keyword_listening` |
| 含 `reading writing` / `reading & writing` | +1 | `keyword_reading_writing` |
| 中文含 `劍橋` | +2 | `zh_keyword_cambridge` |
| 中文含 `Starters`（夾在中文裡） | +3 | `zh_keyword_starters` |
| 中文含 `兒童英檢` | +2 | `zh_keyword_yle` |
| 中文含 `練習題` / `練習` | +1 | `zh_keyword_practice` |
| 中文含 `歷屆` / `歷屆試題` | +2 | `zh_keyword_past_paper` |
| 中文含 `單字表` / `字彙表` | +2 | `zh_keyword_word_list` |

### H-2. 扣分

| 條件 | 扣分 | reasons |
| --- | --- | --- |
| 明顯 product / shopping page（F-1 / F-4） | -3 | `shopping_or_product_page` |
| level === unknown 且無核心關鍵字（F-2） | -2 | `not_pre_a1_starters` |
| Movers / Flyers（F-3，非本輪目標） | -1 | `non_target_level` |
| duplicate URL（F-5） | -2 | `duplicate_url` |
| snippet 太短（F-7） | -1 | `snippet_too_short` |

### H-3. shouldCollect 規則

- 預設 `shouldCollect = true`
- 觸發 F-1 / F-2 / F-5 任一條件時 `shouldCollect = false`
- F-3（Movers/Flyers）/ F-7（snippet 太短）只扣分、不影響 shouldCollect
- 最終 score < 0 自動 `shouldCollect = false`、reasons push `"score_below_zero"`

### H-4. reviewStatus

discovery output 統一給 `reviewStatus: "discovered_candidate"`（discovery 自有狀態、未進 P3-10-C 5 種 reviewStatus 狀態機；只在 discovery 階段使用）。

reviewer 後續手動把 shouldCollect = true 的條目挑出來餵 collector，才會進入 `imported_raw` → ... → `approved_for_practice` 流程。

---

## I. CLI 設計

實作於 `scripts/discover_resources.mjs`（v0.1，本輪最小原型）。

### 基本用法

**離線模式（manual-json / mock）**：

```bash
node scripts/discover_resources.mjs \
  --provider manual-json \
  --input data/imported/search-results.example.json \
  --queries data/imported/discovery-queries.example.json \
  --out data/imported/discovered-resources.generated.json
```

**真實 search provider（brave-search）**：

```bash
BRAVE_SEARCH_API_KEY=xxxxxxxx \
node scripts/discover_resources.mjs \
  --provider brave-search \
  --query-file data/imported/discovery-queries.example.json \
  --limit-per-query 5 \
  --query-limit 20 \
  --search-out data/imported/search-results.generated.json \
  --out data/imported/discovered-resources.generated.json
```

### 支援的 flag

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--provider` | 必填 | — | `manual-json` / `mock` / `brave-search`；其他值 exit 2 |
| `--input` | manual-json / mock 必填 | — | search results JSON 路徑 |
| `--queries` | manual-json / mock 必填 | — | discovery queries JSON 路徑 |
| `--query-file` | brave-search 必填（亦可用 `--queries`） | — | discovery queries JSON 路徑 |
| `--limit-per-query` | 選填（brave-search） | `5` | 每 query 最多取 N 筆 result（Brave 上限 20） |
| `--query-limit` | 選填（brave-search） | `20` | 本次最多跑 N 條 query（防呆，避免一次跑光 API quota） |
| `--search-out` | 選填（brave-search） | 無 | search-results.generated.json 寫檔路徑；不指定則不寫 |
| `--out` | 選填 | `data/imported/discovered-resources.generated.json` | discovered-resources 寫檔路徑（覆寫式） |
| `--help` | 選填 | — | 印 usage |

### CLI 行為

1. 讀 queries JSON（manual-json / mock 與 brave-search 都需要）；manual-json / mock 額外讀 search-results JSON。
2. **跑 search provider**：
   - `manual-json` / `mock`：直接讀 `--input` 內的 batches。
   - `brave-search`：對每條 query 呼叫 Brave Search API（headers `X-Subscription-Token: <key>`），每兩條 query 間 sleep 500ms；單一 query fetch / parse 失敗時記錄 error、繼續下一條。
3. 對每筆 result：normalize URL（移除 fragment / utm_* / 排序 query params / 統一 https / 移除 trailing slash）→ 算 duplicateKey → 推 sourceType / resourceType / level / detectedExamParts → 計算 score / reasons / shouldCollect / collectorMode。
4. 對所有 result 做 dedupe（同 duplicateKey 保留 score 最高的、其餘標 duplicate_url 並扣 2 分）。
5. 真實 provider 若指定 `--search-out`，先寫 `search-results.generated.json`；最後寫 `--out` 指定的 `discovered-resources.generated.json`。

### 不做的事

- ❌ 不抓網頁、不發 HTTP 請求到候選 URL（discovery 不 follow URL）
- ❌ 不下載圖片 / PDF / 音檔
- ❌ 不呼叫 OpenAI / 任何雲端 AI API
- ❌ 不寫正式 `data/p3-example-questions.json`
- ❌ 不爬 Google / Bing 搜尋結果頁；只走合法 search API
- ❌ 不自動 pipe 給 collector
- ❌ 不硬編 API key、不讀 `.env.local`（須 shell `export` 或 inline 注入）

### exit code

| 情況 | exit code |
| --- | --- |
| 成功 | 0 |
| 缺必填 flag / 讀檔失敗 / JSON parse 失敗 / 不支援的 provider / **brave-search 缺 API key** | 2 |
| 未預期錯誤 | 1 |

### Rate limit / safety

- 每兩條 query 之間 `await sleep(500)`，避免觸 provider rate limit（Brave free tier 多半 1 req/sec）。
- `--query-limit` 預設 **20**（任務單要求），避免不小心把 17 條 query 全跑光浪費 quota；可手動調小（如 `--query-limit 2`）。
- 單一 query fetch / 解析失敗時，**只記錄 error 並繼續下一條**——不中斷整批。失敗的 query 不會出現在 `search-results.generated.json` 中。
- HTTP timeout 預設 15000 ms（與 collector 一致）。

### Search results generated output 格式

每批：

```jsonc
{
  "queryId": "dq-en-official-001",
  "query": "Cambridge Pre A1 Starters sample paper",
  "provider": "brave-search",
  "searchedAt": "2026-05-13T03:00:00.000Z",
  "results": [
    {
      "title": "...",
      "url": "...",
      "snippet": "...",
      "sourceProvider": "brave-search",
      "rank": 1
    }
  ]
}
```

與既有 `search-results.example.json` 相容（後者沒有 `provider` / `searchedAt`；CLI 在 manual-json 模式會補上）。

---

## J. discovery output 欄位

對應 `data/imported/discovered-resources.example.json`，每筆含：

| 欄位 | 必填 | 說明 |
| --- | --- | --- |
| `id` | 必填 | `disc-<nnn>` |
| `sourceQueryId` | 必填 | 對應 `discovery-queries` 內的 `id` |
| `sourceQuery` | 必填 | 對應 query 字串本身 |
| `url` | 必填 | 原始 URL |
| `normalizedUrl` | 必填 | 規範化後的 URL（移除 utm_* / fragment / trailing slash） |
| `duplicateKey` | 必填 | 去重 key（見 F-8） |
| `title` | 看資料 | 由 search result 提供 |
| `snippet` | 看資料 | search result 摘要 |
| `sourceDomain` | 必填 | URL hostname |
| `sourceType` | 必填 | `official` / `third_party` / `user_verified` / `unknown`（discovery 階段 4 種） |
| `resourceType` | 必填 | E-2 表格 12 種其一 |
| `level` | 必填 | `Pre A1 Starters` / `A1 Movers` / `A2 Flyers` / `unknown` |
| `detectedExamParts` | 必填 | 陣列；E-4 表格 `L1`~`L4` / `RW1`~`RW5` 或 `["unknown"]` |
| `score` | 必填 | 整數（可正可負） |
| `reasons` | 必填 | 陣列，scoring 與分類過程的所有觸發理由（H-1 / H-2 / F-* 等） |
| `shouldCollect` | 必填 | `true` / `false` |
| `collectorMode` | 必填 | `full-text` / `index-only`（對應 G 段建議表） |
| `reviewStatus` | 必填 | discovery 自有狀態：`discovered_candidate`（單一值；未進 P3-10-C 5 狀態機） |
| `discoveredAt` | 必填 | ISO 8601 |

---

## K. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) | P3-10-D-2 條目 |
| [`docs/PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | 硬邊界仍維持（不部署、不下載官方素材） |
| [`docs/PRACTICE_DATA_PLAN.md`](./PRACTICE_DATA_PLAN.md) | umbrella 引用本檔 |
| [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) | sourceType 7 種字面量（discovery 階段先收斂為 4 種，normalizer / human review 可再細分） |
| [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md) | discovery output 條目 shouldCollect = true 後可餵 collector |
| [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) | normalizer 的 input 來源 |
| [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) | discovery 結果中 `sourceType: official` 仍走「人工瀏覽參考、不下載複製」邊界 |
| [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) | source-first gate（P3-10-L）：discovery 找到的條目**不直接餵 collector**，先進 source registry 人工審核 |

---

## L. 後續擴充

依重要性：

1. **接 Tavily / Bing / Google CSE / SerpAPI 等更多 provider**：依 D-1 比較表優先順序遞補；CLI HELP 已預留 `future-*` 字面量名稱，後續可改為 `tavily-search` / `bing-search` 等直接落地。
2. **discovery → collector pipe**（屬 P3-10-D-3）：讀 `discovered-resources.generated.json` 把 shouldCollect = true 的條目串給 `web_resource_collect.mjs` 批次跑。
3. **更聰明的分類規則**：用 AI 替代部分 rule-based 分類（屬 P3-10-E 範圍）。
4. **AI-based scoring upgrade**：rule-based scoring 改用 LLM 評估候選品質（屬 P3-10-E）。
5. **discovery dashboard**：UI 工具讓 reviewer 視覺化看到 discovered candidates，可批次 mark `interested` / `ignored`。
6. **歷史紀錄**：保留每次 discovery 跑的 timestamp + result snapshot，方便比對「新增了哪些 candidate」。
7. **`.env.local` 自動載入**：本腳本目前不自動讀 `.env.local`；未來可改為支援 Node 20+ `--env-file` 或 dotenv 解析。
8. **更細的 rate-limit 控制**：目前固定 500ms delay；未來可依 provider 動態（例如 Brave free tier 1 req/s 改 1100ms）。

本輪（P3-10-D-2B）已完成 1 的第一個 provider（Brave Search）；其他屬後續刀數 / E / F 範圍。

---

## N. Brave Search happy path 實測紀錄

> 2026-05-13：使用者已在本機完成 Brave Search API happy path 小量實測；CLI 端到端 fetch → search-results.generated.json → discovered-resources.generated.json 全鏈路驗證成功。

### N-1. 推薦的小量測試指令

第一次跑時請**務必**用 `--query-limit 1 --limit-per-query 1` 等小量參數，避免不小心打光 API quota：

```bash
# 透過 Node 20+ --env-file 載入 .env.local（推薦；無需 shell export）
node --env-file=.env.local scripts/discover_resources.mjs \
  --provider brave-search \
  --query-file data/imported/discovery-queries.example.json \
  --limit-per-query 1 \
  --query-limit 1 \
  --search-out data/imported/search-results.generated.json \
  --out data/imported/discovered-resources.generated.json
```

也可改用 shell `export`：

```bash
export BRAVE_SEARCH_API_KEY=<your-key>
node scripts/discover_resources.mjs --provider brave-search \
  --query-file data/imported/discovery-queries.example.json \
  --limit-per-query 1 --query-limit 1 \
  --search-out data/imported/search-results.generated.json \
  --out data/imported/discovered-resources.generated.json
```

或 inline 注入（不留在 shell history 須注意）：

```bash
BRAVE_SEARCH_API_KEY=<your-key> node scripts/discover_resources.mjs ...
```

> **注意**：腳本本身**不自動讀 `.env.local`**——必須走 `--env-file` / `export` / inline 三種方式之一。

### N-2. 使用者本機實測結果（2026-05-13）

實測指令：

```
node --env-file=.env.local scripts/discover_resources.mjs --provider brave-search \
  --query-file data/imported/discovery-queries.example.json \
  --limit-per-query 1 --query-limit 1 \
  --search-out data/imported/search-results.generated.json \
  --out data/imported/discovered-resources.generated.json
```

執行結果摘要：

| 項目 | 值 |
| --- | --- |
| provider | `brave-search` |
| query file | `data/imported/discovery-queries.example.json` |
| `--limit-per-query` | 1 |
| `--query-limit` | 1（實際只跑前 1 條 query） |
| query id 跑到 | `dq-en-official-001` |
| query 內容 | `Cambridge Pre A1 Starters sample paper` |
| Brave Search API 回傳 | 1 result |
| `search-results.generated.json` 寫檔 | ✅ 成功 |
| `discovered-resources.generated.json` 寫檔 | ✅ 成功 |
| discovered entries | 1 |
| shouldCollect=true | 1 |

回傳 search result：

| 欄位 | 值 |
| --- | --- |
| title | `Pre A1 Starters` |
| url | `https://www.lebusanglais.com/wp-content/uploads/2024/12/Pre-A1-Starters-Sample-Paper.pdf` |
| sourceProvider | `brave-search` |
| rank | 1 |

discovered resource：

| 欄位 | 值 |
| --- | --- |
| sourceType | `third_party` |
| resourceType | `pdf`（URL 結尾 `.pdf`，分類規則命中） |
| level | `Pre A1 Starters`（title / snippet 命中 `pre a1` 與 `starters`） |
| score | 8 |
| reasons | `keyword_starters` / `keyword_pre_a1` / `keyword_sample_paper` |
| shouldCollect | `true` |
| collectorMode | `index-only`（pdf 對應 index-only；asset-aware 屬未來範圍） |
| reviewStatus | `discovered_candidate` |
| provenance.discoveryVersion | `discover_resources.mjs@v0.2` |
| provenance.searchProvider | `brave-search` |

### N-3. 仍不代表正式題庫匯入完成

happy path 驗證 **只代表「discovery 階段成功從 Brave 拿到候選 URL 並完成分類 / scoring」**。正式練習資料補齊仍需走後續步驟：

- ⬜ **P3-10-D-3**：把 shouldCollect=true 的候選 URL pipe 給 `web_resource_collect.mjs` 抓 metadata / content（本輪不做）
- ⬜ **P3-10-E**：AI normalizer 把 source-document 轉題目草稿（需 OpenAI API）
- ⬜ **P3-10-F**：人工審核 + reviewStatus 升 `approved_for_practice`
- ⬜ **P3-10-K**：寫進 `data/p3-example-questions.json` 並上線 `/quiz`

特別提醒：**回傳的 PDF URL（`lebusanglais.com`）為第三方網站、屬 `third_party`**，不能直接複製其中題目 / 圖片 / 音檔到正式題庫；對齊 `docs/PRACTICE_DATA_IMPORT_PLAN.md` B 段硬邊界：第三方來源需確認授權、normalize 後仍須人工審核、圖片 / 音檔不直接使用、改自製 SVG / TTS。

### N-4. 安全提醒

- **`.env.local` 絕不 commit**——`.gitignore` 已排除 `.env*`、保留 `!.env.example`；本腳本不自動讀 `.env.local` 是刻意設計，避免 silent inclusion。
- **`*.generated.json` 絕不 commit**——`data/imported/search-results.generated.json` / `discovered-resources.generated.json` 都已加入 `.gitignore`，使用者實機跑完後 `git status` 不應出現這兩個檔案。
- **真實 API key 絕不出現在文件 / 回報 / log**——本檔僅以 `<your-key>` 佔位；CLI 也不會把 key 寫進任何 output JSON 或 stderr。
- 若使用者誤把中文句子（如「檢查 git 狀態」）貼進 zsh 觸發 `command not found`，**這是 shell 操作問題、不是腳本錯誤**；無需處理。

---

## M. 版本

- **v3.2**（2026-05-15，P3-10-M：Source registry generated workflow）：B 段步驟 7.5 補「P3-10-M build CLI 已落地」說明 —— `scripts/build_source_registry.mjs` v0.1 把 discovery 找到的 candidate URL 自動轉成 source-registry generated entries（**全部 pending_review / needs_manual_check，絕不 approved_for_import**），詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) E-bis 段。本輪**不改** discovery CLI 程式碼 / example JSON / scoring 規則；純文件補步驟 7.5 的工具落地說明。
- **v3.1**（2026-05-14，P3-10-L：正式來源優先匯入規則 + Source Registry）：B 段資料流程補步驟 7.5「source registry gate」——discovery 找到的候選 URL **不直接餵 collector**，應先登錄 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) 規範的 source registry，人工審核 `approved_for_import` 後才能進步驟 8+；K 段「與既有文件的關係」加 `docs/SOURCE_REGISTRY_PLAN.md` 對齊條目。**本輪不改 CLI 程式碼、不改既有 example JSON、不實作 7.5 的 gate CLI**——純文件補一層 source-first 邊界說明；正式 gate CLI 屬未來範圍。
- **v3**（2026-05-13，P3-10-D-3）：新增 `scripts/collect_discovered_resources.mjs` v0.1 discovery → collector pipe CLI；G 段補 pipe 與 collector 分工說明；`scripts/web_resource_collect.mjs` 小幅 refactor：把 `main()` 包進「是否為直接 CLI 呼叫」判斷 + 增加 `export { fetchUrl, buildResourceIndexEntry, buildSourceDocumentEntry, buildWarnings, COLLECTOR_VERSION, COLLECTOR_USER_AGENT, DEFAULT_TIMEOUT_MS }`（CLI 行為完全不變）；新增 `data/imported/source-documents.batch.generated.json` 排除到 `.gitignore`。**未做**：asset 下載 / PDF parser / AI normalizer / 多批次 history。
- **v2.1**（2026-05-13，P3-10-D-2B 補充紀錄）：新增 N 段「Brave Search happy path 實測紀錄」——記錄使用者本機 `node --env-file=.env.local` 小量實測（query-limit=1 / limit-per-query=1）成功取得 1 筆 PDF candidate（`lebusanglais.com` Pre A1 Starters sample paper）；補充 N-1 推薦小量測試指令（三種 env 注入方式）/ N-2 實測結果欄位明細 / N-3 仍未進入正式題庫的後續刀數提示 / N-4 安全提醒（.env.local / *.generated.json / API key / shell typo 排除）。**本輪不動 CLI 程式碼、不接其他 provider、不做 D-3 pipe、不做 normalizer**——純文件 / roadmap 同步。
- **v2**（2026-05-13，P3-10-D-2B）：新增 Brave Search 真實 provider（CLI v0.2）；補 D-1 5 provider 比較表 + D-2 硬邊界更新（API key 從 env 讀、缺 key exit 2 / 不偽裝 UA / 不爬搜尋結果頁）；I 段 CLI 設計補 `--query-file` / `--limit-per-query` / `--query-limit` / `--search-out` 4 個 flag + Rate limit / safety 段 + Search results generated 格式段；L 段後續擴充清單更新；J 段 search-results 格式向 example 相容。**未做**：Tavily / Bing / Google CSE / SerpAPI 落地；discovery → collector pipe；AI scoring；`.env.local` 自動載入。
- **v1**（2026-05-13，P3-10-D-2）：第一版——P3-10-D-2 規劃文件、自動發現題庫 / 歷屆 / 學習資源來源的 discovery pipeline 雛形；query config 4 類 / search provider 5 種（先支援 manual-json + mock）/ URL 分類 4 軸（sourceType / resourceType / level / detectedExamParts）/ scoring 規則 / 與 collector 的銜接；CLI 原型 `scripts/discover_resources.mjs` v0.1。**未做**：外部 search API（Bing / Google CSE / SerpAPI）/ 自動 pipe / AI 分類 / dashboard / 歷史紀錄。
