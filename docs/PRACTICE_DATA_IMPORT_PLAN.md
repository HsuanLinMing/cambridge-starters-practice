# 正式練習資料匯入流程（P3-10-A）

> 對應 P3-10「正式練習資料補齊與 web resource collector」。本檔規劃**正式練習資料**如何從外部來源（官方 / 第三方 / 使用者提供 / AI 生成 / 自製）逐步進入 `/quiz` 與 `/review` 使用。
>
> 本檔屬**規劃文件**，不是強制 schema；實際 schema 仍以 [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) 為準。

最新整理：2026-05-13。

---

## A. 目標

P3-9-C 之前 `/quiz` 與 `/review` 都用**手寫範例 + 自家 SVG / TTS** 拼出題型雛形；後續要支援更完整的正式練習資料，需要一個結構化匯入流程，明確處理：

- **題庫匯入**：取得題目候選文字 → normalize → 對齊 8 種題型 schema → 進正式 paper。
- **歷屆考題匯入**：屬授權邊界較嚴格的來源；本專案使用者已明示自行承擔使用責任、本檔仍要求每題標 `source` / `sourceType`。
- **學習資料匯入**：vocabulary list / instructions / worksheet 等可作為 normalize 草稿素材，**不直接進 quiz**。
- **vocabulary / worksheet / sample paper 匯入**：依資料類型分流（vocab 進 `data/vocabulary.json`、worksheet 進 imported dataset、sample paper 屬人工觀察筆記）。
- **crawler 抓取與 AI 整理**：crawler 抓 raw → AI normalizer 出草稿 → 人工審核 → 標 `approved_for_practice` 才能進正式 paper。
- **最後轉成正式練習資料**：透過 normalizer 對齊 `ExamQuestion` discriminated union 後寫入 `data/p3-example-questions.json`（或未來新增的 `data/practice-questions.json`）。

對應的長期目標：把 `/quiz` 從「題型功能驗證版」升級為「真正可給小朋友完整練習的資料包」。

---

## B. 資料來源類型

本檔規範 7 種 `sourceType` 字面量；任何進 imported dataset 與正式 practice data 的題目都必須標。

| sourceType | 說明 | 進正式 practice data 前需要 |
| --- | --- | --- |
| `official` | Cambridge English / 官方公開頁面、官方 handbook、官方 sample paper | **人工只作參考**；硬邊界禁止複製題目 / 圖片 / 音檔；任何 normalize 候選都必須改用自家素材與自製腳本 |
| `third_party` | 第三方教學網站、社群整理、出版社題庫 | 確認來源授權；normalize 草稿仍需 human review；圖片 / 音檔不直接使用、改自製 |
| `user_provided` | 使用者主動提供的 worksheet / 題目 | 使用者已明示自行承擔使用責任；normalize 仍需 human review |
| `user_verified` | 使用者驗證過可用的網路來源（與 user_provided 區別：user_verified 來自網路抓取後使用者確認 OK） | 與 user_provided 相同：需 human review；保留 `sourceUrl` 供日後追蹤 |
| `ai_generated` | AI 出題（含 OpenAI normalize / 人工 prompt 產出） | 必須走 human review；不能直接進 quiz |
| `custom` | 維護者手寫 / 改寫題 | 內部來源；reviewStatus 可較快升 approved_for_practice，但仍要標 source |
| `handmade` | 教師 / 家長手寫題（介於 user_provided 與 custom 之間） | 與 custom 等同處理 |

**所有題目進正式 practice data 都必須有 `source` 與 `sourceType`**——這是日後可追溯、可審計的基礎。

> **source-first 原則（P3-10-L，2026-05-14）**：
>
> 上表 7 種 `sourceType` 仍維持。但**正式匯入版主線**只接受 `official` / `user_verified`（且來自官方代理發行的歷屆考題）+ 對齊 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) `sourceKind: official_sample / official_learning_material / past_paper` 的條目。
>
> - **`ai_generated` 不得用來補正式題庫數量**——可作為草稿 / 題型驗證 dev seed。
> - **`custom` / `handmade` 只作輔助 / fallback**，不混入 official / past_paper 報告中。
> - **`third_party` 不可被 reviewer 升級為 `official`**（即使對應 source 是練習網站宣稱「歷屆考題」）。
> - 來源不明的條目**不得**進 normalizer → 必須先進 source registry → 人工審核標 `approved_for_import` → 才能流入下游。

---

## C. 匯入流程

三層架構：

```
Layer 0：source registry            （source-first gate：approved_for_import 才能進下游；P3-10-L）
  ↓
Layer 1：resource index             （URL / title / 來源 metadata）
  ↓
Layer 2：imported source dataset    （crawler / collector 抓回的 raw / semi-structured）
  ↓
Layer 3：formal practice data       （normalize 後 + reviewStatus + 進 quiz / review）
```

