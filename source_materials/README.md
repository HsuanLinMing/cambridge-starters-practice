# source_materials/

本資料夾是 **Cambridge Starters Practice 的本機素材整理區**。使用者把官方 sample / 歷屆題 / AI 草稿 / 自製題的**整理後文字**放進來，後續轉成 `data/*.json` 給 app 使用。

> ⚠️ **這不是正式公開的資料庫**。本專案不部署、不上線、不對外散布；本資料夾的素材以**自家學習用**為前提（見 `docs/PRODUCT_SPEC.md`「產品定位」與「目前明確不做」）。

## 資料夾結構

```
source_materials/
├── README.md                 # 本檔（匯入 SOP 主文件）
├── .gitignore                # 排除原始 PDF / 圖片 / 音檔
├── samples/                  # 官方 sample 整理；對應 source: "official_sample"
├── past_papers/              # 歷屆題整理；對應 source: "past_paper"
├── ai_generated/             # AI 生成題草稿；對應 source: "ai_generated"
└── custom/                   # 自製題；對應 source: "custom"
    └── example-question-draft.md   # 範例草稿格式
```

## 資料夾與 `source` 對應

每筆題目須在 `data/*.json` 中明確標記 `source`，與本資料夾子目錄一一對應：

| 資料夾 | 對應 `source` | 說明 |
| --- | --- | --- |
| `samples/` | `official_sample` | 官方公開的 sample papers / 樣題整理出的題目 |
| `past_papers/` | `past_paper` | 歷屆考題整理（**自家學習用，不對外散布**） |
| `ai_generated/` | `ai_generated` | AI 依 Starters 風格生成的仿真題 |
| `custom/` | `custom` | 使用者自製或老師補充 |

P3 schema 詳細欄位見 [`../docs/DATA_SCHEMA.md`](../docs/DATA_SCHEMA.md) 的「P3 考前練習：題庫 / 考卷 / Session schema」與 `lib/types.ts` 的 `BaseQuestion` / `ExamQuestion`。

## 可以放什麼

- 使用者**手動整理的文字內容**（對應 4 種 source）：
  - 從可公開取得的官方 sample papers **抄寫整理**出的題目文字
  - 歷屆題整理（自家學習用）
  - AI 對話複製的仿真題草稿
  - 純原創自製題
- 使用者**自製圖片**：
  - 自繪 SVG（建議放 `../public/images/`，本資料夾僅放文字描述 / 草稿）
  - 自拍照片重畫成可用素材
- 使用者**自製音檔**：
  - TTS 自製（macOS `say -o` / Web Speech / 雲端 TTS）
  - 自錄音檔
- **整理後的純文字**：`.md` / `.txt` / `.csv` / `.json` / `.jsonc`

## ⚠️ 禁止做（重要）

- ❌ **不要寫自動爬蟲抓網路素材**（任何時候）。
- ❌ **不要下載 Cambridge 官方圖片**或官方掃描檔。
- ❌ **不要下載歷屆考題官方圖片**或官方掃描檔。
- ❌ **不要把有版權風險的原始素材 commit 進 git**（PDF / 官方掃描圖 / 官方音檔等）。
- ❌ **不要把原始 PDF / 官方素材直接視為可散布內容**（即使存在本機，也不該散布）。
- ❌ **不要 hard-link 或 reference 公開網路上的官方素材 URL**。
- ❌ **不要在草稿或正式 JSON 中放外部圖片 / 音檔 URL**——`image` / `audio` 一律本機路徑（`/images/<filename>` 或 `/audio/<filename>`）。

## 官方資源與歷史題整理原則

> 本節對應 `PROJECT_ROADMAP.md` 的 **P3-7 官方資源索引與人工整理流程**。未來會在 `source_materials/`（與規劃中的 `docs/OFFICIAL_RESOURCES.md`）整理 Cambridge Pre A1 Starters 官方公開資源；整理時請嚴守以下「可以做 / 不可做」邊界。

### ✅ 可以做

- ✅ **保存官方資源連結**（official format 頁、sample papers 頁、wordlist、mock test toolkit URL、Lyrics & instructions 等）。
- ✅ **保存人工整理的題型結構筆記**（每個 Part 有幾題、選項類型、出題風格、考點），用自己的話描述、不抄原文。
- ✅ **保存自製題**（基於題型結構、用自家 vocabulary 自寫，標 `source: "custom"`）。
- ✅ **保存 AI 仿真題**（依 P3-3 / P3-8 流程生成，標 `source: "ai_generated"`，先進 `ai_generated/`、經人工審核後再轉正式 JSON）。
- ✅ **保存自己畫的圖片**（自製 SVG / 自繪重畫；放 `../public/images/`，本資料夾僅放文字描述 / 草稿）。
- ✅ **保存自製音檔**（TTS 自製、自錄音；放 `../public/audio/`）。

