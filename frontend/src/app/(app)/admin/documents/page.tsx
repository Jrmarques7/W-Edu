'use client';

import { useEffect, useState } from 'react';
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

      <DocumentForm courses={courses} classes={classes} organizations={organizations} students={students} onCreated={load} />

      <div className="space-y-4">
        {documents.map((doc) => (
          <DocumentCard key={doc.id} document={doc}
            draft={drafts[doc.id] ?? { notes: '', external_url: '', file: null }}
            onUpdateStatus={updateDocument} onAddVersion={addVersion}
            onDraftChange={(id, d) => setDrafts((p) => ({ ...p, [id]: d }))} />
        ))}
      </div>
    </div>
  );
}
