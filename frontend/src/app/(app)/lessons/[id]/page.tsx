'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Progress } from '@/types/course';
import { useLessonPage } from '@/lib/hooks/useLessonPage';
import VideoPlayer from '@/components/video/VideoPlayer';
import LessonVoiceSection from '@/components/lesson/LessonVoiceSection';
import LessonQuizSection from '@/components/lesson/LessonQuizSection';

export default function LessonPage() {
  const { id } = useParams<{ id: string }>();
  const lessonId = Number(id);
  const {
    lesson, setProgress, session, setSession,
    quiz, lastAttempt, setLastAttempt,
    showQuiz, setShowQuiz,
    refreshProgress, markConsumed, handleQuizPass,
    contentRef, isDone, consumed, quizPassed, canFinish,
  } = useLessonPage(lessonId);

  if (!lesson) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Link href={`/courses/${lesson.course_id}`} className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Voltar ao curso</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{lesson.title}</h1>
        <div className="flex items-center space-x-3 mt-2">
          <span className="text-xs px-2 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full font-medium capitalize">{lesson.type}</span>
          {isDone && (
            <span className="flex items-center space-x-1 text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
              <CheckCircleIcon className="w-3 h-3" /><span>Concluída</span>
            </span>
          )}
        </div>
      </div>

      {lesson.type === 'video' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Vídeo-Aula</h2>
          <VideoPlayer lessonId={lessonId} videoUrl={lesson.video_url} hasVideoFile={lesson.has_video_file} onConsumed={markConsumed} />
          {lesson.content && <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap pt-2 border-t border-gray-100 dark:border-gray-700">{lesson.content}</p>}
        </div>
      )}

      {lesson.type !== 'video' && lesson.content && (
        <div ref={contentRef} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-3">Conteúdo da Aula</h2>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{lesson.content}</p>
          <div data-sentinel className="h-1 mt-4" />
        </div>
      )}

      {lesson.type === 'voice' && (
        <LessonVoiceSection
          lessonId={lessonId}
          session={session}
          onSessionUpdate={async (s) => { setSession(s); await refreshProgress(); }}
        />
      )}

      {quiz && (
        <LessonQuizSection
          quiz={quiz} lastAttempt={lastAttempt} consumed={consumed} isDone={isDone}
          showQuiz={showQuiz} setShowQuiz={setShowQuiz} lessonId={lessonId}
          refreshProgress={refreshProgress} onAttempt={setLastAttempt} onPass={handleQuizPass}
        />
      )}

      {!isDone && canFinish && (
        <button
          onClick={async () => {
            const { data } = await api.put<Progress>(endpoints.progress.update(lessonId), { status: 'done' });
            setProgress(data);
            toast.success('Aula concluída!');
          }}
          className="flex items-center space-x-2 px-4 py-2 border border-green-500 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 text-sm font-medium rounded-lg transition-colors"
        >
          <CheckCircleIcon className="w-4 h-4" /><span>Concluir Aula</span>
        </button>
      )}
    </div>
  );
}
