# Claude Code 回報 — P3-10-O：Source Registry merge / preserve tool

> 任務：P3-10-O — 給 `scripts/build_source_registry.mjs` 補 `--merge-with` 旗標，避免 discovery 重跑時把 reviewer 已手動審核的 source registry 條目（reviewStatus / rightsNotes / provenanceNotes / publisher / publisherType / partsCovered 等）洗掉。
>
> 任務日期：2026-05-15。

---

## 【本輪修改摘要】

1. **`scripts/build_source_registry.mjs` v0.1 → v0.2**：新增 `--merge-with <existing-source-registry.json>` flag；BUILDER_VERSION 升至 `@v0.2`；HELP_TEXT 重寫含完整 merge key / preserve / orphan / 防護說明。
2. **mergeKey 規則**：主要 `normalizeSourceUrlForGate(sourceUrl)`（與 P3-10-N gate 共用 helper、確保兩邊比對邏輯一致）、fallback `title(lower-trim)|raw-sourceUrl`；**不**只用 sourceId。
3. **Preserve 規則**：命中既有條目時 14 欄位一律取 existing 值（包含 `reviewStatus` / `rightsNotes` / `provenanceNotes` / `sourceKind` / `publisher` / `publisherType` / `language` / `level` / `exam` / `partsCovered` / `accessType` / `collectionStatus` / `collectedAt` / `lastCheckedAt` / `sourceId`）；`title` / `fileType` / `sourceUrl` 用條件式 preserve（不污染 reviewer 編輯）。
4. **Orphan 規則**：既有條目在新 discovery input 中無對應 → 整筆保留附加於 output 尾；**不降級** reviewStatus（即使是 `approved_for_import`）。
5. **sourceId 衝突避讓**：existing entries 保留原 sourceId；新 entries 的 `src-gen-NNN` 編號自動跳過已被既有 entry 使用的 id。
6. **`--merge-with` 防護**：檔案不存在 / JSON parse 失敗 / 非 array / 任一 entry 缺 sourceId / 任一 entry 缺 sourceUrl / 含 duplicate sourceId → exit 2 + 不寫 output。
7. **Console summary 新增 counters**：`merged` / `newEntries` / `orphaned` / `approvedPreserved` / `existingTotal`。
8. **End-to-end fixture 測試全綠**（happy path / duplicate / non-array / malformed / missing fields / non-existent / no-flag regression / sourceId 衝突避讓 / deterministic / idempotent）。
9. **文件同步**：`docs/SOURCE_REGISTRY_PLAN.md` 升 v1.3 新增 E-bis-6 段 / `docs/PRACTICE_DATA_IMPORT_PLAN.md` 升 v1.4 / `docs/PRACTICE_DATA_PLAN.md` 升 v1.4 / `PROJECT_ROADMAP.md` 加 🟡 P3-10-O / `README.md` 索引補 E-bis-6 引用。

---

## 【修改檔案清單】

修改：

- `scripts/build_source_registry.mjs`（v0.1 → v0.2）
- `docs/SOURCE_REGISTRY_PLAN.md`（升 v1.3，新增 E-bis-6 段 7 子段）
- `docs/PRACTICE_DATA_IMPORT_PLAN.md`（升 v1.4，C 段第 0 步補 P3-10-O merge）
- `docs/PRACTICE_DATA_PLAN.md`（升 v1.4，F 段加 🟡 P3-10-O）
- `PROJECT_ROADMAP.md`（加 🟡 P3-10-O 子彈點，完整本輪落地說明）
- `README.md`（SOURCE_REGISTRY_PLAN 索引條目補 E-bis-6 引用）
- `reports/claude_last_report.md`（本檔；覆寫上一輪 P3-10-N 內容）

未動：

