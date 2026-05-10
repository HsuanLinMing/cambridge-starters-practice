# 本機自製 TTS 音檔流程（P2-4C-2B-2 / P3-9-C）

> 本檔定義「Cambridge Starters Practice」自製 listening 音檔的完整流程。**只支援本機自製音檔；不串雲端 TTS API、不下載官方音檔、不複製官方 sample paper 音檔**。
>
> 對齊：`docs/PRODUCT_SPEC.md`「目前明確不做」、`docs/STARTERS_PART_TEMPLATES.md` v2.1 的 L3 audio 準備、`docs/OFFICIAL_RESOURCES.md` AI 仿真題素材策略、`source_materials/README.md` 官方資源整理原則。

## 用途

讓 `/quiz` listening 題型可以實際播放音檔（而非只看 transcript 文字）：

- 對應 `ListeningChoiceQuestion.audioSrc?` optional 欄位（P3-9-C 第一刀）。
- 音檔載入失敗時 UI 自動 fallback 到 transcript / ttsScript 文字練習，不會 crash 頁面。
- 提供「正式考試中錄音會播放兩次；本練習版可自行重播音檔練習」的可重播學習體驗。
- **聽力音檔存在且可播放時，測驗中應隱藏文字稿**（P3-9-C 第二刀，2026-05-10）——避免孩子看到題目原文直接答對；只在音檔缺失時 fallback 顯示文字。

### transcript / ttsScript 主要用途

| 用途 | 何時生效 |
| --- | --- |
| **交卷訂正** | 結果頁詳解 / retry mode 結果頁——家長 / 孩子對照「孩子聽到 / 應該聽到的句子」 |
| **家長檢查** | 結果頁詳解時看 transcript 對應 explanation 講解 |
| **音檔缺失時 fallback** | `audioSrc` 缺值或載入失敗時，UI 自動 fallback 到 transcript / ttsScript 文字練習 |
| **TTS 產生來源** | 把 transcript / ttsScript 當作 `say` 指令的輸入文字（本檔流程 step 1） |

⚠️ **在考試中（`/quiz` listening 題作答時），若 `audioSrc` 可播放，UI 不應直接顯示 transcript**——這是 P3-9-C 第二刀的明確設計目標。

## 硬邊界

### ✅ 可以做

- 用 macOS 內建 `say` 指令產生 TTS 音檔（本機、無依賴、不上雲）。
- 用 `afconvert` 把 AIFF 轉 m4a（AAC 編碼，瀏覽器原生支援）。
- 自己錄音（家長 / 老師發音）後手動轉檔。
- 未來若需要不同口音 / 語速，可評估雲端 TTS（OpenAI / Google / Azure），但**目前不串 API**。

### ❌ 不可做

- ❌ **不串雲端 TTS API**（OpenAI TTS / Google TTS / Azure TTS / 任何雲端 API）——本輪不做、避免引入依賴與 API key 管理。
- ❌ **不下載 Cambridge 官方音檔**（即使存在公開 sample paper mp3）。
- ❌ **不複製官方 sample 音檔轉存**到 `public/audio/`。
- ❌ **不使用網路下載的 mp3**（即使來源「免費」也不用）。
- ❌ **不下載第三方教學機構錄製的 starters 音檔**（即使免費分享）。
- ❌ **不 commit 官方 PDF 內嵌音檔**或從中抽取的音訊。

## 第一階段：macOS `say` 指令流程

### 環境需求

- macOS（內建 `say` 指令、AAC 編碼器、`afconvert`）。
- 不需要安裝任何套件（`say` / `afconvert` 都是系統內建）。

### 完整流程

#### Step 1：用 `say` 產生 AIFF

```bash
say -o /tmp/q-lc-001.aiff "What does the boy want?"
```

`say` 預設輸出 AIFF（無壓縮，PCM 編碼，檔案約 80~100 KB / 秒）。AIFF 不適合直接放進瀏覽器（瀏覽器支援度差且檔案大）。

可選參數：

