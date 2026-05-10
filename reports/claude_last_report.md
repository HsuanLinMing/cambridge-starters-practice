# Claude Code 回報 · P3-9-C：RW1 yes / no 補 No answer 樣本

任務日期：2026-05-10
任務性質：**資料 + 文件**——RW1 yes/no 補 1 題 No answer 樣本，平衡題目分布。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只新增 1 題範例 + 更新 paper 結構 + 同步文件；**未動** UI 邏輯（TrueFalseView / YesNoButton / formatYesNoDisplay 全保留）/ schema / TTS / OpenAI / Listening 行為（仍用 v2 + 仍隱藏 transcript）/ 圖片素材（cat.svg 重用）；未新增依賴 / 處理 npm audit / 部署 / 後端 / DB / 登入 / Speaking / 錄音 / STT。

## 【本輪修改摘要】

新增 1 題 `q-tf-002`（cat.svg 重用 + `It is a dog.` + answer `"no"` + RW1 metadata）讓孩子不只練 Yes。RW1 yes/no 分布從上輪「1 yes / 0 no」改為「**1 yes (q-tf-001) + 1 no (q-tf-002) 平衡 50 / 50**」。`data/exam-papers.example.json` questionIds 加 q-tf-002（緊接 q-tf-001 之後維持 RW1 連續分區）+ `sourceMix.ai_generated` 從 4 升 5。`README.md` 從「8 題」改「9 題」+ 加 q-tf-002 描述。`PROJECT_ROADMAP.md` P3-9-C 加 1 條 ✅；上輪「未來正式 RW1 / RW2 圖片場景題細化」⬜ 改寫為「未來補更多 RW1 題目與更精準官方格式」（多題多元主題 + RW2 共用 scene image + 真正 ✓ / ✗ 手寫互動）；P3-9-C 從 18 條 ✅ 升為 19 條 ✅。零依賴新增、未動 UI 邏輯 / schema / TTS。`npm run lint` / `typecheck` / `build` 全綠 + dev smoke 全綠。

## 【修改檔案清單】

修改 4 份：

