'use client';

import { useEffect, useState } from 'react';
import { CheckCircleIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { useAuthStore } from '@/store/authStore';
import type { StudentProfile } from '@/types/auth';

const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white';

export default function SettingsPage() {
  const { student, fetchStudent } = useAuthStore();
  const [name, setName] = useState(student?.name ?? '');
  const [profile, setProfile] = useState<Partial<StudentProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!student) return;
    setName(student.name);
    api.get<StudentProfile>(`/users/${student.id}/student-profile`)
      .then((response) => setProfile(response.data))
      .catch(() => toast.error('Erro ao carregar perfil.'))
      .finally(() => setLoading(false));
  }, [student]);

  const handleSave = async () => {
    if (!student) return;
    setSaving(true);
    try {
      await api.patch(`/users/${student.id}`, { name });
      await api.patch(`/users/${student.id}/student-profile`, {
        phone: profile.phone || null,
        document: profile.document || null,
        position: profile.position || null,
        department: profile.department || null,
        bio: profile.bio || null,
      });
      await fetchStudent();
      toast.success('Perfil atualizado.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail ?? 'Erro ao salvar perfil.');
    } finally {
      setSaving(false);
    }
  };

  if (!student) return null;

  return (
    <div className="max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-5 flex items-center space-x-3">
          <UserIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Perfil</h2>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500 dark:text-gray-400">Carregando...</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Nome
                <input value={name} onChange={(e) => setName(e.target.value)} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                E-mail
                <input value={student.email} disabled className="mt-1 block w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400" />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Telefone
                <input value={profile.phone ?? ''} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Documento
                <input value={profile.document ?? ''} onChange={(e) => setProfile((p) => ({ ...p, document: e.target.value }))} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Cargo
                <input value={profile.position ?? ''} onChange={(e) => setProfile((p) => ({ ...p, position: e.target.value }))} className={`${inputCls} mt-1`} />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Departamento
                <input value={profile.department ?? ''} onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))} className={`${inputCls} mt-1`} />
              </label>
            </div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Bio
              <textarea value={profile.bio ?? ''} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} rows={4} className={`${inputCls} mt-1`} />
            </label>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center space-x-3">
          <LockClosedIcon className="h-5 w-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Segurança</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">Alteração de senha ainda depende de endpoint dedicado.</p>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-2 flex items-center space-x-3">
          <CheckCircleIcon className="h-5 w-5 text-green-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Status da conta</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-2 w-2 rounded-full ${student.is_active ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-700 dark:text-gray-300">{student.is_active ? 'Conta ativa' : 'Conta inativa'}</span>
        </div>
      </section>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving || loading}
        className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  );
}