- `-v <voice>`：指定語音（如 `-v Samantha` / `-v Alex`；預設依系統語言）。
- `-r <rate>`：語速（words per minute，預設 175，可 100~250）。

**建議**：第一階段用預設語速；速度太快可降至 `-r 150`（更適合小一）。

#### Step 2：用 `afconvert` 把 AIFF 轉 m4a

```bash
afconvert -f m4af -d aac /tmp/q-lc-001.aiff public/audio/starters/l3/q-lc-001.m4a
```

`-f m4af`：輸出檔案格式 m4a。
`-d aac`：使用 AAC 編碼（瀏覽器原生支援 Chrome / Safari / Firefox / Edge）。

m4a 比 AIFF 小約 80%（本範例 ~12 KB vs ~86 KB），且瀏覽器支援度好。

#### Step 3：清理暫存

```bash
rm -f /tmp/q-lc-001.aiff
```

#### Step 4：驗證

```bash
file public/audio/starters/l3/q-lc-001.m4a
# → ISO Media, Apple iTunes ALAC/AAC-LC (.M4A) Audio

afinfo public/audio/starters/l3/q-lc-001.m4a
# → 顯示 sample rate / 編碼 / duration 等資訊
```

#### Step 5：更新 `audioSrc`

把 `data/p3-example-questions.json` 對應題目的 `audioSrc` 欄位改成新檔案路徑：

```jsonc
{
  "id": "q-lc-001",
  "audioSrc": "/audio/starters/l3/q-lc-001.m4a",  // ← 對應實體檔案
  ...
}
```

#### Step 6：本機驗證

`npm run dev` 後開 `http://localhost:3000/quiz`，第 1 題應顯示 audio 控制器，可點 play 聽到 TTS 朗讀。

### 一行 shell 範例

把上述 step 1~3 合併：

```bash
TXT="What does the boy want?"
ID="q-lc-001"
PART="l3"
TMP="/tmp/${ID}.aiff"
OUT="public/audio/starters/${PART}/${ID}.m4a"
say -o "$TMP" "$TXT" && afconvert -f m4af -d aac "$TMP" "$OUT" && rm -f "$TMP" && afinfo "$OUT" | head -5
```

## 命名規則

### 音檔檔名

| 類型 | 格式 | 範例 |
| --- | --- | --- |
| 題目音檔 | `<question-id>.m4a` | `q-lc-001.m4a` |
| TTS 範例 | `tts-<topic>-<id>.m4a` | `tts-greetings-001.m4a` |

題目音檔的檔名 **必須與 question.id 一致**（去掉 prefix `q-` 也可以；本專案統一保留 `q-` prefix）。

### 音檔放置路徑

```
public/audio/
├── starters/
│   ├── l1/                # Listening Part 1 場景圖配對音檔
│   ├── l2/                # Listening Part 2 對話音檔（name / number）
│   ├── l3/                # Listening Part 3 聽音選圖
│   │   └── q-lc-001.m4a   # 本範例
│   └── l4/                # Listening Part 4 顏色 / 物件指令
└── (legacy)               # P1~P2 既有 vocabulary 音檔（屬未來範圍）
```

`audioSrc` 欄位使用相對路徑 `/audio/starters/<part>/<id>.m4a`（瀏覽器以 `public/` 為 root）。

### audioSrc 對應規則

| 來源 | audioSrc 範例 | 是否可用 |
| --- | --- | --- |
| 本專案 `public/audio/...` 內音檔 | `/audio/starters/l3/q-lc-001.m4a` | ✅ |
| 外部 CDN 音檔 | `https://cdn.example.com/...` | ❌ 嚴禁（外部 URL） |
| Data URL（base64） | `data:audio/m4a;base64,...` | ❌ 不建議（檔案過大） |
| 官方 sample paper 音檔 | 任何 cambridgeenglish.org 路徑 | ❌ 嚴禁（不下載官方音檔） |

## 人工檢查音檔內容

每次新增音檔後，**必須人工檢查**：

