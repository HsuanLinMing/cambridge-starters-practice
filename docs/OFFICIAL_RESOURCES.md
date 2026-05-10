# Cambridge Pre A1 Starters 官方資源索引（P3-7-A 第一版）

> 本檔是 P3-7-A 的核心輸出——整理 **Cambridge Pre A1 Starters 相關官方公開資源入口** 的索引與人工筆記方向，供後續 P3-8（AI 仿真題生成）、P3-9（正式題型模板校正）、P3-2-B（題庫整理）、P3-4 / P3-5（題型實作）使用。
>
> ⚠️ **本檔只保存連結與人工筆記**——**不下載官方 PDF / 圖片 / 音檔**、**不複製官方題目 / 歷屆題**、**不做自動爬蟲**、**不把官方 sample 題目轉入正式題庫**、**不使用網路圖片當正式素材**。
>
> 本檔是文件層輸出。**未動** `lib/types.ts`、**未動** `data/*.json`、**未動** `/quiz` UI、**未新增** `source_materials/` 中任何官方檔案；那些屬於後續 P3-7-B / P3-7-C / P3-7-D 與 P3-8 / P3-9-B / P3-9-C 範圍。

## 用途與硬邊界

### 用途

- **整理 Cambridge Pre A1 Starters 官方公開資源入口**——以連結 + 人工筆記方式記錄。
- **支援後續工作**：
  - P3-8 AI 仿真題生成的「題型結構參考」。
  - P3-9 正式題型模板（`docs/STARTERS_PART_TEMPLATES.md`）的官方對齊校正。
  - P3-2-B 題庫整理流程的素材策略指引。
  - 未來 Listening / Reading & Writing 對齊正式 parts 的依據。
- **給未來輪次 AI 任務**一份「官方資源使用 SOP」，避免誤踩版權邊界。

### 硬邊界

對齊 `docs/PRODUCT_SPEC.md` 的「目前明確不做」、`source_materials/README.md` 的「官方資源與歷史題整理原則」、`docs/AI_QUESTION_GENERATION.md` 的「來源規則硬邊界」。

#### ✅ 可以做

- ✅ **保存官方資源連結**（公開頁面 URL，作為人工瀏覽起點）。
- ✅ **保存官方 format / parts 的人工筆記**（用自己的話描述 Part 結構、題目數、互動方式）。
- ✅ **保存 wordlist 的人工整理方向**（分類概念、覆蓋差距，不抄整份字表）。
- ✅ **保存 sample paper 的題型觀察筆記**（題型順序、互動方式、題數、音檔使用方式，不抄題目原文）。
- ✅ **保存 mock test toolkit 的流程觀察筆記**（考試流程節奏、考官互動風格描述）。
- ✅ **把官方題型結構轉成自製練習題規則**（`docs/STARTERS_PART_TEMPLATES.md` 模板就是依此原則）。
- ✅ **用自製圖片 / AI 生成圖片 / 自製音檔**做練習素材（圖片放 `public/images/`、音檔放 `public/audio/`，皆本機路徑）。

#### ❌ 不可做

- ❌ **不要寫自動爬蟲**爬 Cambridge 官方網站。
- ❌ **不要自動下載官方 PDF**（即使本機儲存也不下載；官方公開頁面瀏覽屬正常使用，但**程式自動抓取**不做）。
- ❌ **不要自動下載官方圖片** / 音檔。
- ❌ **不要把官方 PDF / 圖片 / 音檔 commit 到 repo**（與 `source_materials/.gitignore` 排除規則一致）。
- ❌ **不要直接複製官方 sample 題目原文進 repo**（不抄、不改寫、不變形）。
- ❌ **不要直接複製歷屆題內容**進 repo（同上）。
- ❌ **不要把網路圖片當正式題目素材**（一律自製或 AI 生成後人手繪）。
- ❌ **不要在 `data/*.json` 放官方 PDF / 圖片 / 音檔 URL**（`image` / `audio` 一律本機路徑 `/images/<filename>` / `/audio/<filename>`）。
- ❌ **不要聲稱 AI 題目是官方題**（必標 `source: "ai_generated"`；沒有「官方題」這個 source 值）。

> 簡言之：**官方資源只用來理解形式**；正式題庫的內容**永遠是自製或經人工審核的 AI 仿真題**。

