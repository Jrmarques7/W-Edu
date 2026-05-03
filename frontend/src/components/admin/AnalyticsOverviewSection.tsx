'use client';

import { BanknotesIcon, BookOpenIcon, ChartBarIcon, DocumentTextIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import type { AnalyticsOverview, CourseAnalytics } from '@/types/analytics';

const money = (v: number) => `R$ ${(v / 100).toFixed(2)}`;

export default function AnalyticsOverviewSection({ overview, courses }: { overview: AnalyticsOverview; courses: CourseAnalytics[] }) {
  const cards = [
    { label: 'Alunos', value: overview.total_students, icon: UsersIcon },
    { label: 'Instrutores', value: overview.total_instructors, icon: BookOpenIcon },
    { label: 'Cursos', value: overview.total_courses, icon: ChartBarIcon },
    { label: 'Documentos', value: overview.document_count, icon: DocumentTextIcon },
    { label: 'Certificados', value: overview.certificates_issued, icon: ShieldCheckIcon },
    { label: 'Receita paga', value: money(overview.paid_charges_cents), icon: BanknotesIcon },
  ];

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                <Icon className="w-5 h-5 text-indigo-600" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Indicadores gerais</h2>
          <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
            <p>Frequência: {overview.attendance_rate}%</p>
            <p>Conclusão: {overview.completion_rate}%</p>
            <p>Engajamento: {overview.engagement_rate}%</p>
            <p>Turmas ativas: {overview.total_classes}</p>
            <p>Encontros encerrados: {overview.closed_meetings}</p>
            <p>Assinaturas ativas: {overview.active_subscriptions}</p>
            <p>Receita pendente: {money(overview.pending_charges_cents)}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3 xl:col-span-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">Cursos</h2>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {courses.map((c) => (
              <div key={c.course_id} className="py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{c.course_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{c.modality}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span>{c.enrollments} matrículas</span>
                  <span>{c.attendance_rate}% presença</span>
                  <span>{c.completion_rate}% conclusão</span>
                  <span>{c.average_best_quiz_score}% prova</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
