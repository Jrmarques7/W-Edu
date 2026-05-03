'use client';

import { PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course, CoursePrerequisite } from '@/types/course';

interface Props {
  courseId: number;
  courses: Course[];
  prerequisites: CoursePrerequisite[];
  canDelete: boolean;
  onChanged: () => void;
}

export default function PrerequisitesPanel({ courseId, courses, prerequisites, canDelete, onChanged }: Props) {
  const addPrerequisite = async () => {
    const options = courses.filter((c) => c.id !== courseId);
    if (options.length === 0) { toast.error('Crie outro curso antes de cadastrar pré-requisito.'); return; }
    const selected = prompt(`ID do curso pré-requisito:\n${options.map((c) => `${c.id} - ${c.name}`).join('\n')}`);
    if (!selected) return;
    const prerequisiteCourseId = Number(selected);
    if (!Number.isInteger(prerequisiteCourseId) || !options.some((c) => c.id === prerequisiteCourseId)) {
      toast.error('Curso pré-requisito inválido.'); return;
    }
    try {
      await api.post(endpoints.courses.prerequisites(courseId), { prerequisite_course_id: prerequisiteCourseId });
      toast.success('Pré-requisito adicionado.');
      onChanged();
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? 'Erro ao adicionar pré-requisito.');
    }
  };

  const deletePrerequisite = async (prerequisiteCourseId: number) => {
    if (!confirm('Remover este pré-requisito?')) return;
    try {
      await api.delete(`${endpoints.courses.prerequisites(courseId)}/${prerequisiteCourseId}`);
      toast.success('Pré-requisito removido.');
      onChanged();
    } catch { toast.error('Erro ao remover pré-requisito.'); }
  };

  return (
    <div className="rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Pré-requisitos</p>
        <button onClick={addPrerequisite} className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
          <PlusIcon className="w-3.5 h-3.5" /><span>Adicionar</span>
        </button>
      </div>
      {prerequisites.length === 0 ? (
        <p className="mt-2 text-sm text-gray-400">Nenhum pré-requisito cadastrado.</p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {prerequisites.map((prereq) => {
            const prereqCourse = courses.find((c) => c.id === prereq.prerequisite_course_id);
            return (
              <div key={prereq.id} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                <span>{prereqCourse?.name ?? `Curso #${prereq.prerequisite_course_id}`}</span>
                {canDelete && (
                  <button onClick={() => deletePrerequisite(prereq.prerequisite_course_id)} className="rounded p-0.5 text-gray-400 hover:text-red-600" aria-label={`Remover pré-requisito ${prereqCourse?.name}`}>
                    <TrashIcon className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
