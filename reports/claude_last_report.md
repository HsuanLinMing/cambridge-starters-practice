# Claude Code 回報 · OpenAI TTS examiner voice v2：調整語速與自然度

任務日期：2026-05-10
任務性質：**腳本 + 文件**——OpenAI TTS examiner voice v2 instructions 調整 + 腳本支援版本化輸出。**Codex 暫停期由 Claude 自測**，使用者手動驗收，5/12 後 Codex 完整總驗收。Claude 環境無 `OPENAI_API_KEY`——本輪**未實際呼叫 API 產生 v2 音檔**；腳本「無 key 安全退出」自測 exit 0。**未動** `data/p3-example-questions.json`（audioSrc 仍 `.m4a`）/ 既有 v1 `q-lc-001-openai.mp3`（user 上輪實聽用）/ macOS say `q-lc-001.m4a` / `lib/*` / `app/*` / `components/*` / 其他 docs（PRODUCT_SPEC / DATA_SCHEMA 等）/ `.env.example` / `.gitignore`；未新增依賴 / 處理 npm audit / 部署 / 後端 / DB / 登入 / 批次 / 新增題目 / 改答案 / Speaking Agent。

## 【本輪修改摘要】

依使用者 v1 實聽回饋（「比 macOS say 正式但語速太慢、有點刻意」）調整 OpenAI TTS instructions + 腳本支援版本化輸出：

- `scripts/generate_openai_tts_sample.mjs`：(a) instructions 從 v1「Speak slowly」+「British English」改為 **v2「Speak clearly at a natural exam pace ... not overly slow」+「Do not over-emphasize each word」+「standard English」**（保留 examiner / professional / natural 主軸 + 「不卡通、不故事旁白、不加字」三條）；(b) 輸出檔名加 suffix → 預設 `q-lc-001-openai-v2.mp3`、支援 `OPENAI_TTS_OUTPUT_SUFFIX=v3` 環境變數覆寫；(c) docstring 加 v1 / v2 版本歷史；(d) 「拒絕覆蓋既有檔案」邏輯維持（v2 路徑與 v1、macOS say `.m4a` 皆不衝突）；(e) 「無 OPENAI_API_KEY 安全退出 exit 0」維持。
- `docs/TTS_AUDIO_WORKFLOW.md` 升 v2.1：新增「**OpenAI examiner voice 實聽調整紀錄**」子段——v1 / v2 instructions 對照表 + v1 → v2 調整理由 + **v2 實聽檢核點 6 項**（語速自然 / 無過度強調為新增）+ **v3+ 觸發條件對照表** + 跑 v3 的環境變數用法。
- `README.md` `/quiz` 條目補 v1 實聽回饋 + v2 instructions 重點 + 「v2 待實聽」+ 「`/quiz` 仍使用 macOS say 版本」+ 指向實聽紀錄段。
- `PROJECT_ROADMAP.md` P3-9-C「使用者實聽比較」⬜ 改 🟡（v1 已實聽 / v2 待實聽）+ 新增 1 條 ✅（v2 instructions 調整 + 腳本版本化輸出）；變更紀錄追加。

零依賴新增、未動 schema / 題目資料 / 既有音檔。`npm run lint` / `typecheck` / `build` 全綠 + 腳本「無 key 安全退出」實跑驗證 exit 0。

## 【OpenAI TTS v2 試產結果】

**本輪 Claude 未實際呼叫 OpenAI API 產生 v2 音檔**——Claude 環境無 `OPENAI_API_KEY`。腳本走「無 key 安全退出」路徑（exit 0），印友善提示。預期 v2 檔案 `public/audio/starters/l3/q-lc-001-openai-v2.mp3` **尚未產生**。

實際 working tree audio 檔案狀態（已驗證）：

