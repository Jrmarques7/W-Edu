'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { Organization, Student } from '@/types/auth';
import type { BillingPlan } from '@/types/finance';

const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

export default function SubscriptionForm({ plans, students, organizations, onCreated }: {
  plans: BillingPlan[];
  students: Student[];
  organizations: Organization[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState({ billing_plan_id: '', student_id: '', organization_id: '', gateway_name: '', gateway_customer_id: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post(endpoints.finance.subscriptions, {
        billing_plan_id: Number(form.billing_plan_id),
        student_id: form.student_id ? Number(form.student_id) : null,
        organization_id: form.organization_id ? Number(form.organization_id) : null,
        gateway_name: form.gateway_name || null,
        gateway_customer_id: form.gateway_customer_id || null,
      });
      setForm({ billing_plan_id: '', student_id: '', organization_id: '', gateway_name: '', gateway_customer_id: '' });
      toast.success('Assinatura criada.');
      onCreated();
    } catch { toast.error('Erro ao criar assinatura.'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
      <h2 className="font-semibold text-gray-900 dark:text-white">Assinatura</h2>
      <select value={form.billing_plan_id} onChange={(e) => setForm((p) => ({ ...p, billing_plan_id: e.target.value }))} className={inputCls}>
        <option value="">Plano</option>
        {plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="grid grid-cols-2 gap-2">
        <select value={form.student_id} onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value, organization_id: '' }))} className={inputCls}>
          <option value="">Aluno</option>
          {students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value, student_id: '' }))} className={inputCls}>
          <option value="">Empresa</option>
          {organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
      </div>
      <input value={form.gateway_name} onChange={(e) => setForm((p) => ({ ...p, gateway_name: e.target.value }))} placeholder="Gateway" className={inputCls} />
      <input value={form.gateway_customer_id} onChange={(e) => setForm((p) => ({ ...p, gateway_customer_id: e.target.value }))} placeholder="Customer ID" className={inputCls} />
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
        <PlusIcon className="w-4 h-4" /><span>Criar assinatura</span>
      </button>
    </form>
  );
}
