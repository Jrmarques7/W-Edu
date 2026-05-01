'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { CourseProgress, Progress } from '@/types/course';

const statusConfig = {
  done: { label: 'Concluída', icon: CheckCircleIcon, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  in_progress: { label: 'Em andamento', icon: ClockIcon, cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Pendente', icon: ExclamationCircleIcon, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [courseProgress, setCourseProgress] = useState<CourseProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Progress[]>(endpoints.progress.me),
      api.get<CourseProgress[]>(endpoints.progress.courses),
    ])
      .then(([progressRes, courseProgressRes]) => {
        setProgress(progressRes.data);
        setCourseProgress(courseProgressRes.data);
      })
      .finally(() => setLoading(false));
  }, []);

  const counts = {
    done: progress.filter((p) => p.status === 'done').length,
    in_progress: progress.filter((p) => p.status === 'in_progress').length,
    pending: progress.filter((p) => p.status === 'pending').length,
  };

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Progresso</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Acompanhe avanço por curso, aulas concluídas e atividades recentes.</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {(Object.entries(counts) as [Progress['status'], number][]).map(([status, count]) => {
          const { label, icon: Icon, cls } = statusConfig[status];
          return (
            <div key={status} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 text-center">
              <div className={`w-12 h-12 ${cls} rounded-full flex items-center justify-center mx-auto mb-2`}>
                <Icon className="w-6 h-6" />
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{count}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{label}</p>
            </div>
          );
        })}
      </div>

      {courseProgress.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Você ainda não está matriculado em nenhum curso.</p>
          <Link href="/courses" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
            Explorar cursos
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {courseProgress.map((course) => {
            const lastActivity = course.last_activity_at
              ? new Date(course.last_activity_at).toLocaleDateString('pt-BR')
              : 'Sem atividade';
            return (
              <Link
                key={course.course_id}
                href={`/courses/${course.course_id}`}
                className="block bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="min-w-0">
                    <p className="text-base font-semibold text-gray-900 dark:text-white">{course.course_name}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Última atividade: {lastActivity}</p>
                  </div>
                  <div className="grid grid-cols-3 gap-3 text-center sm:min-w-80">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.done_lessons}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Concluídas</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.in_progress_lessons}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Em andamento</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{course.pending_lessons}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Pendentes</p>
                    </div>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-2">
                    <span>{course.done_lessons}/{course.total_lessons} aulas</span>
                    <span className="font-medium text-gray-900 dark:text-white">{course.progress_percent}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                    <div className="h-full bg-indigo-600 rounded-full" style={{ width: `${course.progress_percent}%` }} />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {progress.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          <div className="px-5 py-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Atividades recentes</h2>
          </div>
          {progress.slice(0, 8).map((p) => {
            const { label, cls } = statusConfig[p.status];
            return (
              <div key={p.id} className="flex items-center justify-between px-5 py-4">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Aula #{p.lesson_id}</p>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{label}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(p.updated_at).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </div>
  );
}