> **Layer 0 是 P3-10-L 補入的 gate**——詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)。每個來源在進 collector / normalizer 前都應先登錄 source registry 並人工標 `approved_for_import`。

完整 7 步流程：

0. **source registry 登錄與審核（P3-10-L，2026-05-14；P3-10-M build CLI 已落地，2026-05-15）**：discovery 找到候選 URL 後，跑 `scripts/build_source_registry.mjs --input data/imported/discovered-resources.generated.json --out data/imported/source-registry.generated.json --mode build` 自動產生 source registry generated entries（**全部 pending_review / needs_manual_check，絕不 approved_for_import**）；人工審核授權 / 發行機構 / 內容 → 標 `approved_for_import` 才能進步驟 1+；`pending_review` / `needs_manual_check` / `rejected` 一律**不可** 進 normalizer。`source-registry.generated.json` 已 `.gitignore` 排除、**不**commit。詳見 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) E-bis 段。
1. **resource index 建立**：人工或腳本把要追蹤的來源加進 `data/imported/resource-index.example.json`（或 `.generated.json`）；每筆記 `url` / `title` / `sourceDomain` / `sourceType` / `resourceType` / `level` / `detectedExamParts` / `language` / `summary` / `retrievedAt` / `notes`。
2. **crawler / collector 抓取**：跑 `scripts/web_resource_collect.mjs`（見 [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md)）；index-only 模式只抓 metadata、full-text 模式抓 cleanedText + candidates。
3. **imported source dataset 保存**：collector 寫入 `data/imported/source-document.generated.json`；每筆含 `id` / `resourceId` / `sourceUrl` / `sourceName` / `sourceType` / `importedAt` / `contentType` / `title` / `description` / `headings` / `cleanedText` / `links` / `assets` / `extractedCandidates` / `provenance` / `reviewStatus: "imported_raw"`。
4. **AI 整理 / 題型分類**：normalizer（P3-10-E v0.1，`scripts/normalize_collected_sources.mjs` rule-based / mock-ai）讀 source-documents batch → 依 candidate 推斷 `type` / `starterPart` → 出 `normalized-questions.generated.json` 草稿；reviewStatus 預設 `needs_human_review`（**保守**——不自動跳 `ai_normalized`）；本輪 openai mode 屬未來範圍。
5. **人工檢查（P3-10-F v0.1 + v0.2 覆寫保護）**：跑 `scripts/review_normalized_questions.mjs --mode prepare-review` → 產 `reviewed-questions.generated.json`（reviewerFields template 預填 type / starterPart / prompt，**不自動 approve**）；reviewer 手動編輯 JSON、補 finalQuestion 必填欄位、勾選 `approved=true` + `approvedForPractice=true` + 把 reviewStatus 升為 `approved_for_practice`（或標 `rejected`）；跑 `--mode validate-reviewed` 驗證 schema + 題型規則（true-false 必 yes/no、CHOICE_TYPES 必 options>=2 且 answer 對應 options）。**覆寫保護（v0.2，2026-05-13）**：若 `--out` 已存在，必須使用 `--overwrite yes`（明確同意覆蓋）或 `--merge-with <existing>`（保留 reviewer edits 並依 mergeKey 合併新 input；orphaned 條目保留為 `status: orphaned_existing_review`）；否則 CLI 直接 exit 2，避免 reviewer 工作意外遺失。詳見 [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) F-pre-7 段。
6. **轉成 formal practice data（P3-10-K v0.1.1，2026-05-14）**：跑 `scripts/approve_reviewed_questions.mjs` 把 validate-reviewed `validationStatus=passed` 且 reviewer 已勾選 `approved=true` + `approvedForPractice=true` + `reviewStatus=approved_for_practice` 的條目扁平化為正式 `ExamQuestion`。**預設 preview**（`--mode preview`），不動正式題庫；要寫入需**雙開關**（`--mode write` + `--write yes`）；**duplicate id 全域 exit 2**——v0.1.1 拆兩種偵測：`duplicate_id_in_target`（target 既有同 id）+ `duplicate_id_in_batch`（同批 ready items 內部 id 重複），任一觸發 write mode 整批拒絕；支援 7 種題型（spelling / true-false / multiple-choice / picture-choice / word-choice / listening-choice / fill-blank），matching / listening-image-choice 標 `unsupported_question_type` skip。**`finalQuestion.source` 必須對齊 `QuestionSource` union**（`official_sample` / `past_paper` / `ai_generated` / `custom`），空值預設 `custom`，非 union 值 → `status=failed` + error `invalid_question_source`（**不** silent fallback 為 custom）；reviewer 若想表達 `user_provided` / `third_party` 等第三方來源，請保留於 `reviewerNotes` 或 discovery provenance、**不**寫入正式 `QuestionSource`。詳見 [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) F-pre-8 段。**reviewer 跑 write 後仍須自行 git diff 確認後再 commit**——CLI 不自動 commit。
7. **組裝 first practice paper（P3-10-K 第二刀 v0.1，2026-05-14）**：跑 `scripts/assemble_practice_paper.mjs` 把正式題庫（`data/p3-example-questions.json`）內的 ExamQuestion 組裝成完整 `ExamPaper` 寫入 `--papers`。**預設 preview**（`--mode preview`），不動正式 papers；要寫入需**雙開關**（`--mode write` + `--write yes`）；duplicate paper id 整批 exit 2；依 `starterSection` 分組（listening / reading-writing / speaking），sourceMix 由 question.source 自動統計，對 9 個 Cambridge Starters Parts 缺少時標 `insufficient_questions_for_part` warning。**仍不切換 `/quiz` 載入來源**（`lib/data.ts` 完全未動）；屬 P3-10-K 後續刀數範圍。詳見 [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) F-pre-8-g 段。
8. **quiz / review 使用**：UI 從 `lib/data.ts` 載入；既有 `QuizPlay.tsx` / `getStarterPartInfo` / `isCorrect` 等不需動。

