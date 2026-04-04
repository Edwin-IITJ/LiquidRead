export type AppState = 'intro' | 'demographics' | 'questions' | 'scoring' | 'card' | 'reflection' | 'feedback' | 'thankyou';

export type CardType = 'A' | 'B' | 'C';

export type OptionId = 'A' | 'B' | 'C' | 'D';

export type CalibrationResponse = 'too_basic' | 'just_right' | 'too_advanced';

export interface Option {
  id: OptionId;
  label: string;
  points: number;
}

export interface Question {
  id: string;
  text: string;
  type: 'single' | 'text';
  layout?: 'visual-cards'; // for Q5 side-by-side layout
  options?: Option[];
}

export interface Answer {
  optionId: string;
  label: string;
  points: number;
}

export interface QuizState {
  appState: AppState;
  progressIndex: number; // 0-based, 0–7
  answers: Record<string, Answer>; // questionId → { optionId, points }
  field: string; // Q8 free text
  fieldGroup: string;
  researchExperience: string;
  readingFrequency: string;
  rawScore: number;
  normalisedScore: number;
  cardShown: CardType;
  calibrationResponse: CalibrationResponse | null;
  suitability: number;
  openFeedback: string;
  priorInterviewName: string;
  paperTitle: string;
  generatedCardText: string;
}

export interface SheetPayload {
  timestamp: string;
  fieldGroup: string;
  researchExperience: string;
  readingFrequency: string;
  q1: string;
  q2: string;
  q3: string;
  q4: string;
  q5: string;
  q6: string;
  q7: string;
  q9: string;
  rawScore: number;
  normalisedScore: number;
  cardShown: CardType;
  calibrationResponse: string;
  field: string;
  suitability: number;
  openFeedback: string;
  priorInterviewName: string;
  paperTitle: string;
  generatedCardText: string;
}
