# 小朋友實機試玩觀察清單與後續決策紀錄

> 對應 P3-9-C 近期成果（Listening v2 / L3 A/B/C / RW1 yes/no / RW3 spelling 多題 / spellingHint / letterScramble）+ Codex 驗收後留下的 UX observation。
>
> 本檔**不是規格、不是測試 case**，是給家長 / 老師 / GPT 設計者一份**陪小朋友試玩時可以邊看邊勾**的觀察筆記，幫助累積實機回饋以決定下一刀方向。

最新整理：2026-05-13。

---

## 1. 目前要觀察的功能

依目前已上線的 P3-9-C 範圍，建議實機試玩時重點觀察：

| 功能 | 對應 part / 題型 | 重點 |
| --- | --- | --- |
| Listening L3 A/B/C 圖卡 | L3 `listening-choice` + `optionType: "image"` | 3 張圖卡 + A/B/C 角落標籤 + 不顯示英文單字；音檔 OpenAI v2 examiner voice；考試中隱藏 transcript |
| RW1 yes/no | RW1 `true-false` | q-tf-001（yes，cat.svg + 「It is a cat.」）+ q-tf-002（no，cat.svg + 「It is a dog.」）；emerald ✓ / rose ✗ 大按鈕 |
| RW3 spelling | RW3 `spelling` | 4 題：apple / cat / dog / book；大型輸入框 + autoCapitalize/autoCorrect/spellCheck 全關 |
| RW3 spellingHint 缺字提示 | RW3 `spelling` 內 optional 欄位 | 4 題各：`a _ _ l e` / `c _ t` / `d _ g` / `b _ _ k`；淡藍 sky-50 區塊；不參與 isCorrect |
| RW3 letterScramble 字母重組提示 | RW3 `spelling` 內 optional 欄位 | 4 題各：`p p a l e` / `t a c` / `g d o` / `o b k o`；淡紫 violet-50 區塊；不參與 isCorrect |
| 結果頁詳解 | `/quiz` 交卷後 `<QuestionDetailCard>` | 每題 emerald 答對 / rose 答錯 / amber 未作答；含 Section + Part 標示 + 題目文字版 + 你的答案 + 正確答案 + explanation；transcript 在訂正頁才出現 |
| Retry mode | `/quiz` 結果頁「再練習這些題目」 | 純 in-memory state；不存 localStorage；不覆蓋原始分數；retry 完顯示獨立小結果 |

附帶要持續觀察但已先有共識的：

- Listening 音檔長度約 1.86 秒（OpenAI v2，比 macOS say 自然；但屬 AI generated examiner voice，非真人考官）。
- 14 題 R&W 排序：picture-choice → true-false → word-choice → spelling → multiple-choice → fill-blank → matching；目前 9 題（13 題含 L3）。
- 圖片缺檔仍 fallback 顯示「字母 + 圖片準備中」；L3 圖卡的 fallback 改用 A/B/C 字母（不洩漏答案）。

---

## 2. 小朋友實機觀察清單

建議陪玩時準備一張這份清單列印 / 開另一個分頁勾選；每題實機時記錄一行短評。

### 2.1 題目理解

- [ ] 是否看得懂題目要做什麼（不需要家長解釋）
- [ ] L3 是否知道要先聽音檔再選 A/B/C
- [ ] L3 音檔聽不清楚 / 太快 / 太慢時的反應
- [ ] RW1 是否知道「It is a cat.」是「描述圖」需要答 Yes / No
- [ ] RW3 是否知道要在輸入框輸入完整英文單字（不是只填空缺）
- [ ] RW3 是否會誤以為缺字提示 `a _ _ l e` 是答案 / 是要填入的格式
- [ ] RW3 是否會誤以為字母重組 `p p a l e` 是答案 / 是「順序就是這樣念」
- [ ] RW3 同時顯示「缺字提示 + 字母重組」時，是否會頭暈 / 不知道要看哪個

