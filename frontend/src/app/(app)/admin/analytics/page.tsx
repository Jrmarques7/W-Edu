'use client';

import { useEffect, useState } from 'react';
import { ArrowPathIcon, BanknotesIcon, BookOpenIcon, ChartBarIcon, DocumentTextIcon, ShieldCheckIcon, UsersIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type {
  AnalyticsOverview,
  AttendanceReportRow,
  ClassPerformanceReportRow,
  CompletionReportRow,
  CourseAnalytics,
  EngagementReportRow,
  RoiReportRow,
} from '@/types/analytics';

const money = (value: number) => `R$ ${(value / 100).toFixed(2)}`;
const percent = (value: number) => `${value}%`;

export default function AdminAnalyticsPage() {
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [courses, setCourses] = useState<CourseAnalytics[]>([]);
  const [completionRows, setCompletionRows] = useState<CompletionReportRow[]>([]);
  const [attendanceRows, setAttendanceRows] = useState<AttendanceReportRow[]>([]);
  const [engagementRows, setEngagementRows] = useState<EngagementReportRow[]>([]);
  const [performanceRows, setPerformanceRows] = useState<ClassPerformanceReportRow[]>([]);
  const [roiRows, setRoiRows] = useState<RoiReportRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      setLoading(true);
      const [overviewRes, courseRes, completionRes, attendanceRes, engagementRes, performanceRes, roiRes] = await Promise.all([
        api.get<AnalyticsOverview>(endpoints.analytics.overview),
        api.get<CourseAnalytics[]>(endpoints.analytics.courses),
        api.get<CompletionReportRow[]>(endpoints.analytics.reports.completion),
        api.get<AttendanceReportRow[]>(endpoints.analytics.reports.attendance),
        api.get<EngagementReportRow[]>(endpoints.analytics.reports.engagement),
        api.get<ClassPerformanceReportRow[]>(endpoints.analytics.reports.performance),
        api.get<RoiReportRow[]>(endpoints.analytics.reports.roi),
      ]);
      setOverview(overviewRes.data);
      setCourses(courseRes.data);
      setCompletionRows(completionRes.data);
      setAttendanceRows(attendanceRes.data);
      setEngagementRows(engagementRes.data);
      setPerformanceRows(performanceRes.data);
      setRoiRows(roiRes.data);
    } catch {
      toast.error('Erro ao carregar relatórios.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  if (loading || !overview) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const cards = [
    { label: 'Alunos', value: overview.total_students, icon: UsersIcon },
    { label: 'Instrutores', value: overview.total_instructors, icon: BookOpenIcon },
    { label: 'Cursos', value: overview.total_courses, icon: ChartBarIcon },
    { label: 'Documentos', value: overview.document_count, icon: DocumentTextIcon },
    { label: 'Certificados', value: overview.certificates_issued, icon: ShieldCheckIcon },
    { label: 'Receita paga', value: money(overview.paid_charges_cents), icon: BanknotesIcon },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Relatórios</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Visão executiva de operação, conclusão, presença e receita.</p>
        </div>
        <button onClick={load} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
          <ArrowPathIcon className="w-4 h-4" />
          <span>Atualizar</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">{card.label}</p>
                  <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-indigo-600" />
                </div>
              </div>
            </div>
          );
        })}
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
            {courses.map((course) => (
              <div key={course.course_id} className="py-3 flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{course.course_name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{course.modality}</p>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-gray-600 dark:text-gray-300">
                  <span>{course.enrollments} matrículas</span>
                  <span>{course.attendance_rate}% presença</span>
                  <span>{course.completion_rate}% conclusão</span>
                  <span>{course.average_best_quiz_score}% prova</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Conclusão por curso e turma</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Escopo</th>
                  <th className="py-2 pr-4 font-medium">Curso</th>
                  <th className="py-2 pr-4 font-medium">Matrículas</th>
                  <th className="py-2 pr-4 font-medium">Concluídos</th>
                  <th className="py-2 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {completionRows.map((row) => (
                  <tr key={`${row.scope_type}-${row.scope_id}`}>
                    <td className="py-3 pr-4 whitespace-nowrap">{row.scope_type === 'course' ? 'Curso' : row.class_name}</td>
                    <td className="py-3 pr-4">{row.course_name}</td>
                    <td className="py-3 pr-4">{row.enrolled}</td>
                    <td className="py-3 pr-4">{row.completed}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{percent(row.completion_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Frequência presencial</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Turma</th>
                  <th className="py-2 pr-4 font-medium">Curso</th>
                  <th className="py-2 pr-4 font-medium">Aulas</th>
                  <th className="py-2 pr-4 font-medium">Presenças</th>
                  <th className="py-2 pr-4 font-medium">Faltas</th>
                  <th className="py-2 font-medium">Taxa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {attendanceRows.map((row) => (
                  <tr key={row.class_offering_id}>
                    <td className="py-3 pr-4">{row.class_name}</td>
                    <td className="py-3 pr-4">{row.course_name}</td>
                    <td className="py-3 pr-4">{row.closed_meetings}/{row.meetings}</td>
                    <td className="py-3 pr-4">{row.present + row.late}</td>
                    <td className="py-3 pr-4">{row.absent}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{percent(row.attendance_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Engajamento online</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Curso</th>
                  <th className="py-2 pr-4 font-medium">Progresso</th>
                  <th className="py-2 pr-4 font-medium">Engajamento</th>
                  <th className="py-2 pr-4 font-medium">Tentativas</th>
                  <th className="py-2 font-medium">Aprovação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {engagementRows.map((row) => (
                  <tr key={row.course_id}>
                    <td className="py-3 pr-4">{row.course_name}</td>
                    <td className="py-3 pr-4">{row.completed_progress_records}/{row.progress_records}</td>
                    <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{percent(row.engagement_rate)}</td>
                    <td className="py-3 pr-4">{row.quiz_attempts}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{percent(row.quiz_pass_rate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white">Desempenho por turma</h2>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
                <tr>
                  <th className="py-2 pr-4 font-medium">Turma</th>
                  <th className="py-2 pr-4 font-medium">Alunos</th>
                  <th className="py-2 pr-4 font-medium">Conclusão</th>
                  <th className="py-2 pr-4 font-medium">Frequência</th>
                  <th className="py-2 font-medium">Prova</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
                {performanceRows.map((row) => (
                  <tr key={row.class_offering_id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-gray-900 dark:text-white">{row.class_name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{row.course_name}</p>
                    </td>
                    <td className="py-3 pr-4">{row.enrolled}</td>
                    <td className="py-3 pr-4">{percent(row.completion_rate)}</td>
                    <td className="py-3 pr-4">{percent(row.attendance_rate)}</td>
                    <td className="py-3 font-medium text-gray-900 dark:text-white">{percent(row.average_best_quiz_score)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <h2 className="font-semibold text-gray-900 dark:text-white">ROI corporativo</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
              <tr>
                <th className="py-2 pr-4 font-medium">Empresa</th>
                <th className="py-2 pr-4 font-medium">Alunos</th>
                <th className="py-2 pr-4 font-medium">Receita paga</th>
                <th className="py-2 pr-4 font-medium">Pendente</th>
                <th className="py-2 pr-4 font-medium">Certificados</th>
                <th className="py-2 pr-4 font-medium">Conclusão</th>
                <th className="py-2 font-medium">Receita/certificado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
              {roiRows.map((row) => (
                <tr key={row.organization_id ?? 'none'}>
                  <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{row.organization_name}</td>
                  <td className="py-3 pr-4">{row.students}</td>
                  <td className="py-3 pr-4">{money(row.paid_charges_cents)}</td>
                  <td className="py-3 pr-4">{money(row.pending_charges_cents)}</td>
                  <td className="py-3 pr-4">{row.certificates_issued}</td>
                  <td className="py-3 pr-4">{percent(row.completion_rate)}</td>
                  <td className="py-3 font-medium text-gray-900 dark:text-white">{money(row.revenue_per_certificate_cents)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
