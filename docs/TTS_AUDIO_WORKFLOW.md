# 本機自製 TTS 音檔流程（P2-4C-2B-2 / P3-9-C）

> 本檔定義「Cambridge Starters Practice」自製 listening 音檔的完整流程。**只支援本機自製音檔；不串雲端 TTS API、不下載官方音檔、不複製官方 sample paper 音檔**。
>
> 對齊：`docs/PRODUCT_SPEC.md`「目前明確不做」、`docs/STARTERS_PART_TEMPLATES.md` v2.1 的 L3 audio 準備、`docs/OFFICIAL_RESOURCES.md` AI 仿真題素材策略、`source_materials/README.md` 官方資源整理原則。

## 用途

讓 `/quiz` listening 題型可以實際播放音檔（而非只看 transcript 文字）：

- 對應 `ListeningChoiceQuestion.audioSrc?` optional 欄位（P3-9-C 第一刀）。
- 音檔載入失敗時 UI 自動 fallback 到 transcript / ttsScript 文字練習，不會 crash 頁面。
- 提供「正式考試中錄音會播放兩次；本練習版可自行重播音檔練習」的可重播學習體驗。

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

## 第二階段（未來）：雲端 TTS 評估

**目前不做**——本輪只用 macOS `say`。未來若需要：

- 不同口音（美式 / 英式 / 澳洲）。
- 更自然的語音（神經網路 TTS 比 `say` 自然）。
- 跨平台支援（其他家長用 Windows 也能產生）。

可評估的雲端方案：

| 方案 | 優點 | 缺點 |
| --- | --- | --- |
| OpenAI TTS（`tts-1`）| 自然度高、API 簡單 | 付費 / 需 API key / 需網路 |
| Google Cloud TTS | WaveNet 自然度高 / 免費額度 | 需 GCP 帳號 / API key 管理 |
| Azure TTS | 多口音 / 多語音 | 需 Azure 帳號 / API key |
| Web Speech API（純前端）| 無需後端 / 無 API key | 需在瀏覽器執行、無法產生靜態 mp3 / m4a 檔 |

評估時的硬邊界仍適用：

- ❌ 不上傳官方原文 / 歷屆題到任何雲端 TTS API。
- ❌ 不引入需要 OAuth / 大型 SDK 的方案。
- ✅ 若採用，需先在 PRODUCT_SPEC「目前明確不做」清單中明示「雲端 TTS 已開放」並說明 API key 管理方式。

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
