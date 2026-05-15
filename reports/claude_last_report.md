# Claude Code 回報 — P3-10-M：Source Registry Generated Workflow

> 任務：P3-10-M — 把 discovery 找到的來源自動轉成 source registry generated JSON，先給 reviewer 人工審核；接續 P3-10-L 已建立的 source-first 規則往「workflow 工具」方向收斂。
>
> 任務日期：2026-05-15。

---

## 【本輪修改摘要】

1. **新增 `scripts/build_source_registry.mjs` v0.1**：discovery output → `data/imported/source-registry.generated.json`；保守推論 sourceKind / publisher / publisherType / fileType / partsCovered / language / level / exam；deterministic sourceId；dedup by `normalizedUrl ?? url`；**絕不**輸出 `approved_for_import`（P3-10-L 硬邊界）；無新 npm 依賴、無網路、無外部 API。
2. **CLI flags**：`--input` / `--out` / `--mode build` / `--limit 20`（正整數防呆）/ `--help`；不支援的 mode → exit 2 + 印錯訊。
3. **`data/imported/source-registry.generated.json`** 已於 P3-10-L 補入 `.gitignore`（line 57）；本輪驗證 `git check-ignore` 命中、`git status` 顯示**未被追蹤**。
4. **文件同步**：`docs/SOURCE_REGISTRY_PLAN.md` 新增 E-bis 段（v1.1）/ `docs/DISCOVERY_CRAWLER_PLAN.md` 升 v3.2（B 段步驟 7.5 補 build CLI 落地）/ `docs/PRACTICE_DATA_IMPORT_PLAN.md` 升 v1.2（C 段第 0 步補 build CLI 用法）/ `docs/PRACTICE_DATA_PLAN.md` 升 v1.2（B 段表格 + F 段加 🟡 P3-10-M）/ `PROJECT_ROADMAP.md` 加 🟡 P3-10-M 子彈點 / `README.md` 文件索引補 E-bis 段引用。
5. **未動**：`lib/types.ts` / `lib/data.ts` / `data/p3-example-questions.json` / `data/exam-papers.example.json` / `data/imported/source-registry.example.json` / `data/imported/discovered-resources.example.json` / `app/*` / `components/*` / 任何 npm 依賴 / `.env.local` / `.claude/settings.local.json`。

---

## 【修改檔案清單】

新增：

- `scripts/build_source_registry.mjs`

修改：

- `PROJECT_ROADMAP.md`
- `README.md`
- `docs/SOURCE_REGISTRY_PLAN.md`
- `docs/DISCOVERY_CRAWLER_PLAN.md`
- `docs/PRACTICE_DATA_IMPORT_PLAN.md`
- `docs/PRACTICE_DATA_PLAN.md`
- `reports/claude_last_report.md`（本檔；覆寫上一輪內容）

產生但不 commit（已被 `.gitignore` 排除）：

- `data/imported/source-registry.generated.json`（6 筆 entries，驗收用）

未動：

- `data/p3-example-questions.json` / `data/exam-papers.example.json`
- `data/imported/source-registry.example.json` / `data/imported/discovered-resources.example.json` / `data/imported/search-results.example.json`
- `lib/types.ts` / `lib/data.ts` / `components/*` / `app/*`
- 其他既有 docs（QUESTION_IMPORT_NORMALIZATION_PLAN / WEB_RESOURCE_COLLECTOR_PLAN / OFFICIAL_RESOURCES 等不再 touch）
- `scripts/validate_source_registry.mjs`（P3-10-L 修補的 v0.1.1 維持）

---

## 【Build Source Registry CLI 說明】

### 用法

```bash
# Help
node scripts/build_source_registry.mjs --help

# 標準流程
node scripts/build_source_registry.mjs \
  --input data/imported/discovered-resources.example.json \
  --out data/imported/source-registry.generated.json \
  --mode build \
  --limit 20

# 串接 validator
node scripts/validate_source_registry.mjs \
  --input data/imported/source-registry.generated.json
```

### CLI flags

| flag | 必填 | 預設 | 說明 |
| --- | --- | --- | --- |
| `--input <path>` | ✅ | — | discovered-resources JSON 路徑（example 或 generated 均可） |
| `--out <path>` | — | `data/imported/source-registry.generated.json` | 輸出路徑（覆寫式） |
| `--mode <mode>` | — | `build` | 目前只支援 `build`；其他值 exit 2 |
| `--limit <n>` | — | `20` | 最多寫出幾筆 entry（正整數防呆） |
| `--help` | — | — | 印 usage 後 exit 0 |

### Exit code

