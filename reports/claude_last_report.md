# Claude Code 回報 · P3-9-C / P2-4C-2B-2：OpenAI TTS Examiner Voice 試產流程（一題版）

任務日期：2026-05-10
任務性質：**程式碼（Node 腳本）+ 文件 + 環境設定**——OpenAI TTS examiner voice 試產流程文件 + 腳本就位（一題版）。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。本輪只做試產**流程**（文件 + 腳本 + .env.example 範本），**未實際呼叫 OpenAI API**——Claude 環境無 `OPENAI_API_KEY`，腳本「無 key 安全退出」路徑已自測通過。本輪**不批次、不切換 audioSrc、不覆蓋既有 macOS `say` 版本、不修改題目資料、不 commit API key**；未串其他雲端 API；未做 Speaking Agent / 錄音 / STT / 後端 / DB / 登入；未新增依賴 / 處理 npm audit；未部署。

## 【本輪修改摘要】

OpenAI TTS examiner voice 試產流程文件 + 腳本就位，讓使用者本機自行跑 + 實聽比較 macOS `say` vs OpenAI TTS 是否更接近 Cambridge-style young learners examiner 音色。**本輪未實際呼叫 OpenAI API**（Claude 環境無 key），但所有支撐元件（PRODUCT_SPEC 例外條款 / TTS_AUDIO_WORKFLOW 完整流程文件 / Node 腳本 / .env.example 範本 / .gitignore 例外）皆就位。腳本透過 `process.env.OPENAI_API_KEY` 讀取——即用即丟、不寫入任何檔案。用 `gpt-4o-mini-tts` model + Cambridge-style examiner instructions。產出檔名 `q-lc-001-openai.mp3` 與既有 `q-lc-001.m4a`（macOS `say` 版本）並存——**不覆蓋、不切換 audioSrc**。`PROJECT_ROADMAP.md` P3-9-C 把原 ⬜「OpenAI TTS examiner voice 試產流程」升為 1 ✅ + 4 ⬜（使用者實聽比較 / 通過後切 audioSrc / 批次產生多題 / P4 共用策略）；P3-9-C 整體仍 🟡。零依賴新增、未動程式碼（QuizPlay 等）/ 未動 schema / 未動題目資料。`npm run lint` / `typecheck` / `build` 全綠 + 腳本「無 key 安全退出」實跑驗證 exit 0。

## 【OpenAI TTS 試產結果】

**本輪 OpenAI API 未實際呼叫**——Claude 執行環境無 `OPENAI_API_KEY` 環境變數，腳本走「無 key 安全退出」路徑，印出友善提示後 exit 0。預期試產檔案 `public/audio/starters/l3/q-lc-001-openai.mp3` **尚未產生**。

**使用者下一步**（由家長 / 維護者本機執行）：

1. 把 OpenAI API key 寫進 `.env.local`（已被 `.gitignore` 排除）：
   ```
   OPENAI_API_KEY=sk-...你的實際 key...
   ```
2. 執行腳本：
   ```bash
   node --env-file=.env.local scripts/generate_openai_tts_sample.mjs
   ```
   或：
   ```bash
   OPENAI_API_KEY=sk-... node scripts/generate_openai_tts_sample.mjs
   ```
3. 腳本成功後會印 ✅ + 檔案大小，輸出 `public/audio/starters/l3/q-lc-001-openai.mp3`。
4. 用 `afplay` 或瀏覽器播放實聽，比對 `q-lc-001.m4a`（macOS `say` 版本）。
5. 通過後在**下一輪**獨立任務單明示「切換 q-lc-001 audioSrc」。

預期 OpenAI TTS 行為（依 docs/TTS_AUDIO_WORKFLOW.md「第二階段」段）：

- model：`gpt-4o-mini-tts`
- voice：`alloy`（預設；可透過環境變數 `OPENAI_TTS_VOICE` 覆寫為 `ash` / `fable` / `nova` / `shimmer`）
- text：`What does the boy want?`（自製 transcript）
- instructions：「Speak like a calm Cambridge-style young learners English examiner. Use clear standard British English pronunciation. Speak slowly and clearly for a 6-year-old child. Tone: warm, neutral, professional, not cartoonish. Do not sound like a storyteller. Do not add extra words. Read only the given text exactly as written.」
- response_format：`mp3`

