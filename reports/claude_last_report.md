# Claude Code 回報 · 本機自製 TTS 音檔流程 + q-lc-001 第一個音檔（P2-4C-2B-2 + P3-9-C）

任務日期：2026-05-10
任務性質：**程式碼 + 文件 + 二進位素材**——本機自製 TTS 音檔流程落地。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只用 macOS `say` + `afconvert` 本機流程；**未串雲端 TTS API（OpenAI / Google / Azure 全未串）**、未下載官方音檔、未複製官方 sample 音檔；未新增 listening 題目 / 改題目答案 / 改非 listening 題目；未做 Speaking / 錄音 / STT / AI API / crawler；未新增依賴 / 處理 npm audit；未部署、未新增後端 / DB / 登入；未升 localStorage schemaVersion。

## 【本輪修改摘要】

第一個自製 TTS 音檔已產生並接入 `/quiz`：

- **產生 `public/audio/starters/l3/q-lc-001.m4a`**——透過 macOS 內建 `say` + `afconvert` 兩步流程：(1) `say -o /tmp/q-lc-001.aiff "What does the boy want?"`（產生 86 KB AIFF）→ (2) `afconvert -f m4af -d aac /tmp/q-lc-001.aiff public/audio/starters/l3/q-lc-001.m4a`（轉成 12 KB AAC m4a，1.86 秒）。瀏覽器原生支援 m4a / AAC（Chrome / Safari / Firefox / Edge 全支援）。
- **`data/p3-example-questions.json` `q-lc-001` audioSrc** 從 `.mp3` 改為 `.m4a` 對齊實體檔案；不改其他欄位。
- **新增 `docs/TTS_AUDIO_WORKFLOW.md`**（v1）——完整流程文件：用途 / 硬邊界（不串雲端 API / 不下載官方音檔 / 不用網路 mp3 / 不複製官方 sample / 不用第三方教學音檔 / 不抽 PDF 內嵌音）+ macOS `say` + `afconvert` 完整 step 1~6 + 一行 shell 範例 + 命名規則 + 路徑 + audioSrc 對應規則 + 人工檢查 6 項 + git 政策 + 第二階段雲端 TTS 評估規劃。
- **`README.md`** `/quiz` 條目補「第一個自製音檔已產生」描述 + 文件索引追加 `docs/TTS_AUDIO_WORKFLOW.md`。
- **`PROJECT_ROADMAP.md`** P3-9-C 加 3 條 ✅（流程文件 / 路徑 / q-lc-001 第一個音檔）+ 4 條 ⬜（多題音檔 / 音檔品質檢查流程 / 雲端 TTS 評估 / 音檔快取管理）；P2-4C-2B-2 「真實音檔」⬜ → 🟡 部分進行中（明示 P3-9-C 第一刀已落地第一個 L3 音檔、P2 vocabulary 音檔仍 ⬜）；P2-4C-2B-2 整體升 🟡 部分進行中。

零依賴新增、未升 schemaVersion、未動 `lib/types.ts` / `components/QuizPlay.tsx` / 任何 `app/*` 路由。`npm run lint` / `typecheck` / `build` 全綠（路由 88 不變）+ dev smoke test 全綠（audio 檔 fetch 200 / 12008 bytes / `audio/mp4` content-type；visible HTML audio src 指向 m4a；「音檔準備中」fallback 不再出現）。

## 【修改檔案清單】

新增 1 份文件 + 1 個音檔 + 1 個 `.gitkeep`-equivalent dir：

- `docs/TTS_AUDIO_WORKFLOW.md`（v1，~210 行）：核心輸出。
- `public/audio/starters/l3/q-lc-001.m4a`（**12008 bytes / AAC 22050 Hz / 1.86 秒**）：第一個自製 TTS 音檔。
- `public/audio/starters/l3/`（目錄）：音檔放置路徑。

修改 4 份：

