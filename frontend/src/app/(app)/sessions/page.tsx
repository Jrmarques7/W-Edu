'use client';

import { useEffect, useState } from 'react';
import { MicrophoneIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Session } from '@/types/course';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Session[]>(endpoints.sessions.me)
      .then((r) => setSessions(r.data))
      .finally(() => setLoading(false));
  }, []);

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
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessões de Voz</h1>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <MicrophoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão de voz realizada ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MicrophoneIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Aula #{s.lesson_id}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(s.started_at).toLocaleString('pt-BR')}
                      {s.ended_at && ` · ${Math.round((new Date(s.ended_at).getTime() - new Date(s.started_at).getTime()) / 60000)} min`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.ended_at ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {s.ended_at ? 'Concluída' : 'Em andamento'}
                  </span>
                  {s.transcript && <DocumentTextIcon className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {expanded === s.id && s.transcript && (
                <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-3 mb-2">
                    Transcrição
                  </p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                    {s.transcript}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