### ❌ 不可做

- ❌ **不要寫自動爬蟲**抓 Cambridge 官方網站或任何官方 / 第三方題庫網站。
- ❌ **不要把官方 PDF / 官方圖片 / 官方音檔 commit 到 repo**（即使本專案目前不公開 repo 仍不可，避免未來誤推上公開平台時觸雷）。
- ❌ **不要直接複製歷屆題內容進正式題庫**——不抄、不改寫、不變形。歷屆題只能在人工筆記中**用自己的話**描述「這個 Part 大致長什麼樣」。
- ❌ **不要使用網路圖片當正式題目素材**——一律自製或請 AI 出 `imagePrompt` 由人手繪。
- ❌ **不要聲稱 AI 題目是官方題**（必標 `source: "ai_generated"`；不假裝為 `official_sample` / `past_paper`）。
- ❌ **不要把官方資源連結 hard-link 進題目 JSON 的 `image` / `audio` 欄位**——連結只放在 `docs/OFFICIAL_RESOURCES.md`（規劃中）等人工筆記檔，不進題庫資料。

> 簡言之：官方資源**只用來理解題型結構**；正式題庫的內容**永遠是自製或經人工審核的 AI 仿真題**。

## Git 政策

本資料夾配合 `source_materials/.gitignore` 排除原始二進位素材：

| 類型 | 規則 |
| --- | --- |
| **可以 commit** | `.md` / `.txt` / `.csv` / `.json` / `.jsonc` / `.yaml` / `.yml` / `.gitkeep` |
| **不可 commit** | `.pdf` / `.jpg` / `.jpeg` / `.png` / `.gif` / `.webp` / `.bmp` / `.tiff` / `.mp3` / `.wav` / `.m4a` / `.ogg` / `.aac` / `.flac` / `.mp4` / `.mov` / `.avi` / `.zip` / `.rar` / `.7z` / `.tar*` |

> 雖然本專案**不上線、不公開 repo**（見 `docs/PRODUCT_SPEC.md`「目前明確不做」），但這份政策仍應遵守，避免未來誤把專案推上公開平台時觸雷。

整理後的**自製文字內容**（無版權疑慮）可以 commit，作為「家中複習素材庫」的版本控制。

## 建議流程

1. 使用者**手動整理題目文字**（從官方 sample 重新抄寫、從 AI 對話複製、自製）。
2. 把整理後的文字檔放到 `source_materials/<對應分類>/`，命名建議帶日期或批次（例如 `2026-05-08-food-batch01.md`）。
3. （未來工具）由 P3-2-B 的轉換工具或**人工**整理成 `data/p3-example-questions.json` 或正式題庫 JSON，每題明確標記 `source`。
4. 圖片與音檔**只引用本機資源**：
   - 圖片放 `../public/images/`，題目 JSON 的 `image: "/images/<filename>.svg"`。
   - 音檔放 `../public/audio/`，題目 JSON 的 `audio: "/audio/<filename>.mp3"`。
5. **不要在題目 JSON 中放外部 URL**。

## 與 P3-1 schema 的關係

- 本資料夾的**整理後文字**是 P3 題庫的「上游」。
- 整理出來的題目須對齊 [`../docs/DATA_SCHEMA.md`](../docs/DATA_SCHEMA.md) 的 `BaseQuestion` + 6 種 `QuestionType`：`multiple-choice` / `picture-choice` / `word-choice` / `listening-choice` / `fill-blank` / `matching`。
- TypeScript 型別在 `lib/types.ts` 的 P3 區塊。
- 範例草稿格式見 [`custom/example-question-draft.md`](./custom/example-question-draft.md)。

## 命名建議

| 對象 | 建議格式 | 範例 |
| --- | --- | --- |
| 草稿檔名 | `<日期>-<主題>-<批次>.md` | `2026-05-08-food-batch01.md` |
| 題目 id | `<題型前綴>-<分類>-<流水號>` | `q-mc-001` / `q-pc-food-001` / `q-lc-listening1-001` |
| 考卷 id | `<考試類型>-<變體>-<流水號>` | `starters-mock-001` / `starters-listening-only-001` |

題目 id **全域唯一**，避免與 `data/p3-example-questions.json` 既有 id 撞名。

## 不在 P3-2-A 範圍

下列項目**本子階段不做**，留給 P3-2-B 或後續：

- 自動匯入 CLI / script。
- 自動文字 → JSON 轉換工具。
- 圖片 / 音檔自動命名 helper。
- TTS 自動生成 wrapper。
- AI 出題 prompt 標準格式（屬 P3-3）。

P3-2-A 只負責**人工流程的文件化與資料夾結構**，不負責任何自動化。
