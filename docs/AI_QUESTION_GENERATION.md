# AI 仿真題 Prompt 標準格式（P3-3）

> 本檔是 P3-3 的規格文件——定義「請 AI 生成 Cambridge Starters 風格仿真題」的目標、輸出格式、品質檢查標準。
>
> 配套檔案：
> - `source_materials/ai_generated/prompt-template.md`：可直接複製給 AI 使用的 prompt 範本。
> - `source_materials/ai_generated/example-ai-questions.md`：6 題涵蓋 6 題型的 AI 草稿範例。
>
> 本檔**不**包含實際 AI 工具串接（OpenAI / Anthropic API 客戶端）；那屬 P3-3-B 或未來範圍。

## 1. AI 仿真題的定位

| 是 | 不是 |
| --- | --- |
| ✅ 依 Cambridge Starters 題型「**風格**」製作的全新題目 | ❌ 官方真題 |
| ✅ AI 出題、人工檢查、自家學習用 | ❌ 歷屆題複製 / 改寫 / 變形 |
| ✅ 用來讓小朋友熟悉題型、建立信心 | ❌ 對外散布的試題庫 |
| ✅ 自製內容、無版權疑慮 | ❌ 引用任何官方原文 / 圖片 / 音檔 |

**目標**：讓國小低年級小朋友熟悉 Starters 題型結構，**降低真考時的陌生感**。

## 2. 題目難度原則（小一友善）

對齊 `docs/PRODUCT_SPEC.md`「國小低年級使用者設計原則」與「測驗與考前練習方向 → AI 仿真題」：

| 原則 | 具體要求 |
| --- | --- |
| 單句短 | 英文題幹 ≤ 10 字 |
| 選項清楚 | 4 選 1 居多（matching 例外）；圖文一一對應 |
| 不刁鑽 | 避免雙重否定、文化背景假設、需推理多步驟 |
| 不冷僻 | 用 Starters 高頻字（apple / cat / red / one / mother / book / ...） |
| 不挫折 | 答錯解析用鼓勵語氣，不嘲諷 |
| 對齊 vocabulary | 優先使用 `data/vocabulary.json` 既有 54 字（並逐步擴張） |

## 3. 題目來源規則（硬邊界）

| 規則 | 說明 |
| --- | --- |
| ✅ **必標** `source: "ai_generated"` | 每題都要 |
| ✅ 建議附 `promptVersion` | 例如 `starters-v1`，便於回溯出題品質 |
| ❌ **不得**假裝成 `official_sample` | 任何時候 |
| ❌ **不得**假裝成 `past_paper` | 任何時候 |
| ❌ **不得**引用 Cambridge 官方題目原文 | 不抄、不改寫、不變形 |
| ❌ **不得**引用歷屆題內容 | 同上 |
| ❌ **不得**使用官方圖片 | 圖片以 `imagePrompt` 描述自製需求；正式接入時用 `public/images/` 自製素材 |
| ❌ **不得**使用官方音檔 | 音檔以 `ttsScript` 描述自製腳本；正式接入時用 TTS 生成 |
| ❌ **不得**放外部 URL | `image` / `audio` 一律本機路徑（`/images/...` / `/audio/...`） |

## 4. 題型範圍

對齊 P3-1 schema 的 6 種 `QuestionType`（見 `lib/types.ts` 與 `docs/DATA_SCHEMA.md`）：

| 題型 | 用途 |
| --- | --- |
| `multiple-choice` | 通用文字 4 選 1 |
| `picture-choice` | 看圖選字（題目圖 + 4 文字選項） |
| `word-choice` | 看字選圖（題目文字 + 4 圖片選項） |
| `listening-choice` | 聽力選擇（音檔 + 4 文字 / 圖片選項） |
| `fill-blank` | 填空（選項版或自由填空版） |
| `matching` | 連連看 |

AI 生成時可指定產出某些題型，或要求一次出 6 種混合。

## 5. 輸出格式（草稿層）

AI 輸出**草稿格式**（類 YAML），可直接貼到 `source_materials/ai_generated/<日期>-<主題>-batch.md`。

格式與 `source_materials/custom/example-question-draft.md` 一致，差別：

| 項目 | custom 草稿 | ai_generated 草稿 |
| --- | --- | --- |
| `source` | `custom` | **`ai_generated`** |
| `promptVersion` | 不需要 | **建議附**（例如 `starters-v1`） |
| `imagePrompt` | 通常不需要（自製圖直接畫） | **建議附**：給人類整理者的「自製插畫描述」 |
| `ttsScript` | listening 才用 | listening **必填**；給未來 TTS 自製用 |

