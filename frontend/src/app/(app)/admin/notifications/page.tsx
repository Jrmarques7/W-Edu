'use client';

import { useEffect, useState } from 'react';
import { ListBulletIcon, PlusIcon, RectangleStackIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { NotificationEvent, NotificationTemplate } from '@/types/notification';
import NotificationEventForm from '@/components/admin/NotificationEventForm';

type CommunicationTab = 'events' | 'templates';

export default function AdminNotificationsPage() {
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [events, setEvents] = useState<NotificationEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<CommunicationTab>('events');
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [failingEvent, setFailingEvent] = useState<NotificationEvent | null>(null);
  const [failureReason, setFailureReason] = useState('');

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

  const markFailed = async () => {
    if (!failingEvent || !failureReason.trim()) return;
    try {
      await api.post(endpoints.notifications.eventFailed(failingEvent.id), null, { params: { error_message: failureReason.trim() } });
      setFailingEvent(null);
      setFailureReason('');
      await load();
    }
    catch { toast.error('Erro ao marcar como falho.'); }
  };

  const tabs = [
    { id: 'events' as CommunicationTab, label: 'Eventos', icon: ListBulletIcon, badge: events.length },
    { id: 'templates' as CommunicationTab, label: 'Templates', icon: RectangleStackIcon, badge: templates.length },
  ];

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

      <div className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Comunicação">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button key={tab.id} type="button" role="tab" aria-selected={active} aria-controls={`communication-${tab.id}`} onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${active ? 'border-blue-500 text-blue-600 dark:text-blue-400' : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'}`}>
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${active ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>{tab.badge}</span>
                </button>
              );
            })}
          </nav>
        </div>

        <div id={`communication-${activeTab}`} role="tabpanel">
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Eventos recentes</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Fila de eventos para canais internos e externos.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={processDue} className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
                    Processar pendentes
                  </button>
                  <button onClick={() => setEventModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                    <PlusIcon className="h-4 w-4" /><span>Novo evento</span>
                  </button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800">
                {events.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhum evento registrado.</p>
                ) : (
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
                          <button onClick={() => setFailingEvent(event)} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-red-600 hover:bg-red-700 text-white">Falhou</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'templates' && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Templates</h2>
                <p className="text-sm text-gray-500 dark:text-gray-400">Modelos disponíveis por canal.</p>
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {templates.map((t) => (
                  <div key={`${t.key}-${t.channel}`} className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{t.key}</p>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.channel}</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">{t.title_template}</p>
                    <span className={`mt-3 inline-flex rounded-full px-2 py-1 text-xs font-medium ${t.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                      {t.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                ))}
                {templates.length === 0 && <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Nenhum template cadastrado.</div>}
              </div>
            </div>
          )}
        </div>
      </div>

      {eventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Novo evento</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crie um evento de comunicação manual.</p>
              </div>
              <button type="button" onClick={() => setEventModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <NotificationEventForm variant="plain" onCancel={() => setEventModalOpen(false)} onCreated={() => { setEventModalOpen(false); load(); }} />
          </div>
        </div>
      )}

      {failingEvent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Marcar como falho</h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Informe o motivo da falha.</p>
            <textarea value={failureReason} onChange={(e) => setFailureReason(e.target.value)} rows={4} className="mt-4 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => { setFailingEvent(null); setFailureReason(''); }} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">Cancelar</button>
              <button type="button" onClick={markFailed} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700">Marcar falha</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
