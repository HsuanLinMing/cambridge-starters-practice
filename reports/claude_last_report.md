# Claude Code 回報 — P3-10-N：Collector / Normalizer approved_for_import gate

> 任務：P3-10-N — 在 collector / normalizer / single-URL collector 三個 CLI 加上 source-registry approved_for_import 程式層 gate；把 P3-10-L / P3-10-M 已建立的 source-first 規則從**文件規範**升級為**強制執行**。
>
> 任務日期：2026-05-15。

---

## 【本輪修改摘要】

1. **新增共用 helper `scripts/source_registry_gate.mjs`**：暴露 4 個函式 `normalizeSourceUrlForGate` / `loadSourceRegistry` / `buildApprovedUrlSet` / `classifyUrlAgainstRegistry`，避免在三個 CLI 重複 URL normalization / 載入 registry / 分類邏輯。
2. **`scripts/collect_discovered_resources.mjs` v0.1 → v0.2**：新增 `--source-registry <path>` flag；提供時於 eligible 前過 gate；未命中 approved → skipped + reason code（**不 fetch / 不 HEAD / 不寫 source-document**）。
3. **`scripts/normalize_collected_sources.mjs` v0.1 → v0.2**：新增 `--source-registry <path>` flag；提供時 gate 套用於 `source_document.url`；未命中 approved 一律僅輸出 skipped item（**不產 draft / observation**）。
4. **`scripts/web_resource_collect.mjs` v0.1**（最小變更）：新增 `--source-registry <path>` optional flag；提供時於 fetch 前 gate；未命中 approved → exit 0 不 fetch / 不寫檔。CLI 介面與既有 JSON schema 完全不變。
5. **URL normalization v0.1 規則**：lowercase host / strip trailing slash（pathname=/ 除外）/ 保留 search / 移除 fragment；**絕對不做** domain-level 放行 / **不做** fuzzy match / **不做** utm_* 清除。
6. **5 種端到端 fixture 測試全綠**（A approved + not approved + not-in-registry / B 0 approved / C no flag legacy / D invalid registry exit 2 / E URL normalization 案例）。
7. **文件同步**：4 份 docs + roadmap + README 索引補 P3-10-N 段。
8. **未動**：`lib/types.ts` / `lib/data.ts` / `data/p3-example-questions.json` / `data/exam-papers.example.json` / `app/*` / `components/*` / `.gitignore` / `package.json` / 任何 npm 依賴。

---

## 【修改檔案清單】

新增：

- `scripts/source_registry_gate.mjs`（共用 gate helper）

修改：

- `scripts/collect_discovered_resources.mjs`（v0.1 → v0.2）
- `scripts/normalize_collected_sources.mjs`（v0.1 → v0.2）
- `scripts/web_resource_collect.mjs`（v0.1，最小變更：top-level import 整理 + --source-registry flag）
- `docs/SOURCE_REGISTRY_PLAN.md`（升 v1.2，新增 E-bis-5 段）
- `docs/PRACTICE_DATA_IMPORT_PLAN.md`（升 v1.3，C 段第 0 步補 P3-10-N gate 落地）
- `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`（升 v4.4，A 段補 P3-10-N 程式層 gate）
- `docs/WEB_RESOURCE_COLLECTOR_PLAN.md`（升 v1.4，G 段重寫補 P3-10-N gate）
- `docs/PRACTICE_DATA_PLAN.md`（升 v1.3，F 段加 🟡 P3-10-N + B 段保持）
- `PROJECT_ROADMAP.md`（加 🟡 P3-10-N 子彈點，完整落地說明）
- `README.md`（SOURCE_REGISTRY_PLAN 索引條目補 E-bis-5）
- `reports/claude_last_report.md`（本檔；覆寫上一輪 P3-10-M 內容）

未動：