- `scripts/source_registry_gate.mjs`（P3-10-N 共用 helper，本輪重用 `normalizeSourceUrlForGate`，未修改）
- `scripts/validate_source_registry.mjs` / `scripts/collect_discovered_resources.mjs` / `scripts/normalize_collected_sources.mjs` / `scripts/web_resource_collect.mjs` / `scripts/discover_resources.mjs`
- `data/p3-example-questions.json` / `data/exam-papers.example.json`
- `data/imported/source-registry.example.json` / `data/imported/discovered-resources.example.json` / `data/imported/search-results.example.json`
- `lib/types.ts` / `lib/data.ts` / `components/*` / `app/*`
- `.gitignore` / `package.json`

---

## 【merge / preserve 設計】

### Merge key 規則（避免依賴 sourceId 位移）

`computeMergeKey(entry)` 回傳穩定的字串 key：

| 優先序 | 條件 | key 形式 |
| --- | --- | --- |
| 1 | `sourceUrl` 可被 `normalizeSourceUrlForGate` 處理 | `url:<normalized>` |
| 2 | normalize 失敗 + title 與 raw sourceUrl 都非空 | `fallback:<title-lower-trim>\|<raw-sourceUrl>` |
| 3 | 都失敗 | `null` → 該條目不參與 merge match |

normalize 規則對齊 P3-10-N gate（lowercase host / strip trailing slash unless pathname=`/` / 保留 search / 移除 fragment）；確保「reviewer 手動編輯 URL 大小寫」或「discovery 下次抓到 URL 帶 fragment」都還能命中。

### Preserve 欄位（14 個 + 3 特例）

PRESERVED_FIELDS_FROM_EXISTING 一律取 existing 值：

```
sourceId / sourceKind / publisher / publisherType / language / level / exam /
partsCovered / accessType / collectionStatus / reviewStatus / provenanceNotes /
rightsNotes / collectedAt / lastCheckedAt
```

特例（條件式 preserve）：

| 欄位 | 行為 |
| --- | --- |
| `title` | existing 為 `(no title …)` placeholder 才以 new 替換；否則保留 existing |
| `fileType` | existing 為 `"unknown"` 且 new 非 `"unknown"` 才以 new 替換；否則保留 existing |
| `sourceUrl` | 一律保留 existing（避免大小寫 / trailing slash 差異造成 spurious diff） |

### Orphan 規則

- existing 但新 discovery input 找不到 mergeKey → 整筆保留附加到 output 尾
- **不降級** reviewStatus；若 existing 是 `approved_for_import`，merge 後仍是 `approved_for_import`
- 沒 mergeKey 的 existing 條目（罕見邊界）也視為 orphan-by-default 並保留

### sourceId 衝突避讓

- 既有 entries 一律保留原 sourceId
- 新 entries（無 merge 命中）配發 `src-gen-NNN`：candidate id 已被既有 entry 用過 → 自動 skip 到下一個
- 確保最終 output 通過 `validate_source_registry.mjs` 的 duplicate sourceId 檢查

---

## 【--merge-with CLI 行為】

```bash
node scripts/build_source_registry.mjs \
  --input data/imported/discovered-resources.example.json \
  --out data/imported/source-registry.generated.json \
  --mode build \
  --limit 20 \
  --merge-with data/imported/source-registry.generated.json
```

stdout 範例：

```
build_source_registry.mjs@v0.2
input:       /.../discovered-resources.example.json
out:         /.../source-registry.generated.json
mode:        build
limit:       20
merge-with:  /.../existing-source-registry.json

Summary (merge mode): totalInput=3  existingTotal=3  written=4  skipped=0
  merged=2  newEntries=1  orphaned=1  approvedPreserved=2
  reviewStatus: {"approved_for_import":2,"needs_manual_check":1,"pending_review":1}
  sourceKind:   {"official_sample":1,"third_party_practice":2,"past_paper":1}

Reminder: all written entries are auto-generated unless preserved from --merge-with.
  - This CLI never sets approved_for_import on new entries (P3-10-L hard boundary).
  - merge-with preserves reviewer-edited fields (reviewStatus / rightsNotes / provenanceNotes /
    sourceKind / publisher / publisherType / partsCovered / level / exam / accessType / etc.).
  - Reviewer must still verify each entry; merge is preserve-only, not auto-approve.
  - Run scripts/validate_source_registry.mjs on the output to confirm schema + sourceId uniqueness.
  - source-registry.generated.json is gitignored; do NOT commit.
```

