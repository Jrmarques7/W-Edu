'use client';

import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { AssignmentSubmission, AssignmentSubmissionStatus } from '@/types/assignment';

const statusLabels: Record<AssignmentSubmissionStatus, string> = {
  submitted: 'Enviada',
  reviewed: 'Corrigida',
  returned: 'Devolvida',
};

export default function AssignmentSubmissionsPanel({ lessonId }: { lessonId: number }) {
  const [submissions, setSubmissions] = useState<AssignmentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [drafts, setDrafts] = useState<Record<number, { status: AssignmentSubmissionStatus; score: string; feedback: string }>>({});

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AssignmentSubmission[]>(endpoints.assignments.submissions(lessonId));
      setSubmissions(data);
      setDrafts(Object.fromEntries(data.map((submission) => [
        submission.id,
        {
          status: submission.status,
          score: submission.score === null ? '' : String(submission.score),
          feedback: submission.feedback ?? '',
        },
      ])));
    } catch {
      toast.error('Erro ao carregar entregas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [lessonId]);

  const updateDraft = (submissionId: number, patch: Partial<{ status: AssignmentSubmissionStatus; score: string; feedback: string }>) => {
    setDrafts((current) => ({ ...current, [submissionId]: { ...current[submissionId], ...patch } }));
  };

  const save = async (submissionId: number) => {
    const draft = drafts[submissionId];
    if (!draft) return;
    const score = draft.score.trim() === '' ? null : Number(draft.score);
    if (score !== null && (Number.isNaN(score) || score < 0 || score > 100)) {
      toast.error('Nota deve ficar entre 0 e 100.');
      return;
    }
    setSavingId(submissionId);
    try {
      const { data } = await api.patch<AssignmentSubmission>(endpoints.assignments.review(submissionId), {
        status: draft.status,
        score,
        feedback: draft.feedback.trim() || null,
      });
      setSubmissions((current) => current.map((submission) => submission.id === submissionId ? data : submission));
      toast.success('Entrega corrigida.');
    } catch {
      toast.error('Erro ao salvar correção.');
    } finally {
      setSavingId(null);
    }
  };

  const download = async (submission: AssignmentSubmission) => {
    if (!submission.file_name) return;
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

  if (loading) return <p className="p-3 text-xs text-gray-500 dark:text-gray-400">Carregando entregas...</p>;
  if (submissions.length === 0) return <p className="p-3 text-xs text-gray-500 dark:text-gray-400">Nenhuma entrega enviada.</p>;

  return (
    <div className="divide-y divide-gray-100 dark:divide-gray-700">
      {submissions.map((submission) => {
        const draft = drafts[submission.id];
        return (
          <div key={submission.id} className="space-y-3 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white">Aluno #{submission.student_id}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {statusLabels[submission.status]} em {new Date(submission.submitted_at).toLocaleString('pt-BR')}
                </p>
              </div>
              {submission.file_name && (
                <button type="button" onClick={() => download(submission)} className="w-fit rounded-lg border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Baixar arquivo
                </button>
              )}
            </div>
            {submission.text && (
              <p className="rounded-lg bg-gray-50 p-3 text-sm text-gray-700 dark:bg-gray-900 dark:text-gray-300 whitespace-pre-wrap">{submission.text}</p>
            )}
            {draft && (
              <div className="grid grid-cols-1 gap-2 md:grid-cols-[140px_100px_1fr_auto] md:items-start">
                <select
                  value={draft.status}
                  onChange={(event) => updateDraft(submission.id, { status: event.target.value as AssignmentSubmissionStatus })}
                  className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                >
                  <option value="submitted">Enviada</option>
                  <option value="reviewed">Corrigida</option>
                  <option value="returned">Devolvida</option>
                </select>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={draft.score}
                  onChange={(event) => updateDraft(submission.id, { score: event.target.value })}
                  placeholder="Nota"
                  className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <textarea
                  rows={2}
                  value={draft.feedback}
                  onChange={(event) => updateDraft(submission.id, { feedback: event.target.value })}
                  placeholder="Feedback"
                  className="rounded-lg border border-gray-300 bg-white px-2 py-2 text-xs text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
                />
                <button
                  type="button"
                  onClick={() => save(submission.id)}
                  disabled={savingId === submission.id}
                  className="rounded-lg bg-indigo-600 px-3 py-2 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingId === submission.id ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