## 索引格式與整合 SOP

### 每筆官方資源條目欄位

每個 `### A-X` / `### B-X` / `### C-X` / `### D-X` 條目的欄位：

| 欄位 | 用途 |
| --- | --- |
| **資源名稱** | 官方頁面 / 文件 / 工具的名稱（保留官方英文標題） |
| **官方用途** | 官方原本提供這份資源的目的 |
| **本專案用途** | 本專案如何引用這份資源（人工參考為主） |
| **可參考內容** | ✅ 哪些「結構 / 形式 / 概念」可以用作自製題的設計參考 |
| **不可直接使用內容** | ❌ 哪些「題目原文 / 圖片 / 音檔」嚴禁直接複製 |
| **對應 Roadmap** | 對應的 P 階段子分區（例如 P3-9-A / P3-8 / P3-2-B） |
| **對應文件** | 對應的本專案文件（例如 `docs/STARTERS_PART_TEMPLATES.md` / `source_materials/README.md`） |
| **連結** | 官方公開頁面 URL（**由人工從主入口導航後填入並驗證**） |

### URL 處理策略

**本檔 v1 不預先填入特定 sub-page URL**——只列**人工填入欄位**與**主入口建議起點**。理由：

- 避免 AI 生成過時 / 錯誤的 sub-page URL（官方網站結構可能改版）。
- 由人工驗證後填入更可靠。
- 條目結構就位後，人工填入只需 5~10 分鐘。

主入口建議起點（**由家長 / 維護者人工驗證**）：

- **Cambridge English 主站**：`https://www.cambridgeenglish.org/`（公開官方主站，作為導航起點；本檔僅列出主站作為「進入 Cambridge English 體系的入口」）
- 從主站導航至「Pre A1 Starters」考試頁面後，再依需要找到 format / preparation / sample papers / wordlist / mock test toolkit 等子頁，**請人工驗證 URL 後填入**對應條目的「連結」欄位。

> ⚠️ 不要憑記憶或推測填入 sub-page URL；以人工瀏覽 + URL 列驗證為準。

---

## A. 官方考試格式與 parts

> 對齊 Cambridge Pre A1 Starters 官方考試結構（Listening Part 1~4 + Reading & Writing Part 1~5 + Speaking Part 1~4）。本段資源**只用來校正 P3-9 模板的形式正確性**，不抄題目原文、不重製官方圖片。

### A-1 Cambridge English 主站（導航起點）

- **資源名稱**：Cambridge English（cambridgeenglish.org）
- **官方用途**：Cambridge Assessment English 的官方主站，列出所有 Cambridge English 考試（Young Learners / General English / Business 等）。
- **本專案用途**：作為導航 Pre A1 Starters 相關公開資源的起點。
- **可參考內容**：考試體系結構、Pre A1 Starters 入口連結、官方資訊頁面。
- **不可直接使用內容**：頁面內所有 PDF 下載連結 / 範例圖片 / 音檔的二進位檔案；任何題目原文。
- **對應 Roadmap**：P3-7（本檔母任務）。
- **對應文件**：本檔（作為導航起點）。
- **連結**：`https://www.cambridgeenglish.org/`

### A-2 Pre A1 Starters 考試資訊頁

- **資源名稱**：Pre A1 Starters · Cambridge English（考試資訊主頁）
- **官方用途**：說明 Pre A1 Starters 是什麼、考什麼、適合誰。
- **本專案用途**：對齊 `docs/PRODUCT_SPEC.md`「長期目標：自家仿真 Starters 模擬考系統」段對 Starters 考試本身的描述。
- **可參考內容**：考試定位（小一英文初學者）、整體結構（Listening + Reading & Writing + Speaking 三段）、年齡建議、級別 (CEFR A1 以下)。
- **不可直接使用內容**：頁面截圖、範例題圖、官方 PDF。
- **對應 Roadmap**：P3-7-A、P3-9。
- **對應文件**：`docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md`。
- **連結**：（由 A-1 主站導航至 Young Learners → Pre A1 Starters；由人工驗證後填入）

### A-3 Pre A1 Starters Test format / Exam format 頁