1. **檔案存在性**：`ls -la public/audio/starters/<part>/<id>.m4a`，確認檔案大小不為 0。
2. **格式正確**：`file <path>` 顯示 `ISO Media, ... .m4a Audio`。
3. **可播放**：`afplay <path>` 在 Mac 本機播放，確認語音內容與 transcript 一致。
4. **內容正確**：聽完後對照 `data/p3-example-questions.json` 的 `transcript`，確認唸的是同一句、無錯字、無多餘內容。
5. **長度合理**：`afinfo <path>` 顯示 duration——L3 短句問題建議 1.5~3 秒，太長表示語速過慢、太短可能漏字。
6. **音量合理**：用耳機 / 喇叭聽，音量適中、不破音。

如果任一項不通過：

- 重新跑 `say -o ... -v <voice> -r <rate>` 調整語音 / 語速。
- 若 transcript 本身有錯，先修 `data/p3-example-questions.json` 再重產音檔。

## Git 政策

### 音檔可以 commit

本專案的自製 m4a 音檔**屬於版本控制範圍**：

- ✅ `public/audio/starters/**/*.m4a` 自製 TTS / 自錄音檔可 commit。
- ✅ 檔案大小應控制在 < 200 KB / 題（m4a AAC 約 6 kbps，1.5~3 秒語音通常 10~20 KB）。
- ✅ commit message 建議帶題目 id + 來源（例如 `feat(audio): add TTS for q-lc-001 (macOS say)`）。

### 嚴禁 commit

- ❌ AIFF 檔（過大，且應該已用 `afconvert` 轉 m4a）。
- ❌ 任何官方音檔 / 從官方 PDF 抽取的音訊。
- ❌ 從網路下載的 mp3（即使來源「免費」）。
- ❌ 包含個資的錄音（如孩子真名朗讀）。

### 避免錯誤 commit 的方法

1. 在 commit 前用 `file <path>` 確認檔案類型。
2. 若 commit 訊息提到「下載自...」「來自網路...」，停下來檢查來源。
3. 在 PR / 提交前用 `git diff --stat` 看新增的 audio 檔案大小，異常大（>500 KB）通常表示是 wav / 高 bitrate mp3 / 官方完整音檔。

## 第二階段：OpenAI TTS examiner voice 試產流程（2026-05-10 開放，一題版）

> **狀態**：流程文件 + 腳本已就位（`scripts/generate_openai_tts_sample.mjs`）；實際試產需家長 / 維護者本機設定 `OPENAI_API_KEY` 後自行跑。本輪**未實際呼叫 API**——Claude 環境無 API key。

### 目的

產生更接近正式考試員音色的自製音檔，讓孩子在聽力練習時習慣「Cambridge-style young learners examiner」的語氣（清楚、平穩、溫和、語速略慢），並與既有 macOS `say` 版本並存供實聽比較。

### 硬邊界（與第一階段一致 + 雲端 API 額外條款）

- ✅ **OpenAI TTS 只用來把自製文字（transcript / ttsScript）轉成自製音檔**。
- ❌ **絕不上傳官方題目原文 / 歷屆題 / sample paper 內容給 OpenAI**——把官方原文丟進雲端 API 視同分享給第三方。
- ❌ **不下載官方音檔**（不變）。
- ❌ **不批次大量產生**——本階段一題試產（q-lc-001 → q-lc-001-openai.mp3）；批次屬未來範圍，動工前需另外開放。
- ❌ **不覆蓋既有 macOS `say` 版本**（`q-lc-001.m4a` 維持不變；OpenAI 版本另存 `q-lc-001-openai.mp3`）。
- ❌ **不直接修改 `data/p3-example-questions.json` 的 `audioSrc`**——本階段只是試產，需人工實聽通過後**下一輪**再切換。
- ⚠️ **TTS voice 是 AI-generated，不是真人考官聲音**——使用時 UI / README 須處處標示。

### API key 規範