- `data/p3-example-questions.json` / `data/exam-papers.example.json`
- `data/imported/source-registry.example.json` / `data/imported/discovered-resources.example.json` / `data/imported/search-results.example.json`
- `lib/types.ts` / `lib/data.ts` / `components/*` / `app/*`
- `scripts/build_source_registry.mjs` / `scripts/validate_source_registry.mjs`（P3-10-M / P3-10-L 不動）
- `scripts/discover_resources.mjs`（discovery 不在本輪範圍）
- `.gitignore` / `package.json`
- 其他既有 docs（OFFICIAL_RESOURCES / DISCOVERY_CRAWLER_PLAN / 等不再 touch）

---

## 【Source registry gate 設計】

### Helper API（`scripts/source_registry_gate.mjs`）

| 函式 | 用途 |
| --- | --- |
| `normalizeSourceUrlForGate(value)` | 把任意 URL 字串 normalize 為比對用 canonical 字串；不可解析回 null |
| `loadSourceRegistry(path, { readJsonFile })` | 讀 registry JSON；非 array 時 throw（caller 應接住、exit 2） |
| `buildApprovedUrlSet(registry)` | 回 `{ approvedUrls: Map<normalizedUrl, entry>, duplicateIds: string[] }`，只收 `reviewStatus === "approved_for_import"` 條目 |
| `classifyUrlAgainstRegistry(url, registry, approvedUrls)` | 對單一 URL 回 `{ matched, status, sourceId, normalizedUrl, reason }` |

caller 提供 `readJsonFile` helper（mirrors 既有 CLI 的錯誤訊息風格）；helper 本身不依賴 fs，便於未來測試替換。

### 共用 reason codes

```
skipped_not_in_source_registry             URL 不在 source registry
skipped_source_not_approved_for_import     URL 在 registry，但 reviewStatus ≠ approved_for_import
skipped_invalid_url_for_gate               URL 不可解析為合法 URL
```

每個 CLI 在套用 gate 時都把這三個 code push 到對應 entry 的 warnings；上游可從 warnings 一眼看出 gate 結果。

### Summary 區塊（per-CLI）

兩個 batch CLI（`collect_discovered_resources` / `normalize_collected_sources`）的 summary 都會多一個 `sourceRegistry` 區塊：

```jsonc
"sourceRegistry": {
  "sourceRegistryInput": "/abs/path/to/source-registry.generated.json",  // null when --source-registry not provided
  "sourceRegistryEntries": 3,
  "approvedSources": 1,
  "duplicateSourceIdsInRegistry": [],
  "skippedNotInSourceRegistry": 1,
  "skippedSourceNotApprovedForImport": 2,
  "skippedInvalidUrlForGate": 0
}
```

當 `--source-registry` 未提供時：

```jsonc
"sourceRegistry": {
  "sourceRegistryInput": null,
  "gateEnabled": false,
  "note": "source-first gate disabled; legacy / dev flow only"
}
```

stderr 行也對應印 `gate: approvedSources=X skippedNotInRegistry=Y skippedNotApproved=Z` 摘要，方便 reviewer 在 console 快速看到 gate 結果。

---

## 【collect_discovered_resources gate 結果】

執行：

```bash
node scripts/collect_discovered_resources.mjs \
  --input /tmp/p3-10-n/discovery.json \
  --out /tmp/p3-10-n/batch.json \
  --source-registry /tmp/p3-10-n/registry.json \
  --limit 10 --dry-run yes
```

Registry：1 approved（`/approved`）/ 1 pending_review（`/pending`）/ 1 needs_manual_check（`/check`）。
Discovery：4 URLs（approved / pending / check / not-in-registry）。

**結果**：

| disc id | URL | status | reason code |
| --- | --- | --- | --- |
| disc-A | `/approved` | `dry_run`（gate 通過）| `dry_run` |
| disc-B | `/pending` | `skipped` | `skipped_source_not_approved_for_import` |
| disc-C | `/check` | `skipped` | `skipped_source_not_approved_for_import` |
| disc-D | `/not-in-registry` | `skipped` | `skipped_not_in_source_registry` |

Summary：`totalInput=4 eligible=1 collected=0 dryRun=1 skipped=3 failed=0`；
sourceRegistry：`approvedSources=1 skippedNotInRegistry=1 skippedNotApproved=2 skippedInvalidUrl=0`。

---

## 【normalize_collected_sources gate 結果】

