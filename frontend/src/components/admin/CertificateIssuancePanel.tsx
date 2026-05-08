'use client';

import { CheckBadgeIcon } from '@heroicons/react/24/outline';
import type { Student } from '@/types/auth';
import type { CertificateEligibility } from '@/types/certificate';

export default function CertificateIssuancePanel({ enrolledStudents, studentId, eligibility, onStudentChange, onCheckEligibility, onIssue }: {
  enrolledStudents: Student[];
  studentId: string;
  eligibility: CertificateEligibility | null;
  onStudentChange: (id: string) => void;
  onCheckEligibility: () => void;
  onIssue: () => void;
}) {
  const selected = enrolledStudents.find((s) => String(s.id) === studentId);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <CheckBadgeIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Emissão</h2>
      </div>
      <select value={studentId} onChange={(e) => onStudentChange(e.target.value)}
        className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
        <option value="">Selecione um aluno matriculado</option>
        {enrolledStudents.map((s) => <option key={s.id} value={s.id}>{s.name} - {s.email}</option>)}
      </select>
      {selected && <p className="text-xs text-gray-500 dark:text-gray-400">Aluno selecionado: {selected.name}</p>}
      {enrolledStudents.length === 0 && <p className="text-xs text-amber-600 dark:text-amber-400">Este curso ainda não possui alunos matriculados.</p>}
      <div className="flex flex-wrap gap-2">
        <button onClick={onCheckEligibility} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
          Ver elegibilidade
        </button>
        <button onClick={onIssue} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          Emitir certificado
        </button>
      </div>
      {eligibility && (
        <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 text-sm text-gray-700 dark:text-gray-300">
          <p className="font-medium mb-2">{eligibility.eligible ? 'Elegível' : 'Não elegível'}</p>
          <p>Progresso: {eligibility.progress_percent}%</p>
          <p>Avaliações: {eligibility.quiz_percent}%</p>
          <p>Frequência: {eligibility.attendance_percent}%</p>
          {eligibility.reasons.length > 0 && <p className="mt-2 text-red-600 dark:text-red-400">{eligibility.reasons.join(' • ')}</p>}
        </div>
      )}
    </div>
  );
}
