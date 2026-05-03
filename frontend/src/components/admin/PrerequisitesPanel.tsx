'use client';

import { useState } from 'react';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course, CoursePrerequisite } from '@/types/course';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  courseId: number;
  courses: Course[];
  prerequisites: CoursePrerequisite[];
  canDelete: boolean;
  onChanged: () => void;
}

export default function PrerequisitesPanel({ courseId, courses, prerequisites, canDelete, onChanged }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [prerequisiteToDelete, setPrerequisiteToDelete] = useState<number | null>(null);
  const prerequisiteIds = new Set(prerequisites.map((item) => item.prerequisite_course_id));
  const options = courses.filter((c) => c.id !== courseId && !prerequisiteIds.has(c.id));

  const openModal = () => {
    if (options.length === 0) { toast.error('Crie outro curso antes de cadastrar pré-requisito.'); return; }
    setSelectedCourseId('');
    setModalOpen(true);
  };

  const addPrerequisite = async () => {
    const prerequisiteCourseId = Number(selectedCourseId);
    if (!Number.isInteger(prerequisiteCourseId) || !options.some((c) => c.id === prerequisiteCourseId)) {
      toast.error('Curso pré-requisito inválido.'); return;
    }
    try {
      await api.post(endpoints.courses.prerequisites(courseId), { prerequisite_course_id: prerequisiteCourseId });
      toast.success('Pré-requisito adicionado.');
      setModalOpen(false);
      onChanged();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? 'Erro ao adicionar pré-requisito.');
    }
  };

  const deletePrerequisite = async () => {
    if (!prerequisiteToDelete) return;
    try {
      await api.delete(`${endpoints.courses.prerequisites(courseId)}/${prerequisiteToDelete}`);
      toast.success('Pré-requisito removido.');
      setPrerequisiteToDelete(null);
      onChanged();
    } catch { toast.error('Erro ao remover pré-requisito.'); }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pré-requisitos</p>
        <button onClick={openModal} className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
          <PlusIcon className="w-3.5 h-3.5" /><span>Adicionar</span>
        </button>
      </div>
      {prerequisites.length === 0 ? (
        <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
          Nenhum pré-requisito cadastrado.
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {prerequisites.map((prereq) => {
            const prereqCourse = courses.find((c) => c.id === prereq.prerequisite_course_id);
            return (
              <div key={prereq.id} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span>{prereqCourse?.name ?? `Curso #${prereq.prerequisite_course_id}`}</span>
                {canDelete && (
                  <button onClick={() => setPrerequisiteToDelete(prereq.prerequisite_course_id)} className="rounded p-0.5 text-gray-400 hover:text-red-600" aria-label={`Remover pré-requisito ${prereqCourse?.name}`}>
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Adicionar pré-requisito</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Escolha o curso necessário antes deste.</p>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <select value={selectedCourseId} onChange={(e) => setSelectedCourseId(e.target.value)} className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white">
              <option value="">Selecione um curso</option>
              {options.map((course) => <option key={course.id} value={course.id}>{course.name}</option>)}
            </select>
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Cancelar
              </button>
              <button type="button" onClick={addPrerequisite} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
      {prerequisiteToDelete && (
        <ConfirmDialog
          title="Remover pré-requisito"
          message="Este curso deixará de ser exigido antes do curso atual."
          confirmLabel="Remover"
          danger
          onCancel={() => setPrerequisiteToDelete(null)}
          onConfirm={deletePrerequisite}
        />
      )}
    </div>
  );
}
