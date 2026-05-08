'use client';

import { useState } from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import type { Organization, Student } from '@/types/auth';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';
import type { PaymentMethod, Subscription } from '@/types/finance';

const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

export default function ChargeForm({ subscriptions, students, organizations, courses, classes, onCreated, onCancel, variant = 'card' }: {
  subscriptions: Subscription[];
  students: Student[];
  organizations: Organization[];
  courses: Course[];
  classes: ClassOffering[];
  onCreated: () => void;
  onCancel?: () => void;
  variant?: 'card' | 'plain';
}) {
  const [form, setForm] = useState({
    subscription_id: '', student_id: '', organization_id: '', course_id: '', class_offering_id: '',
    amount_cents: 0, currency: 'BRL', payment_method: 'manual' as PaymentMethod, gateway_name: '', gateway_customer_id: '', due_at: '', description: '',
  });
  const formCls = variant === 'card'
    ? 'bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3'
    : 'space-y-4';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post(endpoints.finance.charges, {
        subscription_id: form.subscription_id ? Number(form.subscription_id) : null,
        student_id: form.student_id ? Number(form.student_id) : null,
        organization_id: form.organization_id ? Number(form.organization_id) : null,
        course_id: form.course_id ? Number(form.course_id) : null,
        class_offering_id: form.class_offering_id ? Number(form.class_offering_id) : null,
        amount_cents: Number(form.amount_cents), currency: form.currency,
        payment_method: form.payment_method,
        gateway_name: form.gateway_name || null,
        gateway_customer_id: form.gateway_customer_id || null,
        due_at: form.due_at ? new Date(form.due_at).toISOString() : null,
        description: form.description || null,
      });
      toast.success('Cobrança criada.');
      onCreated();
    } catch { toast.error('Erro ao criar cobrança.'); }
  };

  return (
    <form onSubmit={handleSubmit} className={formCls}>
      {variant === 'card' && <h2 className="font-semibold text-gray-900 dark:text-white">Cobrança</h2>}
      <select value={form.subscription_id} onChange={(e) => setForm((p) => ({ ...p, subscription_id: e.target.value }))} className={inputCls}>
        <option value="">Assinatura opcional</option>
        {subscriptions.map((s) => <option key={s.id} value={s.id}>#{s.id}</option>)}
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
      <div className="grid grid-cols-2 gap-2">
        <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} className={inputCls}>
          <option value="">Curso opcional</option>
          {courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.class_offering_id} onChange={(e) => setForm((p) => ({ ...p, class_offering_id: e.target.value }))} className={inputCls}>
          <option value="">Turma opcional</option>
          {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <input type="number" value={form.amount_cents} onChange={(e) => setForm((p) => ({ ...p, amount_cents: Number(e.target.value) }))} placeholder="Valor em centavos" className={inputCls} />
      <select value={form.payment_method} onChange={(e) => setForm((p) => ({ ...p, payment_method: e.target.value as PaymentMethod }))} className={inputCls}>
        <option value="manual">Manual</option>
        <option value="pix">PIX</option>
        <option value="card">Cartão</option>
        <option value="boleto">Boleto</option>
      </select>
      <div className="grid grid-cols-2 gap-2">
        <input value={form.gateway_name} onChange={(e) => setForm((p) => ({ ...p, gateway_name: e.target.value }))} placeholder="Gateway ex.: asaas" className={inputCls} />
        <input value={form.gateway_customer_id} onChange={(e) => setForm((p) => ({ ...p, gateway_customer_id: e.target.value }))} placeholder="Cliente no gateway" className={inputCls} />
      </div>
      <input type="date" value={form.due_at} onChange={(e) => setForm((p) => ({ ...p, due_at: e.target.value }))} className={inputCls} />
      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição" className={inputCls} />
      <div className={variant === 'plain' ? 'flex justify-end gap-3 pt-2' : ''}>
        {onCancel && (
          <button type="button" onClick={onCancel} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
            Cancelar
          </button>
        )}
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
          <PlusIcon className="w-4 h-4" /><span>Criar cobrança</span>
        </button>
      </div>
    </form>
  );
}