| 檔案 | 大小 | 來源 / 狀態 |
| --- | --- | --- |
| `public/audio/starters/l3/q-lc-001.m4a` | 12008 bytes | macOS `say` v1，**完整保留** |
| `public/audio/starters/l3/q-lc-001-openai.mp3` | 64896 bytes | OpenAI TTS **v1**（使用者上輪本機已產生並實聽），**完整保留** |
| `public/audio/starters/l3/q-lc-001-openai-v2.mp3` | — | **尚未產生**——使用者本機跑後生成 |

使用者本機產生 v2 的步驟：

```bash
# 1. .env.local 已存在（使用者上輪設定），含 OPENAI_API_KEY
# 2. 跑腳本（預設輸出 v2）
node --env-file=.env.local scripts/generate_openai_tts_sample.mjs
# 3. 實聽
afplay public/audio/starters/l3/q-lc-001-openai-v2.mp3
# 4. 比較 v1（已實聽）/ v2（新版）/ macOS say（基準）
afplay public/audio/starters/l3/q-lc-001-openai.mp3      # v1（語速太慢、刻意）
afplay public/audio/starters/l3/q-lc-001-openai-v2.mp3   # v2（待評估）
afplay public/audio/starters/l3/q-lc-001.m4a             # macOS say（基準）
```

預期 v2 行為：

- model：`gpt-4o-mini-tts`（不變）
- voice：`alloy`（預設不變；可用 `OPENAI_TTS_VOICE=fable` 等環境變數試其他 voice）
- text：`What does the boy want?`（不變）
- **instructions（v2 改寫）**：
  ```
  Speak like a calm Cambridge-style young learners English examiner.
  Use clear standard English pronunciation.
  Speak clearly at a natural exam pace for a 6-year-old child, not overly slow.
  Tone: warm, neutral, professional, and natural.
  Do not sound cartoonish or like a storyteller.
  Do not over-emphasize each word.
  Do not add extra words.
  Read only the given text exactly as written.
  ```

## 【修改檔案清單】

修改 4 份：

- `scripts/generate_openai_tts_sample.mjs`：v2 instructions（8 句）+ 版本化輸出 `OUTPUT_SUFFIX`（預設 `v2`，env var `OPENAI_TTS_OUTPUT_SUFFIX` 覆寫）+ docstring 加 v1 / v2 版本歷史 + 使用方式補 OPENAI_TTS_OUTPUT_SUFFIX 範例。
- `docs/TTS_AUDIO_WORKFLOW.md`：「第二階段」段尾加「OpenAI examiner voice 實聽調整紀錄」子段（v1 / v2 對照表 + 調整理由 + v2 實聽檢核點 6 項 + v3+ 觸發條件對照表）；版本段加 v2.1 紀錄。
- `README.md` `/quiz` 條目把 OpenAI 評估部分擴寫為 v1 已實聽 + 反饋 + v2 調整 + v2 待實聽 + 指向實聽紀錄段。
- `PROJECT_ROADMAP.md` P3-9-C「使用者實聽比較」⬜ 改 🟡（v1 已實聽、v2 待實聽）+ 新增 1 條 ✅（v2 instructions 調整 + 版本化輸出）；變更紀錄追加 2026-05-10 一筆。
- `reports/claude_last_report.md`：本回報。

未動：`data/p3-example-questions.json`（**audioSrc 仍 `.m4a` 不切換**）/ `q-lc-001.m4a`（macOS say）/ `q-lc-001-openai.mp3`（v1）/ `lib/types.ts` / `lib/data.ts` / `lib/examSessionStorage.ts` / `app/quiz/page.tsx` / 任何 `app/review/*` / `components/QuizPlay.tsx` / 其他 components / `docs/PRODUCT_SPEC.md` / `docs/STARTERS_PART_TEMPLATES.md` / `docs/OFFICIAL_RESOURCES.md` / `docs/AI_QUESTION_GENERATION.md` / `docs/DATA_SCHEMA.md` / `AI_DEV_WORKFLOW.md` / `AGENTS.md` / `CLAUDE.md` / `source_materials/*` / `.env.example` / `.gitignore` / `package.json` / 依賴。

## 【核心邏輯說明】

### 1. instructions v1 → v2 的具體改動