### 2.2 互動與輸入

- [ ] L3 圖卡點擊區是否夠大（手指好點）
- [ ] L3 圖卡選中後 highlight 是否清楚
- [ ] RW1 Yes / No 大按鈕點擊體驗（手指好點 / 顏色明確）
- [ ] RW3 輸入框是否夠大（小朋友能看清楚自己打的字）
- [ ] RW3 行動裝置會不會自動把首字母改大寫 / 自動更正（理論上已停用、需實機確認）
- [ ] RW3 輸入錯字時的反應（會不會直接放棄、會不會想再試）
- [ ] 「下一題」按鈕是否清楚、點完後是否平順
- [ ] 「直接交卷」/「重新測驗」chip 按鈕小朋友是否會誤觸

### 2.3 視覺與排版

- [ ] 手機畫面 RW3 spelling 題卡是否太長（圖 + 提示語 + 缺字提示 + 字母重組 + 輸入框 + 提示行 = 多段堆疊）
- [ ] 手機畫面 L3 是否需要捲動才能看完音檔 + 3 張圖卡 + 下一題
- [ ] sky-50 vs violet-50 兩個提示區塊配色對小一是否清楚（不會混淆 / 不會太醒目讓圖片被忽略）
- [ ] 圖片 SVG 視覺是否容易辨識（apple / cat / dog / book / banana）
- [ ] 段落徽章（Section 1 Listening / Section 2 R&W）+ Part 標示行是否會被小朋友忽略 / 反而干擾

### 2.4 結果頁與訂正

- [ ] 結果頁分數呈現是否好懂（答對 N / M、已作答 / 未作答雙欄）
- [ ] 結果頁詳解 emerald ✓ / rose ✗ / amber 顏色是否好分辨
- [ ] **No ✗（RW1 yes/no 答 No）是否會被誤會成「答錯 ✗」**——這是 Codex 留下的 UX observation 重點
- [ ] 結果頁 transcript（L3 訂正時才出現）小朋友 / 家長是否會看
- [ ] 「再練習這些題目」按鈕進去後是否能順暢完成 retry
- [ ] retry 完看到「不會覆蓋原始分數」提示是否清楚
- [ ] 篩選 chip「全部 / 只看錯題 / 只看未作答 / 需要再練習」是否易用

### 2.5 整體體驗

- [ ] 完整 13 題跑下來耗時（陪玩或不陪玩）
- [ ] 中途會不會想離開 / 想重玩
- [ ] 是否會主動希望「再多一些題目」
- [ ] 是否會回答「下次我還想玩這個」
- [ ] 家長 / 老師覺得最值得加強的點

---

## 3. 後續決策方向

依實機觀察結果，列出幾個目前已預想的決策方向；**這份清單不代表已決定，只是用來收斂下一刀討論**。

### 3.1 RW3 提示策略

- A. **維持現狀**：缺字提示 + 字母重組同時顯示——對小一最容易；風險是太簡單、孩子看一眼就拼出來
- B. **只顯示缺字提示**（拿掉 letterScramble）——保留位置感、不洩漏所有字母
- C. **只顯示字母重組**（拿掉 spellingHint）——只考重組能力、孩子自己想拼字位置
- D. **依題目難度顯示不同提示**：簡單題顯示兩種、進階題只顯示一種或都不顯示——需要 metadata 加 difficulty 對應渲染規則
- E. **加 toggle 由家長 / 孩子自己選**：例如題目卡上方加「顯示提示 / 隱藏提示」按鈕——純 client state、不存 localStorage

### 3.2 RW3 互動進階

- F. **字母拖曳組字**（拖曳字母塊到指定格子）——需要新元件 + 觸控事件處理；中等規模新功能
- G. **點選字母組字**（點字母按鈕依序組成單字）——比拖曳簡單但效果類似；元件規模較小
- H. **「看答案」/「再試一次」按鈕**——與 retry mode 結合；答錯後可清空 input、答對後看答案進下一題；零後端、純 React state

