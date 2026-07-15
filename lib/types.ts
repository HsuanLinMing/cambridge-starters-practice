export type PartOfSpeech =
  | "noun"
  | "verb"
  | "adjective"
  | "adverb"
  | "number"
  | "preposition"
  | "pronoun";

export type VocabularyCategory =
  | "food"
  | "animals"
  | "colors"
  | "numbers"
  | "family"
  | "body"
  | "school"
  | "home"
  | "weather"
  | "actions"
  | "other";

export type VocabularyItem = {
  id: string;
  word: string;
  pos: PartOfSpeech;
  category: VocabularyCategory;
  translation: string;
  exampleEn: string;
  exampleZh: string;
  image?: string;
  audio?: string;
};

export type MultipleChoiceQuestion = {
  id: string;
  type: "multiple-choice";
  prompt: string;
  options: string[];
  answer: string;
};

export type QuizQuestion = MultipleChoiceQuestion;

export type Quiz = {
  id: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
};

// ============================================================================
// P3 考前練習題庫 / 考卷 / Session schema
// ----------------------------------------------------------------------------
// 上方 `MultipleChoiceQuestion` / `QuizQuestion` / `Quiz` 為 P1~P2 既有 type，
// 由 `data/quizzes.json` 與 `lib/data.ts` 直接使用、不可破壞。
// 下方 P3 type 為 P3-1 新增的完整題庫設計，與舊 type **並存**：
//   - 舊 type 仍涵蓋 P1~P2 的簡單 multiple-choice 範例。
//   - 新 type 預留給 P3 完整 ExamPaper / Session 流程。
// 兩者未來若要統一，需在 ROADMAP 提案後再做遷移；本輪不動既有 callers。
// ============================================================================

/** 題目來源；每題必填，便於日後篩選練習範圍。 */
export type QuestionSource =
  | "official_sample" // 官方公開 sample papers / 樣題整理
  | "past_paper" // 歷屆考題整理（自家學習用，不對外散布）
  | "ai_generated" // AI 依題型風格生成的仿真題
  | "custom"; // 使用者自製或老師補充

/** 題目層來源追溯資訊；只記錄來源與 reviewer 判斷，不代表授權或可複製官方素材。 */
export type QuestionSourceProvenance = {
  /** 對應 source registry / manual fixture 的來源 id。 */
  sourceId?: string;
  /** 可重現來源的 URL。正式 source-first 題目若有來源追溯，必填此欄。 */
  sourceUrl: string;
  /** 來源文件或頁面標題。 */
  documentTitle?: string;
  /** PDF 頁碼 / 網頁位置提示。 */
  pageHint?: string;
  /** 文件段落 / 題型區塊提示。 */
  sectionHint?: string;
  /** source registry 的細分類，例如 official_learning_material。 */
  sourceKind?: string;
  /** 發行機構。 */
  publisher?: string;
  /** 發行機構類型，例如 official / school / third_party。 */
  publisherType?: string;
  /** reviewer 對授權 / 使用邊界的筆記；不是授權證明。 */
  rightsNotes?: string;
  /** 來源追溯與人工審核筆記。 */
  provenanceNotes?: string;
  /** 題目層 reviewer 備註。 */
  reviewerNotes?: string;
};

/** 題型 discriminator。 */
export type QuestionType =
  | "multiple-choice" // 通用文字 4 選 1
  | "picture-choice" // 看圖選字（題目圖 + 4 文字選項）
  | "word-choice" // 看字選圖（題目文字 + 4 圖片選項）
  | "listening-choice" // 聽力選擇（音檔 + 4 文字 / 圖片選項）
  | "fill-blank" // 填空（含選項版 / 自由填空版）
  | "matching" // 連連看
  | "true-false" // 看圖判斷 yes / no（對齊正式 RW1）
  | "spelling"; // 看圖拼字輸入（對齊正式 RW3）

/** 難度標記，可省略；保留給未來分級練習使用。 */
export type DifficultyLevel = "easy" | "medium" | "hard";

// ============================================================================
// P3-9-B Starters part metadata（第一刀，optional 欄位）
// ----------------------------------------------------------------------------
// 對齊 `docs/STARTERS_PART_TEMPLATES.md` v1 的「未來題型資料欄位建議」段，
// 讓題目逐步具備正式 Cambridge Pre A1 Starters parts 結構標記。
//
// 邊界：
//   - 4 個欄位皆 **optional**——既有資料不需立刻補，UI 會 fallback 到依 type 推導。
//   - 不代表官方題目，只代表「自製練習題的對齊目標」。
//   - Speaking metadata（"speaking" / SP1~SP4 / "spoken"）目前僅預留型別字面量，
//     **不在 P3 實作**——留給 P4 Speaking Examiner Agent。
// ============================================================================