腳本拒絕覆蓋情境（已實作）：

- 既存 `q-lc-001-openai.mp3` 存在 → 拒絕覆蓋並提示先手動刪除。
- 與既有 `q-lc-001.m4a` 路徑相同（不會發生，但 defensive 檢查）→ 拒絕。

## 【修改檔案清單】

新增 3 份：

- `scripts/generate_openai_tts_sample.mjs`（~150 行 Node 腳本）：一題試產腳本核心輸出。
- `.env.example`：`OPENAI_API_KEY=` 空值範本 + 說明註解（可 commit）。
- `scripts/`（新目錄）。

修改 5 份：

- `.gitignore`：`.env*` 之後加 `!.env.example` 例外，讓 template 可 commit；實際 key 檔案（`.env` / `.env.local`）仍排除。
- `docs/PRODUCT_SPEC.md`：「目前明確不做 → AI / 自動化」段補一條「不做大量雲端 TTS 批次產生」+ 新增子段「**OpenAI TTS examiner voice 試產（一題版例外，2026-05-10 開放）**」含 6 條邊界。
- `docs/TTS_AUDIO_WORKFLOW.md`：升 v2，新增「第二階段：OpenAI TTS examiner voice 試產流程」整段（目的 / 硬邊界 / API key 規範 / 4 步流程 / 切換 audioSrc 時機 / 失敗處理表）+ 第三階段（其他雲端 TTS 評估，仍不做）+ 版本段加 v2 紀錄。
- `README.md` `/quiz` 條目補「目前正在評估 OpenAI TTS examiner voice」+ 「OpenAI TTS 只用於把自製文字轉自製音檔，絕不上傳官方原文」+ 「API key 不會 commit」+ 「TTS voice 是 AI-generated，不是真人考官聲音」+「本輪未實際呼叫 API（Claude 環境無 key）」+「切換 audioSrc 屬下一輪」。
- `PROJECT_ROADMAP.md`：P3-9-C 把原 ⬜「OpenAI TTS examiner voice 試產流程」升為 1 ✅（流程文件 + 腳本完成）+ 4 ⬜（使用者實聽比較 / 通過後切 audioSrc / 批次產生多題 / P4 共用 examiner voice 策略）；變更紀錄追加 2026-05-10 一筆。
- `reports/claude_last_report.md`：本回報。