- **資源名稱**：Pre A1 Starters Test format（題型與結構說明頁）
- **官方用途**：以表格形式說明 Listening / Reading & Writing / Speaking 各 Part 的題型、題目數、互動方式、時長。
- **本專案用途**：**校正 `docs/STARTERS_PART_TEMPLATES.md` 模板**的形式正確性（見本檔「用官方資源校正 P3-9 模板」段）。
- **可參考內容**：
  - Listening Part 1~4 結構（題目數、互動方式描述）。
  - Reading & Writing Part 1~5 結構。
  - Speaking Part 1~4 結構（給 P4 設計用，本輪 P3 不實作）。
- **不可直接使用內容**：頁面內示範題的圖片、音檔、PDF；任何「考試樣本題目原文」。
- **對應 Roadmap**：P3-9-A（已用作模板第一版的形式來源）/ P3-7-B（後續逐項校正）/ P4（Speaking 規劃）。
- **對應文件**：`docs/STARTERS_PART_TEMPLATES.md`（v1 → v2 升級依據）/ `PROJECT_ROADMAP.md` P4 章節。
- **連結**：（由 A-2 頁面導航至 Test format / Exam format；由人工驗證後填入）

### A-4 Pre A1 Starters Specifications / Handbook for teachers

- **資源名稱**：Pre A1 Starters Handbook for teachers（教師手冊；如有公開版）
- **官方用途**：給老師的詳細考試規格書，含每個 Part 的詳細描述、評分原則、考試流程。
- **本專案用途**：給「人工筆記方向」的細節參考；**不下載 PDF**，瀏覽公開頁面後手寫筆記到 `source_materials/`。
- **可參考內容**：每 Part 的詳細結構描述、考試流程節奏、評分原則（**僅用於描述本專案練習版的鼓勵性回饋對齊方向，不複製官方評分量表**）。
- **不可直接使用內容**：手冊 PDF 本身、官方範例題、官方圖片、官方音檔。
- **對應 Roadmap**：P3-7-B（format 校正）/ P3-7-D（mock test toolkit 觀察）。
- **對應文件**：`docs/STARTERS_PART_TEMPLATES.md`（v2 升級依據）/ 未來 `source_materials/notes/`（人工筆記檔，本輪不建立）。
- **連結**：（由 A-2 / A-3 頁面導航；由人工驗證後填入）

---

## B. 官方 preparation / sample resources

> 此段資源**可能包含**官方 sample papers / wordlist / classroom activities / mock test toolkit。**本專案只作人工參考、不下載、不轉題**。

### B-1 Pre A1 Starters Preparation 頁

- **資源名稱**：Pre A1 Starters Preparation resources（準備資源頁）
- **官方用途**：集中放官方提供的考試準備材料，可能包含：
  - sample papers（樣題）
  - wordlist（單字表）
  - classroom activities（教室活動）
  - mock test toolkit（模擬考工具包）
- **本專案用途**：**只作人工瀏覽**——理解官方提供哪些類型的 preparation，再以「結構觀察」轉為自製題規則。
- **可參考內容**：preparation 資源的**分類方式**（什麼類型的素材對應 preparation）；各類型大致內容說明文字。
- **不可直接使用內容**：下載 sample paper PDF / 把 wordlist PDF 複製進 repo / 把 mock test 音檔抓下來。
- **對應 Roadmap**：P3-7-A（本輪僅入口指向）/ P3-7-D（後續 mock test toolkit 觀察）/ P3-7-C（wordlist 校正）/ P3-8（AI 仿真題生成的形式參考）。
- **對應文件**：本檔 C 段 / D 段 / `docs/AI_QUESTION_GENERATION.md`。
- **連結**：（由 A-2 頁面導航；由人工驗證後填入）

### B-2 Sample papers 入口

- **資源名稱**：Pre A1 Starters Sample papers（樣題公開頁）
- **官方用途**：讓考生與家長熟悉官方考試形式，提供完整 sample paper 結構。
- **本專案用途**：**人工瀏覽以理解題型順序、互動方式、題目數量、音檔使用方式**——再以**自製題**重現該結構（不抄原文）。
- **可參考內容**：題型順序（例如 Listening 段內 L1 → L2 → L3 → L4 的順序）、每 Part 題目數、互動方式描述、音檔出現的時點。
- **不可直接使用內容**：題目原文、題目圖片、音檔、答題單、PDF 樣本。
- **對應 Roadmap**：P3-7-D（sample / mock test toolkit 題型觀察筆記）/ P3-9（模板校正）。
- **對應文件**：未來 `source_materials/notes/sample-paper-observations.md`（規劃中，本輪不建立）/ `docs/STARTERS_PART_TEMPLATES.md`。
- **連結**：（由 B-1 頁面導航；由人工驗證後填入）

