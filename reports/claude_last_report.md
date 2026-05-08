# Claude Code 回報 · P3-9-C 小修：Part 顯示文案依 metadata + question.type 精準化

任務日期：2026-05-09
任務性質：**程式碼小修 + 文件**——P3-9-C 小修（顯示文案微調，非完整 P3-9-C UI 實作）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只動 `getStarterPartInfo()` 一處 + 三份 doc 同步；**未改** schema / data / metadata mapping / 題目本體；**未做** 完整 P3-9-C part-specific UI / validator / ttsScript-imagePrompt schema / `/quiz/wrong` / 獨立錯題頁 / 計時器 / Speaking / TTS / 錄音 / STT / AI API / crawler；未升 localStorage `QUIZ_SESSION_SCHEMA_VERSION`；未新增依賴 / 處理 npm audit；未部署。

## 【本輪修改摘要】

`/quiz` Part 顯示文案改為「metadata-first + 依 question.type 微調」——`components/QuizPlay.tsx` `getStarterPartInfo(question)` 在原有 metadata-first / type-fallback 邏輯之前加一條 (starterPart, type) 組合特殊覆寫：**`RW4 + multiple-choice` → 「Part 4 preview：短句選字 / 詞彙選擇」**，解決 P3-9-B 第一刀風險點 1 的文案落差（q-mc-001「Which one is a fruit?」之前籠統顯示為「Part 4：短文 / 句子填空」，現顯示更精準的「短句選字 / 詞彙選擇 preview」）。其他 (part, type) 組合維持 default `STARTER_PART_DISPLAY` map 文案；fallback 路徑保留。

helper 註解補完整邏輯說明。`docs/DATA_SCHEMA.md` Starters part metadata 段新增「UI 文案細分（依 `question.type` 微調）」一節（6 列對照表 + 設計原則 + 目的）。`PROJECT_ROADMAP.md` P3-9-B 由 5 條 ✅ 升為 6 條 ✅；P3-9 / P3-9-B / P3-9-C 整體仍 🟡。`README.md` `/quiz` 條目 `q-mc-001` mapping 與 metadata-first 描述同步。