- `0`：成功
- `1`：未預期錯誤
- `2`：CLI 參數錯 / input 不存在 / JSON parse 失敗 / unsupported mode

### 硬邊界

- ❌ 不發 HTTP / 不抓網路 / 不下載 PDF / image / audio
- ❌ 不呼叫 OpenAI / 任何雲端 API
- ❌ 不修改 input 檔
- ❌ 不寫 `data/p3-example-questions.json` / `data/exam-papers.example.json`
- ❌ 不標 `approved_for_import`（無論來源看起來多官方）
- ❌ 不偽裝 sourceKind / publisherType
- ✅ 純資料轉換、可重跑、可審計、deterministic

---

## 【轉換規則摘要】

### sourceId（deterministic）

由 input 順序產出：`src-gen-001` / `src-gen-002` / ...；重跑相同 input 產出 byte-identical output（驗收：`diff -q` 兩次 build 結果 identical）。

### dedup

key = `normalizedUrl ?? url`；同 URL 多次出現只保留第一筆。

### 跳過分類

- `skipped_missing_or_invalid_url`：URL parse 失敗或缺欄位
- `skipped_duplicate_url`：dedup key 已被佔用
- `skipped_due_to_limit`：超過 `--limit`
- `skipped_not_an_object`：entry 不是 plain object

### sourceKind 推論

| 條件 | sourceKind |
| --- | --- |
| publisherType=official + 看起來像 sample | `official_sample` |
| publisherType=official + 看起來像 past paper | `past_paper` |
| publisherType=official + 其他 | `official_learning_material` |
| publisherType=school + 看起來像 past paper / sample | `past_paper` |
| publisherType=school + 其他 | `third_party_practice` |
| publisherType=third_party | `third_party_practice` |
| publisherType=unknown | `unknown` |
| shopping_or_product_page reason | `unknown`（強制） |

**一致性自動降級**：若 sourceKind ∈ {`official_sample`, `past_paper`} 但 publisherType ∉ {`official`, `school`}，自動降為 `third_party_practice` 或 `unknown`（避免 validator rule #6 fail）。

### publisher / publisherType（嚴格 allowlist）

| hostname | publisher | publisherType |
| --- | --- | --- |
| `cambridgeenglish.org` / `www.cambridgeenglish.org` / `cambridge.org` / `www.cambridge.org` | `Cambridge Assessment English` | `official` |
| `yle.tw` / `www.yle.tw` | `YLE 台灣` | `school` |
| `certificate.tw` / `www.certificate.tw` | `Certificate 台灣` | `school` |
| 其他（discovery sourceType=official）| `<sourceDomain>` | **降級為** `third_party` |
| 其他（discovery sourceType=school）| `<sourceDomain>` | `school` |
| 其他（discovery sourceType=third_party）| `<sourceDomain>` | `third_party` |
| 其他（discovery sourceType=unknown）| `<sourceDomain>` | `unknown` |

**驗收 fixture**：`fake-cambridge.example` hostname + discovery sourceType=official → 自動降為 `publisherType=third_party` + `sourceKind=third_party_practice`，**不**升 official_sample。

### reviewStatus（保守）

- 預設：`pending_review`
- 升 `needs_manual_check`：`fileType === "pdf"` / `sourceKind ∈ {official_sample, past_paper, official_learning_material}` / `sourceKind === "unknown"` / `publisherType === "unknown"` / discovery `score < 5` / `shouldCollect === false`
- **絕不** `approved_for_import`

### 其他欄位

- `language`：CJK 字符 → `zh-Hant`；否則 `en`
- `level`：直接從 `disc.level`；空則 `unknown`
- `exam`：依 level 推（`Pre A1 Starters` → `Cambridge Starters`；`Movers` → `Cambridge Movers`；`Flyers` → `Cambridge Flyers`；其他 → `unknown`）
- `partsCovered`：從 `disc.detectedExamParts` 過濾到 ALLOWED_PARTS；空則 `["unknown"]`，**不亂猜**
- `fileType`：resourceType `pdf` → `pdf`；`page` / `worksheet` / `vocabulary_list` / `listening_practice` / `reading_writing_practice` / `sample_paper` → `html`；fallback 依 URL extension；其他 → `unknown`
- `accessType`：一律 `unknown`（**不**假設 public）
- `collectionStatus`：一律 `discovered`（discovery 並未實際 collect 任何 metadata / body / asset）
- `collectedAt` / `lastCheckedAt`：一律 `null`
- `provenanceNotes`：固定模板 `Generated from discovery output (disc id: ..., source query: ...); reviewer must verify source kind, publisher, parts covered, and rights before import.`
- `rightsNotes`：固定模板 `Not reviewed. Do not import until reviewer confirms usage boundary, license, and copyright. Auto-generated entry — never approve without manual verification.`

