'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { CourseModule } from '@/types/course';
import ConfirmDialog from './ConfirmDialog';

interface Props {
  courseId: number;
  modules: CourseModule[];
  canDelete: boolean;
  onChanged: () => void;
}

export default function ModulesPanel({ courseId, modules, canDelete, onChanged }: Props) {
  const [moduleModal, setModuleModal] = useState<{ open: boolean; module?: CourseModule }>({ open: false });
  const [moduleToDelete, setModuleToDelete] = useState<CourseModule | null>(null);
  const [title, setTitle] = useState('');

  const openCreateModal = () => {
    setTitle('');
    setModuleModal({ open: true });
  };

  const openEditModal = (module: CourseModule) => {
    setTitle(module.title);
    setModuleModal({ open: true, module });
  };

  const saveModule = async (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      if (moduleModal.module) {
        await api.patch(endpoints.courses.moduleDetail(moduleModal.module.id), { title: trimmed });
        toast.success('Módulo atualizado.');
      } else {
        await api.post(endpoints.courses.modules(courseId), { course_id: courseId, title: trimmed, order: modules.length + 1 });
        toast.success('Módulo criado!');
      }
      setModuleModal({ open: false });
      onChanged();
    } catch { toast.error(moduleModal.module ? 'Erro ao atualizar módulo.' : 'Erro ao criar módulo.'); }
  };

  const deleteModule = async () => {
    if (!moduleToDelete) return;
    try {
      await api.delete(endpoints.courses.moduleDetail(moduleToDelete.id));
      toast.success('Módulo excluído.');
      setModuleToDelete(null);
      onChanged();
    } catch { toast.error('Erro ao excluir módulo.'); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Módulos</p>
        <button onClick={openCreateModal} className="flex items-center space-x-1 text-xs text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white font-medium">
          <PlusIcon className="w-3.5 h-3.5" /><span>Adicionar módulo</span>
        </button>
      </div>
      {modules.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {modules.map((module) => (
            <div key={module.id} className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs text-gray-600 dark:bg-gray-900 dark:text-gray-300">
              <span>{module.order}. {module.title}</span>
              <button onClick={() => openEditModal(module)} className="ml-1 rounded p-0.5 text-gray-400 hover:text-indigo-600" aria-label={`Editar módulo ${module.title}`}>
                <PencilIcon className="h-3 w-3" />
              </button>
              {canDelete && (
                <button onClick={() => setModuleToDelete(module)} className="rounded p-0.5 text-gray-400 hover:text-red-600" aria-label={`Excluir módulo ${module.title}`}>
                  <TrashIcon className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
      {moduleModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-6">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{moduleModal.module ? 'Editar módulo' : 'Adicionar módulo'}</h2>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Defina o nome do módulo.</p>
              </div>
              <button type="button" onClick={() => setModuleModal({ open: false })} aria-label="Fechar modal" className="rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 dark:hover:text-white">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={saveModule} className="space-y-4">
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                placeholder="Nome do módulo"
                className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white"
              />
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setModuleModal({ open: false })} className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Cancelar
                </button>
                <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
                  {moduleModal.module ? 'Salvar' : 'Criar módulo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {moduleToDelete && (
        <ConfirmDialog
          title="Excluir módulo"
          message="As aulas vinculadas ficarão sem módulo."
          confirmLabel="Excluir"
          danger
          onCancel={() => setModuleToDelete(null)}
          onConfirm={deleteModule}
        />
      )}
    </div>
  );
}
