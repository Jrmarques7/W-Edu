'use client';

import { useEffect, useState } from 'react';
import { DocumentArrowUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { AssignmentSubmission } from '@/types/assignment';

const statusLabels: Record<AssignmentSubmission['status'], string> = {
  submitted: 'Enviada',
  reviewed: 'Corrigida',
  returned: 'Devolvida',
};

export default function LessonAssignmentSection({ lessonId }: { lessonId: number }) {
  const [submission, setSubmission] = useState<AssignmentSubmission | null>(null);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get<AssignmentSubmission | null>(endpoints.assignments.mine(lessonId))
      .then(({ data }) => {
        setSubmission(data);
        setText(data?.text ?? '');
      })
      .catch(() => toast.error('Erro ao carregar entrega.'))
      .finally(() => setLoading(false));
  }, [lessonId]);

  const submit = async () => {
    if (!text.trim() && !file) {
      toast.error('Informe texto ou arquivo para enviar.');
      return;
    }
    setSubmitting(true);
    const payload = new FormData();
    if (text.trim()) payload.append('text', text.trim());
    if (file) payload.append('file', file);
    try {
      const { data } = await api.post<AssignmentSubmission>(endpoints.assignments.submit(lessonId), payload);
      setSubmission(data);
      setFile(null);
      toast.success('Entrega enviada.');
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Erro ao enviar entrega.');
    } finally {
      setSubmitting(false);
    }
  };

  const download = async () => {
    if (!submission?.file_name) return;
    try {
      const { data } = await api.get(endpoints.assignments.download(submission.id), { responseType: 'blob' });
      const url = URL.createObjectURL(data);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = submission.file_name;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error('Erro ao baixar arquivo.');
    }
  };

  if (loading) return null;

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
      <div className="mb-4 flex items-center gap-2">
        <DocumentArrowUpIcon className="h-5 w-5 text-indigo-600" />
        <h2 className="text-base font-semibold text-gray-900 dark:text-white">Entrega da atividade</h2>
      </div>
      {submission && (
        <div className="mb-4 rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300">
          <p>Status: {statusLabels[submission.status]}</p>
          <p>Enviada em {new Date(submission.submitted_at).toLocaleString('pt-BR')}</p>
          {submission.score !== null && <p>Nota: {submission.score}/100</p>}
          {submission.feedback && <p className="mt-2">Feedback: {submission.feedback}</p>}
          {submission.file_name && (
            <button type="button" onClick={download} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
              Baixar arquivo enviado
            </button>
          )}
        </div>
      )}
      <textarea
        value={text}
        onChange={(event) => setText(event.target.value)}
        rows={5}
        placeholder="Escreva sua resposta ou observações da entrega"
        className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
      />
      <input
        type="file"
        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
        className="mt-3 block w-full text-sm text-gray-600 file:mr-3 file:rounded-lg file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-gray-700 hover:file:bg-gray-200 dark:text-gray-300 dark:file:bg-gray-700 dark:file:text-gray-200"
      />
      <button
        type="button"
        onClick={submit}
        disabled={submitting}
        className="mt-4 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700 disabled:opacity-50"
      >
        {submitting ? 'Enviando...' : submission ? 'Reenviar atividade' : 'Enviar atividade'}
      </button>
    </div>
  );
}