/** 對齊正式 Cambridge Pre A1 Starters 三大段落。 */
export type StarterSection =
  | "listening"
  | "reading-writing"
  | "speaking"; // P4 預留，本輪不實作

/** 對齊正式 Cambridge Pre A1 Starters 各 Part（L1~L4 / RW1~RW5 / SP1~SP4）。 */
export type StarterPart =
  | "L1"
  | "L2"
  | "L3"
  | "L4"
  | "RW1"
  | "RW2"
  | "RW3"
  | "RW4"
  | "RW5"
  | "SP1" // 以下屬 P4，本輪不實作
  | "SP2"
  | "SP3"
  | "SP4";

/** 題目主要訓練的能力（對齊 STARTERS_PART_TEMPLATES 模板的 skillFocus 欄位建議）。 */
export type SkillFocus =
  | "listening"
  | "vocabulary"
  | "spelling"
  | "reading"
  | "writing"
  | "speaking";

/** 答題型態（對齊 STARTERS_PART_TEMPLATES 模板的 expectedAnswerType 欄位建議）。 */
export type ExpectedAnswerType =
  | "choice" // 選擇（從 options 選一個）
  | "text" // 自由文字輸入
  | "number" // 數字
  | "name" // 人名
  | "color" // 顏色名
  | "one-word" // 單一英文字（RW5 用）
  | "spoken"; // 口說（屬 P4 Speaking Examiner Agent）

/** 共用題目欄位。所有 P3 題型皆 extend 此 base。 */
export type BaseQuestion = {
  /** 題目唯一識別碼。 */
  id: string;
  /** 題型 discriminator。 */
  type: QuestionType;
  /** 題目來源標記。 */
  source: QuestionSource;
  /** 題幹文字；某些純圖題或純音題可省略。 */
  prompt?: string;
  /** 解析；給結算頁與錯題複習頁顯示。語氣須小一友善。 */
  explanation?: string;
  /** 題目圖片路徑（相對 `public/`）；缺檔由 fallback 處理。 */
  image?: string;
  /** 題目音檔路徑（相對 `public/`）；listening 題型必填。 */
  audio?: string;
  /** 難度。 */
  difficulty?: DifficultyLevel;
  /** 主題分類。可對應 vocabulary 的 category 或自訂題目主題。 */
  topic?: string;
  /** AI 生成題的 prompt 版本號，便於回溯出題品質。 */
  promptVersion?: string;
  /** source-first 題目的來源追溯；舊題可省略。 */
  sourceProvenance?: QuestionSourceProvenance;
  /** Starters 段落 metadata（P3-9-B；optional，缺值時 UI fallback 依 `type` 推導）。 */
  starterSection?: StarterSection;
  /** Starters Part metadata（P3-9-B；optional，對齊 `docs/STARTERS_PART_TEMPLATES.md`）。 */
  starterPart?: StarterPart;
  /** 題目主要訓練的能力清單（P3-9-B；optional）。 */
  skillFocus?: SkillFocus[];
  /** 答題型態 metadata（P3-9-B；optional，與 `answer` 欄位處理規則對齊）。 */
  expectedAnswerType?: ExpectedAnswerType;
};

/** 圖片選項（給 word-choice / listening-choice 圖片版用）。 */
export type ImageOption = {
  /** 對應的英文單字或值，用於比對 `answer`。 */
  value: string;
  /** 圖片路徑；缺檔由 fallback 處理。 */
  image: string;
};

/**
 * 通用文字 4 選 1：與既有 P1~P2 `MultipleChoiceQuestion` 相容，
 * 但多一個 `source` 欄位等 P3 必填項。
 */
export type ExamMultipleChoiceQuestion = BaseQuestion & {
  type: "multiple-choice";
  prompt: string;
  options: string[];
  answer: string;
};

/** 看圖選字：題目顯示圖片，4 個英文文字選項。 */
export type PictureChoiceQuestion = BaseQuestion & {
  type: "picture-choice";
  /** 題目圖片必填。 */
  image: string;
  options: string[];
  /** 必須是 `options` 之一。 */
  answer: string;
};

