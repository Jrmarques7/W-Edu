'use client';

import { useState } from 'react';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Quiz, QuizAttempt } from '@/types/quiz';

interface Props {
  quiz: Quiz;
  lessonId: number;
  onClose: () => void;
  onPass: () => void;
  onAttempt: (attempt: QuizAttempt) => void;
}

export default function QuizPanel({ quiz, lessonId, onClose, onPass, onAttempt }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const allAnswered = quiz.questions.every((q) => answers[String(q.id)] !== undefined);

  const submit = async () => {
    try {
      setSubmitting(true);
      const { data } = await api.post<QuizAttempt>(endpoints.quizzes.attempt(lessonId), { answers });
      setAttempt(data);
      onAttempt(data);
      if (data.passed) {
        toast.success(`Aprovado! ${data.score}%`);
      } else {
        toast.error(`Reprovado. ${data.score}% — mínimo: ${quiz.passing_score}%`);
      }
    } catch {
      toast.error('Erro ao enviar respostas.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Quiz da Aula</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-sm">
            Fechar
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">
          {attempt ? (
            <div className="text-center space-y-4 py-6">
              {attempt.passed ? (
                <CheckCircleIcon className="w-16 h-16 text-green-500 mx-auto" />
              ) : (
                <XCircleIcon className="w-16 h-16 text-red-500 mx-auto" />
              )}
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{attempt.score}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {attempt.passed ? 'Parabéns! Você foi aprovado.' : `Não foi dessa vez. Mínimo: ${quiz.passing_score}%`}
                </p>
              </div>
              <div className="flex justify-center space-x-3 pt-2">
                {attempt.passed ? (
                  <button
                    onClick={onPass}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Concluir Aula
                  </button>
                ) : (
                  <button
                    onClick={() => { setAttempt(null); setAnswers({}); }}
                    className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Tentar novamente
                  </button>
                )}
              </div>
            </div>
          ) : (
            <>
              {quiz.questions.map((q, idx) => (
                <div key={q.id} className="space-y-3">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    {idx + 1}. {q.question}
                  </p>
                  <div className="space-y-2">
                    {q.options.map((opt, i) => (
                      <label
                        key={i}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                          answers[String(q.id)] === i
                            ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                        }`}
                      >
                        <input
                          type="radio"
                          name={`q-${q.id}`}
                          checked={answers[String(q.id)] === i}
                          onChange={() => setAnswers((prev) => ({ ...prev, [String(q.id)]: i }))}
                          className="text-indigo-600 focus:ring-indigo-500"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {!attempt && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={submit}
              disabled={!allAnswered || submitting}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting ? 'Enviando...' : 'Confirmar respostas'}
            </button>
            {!allAnswered && (
              <p className="text-xs text-center text-gray-400 mt-2">Responda todas as questões para continuar.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