| 句子 | v1 | v2 | 變動理由 |
| --- | --- | --- | --- |
| 主指令 | Speak like a calm Cambridge-style young learners English examiner. | （同 v1） | 保留 examiner 主軸 |
| 發音 | Use clear standard **British** English pronunciation. | Use clear standard English pronunciation. | 移除 British 綁死，讓 voice 在 alloy / fable 等選擇上更自然 |
| 語速 | **Speak slowly and clearly** for a 6-year-old child. | **Speak clearly at a natural exam pace** for a 6-year-old child, **not overly slow**. | 對應「太慢、刻意」回饋；natural exam pace + 雙保險 not overly slow |
| Tone | Tone: warm, neutral, professional, **not cartoonish**. | Tone: warm, neutral, professional, **and natural**. | 加 natural 對齊使用者「希望更自然」期望 |
| 反例 1 | Do not sound like a storyteller. | Do not sound cartoonish or like a storyteller. | 兩條合併（cartoonish 從 Tone 句搬過來） |
| 反例 2 | （無） | **Do not over-emphasize each word.** | 新增——直接對應「刻意感」回饋 |
| 反例 3 | Do not add extra words. | （同 v1） | 不變 |
| 結尾 | Read only the given text exactly as written. | （同 v1） | 不變 |

8 句 instructions（v1 為 7 句），視覺 diff 反映「移除 slowly + 加 natural pace + 加 over-emphasize 反例」三大改動。

### 2. 版本化輸出設計

任務單明示「優先簡單穩定，不要做過度設計」。本實作：

```ts
const OUTPUT_SUFFIX = process.env.OPENAI_TTS_OUTPUT_SUFFIX ?? "v2";
const OUTPUT_REL_PATH = `public/audio/starters/l3/q-lc-001-openai-${OUTPUT_SUFFIX}.mp3`;
```

- 一行 default（v2）+ 一行 env var fallback——零複雜度。
- 預設行為簡單（不設 env var → 自動產 v2）。
- 進階用法直觀（`OPENAI_TTS_OUTPUT_SUFFIX=v3` 試新版 / `=v2-fable` 試不同 voice）。
- 不破壞既有 v1（v1 是無 suffix 的歷史例外，新版本一律帶 suffix）。

### 3. 「拒絕覆蓋既有檔案」邏輯維持

腳本內既有檢查：

```ts
// 不能與既有 macOS say 版本路徑相同（defensive）
if (outputAbsPath === existingMacSayPath) { ... process.exit(1); }

// 既存 OpenAI 版本存在則拒絕覆蓋（防誤跑兩次）
try {
  await access(outputAbsPath);
  console.error(`⚠️  ${OUTPUT_REL_PATH} 已存在；若要重新產生，請先手動刪除...`);
  process.exit(1);
} catch { /* 不存在繼續 */ }
```

對 v2 場景：

- 第一次跑：`q-lc-001-openai-v2.mp3` 不存在 → 產生新檔。
- 重複跑：拒絕覆蓋 → 提示先手動 `rm public/audio/starters/l3/q-lc-001-openai-v2.mp3` 或改 suffix（`OPENAI_TTS_OUTPUT_SUFFIX=v2-take2`）。

### 4. 「實聽調整紀錄」子段的設計用意

`docs/TTS_AUDIO_WORKFLOW.md` 新增子段三大用途：

1. **歷史可追溯**：v1 / v2 / 未來 v3 對照表 + 每版回饋——讓未來決策有依據。
2. **觸發條件公式化**：v3+ 觸發條件對照表把「具體 v2 觀察 → 具體 v3 instructions 調整」量化，避免下次盲改。
3. **Voice 嘗試空間**：保留 `OPENAI_TTS_VOICE=fable / nova / shimmer` 等可能性給使用者實驗。

### 5. README 文案：v1 / v2 並存呈現

任務單未明示 README 怎麼寫，但邏輯上應反映現況：