- `data/p3-example-questions.json`：`q-lc-001.audioSrc` 從 `/audio/starters/l3/q-lc-001.mp3` 改為 `/audio/starters/l3/q-lc-001.m4a`（其他欄位 0 變動）。
- `README.md`：`/quiz` 條目補第一個自製音檔已產生描述 + 文件索引追加 `docs/TTS_AUDIO_WORKFLOW.md`。
- `PROJECT_ROADMAP.md`：P3-9-C 7 條 ✅ → 10 條 ✅ + 4 條 ⬜ 替代既有 3 條 ⬜（為 L3 audio 後續）；P2-4C-2B-2「真實音檔」⬜ → 🟡 + section header「尚未開始」改「🟡 部分進行中」；變更紀錄追加 2026-05-10。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / `components/QuizPlay.tsx` / 任何 `app/review/*` / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/DATA_SCHEMA.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / 既有 SVG / vocabulary 音檔 / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. 為什麼用 m4a 而非 mp3

任務單明示：「如果 `say` 只能輸出 `.aiff` 或 `.m4a`，請優先產生瀏覽器可播放的格式」。`say` 預設輸出 AIFF（86 KB / 秒，瀏覽器支援度差且檔案大）。可選 m4a（AAC 編碼）或 mp3。本輪選 **m4a / AAC**：

- macOS 內建 `afconvert` **直接支援** AIFF → AAC m4a，不需安裝任何套件。
- mp3 編碼需要 `lame` / `ffmpeg` 等第三方套件——本輪不引入新依賴。
- 瀏覽器原生支援 m4a / AAC（Chrome / Safari / Firefox / Edge / iOS Safari 全支援）。
- 檔案大小：m4a AAC ~12 KB / 1.86 秒（~6 kbps），mp3 同樣編碼率類似。

實際測試：`afinfo` 顯示 `1 ch, 22050 Hz, aac (0x00000000) ... bit rate: 31696 bps`；`file` 顯示 `ISO Media, Apple iTunes ALAC/AAC-LC (.M4A) Audio`；瀏覽器 fetch 顯示 `audio/mp4` content-type（mp4 容器，AAC 軌）。

### 2. audioSrc 從 .mp3 改 .m4a 的理由

P3-9-C 第一刀時 `q-lc-001` 的 audioSrc 用 `.mp3` 副檔名作為「預期格式」placeholder。本輪實際產生的是 m4a，**audioSrc 必須對應實體檔案的真實副檔名**——任務單明示「若無法產生 mp3，請不要硬塞錯誤副檔名」。

修改範圍：只改 `data/p3-example-questions.json` 一個字段；`docs/STARTERS_PART_TEMPLATES.md` v2.1 與 `docs/DATA_SCHEMA.md` 的範例仍用 `.mp3` placeholder（保留作為未來「若有 mp3」的範例選項）；`docs/TTS_AUDIO_WORKFLOW.md` 的範例改用 `.m4a`（呼應實際工作流產出）。

### 3. UI 路徑 fallback 自動切換

P3-9-C 第一刀的 `ListeningChoiceView` 三態邏輯（loading / ready / missing）**未動**——本輪只變動資料層。實體 m4a 檔產生後：

- 瀏覽器 fetch `/audio/starters/l3/q-lc-001.m4a` 返回 200 + 12008 bytes + `audio/mp4` content-type。
- audio 元素 `onCanPlay` 觸發 → audioStatus 切 `ready`。
- 「💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習」聽兩次提示顯示。
- 「音檔準備中」fallback **不**顯示（dev smoke test grep 確認 0 命中）。
- transcript 仍顯示。

完整 UI 行為從「audioSrc 存在但實體檔案缺，永遠走 fallback」升級為「audioSrc 存在且實體檔案存在，正常播放」。

### 4. `docs/TTS_AUDIO_WORKFLOW.md` 結構

文件層的核心輸出（v1，~210 行）。主要段：

