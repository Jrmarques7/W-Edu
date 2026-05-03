'use client';

import { useEffect, useState } from 'react';
import { BellAlertIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { NotificationEvent, NotificationTemplate } from '@/types/notification';
import NotificationEventForm from '@/components/admin/NotificationEventForm';

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [templateRes, eventRes] = await Promise.allSettled([
      api.get<NotificationTemplate[]>(endpoints.notifications.templates),
      api.get<NotificationEvent[]>(endpoints.notifications.events),
    ]);
    if (templateRes.status === 'fulfilled') setTemplates(templateRes.value.data);
    if (eventRes.status === 'fulfilled') {
      setEvents(eventRes.value.data);
    } else {
      setEvents([]);
      toast.error('Eventos de comunicação indisponíveis. Verifique migrações e logs do backend.');
    }
    setLoading(false);
  };

  useEffect(() => { load().catch(() => toast.error('Erro ao carregar comunicação.')); }, []);

  const processDue = async () => {
    try {
      const { data } = await api.post<NotificationEvent[]>(endpoints.notifications.processDue);
      toast.success(`${data.length} evento(s) pendente(s) processado(s).`);
      await load();
    } catch { toast.error('Erro ao processar eventos pendentes.'); }
  };

  const markSent = async (id: number) => {
    try { await api.post(endpoints.notifications.eventSent(id)); await load(); }
    catch { toast.error('Erro ao marcar como enviado.'); }
  };

  const markFailed = async (id: number) => {
    const errorMessage = prompt('Motivo da falha?');
    if (!errorMessage) return;
    try { await api.post(endpoints.notifications.eventFailed(id), null, { params: { error_message: errorMessage } }); await load(); }
    catch { toast.error('Erro ao marcar como falho.'); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Comunicação</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Eventos, templates e fila pronta para W-Omni.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <NotificationEventForm onCreated={load} />

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <div className="flex items-center gap-2 mb-3">
            <BellAlertIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Templates</h2>
          </div>
          <div className="space-y-3">
            {templates.map((t) => (
              <div key={`${t.key}-${t.channel}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{t.key}</p>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{t.channel}</span>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{t.title_template}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Eventos recentes</h2>
          <button onClick={processDue} className="inline-flex items-center justify-center px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
            Processar pendentes
          </button>
        </div>
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {events.map((event) => (
            <div key={event.id} className="px-5 py-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{event.event_type}</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{event.status}</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">{event.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 break-all">{event.body}</p>
                {event.scheduled_for && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Agendado para {new Date(event.scheduled_for).toLocaleString('pt-BR')}</p>}
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => markSent(event.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Enviado</button>
                <button onClick={() => markFailed(event.id)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">Falhou</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