每一層都應該**可重跑、可審計**：collector 重跑覆寫 generated 檔、不污染 example；normalizer 重跑可改 reviewStatus；formal data 由維護者手動 commit。

---

## D. 正式資料欄位要求

任何進 `data/p3-example-questions.json`（或未來 `data/practice-questions.json`）的題目都應該包含下列欄位；缺欄位不算硬性 schema 違規，但 normalizer / human review 應該補齊。

| 欄位 | 必填 / 選填 | 說明 |
| --- | --- | --- |
| `id` | 必填 | 全域唯一 id；建議 `q-{type-tag}-imp-{nnn}` 區別於手寫題 |
| `type` | 必填 | 對齊 `QuestionType` discriminator（8 種：multiple-choice / picture-choice / word-choice / listening-choice / fill-blank / matching / true-false / spelling） |
| `prompt` | 看題型 | spelling / picture-choice / true-false / fill-blank / multiple-choice 等都必填 |
| `options` | 看題型 | multiple-choice / picture-choice / word-choice / fill-blank 選項版 / listening-choice 必填 |
| `answer` | 必填（matching 除外） | 對齊既有 isCorrect 比對規則 |
| `explanation` | 建議 | 中文小一友善說明 |
| `starterSection` | 建議 | listening / reading-writing / speaking 三選一 |
| `starterPart` | 建議 | L1~L4 / RW1~RW5 / SP1~SP4 |
| `skillFocus` | 建議 | listening / vocabulary / spelling / reading / writing / speaking |
| `expectedAnswerType` | 建議 | choice / text / number / name / color / one-word / spoken |
| `source` | **必填** | 對應 `QuestionSource`（official_sample / past_paper / ai_generated / custom）；目前 schema 已存在 |
| `sourceUrl` | 看 sourceType | `user_provided` / `user_verified` / `third_party` 等有 URL 來源時必填 |
| `sourceName` | 必填（imported） | 來源可讀名稱（例如 "User-provided RW3 worksheet"） |
| `sourceType` | **必填** | 對齊本檔 B 段 7 種字面量 |
| `provenance` | 建議 | `{ resourceId, sourceDocumentId, normalizerVersion, originalText, candidateConfidence, notes }` |
| `importedAt` | 必填（imported） | ISO 8601；normalizer 寫入 |
| `reviewStatus` | **必填** | 對齊 [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) D 段 5 種狀態 |

**正式 quiz / review 只讀 `reviewStatus === "approved_for_practice"` 的題目**——本檔規範未來 `lib/data.ts` 應做的過濾邏輯（屬 P3-10-K 範圍、本輪不實作）。

---

## E. 最小可玩資料包

對齊 [`docs/USER_TEST_NOTES.md`](./USER_TEST_NOTES.md) 第 1 章「目前要觀察的功能」，未來正式 paper 至少要有：

### Vocabulary review
- 至少 **30 個常用單字**可在 `/review/words` / `/review/letter/*` / `/review/picture` 練習
- 對應 SVG 至少 20 張（目前 11 張 + 預計補 9 張）
- 對應發音音檔（屬 P2-4C-2B-2 範圍，本輪不做）

### Quiz demo paper（建議第一份完整 paper 組成）
- **Listening 至少 3 題**（L3 看圖選擇配新 OpenAI v2 音檔；多元主題 where is / what does X want / how many）
- **RW1 yes/no 至少 4 題**（多元主題 + 平衡 yes/no 分布）
- **RW3 spelling 至少 8 題**（動物 / 顏色 / 數字 / 家庭 / 食物等主題；每題含 spellingHint + letterScramble）
- **RW4 fill-blank 至少 3 題**（含選項版與自由填空版混合）
- **Matching 至少 2 題**（圖文配對 / 故事理解預備）

