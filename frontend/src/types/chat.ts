export interface ChatMessage {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_name: string;
  body: string;
  created_at: string;
}

export interface ChatConversation {
  id: number;
  course_id: number;
  course_name: string;
  student_id: number;
  student_name: string;
  instructor_id: number | null;
  instructor_name: string | null;
  subject: string | null;
  messages_count: number;
  created_at: string;
  updated_at: string;
  messages: ChatMessage[];
}
