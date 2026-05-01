'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CheckCircleIcon, ClockIcon, DocumentTextIcon, MicrophoneIcon } from '@heroicons/react/24/outline';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { SessionHistory } from '@/types/course';

type SessionFilter = 'all' | 'completed' | 'open' | 'transcript';

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionHistory[]>([]);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [filter, setFilter] = useState<SessionFilter>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<SessionHistory[]>(endpoints.sessions.history)
      .then((r) => setSessions(r.data))
      .finally(() => setLoading(false));
  }, []);

  const completedCount = sessions.filter((session) => session.ended_at).length;
  const openCount = sessions.filter((session) => !session.ended_at).length;
  const transcriptCount = sessions.filter((session) => session.has_transcript).length;
  const totalMinutes = sessions.reduce((total, session) => total + (session.duration_minutes ?? 0), 0);
  const filteredSessions = sessions.filter((session) => {
    if (filter === 'completed') return Boolean(session.ended_at);
    if (filter === 'open') return !session.ended_at;
    if (filter === 'transcript') return session.has_transcript;
    return true;
  });

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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Sessões de Voz</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Histórico de conversas com professor IA, duração e transcrições.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Sessões', value: sessions.length, icon: MicrophoneIcon, cls: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
          { label: 'Concluídas', value: completedCount, icon: CheckCircleIcon, cls: 'bg-green-50 text-green-600 dark:bg-green-900/20' },
          { label: 'Em andamento', value: openCount, icon: ClockIcon, cls: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-900/20' },
          { label: 'Minutos', value: totalMinutes, icon: DocumentTextIcon, cls: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20' },
        ].map((stat) => (
          <div key={stat.label} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 ${stat.cls} rounded-lg flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {sessions.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <MicrophoneIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão de voz realizada ainda.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {[
              { value: 'all', label: 'Todas' },
              { value: 'completed', label: 'Concluídas' },
              { value: 'open', label: 'Em andamento' },
              { value: 'transcript', label: `Com transcrição (${transcriptCount})` },
            ].map((item) => (
              <button
                key={item.value}
                onClick={() => setFilter(item.value as SessionFilter)}
                className={`px-3 py-2 text-sm font-medium rounded-lg border transition-colors ${
                  filter === item.value
                    ? 'border-indigo-600 bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-300'
                    : 'border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {filteredSessions.map((s) => (
            <div key={s.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <button
                onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-9 h-9 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                    <MicrophoneIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{s.lesson_title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {s.course_name} · {new Date(s.started_at).toLocaleString('pt-BR')}
                      {s.duration_minutes !== null && ` · ${s.duration_minutes} min`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${s.ended_at ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
                    {s.ended_at ? 'Concluída' : 'Em andamento'}
                  </span>
                  {s.has_transcript && <DocumentTextIcon className="w-4 h-4 text-gray-400" />}
                </div>
              </button>

              {expanded === s.id && (
                <div className="px-5 pb-4 border-t border-gray-100 dark:border-gray-700">
                  <div className="mt-3 mb-2 flex items-center justify-between gap-3">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Transcrição</p>
                    <Link href={`/lessons/${s.lesson_id}`} className="text-xs font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                      Abrir aula
                    </Link>
                  </div>
                  {s.transcript ? (
                    <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 rounded-lg p-3 leading-relaxed whitespace-pre-wrap">
                      {s.transcript}
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 rounded-lg p-3">
                      Esta sessão ainda não possui transcrição.
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
          {filteredSessions.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
              <p className="text-gray-500 dark:text-gray-400">Nenhuma sessão neste filtro.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
