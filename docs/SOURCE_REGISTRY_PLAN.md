# 正式來源優先匯入規則 + Source Registry（P3-10-L）

> 對應 P3-10「正式練習資料補齊與 web resource collector」。本檔規範**正式匯入版題庫只能來自可追溯來源**——以官方 sample paper、官方學習資料、歷屆考題、可追溯來源的 Starters 練習資料為主；**不再用 AI / 自製題隨便補正式題庫數量**。
>
> 本檔屬**規劃文件**，不是強制 schema；實際題目欄位以 [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) 為準。
> 本檔與 [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) 並存：import plan 仍規範流程，本檔聚焦**來源優先性**與 source registry 結構。

最新整理：2026-05-14。

---

## A. 為什麼需要這份規劃

過去 P3-10-A ~ K 已建立完整的「discovery → collector → normalizer → review → approve → assemble paper」管線；但**管線通了不代表題目來源就合格**。截至 2026-05-14：

- `data/p3-example-questions.json` 13 題大多是 **`ai_generated` / `custom`** 自製題（其中 9 題 `ai_generated` / 4 題 `custom`）。
- 使用者明確要求：**正式匯入版以官方 / 歷屆 / 可追溯來源為主**，不要再用 AI / 自製題隨便補題庫數量。
- P3-10-K 第二刀 first practice paper preview 只是把現有 13 題重新組裝、**不代表正式題庫完成**。
- 後續 P3-10-H / I / J（題庫擴充）若繼續用 AI 補題，會違反使用者意圖。

因此本檔建立 **「source-first」原則**：**題目必須先有可追溯來源 → 來源經人工審核 approved_for_import → 才能進 normalizer / review queue / 正式題庫**。

---

## B. Source-first 原則

### B-1. 正式題庫只接受下列來源

| sourceKind | 進正式題庫主線 | 說明 |
| --- | --- | --- |
| `official_sample` | ✅ **主線** | Cambridge English 官方公開 sample paper（含 sample test PDF / handbook 附錄）；**人工瀏覽參考、不下載複製官方檔案** — 仍須與 [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) 硬邊界一致 |
| `official_learning_material` | ✅ **主線** | Cambridge English 官方學習資料、wordlist、test format 頁、preparation 頁、mock test toolkit 等公開可參考的官方文件 |
| `past_paper` | ✅ **主線** | 可追溯來源的歷屆考題（例如 YLE 台灣官方代理 / 認證代理發布的歷屆 sample paper）；**來源 URL 與發行機構必須明確**，不可只標 "past paper from internet" |
| `third_party_practice` | ⚠️ **輔助 / fallback** | 第三方教學網站、出版社、教師整理的 Starters 練習資料；**不可直接標 official_sample 或 past_paper**；reviewer 必須明確標 `third_party_practice` |
| `custom` | ⚠️ **輔助** | 維護者 / 教師 / 家長手寫題；必須明確標 `custom`，**不可偽裝為 official / past_paper** |
| `ai_generated` | ❌ **不得進正式題庫主線** | 僅允許作為**草稿 / 臨時練習 / 題型驗證**；**不得用來補正式題庫數量**；既有 13 題 ai_generated 視為**題型驗證 dev seed**、不視為正式匯入版完成依據 |
| `unknown` | ❌ **不得進正式題庫** | 來源不明 → reviewer 必須補來源或標 rejected |

### B-2. 規則總結

正式匯入版的主線是 `official_sample` / `official_learning_material` / `past_paper`。

- **`ai_generated` 不得用來補正式題庫數量**。可作為草稿 / 臨時練習 / 題型開發測試。
- **`custom` 題只能作為輔助或 fallback**，不應混入 official / past_paper 報告中（即不可在 paper-level `sourceMix` 統計上把 custom 數量併入 official 主線）。
- **第三方練習網站（third_party_practice）不可標為 official_sample 或 past_paper**——即使該網站宣稱「歷屆考題」，若該網站不是官方 / 不是官方認證的代理，仍只能標 `third_party_practice`。
- **來源不明的資料不得產生正式題**。
- `official_sample` / `past_paper` 題目必須保留 `sourceId` / `sourceUrl` / `documentTitle` / `page` 或 `section` hints（讓未來人工追溯來源時可重現）。
- `sourceMix` 必須誠實統計。Codex 驗收時可比對 `sourceMix` 與 source registry。