- ✅ `.env.example` 提供範本（`OPENAI_API_KEY=` 空值），可 commit 給其他開發者參考。
- ✅ 實際 key 寫進 `.env.local`（已被 `.gitignore` 排除；新增 `!.env.example` 例外讓範本可 commit）。
- ❌ **絕不 commit `.env` / `.env.local` / 任何含真實 key 的檔案**。
- ❌ 絕不把 key 寫進原始碼或 commit message。
- ✅ 腳本透過 `process.env.OPENAI_API_KEY` 讀取——即用即丟，不寫入任何檔案。

### 流程

#### Step 1：設定 API key

```bash
# 在 .env.local 寫入（檔案已被 .gitignore 排除）：
OPENAI_API_KEY=sk-...你的實際 key...
```

或單次 export（不寫入檔案）：

```bash
export OPENAI_API_KEY=sk-...
```

#### Step 2：執行試產腳本

```bash
# Node 20.6+ 支援 --env-file
node --env-file=.env.local scripts/generate_openai_tts_sample.mjs

# 或直接帶環境變數（任何 Node 18+）
OPENAI_API_KEY=sk-... node scripts/generate_openai_tts_sample.mjs
```

腳本行為：

- 無 `OPENAI_API_KEY` → 印提示後安全退出（exit 0，不視為錯誤）。
- 既有 `q-lc-001-openai.mp3` 存在 → 拒絕覆蓋，提示先手動刪除。
- 拒絕覆蓋既有 `q-lc-001.m4a`（macOS say 版本）。
- 成功 → 寫入 `public/audio/starters/l3/q-lc-001-openai.mp3` + 印檔案大小 + 提示下一步。

#### Step 3：呼叫的 API 與 instructions

- Endpoint：`https://api.openai.com/v1/audio/speech`
- Model：`gpt-4o-mini-tts`
- Voice：預設 `alloy`（可透過環境變數 `OPENAI_TTS_VOICE` 覆寫，常見選擇 `alloy` / `ash` / `fable` / `nova` / `shimmer`）
- Instructions（送給 OpenAI TTS）：

```
Speak like a calm Cambridge-style young learners English examiner.
Use clear standard British English pronunciation.
Speak slowly and clearly for a 6-year-old child.
Tone: warm, neutral, professional, not cartoonish.
Do not sound like a storyteller.
Do not add extra words.
Read only the given text exactly as written.
```

- response_format：`mp3`

#### Step 4：人工實聽確認 5 項

產生後 **必須** 人工實聽（`afplay public/audio/starters/l3/q-lc-001-openai.mp3` 或瀏覽器播放）並確認：

1. **發音清楚**——子音 / 母音清晰，無含糊。
2. **語速適合小一**——不太快、有停頓、孩子聽得懂。
3. **音色像考試員**——平穩 / 溫和 / 專業，**不**像故事旁白 / 卡通配音。
4. **沒有多念額外內容**——只有「What does the boy want?」這一句，沒有自行加字（例如「OK kids, listen carefully...」）。
5. **檔案能在瀏覽器播放**——可用 `npm run dev` 跑開發伺服器，瀏覽器訪問 `http://localhost:3000/audio/starters/l3/q-lc-001-openai.mp3` 確認。

### 切換 audioSrc 的時機

**本階段不切換**——只試產 + 比較。

未來輪次若使用者實聽後決定 OpenAI 版本比 macOS `say` 更好：

1. 在獨立任務單中明示「切換 q-lc-001 audioSrc 從 .m4a 到 .mp3」。
2. 修改 `data/p3-example-questions.json` `q-lc-001.audioSrc` 從 `/audio/starters/l3/q-lc-001.m4a` 改為 `/audio/starters/l3/q-lc-001-openai.mp3`。
3. 保留 `q-lc-001.m4a` 不刪（兩版並存供日後比較）。
4. 若 OpenAI 版本不夠好，跳過此切換 / 嘗試不同 voice / 修 instructions。

### 失敗時的處理