零依賴新增、未升 schemaVersion、未動 schema / data / metadata。`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全綠（新文案在 client JS chunk 中 grep 命中 2 次）。

## 【修改檔案清單】

修改 4 份：

- `components/QuizPlay.tsx`：`getStarterPartInfo()` 加一條特殊覆寫（`RW4 + multiple-choice` → `{ partLabel: "Part 4 preview", zhTitle: "短句選字 / 詞彙選擇" }`，於 metadata 查找之前）+ 完整 docstring 說明三層邏輯（metadata 對齊目標 / question.type 細分 / fallback）+ 內聯註解說明覆寫意圖。
- `docs/DATA_SCHEMA.md`：在「Starters part metadata（P3-9-B）」段末尾新增「UI 文案細分（依 `question.type` 微調）」子段——6 列對照表（5 個明示組合 + default fallback 規則）+ 3 條設計原則（STARTER_PART_DISPLAY default + getStarterPartInfo 特殊覆寫 + 加新組合只需加 if）+ 3 條目的（解決文案落差 / 維持 metadata-first / 仍是練習版近似對應，不代表官方題目）。
- `PROJECT_ROADMAP.md`：P3-9-B 加一條 ✅（getStarterPartInfo 升級為 (starterPart, type) 細分文案）+ DATA_SCHEMA 條目末尾補「+ UI 文案細分對照表」；變更紀錄追加 2026-05-09 一筆。
- `README.md`：`/quiz` 條目 `q-mc-001` mapping 從「RW4 短文 / 句子填空」改為「RW4 preview 短句選字 / 詞彙選擇」+ 補一句「Part 顯示已改為 metadata-first，並可依題型微調練習版文案」+ RW4 fb / mc 兩例對照。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / 任何 `data/*.json` / `app/quiz/page.tsx` / 任何 `app/review/*` / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有圖片 / 音檔 / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. 三層查找邏輯

```ts
function getStarterPartInfo(question) {
  // 第一層：(starterPart, question.type) 組合特殊覆寫
  if (question.starterPart === "RW4" && question.type === "multiple-choice") {
    return { partLabel: "Part 4 preview", zhTitle: "短句選字 / 詞彙選擇" };
  }

  // 第二層：metadata-first（依 starterPart 取 STARTER_PART_DISPLAY default）
  if (question.starterPart) {
    return STARTER_PART_DISPLAY[question.starterPart];
  }

  // 第三層：fallback（依 question.type 推導，保留「Part X preview」字樣區分尚未補 metadata 的舊資料）
  switch (question.type) { ... }
}
```

**為什麼覆寫放最前面**：使 (part, type) 組合特殊處理優先生效；metadata 完整時不會走到 default map；metadata 缺值時走 fallback。三層彼此獨立、不互相干擾。

### 2. 為什麼只覆寫 RW4 + multiple-choice

任務單明示要保留：

| 組合 | 顯示 | 來源 |
| --- | --- | --- |
| `RW4 + fill-blank` | `Part 4：短文 / 句子填空` | default map（不覆寫） |
| `RW1 + picture-choice` | `Part 1：看圖判斷 / 看圖選答案` | default map（不覆寫） |
| `RW3 + word-choice` | `Part 3：看圖認字 / 拼字練習` | default map（不覆寫） |
| `RW5 + matching` | `Part 5：圖文配對 / 故事理解預備` | default map（不覆寫） |
| `L3 + listening-choice` | `Part 3：聽音選圖` | default map（不覆寫） |
| **`RW4 + multiple-choice`** | **`Part 4 preview：短句選字 / 詞彙選擇`** | **特殊覆寫（唯一一條）** |

只有 RW4 + multiple-choice 有 default 文案落差（default 是「短文 / 句子填空」但 mc 題型實際是「短句選字」），其他組合 default 文案已合適。**最小改動**——只覆寫真正需要的組合。

### 3. 「preview」字樣的設計取捨

新覆寫文案是「Part 4 **preview**：短句選字 / 詞彙選擇」，含 preview 字樣。理由：

- multiple-choice 與正式 RW4「短文 / 句子填空」**形式差距大**——RW4 真正包含完整短文上下文 + 多空格。本練習版的 mc 只是單句選字，**仿前者預備**。
- preview 字樣讓家長 / 老師知道這是「練習版近似 RW4，不是完整 RW4」。
- 對齊 `STARTERS_PART_TEMPLATES.md` 中對 multiple-choice → RW4 的「preview」標註。

對比：`RW4 + fill-blank` 不加 preview，因為 fill-blank 已涵蓋 RW4 短文填空的核心形式（雖未含完整短文上下文，但形式對齊度較高）。

### 4. helper docstring 結構

```ts
/**
 * 顯示 Part 標示。
 *
 * 邏輯：
 * 1. metadata（starterSection / starterPart）決定 section / part 的對齊目標。
 * 2. question.type 可協助顯示更精準的練習版文案——同一個 starterPart 下，
 *    不同題型的實際練習形式可能差很多（例如 RW4 在官方包含「短文填空」與
 *    「短句選字 preview」兩種偏向，本練習版用 multiple-choice 仿前者預備、
 *    用 fill-blank 仿後者）。
 * 3. fallback：metadata 未補時依 question.type 推導，保留「preview」字樣
 *    以區分尚未補 metadata 的舊資料。
 *
 * 提醒：所有顯示文案皆為「練習版近似對應」，不代表官方題目本身。
 */