/** 看字選圖：題目顯示英文，4 個圖片選項。 */
export type WordChoiceQuestion = BaseQuestion & {
  type: "word-choice";
  /** 題目英文單字必填。 */
  prompt: string;
  options: ImageOption[];
  /** 必須是某個 `options[i].value`。 */
  answer: string;
};

/**
 * 聽力題：音檔必填，選項可為文字或圖片。
 *
 * 音檔三欄位的關係（P3-9-C 第一刀）：
 * - `audio`：legacy 必填欄位，指向音檔路徑。建議未來逐步以 `audioSrc` 取代。
 * - `audioSrc`：P3-9-C 新增 optional 欄位，**本專案自製音檔路徑**（例如
 *   `/audio/starters/l3/q-lc-001.mp3`）。UI 優先讀此欄位 render `<audio controls>`；
 *   音檔不存在 / 載入失敗時 fallback 到 `transcript` / `ttsScript` 文字練習。
 *   **嚴禁**指向官方音檔或外部 URL；只能是 `public/audio/` 下的本機自製路徑。
 * - `transcript`：字幕（給家長 / 老師看，不一定要顯示給孩子）。
 * - `ttsScript`：給 TTS 生成音檔的腳本（與 `transcript` 不一定相同，可含 SSML）。
 */
export type ListeningChoiceQuestion = BaseQuestion & {
  type: "listening-choice";
  /** Legacy 必填欄位；UI 優先讀 `audioSrc`，缺值才 fallback 到此欄位。 */
  audio: string;
  /**
   * P3-9-C 新增 optional 欄位：本專案自製音檔路徑（建議 `/audio/starters/<part>/<id>.mp3`）。
   * 嚴禁指向官方音檔或外部 URL。音檔載入失敗時 UI 自動 fallback 到 transcript / ttsScript 文字。
   */
  audioSrc?: string;
  /** 字幕（家長/老師看，不顯示給小朋友）。 */
  transcript?: string;
  /** 給 TTS 生成音檔的腳本（與 `transcript` 不一定相同，例如可加 SSML）。 */
  ttsScript?: string;
  /** 預設 `"text"`。 */
  optionType?: "text" | "image";
  options: string[] | ImageOption[];
  answer: string;
};

/** 填空題：有 `options` → 選項版；無 `options` → 自由填空（比對忽略大小寫與前後空白）。 */
export type FillBlankQuestion = BaseQuestion & {
  type: "fill-blank";
  /** 含 `___` 的句子。 */
  prompt: string;
  options?: string[];
  answer: string;
};

/** 連連看的單組配對。 */
export type MatchingPair = {
  left: string;
  right: string;
};

/** 連連看：左右兩列各 N 項，原始順序即為正確配對;UI 端打散讓使用者配對。 */
export type MatchingQuestion = BaseQuestion & {
  type: "matching";
  pairs: MatchingPair[];
};

/**
 * 看圖判斷 yes / no（對齊正式 RW1，P3-9-C 第三刀新增）。
 * 一張圖 + 一句描述句 + 二選一（yes / no）。比對時直接字串相等（"yes" / "no" 全小寫）。
 *
 * 與 `picture-choice` 的差異：
 *   - picture-choice 是「圖 + 4 個文字選項，4 選 1」（preview RW1 / RW2）。
 *   - true-false 是「圖 + 1 句描述句 + 2 選 1（yes / no）」（更貼近正式 RW1）。
 */
export type TrueFalseQuestion = BaseQuestion & {
  type: "true-false";
  /** 題目圖片必填。 */
  image: string;
  /** 描述句必填（例如 "It is a cat."）。 */
  prompt: string;
  /** 必須是 "yes" 或 "no"（全小寫；UI 顯示時會轉為 "Yes" / "No"）。 */
  answer: "yes" | "no";
};

/**
 * 看圖拼字輸入（對齊正式 RW3，P3-9-C 第三刀後續新增）。
 * 一張圖 + 提示文字 + 自由文字輸入；比對時忽略大小寫與前後空白（不做 fuzzy matching）。
 *
 * 與其他題型的差異：
 *   - 與 `word-choice`（看字選圖、4 圖片選項）相反：本題顯示**圖**、要求孩子**輸入英文單字**。
 *   - 與 `fill-blank`（自由填空版）形似，但 RW3 是「看圖拼字」、有圖片必填、prompt 為固定提示語。
 *     未來可延伸 RW3 多題庫；本題型獨立 case 以利 UI / 結果頁 / metadata 細分。
 */