---

## 【Generated registry 結果】

跑 `data/imported/discovered-resources.example.json`（6 筆 discovery entries）→ `data/imported/source-registry.generated.json`：

| sourceId | sourceKind | publisher | publisherType | partsCovered | reviewStatus | source disc.id |
| --- | --- | --- | --- | --- | --- | --- |
| `src-gen-001` | `official_sample` | `Cambridge Assessment English` | `official` | `["unknown"]` | `needs_manual_check` | disc-001 |
| `src-gen-002` | `official_sample` | `Cambridge Assessment English` | `official` | `["unknown"]` | `needs_manual_check` (PDF) | disc-002 |
| `src-gen-003` | `third_party_practice` | `example-worksheet.com` | `third_party` | `["RW3"]` | `pending_review` | disc-003 |
| `src-gen-004` | `unknown` (shopping) | `shop-example.com` | `third_party` | `["unknown"]` | `needs_manual_check` | disc-004 |
| `src-gen-005` | `past_paper` | `YLE 台灣` | `school` | `["unknown"]` | `needs_manual_check` | disc-005 |
| `src-gen-006` | `third_party_practice` | `example-movers.com` | `third_party` | `["unknown"]` | `needs_manual_check` (score=3) | disc-006 |

**Summary**：
- totalInput=6 / written=6 / skipped=0
- reviewStatus: `{"needs_manual_check": 5, "pending_review": 1}`
- sourceKind: `{"official_sample": 2, "third_party_practice": 2, "past_paper": 1, "unknown": 1}`
- **`approved_for_import` 數量：0**（驗收：`jq '[.[] | select(.reviewStatus == "approved_for_import")] | length'` = 0）

---

## 【Validator 結果】

```
$ node scripts/validate_source_registry.mjs --input data/imported/source-registry.generated.json
validate_source_registry.mjs@v0.1.1
input: /.../data/imported/source-registry.generated.json
total entries: 6

  [PASS] src-gen-001
  [PASS] src-gen-002
  [PASS] src-gen-003
  [PASS] src-gen-004
  [PASS] src-gen-005
  [PASS] src-gen-006

Summary: total=6  passed=6  failed=0  duplicateSourceIds=0
exit=0
```

✅ 6/6 通過 validator；
✅ 0 個 duplicate sourceId；
✅ 0 個 approved_for_import；
✅ 通過 validator 規則 #6 一致性檢查（official_sample / past_paper 對應 publisherType official / school）。

---

## 【文件同步內容】

| 文件 | 變更 |
| --- | --- |
| `docs/SOURCE_REGISTRY_PLAN.md` | 升 v1.1；新增 E-bis 段「Discovery → Source Registry Generated Workflow」共 4 個子段（E-bis-1 CLI 用法 / E-bis-2 flags / E-bis-3 console summary 範例 / E-bis-4 與既有 discovery / collector 關係） |
| `docs/DISCOVERY_CRAWLER_PLAN.md` | 升 v3.2；B 段步驟 7.5 補「P3-10-M build CLI 已落地」說明 |
| `docs/PRACTICE_DATA_IMPORT_PLAN.md` | 升 v1.2；C 段第 0 步補 `scripts/build_source_registry.mjs` 用法（替代純手寫 example） |
| `docs/PRACTICE_DATA_PLAN.md` | 升 v1.2；B 段表格 SOURCE_REGISTRY_PLAN 條目補 P3-10-M 引用；F 段加 🟡 P3-10-M 部分完成條目 |
| `PROJECT_ROADMAP.md` | P3-10 子分區「後續待辦」段補 🟡 P3-10-M 子彈點（完整本輪落地說明、保守推論 11 條策略、6 種端到端測試結果、硬邊界、不擴大 scope） |
| `README.md` | 文件索引條目補 E-bis 段引用 |

---

## 【測試結果】

