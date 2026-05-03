'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Lesson, Progress, Session } from '@/types/course';
import type { Quiz, QuizAttempt } from '@/types/quiz';

export function useLessonPage(lessonId: number) {
  const [lesson, setLesson] = useState<Lesson | null>(null);
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
      api.get<Quiz | null>(endpoints.quizzes.lessonOptional(lessonId)),
      api.get<QuizAttempt[]>(endpoints.quizzes.attemptsOptional(lessonId)),
    ]).then(([l, p, s, q, a]) => {
      setLesson(l.data);
      setProgress(p.data.find((x) => x.lesson_id === lessonId) ?? null);
      setSession(s.data.filter((x) => x.lesson_id === lessonId).sort((a, b) => b.id - a.id)[0] ?? null);
      if (q) setQuiz(q.data);
      if (a && a.data.length > 0) setLastAttempt(a.data[0]);
    });
  }, [lessonId]);

  const markConsumed = useCallback(async () => {
    if (progress?.content_consumed_at) return;
    const { data } = await api.post<Progress>(`/progress/consume/${lessonId}`);
    setProgress(data);
  }, [lessonId, progress?.content_consumed_at]);

  useEffect(() => {
    if (!lesson || lesson.type === 'voice' || lesson.type === 'video' || progress?.content_consumed_at) return;
    const el = contentRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { markConsumed(); observer.disconnect(); } },
      { threshold: 0.8 }
    );
    const sentinel = el.querySelector('[data-sentinel]');
    if (sentinel) observer.observe(sentinel);
    return () => observer.disconnect();
  }, [lesson, markConsumed, progress?.content_consumed_at]);

  const handleQuizPass = async () => {
    const { data } = await api.put<Progress>(endpoints.progress.update(lessonId), { status: 'done' });
    setProgress(data);
    setShowQuiz(false);
    toast.success('Aula concluída!');
  };

  const isDone = progress?.status === 'done';
  const consumed = !!progress?.content_consumed_at;
  const quizPassed = lastAttempt?.passed ?? false;
  const canFinish = consumed && (!quiz || quizPassed);

  return {
    lesson, progress, setProgress, session, setSession,
    quiz, lastAttempt, setLastAttempt,
    showQuiz, setShowQuiz,
    refreshProgress, markConsumed, handleQuizPass,
    contentRef, isDone, consumed, quizPassed, canFinish,
  };
}
