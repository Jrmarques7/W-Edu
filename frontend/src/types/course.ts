export interface Course {
  id: number;
  name: string;
  description: string | null;
  agent_id: string | null;
  created_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  title: string;
  content: string | null;
  order: number;
  type: 'text' | 'video' | 'voice';
  created_at: string;
}

export interface Enrollment {
  id: number;
  student_id: number;
  course_id: number;
  enrolled_at: string;
}

export type ProgressStatus = 'pending' | 'in_progress' | 'done';

export interface Progress {
  id: number;
  student_id: number;
  lesson_id: number;
  status: ProgressStatus;
  updated_at: string;
}

export interface Session {
  id: number;
  student_id: number;
  lesson_id: number;
  bevox_session_id: string | null;
  transcript: string | null;
  started_at: string;
  ended_at: string | null;
}