- v1 已產生且使用者已實聽（給回饋）
- v2 已調整 instructions 但**未實際產生**
- `/quiz` **仍用 macOS say 版本**（audioSrc 不變）
- 切換 audioSrc 屬下一輪

README 文案如此呈現避免「產出與實際使用混淆」（讀者不會誤以為 v2 已上線）。

### 6. 為何 PRODUCT_SPEC.md / .env.example / .gitignore 都不動

- PRODUCT_SPEC「目前明確不做」上輪已加「OpenAI TTS examiner voice 試產（一題版例外）」開放條款，**v2 仍在「一題試產」範圍內**——不需要再開放邊界。
- `.env.example` 範本內容（`OPENAI_API_KEY=`）對 v1 / v2 都適用——不需改。
- `.gitignore` `.env*` + `!.env.example` 規則對 v1 / v2 都適用——不需改。

### 7. 為何 q-lc-001-openai-v2.mp3 沒在本輪產生

Claude 環境無 OPENAI_API_KEY，腳本自動走「安全退出 exit 0」路徑。實際呼叫 API 屬使用者本機行為——使用者已有 `.env.local`（上輪設定，含 user 的 key），跑 `node --env-file=.env.local scripts/generate_openai_tts_sample.mjs` 即可產生 v2。

**安全邊界檢查**：Claude 從未讀取 `.env.local` 內容；`unset OPENAI_API_KEY && node script` 確認真的在無 key 狀態執行；working tree 無新增 `.env` / `.env.local`（本輪只動 4 份既有檔案 + 1 份 reports 檔）。

### 8. 沒做的事（嚴守任務單禁止清單）

- 沒覆蓋 v1 `q-lc-001-openai.mp3` 或 macOS say `q-lc-001.m4a`
- 沒改 `data/p3-example-questions.json`（audioSrc 仍 `.m4a`）
- 沒批次產生
- 沒新增題目 / 改答案
- 沒下載官方音檔 / 不使用官方 sample 音檔
- 沒做 Speaking Agent
- 沒新增依賴
- 沒部署
- 沒 commit API key / `.env` / `.env.local`
- 沒實際呼叫 OpenAI API（環境無 key）

## 【測試結果】

- `npm run lint` → **通過**（0 警告 0 錯誤）。
- `npm run typecheck` → **通過**（exit 0）。
- `npm run build` → **通過**（路由 88 不變、全 SSG / Static）。

腳本自測（無 OPENAI_API_KEY 安全退出）：

| 驗證項 | 結果 |
| --- | --- |
| `unset OPENAI_API_KEY && node scripts/generate_openai_tts_sample.mjs` 印友善提示 | ✓ |
| 提示含 `.env.example` / `--env-file` / `OPENAI_API_KEY=` 三種設定方式 | ✓ |
| exit code = 0（非錯誤） | ✓ |
| 沒有意外建立任何檔案（v2 mp3 仍未產生） | ✓ |

既有資料保護自測：

| 驗證項 | 結果 |
| --- | --- |
| `data/p3-example-questions.json` `audioSrc` 仍是 `.m4a` 未切換 | ✓（grep 確認） |
| `q-lc-001.m4a` 大小未變（12008 bytes） | ✓ |
| `q-lc-001-openai.mp3` (v1) 大小未變（64896 bytes） | ✓ |
| `q-lc-001-openai-v2.mp3` 不存在（待使用者本機產） | ✓ |
| 沒有 `.env` / `.env.local` 被 commit（`.env.local` 為使用者上輪建立、`.gitignore` 排除中） | ✓ |
| `.env.example` 仍可 commit（`!.env.example` 例外規則維持） | ✓ |

腳本內容自測：

| 驗證項 | 結果 |
| --- | --- |
| v2 instructions 含「natural exam pace」 | ✓（grep 命中） |
| v2 instructions 含「Do not over-emphasize each word」 | ✓ |
| v2 instructions 含「standard English」（不再含 British） | ✓ |
| 預設 OUTPUT_SUFFIX = "v2" | ✓ |
| 支援 `OPENAI_TTS_OUTPUT_SUFFIX` 環境變數覆寫 | ✓ |
| docstring 含 v1 / v2 版本歷史 | ✓ |