### 3.3 RW3 review 區獨立練習

- I. **review 區獨立拼字練習模式**：把 spelling 邏輯抽 hook 給 `/review/word/[id]` 加「拼字練習」tab；不交卷、無分數、純練習；可擴展到全部 54 個 vocabulary 條目（屬 P2-4C-2B-2 範圍）

### 3.4 結果頁 No ✗ 視覺

- J. **保持現狀**：RW1 yes/no 答 No 結果頁顯示「No ✗」；答錯也顯示 ✗；視覺上可能混淆——但邏輯上是分開的（emerald 答對 / rose 答錯 配色已區隔）
- K. **把 RW1 No 答對改成「No ✓」**：把「使用者選的選項本身的肖像」與「對錯狀態圖示」拆開；視覺上更明確「我選的是 No、而且我選對了」
- L. **加狀態圖示前綴 + 答案文字並列**：例如「✓ 你選了 No / ✗ 你選了 Yes」格式；屬最大改動的方向
- M. **僅在結果頁加說明文字**：例如選 No 答對時補一句「（你答 No 是對的）」中文 fallback；最小改動

### 3.5 多題與素材

- N. **補更多 RW3 主題題目**（red / blue / one / two / mother / father / banana 等用既有 SVG）；零新圖、零新邏輯
- O. **補更多 RW1 題目**（多元主題 yes/no 平衡）；目前只有 2 題 cat 場景
- P. **補更多 L3 題目**配新 OpenAI v2 音檔；需要使用者明確啟動 OpenAI API

---

## 4. 文件邊界

- 本檔**不是規格、不是測試 case 設計**，是「實機試玩時邊看邊勾的筆記範本」。
- 本檔**不會自動更新**——每次實機觀察後請手動把回饋寫入 GitHub issue / discussion / commit message，並對應更新本檔的 checklist 勾選狀態或 3 後續決策方向段落。
- 後續若多次實機後對某個決策方向已收斂，請把對應段落 ✅ 標示 + 把實機回饋摘要寫進 PROJECT_ROADMAP「P3-9-C 小朋友實機觀察與提示策略調整」條目。
- **這份檔對 AI 規格 / 程式碼沒有任何強制力**——AI 只看 `lib/types.ts` / `components/QuizPlay.tsx` / `data/*.json` / 既有規格文件做事；本檔只給人類用。

---

## 5. 相關檔案索引

- 互動規格與題型設計：[`docs/STARTERS_PART_TEMPLATES.md`](./STARTERS_PART_TEMPLATES.md)（含 RW1 / RW3 / L3 模板與 v2.0~v2.8 變更紀錄）
- 題目資料 schema：[`docs/DATA_SCHEMA.md`](./DATA_SCHEMA.md)
- 產品邊界與「目前明確不做」清單：[`docs/PRODUCT_SPEC.md`](./PRODUCT_SPEC.md)
- AI 仿真題流程：[`docs/AI_QUESTION_GENERATION.md`](./AI_QUESTION_GENERATION.md)
- 本機 TTS 流程：[`docs/TTS_AUDIO_WORKFLOW.md`](./TTS_AUDIO_WORKFLOW.md)
- Codex 驗收手冊：[`docs/CODEX_VALIDATION_RUNBOOK.md`](./CODEX_VALIDATION_RUNBOOK.md)
- AI 任務分流：[`docs/TASK_ROUTER.md`](./TASK_ROUTER.md)

## 6. 版本

- **v1**（2026-05-13）：第一版——對應 P3-9-C 近期成果（Listening v2 / L3 A/B/C / RW1 yes/no / RW3 spelling 多題 / spellingHint / letterScramble）+ Codex 驗收後留下的 UX observation。第一版只整理「要觀察什麼 / 有哪些可勾選項 / 有哪些後續決策方向」，**不含任何實機回饋紀錄**——回饋待小朋友實際試玩後補。