執行：

```bash
node scripts/normalize_collected_sources.mjs \
  --input /tmp/p3-10-n/source-docs-batch.json \
  --out /tmp/p3-10-n/normalized.json \
  --source-registry /tmp/p3-10-n/registry.json \
  --mode rule-based --limit 10
```

Input batch 含 3 個 `status=collected` + `document.kind=source_document` 條目（approved / pending / not-in-registry），各帶 1 個 `extractedCandidate`。

**結果**：

| disc id | URL | status | draft 產出 | reason code |
| --- | --- | --- | --- | --- |
| disc-A | `/approved` | `draft`（gate 通過、產 draft） | ✅ 有 draft | `rule_based_no_answer_inferred` |
| disc-B | `/pending` | `skipped`（gate 拒絕，**不產 draft / observation**）| ❌ | `skipped_source_not_approved_for_import` |
| disc-D | `/not-in-registry` | `skipped`（gate 拒絕）| ❌ | `skipped_not_in_source_registry` |

Summary：`totalInput=3 eligible=1 drafts=1 observations=0 skipped=2 failed=0`；
sourceRegistry：`approvedSources=1 skippedNotInRegistry=1 skippedNotApproved=1 skippedInvalidUrl=0`。

**驗收要點**：未命中 approved 的 source 一律**不產 draft、不產 observation**——避免題庫被未授權來源污染。

---

## 【URL normalization 規則】

對齊 `scripts/source_registry_gate.mjs` 的 `normalizeSourceUrlForGate(value)`：

| Step | 規則 |
| --- | --- |
| 1 | URL parse；不可解析回 null（caller 應分類為 `skipped_invalid_url_for_gate`） |
| 2 | **protocol 保留**（`http` / `https` 視為不同 URL） |
| 3 | **host 轉小寫**（`EXAMPLE.COM/x` 與 `example.com/x` 視為同 URL） |
| 4 | **pathname**：結尾若為單一 `/` 保留（如 `https://example.com/`）；其他 trailing slash 移除（如 `/x/` → `/x`） |
| 5 | **search**（query string）**保留** — 可能帶有意義（如 `?id=123` / `download.asp?file=xxx`） |
| 6 | **fragment**（`#anchor`）**移除** — 純 client-side、不影響來源同一性 |

**特別不做**：
- ❌ 不做 utm_* / tracking param 清除（屬未來範圍；若 reviewer 需要更激進的 normalization，需在 registry 的 sourceUrl 與 caller 上游同步處理）
- ❌ 不做 domain-only 放行（同網域不同 path 一律視為不同 source）
- ❌ 不做 fuzzy match

### Fixture E 驗收

Registry 標 `https://example.com/approved/`（**尾斜線**）+ discovery 三個變體：

| discovery URL | 比對結果 |
| --- | --- |
| `https://example.com/approved` | ✅ matched（尾斜線標準化） |
| `https://EXAMPLE.COM/approved` | ✅ matched（host case 標準化） |
| `https://example.com/approved#section1` | ✅ matched（fragment 移除） |

3 URLs 都正確通過 gate。

---

## 【測試 fixtures 結果】

