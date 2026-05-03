'use client';

import { useState } from 'react';
import { BuildingOfficeIcon, PencilIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Organization } from '@/types/auth';

export default function OrganizationsSection({ organizations, isAdmin, onCreated, onEdit, showCreateForm }: {
  organizations: Organization[];
  isAdmin: boolean;
  onCreated: () => void;
  onEdit: (org: Organization) => void;
  showCreateForm?: boolean;
}) {
  const [name, setName] = useState('');
  const [legalName, setLegalName] = useState('');
  const [document, setDocument] = useState('');
  const [contactEmail, setContactEmail] = useState('');

  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500';

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const toast = (await import('react-hot-toast')).default;
    try {
      await api.post('/admin/organizations', { name, legal_name: legalName || null, document: document || null, contact_email: contactEmail || null });
      setName(''); setLegalName(''); setDocument(''); setContactEmail('');
      toast.success('Empresa criada!');
      onCreated();
    } catch (e: any) { toast.error(e.response?.data?.detail ?? 'Erro ao criar empresa.'); }
  };

  return (
    <>
      {isAdmin && showCreateForm !== false && (
        <form onSubmit={handleCreate} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Nova empresa B2B</label>
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
            <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nome da empresa" className={inputCls} />
            <input value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Razão social" className={inputCls} />
            <input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="Documento" className={inputCls} />
            <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="E-mail de contato" className={inputCls} />
          </div>
          <button className="inline-flex items-center space-x-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 dark:bg-gray-700 dark:hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors">
            <PlusIcon className="w-4 h-4" /><span>Criar empresa</span>
          </button>
        </form>
      )}

      {organizations.length > 0 && (
        <section className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-100 dark:divide-gray-700">
          {organizations.map((org) => (
            <div key={org.id} className="flex items-center justify-between px-5 py-4 gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 bg-gray-900 dark:bg-gray-700 rounded-lg flex items-center justify-center shrink-0">
                  <BuildingOfficeIcon className="w-5 h-5 text-white" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{org.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {[org.legal_name, org.document, org.contact_email].filter(Boolean).join(' · ') || 'Sem dados adicionais'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${org.is_active ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                  {org.is_active ? 'Ativa' : 'Inativa'}
                </span>
                {isAdmin && (
                  <button type="button" onClick={() => onEdit(org)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </section>
      )}
    </>
  );
}