```

任務單明示要加註解：「metadata 決定 section / part / question.type 可協助顯示更精準的練習版文案 / 目前仍是練習版近似對應，不代表官方題目」三點全到。

### 5. 結果頁詳解 / retry mode 自動同步

`QuestionDetailCard`（結果頁詳解）與 retry quiz / RetryResultView 都重複利用 `getStarterPartInfo()`，**不需要任何額外改動**就會同步顯示新文案。本輪零 component 結構變動。

### 6. RSC payload 與 client JS chunk 驗證

dev smoke test 確認：

- `/quiz` SSR 第 1 題仍是 listening + L3 + 「Part 3：聽音選圖」（visible HTML，default map 命中）。
- 客戶端 JS chunk `_10gzo8z._.js` 含「短句選字 / 詞彙選擇」（grep 命中 2 次）+「短文 / 句子填空」（命中 3 次：default map RW4 + fallback fill-blank case + override 中的 fill-blank 對照註解）+ default map 其他文案。
- visible HTML 不含「Part 4 preview」（第 1 題是 listening、不會 render mc 題）。
- RSC payload 含 7 題完整 metadata（`"starterPart":"RW4"` 等）給 hydration 後動態組裝。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒改 `data/*.json` / metadata mapping
- 沒新增題目 / 題型
- 沒新增 part-specific UI（`/quiz/wrong`、獨立錯題頁、part-specific 互動、yes-no 按鈕、拼字輸入等）
- 沒做 metadata validator
- 沒做 ttsScript / imagePrompt schema 升級
- 沒升 localStorage schemaVersion
- 沒做 Speaking / TTS / 錄音 / STT / AI API / crawler
- 沒下載官方 PDF / 圖片 / 音檔
- 沒新增依賴 / 處理 npm audit
- 沒部署

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static、`Generating static pages 88/88`）。

Dev smoke test：

| 驗證項 | 結果 |
| --- | --- |
| 8 條路由 200（`/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz`） | ✓ |
| `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / 聽音選圖 | ✓ |
| 第 1 題 visible HTML 不含「Part 4 preview」（首載是 listening 題、不會 render multiple-choice 題） | ✓ |
| RSC payload 含完整 metadata（`"starterPart":"RW4"` / `"type":"multiple-choice"` / `"type":"fill-blank"` 各 ≥1） | ✓ |
| client JS chunk `_10gzo8z._.js` 含「短句選字 / 詞彙選擇」字樣（命中 2 次，確認新覆寫文案已 bundle） | ✓ |
| chunk 同時含「短文 / 句子填空」（3 次：default RW4 / fallback fb case / override 內提及 fill-blank 對照）/「看圖判斷 / 看圖選答案」（2 次）/「圖文配對 / 故事理解預備」（2 次）等其他 default map 文案 | ✓ |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn 訊息 | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + lint / typecheck / build + JS chunk grep）通過。

需要使用者瀏覽器互動驗收：

1. **multiple-choice 題顯示 Part 4 preview：短句選字 / 詞彙選擇**：開啟 `/quiz` → 作答到第 4 題 (q-mc-001 「Which one is a fruit?")。Part 標示應該為「Part 4 preview：短句選字 / 詞彙選擇」（**之前是「Part 4：短文 / 句子填空」**，現已修正）。
2. **fill-blank 題仍顯示 Part 4：短文 / 句子填空**：作答到第 5 / 6 題 (q-fb-001 / q-fb-002 fill-blank)。Part 標示應仍為「Part 4：短文 / 句子填空」（不變）。
3. **其他題 Part 顯示不壞**：
   - 第 1 題 (q-lc-001 listening-choice / L3) → 「Part 3：聽音選圖」
   - 第 2 題 (q-pc-001 picture-choice / RW1) → 「Part 1：看圖判斷 / 看圖選答案」
   - 第 3 題 (q-wc-001 word-choice / RW3) → 「Part 3：看圖認字 / 拼字練習」
   - 第 7 題 (q-mt-001 matching / RW5) → 「Part 5：圖文配對 / 故事理解預備」
4. **結果頁詳解 Part 顯示同步更新**：作答完成或直接交卷後，「每題詳解」列表中第 4 題 (q-mc-001) 卡片頭部應顯示「第 4 題 · Section 2 Reading & Writing · **Part 4 preview**」。第 5/6 題 fill-blank 卡片仍顯示「Part 4」（無 preview）。
5. **retry mode Part 顯示同步更新**：若作答時故意答錯 q-mc-001 → 進入 retry mode → retry quiz 該題卡片頂端顯示「Part 4 preview：短句選字 / 詞彙選擇」（與一般 quiz 一致）。
6. **fallback 路徑仍正常**：（可選驗證）暫時把 `data/p3-example-questions.json` 中 q-mc-001 的 `starterPart` 欄位刪除 → 該題顯示應該回到 fallback 路徑「Part 4 preview：短句選字」（type-based switch case 結果，沒有 / 詞彙選擇 字樣）。**驗收後請還原檔案**。
7. **/review 路由正常**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常、翻牌功能、看圖練習互動皆無破壞。