| Fixture | 內容 | 預期 | 實際 |
| --- | --- | --- | --- |
| **A：approved + not approved + not-in-registry** | registry 1 approved / 1 pending_review / 1 needs_manual_check；4 discovery URLs | 1 通過 / 3 skipped 並分類正確 | ✅ collect pipe：dryRun=1 / skipped=3（含 2× not_approved + 1× not_in_registry）；normalizer：drafts=1 / skipped=2 |
| **B：0 approved sources** | registry 1 entry pending_review；4 discovery URLs | 全部 skipped、`approvedSources=0`、不 crash | ✅ collect pipe：eligible=0 / dryRun=0 / skipped=4；approvedSources=0 |
| **C：no `--source-registry`** | flag 省略 | 既有行為（無 regression）+ warning 提示 | ✅ collect pipe：eligible=4 / dryRun=4 / skipped=0；stderr 印 warning；summary `sourceRegistry={gateEnabled:false}` |
| **D：invalid registry JSON** | registry 是 `{ "not": "array" }` 物件 / 或 malformed JSON | exit 2 + 印 hint + **不寫輸出檔** | ✅ 兩種 invalid 路徑都 exit 2；batch.json 未建立 |
| **E：URL normalization** | registry sourceUrl 帶尾斜線；discovery 3 變體（無尾斜線 / 大寫 host / 含 fragment） | 3 個都 matched | ✅ 全部 dry_run、approvedSources=1、skipped=0 |
| **web_resource_collect gate rejection** | `--url /not-in-registry` + `--source-registry registry.json` | exit 0 不 fetch / 不寫檔、stderr 印原因 | ✅ exit=0；印 `skipped_not_in_source_registry` |
| **web_resource_collect pending_review** | `--url /pending` + `--source-registry registry.json` | exit 0、印 sourceId + reviewStatus | ✅ 印 `sourceId=src-test-002 reviewStatus="pending_review"` |
| **web_resource_collect invalid registry** | `--url /approved` + `--source-registry registry-bad-shape.json` | exit 2 + hint | ✅ exit 2 |
| **normalize_collected_sources no gate** | `--source-registry` 省略 | 既有行為（3 個都產 draft）+ warning | ✅ drafts=3 / skipped=0；gate: disabled |
| **normalize_collected_sources invalid registry** | invalid JSON | exit 2 | ✅ exit 2 |

所有 fixtures 跑完後 `/tmp/p3-10-n/` 已清除；fixture 內容**從未** commit。

---

## 【文件同步內容】

| 文件 | 變更 |
| --- | --- |
| `docs/SOURCE_REGISTRY_PLAN.md` | 升 v1.2；新增 E-bis-5 段「Collector / Normalizer source-first gate」含 helper API / Gate 行為總覽表（8 種情境）/ URL normalization 規則 6 條 / 「不在 P3-10-N 範圍」4 條硬邊界 |
| `docs/PRACTICE_DATA_IMPORT_PLAN.md` | 升 v1.3；C 段第 0 步補 P3-10-N gate 已落地說明（三個 CLI 加 flag） |
| `docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md` | 升 v4.4；A 段「關鍵原則」source-first 條補 P3-10-N 程式層 gate 說明 + 3 種 skipped reason 列舉 |
| `docs/WEB_RESOURCE_COLLECTOR_PLAN.md` | 升 v1.4；G 段重寫補 P3-10-N gate 落地（單 URL 版 / pipe 版兩種 CLI 行為差異） |
| `docs/PRACTICE_DATA_PLAN.md` | 升 v1.3；F 段加 🟡 P3-10-N 部分完成條目（位於 P3-10-M 之後） |
| `PROJECT_ROADMAP.md` | P3-10 子分區加 🟡 P3-10-N 子彈點（完整本輪落地說明 + URL normalization 規則 + 5 種 fixture 測試結果 + 硬邊界 + 不擴大 scope） |
| `README.md` | 文件索引 SOURCE_REGISTRY_PLAN 條目補 E-bis-5 P3-10-N gate 引用 |

---

## 【測試結果】

| 指令 | 結果 |
| --- | --- |
| `npm run lint` | ✅ 0 errors / 0 warnings |
| `npm run typecheck` | ✅ 通過（tsc --noEmit 無輸出） |
| `npm run build` | ✅ Compiled successfully；88 pages prerendered（UI 完全未動） |
| `node scripts/collect_discovered_resources.mjs --help` | ✅ exit 0；P3-10-D-3 / P3-10-N v0.2 標題；`--source-registry` flag 列出 + gate 行為段 |
| `node scripts/normalize_collected_sources.mjs --help` | ✅ exit 0；P3-10-E / P3-10-N v0.2 標題；`--source-registry` flag 列出 + filter 段補 P3-10-N 3 種 skipped reason |
| `node scripts/web_resource_collect.mjs --help` | ✅ exit 0；P3-10-B / P3-10-N 標題；`--source-registry` flag 列出 + Example 段補 source-first 範例 |
| Fixture A（mixed approved / not approved / not-in-registry） | ✅ collect + normalize 兩個 CLI 都正確分流 |
| Fixture B（0 approved） | ✅ 全部 skipped、不 crash、`approvedSources=0` |
| Fixture C（no `--source-registry`） | ✅ 既有行為保留、stderr 印 warning |
| Fixture D（invalid registry JSON × 2） | ✅ 兩種路徑都 exit 2 + 不寫輸出檔 |
| Fixture E（URL normalization 3 變體） | ✅ 全部 matched |
| `git diff --stat` for `data/p3-example-questions.json` / `data/exam-papers.example.json` / `lib/*` / `components/*` | ✅ 全部 0 變更 |