### B-3 Wordlist 入口

- 詳細整理見本檔 **C 段 Wordlist / vocabulary 方向**。

### B-4 Mock test toolkit 入口

- 詳細整理見本檔 **D 段 Sample papers / mock test toolkit 方向**。

---

## C. Wordlist / vocabulary 方向

### C-1 Pre A1 Starters Wordlist（公開字表）

- **資源名稱**：Cambridge English Pre A1 Starters Wordlist
- **官方用途**：列出 Pre A1 Starters 考試範圍內的單字（依分類組織，例如 animals / family / colours / numbers / classroom objects 等）。
- **本專案用途**：**只作人工瀏覽以理解「官方分類概念」與「字數覆蓋範圍」**；本專案的 vocabulary 仍以自製 `data/vocabulary.json` 為主。
- **可參考內容**：
  - 分類概念（animals / family / colours / numbers / classroom objects 等）。
  - 大致字數規模（給 `data/vocabulary.json` 字數目標參考）。
  - 主題覆蓋面（讓自家 vocabulary 不遺漏 Starters 常考主題）。
- **不可直接使用內容**：
  - **不要把 PDF 整份內容複製進 repo**。
  - **不要直接 paste 字表 markdown / CSV** 到 `source_materials/`。
  - **不要在 `data/vocabulary.json` 放官方 wordlist 全文** 作為「字典」結構。
- **對應 Roadmap**：P3-7-C（wordlist 對自家 vocabulary 分類校正）。
- **對應文件**：`data/vocabulary.json` / `lib/types.ts` 的 `VocabularyCategory` / 未來 `source_materials/notes/wordlist-coverage.md`（規劃中，本輪不建立）。
- **連結**：（由 B-1 頁面導航；由人工驗證後填入）

### C-2 Wordlist 使用原則（本專案層）

| 原則 | 說明 |
| --- | --- |
| **wordlist 可作為自製題 vocabulary 範圍參考** | 用來決定「自家 vocabulary 該覆蓋哪些主題、大致字數」。 |
| **不要直接把 PDF 整份內容複製進 repo** | 避免版權疑慮；保留為人工瀏覽參考。 |
| **若未來要建立 vocabulary，應以本專案自製 `data/vocabulary.json` 為主** | 自製單字 + 自製例句 + 自製圖片，與官方 wordlist 「概念對齊」但「內容自製」。 |
| **可以用官方 wordlist 概念輔助分類** | 例如 `category` 欄位設計可參考官方分類（animals / family / colours / numbers / classroom objects）。**已部分對齊**：`lib/types.ts` 的 `VocabularyCategory` 已含 food / animals / colors / numbers / family / body / school / home / weather / actions / other 11 個分類。 |
| **未來若人工整理字表，需確認來源與授權** | 不整份複製官方表格；以「自家覆蓋差距分析」為輸出，例如「我們有 54 字、官方主題 X 我們覆蓋 Y%」。 |

### C-3 與 P3-7-C 的對接

P3-7-C「官方 wordlist 對自家 vocabulary 分類校正」動工時的預期產出：

- `source_materials/notes/wordlist-coverage.md`（規劃中）：人工撰寫的「自家 vocabulary 與官方主題對齊度」筆記，**只記分類覆蓋差距，不抄字表**。
- `data/vocabulary.json` 後續擴張（屬 P2-4C-2B-2 / P3-7-C）：依差距分析逐步補字，每筆仍走自製 SVG / 自製音檔流程。
- 不更新 `lib/types.ts`（除非新增 category），**本輪不動**。

---

## D. Sample papers / mock test toolkit 方向

### D-1 Sample papers（題型觀察）

- **資源名稱**：Pre A1 Starters Sample papers（樣題）
- **本專案使用原則**：

| 可以參考 | 不可直接複製 |
| --- | --- |
| 題型順序（L1→L2→L3→L4 / RW1→RW5） | 題目原文 |
| 互動方式（連線 / 選擇 / 填空 / 拼字） | 題目圖片 |
| 題目數量（每 Part 幾題） | 音檔 |
| 音檔使用方式（音檔出現時機、是否重複播放） | 答題單版型截圖 |
| 場景設計（場景圖大致包含什麼物件，描述用） | 場景圖原檔 |

