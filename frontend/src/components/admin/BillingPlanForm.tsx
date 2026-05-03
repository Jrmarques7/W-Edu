'use client';

import { useState } from 'react';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { BillingPeriod } from '@/types/finance';

const periodLabels: Record<BillingPeriod, string> = { one_time: 'Avulso', monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual' };
const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

export default function BillingPlanForm({ onCreated, onCancel, variant = 'card' }: {
  onCreated: () => void;
  onCancel?: () => void;
  variant?: 'card' | 'plain';
}) {
  const [form, setForm] = useState({ name: '', description: '', price_cents: 0, currency: 'BRL', billing_period: 'monthly' as BillingPeriod });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post(endpoints.finance.plans, { ...form, price_cents: Number(form.price_cents) });
      setForm({ name: '', description: '', price_cents: 0, currency: 'BRL', billing_period: 'monthly' });
      toast.success('Plano criado.');
      onCreated();
    } catch { toast.error('Erro ao criar plano.'); }
  };

  const formCls = variant === 'card'
    ? 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3'
    : 'space-y-4';

  return (
    <form onSubmit={handleSubmit} className={formCls}>
      {variant === 'card' && (
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Plano</h2>
        </div>
      )}
      <input value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} placeholder="Nome" className={inputCls} />
      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição" className={inputCls} />
      <div className="grid grid-cols-2 gap-2">
        <input type="number" value={form.price_cents} onChange={(e) => setForm((p) => ({ ...p, price_cents: Number(e.target.value) }))} placeholder="Preço em centavos" className={inputCls} />
        <select value={form.billing_period} onChange={(e) => setForm((p) => ({ ...p, billing_period: e.target.value as BillingPeriod }))} className={inputCls}>
          {Object.entries(periodLabels).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </div>
      <div className={variant === 'plain' ? 'flex justify-end gap-3 pt-2' : ''}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
            Cancelar
          </button>
        )}
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
          <PlusIcon className="w-4 h-4" /><span>Criar plano</span>
        </button>
      </div>
    </form>
  );
}