---

## 【仍未處理】

- ⬜ **Multi-round merge / preserve**：若 reviewer 已對 generated registry 內某條目改 reviewStatus=approved_for_import + 加 rightsNotes，目前 build_source_registry 重跑會覆寫；需 merge tool（類似 P3-10-F 的 `--merge-with`）。
- ⬜ **utm_* / tracking param 清除**：本輪刻意不做，避免 normalize 規則太激進；屬未來範圍。
- ⬜ **`--strict` mode**：未提供 `--source-registry` 時目前印 warning + 繼續跑（legacy / dev flow）。未來可加 `--strict yes` 把 warning 升為 exit 2，強制正式匯入版必須啟用 gate。
- ⬜ **Gate audit log**：可選擇把每筆 gate 決策（pass / skip + 原因）寫入獨立 audit log JSON，方便 reviewer 跨 batch 統計。
- ⬜ **Connection 到 P3-10-F approved_for_practice**：本輪 gate 只到「來源層」approved_for_import；題目層級的 approved_for_practice 仍由 P3-10-F human review CLI 處理。整條 pipeline 端到端串接（discovery → registry → gate → collector → normalizer → review → approve → assemble paper → /quiz）仍未做。

---

## 【風險點】

1. **URL normalization 規則保守可能擋住合法 source**：例如 registry 標 `https://example.com/page?utm_source=newsletter`，discovery 抓到的可能是 `https://example.com/page?utm_source=twitter` — 兩個 query string 不同，gate 視為不同 URL → 拒絕。若 reviewer 預期同 path 同 source，需手動把 registry sourceUrl 與 discovery URL 對齊（或未來加 utm_* 清除）。
2. **gate 通過 ≠ 題目通過 human review**：gate 是「來源層」通過。即使來源 approved，normalizer 仍會把 candidates 標 `reviewStatus: needs_human_review`、`isReadyForPractice: false`，必須走 P3-10-F human review 才能成為 approved_for_practice。文件 + 報告處處標示，避免 reviewer 誤把 gate 通過當「已通過審核」。
3. **registry 含 duplicate sourceId 時 gate 仍可運作**：buildApprovedUrlSet 取第一個 entry；但 stderr 會印 warning，提醒 reviewer 用 `scripts/validate_source_registry.mjs` v0.1.1 修正。**不 crash** 是設計選擇——避免重跑 pipeline 時被 registry 上游問題阻斷。
4. **三個 CLI 各自獨立檢查 gate**：reviewer 可能在不同 CLI 間用不同 `--source-registry` 路徑，造成 gate 行為不一致。建議 reviewer 在 pipeline 內始終用同一份 generated registry。
5. **invalid URL 不會 crash 但會被分類為 `skipped_invalid_url_for_gate`**：URL 無法 parse 時直接 skipped；上游應自行確認 discovery output 不含垃圾 URL（discovery 階段已過 URL parse，本層只是再保險）。
6. **`web_resource_collect.mjs` 的 gate 行為與其他 CLI 略不同**：單 URL CLI 在 gate 拒絕時是 `exit 0 不寫檔`，而 pipe CLI 是 `寫檔 + skipped item`。這是設計選擇——單 URL 模式對應「reviewer 手動測一個 URL」的 dev 流程，pipe 模式對應「batch 留 audit trail」。文件已說明此差異。

---

## 【後續建議】

依優先順序：

