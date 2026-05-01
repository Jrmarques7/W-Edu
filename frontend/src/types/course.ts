export type CourseModality = 'online' | 'in_person' | 'hybrid';
export type LessonType = 'text' | 'video' | 'pdf' | 'live' | 'in_person' | 'voice' | 'assessment';

export interface Course {
  id: number;
  name: string;
  description: string | null;
  modality: CourseModality;
  agent_id: string | null;
  created_at: string;
}

export interface CourseModule {
  id: number;
  course_id: number;
  title: string;
  description: string | null;
  order: number;
  created_at: string;
}

export interface Lesson {
  id: number;
  course_id: number;
  module_id: number | null;
  title: string;
  content: string | null;
  order: number;
  type: LessonType;
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
  content_consumed_at: string | null;
  updated_at: string;
}

export interface CourseProgress {
  course_id: number;
  course_name: string;
  total_lessons: number;
  done_lessons: number;
  in_progress_lessons: number;
  pending_lessons: number;
  progress_percent: number;
  last_activity_at: string | null;
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

export interface SessionHistory {
  id: number;
  student_id: number;
  lesson_id: number;
  lesson_title: string;
  course_id: number;
  course_name: string;
  bevox_session_id: string | null;
  transcript: string | null;
  has_transcript: boolean;
  duration_minutes: number | null;
  started_at: string;
  ended_at: string | null;
}

export interface VoiceSessionStart {
  session: Session;
  agent_id: string;
  caller_id: string;
  context: {
    course_id: number;
    course_name: string;
    lesson_id: number;
    lesson_title: string;
    lesson_content: string | null;
    module_id: number | null;
    module_title: string | null;
  };
  bevox_ws_url: string | null;
  language: string;
  output_format: string;
}
