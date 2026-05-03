'use client';

import { useEffect, useState } from 'react';
import { AcademicCapIcon, PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, LearningPath, LearningPathCourse } from '@/types/course';

function PathModal({ path, onClose, onSave }: {
  path?: LearningPath;
  onClose: () => void;
  onSave: (data: { name: string; description: string | null }) => Promise<void>;
}) {
  const [name, setName] = useState(path?.name ?? '');
  const [description, setDescription] = useState(path?.description ?? '');
  const [saving, setSaving] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    await onSave({ name, description: description || null });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-800">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{path ? 'Editar trilha' : 'Nova trilha'}</h2>
        <form onSubmit={submit} className="mt-4 space-y-4">
          <input value={name} onChange={(event) => setName(event.target.value)} required placeholder="Nome"
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
          <textarea value={description} onChange={(event) => setDescription(event.target.value)} rows={3} placeholder="Descrição"
            className="block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 dark:border-gray-600 dark:bg-gray-900 dark:text-white" />
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300">Cancelar</button>
            <button disabled={saving} className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminLearningPathsPage() {
  const { student } = useAuthStore();
  const canDelete = student?.role === 'admin';
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pathCourses, setPathCourses] = useState<Record<number, LearningPathCourse[]>>({});
  const [modal, setModal] = useState<{ open: boolean; path?: LearningPath }>({ open: false });
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const [pathRes, courseRes] = await Promise.all([
      api.get<LearningPath[]>(endpoints.learningPaths.list),
      api.get<Course[]>(endpoints.courses.list),
    ]);
    setPaths(pathRes.data);
    setCourses(courseRes.data);
    setLoading(false);
    await Promise.all(pathRes.data.map((path) => loadPathCourses(path.id)));
  };

  const loadPathCourses = async (pathId: number) => {
    const { data } = await api.get<LearningPathCourse[]>(endpoints.learningPaths.courses(pathId));
    setPathCourses((prev) => ({ ...prev, [pathId]: data }));
  };

  useEffect(() => {
    load().catch(() => toast.error('Erro ao carregar trilhas.'));
  }, []);

  const savePath = async (data: { name: string; description: string | null }) => {
    try {
      if (modal.path) {
        await api.patch(endpoints.learningPaths.detail(modal.path.id), data);
        toast.success('Trilha atualizada.');
      } else {
        await api.post(endpoints.learningPaths.list, data);
        toast.success('Trilha criada.');
      }
      setModal({ open: false });
      await load();
    } catch {
      toast.error('Erro ao salvar trilha.');
    }
  };

  const deletePath = async (pathId: number) => {
    if (!confirm('Excluir esta trilha?')) return;
    try {
      await api.delete(endpoints.learningPaths.detail(pathId));
      toast.success('Trilha excluída.');
      await load();
    } catch {
      toast.error('Erro ao excluir trilha.');
    }
  };

  const addCourse = async (pathId: number) => {
    const linkedIds = new Set((pathCourses[pathId] ?? []).map((item) => item.course_id));
    const options = courses.filter((course) => !linkedIds.has(course.id));
    if (!options.length) {
      toast.error('Não há cursos disponíveis para adicionar.');
      return;
    }
    const selected = prompt(`ID do curso:\n${options.map((course) => `${course.id} - ${course.name}`).join('\n')}`);
    if (!selected) return;
    const courseId = Number(selected);
    if (!Number.isInteger(courseId) || !options.some((course) => course.id === courseId)) {
      toast.error('Curso inválido.');
      return;
    }
    try {
      const order = (pathCourses[pathId]?.length ?? 0) + 1;
      await api.post(endpoints.learningPaths.courses(pathId), { course_id: courseId, order });
      toast.success('Curso adicionado.');
      await loadPathCourses(pathId);
    } catch (error: any) {
      toast.error(error?.response?.data?.detail ?? 'Erro ao adicionar curso.');
    }
  };

  const removeCourse = async (pathId: number, courseId: number) => {
    if (!confirm('Remover este curso da trilha?')) return;
    try {
      await api.delete(`${endpoints.learningPaths.courses(pathId)}/${courseId}`);
      toast.success('Curso removido.');
      await loadPathCourses(pathId);
    } catch {
      toast.error('Erro ao remover curso.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <svg className="h-8 w-8 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
      </svg>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Trilhas</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Sequências de cursos para jornadas de aprendizagem.</p>
        </div>
        <button onClick={() => setModal({ open: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <PlusIcon className="h-4 w-4" />
          <span>Nova trilha</span>
        </button>
      </div>

      {paths.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center dark:border-gray-600 dark:bg-gray-800">
          <AcademicCapIcon className="mx-auto mb-3 h-12 w-12 text-gray-400" />
          <p className="text-gray-500 dark:text-gray-400">Nenhuma trilha criada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paths.map((path) => (
            <div key={path.id} className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="font-semibold text-gray-900 dark:text-white">{path.name}</h2>
                  {path.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{path.description}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setModal({ open: true, path })}
                    className="rounded-lg p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20">
                    <PencilIcon className="h-4 w-4" />
                  </button>
                  {canDelete && (
                    <button onClick={() => deletePath(path.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
              <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cursos da trilha</p>
                  <button onClick={() => addCourse(path.id)}
                    className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                    <PlusIcon className="h-3.5 w-3.5" />
                    <span>Adicionar curso</span>
                  </button>
                </div>
                {(pathCourses[path.id] ?? []).length === 0 ? (
                  <p className="mt-2 text-sm text-gray-400">Nenhum curso vinculado.</p>
                ) : (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(pathCourses[path.id] ?? []).map((item) => {
                      const course = courses.find((candidate) => candidate.id === item.course_id);
                      return (
                        <div key={item.id} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                          <span>{item.order}. {course?.name ?? `Curso #${item.course_id}`}</span>
                          {canDelete && (
                            <button onClick={() => removeCourse(path.id, item.course_id)}
                              className="rounded p-0.5 text-gray-400 hover:text-red-600"
                              aria-label={`Remover ${course?.name ?? item.course_id}`}>
                              <TrashIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {modal.open && <PathModal path={modal.path} onClose={() => setModal({ open: false })} onSave={savePath} />}
    </div>
  );
}
