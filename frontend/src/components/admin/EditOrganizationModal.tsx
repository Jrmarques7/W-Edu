'use client';

import { useState } from 'react';
import type { Organization } from '@/types/auth';

export default function EditOrganizationModal({ organization, onClose, onSave }: {
  organization: Organization;
  onClose: () => void;
  onSave: (id: number, data: { name: string; legal_name: string | null; document: string | null; contact_email: string | null; is_active: boolean }) => Promise<void>;
}) {
  const [name, setName] = useState(organization.name);
  const [legalName, setLegalName] = useState(organization.legal_name ?? '');
  const [document, setDocument] = useState(organization.document ?? '');
  const [contactEmail, setContactEmail] = useState(organization.contact_email ?? '');
  const [isActive, setIsActive] = useState(organization.is_active);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave(organization.id, {
      name,
      legal_name: legalName || null,
      document: document || null,
      contact_email: contactEmail || null,
      is_active: isActive,
    });
    setSaving(false);
  };

  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Editar empresa</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome" className={inputCls} />
          <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razão social" className={inputCls} />
          <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Documento" className={inputCls} />
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail de contato" className={inputCls} />
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500" />
            Empresa ativa
          </label>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancelar</button>
            <button type="submit" disabled={saving} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar empresa'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
