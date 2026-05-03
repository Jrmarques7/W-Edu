'use client';

import type {
  AttendanceReportRow,
  ClassPerformanceReportRow,
  CompletionReportRow,
  EngagementReportRow,
  RoiReportRow,
} from '@/types/analytics';

const money = (v: number) => `R$ ${(v / 100).toFixed(2)}`;
const pct = (v: number) => `${v}%`;

const thCls = 'py-2 pr-4 font-medium';
const tdCls = 'py-3 pr-4';

export function CompletionTable({ rows }: { rows: CompletionReportRow[] }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">Conclusão por curso e turma</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr><th className={thCls}>Escopo</th><th className={thCls}>Curso</th><th className={thCls}>Matrículas</th><th className={thCls}>Concluídos</th><th className={thCls}>Taxa</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {rows.map((r) => (
              <tr key={`${r.scope_type}-${r.scope_id}`}>
                <td className={tdCls}>{r.scope_type === 'course' ? 'Curso' : r.class_name}</td>
                <td className={tdCls}>{r.course_name}</td>
                <td className={tdCls}>{r.enrolled}</td>
                <td className={tdCls}>{r.completed}</td>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{pct(r.completion_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function AttendanceTable({ rows }: { rows: AttendanceReportRow[] }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">Frequência presencial</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr><th className={thCls}>Turma</th><th className={thCls}>Curso</th><th className={thCls}>Aulas</th><th className={thCls}>Presenças</th><th className={thCls}>Faltas</th><th className={thCls}>Taxa</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {rows.map((r) => (
              <tr key={r.class_offering_id}>
                <td className={tdCls}>{r.class_name}</td><td className={tdCls}>{r.course_name}</td>
                <td className={tdCls}>{r.closed_meetings}/{r.meetings}</td>
                <td className={tdCls}>{r.present + r.late}</td><td className={tdCls}>{r.absent}</td>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{pct(r.attendance_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function EngagementTable({ rows }: { rows: EngagementReportRow[] }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">Engajamento online</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr><th className={thCls}>Curso</th><th className={thCls}>Progresso</th><th className={thCls}>Engajamento</th><th className={thCls}>Tentativas</th><th className={thCls}>Aprovação</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {rows.map((r) => (
              <tr key={r.course_id}>
                <td className={tdCls}>{r.course_name}</td>
                <td className={tdCls}>{r.completed_progress_records}/{r.progress_records}</td>
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{pct(r.engagement_rate)}</td>
                <td className={tdCls}>{r.quiz_attempts}</td>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{pct(r.quiz_pass_rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function PerformanceTable({ rows }: { rows: ClassPerformanceReportRow[] }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">Desempenho por turma</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr><th className={thCls}>Turma</th><th className={thCls}>Alunos</th><th className={thCls}>Conclusão</th><th className={thCls}>Frequência</th><th className={thCls}>Prova</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {rows.map((r) => (
              <tr key={r.class_offering_id}>
                <td className={tdCls}><p className="font-medium text-gray-900 dark:text-white">{r.class_name}</p><p className="text-xs text-gray-500 dark:text-gray-400">{r.course_name}</p></td>
                <td className={tdCls}>{r.enrolled}</td><td className={tdCls}>{pct(r.completion_rate)}</td>
                <td className={tdCls}>{pct(r.attendance_rate)}</td>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{pct(r.average_best_quiz_score)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function RoiTable({ rows }: { rows: RoiReportRow[] }) {
  return (
    <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <h2 className="font-semibold text-gray-900 dark:text-white">ROI corporativo</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="text-left text-xs uppercase text-gray-500 dark:text-gray-400">
            <tr><th className={thCls}>Empresa</th><th className={thCls}>Alunos</th><th className={thCls}>Receita paga</th><th className={thCls}>Pendente</th><th className={thCls}>Certificados</th><th className={thCls}>Conclusão</th><th className={thCls}>Receita/cert.</th></tr>
          </thead>
          <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-gray-700 dark:text-gray-300">
            {rows.map((r) => (
              <tr key={r.organization_id ?? 'none'}>
                <td className="py-3 pr-4 font-medium text-gray-900 dark:text-white">{r.organization_name}</td>
                <td className={tdCls}>{r.students}</td><td className={tdCls}>{money(r.paid_charges_cents)}</td>
                <td className={tdCls}>{money(r.pending_charges_cents)}</td><td className={tdCls}>{r.certificates_issued}</td>
                <td className={tdCls}>{pct(r.completion_rate)}</td>
                <td className="py-3 font-medium text-gray-900 dark:text-white">{money(r.revenue_per_certificate_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
