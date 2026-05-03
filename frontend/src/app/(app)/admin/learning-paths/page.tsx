'use client';

import { useEffect, useState } from 'react';
import { AcademicCapIcon, PlusIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, LearningPath, LearningPathCourse } from '@/types/course';
import LearningPathCard from '@/components/admin/LearningPathCard';
import LearningPathModal from '@/components/admin/LearningPathModal';

export default function AdminLearningPathsPage() {
  const { student } = useAuthStore();
  const canDelete = student?.role === 'admin';
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [pathCourses, setPathCourses] = useState<Record<number, LearningPathCourse[]>>({});
  const [modal, setModal] = useState<{ open: boolean; path?: LearningPath }>({ open: false });
  const [loading, setLoading] = useState(true);

  const loadPathCourses = async (pathId: number) => {
    const { data } = await api.get<LearningPathCourse[]>(endpoints.learningPaths.courses(pathId));
    setPathCourses((prev) => ({ ...prev, [pathId]: data }));
  };

  const load = async () => {
    const [pathRes, courseRes] = await Promise.all([
      api.get<LearningPath[]>(endpoints.learningPaths.list),
      api.get<Course[]>(endpoints.courses.list),
    ]);
    setPaths(pathRes.data);
    setCourses(courseRes.data);
    setLoading(false);
    await Promise.all(pathRes.data.map((p) => loadPathCourses(p.id)));
  };

  useEffect(() => { load().catch(() => toast.error('Erro ao carregar trilhas.')); }, []);

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
    } catch { toast.error('Erro ao salvar trilha.'); }
  };

  const deletePath = async (pathId: number) => {
    if (!confirm('Excluir esta trilha?')) return;
    try { await api.delete(endpoints.learningPaths.detail(pathId)); toast.success('Trilha excluída.'); await load(); }
    catch { toast.error('Erro ao excluir trilha.'); }
  };

  const addCourse = async (pathId: number) => {
    const linkedIds = new Set((pathCourses[pathId] ?? []).map((item) => item.course_id));
    const options = courses.filter((c) => !linkedIds.has(c.id));
    if (!options.length) { toast.error('Não há cursos disponíveis para adicionar.'); return; }
    const selected = prompt(`ID do curso:\n${options.map((c) => `${c.id} - ${c.name}`).join('\n')}`);
    if (!selected) return;
    const courseId = Number(selected);
    if (!Number.isInteger(courseId) || !options.some((c) => c.id === courseId)) { toast.error('Curso inválido.'); return; }
    try {
      const order = (pathCourses[pathId]?.length ?? 0) + 1;
      await api.post(endpoints.learningPaths.courses(pathId), { course_id: courseId, order });
      toast.success('Curso adicionado.');
      await loadPathCourses(pathId);
    } catch (e: any) { toast.error(e?.response?.data?.detail ?? 'Erro ao adicionar curso.'); }
  };

  const removeCourse = async (pathId: number, courseId: number) => {
    if (!confirm('Remover este curso da trilha?')) return;
    try { await api.delete(`${endpoints.learningPaths.courses(pathId)}/${courseId}`); toast.success('Curso removido.'); await loadPathCourses(pathId); }
    catch { toast.error('Erro ao remover curso.'); }
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
        <button onClick={() => setModal({ open: true })} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
          <PlusIcon className="h-4 w-4" /><span>Nova trilha</span>
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
            <LearningPathCard key={path.id} path={path} courses={courses} pathCourses={pathCourses[path.id] ?? []}
              canDelete={canDelete ?? false} onEdit={(p) => setModal({ open: true, path: p })} onDelete={deletePath}
              onAddCourse={addCourse} onRemoveCourse={removeCourse} />
          ))}
        </div>
      )}

      {modal.open && <LearningPathModal path={modal.path} onClose={() => setModal({ open: false })} onSave={savePath} />}
    </div>
  );
}
