'use client';

import { useState } from 'react';
import type { LearningPath } from '@/types/course';

export default function LearningPathModal({ path, onClose, onSave }: {
  path?: LearningPath;
  onClose: () => void;
  onSave: (data: { name: string; description: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(path?.name ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, description: description || null });
    setSaving(false);
  };

  const inputCls = 'block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{path ? 'Editar trilha' : 'Nova trilha'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome" className={inputCls} />
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Descrição" className={inputCls} />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">Cancelar</button>
            <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