### B-3. 與既有 `QuestionSource` union 的關係

`lib/types.ts` 既有 `QuestionSource` union 仍是 **4 種字面量**（`official_sample` / `past_paper` / `ai_generated` / `custom`）。本檔的 `sourceKind` 是 source registry 用的**更細**字面量（7 種）：

- `official_sample` → 對應 `QuestionSource: "official_sample"`
- `official_learning_material` → 若衍生出正式題目，本身**應同樣對應 `official_sample`**（因為 Cambridge 學習資料屬官方公開資源）；reviewer 若認為「學習資料偏教學、不是 sample」可改 source 為 `custom` 並在 `reviewerNotes` 註記
- `past_paper` → 對應 `QuestionSource: "past_paper"`
- `third_party_practice` → 對應 `QuestionSource: "custom"`（**不能標 `official_sample` / `past_paper`**）；reviewer 應在 `reviewerNotes` 與 source registry 保留第三方來源 URL
- `custom` → 對應 `QuestionSource: "custom"`
- `ai_generated` → 對應 `QuestionSource: "ai_generated"`（但**不進正式題庫主線**）
- `unknown` → 不對應任何 `QuestionSource`；reviewer 必須補來源後再進流程

本輪**不擴張** `lib/types.ts` `QuestionSource` union；source registry 的 `sourceKind` 屬規劃層字面量。

---

## C. Source Registry Schema

Source registry 是 source-first 流程的**單一事實來源**（single source of truth）：在 collector / normalizer / reviewer 動工前，每一個候選來源都應先登錄、人工 review、標 `approved_for_import`，才能進下游 pipeline。

### C-1. 檔案位置與格式

- **example**：`data/imported/source-registry.example.json`（commit 進 repo，作為文件樣本）
- **generated**（未來）：`data/imported/source-registry.generated.json`（已在 `.gitignore` 排除規則內，新增實作刀數時補進 .gitignore）

### C-2. 必填欄位

每筆 source registry entry 至少包含：

| 欄位 | 型別 / 範圍 | 說明 |
| --- | --- | --- |
| `sourceId` | 字串 | 全域唯一 id，建議 `src-{nnn}` 或 `src-{kind}-{nnn}` |
| `title` | 字串 | 來源可讀名稱 |
| `sourceKind` | enum | 見 B-1 表 7 種字面量 |
| `sourceUrl` | 字串 (URL) | 來源 URL；human review 時可重現的入口 |
| `publisher` | 字串 | 發行機構名稱（例如 "Cambridge Assessment English" / "YLE 台灣" / "Example Worksheet Site"） |
| `publisherType` | enum | 見 C-3 表 5 種字面量 |
| `language` | 字串 | 主要語言（"en" / "zh-Hant" / "mixed"） |
| `level` | 字串 | "Pre A1 Starters" / "A1 Movers"（非目標等級會降權） |
| `exam` | 字串 | 例如 "Cambridge Starters" / "Cambridge Young Learners English" |
| `partsCovered` | 字串陣列 | L1 / L2 / L3 / L4 / RW1 / RW2 / RW3 / RW4 / RW5 / SP1~SP4 / "unknown" |
| `fileType` | enum | "html" / "pdf" / "image" / "audio" / "video" / "doc" / "unknown" |
| `accessType` | enum | "public" / "free_with_signup" / "paid" / "restricted" / "unknown" |
| `collectionStatus` | enum | 見 C-4 表 5 種字面量 |
| `reviewStatus` | enum | 見 C-5 表 4 種字面量 |
| `provenanceNotes` | 字串 | 來源追溯說明：發現方式 / 哪個 discovery query 找到 / 是否來自人工瀏覽 |
| `rightsNotes` | 字串 | 授權 / 著作權 / 使用條款摘要；human review 時的決策依據 |
| `collectedAt` | ISO 8601 / null | 第一次抓 metadata 的時間（discovery 階段；尚未 review approval 時可為 null） |
| `lastCheckedAt` | ISO 8601 / null | 最近一次人工檢查 / collector 重跑時間 |