無 `--merge-with` 時保留既有 overwrite 行為（v0.1 不變）。

---

## 【approved_for_import preserve 結果】

Fixture A 中 existing `src-test-001`（`https://example.com/a`）有 `reviewStatus="approved_for_import"` + `rightsNotes="Reviewer approved rights boundary; license confirmed 2026-05-15."` + `sourceKind="official_sample"` + `partsCovered=["RW3"]`；對應的新 discovery entry 標 `sourceType="third_party"` + `score=6`，若不 merge 會被自動降級為 `third_party_practice` + `pending_review`。

merge 後 output 顯示：

```jsonc
{
  "sourceId": "src-test-001",
  "title": "Reviewer-approved A page",
  "sourceKind": "official_sample",                                     // preserved
  "sourceUrl": "https://example.com/a",                                // preserved (existing exact form)
  "publisher": "Cambridge Assessment English",                         // preserved
  "publisherType": "official",                                         // preserved
  "partsCovered": ["RW3"],                                             // preserved (not overwritten to ["unknown"])
  "reviewStatus": "approved_for_import",                               // preserved — the critical one
  "rightsNotes": "Reviewer approved rights boundary; license confirmed 2026-05-15.",  // preserved
  ...
}
```

✅ Reviewer 的人工審核結果完整保留；新 discovery 的保守推論**不**覆蓋。

---

## 【orphaned entry 保留結果】

Fixture A 中 existing `src-test-orphan`（`https://example.com/orphan`）在 existing registry 內但**不**在新 discovery input 中。它的初始狀態：

- `reviewStatus="approved_for_import"`
- `rightsNotes="Reviewer confirmed YLE 台灣 official agent license OK for personal use."`
- `sourceKind="past_paper"`
- `partsCovered=["L1", "L2", "L3"]`
- `publisher="YLE 台灣"` / `publisherType="school"`
- `fileType="pdf"`
- `collectedAt="2026-05-12T00:00:00.000Z"`

merge 後仍**整筆保留**附加到 output 尾，**所有欄位完全不動**。Console summary 顯示 `orphaned=1`、`approvedPreserved=2`（含 src-test-001 + src-test-orphan）。

---

## 【duplicate / invalid merge-with 防護】

下列 6 種情況一律 **exit 2 + 不寫 output**：

| 情境 | 觸發訊息 |
| --- | --- |
| 含 duplicate sourceId（兩筆 `src-dup`） | `--merge-with 含 duplicate sourceId：src-dup。請先用 scripts/validate_source_registry.mjs 修正後重試。` |
| Non-array JSON（`{"not": "an array"}`） | `--merge-with JSON 必須是最外層陣列：<path>（讀到 object）` |
| Malformed JSON | `JSON parse 失敗：<path>（Expected property name …）` |
| Entry 缺 sourceId | `--merge-with entry <i> 缺 sourceId 或非字串：<path>` |
| Entry 缺 sourceUrl | `--merge-with entry <i> (sourceId=…) 缺 sourceUrl 或非字串：<path>` |
| 檔案不存在 | `讀檔失敗：<path>（ENOENT …）` |

驗證：所有 6 種情境跑完後 `merged-x.json` 都**未產生**（檔案系統檢查確認）。

---

## 【測試 fixtures 結果】

