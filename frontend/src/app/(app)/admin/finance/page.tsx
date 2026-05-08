'use client';

import { useEffect, useState } from 'react';
import { BanknotesIcon, CheckIcon, CreditCardIcon, DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
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
const subscriptionStatusLabels: Record<string, string> = { active: 'Ativa', paused: 'Pausada', cancelled: 'Cancelada', overdue: 'Em atraso', completed: 'Concluída' };
const chargeStatusLabels: Record<string, string> = { pending: 'Pendente', paid: 'Paga', failed: 'Falhou', cancelled: 'Cancelada', refunded: 'Estornada' };
type FinanceTab = 'plans' | 'subscriptions' | 'charges';

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
  const [activeTab, setActiveTab] = useState<FinanceTab>('plans');
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
  const [chargeModalOpen, setChargeModalOpen] = useState(false);

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
  const createAsaasCharge = async (id: number) => {
    try {
      await api.post(endpoints.finance.chargeAsaas(id));
      await load();
      toast.success('Cobrança enviada ao Asaas.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar cobrança ao Asaas.');
    }
  };

  const tabs = [
    { id: 'plans' as FinanceTab, label: 'Planos', icon: DocumentTextIcon, badge: plans.length },
    { id: 'subscriptions' as FinanceTab, label: 'Assinaturas', icon: CreditCardIcon, badge: subscriptions.length },
    { id: 'charges' as FinanceTab, label: 'Cobranças', icon: BanknotesIcon, badge: charges.length },
  ];
  const studentName = (id: number | null) => id ? students.find((s) => s.id === id)?.name ?? `Aluno #${id}` : null;
  const organizationName = (id: number | null) => id ? organizations.find((o) => o.id === id)?.name ?? `Empresa #${id}` : null;
  const planName = (id: number | null) => id ? plans.find((p) => p.id === id)?.name ?? `Plano #${id}` : null;

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

      <div className="space-y-5">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Gestão financeira">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  aria-controls={`finance-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                    active
                      ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                  <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                    active
                      ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {tab.badge}
                  </span>
                </button>
              );
            })}
          </nav>
        </div>

        <div id={`finance-${activeTab}`} role="tabpanel">
          {activeTab === 'plans' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Planos cadastrados</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie preços, periodicidade e disponibilidade.</p>
                </div>
                {isAdmin && (
                  <button type="button" onClick={() => setPlanModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar plano</span>
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {plans.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhum plano cadastrado.</p>
                ) : (
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
                )}
              </div>
            </div>
          )}

          {activeTab === 'subscriptions' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Assinaturas cadastradas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Acompanhe vínculos recorrentes por aluno ou empresa.</p>
                </div>
                {isAdmin && (
                  <button type="button" onClick={() => setSubscriptionModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar assinatura</span>
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {subscriptions.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma assinatura cadastrada.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {subscriptions.map((subscription) => (
                      <div key={subscription.id} className="px-5 py-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{planName(subscription.billing_plan_id)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {studentName(subscription.student_id) || organizationName(subscription.organization_id) || 'Sem titular'} • vence {new Date(subscription.current_period_end).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <span className={`w-fit text-xs px-2 py-1 rounded-full font-medium ${subscription.status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                          {subscriptionStatusLabels[subscription.status]}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'charges' && (
            <div className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cobranças cadastradas</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Controle cobranças avulsas e recorrentes.</p>
                </div>
                {isAdmin && (
                  <button type="button" onClick={() => setChargeModalOpen(true)} className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                    <PlusIcon className="h-4 w-4" />
                    <span>Adicionar cobrança</span>
                  </button>
                )}
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {charges.length === 0 ? (
                  <p className="p-5 text-sm text-gray-500 dark:text-gray-400">Nenhuma cobrança cadastrada.</p>
                ) : (
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {charges.map((charge) => (
                      <div key={charge.id} className="px-5 py-4 flex items-start justify-between gap-3">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">R$ {(charge.amount_cents / 100).toFixed(2)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {charge.payment_method} • #{charge.id} • {studentName(charge.student_id) || organizationName(charge.organization_id) || planName(charge.billing_plan_id) || 'Sem vínculo'}
                          </p>
                          {charge.description && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{charge.description}</p>}
                          {(charge.checkout_url || charge.bank_slip_url || charge.pix_qr_code_payload) && (
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              {charge.checkout_url && <a href={charge.checkout_url} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400">Checkout</a>}
                              {charge.bank_slip_url && <a href={charge.bank_slip_url} target="_blank" rel="noreferrer" className="font-medium text-indigo-600 dark:text-indigo-400">Boleto</a>}
                              {charge.pix_qr_code_payload && <button type="button" onClick={() => navigator.clipboard.writeText(charge.pix_qr_code_payload ?? '')} className="font-medium text-indigo-600 dark:text-indigo-400">Copiar Pix</button>}
                            </div>
                          )}
                          {charge.gateway_reference && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Gateway: {charge.gateway_name} • {charge.gateway_reference} • {charge.gateway_status ?? 'sem status'}</p>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs px-2 py-1 rounded-full font-medium ${charge.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : charge.status === 'failed' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
                            {chargeStatusLabels[charge.status]}
                          </span>
                          {isAdmin && (
                            <>
                              {charge.gateway_name === 'asaas' && (
                                <button onClick={() => createAsaasCharge(charge.id)} title="Enviar ao Asaas" className="rounded-lg border border-gray-300 px-2 py-2 text-xs font-medium text-gray-700 dark:border-gray-600 dark:text-gray-300">
                                  Asaas
                                </button>
                              )}
                              <button onClick={() => markPaid(charge.id)} title="Marcar como paga" className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-green-600"><CheckIcon className="w-4 h-4" /></button>
                              <button onClick={() => markFailed(charge.id)} title="Marcar como falha" className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 text-red-600"><XMarkIcon className="w-4 h-4" /></button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {planModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar plano</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Defina nome, preço e recorrência.</p>
              </div>
              <button type="button" onClick={() => setPlanModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <BillingPlanForm variant="plain" onCancel={() => setPlanModalOpen(false)} onCreated={() => { setPlanModalOpen(false); load(); }} />
          </div>
        </div>
      )}

      {subscriptionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-xl rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar assinatura</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Vincule um plano a aluno ou empresa.</p>
              </div>
              <button type="button" onClick={() => setSubscriptionModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <SubscriptionForm plans={plans} students={students} organizations={organizations} variant="plain" onCancel={() => setSubscriptionModalOpen(false)} onCreated={() => { setSubscriptionModalOpen(false); load(); }} />
          </div>
        </div>
      )}

      {chargeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar cobrança</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Crie uma cobrança avulsa ou vinculada a uma assinatura.</p>
              </div>
              <button type="button" onClick={() => setChargeModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <ChargeForm subscriptions={subscriptions} students={students} organizations={organizations} courses={courses} classes={classes} variant="plain" onCancel={() => setChargeModalOpen(false)} onCreated={() => { setChargeModalOpen(false); load(); }} />
          </div>
        </div>
      )}
    </div>
  );
}