## 【手動檢查結果】

> **使用者本機驗收**：本輪 Claude 未實際呼叫 OpenAI API；實際 v2 試產 + 實聽需家長 / 維護者本機跑。

需要使用者本機操作：

1. **產生 v2 音檔**：
   ```bash
   node --env-file=.env.local scripts/generate_openai_tts_sample.mjs
   ```
   預期：印「🎤 OpenAI TTS examiner voice 試產（一題版）」+ 配置（model `gpt-4o-mini-tts` / voice `alloy` / 輸出 `public/audio/starters/l3/q-lc-001-openai-v2.mp3`）→ 呼叫 API → 印「✅ 試產完成」+ 檔案大小（mp3 約 50~80 KB / 1.5~2.5 秒）。

2. **`q-lc-001-openai-v2.mp3` 存在**：`ls -la public/audio/starters/l3/`。

3. **舊的 `q-lc-001-openai.mp3` 仍存在**：同上 ls 應顯示 v1 仍在（64896 bytes 不變）。

4. **`q-lc-001.m4a` 仍存在**：同上 ls 應顯示 macOS say 版本仍在（12008 bytes 不變）。

5. **`data/p3-example-questions.json` 沒有改 audioSrc**：
   ```bash
   grep audioSrc data/p3-example-questions.json
   # 應顯示 "audioSrc": "/audio/starters/l3/q-lc-001.m4a",
   ```

6. **沒有把 API key 寫入任何檔案**：
   ```bash
   git status               # 不應有 .env / .env.local 出現
   git check-ignore .env.local  # 應確認被 ignored
   ```

7. **實聽 v2 檢核點 6 項**（依 docs/TTS_AUDIO_WORKFLOW.md「OpenAI examiner voice 實聽調整紀錄」段）：
   - 發音清楚
   - 語速自然（**v2 重點**：比 v1 快、比 macOS say 平穩）
   - 音色像考試員
   - 沒有過度強調（**v2 重點**）
   - 沒有多念字
   - 瀏覽器可播放

8. **三版對比建議**：
   ```bash
   afplay public/audio/starters/l3/q-lc-001-openai.mp3      # v1（語速太慢、刻意）
   afplay public/audio/starters/l3/q-lc-001-openai-v2.mp3   # v2（待評估）
   afplay public/audio/starters/l3/q-lc-001.m4a             # macOS say（基準）
   ```

實聽通過後**下一輪**才動 audioSrc 切換（屬獨立任務單）。

## 【仍未處理】

- **使用者本機產生 v2 音檔 + 實聽**：本輪 Claude 未呼叫 API。
- **若 v2 仍不滿意產 v3+**：用 `OPENAI_TTS_OUTPUT_SUFFIX=v3` 環境變數，依 docs 中「v3+ 觸發條件對照表」調整 instructions。
- **若實聽通過切換 audioSrc**：屬下一輪獨立任務單；保留 macOS say + v1 + v2 等多版並存。
- **批次產生多題 L3 音檔**：屬未來開放（仍需另外開放 PRODUCT_SPEC 邊界）。
- **未來 P4 Speaking Examiner Agent 共用 examiner voice 策略**：與 Listening 試產對齊。
- P3-9-C L3 後續其他 ⬜（多題 L3 音檔 / 音檔品質檢查流程 / 音檔快取管理 / 練習模式顯示文字稿開關）+ 其他 part-specific UI 條目仍 ⬜。
- P2-4C-2B-2 vocabulary 音檔仍 ⬜。
- P3-9-B 後續 7 條 ⬜；P3-7-B 後續 3 條 ⬜；P3-7-C / P3-7-D / P3-8 / P4 / P5 全 ⬜；P3-6-B-4 後續 3 條 ⬜；P3-6-B-5 1 條 ⬜；P3-2-B / P3-3-B / P3-4 / P3-5 全 ⬜；P1 兩條可選 housekeeping；npm audit 兩個 moderate 警告（任務單禁止處理）。

