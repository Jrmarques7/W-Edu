'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MicrophoneIcon, CheckCircleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Lesson, Progress, Session } from '@/types/course';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [starting, setStarting] = useState(false);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    Promise.all([
      api.get<Lesson>(`/lessons/${id}`),
      api.get<Progress[]>(endpoints.progress.me),
      api.get<Session[]>(endpoints.sessions.me),
    ]).then(([l, p, s]) => {
      setLesson(l.data);
      setProgress(p.data.find((x) => x.lesson_id === Number(id)) ?? null);
      setSession(s.data.filter((x) => x.lesson_id === Number(id)).sort((a, b) => b.id - a.id)[0] ?? null);
    });
  }, [id]);

  const startVoiceSession = async () => {
    try {
      setStarting(true);
      const { data } = await api.post<Session>(endpoints.sessions.create, { lesson_id: Number(id) });
      setSession(data);
      toast.success('Sessão de voz iniciada! O BeVox entrará em contato.');
    } catch {
      toast.error('Erro ao iniciar sessão de voz.');
    } finally {
      setStarting(false);
    }
  };

  const markDone = async () => {
    try {
      setMarking(true);
      const { data } = await api.put<Progress>(endpoints.progress.update(Number(id)), { status: 'done' });
      setProgress(data);
      toast.success('Aula marcada como concluída!');
    } catch {
      toast.error('Erro ao atualizar progresso.');
    } finally {
      setMarking(false);
    }
  };

  if (!lesson) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  const isDone = progress?.status === 'done';

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/courses/${lesson.course_id}`} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">
          ← Voltar ao curso
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{lesson.title}</h1>
        <div className="flex items-center space-x-3 mt-2">
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full font-medium capitalize">
            {lesson.type}
          </span>
          {isDone && (
            <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
              <CheckCircleIcon className="w-3 h-3" />
              <span>Concluída</span>
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      {lesson.content && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Conteúdo da Aula</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
        </div>
      )}

      {/* Voice session */}
      {lesson.type === 'voice' && (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700 p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
              <MicrophoneIcon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-base font-semibold text-gray-900 dark:text-white">Professor IA por Voz</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Fale com o professor IA sobre o conteúdo desta aula. A sessão será gravada e transcrita automaticamente.
              </p>
              <button
                onClick={startVoiceSession}
                disabled={starting}
                className="mt-4 flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                {starting ? (
                  <ArrowPathIcon className="w-4 h-4 animate-spin" />
                ) : (
                  <MicrophoneIcon className="w-4 h-4" />
                )}
                <span>{starting ? 'Iniciando...' : 'Falar com o Professor'}</span>
              </button>
            </div>
          </div>

          {/* Last session transcript */}
          {session?.transcript && (
            <div className="mt-5 pt-5 border-t border-indigo-200 dark:border-indigo-700">
              <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                Transcrição da última sessão
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 leading-relaxed">
                {session.transcript}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Mark done */}
      {!isDone && (
        <button
          onClick={markDone}
          disabled={marking}
          className="flex items-center space-x-2 px-4 py-2 border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>{marking ? 'Salvando...' : 'Marcar como concluída'}</span>
        </button>
      )}
    </div>
  );
}
