'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, CheckIcon, XMarkIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { BillingPlan, Charge, Subscription, BillingPeriod, PaymentMethod } from '@/types/finance';
import type { Student, Organization } from '@/types/auth';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';

const periodLabels: Record<BillingPeriod, string> = {
  one_time: 'Avulso',
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  yearly: 'Anual',
};

export default function AdminFinancePage() {
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [planForm, setPlanForm] = useState({ name: '', description: '', price_cents: 0, currency: 'BRL', billing_period: 'monthly' as BillingPeriod });
  const [subscriptionForm, setSubscriptionForm] = useState({ billing_plan_id: '', student_id: '', organization_id: '', gateway_name: '', gateway_customer_id: '' });
  const [chargeForm, setChargeForm] = useState({
    billing_plan_id: '',
    subscription_id: '',
    student_id: '',
    organization_id: '',
    course_id: '',
    class_offering_id: '',
    amount_cents: 0,
    currency: 'BRL',
    payment_method: 'manual' as PaymentMethod,
    gateway_name: '',
    gateway_reference: '',
    description: '',
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [planRes, subRes, chargeRes, studentRes, orgRes, courseRes, classRes] = await Promise.all([
      api.get<BillingPlan[]>(endpoints.finance.plans),
      api.get<Subscription[]>(endpoints.finance.subscriptions),
      api.get<Charge[]>(endpoints.finance.charges),
      api.get<Student[]>('/admin/students'),
      api.get<Organization[]>('/admin/organizations'),
      api.get<Course[]>(endpoints.courses.list),
      api.get<ClassOffering[]>(endpoints.schedule.classes),
    ]);
    setPlans(planRes.data);
    setSubscriptions(subRes.data);
    setCharges(chargeRes.data);
    setStudents(studentRes.data);
    setOrganizations(orgRes.data);
    setCourses(courseRes.data);
    setClasses(classRes.data);
    setLoading(false);
  };

  useEffect(() => {
    load().catch(() => toast.error('Erro ao carregar financeiro.'));
  }, []);

  const createPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(endpoints.finance.plans, { ...planForm, price_cents: Number(planForm.price_cents) });
      setPlanForm({ name: '', description: '', price_cents: 0, currency: 'BRL', billing_period: 'monthly' });
      toast.success('Plano criado.');
      await load();
    } catch {
      toast.error('Erro ao criar plano.');
    }
  };

  const createSubscription = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(endpoints.finance.subscriptions, {
        billing_plan_id: Number(subscriptionForm.billing_plan_id),
        student_id: subscriptionForm.student_id ? Number(subscriptionForm.student_id) : null,
        organization_id: subscriptionForm.organization_id ? Number(subscriptionForm.organization_id) : null,
        gateway_name: subscriptionForm.gateway_name || null,
        gateway_customer_id: subscriptionForm.gateway_customer_id || null,
      });
      setSubscriptionForm({ billing_plan_id: '', student_id: '', organization_id: '', gateway_name: '', gateway_customer_id: '' });
      toast.success('Assinatura criada.');
      await load();
    } catch {
      toast.error('Erro ao criar assinatura.');
    }
  };

  const createCharge = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(endpoints.finance.charges, {
        billing_plan_id: chargeForm.billing_plan_id ? Number(chargeForm.billing_plan_id) : null,
        subscription_id: chargeForm.subscription_id ? Number(chargeForm.subscription_id) : null,
        student_id: chargeForm.student_id ? Number(chargeForm.student_id) : null,
        organization_id: chargeForm.organization_id ? Number(chargeForm.organization_id) : null,
        course_id: chargeForm.course_id ? Number(chargeForm.course_id) : null,
        class_offering_id: chargeForm.class_offering_id ? Number(chargeForm.class_offering_id) : null,
        amount_cents: Number(chargeForm.amount_cents),
        currency: chargeForm.currency,
        payment_method: chargeForm.payment_method,
        gateway_name: chargeForm.gateway_name || null,
        gateway_reference: chargeForm.gateway_reference || null,
        description: chargeForm.description || null,
      });
      toast.success('Cobrança criada.');
      await load();
    } catch {
      toast.error('Erro ao criar cobrança.');
    }
  };

  const markPaid = async (id: number) => {
    try {
      await api.post(endpoints.finance.chargePaid(id));
      await load();
    } catch {
      toast.error('Erro ao marcar como paga.');
    }
  };

  const markFailed = async (id: number) => {
    try {
      await api.post(endpoints.finance.chargeFailed(id));
      await load();
    } catch {
      toast.error('Erro ao marcar como falha.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Planos, assinaturas e cobranças.</p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <form onSubmit={createPlan} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Plano</h2>
          </div>
          <input value={planForm.name} onChange={(e) => setPlanForm((prev) => ({ ...prev, name: e.target.value }))}
            placeholder="Nome"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <textarea value={planForm.description} onChange={(e) => setPlanForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <div className="grid grid-cols-2 gap-2">
            <input type="number" value={planForm.price_cents} onChange={(e) => setPlanForm((prev) => ({ ...prev, price_cents: Number(e.target.value) }))}
              placeholder="Preço em centavos"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
            <select value={planForm.billing_period} onChange={(e) => setPlanForm((prev) => ({ ...prev, billing_period: e.target.value as BillingPeriod }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              {Object.entries(periodLabels).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
            </select>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
            <PlusIcon className="w-4 h-4" />
            <span>Criar plano</span>
          </button>
        </form>

        <form onSubmit={createSubscription} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Assinatura</h2>
          <select value={subscriptionForm.billing_plan_id} onChange={(e) => setSubscriptionForm((prev) => ({ ...prev, billing_plan_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Plano</option>
            {plans.map((plan) => <option key={plan.id} value={plan.id}>{plan.name}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select value={subscriptionForm.student_id} onChange={(e) => setSubscriptionForm((prev) => ({ ...prev, student_id: e.target.value, organization_id: '' }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Aluno</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
            <select value={subscriptionForm.organization_id} onChange={(e) => setSubscriptionForm((prev) => ({ ...prev, organization_id: e.target.value, student_id: '' }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Empresa</option>
              {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </div>
          <input value={subscriptionForm.gateway_name} onChange={(e) => setSubscriptionForm((prev) => ({ ...prev, gateway_name: e.target.value }))}
            placeholder="Gateway"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <input value={subscriptionForm.gateway_customer_id} onChange={(e) => setSubscriptionForm((prev) => ({ ...prev, gateway_customer_id: e.target.value }))}
            placeholder="Customer ID"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
            <PlusIcon className="w-4 h-4" />
            <span>Criar assinatura</span>
          </button>
        </form>

        <form onSubmit={createCharge} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <h2 className="font-semibold text-gray-900 dark:text-white">Cobrança</h2>
          <select value={chargeForm.subscription_id} onChange={(e) => setChargeForm((prev) => ({ ...prev, subscription_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Assinatura opcional</option>
            {subscriptions.map((subscription) => <option key={subscription.id} value={subscription.id}>#{subscription.id}</option>)}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <select value={chargeForm.student_id} onChange={(e) => setChargeForm((prev) => ({ ...prev, student_id: e.target.value, organization_id: '' }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Aluno</option>
              {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
            </select>
            <select value={chargeForm.organization_id} onChange={(e) => setChargeForm((prev) => ({ ...prev, organization_id: e.target.value, student_id: '' }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Empresa</option>
              {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select value={chargeForm.course_id} onChange={(e) => setChargeForm((prev) => ({ ...prev, course_id: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Curso opcional</option>
              {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
            <select value={chargeForm.class_offering_id} onChange={(e) => setChargeForm((prev) => ({ ...prev, class_offering_id: e.target.value }))}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
              <option value="">Turma opcional</option>
              {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
            </select>
          </div>
          <input type="number" value={chargeForm.amount_cents} onChange={(e) => setChargeForm((prev) => ({ ...prev, amount_cents: Number(e.target.value) }))}
            placeholder="Valor em centavos"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <select value={chargeForm.payment_method} onChange={(e) => setChargeForm((prev) => ({ ...prev, payment_method: e.target.value as PaymentMethod }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="manual">Manual</option>
            <option value="pix">PIX</option>
            <option value="card">Cartão</option>
            <option value="boleto">Boleto</option>
          </select>
          <input value={chargeForm.gateway_name} onChange={(e) => setChargeForm((prev) => ({ ...prev, gateway_name: e.target.value }))}
            placeholder="Gateway"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <textarea value={chargeForm.description} onChange={(e) => setChargeForm((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
            <PlusIcon className="w-4 h-4" />
            <span>Criar cobrança</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Planos</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {plans.map((plan) => (
              <div key={plan.id} className="px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{plan.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{periodLabels[plan.billing_period]} • R$ {(plan.price_cents / 100).toFixed(2)}</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${plan.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                  {plan.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-700">
            <h2 className="font-semibold text-gray-900 dark:text-white">Cobranças</h2>
          </div>
          <div className="divide-y divide-gray-100 dark:divide-gray-700">
            {charges.map((charge) => (
              <div key={charge.id} className="px-5 py-4 flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">R$ {(charge.amount_cents / 100).toFixed(2)}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{charge.payment_method} • #{charge.id}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => markPaid(charge.id)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-green-600">
                    <CheckIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => markFailed(charge.id)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-red-600">
                    <XMarkIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