### C-3. `sourceKind` 字面量（7 種）

對齊 B-1 表。允許值：

```
official_sample
official_learning_material
past_paper
third_party_practice
custom
ai_generated
unknown
```

### C-4. `publisherType` 字面量（5 種）

| publisherType | 說明 |
| --- | --- |
| `official` | Cambridge English / Cambridge Assessment 官方 |
| `school` | 學校 / 教育機構（含官方代理；例如 YLE 台灣作為 Cambridge YLE 官方代理） |
| `teacher` | 個別教師 / 教師整理的部落格 / 學習網站 |
| `third_party` | 第三方教學網站、出版社、商業練習平台 |
| `unknown` | 不確定發行機構（需 human review 後升 known 類型或 reject） |

### C-5. `collectionStatus` 字面量（5 種）

| collectionStatus | 說明 |
| --- | --- |
| `discovered` | discovery crawler 找到，但尚未抓 metadata |
| `collected_metadata` | collector index-only 完成，metadata 已抓 |
| `collected_text` | collector full-text 完成，cleanedText 已抓 |
| `collected_asset_metadata` | asset-aware HEAD only（PDF / image / audio metadata） |
| `failed` | collector 抓取失敗（404 / timeout / non-HTML 不可解析等） |

### C-6. `reviewStatus` 字面量（4 種）

| reviewStatus | 進下游 normalizer / review queue |
| --- | --- |
| `pending_review` | ❌ — 預設值；尚未人工檢查 |
| `approved_for_import` | ✅ — **只有此狀態才能進 normalizer / review queue** |
| `rejected` | ❌ — 授權不符 / 內容不適合 / 重複來源 等 |
| `needs_manual_check` | ❌ — 需要人工進一步確認（例如授權有疑慮、需要看 PDF 內容、需要驗證機構）|

**注意**：source registry 的 `reviewStatus` 規範**來源**是否可被使用；與 [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) D 段規範**單題** reviewStatus 的 5 種狀態不同層級——不要混淆。

---

## D. 匯入規則（硬邊界）

下列規則為**正式匯入版**的硬邊界，不接受例外：

### D-1. 只有 `reviewStatus: approved_for_import` 的 source 才能進 normalizer / review queue

- discovery crawler 找到 → 寫入 source registry → 預設 `reviewStatus: pending_review`
- 人工 review 來源（授權、內容適配性、發行機構可信度）→ 若通過 → 改 `approved_for_import`
- `pending_review` / `needs_manual_check` / `rejected` 一律**不能進** normalizer

### D-2. 來源不明的資料不得產生正式題

- 沒有 source registry entry 的資料 → 不可進 normalizer
- `sourceKind: unknown` 的 entry → 不可進 normalizer（必須先升 known 類型）
- 無 `sourceUrl` / 無 `publisher` 的 entry → 不可進 normalizer

### D-3. `official_sample` / `past_paper` / `official_learning_material` 題目必須保留來源追溯欄位

normalize 後的題目 `provenance` 欄位至少要有：

- `sourceId`（對應 source registry entry id）
- `sourceUrl`
- `documentTitle`（來源文件標題）
- `page` 或 `section`（在來源文件中的頁碼 / 區段名稱，**讓人工日後可追溯到原文**）

`custom` / `ai_generated` 題的 `provenance.sourceId` 可以指向特殊 placeholder（例如 `src-internal-custom` / `src-internal-ai-dev-seed`），但仍須在 source registry 留下對應 entry，避免「來源蒸發」。

