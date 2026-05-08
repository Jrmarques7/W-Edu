'use client';

import { ShieldCheckIcon } from '@heroicons/react/24/outline';
import type { CertificateRule } from '@/types/certificate';

const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500';

export default function CertificateRuleForm({ rule, onChange, onSave }: {
  rule: CertificateRule;
  onChange: (rule: CertificateRule) => void;
  onSave: () => void;
}) {
  const set = (key: keyof CertificateRule) => (e: React.ChangeEvent<HTMLInputElement>) =>
    onChange({ ...rule, [key]: e.target.type === 'checkbox' ? e.target.checked : Number(e.target.value) });

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <ShieldCheckIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Regra de certificação</h2>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([['require_lessons_complete', 'Concluir aulas'], ['require_quiz', 'Exigir avaliações'], ['require_attendance', 'Exigir frequência'], ['auto_issue', 'Emissão automática']] as const).map(([key, label]) => (
          <label key={key} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={rule[key] as boolean} onChange={set(key)} />
            {label}
          </label>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3">
        {([['minimum_progress_percent', 'Progresso mínimo (%)'], ['minimum_quiz_score', 'Nota mínima das avaliações (%)'], ['minimum_attendance_percent', 'Frequência mínima (%)']] as const).map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{label}</label>
            <input type="number" min={0} max={100} value={rule[key] as number} onChange={set(key)} className={inputCls} />
          </div>
        ))}
      </div>
      <button onClick={onSave} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
        Salvar regra
      </button>
    </div>
  );
}
