'use client';

import { useState } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, ChevronDownIcon, ChevronUpIcon, DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { endpoints } from '@/lib/api/endpoints';
import type { Document, DocumentStatus, DocumentType } from '@/types/document';

const documentTypeLabels: Record<DocumentType, string> = { contract: 'Contrato', term: 'Termo', material: 'Material', policy: 'Política', template: 'Modelo', other: 'Outro' };
const statusLabels: Record<DocumentStatus, string> = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' };

type VersionDraft = { notes: string; external_url: string; file: File | null };

export default function DocumentCard({ document, draft, onUpdateStatus, onAddVersion, onDraftChange }: {
  document: Document;
  draft: VersionDraft;
  onUpdateStatus: (id: number, status: DocumentStatus) => void;
  onAddVersion: (id: number) => void;
  onDraftChange: (id: number, draft: VersionDraft) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [versionModalOpen, setVersionModalOpen] = useState(false);
  const downloadBase = '/api';
  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';
  const statusCls = document.status === 'active'
    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    : document.status === 'archived'
      ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
      : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{document.title}</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {documentTypeLabels[document.document_type]} • v{document.latest_version_number} • {document.versions.length} {document.versions.length === 1 ? 'versão' : 'versões'}
          </p>
          {document.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{document.description}</p>}
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusCls}`}>
            {statusLabels[document.status]}
          </span>
          <button onClick={() => onUpdateStatus(document.id, document.status === 'active' ? 'archived' : 'active')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
            <ArrowPathIcon className="w-4 h-4" /><span>{document.status === 'active' ? 'Arquivar' : 'Ativar'}</span>
          </button>
          <a href={`${downloadBase}${endpoints.documents.download(document.id)}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
            <ArrowDownTrayIcon className="w-4 h-4" /><span>Baixar</span>
          </a>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:border-gray-600 dark:text-gray-200"
        >
          {expanded ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
          <span>{expanded ? 'Ocultar versões' : 'Ver versões'}</span>
        </button>
        <button
          type="button"
          onClick={() => setVersionModalOpen(true)}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          <PlusIcon className="w-4 h-4" />
          <span>Adicionar versão</span>
        </button>
      </div>

      {expanded && (
        <div className="divide-y divide-gray-100 rounded-lg border border-gray-200 dark:divide-gray-700 dark:border-gray-700">
          {document.versions.map((v) => (
            <div key={v.id} className="p-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Versão {v.version_number}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{v.file_name || v.external_url || 'Arquivo externo'} • {v.file_size ? `${(v.file_size / 1024).toFixed(1)} KB` : 'sem tamanho'}</p>
              </div>
              <a href={`${downloadBase}${endpoints.documents.versionDownload(document.id, v.id)}`} className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                <ArrowDownTrayIcon className="w-4 h-4" /><span>Baixar</span>
              </a>
            </div>
          ))}
          {!document.versions.length && <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Sem versões.</div>}
        </div>
      )}

      {versionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar versão</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{document.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setVersionModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); onAddVersion(document.id); setVersionModalOpen(false); }} className="space-y-4">
              <input value={draft.notes} onChange={(e) => onDraftChange(document.id, { ...draft, notes: e.target.value })} placeholder="Notas" className={inputCls} />
              <input value={draft.external_url} onChange={(e) => onDraftChange(document.id, { ...draft, external_url: e.target.value })} placeholder="URL externa opcional" className={inputCls} />
              <input type="file" onChange={(e) => onDraftChange(document.id, { ...draft, file: e.target.files?.[0] ?? null })} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700" />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setVersionModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white">
                  Cancelar
                </button>
                <button className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  <ArrowUpTrayIcon className="w-4 h-4" /><span>Adicionar versão</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