### D-4. `third_party_practice` 不可直接標成 `official_sample` 或 `past_paper`

- 即使第三方網站宣稱「歷屆考題」，若該網站不是 Cambridge 官方 / 不是官方認證代理 → 仍標 `third_party_practice`
- reviewer 必須明確區分。若不確定發行機構 → 標 `needs_manual_check` 進一步確認

### D-5. `sourceMix` 必須誠實統計

paper-level `sourceMix` 由每題 `source` 自動統計（沿用 P3-10-K 第二刀的 `scripts/assemble_practice_paper.mjs` 邏輯）。

- ❌ 不可在報告中把 `custom` 數量併入 `official_sample` 主線
- ❌ 不可在報告中刻意隱藏 `ai_generated` 題數
- ✅ 若報告顯示 `sourceMix: { ai_generated: 9, custom: 4 }` → 該 paper 屬「題型驗證 dev seed」、不是正式匯入版
- ✅ 正式匯入版 paper 的 `sourceMix` 應以 `official_sample` / `past_paper` 為主

### D-6. 不偽裝來源

若來源只是練習網站，不是官方或歷屆考題 → `sourceKind` **不得**標 `official_sample` / `past_paper`。reviewer 不得為了讓題目「看起來正式」而升級 sourceKind。

---

## E. 後續流程

正式資料流程應變成：

```
1. discovery search
   ↓
2. source registry              （pending_review / 人工 review 來源 / 標 approved_for_import）
   ↓
3. source review                （rights / 內容 / publisherType 驗證）
   ↓
4. collector                    （依 approved source 抓 metadata / full-text / asset-aware）
   ↓
5. normalizer draft             （rule-based / openai-mode 對齊 8 種題型 schema 草稿）
   ↓
6. human review                 （題目層級 reviewStatus；對齊 P3-10-F）
   ↓
7. approve                      （單題 reviewStatus: approved_for_practice）
   ↓
8. assemble paper               （P3-10-K 第二刀，已落地）
   ↓
9. 再考慮 /quiz 整合              （切換 lib/data.ts 載入來源；屬未來刀數）
```

而**不是**：

```
❌ AI 直接補題  →  塞進正式題庫
```

source registry 是這條流程的**第 2 步 gate**——若 source 沒進 approved_for_import，後續步驟全部不啟動。

---