1. **用途**：對應 P3-9-C audioSrc + UI fallback。
2. **硬邊界**：✅ 6 條可做（macOS say / afconvert / 自錄音 / 未來雲端 TTS 評估）+ ❌ 6 條不可做（雲端 API、官方音檔、官方 sample 音檔、網路 mp3、第三方教學音檔、PDF 抽音）。
3. **第一階段：macOS `say` 流程**：環境需求、step 1~6 完整流程、一行 shell 範例。
4. **命名規則**：檔名格式（`<question-id>.m4a`）、路徑（`public/audio/starters/<part>/<id>.m4a`）、audioSrc 對應 4 條規則表。
5. **人工檢查 6 項**：檔案存在性 / 格式正確 / 可播放（`afplay`）/ 內容正確（對照 transcript）/ 長度合理（L3 短句 1.5~3 秒）/ 音量合理。
6. **Git 政策**：可 commit（自製 m4a < 200 KB / 題；commit message 帶 id + 來源）+ 嚴禁 commit（AIFF / 官方音檔 / 網路 mp3 / 包含個資的錄音）+ 避免錯誤 commit 的 3 法。
7. **第二階段（未來）：雲端 TTS 評估**：4 方案比較（OpenAI tts-1 / Google Cloud TTS / Azure TTS / Web Speech API）+ 採用前提（先在 PRODUCT_SPEC「目前明確不做」開放）。
8. **與其他文件的關係**：對齊 PRODUCT_SPEC / STARTERS_PART_TEMPLATES / DATA_SCHEMA / OFFICIAL_RESOURCES / source_materials/README / lib/types / QuizPlay。
9. **版本** v1（2026-05-10）。

### 5. 一行 shell 範例的設計用意

文件提供 `TXT="..."; ID="..."; PART="..."; say && afconvert && rm` 的 5 行 shell 範例，目的是：

- 家長 / 維護者新增題目時可直接複製貼上 + 改 TXT / ID / PART 變數。
- 不需記憶完整指令參數。
- 內含驗證（`afinfo $OUT | head -5`）讓使用者立即看到產出結果。
- 與「人工檢查 6 項」搭配——shell 完成自動化 step 1~3 + 部分 step 4，人工驗證 step 5~6。

### 6. P2-4C-2B-2 「真實音檔」狀態的合理化

舊狀態：「真實音檔（建議用 TTS 自製，避免官方版權）」⬜ 未開始。

本輪後狀態：🟡 部分進行中——附說明：

- ✅ P3-9-C 第一刀已落地**第一個 L3 listening 自製 TTS 音檔**（q-lc-001.m4a）。
- ✅ 完整流程與硬邊界文件 `docs/TTS_AUDIO_WORKFLOW.md` 已就位。
- ⬜ P2 vocabulary 音檔仍 ⬜——需逐筆補 54 字單字音檔，屬未來工作。

P2-4C-2B-2 整體 header 從「尚未開始」改「🟡 部分進行中」對應此狀態。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒串 OpenAI TTS / Google TTS / Azure TTS API
- 沒下載官方音檔 / 不複製官方 sample 音檔
- 沒新增 listening 題目（仍只有 q-lc-001 一題）
- 沒改題目答案 / options / transcript / ttsScript
- 沒改非 listening 題目
- 沒做 Speaking / 錄音 / STT / AI API / crawler
- 沒新增依賴（macOS `say` + `afconvert` 是系統內建）
- 沒處理 npm audit
- 沒部署 / 後端 / DB / 登入
- 沒改 localStorage schemaVersion
- 沒做 `/quiz/wrong`

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤；純資料 + 文件變動 + 1 個二進位素材）。
- `npm run typecheck` → **通過**（exit 0；無 TS 變動）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static、`Generating static pages 88/88`）。

Dev smoke test：

| 驗證項 | 結果 |
| --- | --- |
| 8 條路由 200（`/`、`/review`、`/review/picture`、`/review/words`、`/review/letter/a`、`/review/word/apple`、`/review/word/jump`、`/quiz`） | ✓ |
| **音檔檔案 fetch**：`/audio/starters/l3/q-lc-001.m4a` HTTP 200 / 12008 bytes / `audio/mp4` content-type | ✓ |
| `/quiz` SSR 第 1 題 listening visible HTML 含 Listening 徽章 / Part 3 + 聽音選圖 | ✓ |
| visible audio src 含 `/audio/starters/l3/q-lc-001.m4a`（新副檔名） | ✓ |
| visible 不再含 `/audio/starters/l3/q-lc-001.mp3`（舊副檔名） | ✓ |
| 「正式考試中錄音會播放兩次」聽兩次提示 | ✓（命中 1） |
| transcript「What does the boy want?」visible | ✓ |
| 「音檔準備中，先用文字練習」**不**在 visible HTML（audioSrc 存在 + 檔案存在 → 不走 fallback） | ✓（命中 0） |
| `/review/word/apple` 翻牌完整回歸 | ✓ |
| dev log 無 error / hydration / warn 訊息 | ✓ |

