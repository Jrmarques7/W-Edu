'use client';

import { useState } from 'react';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { NotificationChannel, NotificationEventType } from '@/types/notification';

const eventTypes: NotificationEventType[] = ['class_created', 'meeting_created', 'meeting_reminder', 'absence_registered', 'attendance_recorded', 'content_published', 'certificate_issued'];
const channels: NotificationChannel[] = ['internal', 'whatsapp', 'email', 'push'];
const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

export default function NotificationEventForm({ onCreated }: { onCreated: () => void }) {
  const [form, setForm] = useState({
    event_type: 'meeting_created' as NotificationEventType,
    channel: 'internal' as NotificationChannel,
    template_key: 'meeting_created',
    payload: '{\n  "meeting_title": "Aula de exemplo",\n  "starts_at": "2026-04-30T10:00:00Z"\n}',
    recipient_student_id: '', course_id: '', class_offering_id: '', scheduled_meeting_id: '', scheduled_for: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(endpoints.notifications.events, {
        event_type: form.event_type, channel: form.channel, template_key: form.template_key || null,
        payload: JSON.parse(form.payload),
        recipient_student_id: form.recipient_student_id ? Number(form.recipient_student_id) : null,
        course_id: form.course_id ? Number(form.course_id) : null,
        class_offering_id: form.class_offering_id ? Number(form.class_offering_id) : null,
        scheduled_meeting_id: form.scheduled_meeting_id ? Number(form.scheduled_meeting_id) : null,
        scheduled_for: form.scheduled_for ? new Date(form.scheduled_for).toISOString() : null,
      });
      toast.success('Evento criado.');
      onCreated();
    } catch { toast.error('Erro ao criar evento.'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <PaperAirplaneIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Disparar evento</h2>
      </div>
      <select value={form.event_type} onChange={(e) => setForm((p) => ({ ...p, event_type: e.target.value as NotificationEventType }))} className={inputCls}>
        {eventTypes.map((t) => <option key={t} value={t}>{t}</option>)}
      </select>
      <select value={form.channel} onChange={(e) => setForm((p) => ({ ...p, channel: e.target.value as NotificationChannel }))} className={inputCls}>
        {channels.map((c) => <option key={c} value={c}>{c}</option>)}
      </select>
      <input value={form.template_key} onChange={(e) => setForm((p) => ({ ...p, template_key: e.target.value }))} placeholder="template_key" className={inputCls} />
      <textarea value={form.payload} onChange={(e) => setForm((p) => ({ ...p, payload: e.target.value }))} rows={7} className={`${inputCls} font-mono`} />
      <div className="grid grid-cols-2 gap-2">
        <input value={form.recipient_student_id} onChange={(e) => setForm((p) => ({ ...p, recipient_student_id: e.target.value }))} placeholder="student_id" className={inputCls} />
        <input value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} placeholder="course_id" className={inputCls} />
        <input value={form.class_offering_id} onChange={(e) => setForm((p) => ({ ...p, class_offering_id: e.target.value }))} placeholder="class_offering_id" className={inputCls} />
        <input value={form.scheduled_meeting_id} onChange={(e) => setForm((p) => ({ ...p, scheduled_meeting_id: e.target.value }))} placeholder="scheduled_meeting_id" className={inputCls} />
      </div>
      <input type="datetime-local" value={form.scheduled_for} onChange={(e) => setForm((p) => ({ ...p, scheduled_for: e.target.value }))} className={inputCls} />
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
        <SparklesIcon className="w-4 h-4" /><span>Criar evento</span>
      </button>
    </form>
  );
}
