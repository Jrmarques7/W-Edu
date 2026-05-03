'use client';

import { useState } from 'react';
import { EnvelopeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { ChatConversation } from '@/types/chat';

export default function CourseChatSection({ courseId, courseName, initialConversation }: {
  courseId: number;
  courseName: string;
  initialConversation: ChatConversation | null;
}) {
  const [conversation, setConversation] = useState<ChatConversation | null>(initialConversation);
  const [body, setBody] = useState('');

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = body.trim();
    if (!msg) return;
    try {
      const { data } = conversation
        ? await api.post<ChatConversation>(endpoints.chat.messages(conversation.id), { body: msg })
        : await api.post<ChatConversation>(endpoints.chat.conversations, {
            course_id: courseId,
            subject: `Dúvida sobre ${courseName}`,
            message: msg,
          });
      setConversation(data);
      setBody('');
    } catch {
      toast.error('Erro ao enviar mensagem.');
    }
  };

  return (
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
        <form onSubmit={send} className="flex flex-col gap-2 sm:flex-row">
          <input
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Mensagem para o instrutor ou coordenação"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
          />
          <button className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">Enviar</button>
        </form>
      </div>
    </div>
  );
}