預期 Part 標示對照（驗收時對照）：

| 題目 | 之前（P3-9-B 第一刀） | 現在（P3-9-C 小修） |
| --- | --- | --- |
| q-lc-001 (listening-choice / L3) | Part 3：聽音選圖 | Part 3：聽音選圖（不變） |
| q-pc-001 (picture-choice / RW1) | Part 1：看圖判斷 / 看圖選答案 | Part 1：看圖判斷 / 看圖選答案（不變） |
| q-wc-001 (word-choice / RW3) | Part 3：看圖認字 / 拼字練習 | Part 3：看圖認字 / 拼字練習（不變） |
| **q-mc-001 (multiple-choice / RW4)** | **Part 4：短文 / 句子填空** | **Part 4 preview：短句選字 / 詞彙選擇**（**修正**） |
| q-fb-001 (fill-blank options / RW4) | Part 4：短文 / 句子填空 | Part 4：短文 / 句子填空（不變） |
| q-fb-002 (fill-blank free / RW4) | Part 4：短文 / 句子填空 | Part 4：短文 / 句子填空（不變） |
| q-mt-001 (matching / RW5) | Part 5：圖文配對 / 故事理解預備 | Part 5：圖文配對 / 故事理解預備（不變） |

只 q-mc-001 一題的 Part 標示有變化。其餘 6 題完全不變。

## 【仍未處理】