## 【風險點】

> 給 5/12 恢復後的 Codex 與下一輪 ChatGPT / Claude 特別注意。

1. **Claude 未實際呼叫 API 產生 v2**：本輪只完成「instructions 調整 + 腳本版本化 + 文件 + Roadmap」四層；實際 v2 音檔需使用者本機跑。**Codex 5/12 後驗收**：建議 Codex 在本機設 OPENAI_API_KEY 後實跑一次，確認 v2 音檔產生並符合預期。
2. **OpenAI TTS 對 instructions 的詮釋未必精準**：`Do not over-emphasize each word` / `not overly slow` 等「不要做 X」instructions 有時 model 會理解錯反而觸發 X 行為。**Codex 驗收建議**：若 v2 仍刻意 / 過慢，依 v3+ 觸發條件對照表調整。
3. **預設 voice `alloy` 對 examiner 風格的適配性**：`alloy` 偏中性 / 偏美式；若 v2 instructions 改 standard 後 voice 仍偏美式，可能不夠 examiner 感。**選項**：使用者跑時可加 `OPENAI_TTS_VOICE=fable` 試英式偏向；或加 `OPENAI_TTS_VOICE=ash` 試低沉穩重。
4. **「natural exam pace」對 OpenAI TTS 的解讀模糊**：「exam pace」不是常見說法；OpenAI TTS 可能把它解讀為「考試般緊張」（語速反而過快）。**降階方案**（若 v2 太快）：加 `with comfortable pauses between phrases`（不直接加 slowly）；屬 v3 觸發條件已記錄。
5. **`Do not over-emphasize each word` 的副作用**：可能讓 model 把整句念得太平，失去 examiner 的「強調關鍵字」感（例如「What does the boy **want**?」的 want 應略強調）。若使用者反饋此問題，可在 v3 改為 `with natural sentence stress, not exaggerated word-by-word emphasis`。
6. **`q-lc-001-openai-v2.mp3` 既存時拒絕覆蓋**：若使用者已跑過 v2 並儲存，再跑時腳本會拒絕。**設計選擇**——避免不慎覆蓋已實聽過的版本。需重產時手動 rm 或用 `OPENAI_TTS_OUTPUT_SUFFIX=v2-take2`。
7. **使用者已有 `.env.local` 的 key 被 Claude 看到的風險**：本輪 Claude 用 `unset OPENAI_API_KEY && node ...` 確認在無 key 狀態跑——**Claude 從未讀取 `.env.local` 內容**。但若 Claude 環境之後跑 `node --env-file=.env.local ...` 會載入 key、可能在錯誤訊息或 stderr 印出。**保護措施**：本輪一律不跑 `--env-file`；只跑無 key 安全退出路徑。Codex 驗收建議檢查 dev log / git status 不洩漏 key。
8. **PRODUCT_SPEC「一題試產」邊界與 v1 / v2 / v3+ 多版本的關係**：上輪 PRODUCT_SPEC 寫「一題試產（本輪只產生 q-lc-001-openai.mp3）」；本輪實質產生 v2、未來可能產 v3+。**雖然多版本仍是同一題**（q-lc-001），但 PRODUCT_SPEC 措辭可能讓未來輪次誤解「只能產一個檔案」。**建議下下輪修 PRODUCT_SPEC**：把「一題」明確為「一題範圍內可有多版 instruction tuning」。本輪不動 PRODUCT_SPEC（避免擴大 scope）。

## 【後續建議】

1. **使用者本輪手動驗收**：依「【手動檢查結果】」8 項在 Mac 本機跑：
   - **必跑**：流程 1（產生 v2）→ 7（實聽 6 項）→ 8（三版對比）。
   - **必確認**：流程 3 / 4 / 5（v1 + macOS say + audioSrc 不變）/ 6（API key 不洩漏）。
