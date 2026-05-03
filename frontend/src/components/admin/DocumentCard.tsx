'use client';

import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
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
  const downloadBase = '/api';
  const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold text-gray-900 dark:text-white">{document.title}</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{documentTypeLabels[document.document_type]} • {statusLabels[document.status]} • v{document.latest_version_number}</p>
          {document.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{document.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onUpdateStatus(document.id, document.status === 'active' ? 'archived' : 'active')}
            className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
            <ArrowPathIcon className="w-4 h-4" /><span>{document.status === 'active' ? 'Arquivar' : 'Ativar'}</span>
          </button>
          <a href={`${downloadBase}${endpoints.documents.download(document.id)}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
            <ArrowDownTrayIcon className="w-4 h-4" /><span>Baixar</span>
          </a>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Versões</h3>
          <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
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
        </div>

        <form onSubmit={(e) => { e.preventDefault(); onAddVersion(document.id); }} className="space-y-2">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Nova versão</h3>
          <input value={draft.notes} onChange={(e) => onDraftChange(document.id, { ...draft, notes: e.target.value })} placeholder="Notas" className={inputCls} />
          <input value={draft.external_url} onChange={(e) => onDraftChange(document.id, { ...draft, external_url: e.target.value })} placeholder="URL externa opcional" className={inputCls} />
          <input type="file" onChange={(e) => onDraftChange(document.id, { ...draft, file: e.target.files?.[0] ?? null })} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700" />
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
            <ArrowUpTrayIcon className="w-4 h-4" /><span>Adicionar versão</span>
          </button>
        </form>
      </div>
    </div>
  );
}
