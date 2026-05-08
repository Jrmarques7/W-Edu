export type AssignmentSubmissionStatus = 'submitted' | 'reviewed' | 'returned';

export interface AssignmentSubmission {
  id: number;
  lesson_id: number;
  course_id: number;
  student_id: number;
  text: string | null;
  file_name: string | null;
  file_size: number | null;
  status: AssignmentSubmissionStatus;
  score: number | null;
  feedback: string | null;
  submitted_at: string;
  reviewed_at: string | null;
  reviewed_by_id: number | null;
}
