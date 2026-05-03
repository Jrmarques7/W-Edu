'use client';

import 'chart.js/auto';

import { Bar, Doughnut } from 'react-chartjs-2';
import type { AnalyticsOverview, CourseAnalytics } from '@/types/analytics';

const money = (v: number) => `R$ ${(v / 100).toFixed(2)}`;

export default function AnalyticsChartsSection({ overview, courses }: { overview: AnalyticsOverview; courses: CourseAnalytics[] }) {
  const topCourses = [...courses].sort((a, b) => b.enrollments - a.enrollments).slice(0, 6);
  const modalityCounts = courses.reduce<Record<string, number>>((acc, course) => {
    acc[course.modality] = (acc[course.modality] ?? 0) + 1;
    return acc;
  }, {});
  const modalityLabels: Record<string, string> = {
    online: 'Online',
    in_person: 'Presencial',
    hybrid: 'Híbrido',
  };

  const kpiData = {
    labels: ['Frequência', 'Conclusão', 'Engajamento'],
    datasets: [
      {
        label: 'Percentual',
        data: [overview.attendance_rate, overview.completion_rate, overview.engagement_rate],
        backgroundColor: ['#2563eb', '#10b981', '#f59e0b'],
        borderRadius: 8,
      },
    ],
  };

  const revenueData = {
    labels: ['Receita paga', 'Receita pendente'],
    datasets: [
      {
        data: [overview.paid_charges_cents, overview.pending_charges_cents],
        backgroundColor: ['#10b981', '#f97316'],
        borderWidth: 0,
      },
    ],
  };

  const modalityData = {
    labels: Object.entries(modalityCounts).map(([key]) => modalityLabels[key] ?? key),
    datasets: [
      {
        data: Object.values(modalityCounts),
        backgroundColor: ['#2563eb', '#14b8a6', '#8b5cf6'],
        borderWidth: 0,
      },
    ],
  };

  const enrollmentsData = {
    labels: topCourses.map((course) => course.course_name),
    datasets: [
      {
        label: 'Matrículas',
        data: topCourses.map((course) => course.enrollments),
        backgroundColor: '#2563eb',
        borderRadius: 8,
      },
    ],
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: 'rgba(148, 163, 184, 0.2)' },
        ticks: { color: '#64748b' },
      },
      x: {
        grid: { display: false },
        ticks: { color: '#64748b' },
      },
    },
  } as const;

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { usePointStyle: true, boxWidth: 8 },
      },
    },
  } as const;

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Indicadores principais</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Percentuais operacionais do período atual.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            % consolidado
          </span>
        </div>
        <div className="mt-4 h-72">
          <Bar data={kpiData} options={barOptions} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Receita</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Distribuição entre pago e pendente.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            {money(overview.paid_charges_cents + overview.pending_charges_cents)}
          </span>
        </div>
        <div className="mt-4 h-72">
          <Doughnut data={revenueData} options={doughnutOptions} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Matrículas por curso</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cursos com maior volume de alunos.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Top 6
          </span>
        </div>
        <div className="mt-4 h-72">
          <Bar data={enrollmentsData} options={barOptions} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">Modalidades</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Distribuição do catálogo por formato de entrega.</p>
          </div>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
            Catálogo
          </span>
        </div>
        <div className="mt-4 h-72">
          <Doughnut data={modalityData} options={doughnutOptions} />
        </div>
      </section>
    </div>
  );
}