音檔檔案驗證：

| 檢查項 | 結果 |
| --- | --- |
| `file` 顯示 | `ISO Media, Apple iTunes ALAC/AAC-LC (.M4A) Audio` ✓ |
| `afinfo` 顯示 | `1 ch, 22050 Hz, aac (0x00000000) ... estimated duration: 1.864354 sec ... bit rate: 31696 bps` ✓ |
| 檔案大小 | 12008 bytes ✓（< 200 KB / 題建議上限） |
| 透過 dev server fetch | 200 / `audio/mp4` content-type ✓ |

## 【手動檢查結果】

> **使用者請依下方清單在 Mac 本機 + 平板區網 IP 上手動驗收。Codex 5/12 恢復後再做完整總驗收。**

Claude 自測（dev SSR + audio file fetch + lint / typecheck / build）通過。

需要使用者瀏覽器互動驗收：

1. **`/quiz` 第 1 題 audio controls 可播放**：開啟 `/quiz` → 第 1 題 → 應看到瀏覽器原生 audio 控制器（依瀏覽器主題：Chrome 灰底圓形 / Safari 灰底矩形 / Firefox 灰底矩形）→ 點 play 應聽到 macOS `say` 預設語音朗讀「What does the boy want?」（語速正常、約 1.86 秒）。
2. **不顯示「音檔準備中」**：流程 1 後，sky-50 區塊內**不應**出現 amber-700 字色的「音檔準備中，先用文字練習」訊息（因 audioSrc + 實體檔案都存在）。
3. **transcript 仍顯示**：「What does the boy want?」transcript 文字仍位於 audio controls 下方（保留既有顯示能力）。
4. **聽兩次提示仍顯示**：audio 元素正下方應出現「💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習。」sky-600 系小字。
5. **可以正常作答與下一題**：點 4 個選項按鈕之一（apple / banana / cat / dog）→ 高亮 + 「下一題」變可點 → 進到第 2 題（picture-choice）。
6. **直接交卷結果頁正常**：作答後直接交卷 → 結果頁顯示「答對 N / 7 題」+ 詳解列表第 1 題（listening）顯示題目文字版（用 transcript）+ 你的答案 + 正確答案。
7. **retry mode 正常**：若第 1 題答錯或留空 → 進入 retry mode → 第 1 題顯示 audio + 聽兩次提示同 1.；可重播。
8. **`/review` 路由正常**：`/`、`/review`、`/review/picture`、`/review/words`、`/review/word/apple`、`/review/word/jump` 全部不變、互動正常。

預期視覺呈現（首次載入第 1 題）：

```
[Section 1 · Listening｜聽力練習]
Part 3：聽音選圖
第 1 題 / 共 7 題

  🔊
  聽聽看
  [▶] ─────────────── 0:00 / 0:01.86 [HTML5 audio controls]
  💡 正式考試中錄音會播放兩次；本練習版可自行重播音檔練習。
  What does the boy want?

[apple] [banana]
[cat]   [dog]

[下一題 →]

[📝 直接交卷] [🔁 重新測驗]
```

## 【仍未處理】

- **P3-9-C L3 後續** 4 條 ⬜：
  - 多題 L3 音檔（目前只有 q-lc-001 一題）。
  - 音檔品質檢查流程（自動化，目前用人工 6 項）。
  - 未來雲端 TTS 評估（OpenAI / Google / Azure，目前不串 API）。
  - 音檔快取 / 管理策略。