- **P3-9-B 後續刀數**（7 條 ⬜）：ttsScript / imagePrompt 升正式 schema 評估、difficulty 字面量升級、part-specific question types、metadata validator、sceneGroup、multi-blank、imageSequence、拼字輸入、yes-no、Listening hotspot 等。
- **P3-9-C 完整 part-specific UI**：part-specific 互動視覺（L1 場景圖 + hotspot、L2 文字輸入 name / number、L3 A/B/C 圖選項、L4 塗色 / 選顏色、RW1 ✓/✗ 按鈕、RW2 場景圖固定 + 多題滾動、RW3 拼字輸入 + 看答案、RW4 多空格 + 字詞 bank、RW5 多圖序列 + one-word 輸入、`getStarterPartInfo()` 從 metadata 升級為從 starterPart 直接讀取的所有 P3-9-C 條目）皆未做。**本輪只做文案小修**。
- **P3-6-B-4 後續 3 條 ⬜**（再練習 sessionStorage / 獨立錯題複習頁 / wrongQuestionIds 升 v2 + migration / 錯題歷史紀錄）。
- **P3-6-B-5 計時器**（1 條 ⬜）。
- **P3-7-B / P3-7-C / P3-7-D 全部 ⬜**（官方資源校正 P3-9 模板 / wordlist 對 vocabulary 校正 / sample / mock test toolkit 觀察筆記）。
- **P3-8 全部 ⬜**（AI 仿真題生成流程文件）。
- **P4 Speaking Examiner Agent 全部 ⬜**；`docs/SPEAKING_EXAMINER_AGENT_DESIGN.md` 規劃中文件未建立。
- **P5 完整仿真考試體驗 ⬜**。
- **P2-4C-2B-2 全部 ⬜**（單字閱讀模式、拼字測驗模式、TTS 真實音檔、補圖、聽力 / 句型 / 位置練習）。
- **P3-2-B / P3-3-B / P3-4 / P3-5 全部 ⬜**。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **特殊覆寫只覆蓋 RW4 + multiple-choice 一條**：未來若新增題目 metadata 採用其他 (part, type) 組合且文案有落差，需要再加 if 條件。**現在 7 題範例完全不會觸發其他組合落差**——但若 P3-3-B AI 仿真題開始大量產出 (RW4, multiple-choice) / (RW1, multiple-choice) / 其他組合，可能逐步累積覆寫條件。**Codex 驗收建議**：當覆寫 if 超過 5 條時，重構為「2D map（StarterPart × QuestionType）」結構。本輪不做避免過度設計。
2. **fallback 路徑與細分覆寫的不一致**：fallback 路徑（依 type）對 multiple-choice 顯示「Part 4 preview：短句選字」（簡短），而新覆寫顯示「Part 4 preview：短句選字 / 詞彙選擇」（含「詞彙選擇」字樣）。**設計選擇**——覆寫文案更明確（明示是「詞彙選擇」測試）；fallback 文案保持簡短。**Codex 驗收提醒**：若家長覺得兩種寫法的「短句選字」與「短句選字 / 詞彙選擇」差異反而困惑，下一輪可統一為「短句選字 / 詞彙選擇」。本輪沿用任務單建議文案。
3. **DATA_SCHEMA「UI 文案細分」段與 STARTERS_PART_TEMPLATES.md 的同步**：本檔對照表寫了 5 + 1 條，與 `docs/STARTERS_PART_TEMPLATES.md` 的「目前 P3 schema 對應表」+ STARTER_PART_DISPLAY map 對齊。未來若新增覆寫條件，**三處需要同步更新**（QuizPlay 程式碼 / DATA_SCHEMA 對照表 / STARTERS_PART_TEMPLATES 模板段）。
4. **三層查找邏輯的可讀性**：本輪後 `getStarterPartInfo()` 有三層（特殊覆寫 / metadata-first / type-based fallback）。**對 5/12 之後動工者的學習成本**：若不熟 metadata 與 fallback 設計可能誤刪某層。docstring 已明示三層用途，但實作時建議驗證能讀懂。
5. **新覆寫的「preview」字樣可能讓家長覺得「為什麼 mc 是 preview 但 fill-blank 不是 preview」**：因為 fill-blank 與 RW4 形式對齊度較高、mc 只是 preview 預備版。**家長視覺體驗**：兩個 RW4 題目顯示不同寫法可能困惑。**Codex 驗收建議**：若家長反饋，下一輪可在頁首再加一行小字「Part 標示為練習版近似對應，preview 字樣表示『仿前者預備』」。本輪不做。
6. **JSON 雙 cast 仍未驗證 runtime metadata**：`lib/data.ts` 的 `as unknown as ExamQuestion[]` cast 沒驗證 `starterPart` 字面值。若手寫成「L5」之類非預期值 + question.type 是 multiple-choice，特殊覆寫 if 不會命中、走到 metadata 第二層 → `STARTER_PART_DISPLAY[L5]` 是 undefined → render 會崩潰。**Codex 驗收建議**：未來 P3-9-B 第二刀加 metadata validator 時應 runtime 校驗 + log warning。本輪沿用既有風險。
7. **本輪文案改動對舊使用者的瀏覽器快取**：使用者過去看過「Part 4：短文 / 句子填空」（被覆寫前的籠統文案）的快取頁面，本輪上線後會看到「Part 4 preview：短句選字 / 詞彙選擇」。**對首次更新版本的使用者體驗有微小變化**——可能讓家長覺得「對齊更精準」也可能困惑「為什麼以前是短文現在是短句選字」。**Codex 驗收建議**：若家長反饋，下一輪可考慮加一行 changelog 提示。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」7 個檢核點在 Mac + 平板區網 IP 上跑。重點：流程 1（mc 顯示新覆寫文案）、流程 2（fb 仍顯示原文案）、流程 4（結果頁詳解卡片同步）、流程 5（retry mode 同步）、流程 7（既有路由回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 新覆寫文案在所有渲染位置（題目卡 / 詳解卡片 / retry quiz / retry result detail）的一致性。
   - fallback 路徑能否被觸發（暫時刪除 metadata 應顯示 fallback 文案）。
   - 三層查找邏輯的 docstring 是否清楚。
   - JS chunk 中新文案的 grep 命中（已驗證 2 次命中）。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**P3-7-B 動工**（依 P3-7-A 11 條校正清單對 STARTERS_PART_TEMPLATES.md 校正；可能反過來修本輪 mapping 與覆寫條件，建議先做）。
   - 路線 B：**P3-9-B 第二刀** — metadata validator helper（runtime 校驗 metadata 字面值與 question.type 對應一致）+ ttsScript / imagePrompt 升正式 schema 評估。
   - 路線 C：**P3-9-C 第一刀** — part-specific UI 實作起點：選 RW1 yes-no 按鈕（最簡單）或 L3 A/B/C 圖選項（schema 已支援）作為第一刀。
   - 路線 D：**P3-6-B-4 第三刀** — retry sessionStorage 或 wrongQuestionIds 升 v2。
   - 路線 E：**P2-4C-2B-2 補真實音檔 / 補圖**。