## F. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`PROJECT_ROADMAP.md`](../PROJECT_ROADMAP.md) | P3-10-L 條目；P3-10-H / I / J 改為 source-first 題庫擴充（不再是 AI 補題） |
| [`docs/PRACTICE_DATA_PLAN.md`](./PRACTICE_DATA_PLAN.md) | umbrella；本檔作為 P3-10-L 子計畫；最小可玩資料包目標需配合 source-first |
| [`docs/PRACTICE_DATA_IMPORT_PLAN.md`](./PRACTICE_DATA_IMPORT_PLAN.md) | B 段 7 種 sourceType 與本檔 7 種 sourceKind 並存；本檔聚焦來源優先性 |
| [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) | normalize 流程上游補一層 source registry gate |
| [`docs/DISCOVERY_CRAWLER_PLAN.md`](./DISCOVERY_CRAWLER_PLAN.md) | discovery 結果寫入 source registry（而不是直接餵 collector） |
| [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md) | collector 應只抓 source registry 中 `approved_for_import` 條目（屬未來實作刀數，本輪不改 collector） |
| [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) | 官方資源人工瀏覽邊界仍維持；本檔的 `official_sample` / `official_learning_material` 來源同樣**不下載複製** |
| [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) | `QuestionSource` union 4 種仍不變；本檔不修改正式 schema |
| [`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md) | AI 出題仍可作為**草稿 / 題型開發 seed**；但 `ai_generated` 不再用來補正式題庫數量 |

---

## E-bis. Discovery → Source Registry Generated Workflow（P3-10-M）

P3-10-M（2026-05-15）落地一個小工具串接 discovery output 與 source registry：

- `scripts/build_source_registry.mjs` v0.1：讀 `data/imported/discovered-resources.{example,generated}.json` → 寫 `data/imported/source-registry.generated.json`
- `data/imported/source-registry.generated.json` 已在 `.gitignore` 排除（P3-10-L 補入），**絕不**commit
- **保守推論**規則對齊本檔 C 段 schema、B 段 source-first 原則、D 段匯入硬邊界：
  - **預設 `reviewStatus: pending_review`**；下列任一觸發 → 升 `needs_manual_check`：
    - `fileType === "pdf"`
    - `sourceKind ∈ {official_sample, past_paper, official_learning_material}`
    - `sourceKind === "unknown"` 或 `publisherType === "unknown"`
    - discovery `score < 5` 或 `shouldCollect === false`
  - **絕不**輸出 `approved_for_import`——這個值必須留給 reviewer 人工 review 後手動改
  - **`publisherType="official"` 只發給 OFFICIAL_HOSTNAMES allowlist 命中的 hostname**（目前只放 cambridgeenglish.org / cambridge.org 兩個高信心 domain）
  - discovery 把 `sourceType: "official"` 標在非 allowlist hostname 時，**保守降級**為 `publisherType: "third_party"` 與 `sourceKind: "third_party_practice"`（避免假裝 official；驗收 case：`fake-cambridge.example` fixture 已驗）
  - validator 規則 #6（`official_sample` / `past_paper` 要求 `publisherType ∈ {official, school}`）保護：若推論不一致，自動降為 `third_party_practice` 或 `unknown`，避免 validator fail
  - `partsCovered` 從 `disc.detectedExamParts` 過濾到 ALLOWED_PARTS；空則設 `["unknown"]`（不亂猜 L1 / RW3）
  - `provenanceNotes` / `rightsNotes` 用**固定保守模板**，明確標 reviewer 必須驗證、**不**聲稱已授權 / 已審核 / 可直接匯入
  - `collectedAt` / `lastCheckedAt` 一律 `null`（discovery 並未實際 collect 任何東西）
- **deterministic**：同一份 input 重跑 → 同一份 output（sourceId 由 input 順序產出 `src-gen-001` / `src-gen-002` ...；非 hash 但 stable 在 input order）
- **dedup**：以 `normalizedUrl ?? url` 為 key；同 URL 多次出現只保留第一筆，後續標 `skipped_duplicate_url`
- **跳過項目**：缺 URL / URL parse 失敗 → `skipped_missing_or_invalid_url`；超過 `--limit` → `skipped_due_to_limit`
- **流程定位**：本 CLI 是 source registry **gate 的上游 helper**——把 discovery output 自動轉成 pending_review entries 給 reviewer 看；**不**繞過 D 段任何硬邊界。reviewer 仍須對每筆條目人工 review、改 `reviewStatus: approved_for_import` 才能進下游 normalizer / collector。
- 下一刀：collector / normalizer 的 program-layer source-registry gate（讀 source-registry generated 且 reviewStatus === "approved_for_import" 才能下游處理）屬未來範圍、本輪不做。

### E-bis-1. CLI 用法

```bash
# Help
node scripts/build_source_registry.mjs --help

# 標準流程
node scripts/build_source_registry.mjs \
  --input data/imported/discovered-resources.example.json \
  --out data/imported/source-registry.generated.json \
  --mode build \
  --limit 20

# 跑完後接 validator 驗證 schema
node scripts/validate_source_registry.mjs \
  --input data/imported/source-registry.generated.json
```

### E-bis-2. CLI flags

- `--input <path>`：discovered-resources JSON 路徑（必填）
- `--out <path>`：source-registry generated JSON 輸出路徑（預設 `data/imported/source-registry.generated.json`）
- `--mode <mode>`：目前只支援 `build`；其他值 exit 2
- `--limit <n>`：最多寫出幾筆 entry（預設 20、正整數）
- `--help`：印 help 後 exit 0

### E-bis-3. Console summary 範例

```
build_source_registry.mjs@v0.1
input:  /.../data/imported/discovered-resources.example.json
out:    /.../data/imported/source-registry.generated.json
mode:   build
limit:  20

Summary: totalInput=6  written=6  skipped=0
  reviewStatus: {"needs_manual_check":5,"pending_review":1}
  sourceKind:   {"official_sample":2,"third_party_practice":2,"unknown":1,"past_paper":1}

Reminder: all written entries are auto-generated and unreviewed.
  - No entry is approved_for_import (P3-10-L hard boundary).
  - Reviewer must manually verify each entry before changing reviewStatus to approved_for_import.
  - source-registry.generated.json is gitignored; do NOT commit.
```

### E-bis-4. 與既有 discovery / collector 的關係

```
discovery output (data/imported/discovered-resources.generated.json)
   ↓
build_source_registry.mjs  ← 本輪 P3-10-M
   ↓
source-registry.generated.json   （pending_review / needs_manual_check；gitignored）
   ↓ [人工 review 來源 → 標 approved_for_import]
   ↓
source-registry (reviewer 手動 commit 之 entries / 或未來 source registry curated file)
   ↓
collector / normalizer  ← gate 屬未來範圍（本輪不做）
```

本流程**不取代** discovery / collector / normalizer，**也不修改它們的程式**。本輪僅加一段 discovery → registry 的中介轉換。

---

## G. 本輪（P3-10-L）落地範圍

- ✅ 新增本檔（docs/SOURCE_REGISTRY_PLAN.md）
- ✅ 新增 `data/imported/source-registry.example.json`（3~5 筆示範資料）
- ✅ 新增 `scripts/validate_source_registry.mjs`（靜態驗證 CLI，含 `--input` / `--help`；不抓網路、不呼叫 API）
- ✅ 更新 `docs/PRACTICE_DATA_PLAN.md` / `docs/PRACTICE_DATA_IMPORT_PLAN.md` / `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` / `docs/DISCOVERY_CRAWLER_PLAN.md` / `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` 加入 source-first 邊界
- ✅ 更新 `PROJECT_ROADMAP.md`：新增 P3-10-L；把 P3-10-H / I / J 改為 source-first 題庫擴充（不再標「AI 補題」）
- ✅ 更新 `README.md` 文件索引

### 不在本輪範圍

- ❌ 不新增 AI generated 題目 / 不新增 custom 題湊題數
- ❌ 不改 `data/p3-example-questions.json` / `data/exam-papers.example.json`
- ❌ 不讓 `/quiz` 切到 imported 題庫
- ❌ 不改 UI
- ❌ 不呼叫 OpenAI / Brave Search API
- ❌ 不下載 / 解析 PDF / image / audio
- ❌ 不爬網站 / 不自動產題
- ❌ 不新增 npm 依賴
- ❌ 不擴張 `lib/types.ts` `QuestionSource` union

---

## H. 版本

- **v1.1**（2026-05-15，P3-10-M：Source registry generated workflow）：新增 E-bis 段落「Discovery → Source Registry Generated Workflow」共 4 個子段（E-bis-1 CLI 用法 / E-bis-2 flags / E-bis-3 console summary 範例 / E-bis-4 與既有 discovery / collector 的關係）；對應 `scripts/build_source_registry.mjs` v0.1：deterministic sourceId / dedup by normalizedUrl ?? url / 保守 publisher allowlist / sourceKind 與 publisherType 一致性自動降級 / **絕不**輸出 `approved_for_import` / 預設 `pending_review`；高風險自動升 `needs_manual_check`。**本輪不改 schema / 不改 source-first 原則 / 不改 D 段硬邊界**——只是補一段 discovery → registry 的中介工具。
- **v1**（2026-05-14）：第一版——P3-10-L 規劃文件骨架；定義 7 種 sourceKind / 5 種 publisherType / 5 種 collectionStatus / 4 種 reviewStatus；source-first 原則 6 條；匯入規則 D-1 ~ D-6 硬邊界。