| 情境 | 對應方式 |
| --- | --- |
| 腳本印「未設定 OPENAI_API_KEY」 | 設定 `.env.local` 或 export |
| API 回應 401 / 403 | 確認 key 有效、帳號有 credit |
| API 回應 429 | rate limit；稍後再試 |
| API 回應 500 | OpenAI 服務暫時問題；稍後再試 |
| 音檔不正確（多念字 / 太快 / 不像 examiner） | 改 `instructions` 或 `voice` 重產；本檔可記錄 instructions 版本歷史 |
| 試產後決定不採用 | 直接刪除 `q-lc-001-openai.mp3`；不切換 audioSrc |

## 第三階段（未來）：其他雲端 TTS 評估

**目前仍不做**——只開放 OpenAI TTS 一題試產。未來若需要：

- 不同口音（美式 / 英式 / 澳洲 / 印度 / ...）。
- 跨服務比較（OpenAI vs Google vs Azure）。
- 跨平台支援（其他家長用 Windows 也能產生）。

可評估的雲端方案：

| 方案 | 優點 | 缺點 |
| --- | --- | --- |
| OpenAI TTS（`gpt-4o-mini-tts`，**已試產**） | 自然度高、`instructions` 可控 examiner 語氣、API 簡單 | 付費 / 需 API key / 需網路 |
| Google Cloud TTS | WaveNet 自然度高 / 免費額度 | 需 GCP 帳號 / API key 管理 |
| Azure TTS | 多口音 / 多語音 | 需 Azure 帳號 / API key |
| Web Speech API（純前端） | 無需後端 / 無 API key | 需在瀏覽器執行、無法產生靜態 mp3 / m4a 檔 |

評估時的硬邊界仍適用：

- ❌ 不上傳官方原文 / 歷屆題到任何雲端 TTS API。
- ❌ 不引入需要 OAuth / 大型 SDK 的方案。
- ✅ 若採用，需先在 PRODUCT_SPEC「目前明確不做」清單中明示「雲端 TTS 已開放」並說明 API key 管理方式（例如本階段已做的 OpenAI 例外條款）。

## 與其他文件的關係

| 文件 | 關係 |
| --- | --- |
| `docs/PRODUCT_SPEC.md` | 「目前明確不做」清單（不串 AI 評分、不下載官方素材）；本檔遵守相同邊界。 |
| `docs/STARTERS_PART_TEMPLATES.md` | L3 段（v2.1）說明 audioSrc fallback 機制；本檔提供實際產生流程。 |
| `docs/DATA_SCHEMA.md` | listening-choice schema 含 `audioSrc?` 欄位定義；本檔說明該欄位如何對應實體檔案。 |
| `docs/OFFICIAL_RESOURCES.md` | AI 仿真題素材來源策略；本檔的硬邊界與其一致（不用官方音檔 / 圖片）。 |
| `source_materials/README.md` | 整理區規則；本檔的 commit 政策與其一致。 |
| `lib/types.ts` | `ListeningChoiceQuestion.audioSrc?` optional 欄位 + docstring 說明硬邊界。 |
| `components/QuizPlay.tsx` | `ListeningChoiceView` 讀取 audioSrc 並 render `<audio controls>`；onError 自動 fallback 文字。 |

## 版本

- **v1**（2026-05-10）：第一版——macOS `say` + `afconvert` 流程；硬邊界（不串雲端 API、不下載官方音檔）；命名規則 / 路徑 / 人工檢查 / git 政策；雲端 TTS 評估規劃。
- **v2**（2026-05-10）：新增「第二階段：OpenAI TTS examiner voice 試產流程」段——一題試產（`q-lc-001-openai.mp3`）+ 完整 4 步流程 + API key 規範 + examiner-style instructions + 人工實聽確認 5 項 + 失敗處理表 + 切換 audioSrc 時機；對應 `scripts/generate_openai_tts_sample.mjs` 腳本與 `.env.example` 範本；硬邊界（只把自製文字轉自製音檔、絕不上傳官方原文 / 歷屆題、不批次、不覆蓋既有 macOS `say` 版本、不直接改 audioSrc、API key 不 commit、TTS voice 是 AI-generated 須處處標示）。第一階段 macOS `say` 流程仍為主線。