- **P3-9-C 其他 part-specific UI** 條目仍 ⬜（L1 場景圖 + hotspot、L2 文字輸入 name / number、L3 A/B/C 圖選項視覺、L4 簡化版選顏色 / 選物件、RW1 ✓/✗ 按鈕、RW2 場景圖固定、RW3 拼字輸入、RW4 多空格 + word bank、RW5 多圖序列 + one-word、`getStarterPartInfo()` 升級為從 starterPart 直接讀）。
- **P2-4C-2B-2「真實音檔」P2 vocabulary 音檔仍 ⬜**（54 字單字音檔逐筆補；沿用 macOS `say` + `afconvert` 流程即可）。
- **P3-9-B 後續** 7 條 ⬜（ttsScript / imagePrompt 升正式 schema 評估、difficulty 字面量、part-specific question types、validator、sceneGroup、multi-blank、imageSequence）。
- **P3-7-B 後續** 3 條 ⬜（handbook / sample paper 人工筆記、v3 校正、wordlist 校正）。
- **P3-7-C / P3-7-D 全部 ⬜**。
- **P3-6-B-4 後續** 3 條 ⬜（再練習 sessionStorage、獨立錯題複習頁、wrongQuestionIds 升 v2 + migration、錯題歷史紀錄）。
- **P3-6-B-5 計時器** 1 條 ⬜。
- **P3-8 全部 ⬜**。
- **P4 Speaking Examiner Agent 全部 ⬜**。
- **P5 完整仿真考試體驗 ⬜**。
- **P3-2-B / P3-3-B / P3-4 / P3-5 全部 ⬜**。
- **P1 兩條可選 housekeeping**。
- `npm audit` 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **音檔朗讀內容是否與 transcript 完全一致**：本輪 `say -o /tmp/q-lc-001.aiff "What does the boy want?"` 直接用 transcript 文字；macOS `say` 對英文標點處理通常正確（`?` 變上揚語調）。**Codex 驗收建議**：實際播放確認朗讀「What does the boy want?」內容無錯字 / 多餘字。本輪 Claude 無法直接「聽」音檔。
2. **m4a 檔案是否真的乾淨**：本輪用系統內建 `say` + `afconvert` 產生，無第三方依賴；但若 macOS 系統有奇怪設定（例如預設語音為非英文、或 audio 編碼有 iCloud / 廣告 metadata），可能在音檔內藏額外資訊。**Codex 驗收建議**：用 `afinfo` 與 `mediainfo` 檢查音檔 metadata，確認無個資。本檔案 `afinfo` 輸出乾淨（只有 codec / sample rate / bit rate）。
3. **語速 / 語音可能不適合小一**：`say` 預設語速 175 wpm 對小一可能略快；本輪沒設 `-r 150` 或更慢。**Codex 驗收建議**：實聽後若覺得太快，可重產生 `say -r 150 -o ...`；本輪 Claude 無法判斷實際聽感。
4. **`say` 預設語音**：本輪未指定 `-v`，使用系統預設（通常 macOS 是 Samantha 或依系統語言）。若使用者系統設定為中文，`say` 可能用中文語音念英文 → 朗讀錯誤。**Codex 驗收建議**：確認語音是英文發音；若為非英文，可改 `say -v Samantha "..."` 或 `say -v Alex "..."` 等明確指定英文語音。
5. **m4a 在某些舊瀏覽器可能不支援**：m4a / AAC 在現代 desktop / iOS / Android 瀏覽器全支援，但 IE 11 / 舊版 Edge legacy 不支援。**本專案不支援這些瀏覽器**（依 Next.js 16 + React 19 預設），但 Codex 驗收建議在 Safari iOS（iPad）實測一次。
6. **路徑 case sensitive**：macOS 預設檔案系統 case-insensitive，但 Linux 部署環境（若未來部署）case sensitive。**audioSrc 用全小寫**（`/audio/starters/l3/q-lc-001.m4a`）+ 實體檔名也全小寫，已對齊。Codex 驗收提醒未來若部署需測試。
7. **音檔 commit 進 git 後 repo 大小增加**：本檔 12 KB 影響很小；但若未來補 54 字 vocabulary 音檔（每筆 ~10 KB → 540 KB）+ 多題 listening（每題 10~30 KB → 200~600 KB / 100 題）會累積。建議仍維持 commit（依 git 政策），不另立 git-lfs（過度設計）。
8. **/tmp/q-lc-001.aiff 已自動清理**：本輪流程 step 3 移除了 AIFF 暫存；但若使用者照 shell 範例操作時忘記移除，AIFF 會留在 /tmp 直到 reboot。**這是 macOS 本機行為，不影響 repo**，但 docs/TTS_AUDIO_WORKFLOW.md 已明示「Step 3：清理暫存」+ shell 一行範例含 `&& rm -f`。
9. **未來雲端 TTS 引入時的 PRODUCT_SPEC 清單衝突**：本檔提到「未來可評估雲端 TTS」+ `docs/PRODUCT_SPEC.md`「目前明確不做」清單目前不含雲端 TTS。**未來若採用雲端 TTS 需先在 PRODUCT_SPEC「目前明確不做」開放並說明 API key 管理**——本檔已預警。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」8 個檢核點在 Mac + 平板區網 IP 上跑。**最重要**：
   - 流程 1（音檔可播放 + 朗讀內容正確）
   - 流程 2~4（音檔準備中 fallback 不再出現 / transcript / 聽兩次提示）
   - 流程 8（既有路由回歸）
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 實聽音檔驗證朗讀內容、語速、語音是否適合小一。
   - `afinfo` / `mediainfo` 檢查音檔 metadata 無個資。
   - Safari iOS（iPad）實測 m4a 可播。
   - 多瀏覽器（Chrome / Safari / Firefox）audio 控制器視覺一致性。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**多題 L3 音檔**——挑幾個既有 vocabulary 字（apple / cat / dog / book / red / blue 等）出 2~5 題新 listening 題（屬 P3-3-A AI 仿真題流程 + P2-4C-2B-2 音檔產生）；用既有流程批次產生。
   - 路線 B：**P2-4C-2B-2 vocabulary 音檔**——用 `say` 流程批次補 54 字音檔，shell loop 即可。
   - 路線 C：**P3-9-C 第二刀**——RW1 yes-no 按鈕（schema 改動小、教學價值高）。
   - 路線 D：**P3-9-B 第二刀**——metadata validator helper（runtime 校驗 metadata 字面值）。
   - 路線 E：**P3-7-D 動工**——撰寫 sample-paper-observations.md / mock-test-flow.md 第一版。
