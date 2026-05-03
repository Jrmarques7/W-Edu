'use client';

import { useState } from 'react';
import { BuildingOffice2Icon, PlusIcon } from '@heroicons/react/24/outline';
import type { Location } from '@/types/schedule';

export default function RoomForm({ locations, onCreated, onCancel, variant = 'card' }: {
  locations: Location[];
  onCreated: () => void;
  onCancel?: () => void;
  variant?: 'card' | 'plain';
}) {
  const [form, setForm] = useState({ location_id: '', name: '', capacity: 20, resources: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post(endpoints.schedule.rooms, {
        location_id: Number(form.location_id), name: form.name, capacity: form.capacity, resources: form.resources || null,
      });
      setForm({ location_id: '', name: '', capacity: 20, resources: '' });
      toast.success('Sala criada.');
      onCreated();
    } catch { toast.error('Erro ao criar sala.'); }
  };

  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';
  const formCls = variant === 'card'
    ? 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3'
    : 'space-y-4';
  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  return (
    <form onSubmit={handleSubmit} className={formCls}>
      {variant === 'card' && (
        <div className="flex items-center space-x-2">
          <BuildingOffice2Icon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Sala</h2>
        </div>
      )}
      <select value={form.location_id} onChange={set('location_id')} required className={inputCls}>
        <option value="">Selecione a unidade</option>
        {locations.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
      </select>
      <input value={form.name} onChange={set('name')} required placeholder="Nome da sala" className={inputCls} />
      <input type="number" min={1} value={form.capacity} onChange={set('capacity')} required className={inputCls} />
      <div className={variant === 'plain' ? 'flex justify-end gap-3 pt-2' : ''}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-300 dark:hover:text-white">
            Cancelar
          </button>
        )}
        <button className={`flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors ${variant === 'card' ? 'w-full' : ''}`}>
          <PlusIcon className="w-4 h-4" /><span>Criar sala</span>
        </button>
      </div>
    </form>
  );
}
