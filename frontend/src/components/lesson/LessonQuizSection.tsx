'use client';

import { CheckCircleIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import type { Quiz, QuizAttempt } from '@/types/quiz';
import QuizPanel from '@/components/lesson/QuizPanel';

export default function LessonQuizSection({ quiz, lastAttempt, consumed, isDone, showQuiz, setShowQuiz, lessonId, refreshProgress, onAttempt, onPass }: {
  quiz: Quiz;
  lastAttempt: QuizAttempt | null;
  consumed: boolean;
  isDone: boolean;
  showQuiz: boolean;
  setShowQuiz: (v: boolean) => void;
  lessonId: number;
  refreshProgress: () => Promise<void>;
  onAttempt: (a: QuizAttempt) => void;
  onPass: () => Promise<void>;
}) {
  const quizPassed = lastAttempt?.passed ?? false;

  return (
    <>
      {consumed && !isDone && !quizPassed && (
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
            <button onClick={() => setShowQuiz(true)} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              {lastAttempt ? 'Tentar novamente' : 'Fazer Quiz'}
            </button>
          </div>
        </div>
      )}

      {quizPassed && !isDone && (
        <div className="flex items-center space-x-2 text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800">
          <CheckCircleIcon className="w-5 h-5" />
          <span>Quiz aprovado com {lastAttempt?.score}% — você pode concluir a aula.</span>
        </div>
      )}

      {!isDone && consumed && !quizPassed && !showQuiz && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          Complete o quiz com pelo menos {quiz.passing_score}% para concluir a aula.
        </p>
      )}

      {showQuiz && (
        <QuizPanel
          quiz={quiz}
          lessonId={lessonId}
          onClose={() => { setShowQuiz(false); refreshProgress(); }}
          onPass={onPass}
          onAttempt={onAttempt}
        />
      )}
    </>
  );
}
