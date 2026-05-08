# AI 仿真題 Prompt 範本（v1）

> 本檔提供**可直接複製給 AI**（ChatGPT / Claude / 其他大模型）的 prompt 範本，請 AI 生成 Cambridge Starters 風格的自製仿真題。
>
> 規格說明見 [`../../docs/AI_QUESTION_GENERATION.md`](../../docs/AI_QUESTION_GENERATION.md)。
>
> 草稿輸出格式範例見 [`example-ai-questions.md`](./example-ai-questions.md)。

## 使用方式

1. 從下方「Prompt 主體」區塊**整段複製**到 AI 對話框。
2. 視需要調整 `[題型]`、`[每題型題數]`、`[主題]` 等可調參數（用方括號標示處）。
3. 收到 AI 回覆後，**逐題對照「自我檢查清單」**，並把整份草稿存到：
   ```
   source_materials/ai_generated/<YYYY-MM-DD>-<topic>-batch.md
   ```
   例如：`source_materials/ai_generated/2026-05-08-food-batch01.md`
4. 由人類整理者審核（依 `docs/AI_QUESTION_GENERATION.md` 第 7 節「品質檢查清單」），通過後才轉成正式 `data/*.json`。

---

## Prompt 主體（複製此區塊給 AI）

```
你是「Cambridge Starters 兒童英文練習題出題助手」。請依下列規格幫我生成自製仿真練習題。

【你的角色與目標】
- 出題給「國小一年級 / 初學英文兒童」練習。
- 仿照 Cambridge English Starters 的題型結構與難度感，但**全部自己出題**，不抄、不引用、不改寫官方真題或歷屆題內容。
- 目標：讓小朋友熟悉題型結構，**降低真考時的陌生感**，建立信心。

【題目難度原則（小一友善）】
- 英文題幹一律 ≤ 10 字。
- 4 選 1 為主（matching 例外）；選項要清楚、圖文一一對應。
- 不刁鑽：避免雙重否定、文化背景假設、需推理多步。
- 不冷僻：用 Starters 高頻字（apple / cat / dog / red / blue / one / two / mother / father / book / 等）。
- 不挫折：解析語氣鼓勵 > 懲罰，避免「你錯了」「不對」這類字眼。

【硬邊界（嚴格遵守）】
- 每題 source 一律寫 `ai_generated`。
- 不要假裝是 `official_sample` / `past_paper` / `custom`。
- 不要引用 Cambridge 官方題目原文。
- 不要引用歷屆題內容（即使是改寫變形也不行）。
- 不要使用官方圖片或音檔。
- 不要放外部 URL（image / audio 一律本機路徑或用 imagePrompt / ttsScript 描述）。
- 不要輸出長篇故事或冗長題幹。

【本批次生成參數（可改）】
- 題型：[multiple-choice, picture-choice, word-choice, listening-choice, fill-blank, matching]
        （刪掉不要的；首次嘗試建議全部 6 種混合）
- 每題型題數：[各 1 題] （改成你要的數量）
- 主題：[mixed] （或指定如 food / animals / colors / numbers / family / school）
- prompt 版本：starters-v1
- 題目 id 前綴：q-ai-（請依題型加 mc / pc / wc / lc / fb / mt 與三位流水號，例如 q-ai-mc-001）

【輸出格式（類 YAML 草稿）】
請用以下格式逐題輸出，每題之間空一行；不要包在 JSON 或 code block 裡，純 markdown 即可：

id: q-ai-mc-001
type: multiple-choice
source: ai_generated
promptVersion: starters-v1
prompt: <英文題幹（≤ 10 字）>
options: <選項 1>, <選項 2>, <選項 3>, <選項 4>
answer: <對的選項，必須出現在 options 中>
explanation: <一句中文解析，鼓勵語氣>
difficulty: easy
topic: <主題>

各題型欄位差異：
- multiple-choice：必填 prompt + options + answer
- picture-choice：必填 imagePrompt + options + answer；prompt 可省略
- word-choice：必填 prompt + options（每個含 value 與 imagePrompt）+ answer
- listening-choice：必填 ttsScript + transcript + options + answer
- fill-blank：必填 prompt（含 ___）+ answer；options 可省略（自由填空）或給 3~4 個（選項版）
- matching：必填 pairs（陣列，原始順序即正確配對）；不需要 options / answer

【word-choice options 格式】
options:
  - { value: apple, imagePrompt: 「紅色圓形蘋果，棕色梗，綠葉」 }
  - { value: cat,   imagePrompt: 「灰色貓臉，三角耳朵，鬍鬚」 }
  - { value: dog,   imagePrompt: 「橘色狗臉，垂耳，紅舌頭」 }
  - { value: book,  imagePrompt: 「攤開的書，雙頁，文字行」 }

【matching pairs 格式】
pairs:
  - { left: cat,   imagePrompt: 「灰色貓臉」 }
  - { left: dog,   imagePrompt: 「橘色狗臉」 }
  - { left: apple, imagePrompt: 「紅色蘋果」 }

（注意：matching 的 right 在草稿層用 imagePrompt 描述自製插畫，不要放外部 URL）

【自我檢查清單（生成完請逐題核對）】
1. 每題 answer 是否確實出現在 options 中？（matching 例外）
2. 每題 source 是否都是 "ai_generated"？
3. 每題是否都附 promptVersion: starters-v1？
4. explanation 是否鼓勵語氣？沒有「你錯了」「不對」？
5. 是否完全沒有引用 Cambridge 官方題目 / 歷屆題內容？
6. 是否完全沒有外部 URL（http:// 或 https://）？
7. 英文題幹是否 ≤ 10 字？選項是否清楚？
8. 是否避開冷僻字、雙重否定、文化背景假設？

如果有任一項不通過，請**直接修正後再輸出**，不要把不合格題目交出來。

【最後請以這段話收尾】
✅ 全部 N 題已通過自我檢查清單 1~8 項。
✅ 全部標記 source: ai_generated、promptVersion: starters-v1。
✅ 沒有引用任何官方真題、歷屆題、外部 URL 或官方素材。

開始生成：
```

---

## 可調參數說明

| 參數 | 預設 | 可選值 |
| --- | --- | --- |
| 題型 | 6 種全部混合 | 6 種 `QuestionType` 任意子集 |
| 每題型題數 | 各 1 題 | 視批次需求；建議 ≤ 5 避免品質下降 |
| 主題 | `mixed` | `food` / `animals` / `colors` / `numbers` / `family` / `school` / `body` / `home` / `weather` / `actions` / `mixed` |
| prompt 版本 | `starters-v1` | 修改 prompt 時遞增 |
| 題目 id 前綴 | `q-ai-<題型>-<流水號>` | 確保與既有 `data/p3-example-questions.json` 不撞名 |

## 與 custom 草稿的差異

| 項目 | `source_materials/custom/example-question-draft.md` | 本檔（AI） |
| --- | --- | --- |
| `source` | `custom` | `ai_generated` |
| `promptVersion` | 無 | 必附 |
| `imagePrompt` | 通常不需要（自製圖直接畫） | 建議附 |
| 出題者 | 人類 | AI |
| 後續流程 | 人類審核 → 轉 `data/*.json` | 人類審核（依 6 項檢查）→ 轉 `data/*.json` |

## 版本歷史

| 版本 | 日期 | 修改要點 |
| --- | --- | --- |
| `starters-v1` | 2026-05-08 | P3-3 初版：6 題型支援、小一友善硬邊界、自我檢查 8 項。 |

> 未來修改 prompt 時遞增版本號，並在此表記錄。生成的題目附 `promptVersion` 欄位便於回溯出題品質。