1. **Codex 驗收 P3-10-N**：5 種 fixture + 3 個 CLI 已驗證；reviewer 應 spot-check 三個 CLI 的 `--help` 內容、跑一次 fixture A 確認 gate 行為與報告一致。
2. **`--strict` mode**：把「未提供 `--source-registry`」從 warning 升為 exit 2（在獨立 flag 下開啟）。
3. **merge / preserve tool for generated registry**：避免 reviewer 編輯被下次 build_source_registry 重跑覆寫。
4. **utm_* 清除**：在 `normalizeSourceUrlForGate` 加可選 utm_* / fbclid / gclid 清除（透過旗標啟用，預設關閉以保留向後相容）。
5. **Pipeline 端到端文件**：把 discovery → build_source_registry → human-approve → collect → normalize → review → approve → assemble paper → /quiz 整條串接寫進 `docs/PRACTICE_DATA_IMPORT_PLAN.md` C 段 / E-bis 段；目前各步驟散落在多個檔。
6. **Gate audit log**：把每筆 gate 決策獨立寫入 audit log（reviewer 可跨 batch 統計、追蹤被拒絕來源的趨勢）。

---

## 【Roadmap 同步檢查】

- ✅ PROJECT_ROADMAP.md P3-10 子分區加 🟡 P3-10-N 部分完成子彈點（含完整本輪落地說明 + 三個 CLI 版本差異 + URL normalization 規則 + 5 種 fixture 測試結果 + 硬邊界）
- ✅ docs/PRACTICE_DATA_PLAN.md F 段加 🟡 P3-10-N 部分完成條目（位於 P3-10-M 之後）
- ✅ docs/SOURCE_REGISTRY_PLAN.md 升 v1.2（新增 E-bis-5 段）
- ✅ docs/PRACTICE_DATA_IMPORT_PLAN.md 升 v1.3（C 段第 0 步補 P3-10-N gate 落地）
- ✅ docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md 升 v4.4（A 段補 P3-10-N 程式層 gate 說明）
- ✅ docs/WEB_RESOURCE_COLLECTOR_PLAN.md 升 v1.4（G 段重寫補 P3-10-N gate 落地）
- ✅ P3-10-M 主條目維持 🟡（部分完成）；本輪未動其內容、僅補「未做」清單對應的下一刀已落地連結
- ✅ P3-10-L 主條目維持 ✅；P3-10-L 修補子彈點維持 🟡（等 Codex 重新驗收）
- ✅ P3-10-H / I / J 條目維持 source-first 方向修正註記，**不再** 是 AI 補題
- ✅ P3-10 整體仍 🟡（未標完成）
- ✅ P3 整體仍 🟡（未標完成）
- ✅ P4 / P5 仍 ⬜（未啟動）

---

**特別說明**

本輪只做 **source registry approved_for_import gate**。

- **不代表題目已匯入**——本 CLI 不碰任何 question schema、不寫 `data/p3-example-questions.json`。
- **不代表題目已 human review 通過**——gate 是「來源層」通過；題目仍須走 P3-10-E normalizer 產 draft + P3-10-F human review 標 approved_for_practice。
- **不代表 /quiz 已使用 imported 題庫**——`lib/data.ts` 完全未動；`/quiz` 仍跑既有 13 題範例。
- **不代表 source registry 自動填充**——`source-registry.generated.json` 由 P3-10-M build CLI 產出（pending_review / needs_manual_check）；**reviewer 仍須手動標 approved_for_import** 才有 URL 通過 gate。
- **不做 domain-only 放行**——同網域不同 path 一律視為不同 source；硬邊界。

本輪硬邊界全守：未呼叫 OpenAI / Brave / 任何網路 API / 未發 HTTP 請求（測試全用 /tmp fixture + dry-run）/ 未下載任何外部資產 / 未自動產題 / 未修改正式題庫 / 未修改正式 paper / 未改 UI / 未改 schema / 未接後端 / DB / 登入 / 未紀錄真實 API key / 未把任何 generated source 標 approved_for_import / 未新增 npm 依賴 / 未處理 npm audit / 未部署 / 未 commit `.env.local` / 未 commit `*.generated.json` / 未 commit `.claude/settings.local.json`。