- **絕不**將 sample paper 題目轉成 `data/*.json`。
- **只**轉成「題型模板」與「自製題規則」——已部分輸出於 `docs/STARTERS_PART_TEMPLATES.md`。

### D-2 Mock test toolkit（流程觀察）

- **資源名稱**：Pre A1 Starters Mock test toolkit（如官方有公開模擬考流程指引）
- **本專案使用原則**：

| 可以參考 | 不可直接複製 |
| --- | --- |
| 考試流程節奏（Listening 後是否中場休息、Speaking 是否單獨進行） | toolkit PDF 全文 |
| 考官互動風格描述（友善 / 鼓勵 / 短句指令） | 官方考官台詞原文 |
| 模擬考時間配置 | toolkit 內附音檔 |
| 模擬考準備建議（給家長 / 老師） | toolkit 內附範例答題單 |

- **本專案 P4 Speaking Examiner Agent 的考官台詞**：**自製、不抄官方**——以「友善鼓勵」風格自寫，僅參考官方流程結構。

### D-3 與 P3-7-D 的對接

P3-7-D「sample / mock test toolkit 題型觀察筆記」動工時的預期產出：

- `source_materials/notes/sample-paper-observations.md`（規劃中）：每 Part 一段人工觀察筆記，含「題型互動描述、題數、音檔節奏」等，**全部用自己的話寫，不引用官方原文**。
- `source_materials/notes/mock-test-flow.md`（規劃中）：模擬考流程的人工筆記，給 P5「完整仿真考試體驗」與 P4 Speaking Examiner Agent 的考官台詞模板參考。
- 兩份檔皆**只放人工筆記、不放官方檔案**；連結指向官方公開頁面而非下載連結。

---

## 用官方資源校正 P3-9 模板

> 本節列出未來校正 `docs/STARTERS_PART_TEMPLATES.md`（P3-9-A v1）時的檢查清單；對接 P3-7-B「官方 format 對 P3-9 模板逐項校正」。

校正動作建議由人工瀏覽 A-3「Test format 頁」+ A-4「Handbook」+ B-2「Sample papers」+ B-4「Mock test toolkit」後，依下列 11 條逐項對照本專案模板：

| # | 校正項目 | 檢查方式 |
| --- | --- | --- |
| 1 | **Listening Part 1** 的互動是否描述正確（大圖 + 人物 / 物件位置連線） | 對照 A-3 Test format 頁 / B-2 Sample paper 的 L1 描述；確認本專案 L1 模板「簡化為選人 / 選位置」的描述是否合理對齊 |
| 2 | **Listening Part 2** 的 answer type 是否正確（聽對話寫 name / number） | 對照官方對 L2 的描述；確認本專案 L2 模板「文字輸入 name / number」第一版簡化是否成立 |
| 3 | **Listening Part 3** 是否對應「聽音選圖」 | 對照官方對 L3 的描述；確認本專案 `listening-choice` + `optionType: "image"` 是否真的對齊 L3 |
| 4 | **Listening Part 4** 是否涉及顏色 / 塗色 / 指令 | 對照官方對 L4 的描述；確認本專案 L4「聽指令塗顏色」描述是否成立、是否需要重新命名 |
| 5 | **Reading & Writing Part 1** 是否為圖句判斷（yes/no 或 tick/cross） | 對照官方對 RW1 的描述；確認本專案 RW1 模板「✓ / ✗ 二選一」與目前 `picture-choice` preview 對應是否合理 |
| 6 | **Reading & Writing Part 2** 是否為大圖 yes/no | 對照官方對 RW2 的描述；確認本專案 RW2「scene image + 多題共用」設計方向是否成立 |
| 7 | **Reading & Writing Part 3** 是否為看圖拼字 | 對照官方對 RW3 的描述；確認本專案 RW3「看圖 + 拼字提示 + 自由輸入」第一版設計是否成立、與 P2-4C-2B-2 單字拼字測驗模式是否能整合 |
| 8 | **Reading & Writing Part 4** 是否為短文填空 | 對照官方對 RW4 的描述；確認本專案 RW4「fill-blank 單空格 + 多空格短文待補」覆蓋分析是否準確 |
| 9 | **Reading & Writing Part 5** 是否為故事圖 one-word answer | 對照官方對 RW5 的描述；確認本專案 RW5「3 張故事圖 / scene image + one-word answer」設計方向是否成立 |
| 10 | 目前 `getStarterPartInfo()` 的 preview 對應是否需要調整 | 校驗 `components/QuizPlay.tsx` 中 6 題型 → Part 對應的 `partLabel` 與 `zhTitle`（特別是 mc → Part 4 preview / mt → Part 5 preview 兩個跨度較大的對應） |
| 11 | 目前 `docs/STARTERS_PART_TEMPLATES.md` 是否需要升 v2 | 若上述 1~10 項有任一項需要修正或補充，依「修訂日 + 修訂段落」更新並版本標記為 v2，保留 v1 紀錄作為歷史對照 |