目前狀態：q-sp-001~004 / q-tf-001~002 / q-lc-001 / q-mc-001 / q-pc-001 / q-fb-001~002 / q-mt-001 共 13 題，**距離最小可玩資料包仍差**：L3 多 2 題 / RW1 多 2 題 / RW3 多 4 題。

---

## F. 後續擴充

依重要性排序：

1. **PDF parser**：sample paper / handbook 多為 PDF；需要 PDF → text + image 流程。屬中等規模，需評估依賴（pdf-parse / pdfjs-dist）。
2. **worksheet parser**：HTML / DOCX worksheet 結構化抽題；可能需要 OCR（手寫填空空格識別）。
3. **HTML question extractor**：collector full-text 模式的進階版；自動偵測 `<ol>` / `<li>` / 編號題目 / 答案。
4. **image asset downloader**：把 imported source 的圖片下載到 `tmp_crawl/` 供 normalize 參考；正式 practice data 仍**不直接使用**外部圖片（改自製）。
5. **audio asset downloader**：與 image asset downloader 同模式；正式練習仍用自製 TTS。
6. **AI question normalizer**：把 imported candidate → 正式題目草稿；屬 P3-10-E 範圍，需 OpenAI API。
7. **duplicate detector**：避免同題重複進 paper；以 prompt / answer / image 路徑作 hash。
8. **source trace viewer**：UI 工具讓維護者快速從正式題回溯 `resourceId` → `sourceDocumentId` → `sourceUrl`。
9. **import review dashboard**：列出 `imported_raw` / `ai_normalized` / `human_review_required` 三種待審題目；可批次標 approve / reject。

本輪只完成第 3 點（minimal HTML extractor）的最小原型；其他屬 P3-10-D / E / F / G 後續刀數。

---

## G. 與既有文件的關係

| 文件 | 對齊重點 |
| --- | --- |
| [`docs/PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | 「目前明確不做」清單仍維持邊界；本檔的 user_verified / user_provided / ai_generated 流程不違反硬邊界 |
| [`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md) | 既有 `QuestionSource` 字面量為 4 種；本檔擴張為 7 種 `sourceType`，屬規劃層，需要 schema 升級時走獨立 PR |
| [`docs/STARTERS_PART_TEMPLATES.md`](./STARTERS_PART_TEMPLATES.md) | normalize 必須對齊各 Part 的 schema 與練習版描述 |
| [`docs/OFFICIAL_RESOURCES.md`](./OFFICIAL_RESOURCES.md) | resource index 的 `official` 項目仍走「人工瀏覽參考、不下載複製」邊界 |
| [`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md) | AI normalizer（P3-10-E）的 prompt 設計可重用既有 AI 出題 prompt |
| [`docs/WEB_RESOURCE_COLLECTOR_PLAN.md`](./WEB_RESOURCE_COLLECTOR_PLAN.md) | crawler 規格與 CLI 模式 |
| [`docs/QUESTION_IMPORT_NORMALIZATION_PLAN.md`](./QUESTION_IMPORT_NORMALIZATION_PLAN.md) | normalize 規格與 reviewStatus 流程 |
| [`docs/USER_TEST_NOTES.md`](./USER_TEST_NOTES.md) | 實機觀察影響「正式 paper 規模」決策（本檔 E 段） |
| [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md) | source-first 原則 / source registry gate（Layer 0，P3-10-L） |

---

## H. 版本

- **v1**（2026-05-13）：第一版——P3-10-A 規劃文件骨架、定義 7 種 sourceType、三層架構流程、正式資料欄位要求、最小可玩資料包目標、後續擴充清單。本檔屬規劃層，不含實際 schema 變更；schema 變更走獨立刀數。
- **v1.2**（2026-05-15）：對應 P3-10-M——C 段第 0 步「source registry 登錄與審核」更新：discovery 找到候選 URL 後可改用 `scripts/build_source_registry.mjs` 自動轉成 source-registry generated entries（替代純手寫 example）；其他流程不變、Layer 0 邊界不變、`approved_for_import` 仍須 reviewer 人工手動標。本檔仍屬規劃層，**未修改** schema / 未修改正式題庫 / 未實作 normalizer / collector gate。
- **v1.1**（2026-05-14）：對應 P3-10-L——B 段補 source-first 原則（ai_generated 不得補正式題庫數量、custom 只作輔助、third_party 不可升 official、來源不明不得進 normalizer）；C 段架構圖補 Layer 0 source registry gate + 第 0 步「source registry 登錄與審核」；G 段加引用 [`docs/SOURCE_REGISTRY_PLAN.md`](./SOURCE_REGISTRY_PLAN.md)。本檔仍屬規劃層，**未修改** schema 或正式題庫。
