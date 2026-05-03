'use client';

import { useEffect, useMemo, useState } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon, ArrowUpTrayIcon, DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Document, DocumentStatus, DocumentType } from '@/types/document';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';
import type { Organization, Student } from '@/types/auth';

const documentTypeLabels: Record<DocumentType, string> = {
  contract: 'Contrato',
  term: 'Termo',
  material: 'Material',
  policy: 'Política',
  template: 'Modelo',
  other: 'Outro',
};

const statusLabels: Record<DocumentStatus, string> = {
  draft: 'Rascunho',
  active: 'Ativo',
  archived: 'Arquivado',
};

type VersionDraft = {
  notes: string;
  external_url: string;
  file: File | null;
};

export default function AdminDocumentsPage() {
  const downloadBase = '/api';
  const [documents, setDocuments] = useState<Document[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [classes, setClasses] = useState<ClassOffering[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [drafts, setDrafts] = useState<Record<number, VersionDraft>>({});
  const [form, setForm] = useState({
    title: '',
    document_type: 'other' as DocumentType,
    description: '',
    status: 'draft' as DocumentStatus,
    course_id: '',
    class_offering_id: '',
    organization_id: '',
    student_id: '',
    external_reference: '',
    version_notes: '',
    external_url: '',
    file: null as File | null,
  });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const [docRes, courseRes, classRes, orgRes, studentRes] = await Promise.all([
        api.get<Document[]>(endpoints.documents.list),
        api.get<Course[]>(endpoints.courses.list),
        api.get<ClassOffering[]>(endpoints.schedule.classes),
        api.get<Organization[]>('/admin/organizations'),
        api.get<Student[]>('/admin/users'),
      ]);
      setDocuments(docRes.data);
      setCourses(courseRes.data);
      setClasses(classRes.data);
      setOrganizations(orgRes.data);
      setStudents(studentRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load().catch(() => toast.error('Erro ao carregar documentos.'));
  }, []);

  const resetForm = () =>
    setForm({
      title: '',
      document_type: 'other',
      description: '',
      status: 'draft',
      course_id: '',
      class_offering_id: '',
      organization_id: '',
      student_id: '',
      external_reference: '',
      version_notes: '',
      external_url: '',
      file: null,
    });

  const createDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = new FormData();
      payload.append('title', form.title);
      payload.append('document_type', form.document_type);
      payload.append('status', form.status);
      if (form.description) payload.append('description', form.description);
      if (form.course_id) payload.append('course_id', form.course_id);
      if (form.class_offering_id) payload.append('class_offering_id', form.class_offering_id);
      if (form.organization_id) payload.append('organization_id', form.organization_id);
      if (form.student_id) payload.append('student_id', form.student_id);
      if (form.external_reference) payload.append('external_reference', form.external_reference);
      if (form.version_notes) payload.append('version_notes', form.version_notes);
      if (form.external_url) payload.append('external_url', form.external_url);
      if (form.file) payload.append('file', form.file);
      await api.post(endpoints.documents.list, payload);
      toast.success('Documento criado.');
      resetForm();
      await load();
    } catch {
      toast.error('Erro ao criar documento.');
    }
  };

  const updateDocument = async (documentId: number, status: DocumentStatus) => {
    try {
      await api.patch(endpoints.documents.detail(documentId), { status });
      await load();
    } catch {
      toast.error('Erro ao atualizar documento.');
    }
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
    } catch {
      toast.error('Erro ao adicionar versão.');
    }
  };

  const typeOptions = useMemo(
    () => Object.entries(documentTypeLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>),
    []
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documentos</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Contratos, termos e materiais com versão e vínculo ao domínio.</p>
      </div>

      <form onSubmit={createDocument} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Novo documento</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input value={form.title} onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Título"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <select value={form.document_type} onChange={(e) => setForm((prev) => ({ ...prev, document_type: e.target.value as DocumentType }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            {typeOptions}
          </select>
          <select value={form.status} onChange={(e) => setForm((prev) => ({ ...prev, status: e.target.value as DocumentStatus }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
          </select>
          <input value={form.external_reference} onChange={(e) => setForm((prev) => ({ ...prev, external_reference: e.target.value }))}
            placeholder="Referência externa"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
        </div>
        <textarea value={form.description} onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
          placeholder="Descrição"
          className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select value={form.course_id} onChange={(e) => setForm((prev) => ({ ...prev, course_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Curso</option>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
          </select>
          <select value={form.class_offering_id} onChange={(e) => setForm((prev) => ({ ...prev, class_offering_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Turma</option>
            {classes.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
          </select>
          <select value={form.organization_id} onChange={(e) => setForm((prev) => ({ ...prev, organization_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Empresa</option>
            {organizations.map((org) => <option key={org.id} value={org.id}>{org.name}</option>)}
          </select>
          <select value={form.student_id} onChange={(e) => setForm((prev) => ({ ...prev, student_id: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white">
            <option value="">Aluno</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.name}</option>)}
          </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input value={form.version_notes} onChange={(e) => setForm((prev) => ({ ...prev, version_notes: e.target.value }))}
            placeholder="Notas da versão inicial"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <input value={form.external_url} onChange={(e) => setForm((prev) => ({ ...prev, external_url: e.target.value }))}
            placeholder="URL externa"
            className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white" />
          <input type="file" onChange={(e) => setForm((prev) => ({ ...prev, file: e.target.files?.[0] ?? null }))}
            className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700" />
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
          <PlusIcon className="w-4 h-4" />
          <span>Criar documento</span>
        </button>
      </form>

      <div className="space-y-4">
        {documents.map((document) => (
          <div key={document.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
                  <h2 className="font-semibold text-gray-900 dark:text-white">{document.title}</h2>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {documentTypeLabels[document.document_type]} • {statusLabels[document.status]} • v{document.latest_version_number}
                </p>
                {document.description && <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{document.description}</p>}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => updateDocument(document.id, document.status === 'active' ? 'archived' : 'active')}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  <ArrowPathIcon className="w-4 h-4" />
                  <span>{document.status === 'active' ? 'Arquivar' : 'Ativar'}</span>
                </button>
                <a href={`${downloadBase}${endpoints.documents.download(document.id)}`} className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                  <ArrowDownTrayIcon className="w-4 h-4" />
                  <span>Baixar</span>
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Versões</h3>
                <div className="divide-y divide-gray-100 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg">
                  {document.versions.map((version) => (
                    <div key={version.id} className="p-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">Versão {version.version_number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {version.file_name || version.external_url || 'Arquivo externo'} • {version.file_size ? `${(version.file_size / 1024).toFixed(1)} KB` : 'sem tamanho'}
                        </p>
                      </div>
                      <a href={`${downloadBase}${endpoints.documents.versionDownload(document.id, version.id)}`}
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200">
                        <ArrowDownTrayIcon className="w-4 h-4" />
                        <span>Baixar</span>
                      </a>
                    </div>
                  ))}
                  {!document.versions.length && (
                    <div className="p-3 text-sm text-gray-500 dark:text-gray-400">Sem versões.</div>
                  )}
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  addVersion(document.id);
                }}
                className="space-y-2"
              >
                <h3 className="text-sm font-medium text-gray-900 dark:text-white">Nova versão</h3>
                <input
                  value={drafts[document.id]?.notes ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [document.id]: { notes: e.target.value, external_url: prev[document.id]?.external_url ?? '', file: prev[document.id]?.file ?? null } }))}
                  placeholder="Notas"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
                <input
                  value={drafts[document.id]?.external_url ?? ''}
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [document.id]: { notes: prev[document.id]?.notes ?? '', external_url: e.target.value, file: prev[document.id]?.file ?? null } }))}
                  placeholder="URL externa opcional"
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white"
                />
                <input
                  type="file"
                  onChange={(e) => setDrafts((prev) => ({ ...prev, [document.id]: { notes: prev[document.id]?.notes ?? '', external_url: prev[document.id]?.external_url ?? '', file: e.target.files?.[0] ?? null } }))}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700"
                />
                <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
                  <ArrowUpTrayIcon className="w-4 h-4" />
                  <span>Adicionar versão</span>
                </button>
              </form>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
