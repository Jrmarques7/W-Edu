'use client';

import { useState } from 'react';
import { AcademicCapIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Course } from '@/types/course';
import type { User } from '@/types/auth';
import type { ClassOffering, Room } from '@/types/schedule';

const toDateTimeLocal = (v: string) => v.slice(0, 16);
const toApiDateTime = (v: string) => new Date(v).toISOString();

export default function ClassOfferingForm({ courses, rooms, instructors = [], onCreated, onCancel, variant = 'card' }: {
  courses: Course[];
  rooms: Room[];
  instructors?: User[];
  onCreated: () => void;
  onCancel?: () => void;
  variant?: 'card' | 'plain';
}) {
  const [form, setForm] = useState({
    course_id: '', name: '',
    starts_at: toDateTimeLocal(new Date().toISOString()),
    ends_at: toDateTimeLocal(new Date(Date.now() + 60 * 60 * 1000).toISOString()),
    capacity: 20, status: 'open' as ClassOffering['status'], room_id: '', instructor_id: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post(endpoints.schedule.classes, {
        course_id: Number(form.course_id), name: form.name,
        starts_at: toApiDateTime(form.starts_at), ends_at: toApiDateTime(form.ends_at),
        capacity: form.capacity, status: form.status,
        room_id: form.room_id ? Number(form.room_id) : null,
        instructor_id: form.instructor_id ? Number(form.instructor_id) : null,
      });
      setForm((p) => ({ ...p, name: '' }));
      toast.success('Turma criada.');
      onCreated();
    } catch { toast.error('Erro ao criar turma.'); }
  };

  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const formCls = variant === 'card'
    ? 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3'
    : 'space-y-4';

  return (
    <form onSubmit={handleSubmit} className={formCls}>
      {variant === 'card' && (
        <div className="flex items-center space-x-2">
          <AcademicCapIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Turma</h2>
        </div>
      )}
      <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} required className={inputCls}>
        <option value="">Selecione o curso</option>
        {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required placeholder="Nome da turma" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((p) => ({ ...p, starts_at: e.target.value }))} className={inputCls} />
        <input type="datetime-local" value={form.ends_at} onChange={(e) => setForm((p) => ({ ...p, ends_at: e.target.value }))} className={inputCls} />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <input type="number" min={1} value={form.capacity} onChange={(e) => setForm((p) => ({ ...p, capacity: Number(e.target.value) }))} className={inputCls} />
        <select value={form.room_id} onChange={(e) => setForm((p) => ({ ...p, room_id: e.target.value }))} className={inputCls}>
          <option value="">Sem sala</option>
          {rooms.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
        </select>
      </div>
      <select value={form.instructor_id} onChange={(e) => setForm((p) => ({ ...p, instructor_id: e.target.value }))} className={inputCls}>
        <option value="">Sem instrutor</option>
        {instructors.map((instructor) => <option key={instructor.id} value={instructor.id}>{instructor.name}</option>)}
      </select>
      <div className={variant === 'plain' ? 'flex justify-end gap-3 pt-2' : ''}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
            Cancelar
          </button>
        )}
        <button className={`flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors ${variant === 'card' ? 'w-full' : ''}`}>
          <PlusIcon className="w-4 h-4" /><span>Criar turma</span>
        </button>
      </div>
    </form>
  );
}
