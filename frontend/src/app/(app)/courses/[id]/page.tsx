'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ChatConversation } from '@/types/chat';
import type { Course, Lesson, Progress } from '@/types/course';
import type { ForumThread } from '@/types/forum';
import CourseLessonsList from '@/components/course/CourseLessonsList';
import CourseForumSection from '@/components/course/CourseForumSection';
import CourseChatSection from '@/components/course/CourseChatSection';

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Course>(endpoints.courses.detail(Number(id))),
      api.get<Lesson[]>(endpoints.courses.lessons(Number(id))),
      api.get<Progress[]>(endpoints.progress.me),
      api.get<ForumThread[]>(endpoints.forum.courseThreads(Number(id))),
      api.get<ChatConversation[]>(endpoints.chat.conversations),
    ]).then(([c, l, p, f, chats]) => {
      setCourse(c.data);
      setLessons(l.data);
      setProgress(p.data);
      setThreads(f.data);
      setConversation(chats.data.find((chat) => chat.course_id === Number(id)) ?? null);
    }).catch(() => toast.error('Erro ao carregar curso.')).finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  if (!course) return <p className="text-red-500">Curso não encontrado.</p>;

  const doneCount = lessons.filter((l) => progress.find((p) => p.lesson_id === l.id)?.status === 'done').length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <Link href="/courses" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{course.name}</h1>
        {course.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>}
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso geral</span>
          <span className="text-sm font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{doneCount} de {lessons.length} aulas concluídas</p>
      </div>

      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Aulas</h2>
        <CourseLessonsList lessons={lessons} progress={progress} />
      </div>

      <CourseForumSection courseId={Number(id)} initialThreads={threads} />
      <CourseChatSection courseId={Number(id)} courseName={course.name} initialConversation={conversation} />
    </div>
  );
}