4. **2D map 重構建議**（當覆寫條件超過 5 條時做）：

```ts
type StarterPartTypeKey = `${StarterPart}:${QuestionType}`;
const STARTER_PART_TYPE_OVERRIDES: Partial<Record<StarterPartTypeKey, StarterPartInfo>> = {
  "RW4:multiple-choice": { partLabel: "Part 4 preview", zhTitle: "短句選字 / 詞彙選擇" },
  // 未來新增
};
function getStarterPartInfo(question) {
  const key = `${question.starterPart}:${question.type}` as StarterPartTypeKey;
  if (STARTER_PART_TYPE_OVERRIDES[key]) return STARTER_PART_TYPE_OVERRIDES[key]!;
  // ... 後面同邏輯
}
```

本輪不做避免過度設計。

5. **頁首補小字提示**（若家長反饋風險點 5）：在 `app/quiz/page.tsx` 頁首再加一句「Part 標示中『preview』表示『仿前者預備』」。本輪不做。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 ⬜）。
- 🟡 **P3**：本輪只在 P3-9-B 加 1 條 ✅（從 5✅+7⬜ 升為 6✅+7⬜）；P3-9 / P3-9-B / P3-9-C 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-9-B**：6 條 ✅（types / BaseQuestion 欄位 / 範例 metadata / Quiz Part 顯示優先讀 metadata / **getStarterPartInfo (starterPart, type) 細分文案** / DATA_SCHEMA 補段）+ 7 條 ⬜（ttsScript / imagePrompt 評估、difficulty、part-specific types、validator、sceneGroup、multi-blank、imageSequence 等）。
  - 🟡 **P3-6-B-4**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅ + 1 條 ⬜（本輪未動）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-B / P3-7-C / P3-7-D / P3-8 / P3-9-C**：本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住。
- 變更紀錄追加 2026-05-09 一筆。

P3 整體仍 🟡 進行中；P3-9 仍 🟡（A 完成、B 部分完成 6/13、C 未開始）；**符合任務單「不要把 P3-9-C 整體標完成、不要把 P3-9 整體標完成、不要把 P3 整體標完成」要求**。
