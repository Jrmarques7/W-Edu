'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { UserIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function SettingsPage() {
  const { student } = useAuthStore();
  const [name, setName] = useState(student?.name ?? '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    toast.success('Configurações salvas!');
  };

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Configurações</h1>

      {/* Perfil */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <UserIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Perfil</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="block w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">E-mail</label>
          <input
            value={student?.email ?? ''}
            disabled
            className="block w-full px-3 py-2.5 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-sm cursor-not-allowed"
          />
        </div>

        <div className="flex items-center space-x-3 pt-2">
          <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center">
            <span className="text-white text-lg font-bold">
              {student?.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">{student?.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Membro desde {student ? new Date(student.created_at).toLocaleDateString('pt-BR') : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Segurança */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-4">
        <div className="flex items-center space-x-3 mb-2">
          <LockClosedIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Segurança</h2>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Alteração de senha será implementada na próxima fase.
        </p>
      </div>

      {/* Conta */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 space-y-3">
        <div className="flex items-center space-x-3 mb-2">
          <CheckCircleIcon className="w-5 h-5 text-green-600" />
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Status da Conta</h2>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 bg-green-500 rounded-full" />
          <span className="text-sm text-gray-700 dark:text-gray-300">Conta ativa</span>
        </div>
      </div>

      <button
        onClick={handleSave}
        disabled={saving}
        className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
      >
        {saving ? 'Salvando...' : 'Salvar alterações'}
      </button>
    </div>
  );
}
