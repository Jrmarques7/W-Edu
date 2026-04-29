'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, ClockIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Progress } from '@/types/course';

const statusConfig = {
  done: { label: 'Concluída', icon: CheckCircleIcon, cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  in_progress: { label: 'Em andamento', icon: ClockIcon, cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  pending: { label: 'Pendente', icon: ExclamationCircleIcon, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' },
};

export default function ProgressPage() {
  const [progress, setProgress] = useState<Progress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Progress[]>(endpoints.progress.me)
      .then((r) => setProgress(r.data))
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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Meu Progresso</h1>

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

      {progress.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <p className="text-gray-500 dark:text-gray-400">Nenhum progresso registrado ainda.</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {progress.map((p) => {
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
        </div>
      )}
    </div>
  );
}