未動：`lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `data/p3-example-questions.json`（**audioSrc 仍 `.m4a`，不切換**）/ `app/quiz/page.tsx` / `components/QuizPlay.tsx` / 任何 `app/review/*` / 其他 components / `docs/DATA_SCHEMA.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `public/audio/starters/l3/q-lc-001.m4a`（**macOS `say` 版本完全保留**）/ 既有圖片 / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. 腳本「無 key 安全退出」設計

任務單明示「若沒有 `OPENAI_API_KEY`，清楚印出提示並安全退出」。本腳本：

```ts
const apiKey = process.env.OPENAI_API_KEY;
if (!apiKey) {
  // 印友善提示 + 設定指引
  process.exit(0);  // exit 0：不視為錯誤
}
```

**exit 0 而非 exit 1** 的理由：

- 無 key 不是 bug，是預期狀態（家長未設定）。
- 在 CI / 自動化流程中不應失敗（即使腳本不跑也不阻擋 build）。
- 給使用者清楚的設定指引（`.env.example` 複製 / `--env-file` 用法 / 直接 export）。

實際自測：在 Claude 環境（無 OPENAI_API_KEY）執行 `node scripts/generate_openai_tts_sample.mjs` → 印提示 + exit 0。✓

### 2. 不覆蓋 / 不切換 / 不污染既有資料

任務單明示三個「不」：

| 規則 | 實作 |
| --- | --- |
| 不要自動覆蓋現有 `q-lc-001.m4a` | 腳本輸出檔名為 `q-lc-001-openai.mp3`（不同檔名）；額外 defensive 檢查 `outputAbsPath === existingMacSayPath` 拒絕 |
| 不要直接切換 data audioSrc | 腳本完全不讀寫 `data/p3-example-questions.json`；切換屬下一輪人工任務 |
| 不要修改 `data/p3-example-questions.json` | 腳本只讀環境變數 + 寫 mp3 檔，不動 JSON |

實際 dev smoke 後檢查：`q-lc-001.m4a` 大小 12008 bytes（與前一輪一致）；`audioSrc` 仍是 `.m4a`。

### 3. API key 安全處理

| 風險 | 防護 |
| --- | --- |
| API key commit 進 git | `.gitignore` `.env*` 排除 `.env` / `.env.local`；`!.env.example` 例外只允許範本 commit；範本 `OPENAI_API_KEY=` 不填值 |
| API key 寫進原始碼 | 腳本只透過 `process.env.OPENAI_API_KEY` 讀取，不接受 CLI 參數、不寫入任何檔案 |
| API key 印進 stdout / log | 腳本失敗時印 `OpenAI API 呼叫失敗：HTTP 401`，不印 key |
| API key 殘留在 working tree | 本輪只新增 `.env.example`（範本），無 `.env` / `.env.local` 檔案被建立 |

實際自測：`ls .env*` 只顯示 `.env.example`；`git check-ignore` 確認 `.env.example` 未被 ignore（可 commit）/ `.env` 與 `.env.local` 仍被 ignore。

### 4. 不裝套件（用 Node 內建 fetch）

任務單明示「不要新增依賴」。OpenAI 官方 SDK（`openai` npm package）會新增依賴 → 不用。改用 Node 18+ 內建 `fetch` 直接呼叫：

```ts
const response = await fetch("https://api.openai.com/v1/audio/speech", {
  method: "POST",
  headers: {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    model: MODEL,
    voice: VOICE,
    input: TEXT,
    instructions: INSTRUCTIONS,
    response_format: RESPONSE_FORMAT,
  }),
});
const audioBuffer = Buffer.from(await response.arrayBuffer());
await writeFile(outputAbsPath, audioBuffer);
```

優點：

- 不影響 `package.json` / `package-lock.json`。
- 不引入 SDK 大型依賴（`openai` package 含多模型支援、tokenizer 等不必要功能）。
- API 呼叫透明可審——一個 fetch + 一個 writeFile，無黑箱。

### 5. examiner-style instructions 設計

任務單明示音色目標：「Cambridge-style young learners examiner / 清楚 / 平穩 / 溫和 / 偏標準英語 / 英式口音 / 語速略慢 / 不卡通 / 不像故事旁白 / 不自行加字」。腳本 instructions 全文：

```
Speak like a calm Cambridge-style young learners English examiner.
Use clear standard British English pronunciation.
Speak slowly and clearly for a 6-year-old child.
Tone: warm, neutral, professional, not cartoonish.
Do not sound like a storyteller.
Do not add extra words.
Read only the given text exactly as written.
```

7 句覆蓋所有任務單明示要求。最後一句「Read only the given text exactly as written」明示禁止自行加字（避免 model 加「OK kids, listen carefully...」之類），對齊使用者「正式考試感」需求。

### 6. PRODUCT_SPEC 邊界開放對齊既有「目前明確不做」清單

`docs/PRODUCT_SPEC.md`「目前明確不做 → AI / 自動化」段先前明示「不做雲端 TTS 批次產生」。本輪要開放一題試產，但不能無原則開放——所以加：

1. **保留**「不做大量雲端 TTS 批次產生」總原則。
2. **新增**子段「OpenAI TTS examiner voice 試產（一題版例外，2026-05-10 開放）」，明確標日期 + 6 條邊界。
3. 對應 ROADMAP 條目鎖定一題範圍（`q-lc-001-openai.mp3`）+ 4 條 ⬜ 後續（使用者實聽 / 通過後切 audioSrc / 批次 / P4 共用策略）需另開任務單動工。

這是**「逐步開放」設計模式**——先試產一題、實聽通過後再批次；批次仍需另外開放邊界。

### 7. 沒做的事（嚴守任務單禁止清單）

- 沒批次產生音檔
- 沒覆蓋現有 `q-lc-001.m4a`
- 沒直接切換 `data/p3-example-questions.json` audioSrc
- 沒下載官方音檔 / 不使用官方 sample 音檔
- 沒新增題目 / 改題目答案
- 沒做 Speaking Agent / 錄音 / STT
- 沒新增後端 / DB / 登入
- 沒部署
- 沒處理 npm audit
- 沒 commit API key
- 沒 commit `.env` / `.env.local`（兩者皆未建立，working tree 只有 `.env.example`）
- 沒新增依賴（用 Node 內建 fetch）

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤；`scripts/*.mjs` 不在 ESLint 預設掃描範圍內，`components/QuizPlay.tsx` 等仍照常掃描）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static）。

腳本自測（無 OPENAI_API_KEY 安全退出）：

| 驗證項 | 結果 |
| --- | --- |
| `node scripts/generate_openai_tts_sample.mjs`（無 key）印友善提示 | ✓ |
| 提示含「設定方式」3 步指引 + `.env.example` 引用 + `--env-file` 範例 | ✓ |
| exit code = 0（非錯誤） | ✓ |
| 沒有意外建立任何檔案 | ✓（working tree 只新增 `.env.example`） |

`.gitignore` 配置自測：

| 驗證項 | 結果 |
| --- | --- |
| `.env.example` NOT ignored（可 commit） | ✓（`git check-ignore -v` 顯示 `!.env.example` 規則命中） |
| `.env` ignored | ✓（`.env*` 規則命中） |
| `.env.local` ignored | ✓（`.env*` 規則命中） |
| working tree 中無 `.env` / `.env.local` 檔案 | ✓（只有 `.env.example`） |

既有資料保護自測：

| 驗證項 | 結果 |
| --- | --- |
| `public/audio/starters/l3/q-lc-001.m4a` 大小未變（12008 bytes） | ✓ |
| `data/p3-example-questions.json` `audioSrc` 仍是 `.m4a`（未切換） | ✓ |

## 【手動檢查結果】

> **使用者本機驗收**：本輪 Claude 未實際呼叫 OpenAI API（無 key），腳本只走無 key 安全退出路徑。實際試產 + 實聽比較需家長 / 維護者本機執行。

需要使用者本機操作：

1. **設定 OPENAI_API_KEY**：
   ```bash
   cp .env.example .env.local
   # 編輯 .env.local 填入 OPENAI_API_KEY=sk-...
   ```
2. **執行試產腳本**：
   ```bash
   node --env-file=.env.local scripts/generate_openai_tts_sample.mjs
   ```
3. **預期輸出**：
   - 印 🎤 OpenAI TTS examiner voice 試產（一題版）+ 配置資訊。
   - 呼叫 OpenAI API。
   - 成功 → 印 ✅ 試產完成 + 檔案大小（mp3 約 5~30 KB / 1~3 秒）+ 下一步指引。
4. **產生的音檔存在**：`ls -la public/audio/starters/l3/q-lc-001-openai.mp3`。
5. **瀏覽器可播放**：
   ```bash
   npm run dev
   # 訪問 http://localhost:3000/audio/starters/l3/q-lc-001-openai.mp3
   ```
   或直接 `afplay public/audio/starters/l3/q-lc-001-openai.mp3`。
6. **檔名沒有覆蓋 macOS say 版本**：確認 `public/audio/starters/l3/q-lc-001.m4a` 仍存在且大小不變（12008 bytes）。
7. **沒有修改 data audioSrc**：`grep audioSrc data/p3-example-questions.json` 仍顯示 `.m4a` 路徑。
8. **沒有把 API key 寫入任何檔案**：`grep -r "sk-" .` 不應有命中（除了 `.env.local` 自己）；`.env.local` 已被 `.gitignore` 排除、不會 commit。

實聽確認 5 項（任務單明示）：

1. **發音清楚**——子音 / 母音清晰。
2. **語速適合小一**——不太快、有停頓。
3. **音色像考試員**——平穩 / 溫和 / 專業，不像故事旁白 / 卡通。
4. **沒有多念額外內容**——只有「What does the boy want?」這一句。
5. **檔案能在瀏覽器播放**——任何主流瀏覽器（Chrome / Safari / Firefox）。

實聽通過後**下一輪**才動 audioSrc 切換（屬獨立任務單）。

## 【仍未處理】

- **OpenAI 試產實際執行**：本輪 Claude 未呼叫 API；需家長 / 維護者本機跑。
- **使用者實聽比較 macOS `say` vs OpenAI TTS**（屬下一輪）。
- **若實聽通過，切換 q-lc-001 audioSrc 從 `.m4a` 到 `.mp3`**（屬下一輪獨立任務）。
- **批次產生多題 L3 音檔**（OpenAI 版本通過後，可考慮）。
- **未來 P4 Speaking Examiner Agent 共用 examiner voice 策略**（與 Listening 試產的 examiner voice 文化對齊）。
- P3-9-C L3 後續其他 4 條 ⬜（多題 L3 音檔 / 音檔品質檢查流程 / 雲端 TTS 評估 / 音檔快取管理）+ 練習模式顯示文字稿開關 ⬜。
- P3-9-C 其他 part-specific UI 條目仍 ⬜（L1 場景圖 + hotspot、L2 文字輸入、L3 A/B/C 圖選項視覺、L4 簡化版選顏色 / 物件、RW1 ✓/✗、RW2 場景圖固定、RW3 拼字輸入、RW4 多空格 + word bank、RW5 多圖序列 + one-word、`getStarterPartInfo()` 升級）。
- P2-4C-2B-2 vocabulary 音檔仍 ⬜。
- P3-9-B 後續 7 條 ⬜；P3-7-B 後續 3 條 ⬜；P3-7-C / P3-7-D / P3-8 / P4 / P5 全 ⬜；P3-6-B-4 後續 3 條 ⬜；P3-6-B-5 1 條 ⬜；P3-2-B / P3-3-B / P3-4 / P3-5 全 ⬜；P1 兩條可選 housekeeping；npm audit 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **Claude 未實際呼叫 OpenAI API**：本輪只完成「流程 + 腳本 + 文件」三層，腳本「無 key 安全退出」自測通過。**實際 API 呼叫的成功率、回應時間、錯誤碼處理**需家長 / 維護者本機跑後驗證。**Codex 5/12 後驗收**：建議 Codex 在本機設 OPENAI_API_KEY 後實跑一次，確認音檔產生、瀏覽器可播。
2. **`gpt-4o-mini-tts` model 名稱與可用性**：本輪以任務單給的 model 名稱寫進腳本。OpenAI model 命名規則可能變動（例如未來改名 `gpt-4o-tts-mini` 之類）；若實跑時遇 404 model 不存在，需更新腳本中的 `MODEL` 變數。**Codex 驗收建議**：實跑前用 `https://api.openai.com/v1/models` 確認 model 仍存在。
3. **Voice 預設 `alloy` 可能不是最佳選擇**：`alloy` 是 OpenAI 最 neutral / clear 的 voice，但對 examiner 風格可能不夠 British。`fable` 偏 British 表達 / `nova` 偏溫暖女聲 / `shimmer` 偏柔軟。**腳本支援 `OPENAI_TTS_VOICE` 環境變數覆寫**——使用者可不改腳本嘗試不同 voice。
4. **`instructions` 在某些 model / voice 組合下可能效果不一**：OpenAI TTS `instructions` 參數對 `gpt-4o-mini-tts` 支援；舊 `tts-1` model 可能不完整支援。腳本明示用 `gpt-4o-mini-tts`。**Codex 驗收建議**：若實跑後 `instructions` 沒生效（音色不像 examiner），可改用 `gpt-4o-mini-tts` 的其他變體或加 prompt engineering。
5. **Cost 風險**：OpenAI TTS 計費（依字元數）。一題試產約 25 字元 / `What does the boy want?` 成本極低（< $0.001）。但若使用者誤觸或之後批次產生，成本可能增加。**docs/TTS_AUDIO_WORKFLOW.md 已寫「不批次大量產生」邊界**；script 也只處理一題固定 text，不支援批次。
6. **`.env.local` 若被 IDE / 同步工具誤推**：本輪確保 `.gitignore` `.env*` 排除；但若使用者用某些 IDE 設定 / Dropbox / iCloud 同步資料夾把 `.env.local` 同步上雲端，仍可能洩漏 key。**這超出本專案範圍**，但 docs/TTS_AUDIO_WORKFLOW.md「API key 規範」段已提示「絕不寫進原始碼或 commit message」。
7. **音檔副檔名 `.mp3` vs `.m4a`**：macOS `say` 流程產 m4a，OpenAI 流程產 mp3。**兩種都被瀏覽器原生支援**。但若使用者切換 audioSrc 從 `.m4a` 到 `.mp3`（下一輪），需確認所有 listening 題的 audioSrc 副檔名一致 / 或在 schema 文件明示「兩種都允許」。docs/DATA_SCHEMA.md 既有 listening-choice 段範例已用 `.m4a`，未來 audioSrc 對應規則表可能需小修。
8. **`scripts/` 目錄目前只有一支腳本**：未來若新增 batch 產生 / 不同題型的 helper script，可考慮加 `scripts/README.md` 說明各腳本用途。本輪不做。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」8 項在 Mac 本機跑：
   - **必跑**：流程 1（設定 key）→ 2（執行腳本）→ 5（瀏覽器播放或 afplay）。
   - **必確認**：流程 6（不覆蓋 macOS say 版本）/ 流程 7（不改 audioSrc）/ 流程 8（不 commit key）。
   - **實聽 5 項**：發音 / 語速 / 音色 / 多念字 / 瀏覽器可播。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 實際 OpenAI API 呼叫測試（Codex 本機設 key）。
   - 跨 voice 比較（`alloy` / `fable` / `nova` / `shimmer`）找出最像 examiner 的選擇。
   - 跨瀏覽器播放（Chrome / Safari / Firefox / iPad Safari）。
   - 「`q-lc-001-openai.mp3` 已存在拒絕覆蓋」分支自測。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**OpenAI 實聽通過後切換 audioSrc**——獨立任務單修改 `data/p3-example-questions.json` `q-lc-001.audioSrc` 從 `.m4a` 改為 `q-lc-001-openai.mp3`；保留 `q-lc-001.m4a` 不刪。
   - 路線 B：**批次產生多題 L3 音檔**——在開放邊界後，把腳本改寫為「讀題目 id 列表」批次跑。
   - 路線 C：**P3-9-C 第三刀 RW1 yes-no 按鈕**（schema 改動小、教學價值高）。
   - 路線 D：**P2-4C-2B-2 vocabulary 音檔**（54 字 shell loop 補齊，先用 macOS `say` / 通過後可擴 OpenAI）。
   - 路線 E：**P3-9-C 練習模式顯示文字稿開關**（解決前一輪報告風險點 4）。
4. **OpenAI 實聽結果記錄建議**：使用者實聽後可在 `docs/TTS_AUDIO_WORKFLOW.md` 補一段「實聽紀錄」（本輪實聽用 voice / 評語 / 是否通過 / 改進方向），方便未來新增題目時參考成功經驗。
5. **批次產生時的 cost 監控**：若未來真的批次產生，建議加：
   - 在腳本啟動時印「本次預計呼叫 N 次 / 預估 cost X 美元」+ 等待使用者確認。
   - 加 `--dry-run` 旗標只計算 cost 不實際呼叫。
6. **Voice 比較的記錄結構**：建議建立 `docs/notes/openai-tts-voice-comparison.md`（屬未來），記錄 alloy / ash / fable / nova / shimmer 等 voice 對 q-lc-001 的實際聲音表現，給後續題目作者參考最佳 voice。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 🟡 部分進行中）。
- 🟡 **P3**：本輪 P3-9-C 把原 ⬜「OpenAI TTS examiner voice 試產流程」升為 1 ✅ + 4 ⬜（使用者實聽比較 / 通過後切 audioSrc / 批次產生多題 / P4 共用 examiner voice 策略）；P3-9-C 從 13 條 ✅ 升為 14 條 ✅、新增 4 條 ⬜（總 14 ✅ + 9 ⬜）；P3-9 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-9-C part-specific quiz UI 實作**：14 條 ✅ + 9 條 ⬜（其中 5 條為 L3 後續 + 4 條為 OpenAI TTS 後續 + 既有 part-specific UI 條目仍 ⬜）。
  - 🟡 **P3-7-B**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-9-B**：6 條 ✅ + 7 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-4**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅ + 1 條 ⬜（本輪未動）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8**：本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：本輪在 PRODUCT_SPEC「目前明確不做 → AI / 自動化」段補一條「不做大量雲端 TTS 批次產生」+ 新增子段「OpenAI TTS examiner voice 試產（一題版例外，2026-05-10 開放）」含 6 條邊界——**邊界已收緊**（明確標日期 + 一題範圍 + 6 條條件）。其他禁止項目皆守住。
- 變更紀錄追加 2026-05-10 一筆。

P3 整體仍 🟡 進行中；P3-9 仍 🟡（A 完成、B 部分完成 6/13、C 部分完成 14/23）；**符合任務單「不要把 P3-9-C 整體標完成、不要把 P2-4C-2B-2 整體標完成、不要把 P3 整體標完成」要求**。