### 校正動作的非目的

- ❌ 校正動作**不是**把官方原文抄進 P3-9 模板。
- ❌ 校正動作**不是**讓本專案的 Part 模板「100% 還原官方」——本專案是練習版近似對齊（已標 `Part X preview` 字樣）。
- ❌ 校正動作**不是**要把「官方 sample 題目」轉成 `data/*.json`。

校正動作**只是**讓 P3-9 模板的「形式描述」與官方公開描述沒有顯著偏差。

### P3-7-B 第一輪校正狀態（2026-05-09）

✅ **已完成 P3-7-B 第一輪校正**：

- `docs/STARTERS_PART_TEMPLATES.md` **已升 v2**——依官方公開 format 說明（Listening 4 parts / 20 Q / 20 min / heard twice，R&W 5 parts / 25 Q / 20 min / spelling must be correct，Speaking 4 parts / 3-5 min）校正 9 個 Part 模板描述。
- 上述 11 條校正清單第 1~9 項**已第一輪通過**（依官方公開 format 校正後，本專案 L1~L4 + RW1~RW5 模板描述大方向正確；補上「heard twice」「spelling must be correct」「each part has 1~2 examples」三條官方規則）。
- 上述 11 條校正清單第 10 項（`getStarterPartInfo()` preview 對應）**已第一輪通過**——透過 P3-9-B 第一刀 metadata-first + P3-9-C 小修 (starterPart, type) 細分文案處理。
- 上述 11 條校正清單第 11 項（`docs/STARTERS_PART_TEMPLATES.md` 升 v2）**已落地**。

⬜ **後續仍需做（第二 / 三輪校正）**：

- 後續若家長 / 維護者人工瀏覽更完整官方 handbook for teachers（A-4 / 公開版本）/ 官方 sample papers（B-2）/ 官方 mock test toolkit（D-2）並逐頁觀察筆記後，可能會發現 v2 仍有偏差，**屆時可升 v3**——屬 P3-7-B 第二輪校正 + P3-7-D「sample / mock test toolkit 觀察筆記」範圍。
- 整理 `source_materials/notes/sample-paper-observations.md`（規劃中）+ `source_materials/notes/mock-test-flow.md`（規劃中）等人工筆記檔。
- 整理 `source_materials/notes/wordlist-coverage.md`（規劃中，屬 P3-7-C）。
- 不複製官方題目 / 不下載官方素材的硬邊界**永遠不變**。

---

## AI 仿真題素材來源策略

> 對齊 `docs/AI_QUESTION_GENERATION.md` 的「來源規則硬邊界」與 `source_materials/README.md` 的「官方資源與歷史題整理原則」。本節用本檔（OFFICIAL_RESOURCES）視角再強調一次。

### ✅ AI 仿真題應使用

- ✅ **官方題型結構**（從本檔 A / B 段整理出的 form 結構描述）。
- ✅ **本專案 vocabulary**（`data/vocabulary.json` 既有 54 字，逐步擴充；用詞不超出 Starters wordlist 概念覆蓋範圍）。
- ✅ **自製圖片描述 `imagePrompt`**（描述自製 SVG 應該長什麼樣）。
- ✅ **自製 TTS script `ttsScript`**（描述 TTS 該唸什麼，含 SSML 標記與語速）。
- ✅ **自製 explanation**（小一友善、鼓勵語氣的解析）。
- ✅ **人工審核**（依 `docs/AI_QUESTION_GENERATION.md` 6 項品質檢查清單）。

