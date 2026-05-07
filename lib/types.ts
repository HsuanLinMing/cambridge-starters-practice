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
