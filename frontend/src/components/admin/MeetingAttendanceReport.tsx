'use client';

import { useEffect, useState } from 'react';
import type { AttendanceStatus, MeetingAttendanceReportRow } from '@/types/schedule';

const statusLabels: Record<MeetingAttendanceReportRow['status'], string> = {
  present: 'Presente',
  late: 'Atrasado',
  absent: 'Ausente',
};

const statusClasses: Record<MeetingAttendanceReportRow['status'], string> = {
  present: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300',
  late: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300',
  absent: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-300',
};

const actions: Array<{ status: AttendanceStatus; label: string }> = [
  { status: 'present', label: 'Presente' },
  { status: 'late', label: 'Atraso' },
  { status: 'absent', label: 'Falta' },
];

export default function MeetingAttendanceReport({ rows, onMarkAttendance, onSavePractical }: {
  rows: MeetingAttendanceReportRow[];
  onMarkAttendance: (studentId: number, status: AttendanceStatus) => void;
  onSavePractical: (studentId: number, score: number, feedback: string | null) => void;
}) {
  const [drafts, setDrafts] = useState<Record<number, { score: string; feedback: string }>>(() =>
    Object.fromEntries(rows.map((row) => [
      row.student_id,
      { score: row.practical_score === null ? '' : String(row.practical_score), feedback: row.practical_feedback ?? '' },
    ]))
  );

  useEffect(() => {
    setDrafts(Object.fromEntries(rows.map((row) => [
      row.student_id,
      { score: row.practical_score === null ? '' : String(row.practical_score), feedback: row.practical_feedback ?? '' },
    ])));
  }, [rows]);

  const draftFor = (row: MeetingAttendanceReportRow) =>
    drafts[row.student_id] ?? { score: row.practical_score === null ? '' : String(row.practical_score), feedback: row.practical_feedback ?? '' };

  const updateDraft = (studentId: number, patch: Partial<{ score: string; feedback: string }>) => {
    setDrafts((current) => ({ ...current, [studentId]: { ...draftFor(rows.find((row) => row.student_id === studentId)!), ...patch } }));
  };

  if (rows.length === 0) {
    return <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Nenhum aluno inscrito nesta turma.</p>;
  }

  return (
    <div className="mt-3 overflow-hidden rounded-lg border border-gray-100 dark:border-gray-700">
      <div className="max-h-72 overflow-auto">
        <table className="min-w-full divide-y divide-gray-100 text-left text-xs dark:divide-gray-700">
          <thead className="bg-gray-50 text-gray-500 dark:bg-gray-900 dark:text-gray-400">
            <tr>
              <th className="px-3 py-2 font-medium">Aluno</th>
              <th className="px-3 py-2 font-medium">Status</th>
              <th className="px-3 py-2 font-medium">Registro</th>
              <th className="px-3 py-2 font-medium">Método</th>
              <th className="px-3 py-2 font-medium">Prática</th>
              <th className="px-3 py-2 font-medium">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white dark:divide-gray-700 dark:bg-gray-800">
            {rows.map((row) => (
              <tr key={row.student_id}>
                <td className="px-3 py-2">
                  <p className="font-medium text-gray-900 dark:text-white">{row.student_name}</p>
                  <p className="text-gray-500 dark:text-gray-400">{row.student_email}</p>
                </td>
                <td className="px-3 py-2">
                  <span className={`inline-flex rounded-full px-2 py-1 font-medium ${statusClasses[row.status]}`}>
                    {statusLabels[row.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">
                  {row.recorded_at ? new Date(row.recorded_at).toLocaleString('pt-BR') : '-'}
                </td>
                <td className="px-3 py-2 text-gray-600 dark:text-gray-300">{row.method ?? '-'}</td>
                <td className="px-3 py-2">
                  <div className="flex min-w-56 flex-col gap-1.5">
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={draftFor(row).score}
                        onChange={(event) => updateDraft(row.student_id, { score: event.target.value })}
                        placeholder="Nota"
                        className="w-20 rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const draft = draftFor(row);
                          const score = Number(draft.score);
                          if (Number.isNaN(score) || score < 0 || score > 100) return;
                          onSavePractical(row.student_id, score, draft.feedback.trim() || null);
                        }}
                        className="rounded border border-indigo-200 px-2 py-1 text-[11px] font-medium text-indigo-700 hover:bg-indigo-50 dark:border-indigo-900 dark:text-indigo-300 dark:hover:bg-indigo-900/20"
                      >
                        Salvar
                      </button>
                    </div>
                    <input
                      value={draftFor(row).feedback}
                      onChange={(event) => updateDraft(row.student_id, { feedback: event.target.value })}
                      placeholder="Feedback prático"
                      className="rounded border border-gray-200 bg-white px-2 py-1 text-[11px] text-gray-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300"
                    />
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex flex-wrap gap-1.5">
                    {actions.map((action) => (
                      <button
                        key={action.status}
                        type="button"
                        onClick={() => onMarkAttendance(row.student_id, action.status)}
                        disabled={row.status === action.status && row.method === 'manual'}
                        className="rounded border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                      >
                        {action.label}
                      </button>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
