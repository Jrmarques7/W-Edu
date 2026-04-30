'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpenIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course, Lesson, Progress } from '@/types/course';

const lessonIcon = (type: Lesson['type']) => {
  if (type === 'video') return VideoCameraIcon;
  if (type === 'voice') return MicrophoneIcon;
  if (type === 'live' || type === 'in_person') return CalendarDaysIcon;
  if (type === 'assessment') return ClipboardDocumentCheckIcon;
  return DocumentTextIcon;
};

const statusBadge = (status?: Progress['status']) => {
  if (status === 'done') return { label: 'Concluída', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  if (status === 'in_progress') return { label: 'Em andamento', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  return { label: 'Pendente', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Course>(endpoints.courses.detail(Number(id))),
      api.get<Lesson[]>(endpoints.courses.lessons(Number(id))),
      api.get<Progress[]>(endpoints.progress.me),
    ]).then(([c, l, p]) => {
      setCourse(c.data);
      setLessons(l.data);
      setProgress(p.data);
    }).finally(() => setLoading(false));
  }, [id]);

  const getProgress = (lessonId: number) => progress.find((p) => p.lesson_id === lessonId);
  const doneCount = lessons.filter((l) => getProgress(l.id)?.status === 'done').length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  if (!course) return <p className="text-red-500">Curso não encontrado.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link href="/courses" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{course.name}</h1>
        {course.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>}
      </div>

      {/* Progress bar */}
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

      {/* Lesson list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Aulas</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma aula cadastrada.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {lessons.map((lesson) => {
              const prog = getProgress(lesson.id);
              const { label, cls } = statusBadge(prog?.status);
              const Icon = lessonIcon(lesson.type);
              const isDone = prog?.status === 'done';

              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                      {isDone ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <Icon className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lesson.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{lesson.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{label}</span>
                    <PlayCircleIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
