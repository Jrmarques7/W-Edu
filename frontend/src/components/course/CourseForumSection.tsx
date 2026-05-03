'use client';

import { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ForumThread } from '@/types/forum';

const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

export default function CourseForumSection({ courseId, initialThreads }: { courseId: number; initialThreads: ForumThread[] }) {
  const [threads, setThreads] = useState<ForumThread[]>(initialThreads);
  const [form, setForm] = useState({ title: '', body: '' });
  const [replyBody, setReplyBody] = useState<Record<number, string>>({});

  const createThread = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await api.post<ForumThread>(endpoints.forum.courseThreads(courseId), form);
      setThreads((prev) => [data, ...prev]);
      setForm({ title: '', body: '' });
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
      setThreads((prev) => prev.map((t) => (t.id === threadId ? data : t)));
      setReplyBody((prev) => ({ ...prev, [threadId]: '' }));
    } catch {
      toast.error('Erro ao responder tópico.');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <ChatBubbleLeftRightIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Fórum do curso</h2>
      </div>

      <form onSubmit={createThread} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título do tópico" className={inputCls} />
        <textarea value={form.body} onChange={(e) => setForm((p) => ({ ...p, body: e.target.value }))} placeholder="Mensagem" rows={3} className={inputCls} />
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
                  onChange={(e) => setReplyBody((p) => ({ ...p, [thread.id]: e.target.value }))}
                  placeholder="Responder"
                  className={inputCls}
                />
                <button type="button" onClick={() => createReply(thread.id)} className="px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg">Enviar</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
