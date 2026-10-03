// src/types/question.ts
// The single schema every question in questions.json conforms to.
// The generic renderer (Phase 2) switches on `type` to pick one of the
// four components in src/components/questions/.

export type QuestionType = "tap" | "multiSelect" | "text" | "concept";

export interface ShowIf {
  questionId: string;
  valueIn?: string[];     // render this question only if that answer IS one of these
  valueNotIn?: string[];  // render this question only if that answer is NOT one of these
}

interface BaseQuestion {
  id: string;
  section: string;        // matches a Section.id below — drives the progress bar
  type: QuestionType;
  required: boolean;
  prompt: string;
  showIf?: ShowIf;        // omit for questions that always render
}

export interface TapQuestion extends BaseQuestion {
  type: "tap";
  options: string[];
}

export interface MultiSelectQuestion extends BaseQuestion {
  type: "multiSelect";
  options: string[];
  minPicks: number;
  maxPicks: number;
}

export interface TextQuestion extends BaseQuestion {
  type: "text";
  mic: boolean;
  placeholder?: string;
  promptChips?: string[];   // optional tap-to-insert helper chips, as in the mockup
  allowNone?: boolean;      // Q40 only — shows a "None" button that sets the answer to noneLabel
  noneLabel?: string;
}

export interface ConceptQuestion extends BaseQuestion {
  type: "concept";
  body: string[];           // bullet list rendered on the inverted concept screen
}

export type Question =
  | TapQuestion
  | MultiSelectQuestion
  | TextQuestion
  | ConceptQuestion;

export interface Section {
  id: string;
  label: string;
}

export interface SurveySchema {
  sections: Section[];
  questions: Question[];
}
