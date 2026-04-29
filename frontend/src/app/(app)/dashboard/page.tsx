'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, ChartBarIcon, MicrophoneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Enrollment, Progress, Session, Course } from '@/types/course';

export default function DashboardPage() {
  const { student } = useAuthStore();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    Promise.all([
      api.get<Enrollment[]>(endpoints.enrollments.byStudent(student.id)),
      api.get<Progress[]>(endpoints.progress.me),
      api.get<Session[]>(endpoints.sessions.me),
      api.get<Course[]>(endpoints.courses.list),
    ]).then(([e, p, s, c]) => {
      setEnrollments(e.data);
      setProgress(p.data);
      setSessions(s.data);
      setCourses(c.data);
    }).finally(() => setLoading(false));
  }, [student]);

  const doneCount = progress.filter((p) => p.status === 'done').length;
  const enrolledCourses = courses.filter((c) => enrollments.some((e) => e.course_id === c.id));

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Olá, {student?.name.split(' ')[0]}!
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">Aqui está um resumo do seu aprendizado.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Cursos Matriculados', value: enrollments.length, icon: BookOpenIcon, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
          { label: 'Aulas Concluídas', value: doneCount, icon: CheckCircleIcon, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
          { label: 'Sessões de Voz', value: sessions.length, icon: MicrophoneIcon, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
          { label: 'Em Progresso', value: progress.filter((p) => p.status === 'in_progress').length, icon: ChartBarIcon, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center space-x-4">
              <div className={`w-12 h-12 ${stat.bg} rounded-lg flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Enrolled courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Meus Cursos</h2>
          <Link href="/courses" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
            Ver todos
          </Link>
        </div>

        {enrolledCourses.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
            <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">Você ainda não está matriculado em nenhum curso.</p>
            <Link href="/courses" className="mt-3 inline-block text-sm font-medium text-indigo-600 hover:underline">
              Explorar cursos
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {enrolledCourses.map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-md transition-shadow"
              >
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
                  <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{course.description}</p>
                )}
                <span className="mt-3 inline-block text-xs font-medium text-indigo-600 dark:text-indigo-400">
                  Continuar →
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Últimas Sessões de Voz</h2>
            <Link href="/sessions" className="text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
              Ver todas
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {sessions.slice(0, 3).map((s) => (
              <div key={s.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center space-x-3">
                  <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MicrophoneIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Aula #{s.lesson_id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(s.started_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.ended_at ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                  {s.ended_at ? 'Concluída' : 'Em andamento'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