### ❌ AI 仿真題不應使用

- ❌ **官方題目全文**（不抄、不改寫、不變形）。
- ❌ **官方圖片**（不下載、不引用 URL、不重製）。
- ❌ **官方音檔**（同上）。
- ❌ **歷屆題原文**（同 official sample）。
- ❌ **網路圖片**（一律自製或 AI 生成 `imagePrompt` 後人手繪）。
- ❌ **外部 URL**（題目 JSON 的 `image` / `audio` 欄位一律本機路徑）。

### 違反時的處理

若 AI 草稿被發現含上述任一禁止內容（例如 AI 把官方範例題抄進來、AI 出了一個含官方品牌商標的 imagePrompt），人工審核階段必須：

1. 退回該題草稿，整題重出。
2. 在 `source_materials/ai_generated/<該批次>.md` 註記「該題違反 OFFICIAL_RESOURCES 硬邊界，不採用」。
3. 若 prompt 本身有結構性引導 AI 抄官方原文的傾向，回頭修 prompt-template（屬 P3-3-A v2 升級範圍）。

---

## 與其他文件的關係

| 文件 | 關係 |
| --- | --- |
| `docs/PRODUCT_SPEC.md` | 本檔對齊「目前明確不做 → AI / 自動化」段（不爬蟲、不下載官方 PDF / 圖片 / 音檔、AI 評分邊界）；對齊「長期目標：自家仿真 Starters 模擬考系統」段（自製為主、官方僅參考）。 |
| `source_materials/README.md` | 本檔是 source_materials/README「官方資源與歷史題整理原則」的**詳細版** + 索引版本。source_materials 那段聚焦「整理者執行 SOP」；本檔聚焦「資源入口索引 + 校正清單 + AI 素材策略」。兩檔互補，**不重複內容**——source_materials/README 的「✅ 可以做 / ❌ 不可做」雙清單與本檔「用途與硬邊界」雙清單措辭一致。 |
| `docs/STARTERS_PART_TEMPLATES.md` | 本檔的「用官方資源校正 P3-9 模板」11 條清單就是針對該檔 v1 的校正項；該檔 v1 → v2 升級依本檔 A-3 / A-4 / B-2 整理出的官方 Part 描述進行。 |
| `docs/AI_QUESTION_GENERATION.md` | 本檔「AI 仿真題素材來源策略」段重述該檔的「來源規則硬邊界」；該檔負責 prompt 規格、本檔負責素材來源邊界。 |
| `docs/DATA_SCHEMA.md` | 本檔不直接動 schema；P3-7-C 動工時若依差距分析新增 vocabulary category，需同步更新該檔。 |
| `PROJECT_ROADMAP.md` | 本檔屬 P3-7-A 子分區；P3-7-B / P3-7-C / P3-7-D 尚未開始，依本檔「校正清單」與「對接段」逐步推進。 |

---

## 版本

- **v1**（2026-05-08）：第一版——用途 + 硬邊界 + 索引格式 + A 段（4 個官方資源條目，URL 由人工填入）+ B 段（4 個 preparation 條目）+ C 段（wordlist 方向）+ D 段（sample / mock toolkit 方向）+ P3-9 模板校正清單（11 條）+ AI 仿真題素材來源策略 + 與其他文件關係。**未填入特定 sub-page URL**——由家長 / 維護者人工從 A-1 主站導航後驗證填入。
- **v1.1**（2026-05-09，P3-7-B 第一輪校正進度更新）：在「用官方資源校正 P3-9 模板」段補「P3-7-B 第一輪校正狀態（2026-05-09）」子段——記錄 11 條校正清單第一輪結果（1~11 全條第一輪通過，`docs/STARTERS_PART_TEMPLATES.md` 已升 v2）；列出後續第二 / 三輪校正待辦（handbook / sample paper / mock test toolkit 人工筆記、wordlist 覆蓋分析）；硬邊界不變。

### 後續版本規劃

- **v2**：等 P3-7-B 第二 / 三輪校正 / P3-7-C / P3-7-D 動工後，依人工瀏覽結果回填 sub-page URL 與「人工筆記檔」指向（例如 `source_materials/notes/sample-paper-observations.md`）；同步反映 P3-9 模板第二輪校正結果（若有 v3 升級需求）。