export type SpellingQuestion = BaseQuestion & {
  type: "spelling";
  /** 題目圖片必填（看圖拼字）。 */
  image: string;
  /** 提示語（例如 "Look at the picture. Write the word."）。 */
  prompt: string;
  /** 正確英文單字；比對時 normalize（trim + toLowerCase）。 */
  answer: string;
  /**
   * 缺字提示（optional，P3-9-C 第三刀後續、2026-05-12 新增）。
   * 例如 `"a _ _ l e"` / `"c _ t"` / `"b _ _ k"`。
   * **只用於 UI 顯示提示、絕不參與 `answer` 比對**——`isCorrect` 不讀此欄位。
   * 字串內容自由（建議用 `_` 表示缺字、空格分隔字母提升小一可讀性）。
   */
  spellingHint?: string;
  /**
   * 字母重組提示（optional，P3-9-C 第三刀後續、2026-05-13 新增）。
   * 例如 `"p p a l e"`（apple 打散）/ `"t a c"`（cat 打散）/ `"g d o"`（dog 打散）/ `"o b k o"`（book 打散）。
   * **只用於 UI 顯示提示、絕不參與 `answer` 比對**——`isCorrect` 不讀此欄位、`normalize` 不變。
   * 字串內容自由（建議空格分隔每個字母提升小一可讀性）；第一版**只顯示打散字母**、不做拖曳 / 點選組字互動。
   * 可與 `spellingHint` 並存於同一題（提供「缺字 + 重組」兩種視覺輔助）。
   */
  letterScramble?: string;
};

/** P3 全題型 discriminated union。 */
export type ExamQuestion =
  | ExamMultipleChoiceQuestion
  | PictureChoiceQuestion
  | WordChoiceQuestion
  | ListeningChoiceQuestion
  | FillBlankQuestion
  | MatchingQuestion
  | TrueFalseQuestion
  | SpellingQuestion;

/** 一份考卷的子段落（例如 Listening / Reading & Writing）。 */
export type ExamSection = {
  id: string;
  title: string;
  description?: string;
  /** 該段落包含的題目 id 順序。 */
  questionIds: string[];
};

/** 一份考卷的來源組成統計（彙總各 `QuestionSource` 在這份卷的題數）。 */
export type SourceMix = Partial<Record<QuestionSource, number>>;

/**
 * 完整考卷模板。一份 ExamPaper 可被反覆開新 Session 練習。
 * 題目順序由 `sections[].questionIds` 決定；UI 開新 Session 時可選擇打散。
 */
export type ExamPaper = {
  examPaperId: string;
  title: string;
  description?: string;
  sections: ExamSection[];
  /** 該卷各來源題目數量統計，給篩選頁用。 */
  sourceMix?: SourceMix;
  /** ISO 8601；建立時間。 */
  createdAt?: string;
  /** ISO 8601；最後更新時間。 */
  updatedAt?: string;
};

/**
 * Session 內每題的作答內容。
 * - 文字 / 圖片選擇題：`string`（選中的 option 值）。
 * - 連連看：`string[]`（依左欄順序的右欄配對結果）。
 * - 填空：`string`（使用者輸入或選的字）。
 */
export type ExamAnswerMap = Record<string, string | string[]>;

/**
 * localStorage 中保存的單一 Session 狀態。
 * 一份 `examPaperId` 可重新測驗產生**新的 Session**，舊 Session 保留直到使用者刪除或被覆蓋。
 *
 * 對應 `docs/PRODUCT_SPEC.md`「測驗與考前練習方向 → 完整考卷 Session → 作答進度保存」。
 */
export type ExamSessionState = {
  /** 該次考試的唯一識別碼。 */
  examSessionId: string;
  /** 對應的考卷模板 id。 */
  examPaperId: string;
  /** 題目實際 render 順序（生成時可打散，恢復時必須一致）。 */
  questionOrder: string[];
  /** 每題作答內容。 */
  answers: ExamAnswerMap;
  /** 目前進度（做到第幾題，從 0 開始）。 */
  currentIndex: number;
  /** 是否已交卷。 */
  submitted: boolean;
  /** 交卷後分數（答對題數）；未交卷為 `null`。 */
  score: number | null;
  /** 答錯題目 id 清單（交卷後填入）。 */
  wrongQuestionIds: string[];
  /** ISO 8601；Session 建立時間。 */
  createdAt: string;
  /** ISO 8601；最後互動時間。 */
  updatedAt: string;
  /** localStorage migration 用，第一版 = 1。 */
  schemaVersion: number;
};