| Fixture | 內容 | 預期 | 實際 |
| --- | --- | --- | --- |
| **A: happy path merge** | existing 3 (approved A + rightsNotes / needs_manual_check B / approved orphan + rightsNotes) × discovery 3 (a / b / c) | 4 筆 output；a/b preserve；c 新 pending_review；orphan 保留 approved；validator pass | ✅ written=4 / merged=2 / newEntries=1 / orphaned=1 / approvedPreserved=2 / validator 4/4 PASS / duplicateSourceIds=0 |
| **B: duplicate sourceId in merge-with** | existing 2 筆都用 `src-dup` | exit 2 + 不寫 output | ✅ exit=2；output 檔不存在 |
| **C: non-array merge-with** | `{"not": "array"}` | exit 2 + 不寫 output | ✅ exit=2 |
| **D: malformed JSON** | `{ this is not json` | exit 2 + 不寫 output | ✅ exit=2 |
| **E: entry missing sourceUrl** | 1 筆 entry 缺 sourceUrl | exit 2 + 不寫 output | ✅ exit=2，錯誤訊息含 sourceId 標示 |
| **F: nonexistent merge-with path** | `/tmp/.../does-not-exist.json` | exit 2 + 不寫 output | ✅ exit=2 |
| **G: no --merge-with（既有行為）** | 用 example discovery 跑 build | 與既有 v0.1 行為相同；重跑 byte-identical | ✅ deterministic rerun: identical |
| **H: sourceId 衝突避讓** | existing 占 `src-gen-001`；3 new discovery entries | 新 entries 配發 `src-gen-002` / `src-gen-003` / `src-gen-004`；validator 通過 | ✅ 4 sourceIds 不重複、validator 4/4 PASS |
| **I: deterministic merge rerun** | 同 merge 輸入跑兩次 | byte-identical | ✅ deterministic |
| **J: idempotent merge** | round1 output 當作 merge-with 再跑一次 → round2 | byte-identical | ✅ idempotent rerun: identical |

`/tmp/p3-10-o` 已清理；fixture 內容**從未** commit。

---

## 【文件同步內容】

| 文件 | 變更 |
| --- | --- |
| `docs/SOURCE_REGISTRY_PLAN.md` | 升 v1.3；新增 E-bis-6 段「Merge / preserve」共 7 子段（merge key / preserve 欄位 / orphan 規則 / sourceId 衝突避讓 / --merge-with 防護 exit 2 觸發條件表 / Console summary counters / 不在 P3-10-O 範圍 5 條） |
| `docs/PRACTICE_DATA_IMPORT_PLAN.md` | 升 v1.4；C 段第 0 步補 P3-10-O merge 已落地說明（reviewer 編輯保留欄位清單） |
| `docs/PRACTICE_DATA_PLAN.md` | 升 v1.4；F 段加 🟡 P3-10-O 部分完成條目（位於 P3-10-N 之後） |
| `PROJECT_ROADMAP.md` | P3-10 子分區加 🟡 P3-10-O 子彈點（含完整本輪落地說明 / mergeKey 規則 / preserve 14 欄位 + 3 特例 / orphan / sourceId 衝突避讓 / 防護 exit 2 / Console summary / 10 種 fixture 結果 / 硬邊界 / 不擴大 scope） |
| `README.md` | 文件索引 SOURCE_REGISTRY_PLAN 條目補 E-bis-6 引用 |

---

## 【測試結果】

