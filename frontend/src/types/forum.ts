export interface ForumPost {
  id: number;
  thread_id: number;
  author_id: number;
  author_name: string;
  body: string;
  created_at: string;
  updated_at: string;
}

export interface ForumThread {
  id: number;
  course_id: number;
  author_id: number;
  author_name: string;
  title: string;
  body: string;
  replies_count: number;
  created_at: string;
  updated_at: string;
  posts: ForumPost[];
}
