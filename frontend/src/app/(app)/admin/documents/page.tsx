'use client';

import { useEffect, useState } from 'react';
import { DocumentTextIcon, PlusIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Document, DocumentStatus } from '@/types/document';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';
import type { Organization, Student } from '@/types/auth';
import DocumentCard from '@/components/admin/DocumentCard';
import DocumentForm from '@/components/admin/DocumentForm';

type VersionDraft = { notes: string; external_url: string; file: File | null };

export default function AdminDocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<number, VersionDraft>>({});
  const [loading, setLoading] = useState(true);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);

  const load = async () => {
    try {
      const [docRes, courseRes, classRes, orgRes, studentRes] = await Promise.all([
        api.get<Document[]>(endpoints.documents.list),
        api.get<Course[]>(endpoints.courses.list),
        api.get<ClassOffering[]>(endpoints.schedule.classes),
        api.get<Organization[]>('/admin/organizations'),
        api.get<Student[]>('/admin/users'),
      ]);
      setDocuments(docRes.data); setCourses(courseRes.data); setClasses(classRes.data);
      setOrganizations(orgRes.data); setStudents(studentRes.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { load().catch(() => toast.error('Erro ao carregar documentos.')); }, []);

  const updateDocument = async (documentId: number, status: DocumentStatus) => {
    try { await api.patch(endpoints.documents.detail(documentId), { status }); await load(); }
    catch { toast.error('Erro ao atualizar documento.'); }
  };

  const addVersion = async (documentId: number) => {
    const draft = drafts[documentId];
    try {
      const payload = new FormData();
      if (draft?.notes) payload.append('version_notes', draft.notes);
      if (draft?.external_url) payload.append('external_url', draft.external_url);
      if (draft?.file) payload.append('file', draft.file);
      await api.post(endpoints.documents.versions(documentId), payload);
      setDrafts((prev) => ({ ...prev, [documentId]: { notes: '', external_url: '', file: null } }));
      toast.success('Nova versão adicionada.');
      await load();
    } catch { toast.error('Erro ao adicionar versão.'); }
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Contratos, termos e materiais com versão e vínculo ao domínio.</p>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Documentos cadastrados</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Gerencie arquivos, status e histórico de versões.</p>
          </div>
          <button
            type="button"
            onClick={() => setDocumentModalOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
          >
            <PlusIcon className="h-4 w-4" />
            <span>Adicionar documento</span>
          </button>
        </div>

        {documents.length === 0 ? (
          <div className="rounded-xl border border-gray-200 bg-white p-5 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Nenhum documento cadastrado.
          </div>
        ) : (
          documents.map((doc) => (
            <DocumentCard key={doc.id} document={doc}
              draft={drafts[doc.id] ?? { notes: '', external_url: '', file: null }}
              onUpdateStatus={updateDocument} onAddVersion={addVersion}
              onDraftChange={(id, d) => setDrafts((p) => ({ ...p, [id]: d }))} />
          ))
        )}
      </div>

      {documentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="max-h-full w-full max-w-4xl overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar documento</h2>
                </div>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Cadastre o documento e sua primeira versão.</p>
              </div>
              <button
                type="button"
                onClick={() => setDocumentModalOpen(false)}
                aria-label="Fechar modal"
                className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white"
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <DocumentForm
              courses={courses}
              classes={classes}
              organizations={organizations}
              students={students}
              variant="plain"
              onCancel={() => setDocumentModalOpen(false)}
              onCreated={() => {
                setDocumentModalOpen(false);
                load();
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