| 指令 | 結果 |
| --- | --- |
| `npm run lint` | ✅ 0 errors / 0 warnings（移除未使用的 ALLOWED_* 常數 + `urlLower` 變數後乾淨） |
| `npm run typecheck` | ✅ 通過（tsc --noEmit 無輸出） |
| `npm run build` | ✅ Compiled successfully；88 pages prerendered（UI 完全未動） |
| `node scripts/build_source_registry.mjs --help` | ✅ exit 0；完整 usage（含 What it does / Defaults / What it never does / Output / Exit code 段）；標題 v0.1 |
| `node scripts/build_source_registry.mjs --input <example> --mode build --limit 20` | ✅ exit 0；6/6 written；summary 列 reviewStatus / sourceKind counts + skipped reasons + reminder 段 |
| `node scripts/validate_source_registry.mjs --input source-registry.generated.json` | ✅ exit 0；6/6 PASS；duplicateSourceIds=0 |
| **`jq '[.[] | select(.reviewStatus == "approved_for_import")] | length' source-registry.generated.json`** | ✅ `0`（**0 筆 approved_for_import**，硬邊界守住） |
| **Deterministic rerun**：兩次 build 寫到不同 path → `diff -q` | ✅ identical（byte-level 相同） |
| **Edge case fixture 1**：unsupported mode `--mode rule-based` | ✅ exit 2 + 印 supported modes |
| **Edge case fixture 2**：missing `--input` | ✅ exit 2 + 印 help |
| **Edge case fixture 3**：unknown flag `--foo` | ✅ exit 2 |
| **Edge case fixture 4**：`--limit 3`（截斷 6 → 3） | ✅ written=3；skipped 3 with `skipped_due_to_limit`；validator 仍 PASS |
| **Edge case fixture 5**：duplicate URL + 無 URL fixture | ✅ written=1；skipped 2 with `skipped_duplicate_url` / `skipped_missing_or_invalid_url`；validator PASS |
| **Edge case fixture 6**：fake-cambridge.example hostname + discovery sourceType=official + score=8 | ✅ **自動降為 third_party_practice + publisherType=third_party**，**不**升 official_sample；validator PASS |
| `git check-ignore -v data/imported/source-registry.generated.json` | ✅ 命中 `.gitignore:57`（P3-10-L 已補入） |
| `git status --short data/imported/source-registry.generated.json` | ✅ 完全未列出 → 未被追蹤 |
| `git diff --stat` for `data/p3-example-questions.json` / `data/exam-papers.example.json` / `lib/*` / `components/*` | ✅ 全部 0 變更 |

---

## 【仍未處理】

- ⬜ **Collector / Normalizer 的 program-layer source-registry gate**：屬下一刀；需在 `scripts/normalize_collected_sources.mjs` / `scripts/web_resource_collect.mjs` 加 `--source-registry <path>` flag，跳過 reviewStatus ≠ `approved_for_import` 的 source URL
- ⬜ **Approved_for_import 後續整合**：reviewer 改 reviewStatus 後如何安全合併 → 需要 merge tool（類似 P3-10-F 的 `--merge-with`）
- ⬜ **Multi-round history / 進度追蹤**：目前每次 build 覆寫式；未來若 reviewer 已 review 過部分條目，重跑 build 不應蓋掉 reviewer edits → 需要 merge / preserve 邏輯
- ⬜ **Review UI dashboard**：CLI + JSON 第一版；reviewer 仍需手動編輯 JSON
- ⬜ **Build 入 normalizer / collector pipe**：discovery → build → review → approve → normalize → review → approve → assemble paper 一條龍工作流的後段整合
- ⬜ **更精細的 publisher allowlist**：目前只有 4 個 cambridge hostname + 2 個本地代理；未來可擴張（需 reviewer 維護）

---

## 【風險點】

1. **OFFICIAL_HOSTNAMES allowlist 短小**：只含 4 個 cambridge domain；任何**真正的**官方 sub-domain（如 `learning.cambridgeenglish.org` 之類）若 discovery 找到、本 CLI 會降為 third_party。**這是保守設計**，避免假冒；reviewer 可手動把這類條目升級 sourceKind + publisherType。
2. **LOCAL_AGENCY_HOSTNAMES 只列了 yle.tw / certificate.tw**：reviewer 可能有其他在地代理機構需要納入；目前未涵蓋會降為 third_party + needs_manual_check（仍可被 reviewer 手動升級）。
3. **reviewer 編輯保存風險**：CLI 是**覆寫式**（每次 build 全部重寫 `source-registry.generated.json`）；若 reviewer 已對 generated registry 內某條目改 reviewStatus = `approved_for_import` + 加 rightsNotes，**下次 build 會把改動覆寫掉**。**目前不支援 merge**——reviewer 應在改動後立刻 copy 出來保存，或等下一刀的 merge tool。文件 + console summary 提示 reminder 已說明此點。
4. **sourceId deterministic 但依 input 順序**：若 discovery 重跑後新增條目插在中間，後續 sourceId 會全部 +1 → 對應 reviewer 已知的 src-gen-NNN 會錯位。**目前是 v0.1 限制**；未來可改用 URL hash 派發 stable id（但會變不可讀）。本輪選擇可讀性優先。
5. **fileType 推論依 URL extension fallback**：對 URL 沒有副檔名的 PDF / docx 等可能誤判為 html；reviewer 仍需手動驗證實際 content type。
6. **`shouldCollect === false` 仍進 registry**：discovery 已 flag 為「不要 collect」的 candidate（如 shopping page）也會被 build 成 registry entry（標 needs_manual_check）；reviewer 可選擇 reject。若想 filter 在 build 階段，需未來 flag（如 `--only-should-collect`）。

