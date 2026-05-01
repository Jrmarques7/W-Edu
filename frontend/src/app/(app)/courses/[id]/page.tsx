'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpenIcon,
  ChatBubbleLeftRightIcon,
  EnvelopeIcon,
  DocumentTextIcon,
  VideoCameraIcon,
  MicrophoneIcon,
  CheckCircleIcon,
  PlayCircleIcon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ChatConversation } from '@/types/chat';
import type { Course, Lesson, Progress } from '@/types/course';
import type { ForumThread } from '@/types/forum';

const lessonIcon = (type: Lesson['type']) => {
  if (type === 'video') return VideoCameraIcon;
  if (type === 'voice') return MicrophoneIcon;
  if (type === 'live' || type === 'in_person') return CalendarDaysIcon;
  if (type === 'assessment') return ClipboardDocumentCheckIcon;
  return DocumentTextIcon;
};

const statusBadge = (status?: Progress['status']) => {
  if (status === 'done') return { label: 'Concluída', cls: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' };
  if (status === 'in_progress') return { label: 'Em andamento', cls: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' };
  return { label: 'Pendente', cls: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' };
};

export default function CourseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Progress[]>([]);
  const [threads, setThreads] = useState<ForumThread[]>([]);
  const [threadForm, setThreadForm] = useState({ title: '', body: '' });
  const [replyBody, setReplyBody] = useState<Record<number, string>>({});
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [chatBody, setChatBody] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Course>(endpoints.courses.detail(Number(id))),
      api.get<Lesson[]>(endpoints.courses.lessons(Number(id))),
      api.get<Progress[]>(endpoints.progress.me),
      api.get<ForumThread[]>(endpoints.forum.courseThreads(Number(id))),
      api.get<ChatConversation[]>(endpoints.chat.conversations),
    ]).then(([c, l, p, f, chats]) => {
      setCourse(c.data);
      setLessons(l.data);
      setProgress(p.data);
      setThreads(f.data);
      setConversation(chats.data.find((chat) => chat.course_id === Number(id)) ?? null);
    }).finally(() => setLoading(false));
  }, [id]);

  const getProgress = (lessonId: number) => progress.find((p) => p.lesson_id === lessonId);
  const doneCount = lessons.filter((l) => getProgress(l.id)?.status === 'done').length;
  const pct = lessons.length ? Math.round((doneCount / lessons.length) * 100) : 0;

  const createThread = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      const { data } = await api.post<ForumThread>(endpoints.forum.courseThreads(Number(id)), threadForm);
      setThreads((prev) => [data, ...prev]);
      setThreadForm({ title: '', body: '' });
      toast.success('Tópico criado.');
    } catch {
      toast.error('Erro ao criar tópico.');
    }
  };

  const createReply = async (threadId: number) => {
    const body = replyBody[threadId]?.trim();
    if (!body) return;
    try {
      const { data } = await api.post<ForumThread>(endpoints.forum.posts(threadId), { body });
      setThreads((prev) => prev.map((thread) => (thread.id === threadId ? data : thread)));
      setReplyBody((prev) => ({ ...prev, [threadId]: '' }));
    } catch {
      toast.error('Erro ao responder tópico.');
    }
  };

  const sendChatMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    const body = chatBody.trim();
    if (!body) return;
    try {
      const { data } = conversation
        ? await api.post<ChatConversation>(endpoints.chat.messages(conversation.id), { body })
        : await api.post<ChatConversation>(endpoints.chat.conversations, {
            course_id: Number(id),
            subject: `Dúvida sobre ${course?.name ?? 'curso'}`,
            message: body,
          });
      setConversation(data);
      setChatBody('');
    } catch {
      toast.error('Erro ao enviar mensagem.');
    }
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

  if (!course) return <p className="text-red-500">Curso não encontrado.</p>;

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div>
        <Link href="/courses" className="text-sm text-indigo-600 hover:underline dark:text-indigo-400">← Voltar</Link>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mt-2">{course.name}</h1>
        {course.description && <p className="text-gray-500 dark:text-gray-400 mt-1">{course.description}</p>}
      </div>

      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progresso geral</span>
          <span className="text-sm font-bold text-indigo-600">{pct}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div className="bg-indigo-600 h-2 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">{doneCount} de {lessons.length} aulas concluídas</p>
      </div>

      {/* Lesson list */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Aulas</h2>
        {lessons.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhuma aula cadastrada.</p>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
            {lessons.map((lesson) => {
              const prog = getProgress(lesson.id);
              const { label, cls } = statusBadge(prog?.status);
              const Icon = lessonIcon(lesson.type);
              const isDone = prog?.status === 'done';

              return (
                <Link
                  key={lesson.id}
                  href={`/lessons/${lesson.id}`}
                  className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isDone ? 'bg-green-100 dark:bg-green-900/30' : 'bg-indigo-50 dark:bg-indigo-900/20'}`}>
                      {isDone ? (
                        <CheckCircleIcon className="w-5 h-5 text-green-600" />
                      ) : (
                        <Icon className="w-5 h-5 text-indigo-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{lesson.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{lesson.type}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${cls}`}>{label}</span>
                    <PlayCircleIcon className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fórum do curso</h2>
        </div>

        <form onSubmit={createThread} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <input
            value={threadForm.title}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, title: event.target.value }))}
            placeholder="Título do tópico"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
          <textarea
            value={threadForm.body}
            onChange={(event) => setThreadForm((prev) => ({ ...prev, body: event.target.value }))}
            placeholder="Mensagem"
            rows={3}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">Criar tópico</button>
        </form>

        {threads.length === 0 ? (
          <p className="text-gray-500 dark:text-gray-400">Nenhum tópico criado.</p>
        ) : (
          <div className="space-y-3">
            {threads.map((thread) => (
              <div key={thread.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{thread.title}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{thread.author_name} · {new Date(thread.created_at).toLocaleString('pt-BR')}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{thread.replies_count} resposta{thread.replies_count !== 1 ? 's' : ''}</span>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mt-3 whitespace-pre-wrap">{thread.body}</p>
                {thread.posts.length > 0 && (
                  <div className="mt-4 space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
                    {thread.posts.map((post) => (
                      <div key={post.id}>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{post.author_name} · {new Date(post.created_at).toLocaleString('pt-BR')}</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{post.body}</p>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                  <input
                    value={replyBody[thread.id] ?? ''}
                    onChange={(event) => setReplyBody((prev) => ({ ...prev, [thread.id]: event.target.value }))}
                    placeholder="Responder"
                    className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                  />
                  <button type="button" onClick={() => createReply(thread.id)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg">Enviar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <EnvelopeIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Chat do curso</h2>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          {conversation?.messages.length ? (
            <div className="space-y-3 mb-4">
              {conversation.messages.map((message) => (
                <div key={message.id}>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{message.sender_name} · {new Date(message.created_at).toLocaleString('pt-BR')}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 whitespace-pre-wrap">{message.body}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">Envie uma mensagem para iniciar uma conversa sobre este curso.</p>
          )}
          <form onSubmit={sendChatMessage} className="flex flex-col gap-2 sm:flex-row">
            <input
              value={chatBody}
              onChange={(event) => setChatBody(event.target.value)}
              placeholder="Mensagem para o instrutor ou coordenação"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
            />
            <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">Enviar</button>
          </form>
        </div>
      </div>
    </div>
  );
}
