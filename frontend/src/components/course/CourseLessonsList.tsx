'use client';

import Link from 'next/link';
import { CalendarDaysIcon, CheckCircleIcon, ClipboardDocumentCheckIcon, DocumentTextIcon, MicrophoneIcon, PlayCircleIcon, VideoCameraIcon } from '@heroicons/react/24/outline';
import type { Lesson, Progress } from '@/types/course';

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

export default function CourseLessonsList({ lessons, progress }: { lessons: Lesson[]; progress: Progress[] }) {
  const getProgress = (lessonId: number) => progress.find((p) => p.lesson_id === lessonId);

  if (lessons.length === 0) return <p className="text-gray-500 dark:text-gray-400">Nenhuma aula cadastrada.</p>;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
      {lessons.map((lesson) => {
        const prog = getProgress(lesson.id);
        const { label, cls } = statusBadge(prog?.status);
        const Icon = lessonIcon(lesson.type);
        const isDone = prog?.status === 'done';
        return (
          <Link key={lesson.id} href={`/lessons/${lesson.id}`} className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                {isDone ? <CheckCircleIcon className="w-5 h-5 text-green-600" /> : <Icon className="w-5 h-5 text-indigo-600" />}
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
  );
}