---

## 【後續建議】

依優先順序：

1. **Codex 驗收 P3-10-M**：6 項硬邊界 + 6 種端到端測試已在報告中列出；reviewer 應 spot-check `data/imported/source-registry.generated.json` 內容並確認 0 個 approved_for_import。
2. **Normalizer / Collector source-registry gate**（下一刀）：在 `scripts/normalize_collected_sources.mjs` 與 `scripts/web_resource_collect.mjs` 加 `--source-registry` flag，跳過 reviewStatus ≠ approved_for_import 的條目。
3. **Merge / preserve 工具**：類似 P3-10-F 的 `--merge-with`，避免 build 覆寫 reviewer 已編輯的條目。
4. **Build CLI 加 `--only-should-collect` flag**：與 collector pipe 對齊，可選擇跳過 discovery 已 flag 為 shouldCollect=false 的條目。
5. **Build CLI 加 `--include-rejected`**：reviewer 想看 discovery 的所有候選（含被 discovery 規則 rejected 的）時可開啟。
6. **publisher allowlist 文件化**：把 OFFICIAL_HOSTNAMES / LOCAL_AGENCY_HOSTNAMES 整理進 SOURCE_REGISTRY_PLAN.md（reviewer 可在獨立刀數提 PR 擴張）。

---

## 【Roadmap 同步檢查】

- ✅ PROJECT_ROADMAP.md P3-10 子分區「後續待辦」段加 🟡 P3-10-M 部分完成子彈點（含完整本輪落地說明）
- ✅ docs/PRACTICE_DATA_PLAN.md F 段加 🟡 P3-10-M 部分完成條目
- ✅ docs/SOURCE_REGISTRY_PLAN.md 升 v1.1（E-bis 段）
- ✅ docs/DISCOVERY_CRAWLER_PLAN.md 升 v3.2（B 段步驟 7.5 補 build CLI 落地）
- ✅ docs/PRACTICE_DATA_IMPORT_PLAN.md 升 v1.2（C 段第 0 步補 build CLI 用法）
- ✅ docs/PRACTICE_DATA_PLAN.md 升 v1.2（B 段表格 + F 段條目）
- ✅ P3-10-L 主條目維持 ✅；P3-10-L 修補子彈點維持 🟡（P3-10-L 修補後待 Codex 重新驗收收斂為通過）
- ✅ P3-10-H / I / J 條目維持 source-first 方向修正註記，**不再** 是 AI 補題
- ✅ P3-10 整體仍 🟡（未標完成）
- ✅ P3 整體仍 🟡（未標完成）
- ✅ P4 / P5 仍 ⬜（未啟動）

---

**特別說明**

本輪只做 **discovery output → source registry generated JSON**。

- **不代表來源已 approved_for_import**——所有 generated entry 一律 `pending_review` 或 `needs_manual_check`；硬邊界 #1。
- **不代表題目已匯入**——本 CLI 不碰任何 question schema、不寫 `data/p3-example-questions.json`。
- **不代表 /quiz 已使用 imported 題庫**——`lib/data.ts` 完全未動；`/quiz` 仍跑既有 13 題範例。
- **不代表正式來源已通過授權審核**——reviewer 必須對每筆 entry 人工確認 rights / publisher / 內容才能升 reviewStatus = approved_for_import。
- `provenanceNotes` / `rightsNotes` 用固定保守模板，**絕不**聲稱已授權 / 已審核 / 可直接匯入。

本輪硬邊界全守：未呼叫 OpenAI / Brave / 任何網路 API / 未發 HTTP / 未下載任何外部資產 / 未自動產題 / 未修改正式題庫 / 未修改正式 paper / 未改 UI / 未改 schema / 未接後端 / DB / 登入 / 未紀錄真實 API key / 未把任何 generated source 標 approved_for_import / 未新增 npm 依賴 / 未處理 npm audit / 未部署 / 未 commit `.env.local` / 未 commit `*.generated.json` / 未 commit `.claude/settings.local.json`。
