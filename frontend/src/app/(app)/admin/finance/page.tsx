'use client';

import { useEffect, useState } from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { BillingPlan, Charge, Subscription } from '@/types/finance';
import type { Student, Organization } from '@/types/auth';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';
import BillingPlanForm from '@/components/admin/BillingPlanForm';
import ChargeForm from '@/components/admin/ChargeForm';
import SubscriptionForm from '@/components/admin/SubscriptionForm';

const periodLabels: Record<string, string> = { one_time: 'Avulso', monthly: 'Mensal', quarterly: 'Trimestral', yearly: 'Anual' };

export default function AdminFinancePage() {
  const { student } = useAuthStore();
  const isAdmin = student?.role === 'admin';
  const [plans, setPlans] = useState<BillingPlan[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [planRes, subRes, chargeRes, studentRes, orgRes, courseRes, classRes] = await Promise.all([
      api.get<BillingPlan[]>(endpoints.finance.plans),
      api.get<Subscription[]>(endpoints.finance.subscriptions),
      api.get<Charge[]>(endpoints.finance.charges),
      api.get<Student[]>('/admin/users'),
      api.get<Organization[]>('/admin/organizations'),
      api.get<Course[]>(endpoints.courses.list),
      api.get<ClassOffering[]>(endpoints.schedule.classes),
    ]);
    setPlans(planRes.data); setSubscriptions(subRes.data); setCharges(chargeRes.data);
    setStudents(studentRes.data); setOrganizations(orgRes.data); setCourses(courseRes.data); setClasses(classRes.data);
    setLoading(false);
  };

  useEffect(() => { load().catch(() => toast.error('Erro ao carregar financeiro.')); }, []);

  const markPaid = async (id: number) => {
    try { await api.post(endpoints.finance.chargePaid(id)); await load(); } catch { toast.error('Erro ao marcar como paga.'); }
  };
  const markFailed = async (id: number) => {
    try { await api.post(endpoints.finance.chargeFailed(id)); await load(); } catch { toast.error('Erro ao marcar como falha.'); }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Financeiro</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Planos, assinaturas e cobranças.</p>
      </div>

      {isAdmin && (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <BillingPlanForm onCreated={load} />
          <SubscriptionForm plans={plans} students={students} organizations={organizations} onCreated={load} />
          <ChargeForm subscriptions={subscriptions} students={students} organizations={organizations} courses={courses} classes={classes} onCreated={load} />
        </div>
      )}

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
                {isAdmin && (
                  <div className="flex items-center gap-2">
                    <button onClick={() => markPaid(charge.id)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-green-600"><CheckIcon className="w-4 h-4" /></button>
                    <button onClick={() => markFailed(charge.id)} className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-red-600"><XMarkIcon className="w-4 h-4" /></button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
