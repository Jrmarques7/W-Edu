'use client';

import { useState } from 'react';
import { DocumentTextIcon, PlusIcon } from '@heroicons/react/24/outline';
import type { Course } from '@/types/course';
import type { ClassOffering } from '@/types/schedule';
import type { Organization, Student } from '@/types/auth';
import type { DocumentStatus, DocumentType } from '@/types/document';

const documentTypeLabels: Record<DocumentType, string> = { contract: 'Contrato', term: 'Termo', material: 'Material', policy: 'Política', template: 'Modelo', other: 'Outro' };
const statusLabels: Record<DocumentStatus, string> = { draft: 'Rascunho', active: 'Ativo', archived: 'Arquivado' };
const inputCls = 'block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white';

const emptyForm = { title: '', document_type: 'other' as DocumentType, description: '', status: 'draft' as DocumentStatus, course_id: '', class_offering_id: '', organization_id: '', student_id: '', external_reference: '', version_notes: '', external_url: '', file: null as File | null };

export default function DocumentForm({ courses, classes, organizations, students, onCreated }: {
  courses: Course[];
  classes: ClassOffering[];
  organizations: Organization[];
  students: Student[];
  onCreated: () => void;
}) {
  const [form, setForm] = useState(emptyForm);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { default: api } = await import('@/lib/api/client');
    const { endpoints } = await import('@/lib/api/endpoints');
    const toast = (await import('react-hot-toast')).default;
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
      setForm(emptyForm);
      onCreated();
    } catch { toast.error('Erro ao criar documento.'); }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <DocumentTextIcon className="w-5 h-5 text-indigo-600" />
        <h2 className="font-semibold text-gray-900 dark:text-white">Novo documento</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder="Título" className={inputCls} />
        <select value={form.document_type} onChange={(e) => setForm((p) => ({ ...p, document_type: e.target.value as DocumentType }))} className={inputCls}>
          {Object.entries(documentTypeLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as DocumentStatus }))} className={inputCls}>
          {Object.entries(statusLabels).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <input value={form.external_reference} onChange={(e) => setForm((p) => ({ ...p, external_reference: e.target.value }))} placeholder="Referência externa" className={inputCls} />
      </div>
      <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Descrição" className={inputCls} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <select value={form.course_id} onChange={(e) => setForm((p) => ({ ...p, course_id: e.target.value }))} className={inputCls}>
          <option value="">Curso</option>{courses.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.class_offering_id} onChange={(e) => setForm((p) => ({ ...p, class_offering_id: e.target.value }))} className={inputCls}>
          <option value="">Turma</option>{classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={form.organization_id} onChange={(e) => setForm((p) => ({ ...p, organization_id: e.target.value }))} className={inputCls}>
          <option value="">Empresa</option>{organizations.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
        </select>
        <select value={form.student_id} onChange={(e) => setForm((p) => ({ ...p, student_id: e.target.value }))} className={inputCls}>
          <option value="">Aluno</option>{students.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input value={form.version_notes} onChange={(e) => setForm((p) => ({ ...p, version_notes: e.target.value }))} placeholder="Notas da versão inicial" className={inputCls} />
        <input value={form.external_url} onChange={(e) => setForm((p) => ({ ...p, external_url: e.target.value }))} placeholder="URL externa" className={inputCls} />
        <input type="file" onChange={(e) => setForm((p) => ({ ...p, file: e.target.files?.[0] ?? null }))} className="block w-full text-sm text-gray-500 dark:text-gray-400 file:mr-4 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-indigo-700" />
      </div>
      <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg">
        <PlusIcon className="w-4 h-4" /><span>Criar documento</span>
      </button>
    </form>
  );
}
