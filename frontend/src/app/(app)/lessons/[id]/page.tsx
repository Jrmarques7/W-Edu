'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { MicrophoneIcon, CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, Lesson, Progress, Session } from '@/types/course';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import QuizPanel from '@/components/lesson/QuizPanel';
import { VoiceRealtimePanel } from '@/components/voice/VoiceRealtimePanel';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const { student } = useAuthStore();
  const lessonId = Number(id);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [lastAttempt, setLastAttempt] = useState<QuizAttempt | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const refreshProgress = useCallback(async () => {
    const { data } = await api.get<Progress[]>(endpoints.progress.me);
    setProgress(data.find((x) => x.lesson_id === lessonId) ?? null);
  }, [lessonId]);

  useEffect(() => {
    Promise.all([
      api.get<Lesson>(`/lessons/${lessonId}`),
      api.get<Progress[]>(endpoints.progress.me),
      api.get<Session[]>(endpoints.sessions.me),
      api.get<Quiz>(`/quizzes/lesson/${lessonId}`).catch(() => null),
      api.get<QuizAttempt[]>(`/quizzes/lesson/${lessonId}/attempts`).catch(() => null),
    ]).then(async ([l, p, s, q, a]) => {
      setLesson(l.data);
      api.get<Course>(endpoints.courses.detail(l.data.course_id)).then(({ data }) => setCourse(data));
      setProgress(p.data.find((x) => x.lesson_id === lessonId) ?? null);
      setSession(s.data.filter((x) => x.lesson_id === lessonId).sort((a, b) => b.id - a.id)[0] ?? null);
      if (q) setQuiz(q.data);
      if (a && a.data.length > 0) setLastAttempt(a.data[0]);
    });
  }, [lessonId]);

  // Mark content consumed when user scrolls to bottom (text/video lessons)
  useEffect(() => {
    if (!lesson || lesson.type === 'voice' || progress?.content_consumed_at) return;

    const el = contentRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          api.post<Progress>(`/progress/consume/${lessonId}`).then(({ data }) => setProgress(data));
          observer.disconnect();
        }
      },
      { threshold: 0.8 }
    );

    const sentinel = el.querySelector('[data-sentinel]');
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [lesson, lessonId, progress?.content_consumed_at]);

  const handleQuizPass = async () => {
    const { data } = await api.put<Progress>(endpoints.progress.update(lessonId), { status: 'done' });
    setProgress(data);
    setShowQuiz(false);
    toast.success('Aula concluída!');
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
  const consumed = !!progress?.content_consumed_at;
  const quizPassed = lastAttempt?.passed ?? false;
  const canFinish = consumed && (!quiz || quizPassed);

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
        <div ref={contentRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Conteúdo da Aula</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
          <div data-sentinel className="h-1 mt-4" />
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
                Fale com o professor IA sobre o conteúdo desta aula em tempo real. A conversa será salva no histórico de sessões.
              </p>
            </div>
          </div>
          <VoiceRealtimePanel
            agentId={course?.agent_id ?? null}
            callerId={student ? `student-${student.id}` : 'student-unknown'}
            lessonId={lessonId}
            onSessionUpdate={async (updatedSession) => {
              setSession(updatedSession);
              await refreshProgress();
            }}
          />
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

      {/* Quiz panel */}
      {quiz && consumed && !isDone && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <ClipboardDocumentListIcon className="w-6 h-6 text-indigo-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Quiz da Aula</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {quiz.questions.length} questão{quiz.questions.length !== 1 ? 'ões' : ''} · Nota mínima: {quiz.passing_score}%
                  {lastAttempt && ` · Última tentativa: ${lastAttempt.score}% (${lastAttempt.passed ? 'Aprovado' : 'Reprovado'})`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowQuiz(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {lastAttempt ? 'Tentar novamente' : 'Fazer Quiz'}
            </button>
          </div>
        </div>
      )}

      {/* Quiz already passed */}
      {quiz && quizPassed && !isDone && (
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Quiz aprovado com {lastAttempt?.score}% — você pode concluir a aula.</span>
        </div>
      )}

      {/* Finish lesson */}
      {!isDone && canFinish && (
        <button
          onClick={async () => {
            const { data } = await api.put<Progress>(endpoints.progress.update(lessonId), { status: 'done' });
            setProgress(data);
            toast.success('Aula concluída!');
          }}
          className="flex items-center space-x-2 px-4 py-2 border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircleIcon className="w-4 h-4" />
          <span>Concluir Aula</span>
        </button>
      )}

      {/* Blocked message */}
      {!isDone && !canFinish && consumed && quiz && !quizPassed && !showQuiz && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Complete o quiz com pelo menos {quiz.passing_score}% para concluir a aula.
        </p>
      )}

      {/* Quiz modal */}
      {showQuiz && quiz && (
        <QuizPanel
          quiz={quiz}
          lessonId={lessonId}
          onClose={() => { setShowQuiz(false); refreshProgress(); }}
          onPass={handleQuizPass}
          onAttempt={(a) => setLastAttempt(a)}
        />
      )}
    </div>
  );
}
