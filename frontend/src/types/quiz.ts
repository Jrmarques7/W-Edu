export interface QuizQuestion {
  id: number;
  quiz_id: number;
  question: string;
  options: string[];
  order: number;
}

export interface Quiz {
  id: number;
  lesson_id: number;
  passing_score: number;
  max_attempts: number;
  created_at: string;
  questions: QuizQuestion[];
}

export interface QuizAttempt {
  id: number;
  quiz_id: number;
  student_id: number;
  score: number;
  passed: boolean;
  answers: Record<string, number>;
  attempted_at: string;
}