| 指令 | 結果 |
| --- | --- |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run typecheck` | ✅ 通過（tsc --noEmit 無輸出） |
| `npm run build` | ✅ Compiled successfully；88 pages prerendered（UI 完全未動） |
| `node scripts/build_source_registry.mjs --help` | ✅ exit 0；P3-10-M / P3-10-O v0.2 標題；`--merge-with` flag 與規則完整列出 |
| Fixture A merge happy path + validator | ✅ written=4 / merged=2 / newEntries=1 / orphaned=1 / approvedPreserved=2 / validator 4/4 PASS |
| Per-entry preserve verification（src-test-001 / src-test-002 / src-gen-001 / src-test-orphan） | ✅ 全部欄位符合預期 |
| Duplicate sourceId in merge-with | ✅ exit 2 |
| Non-array / malformed / missing-field / nonexistent merge-with | ✅ 全部 exit 2 + 不寫 output |
| No `--merge-with`（regression） | ✅ 既有 v0.1 行為保留；deterministic rerun byte-identical |
| sourceId 衝突避讓 | ✅ existing 占 `src-gen-001` → 新 entries 從 `src-gen-002` 起 |
| Deterministic merge rerun | ✅ byte-identical |
| Idempotent merge（output → merge-with → 再 merge 一次） | ✅ byte-identical |
| `git diff --stat` for `data/p3-example-questions.json` / `data/exam-papers.example.json` / `lib/*` / `components/*` / 其他 example JSON | ✅ 全部 0 變更 |

---

## 【仍未處理】

- ⬜ **URL hash deterministic id**：當前 `src-gen-NNN` 仍依新 entries 進入順序遞增；input 順序變動可能造成 sourceId 位移（但 merge-with 已可保留 existing ids）。屬未來 v0.3 評估範圍。
- ⬜ **Diff / merge preview 模式**：目前 merge 直接寫 output；未來可加 `--dry-run yes` 顯示 merge 計畫但不寫檔。
- ⬜ **Reviewer 編輯衝突 detection**：若 reviewer 把同一 URL 拆成兩個不同 sourceId、或把 sourceUrl 改成 normalize 後不同的形式，本輪 merge 不會主動報警。
- ⬜ **多 reviewer 簽核 / merge audit log**：本輪是單 reviewer 模型；多 reviewer / merge history 屬未來範圍。
- ⬜ **Schema 化 merge-with 額外驗證**：本輪只做 `sourceId` / `sourceUrl` 兩個必填基本檢查；完整 schema 驗證仍由 `scripts/validate_source_registry.mjs` 負責（reviewer 在 build 前應自行跑 validator）。
- ⬜ **Automated test harness**：CLI fixtures 為手動驗證。

---

## 【風險點】

1. **Reviewer 手動編輯 sourceUrl 改成不能 normalize 的 URL**：merge key 會 fallback 到 `title|sourceUrl`，但若 title 也被改 → 可能匹配不到 → 變 orphan（保留），新 entry 也會被另起。屬邊界情境；reviewer 守則：別亂改 sourceUrl 格式。
2. **fileType / title 條件式 preserve 的邊界**：existing fileType=`unknown` + new 非 `unknown` → 以 new 替換。若 reviewer 早就把 fileType 改為 `pdf` 但 existing 出現 `unknown` 是 reviewer 編輯前的狀態 → 不會被覆寫。但 reviewer 若**故意**把 fileType 從 `pdf` 改回 `unknown` → 新 build 的 `html`（其他更明確值）會覆寫。這在實務上應該罕見；文件已說明特例規則。
3. **sourceId 衝突避讓只看既有 ids，不看本輪輸出已配發 ids**：因為新 entries 是順序處理、`nextNewIdSuffix` 也是順序遞增，本輪內不會自我衝突；但設計上仍可改為「同時檢查 existing + 已配發 set」做雙重保險（屬未來 v0.3 範圍）。
4. **Orphan 永遠保留可能導致 registry 越來越長**：若 reviewer 用 discovery 不同 query 跑多輪 build → 上輪命中、下輪變 orphan → 永遠保留 → registry 累積垃圾。屬使用流程問題；reviewer 可手動編輯 registry 刪除明確不再需要的 orphan。
5. **`--merge-with` 與 `--out` 指到同一檔案是常見用法**：本輪實作是「先讀完 merge-with → 再寫 out」，所以同檔覆寫**安全**（已實測 idempotent fixture）。文件已說明該流程。
6. **`approvedPreserved` 計數方式**：含 merged + orphan 中 `approved_for_import` 的總數；reviewer 可一眼看出「這次 merge 保護了 N 個 approved」。但未包含「approved → 仍 approved 但其他欄位變動」的情況（其他欄位變動屬 condition 特例，目前只有 fileType / title 可能變）。文件已說明 counter 意義。

---

## 【後續建議】

依優先順序：

1. **Codex 驗收 P3-10-O**：10 種 fixture（含 idempotent + deterministic）已驗證；reviewer 應對範例 fixture 跑一次 happy path 確認行為與報告一致；spot-check 一份真實 reviewer-edited registry 跑 merge 看 output 是否符合預期。
2. **Diff preview mode**：加 `--dry-run yes` 旗標印 merge 計畫（merged / newEntries / orphaned 摘要 + 列出哪些欄位會被 preserve）但不寫 output；reviewer 可先看再決定是否套用。
3. **URL hash deterministic id**：未來 v0.3 把 sourceId 改為 URL hash（如 `src-url-abc123`），完全擺脫 input 順序依賴；建議在獨立刀數做。
4. **Schema 化 merge-with 驗證**：在 `validateExistingRegistry` 內呼叫 `scripts/validate_source_registry.mjs` 的 `validateEntry` 邏輯（要先 export 該函式或 inline 簡化版），讓 merge-with 不只檢查 sourceId / sourceUrl，還包含 enum / 必填欄位。
5. **Automated test harness**：把 10 種 fixture 抽成 `scripts/__tests__/` 或 `package.json` test script，方便 CI 重跑。
6. **Pipeline 文件**：把 discovery → build / merge → review → gate → collect → normalize → review → approve → assemble paper → /quiz 整條串接寫進 `docs/PRACTICE_DATA_IMPORT_PLAN.md` C 段一條龍流程圖。

---

## 【Roadmap 同步檢查】

- ✅ PROJECT_ROADMAP.md P3-10 子分區加 🟡 P3-10-O 部分完成子彈點（含完整本輪落地說明）
- ✅ docs/PRACTICE_DATA_PLAN.md F 段加 🟡 P3-10-O 條目（位於 P3-10-N 之後）
- ✅ docs/SOURCE_REGISTRY_PLAN.md 升 v1.3（新增 E-bis-6 段「Merge / preserve」7 子段）
- ✅ docs/PRACTICE_DATA_IMPORT_PLAN.md 升 v1.4（C 段第 0 步補 P3-10-O merge）
- ✅ README.md 文件索引條目補 E-bis-6 引用
- ✅ P3-10-N / P3-10-M / P3-10-L 主條目維持原狀，僅補「下一刀已落地」連結
- ✅ P3-10-H / I / J 條目維持 source-first 方向修正註記
- ✅ P3-10 整體仍 🟡（未標完成）
- ✅ P3 整體仍 🟡（未標完成）
- ✅ P4 / P5 仍 ⬜（未啟動）

---

**特別說明**

本輪只做 **source registry merge / preserve**。

- **不代表題目已匯入**——本 CLI 不碰任何 question schema、不寫 `data/p3-example-questions.json`。
- **不代表來源自動 approved**——`--merge-with` 是 preserve-only；reviewer 若未手動把 entry 標為 `approved_for_import`，merge 仍不會自動升級；新 discovery 條目一律保守標 `pending_review` / `needs_manual_check`。
- **不代表 /quiz 已使用 imported 題庫**——`lib/data.ts` 完全未動；`/quiz` 仍跑既有 13 題範例。
- **不代表 reviewer 的編輯永遠不會被丟掉**——orphan 規則確實避免 discovery 重跑時刪掉 reviewer 工作；但若 reviewer 改 sourceUrl 改到 normalize 後不再對應到 discovery URL，merge 會走 fallback 或變 orphan（仍保留）。

本輪硬邊界全守：未呼叫 OpenAI / Brave / 任何網路 API / 未發 HTTP 請求 / 未下載任何外部資產 / 未自動產題 / 未修改正式題庫 / 未修改正式 paper / 未改 UI / 未改 schema / 未接後端 / DB / 登入 / 未紀錄真實 API key / 未把任何 generated source 自動標 `approved_for_import` / 未新增 npm 依賴 / 未處理 npm audit / 未部署 / 未 commit `.env.local` / 未 commit `*.generated.json` / 未 commit `.claude/settings.local.json`。