每題**必填**：`id` / `type` / `source` / `prompt`（視題型）/ `options`（視題型）/ `answer` / `explanation`。

每題**草稿選填**：`imagePrompt` / `ttsScript` / `transcript` / `image` / `audio` / `topic` / `difficulty` / `promptVersion` / `notes`。

> `imagePrompt` 與 `ttsScript` 是**草稿欄位**——是給人類整理者或未來 P3-2-B 工具用的「自製素材描述」，**正式 app schema** 中是否保留留待 P3-1 型別與 P3-2-B 工具決定。本輪只規範草稿層。

## 6. AI 輸出 → 正式題庫的轉換流程

```
   AI 生成               草稿存放                          人工審核 / 未來 P3-2-B 工具         正式題庫
   ─────────────────────────────────────────────────────────────────────────────────────────────
   prompt-template.md  →  source_materials/ai_generated/<日期>-<主題>-batch.md  →  人工檢查  →  data/*.json
                          （含 imagePrompt / ttsScript 等草稿欄位）                  （依 6 項                  （對齊
                                                                                     品質檢查）                ExamQuestion）
                                                                                                                  ↓
                                                                       自製插畫 / TTS  →  public/images/  /  public/audio/
```

**本輪只做 prompt 範本與草稿格式**；自動轉換工具屬 P3-2-B、自動 AI 串接屬 P3-3-B 或未來。

## 7. 品質檢查清單

每批 AI 題目產出後，**人類整理者**或 Codex 驗收前必過 6 項檢查：

- [ ] **答案在選項中**：每題 `answer` 確實是 `options` 之一（matching 由 `pairs` 順序決定，無此檢查）。
- [ ] **`source` 正確**：所有題目 `source: "ai_generated"`，**不能**是 official_sample / past_paper / custom。
- [ ] **解析鼓勵語氣**：`explanation` 用「正確答案是 ___」「下次可以注意 ___ 唷」，避免「你錯了」「不對」「這麼簡單也錯」等字眼。
- [ ] **無官方 / 歷屆題內容**：題目文字、選項、解析皆全新自製，不抄真題。
- [ ] **無外部 URL**：`image` / `audio` 不能含 `http://` / `https://`；草稿用 `imagePrompt` / `ttsScript` 描述自製需求。
- [ ] **適合小一程度**：英文題幹 ≤ 10 字、用高頻字、不刁鑽、不挫折。

> 檢查項目出現任一 ❌ 時，**整批退回 AI 重做**或**人類整理者修正**後才能轉成 `data/*.json`。

## 8. 與 P3-1 schema / P3-2-A 草稿的對齊

| 層級 | 檔案 / 規格 |
| --- | --- |
| TypeScript 型別 | `lib/types.ts` 的 `QuestionSource` / `QuestionType` / `BaseQuestion` / `ExamQuestion` |
| 正式 JSON schema | `docs/DATA_SCHEMA.md`「P3 考前練習：題庫 / 考卷 / Session schema」 |
| 整理 SOP | `source_materials/README.md` |
| 自製題草稿格式 | `source_materials/custom/example-question-draft.md` |
| **AI 題草稿格式（本檔配套）** | `source_materials/ai_generated/prompt-template.md` + `source_materials/ai_generated/example-ai-questions.md` |

AI 草稿格式採與 custom 草稿**同一套類 YAML**，差別只在 `source` 與額外的 `promptVersion` / `imagePrompt` / `ttsScript`。

## 9. 不在 P3-3 範圍

下列項目**不在**本子階段範圍，由後續定案：

- **實際 AI 工具串接**（OpenAI / Anthropic API 客戶端）：屬 P3-3-B 或未來。
- **自動轉換 AI 草稿 → JSON**：屬 P3-2-B。
- **自動圖片生成**（DALL-E / Midjourney / Stable Diffusion 客戶端）：屬未來，且需先評估版權 / 自製素材策略。
- **自動 TTS 生成 wrapper**（macOS `say -o` / 雲端 TTS 客戶端）：屬 P3-2-B。
- **AI 評分**（自動判答）：**永久不做**（見 `docs/PRODUCT_SPEC.md`「目前明確不做」）。

## 10. Prompt 版本化

每次調整 AI prompt 時建議遞增版本號（例如 `starters-v1` → `starters-v2`），並在 `prompt-template.md` 末尾「版本歷史」段記錄修改要點。生成的題目附 `promptVersion` 欄位，便於回溯：

- 「v1 出的題普遍太難 → v2 加強小一友善要求」
- 「v2 答案位置偏向第一格 → v3 要求位置打散」
- 等等

本檔的版本化政策由人類維護者控制，**不交給 AI 自動處理**。