4. **批次音檔產生 shell loop**（建議下下輪做）：

```bash
# 假設有 word list： apple cat dog book ...
PART=l3
for word in apple cat dog book; do
  ID="q-lc-${word}"
  TXT="What is this? It's a ${word}."
  TMP="/tmp/${ID}.aiff"
  OUT="public/audio/starters/${PART}/${ID}.m4a"
  say -o "$TMP" "$TXT" && afconvert -f m4af -d aac "$TMP" "$OUT" && rm -f "$TMP"
done
```

5. **語速調整**（若家長反饋風險點 3）：在 `docs/TTS_AUDIO_WORKFLOW.md` 補一句「**建議語速：`-r 150` 對小一較友善**」+ 範例改 `say -r 150 -o ...`。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：升 🟡（P2-4C-2B-2 「真實音檔」 ⬜ → 🟡 部分進行中；P2-4C-2B-2 整體 header 從「尚未開始」改「🟡 部分進行中」）。
- 🟡 **P3**：本輪 P3-9-C 從 7 條 ✅ 升為 10 條 ✅（新增 3 條：流程文件 / 路徑 / q-lc-001 第一個音檔）+ 既有 3 條 ⬜ 改寫為 4 條 ⬜（多題音檔 / 音檔品質檢查流程 / 雲端 TTS 評估 / 音檔快取管理）；P3-9 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-9-C part-specific quiz UI 實作**：10 條 ✅（audioSrc 欄位 / audio controls UI / fallback / 聽兩次提示 / q-lc-001 metadata / DATA_SCHEMA 補段 / STARTERS_PART_TEMPLATES 升 v2.1 / **新增 3 條：流程文件 / 路徑 / 第一個音檔**）+ 14 條 ⬜（其他 part-specific UI 條目 + L3 audio 後續 4 條）。
  - 🟡 **P3-7-B**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-9-B**：6 條 ✅ + 7 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-4**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅ + 1 條 ⬜（本輪未動）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8**：本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住（不串雲端 TTS API / 不下載官方音檔 / 不複製官方 sample 音檔 / 不用網路 mp3）。
- 變更紀錄追加 2026-05-10 一筆。

P2 升 🟡 進行中（P2-4C-2B-2 部分 🟡）；P3 整體仍 🟡 進行中；P3-9 仍 🟡（A 完成、B 部分完成 6/13、C 部分完成 10/24）；**符合任務單「不要把 P2-4C-2B-2 整體標完成、不要把 P3-9-C 整體標完成、不要把 P3 整體標完成」要求**。