2. **5/12 Codex 恢復後跑功能總驗收**：
   - 實際 OpenAI v2 試產（Codex 本機設 key）。
   - 跨 voice 比較（`alloy` / `fable` / `nova`）找最佳 examiner 音色。
   - 跨瀏覽器 v2 mp3 播放測試。
   - 「v2 已存在拒絕覆蓋」分支自測。
3. **下一輪實作建議優先序**（請 ChatGPT 收斂）：
   - 路線 A：**v2 實聽通過後切換 audioSrc**——獨立任務單修 `data/p3-example-questions.json` `q-lc-001.audioSrc` 從 `.m4a` 改為 `q-lc-001-openai-v2.mp3`；保留所有舊版本。
   - 路線 B：**v2 不滿意則產 v3**——使用者依 v3+ 觸發條件表選定 instructions 改動，跑 `OPENAI_TTS_OUTPUT_SUFFIX=v3 node ...`；docs 自動可記錄 v3。
   - 路線 C：**P3-9-C 第三刀 RW1 yes-no 按鈕**（schema 改動小、教學價值高）。
   - 路線 D：**批次產生多題 L3 音檔**（先在 PRODUCT_SPEC 開放邊界後）。
   - 路線 E：**P3-9-C 練習模式顯示文字稿開關**。
4. **v2 實聽結果記錄**：使用者實聽後在 `docs/TTS_AUDIO_WORKFLOW.md`「實聽調整紀錄」表的 v2 列「使用者實聽回饋」欄填入結果（_待實聽_ 改為實際評語），方便 v3 觸發判斷。
5. **多 voice 比較記錄**：若使用者額外試 `OPENAI_TTS_VOICE=fable / nova / shimmer`，建議在「實聽調整紀錄」表加 voice 欄並記錄各 voice 對 q-lc-001 的表現，給後續題目作者參考。
6. **v3+ 觸發條件表已就位**：未來輪次 ChatGPT / Claude 動 v3 時可直接從 docs 抄具體 instructions 調整方向；不必重新發明。

## 【Roadmap 同步檢查】

對照新版 `PROJECT_ROADMAP.md`：

- ✅ **P1**：未動。
- 🟡 **P2**：未動（P2-4C-2B-2 仍 🟡 部分進行中）。
- 🟡 **P3**：本輪 P3-9-C「使用者實聽比較」⬜ 改 🟡（v1 已實聽 / v2 待實聽）+ 新增 1 條 ✅（v2 instructions 調整 + 腳本版本化輸出）；P3-9-C 從 14 條 ✅ 升為 15 條 ✅；P3-9 整體仍 🟡。
  - ✅ **P3-1 / P3-2-A / P3-3-A / P3-6-A / P3-6-B-1 / P3-6-B-2 / P3-6-B-3 / P3-7-A / P3-9-A**：上輪起維持 ✅，本輪未動。
  - 🟡 **P3-9-C part-specific quiz UI 實作**：15 條 ✅ + 1 條 🟡（使用者實聽比較）+ 8 條 ⬜（其他 L3 後續 + 批次 + 既有 part-specific UI 條目）。
  - 🟡 **P3-7-B**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-9-B**：6 條 ✅ + 7 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-4**：6 條 ✅ + 3 條 ⬜（本輪未動）。
  - 🟡 **P3-6-B-5 計時器**：1 條 ✅ + 1 條 ⬜（本輪未動）。
  - ⬜ **P3-2-B / P3-3-B / P3-4 / P3-5 / P3-7-C / P3-7-D / P3-8**：本輪未動。
- ⬜ **P4 / P5**：未動（仍 ⬜）。
- ➕ **目前明確不做**：未動。本輪所有禁止項目皆守住（不批次 / 不切換 audioSrc / 不覆蓋既有檔 / 不 commit API key / 不下載官方音檔）。
- 變更紀錄追加 2026-05-10 一筆。

P3 整體仍 🟡 進行中；P3-9 仍 🟡（A 完成、B 部分完成 6/13、C 部分完成 15/24）；**符合任務單「不要把 P3-9-C 整體標完成、不要把 P3 整體標完成」要求**。