- `data/p3-example-questions.json`：新增 1 題 `q-tf-002`（與 q-tf-001 結構一致：source ai_generated / image cat.svg 重用 / prompt "It is a dog." / answer "no" / explanation 中文 / RW1 metadata 完整）；不改其他 8 題。
- `data/exam-papers.example.json`：reading-writing section.questionIds 加 q-tf-002（緊接 q-tf-001 之後）+ sourceMix.ai_generated 從 4 升 5；description 已涵蓋 yes / no 判斷不需動。
- `README.md`：`/quiz` 條目從「8 題對應」改為「9 題對應」+ 加 q-tf-002 描述（answer = no、cat.svg + "It is a dog."、補 No answer 樣本讓孩子不只練 Yes）。
- `PROJECT_ROADMAP.md`：P3-9-C 加 1 條 ✅（RW1 yes/no 已補 No answer 樣本）+ 既有「未來正式 RW1 / RW2 圖片場景題細化」⬜ 改寫；變更紀錄追加 2026-05-10。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts`（TrueFalseQuestion type 不動、QuestionType union 不動）/ `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx`（RW_TYPE_ORDER 不變、true-false 排序仍 2）/ `components/QuizPlay.tsx`（TrueFalseView / YesNoButton / formatYesNoDisplay / formatUserAnswer / formatCorrectAnswer / getStarterPartInfo / QuestionView switch 全保留）/ 任何 `app/review/*` / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md`（兩道 RW1 樣本仍對齊「P3-9-C 第三刀已實作」狀態，文件無需更新）/ `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/TTS_AUDIO_WORKFLOW.md` / `docs/DATA_SCHEMA.md`（true-false schema 已記錄足夠）/ `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / `scripts/*` / 既有 audio 檔案（OpenAI v2 / v1 / m4a 全保留）/ 既有 SVG 圖片（cat.svg 重用、未產生新圖）/ 依賴。

## 【核心邏輯說明】

### 1. 為何 q-tf-002 也用 cat.svg

任務單明示「優先新增 1 題 No answer」+ 建議範例：

```
image: /images/cat.svg
prompt: It is a dog.
answer: no
```

直接沿用：

- **同圖、不同句**——測試孩子讀懂句子而非看圖記答案（教學上「文字 vs 圖」對比明確）。
- **自製 SVG 重用**——對齊任務單「不新增圖片 / 不下載素材」邊界。
- **與 q-tf-001 形成「對照組」**：圖片相同、句子相反。孩子做完 q-tf-001 → q-tf-002 → 體會「同樣一張貓圖，第一題說 cat 答 yes、第二題說 dog 答 no」。

### 2. 平衡 yes / no 分布的設計

| 題目 | answer | 教學意義 |
| --- | --- | --- |
| q-tf-001 (上輪) | yes | 第一題用「正確的句子」入門、不混淆 |
| q-tf-002 (本輪) | no | 第二題用「錯誤的句子」訓練「讀懂後判斷」 |

分布 1 yes / 1 no = 50/50 完全平衡。任務目標「讓孩子不只習慣選 Yes」達成。

未來若新增 q-tf-003 / q-tf-004 等，可考慮：

- 不同主題（dog.svg + "It is a cat." → no、apple.svg + "It is a fruit." → yes 等）。
- 更難的句構（"This is a red book." 加形容詞）。
- 否定句（"It is not a cat." → yes 對 dog 圖）。

### 3. 為何不動 UI 邏輯 / schema

任務單明示：

> 4. 不改 UI 邏輯
> 本輪不要修改 `TrueFalseView` / `YesNoButton`，除非真的有小 bug。

且任務單的 isCorrect 邏輯是 `answer === question.answer`：

- q-tf-002 選 No → user answer "no" === question answer "no" → isCorrect = true（答對）✓
- q-tf-002 選 Yes → user answer "yes" !== question answer "no" → isCorrect = false（答錯）✓

`formatUserAnswer` / `formatCorrectAnswer` 對 true-false 走 `formatYesNoDisplay()`，自動把 "no" 轉「No ✗」。**結果頁詳解 q-tf-002 卡片無需任何 code 改動**就會正確顯示「你的答案 No ✗ / 正確答案 No ✗」。

### 4. ✗ 符號的雙重意義（任務單提醒）

任務單明示：

> 注意：這裡的 ✗ 是 No 的符號，不是答錯符號。不要因此改結果頁正誤邏輯。

`formatYesNoDisplay()` 把 "no" 顯示為「No ✗」，這個 ✗ 是「No 的視覺符號」。

結果頁狀態 chip（`STATUS_STYLES`）有獨立的「✓ 答對 / ✗ 答錯 / ? 未作答」chip，那個 ✗ 是「答錯」的符號。

兩個 ✗ 視覺一樣但語意不同：

| 位置 | 符號 | 語意 |
| --- | --- | --- |
| 「你的答案 / 正確答案」欄 | ✗ (in "No ✗") | No 的視覺符號（與 ✓ in "Yes ✓" 對稱） |
| 卡片頂端狀態 chip | ✗ (in "✗ 答錯") | 答題正誤的標示 |

**潛在混淆**：q-tf-002 選 No 答對時，卡片顯示「你的答案 No ✗ / 正確答案 No ✗ / [✓ 答對 chip]」——使用者可能瞬間困惑「為什麼有 ✗ 又有 ✓」。實際上：

- 兩個 ✗ 是「No 符號」（與題目語意對應）
- ✓ chip 是「答對」（emerald 配色，獨立區塊）

設計選擇——「Yes ✓ / No ✗」的對稱性對小一更直觀，stat chip 用獨立配色 + 中文「答對」/「答錯」區分。本輪沿用上輪設計、不改邏輯。

### 5. dev smoke 驗證 9 題完整

| 驗證項 | 結果 |
| --- | --- |
| RSC payload 含 q-tf-001 (yes) + q-tf-002 (no) 各 1 次 | ✓ |
| `"answer":"yes"` 命中 1（q-tf-001）/ `"answer":"no"` 命中 1（q-tf-002） | ✓ |
| `"prompt":"It is a cat."` 命中 1 / `"prompt":"It is a dog."` 命中 1 | ✓ |
| `"type":"true-false"` 命中 2 次（兩題各一次） | ✓ |
| q-tf-002 explanation「圖片是貓，不是狗，所以這句話不對」visible RSC payload | ✓ |

確認資料層完整、UI 渲染依賴的 props 全部就位。

### 6. 沒做的事（嚴守任務單禁止清單）

- 沒碰 OpenAI TTS / 不呼叫 OpenAI API
- 沒重產音檔 / 不新增 audio
- 沒下載官方素材 / 不使用官方題目
- 沒新增圖片（cat.svg 重用）
- 沒新增依賴
- 沒改 Listening 行為（仍用 OpenAI v2 + 仍隱藏 transcript）
- 沒做 Speaking Agent / 錄音 / STT
- 沒部署 / 後端 / DB / 登入
- 沒處理 npm audit
- 沒 commit API key / `.env*`
- **沒動 UI 邏輯**——TrueFalseView / YesNoButton / formatYesNoDisplay / isCorrect 全保留
- **沒動 schema**——lib/types.ts / QuestionType union / TrueFalseQuestion 全不變

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0；新題目 TS 完整 narrow，沿用既有 TrueFalseQuestion type）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static、`Generating static pages 88/88`）。

Dev smoke test：

| 驗證項 | 結果 |
| --- | --- |
| 8 條路由 200 | ✓ |
| `/quiz` SSR 第 1 題 listening 仍用 OpenAI v2 audio src `/audio/starters/l3/q-lc-001-openai-v2.mp3` | ✓ |
| 「請先聽音檔，再選答案」hint visible（transcript 仍隱藏） | ✓ |
| `What does the boy want?` 整 HTML 只出現 1 次（在 RSC payload） | ✓ |
| RSC payload 含 `"id":"q-tf-001"` + `"id":"q-tf-002"` 各 1 次 | ✓ |
| RSC payload 含 `"answer":"yes"`（q-tf-001）+ `"answer":"no"`（q-tf-002）各 1 次 | ✓ |
| RSC payload 含 `"prompt":"It is a cat."`（q-tf-001）+ `"prompt":"It is a dog."`（q-tf-002）各 1 次 | ✓ |
| RSC payload 含 q-tf-002 explanation 中文「圖片是貓，不是狗」 | ✓ |
| RSC payload 含 `"type":"true-false"` 共 2 次（兩題各一次） | ✓ |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn | ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + lint / typecheck / build + RSC payload grep）通過。

需要使用者瀏覽器互動驗收：

1. **`/quiz` 可以看到 q-tf-001 yes 題（第 3 題）**：
   - 段落徽章「Section 2 · Reading & Writing」+ Part 標示「Part 1：看圖判斷 yes / no」+ 進度「第 3 題 / 共 9 題」
   - cat.svg 大圖 + 描述句「It is a cat.」+ 副提示「這句話對嗎？」
   - Yes / No 大按鈕並列
2. **`/quiz` 可以看到 q-tf-002 no 題（第 4 題）**：
   - 同樣 RW1 yes/no UI
   - 同 cat.svg 大圖（重用）+ 描述句「It is a dog.」+ 副提示「這句話對嗎？」
   - Yes / No 大按鈕
3. **Yes / No 按鈕正常**：點 Yes → emerald-300 高亮；點 No → rose-300 高亮；同時只能選一個。
4. **q-tf-002 選 No 應答對**：作答後直接交卷 → 結果頁 q-tf-002 卡片：
   - 狀態 chip：**✓ 答對**（emerald）
   - 你的答案：**No ✗**（emerald 字色，因答對）
   - 正確答案：**No ✗**（emerald 字色）
   - 說明：圖片是貓，不是狗，所以這句話不對，答 No。
5. **q-tf-002 選 Yes 應答錯**：再做一次選 Yes → 結果頁卡片：
   - 狀態 chip：**✗ 答錯**（rose）
   - 你的答案：**Yes ✓**（rose 字色，因答錯）
   - 正確答案：**No ✗**（emerald 字色）
   - 說明：同上
6. **結果頁詳解正常**：8 個 R&W 題（含 q-tf-001 + q-tf-002）+ 1 個 listening 題 = 9 個詳解卡片皆正常顯示。
7. **Listening 題仍使用 OpenAI v2 + 仍不顯示 transcript**：第 1 題 listening 行為與前一輪一致。
8. **`/review` 路由完整回歸**：所有 review 路由互動正常。

預期視覺呈現第 4 題（q-tf-002）：

```
[Section 2 · Reading & Writing｜閱讀與書寫練習]
Part 1：看圖判斷 yes / no
第 4 題 / 共 9 題

  [大圖：cat.svg 一隻貓]      ← 與第 3 題同圖

  It is a dog.                ← 與第 3 題不同句

  這句話對嗎？

  [✓]            [✗]
  Yes            No

[下一題 →]
```

選 No 後結果頁詳解：

```
[第 4 題 · Section 2 Reading & Writing · Part 1]  [✓ 答對]   ← emerald chip

題目：It is a dog.
你的答案：No ✗               正確答案：No ✗
說明：圖片是貓，不是狗，所以這句話不對，答 No。
```

## 【仍未處理】

- **未來補更多 RW1 題目與更精準官方格式** ⬜：多題 RW1 yes/no 多元主題（不同 SVG / 不同句構 / 否定句等）+ RW2 共用 scene image 多題判斷（需 P3-9-B sceneGroup schema 配合）+ 真正 ✓ / ✗ 手寫互動而非按鈕（屬未來進階）。
- P3-9-C 其他 part-specific UI 條目仍 ⬜（L1 場景圖 + hotspot、L2 文字輸入 name/number、L3 A/B/C 圖選項視覺、L4 簡化版選顏色 / 物件、RW2 場景圖固定、RW3 拼字輸入、RW4 多空格 + word bank、RW5 多圖序列 + one-word、`getStarterPartInfo()` 升級為從 starterPart 直接讀）。
- P3-9-C L3 後續其他 ⬜（多題 L3 音檔 / 音檔品質檢查流程 / 音檔快取管理 / 練習模式顯示文字稿開關）。
- P2-4C-2B-2 vocabulary 音檔仍 ⬜。
- P3-9-B 後續 7 條 ⬜；P3-7-B 後續 3 條 ⬜；P3-7-C / P3-7-D / P3-8 / P4 / P5 全 ⬜；P3-6-B-4 後續 3 條 ⬜；P3-6-B-5 1 條 ⬜；P3-2-B / P3-3-B / P3-4 / P3-5 全 ⬜；P1 兩條可選 housekeeping；npm audit 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **q-tf-001 + q-tf-002 連續同圖（cat.svg）**：兩題同圖、不同句，**好處**是教學「同圖不同句」對比；**潛在風險**是孩子可能誤以為「同一題重做」或「圖片載入錯誤」。**Codex 驗收建議**：使用者實測時觀察孩子反應；若混淆可未來新增 q-tf-003 用不同 SVG（dog.svg / apple.svg 等）增加視覺多樣性。
2. **「No ✗」與「✗ 答錯」的視覺重疊**（任務單已預警）：詳解卡片中「你的答案 No ✗」與「[✗ 答錯]」chip 同時出現會看到兩個 ✗，符號視覺一致但語意不同（前者是 No 符號 / 後者是答錯符號）。**設計選擇**——本輪刻意不改邏輯，因「Yes ✓ / No ✗」對稱對小一直觀、stat chip 用獨立 emerald/rose 配色 + 中文「答對 / 答錯」區分。**Codex 驗收建議**：使用者反饋若混淆，可未來在「Yes ✓ / No ✗」改用不同符號（如 ⭕ / ❌ 或純文字）避免衝突。
3. **q-tf-002 source 標 ai_generated 但實際是 Claude 自製範例**：在範例層 `source: "ai_generated"` 是「自製仿真題」對應 `q-pc-001` / `q-wc-001` / `q-lc-001` 慣例；不是真的 AI 出題。**Codex 驗收提醒**：source 字段反映「自製練習題（未來可由 AI 出）」分類，不代表真有 AI 流程。
4. **q-tf-002 explanation 與 q-tf-001 結構對稱性**：q-tf-001 是「圖片是貓，所以這句話是對的，答 Yes。」；q-tf-002 是「圖片是貓，不是狗，所以這句話不對，答 No。」。**對齊好**——都是「圖片描述 → 邏輯判斷 → 答案」三段式；但 q-tf-002 多一個「不是 X」的否定子句。**設計上對稱不太完美**但符合中文表達。
5. **既有 q-mc-001「Which one is a fruit?」答案是 apple，未變動**：本輪沒動其他題目。q-mc-001 仍走原來流程（multiple-choice 4 選 1）；不會誤觸到新 true-false 邏輯。
6. **sourceMix 5 + 4 = 9 對應 9 題總數**：原本 4 + 4 = 8（含上輪 q-tf-001）；新增 q-tf-002 是 ai_generated → 5 + 4 = 9 ✓。Codex 驗收建議檢查一致。
7. **題目順序：q-mc-001 / q-pc-001 / q-tf-001 / q-tf-002 / q-wc-001 / q-fb-001 / q-fb-002 / q-mt-001**：q-tf-002 緊接 q-tf-001 之後，符合「RW1 yes/no 題連在一起」要求。但 sortQuestionsForStarters 仍依 RW_TYPE_ORDER 排序——所有 true-false 題會排在 picture-choice 之後、word-choice 之前。同類題型（q-tf-001 / q-tf-002）依 JSON 原始順序保留 stable sort。Codex 驗收提醒順序行為一致。
8. **未來若 q-tf-XXX 大量增加可能讓 RW 段過長**：目前 RW 段 8 題（q-mc-001 + q-pc-001 + 2 個 true-false + q-wc-001 + 2 個 fill-blank + q-mt-001）；若加到 5+ true-false，孩子可能 yes/no 操作疲勞。**未來建議**：把 RW 段拆 sub-section（RW1 / RW2 / RW3 / RW4 / RW5 各自 ~3 題）；屬 P3-9-B sceneGroup 範圍延伸。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」8 個檢核點在 Mac + 平板區網 IP 上跑：
   - **必跑**：流程 4（q-tf-002 選 No 答對 + emerald 配色）/ 流程 5（q-tf-002 選 Yes 答錯 + rose 配色）。
   - **必確認**：流程 6（9 題詳解皆正常）/ 流程 7（Listening 行為不變）/ 流程 8（既有路由回歸）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - q-tf-001 vs q-tf-002 順序對小一是否清楚（同圖不同句的對比教學效果）。
   - 結果頁「No ✗」與「✗ 答錯」chip 同框是否混淆。
   - retry mode 中 q-tf-002 行為（自動繼承上輪 retry 邏輯）。
   - 跨瀏覽器 q-tf-002 視覺一致性。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**RW1 多題多元主題試產**——新增 q-tf-003 用 dog.svg（換圖）+ q-tf-004 用 apple.svg + 不同句構（如「This is red.」+ red.svg → yes）等 2~3 題增加視覺與句構多樣性。
   - 路線 B：**P3-9-C RW2 共用 scene image** UI（需 P3-9-B sceneGroup schema 配合）。
   - 路線 C：**P3-9-C 多題 L3 音檔**（shell loop 批次 OpenAI v2，先在 PRODUCT_SPEC 開放批次邊界）。
   - 路線 D：**P3-9-C 練習模式顯示文字稿開關**。
   - 路線 E：**P3-9-B 第二刀 metadata validator**。
4. **若家長反饋「No ✗ vs ✗ 答錯」混淆**（風險點 2）：可在 `formatYesNoDisplay()` 改用 ⭕ (yes) / ❌ (no) 或純文字「YES」/「NO」避免符號衝突。
5. **新增 RW1 題的命名建議**：q-tf-XXX 序號連續；可在 prompt 開頭加 emoji 或數字提示孩子「題型一致、題目不同」（屬未來 UX 增強）。
6. **q-tf-002 的 explanation 模式可作為未來 RW1 No-answer 題的範本**：「圖片是 X，不是 Y，所以這句話不對，答 No。」三段式可重用。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 🟡 部分進行中）。
- 🟡 **P3**：本輪 P3-9-C 加 1 條 ✅（RW1 yes/no 已補 No answer 樣本）+ 既有「未來正式 RW1 / RW2 圖片場景題細化」⬜ 改寫為「未來補更多 RW1 題目與更精準官方格式」；P3-9-C 從 18 條 ✅ 升為 19 條 ✅；P3-9 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-9-C part-specific quiz UI 實作**：19 條 ✅（含本輪新增 RW1 yes/no No answer 樣本）+ 8 條 ⬜（其他 L3 後續 + RW1 / RW2 多題多元 + 既有 part-specific UI 條目）。
  - 🟡 **P3-7-B**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-9-B**：6 條 ✅ + 7 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-4**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅ + 1 條 ⬜（本輪未動）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8**：本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住（不碰 OpenAI TTS / 不呼叫 API / 不重產音檔 / 不下載官方素材 / 不使用官方題目 / 不新增圖片 / 不新增依賴 / 不部署）。
- 變更紀錄追加 2026-05-10 一筆。

P3 整體仍 🟡 進行中；P3-9 仍 🟡（A 完成、B 部分完成 6/13、C 部分完成 19/27）；**符合任務單「不要把 P3-9-C 整體標完成、不要把 P3 整體標完成」要求**。
