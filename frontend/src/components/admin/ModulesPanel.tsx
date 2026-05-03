'use client';

import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { CourseModule } from '@/types/course';

interface Props {
  courseId: number;
  modules: CourseModule[];
  canDelete: boolean;
  onChanged: () => void;
}

export default function ModulesPanel({ courseId, modules, canDelete, onChanged }: Props) {
  const createModule = async () => {
    const title = prompt('Nome do módulo');
    if (!title) return;
    try {
      await api.post(endpoints.courses.modules(courseId), { course_id: courseId, title, order: modules.length + 1 });
      toast.success('Módulo criado!');
      onChanged();
    } catch { toast.error('Erro ao criar módulo.'); }
  };

  const editModule = async (module: CourseModule) => {
    const title = prompt('Nome do módulo', module.title)?.trim();
    if (!title || title === module.title) return;
    try {
      await api.patch(endpoints.courses.moduleDetail(module.id), { title });
      toast.success('Módulo atualizado.');
      onChanged();
    } catch { toast.error('Erro ao atualizar módulo.'); }
  };

  const deleteModule = async (module: CourseModule) => {
    if (!confirm('Excluir este módulo? As aulas vinculadas ficarão sem módulo.')) return;
    try {
      await api.delete(endpoints.courses.moduleDetail(module.id));
      toast.success('Módulo excluído.');
      onChanged();
    } catch { toast.error('Erro ao excluir módulo.'); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulos</p>
        <button onClick={createModule} className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
          <PlusIcon className="w-3.5 h-3.5" /><span>Adicionar módulo</span>
        </button>
      </div>
      {modules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {modules.map((module) => (
            <div key={module.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
              <span>{module.order}. {module.title}</span>
              <button onClick={() => editModule(module)} className="ml-1 rounded p-0.5 text-gray-400 hover:text-indigo-600" aria-label={`Editar módulo ${module.title}`}>
                <PencilIcon className="h-3 w-3" />
              </button>
              {canDelete && (
                <button onClick={() => deleteModule(module)} className="rounded p-0.5 text-gray-400 hover:text-red-600" aria-label={`Excluir módulo ${module.title}`}>
                  <TrashIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
