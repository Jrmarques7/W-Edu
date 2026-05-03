'use client';

import { useEffect, useState } from 'react';
import { AcademicCapIcon, ArrowLeftIcon, BookOpenIcon, ListBulletIcon, PencilIcon, PlusIcon, QueueListIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, CourseModule, CoursePrerequisite, Lesson } from '@/types/course';
import CourseModal from '@/components/admin/CourseModal';
import ConfirmDialog from '@/components/admin/ConfirmDialog';
import LessonsPanel from '@/components/admin/LessonsPanel';
import ModulesPanel from '@/components/admin/ModulesPanel';
import PrerequisitesPanel from '@/components/admin/PrerequisitesPanel';

type CourseTab = 'modules' | 'lessons' | 'prerequisites';

const modalityLabels: Record<Course['modality'], string> = {
  online: 'Online',
  in_person: 'Presencial',
  hybrid: 'Híbrido',
};

export default function AdminCoursesPage() {
  const { student } = useAuthStore();
  const canDelete = student?.role === 'admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseModal, setCourseModal] = useState<{ open: boolean; course?: Course }>({ open: false });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [activeTab, setActiveTab] = useState<CourseTab>('modules');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const loadCourses = () =>
    api.get<Course[]>(endpoints.courses.list).then((r) => setCourses(r.data)).finally(() => setLoading(false));

  useEffect(() => { loadCourses(); }, []);

  const saveCourse = async (data: Partial<Course>) => {
    try {
      if (courseModal.course) {
        await api.patch(endpoints.courses.detail(courseModal.course.id), data);
        toast.success('Curso atualizado!');
      } else {
        await api.post(endpoints.courses.list, data);
        toast.success('Curso criado!');
      }
      setCourseModal({ open: false });
      loadCourses();
      if (courseModal.course && selectedCourse?.id === courseModal.course.id) {
        setSelectedCourse((current) => current ? { ...current, ...data } : current);
      }
    } catch { toast.error('Erro ao salvar curso.'); }
  };

  const loadLessons = async (courseId = selectedCourse?.id) => {
    if (!courseId) return;
    const { data } = await api.get<Lesson[]>(endpoints.courses.lessons(courseId));
    setLessons(data);
  };

  const loadModules = async (courseId = selectedCourse?.id) => {
    if (!courseId) return;
    const { data } = await api.get<CourseModule[]>(endpoints.courses.modules(courseId));
    setModules(data);
  };

  const loadPrerequisites = async (courseId = selectedCourse?.id) => {
    if (!courseId) return;
    const { data } = await api.get<CoursePrerequisite[]>(endpoints.courses.prerequisites(courseId));
    setPrerequisites(data);
  };

  const openCourse = async (course: Course) => {
    setSelectedCourse(course);
    setActiveTab('modules');
    setDetailLoading(true);
    try {
      await Promise.all([loadModules(course.id), loadLessons(course.id), loadPrerequisites(course.id)]);
    } catch {
      toast.error('Erro ao carregar detalhes do curso.');
    } finally {
      setDetailLoading(false);
    }
  };

  const backToCourses = () => {
    setSelectedCourse(null);
    setLessons([]);
    setModules([]);
    setPrerequisites([]);
    setActiveTab('modules');
  };

  const handleModulesChanged = async () => {
    await Promise.all([loadModules(), loadLessons()]);
  };

  const deleteCourse = async () => {
    if (!courseToDelete) return;
    try {
      await api.delete(endpoints.courses.detail(courseToDelete.id));
      toast.success('Curso excluído.');
      if (selectedCourse?.id === courseToDelete.id) backToCourses();
      setCourseToDelete(null);
      loadCourses();
    } catch { toast.error('Erro ao excluir curso.'); }
  };

  const tabs = [
    { id: 'modules' as CourseTab, label: 'Módulos', icon: QueueListIcon, badge: modules.length },
    { id: 'lessons' as CourseTab, label: 'Aulas', icon: BookOpenIcon, badge: lessons.length },
    { id: 'prerequisites' as CourseTab, label: 'Pré-requisitos', icon: ListBulletIcon, badge: prerequisites.length },
  ];

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
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Cursos</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Catálogo, módulos, aulas e pré-requisitos.</p>
        </div>
        {!selectedCourse && (
          <button onClick={() => setCourseModal({ open: true })}
            className="flex items-center justify-center space-x-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
            <PlusIcon className="w-4 h-4" />
            <span>Novo Curso</span>
          </button>
        )}
      </div>

      {!selectedCourse && courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum curso criado ainda.</p>
        </div>
      ) : !selectedCourse ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <div key={course.id} className="rounded-xl border border-gray-200 bg-white p-5 transition-colors hover:border-indigo-300 hover:bg-indigo-50/40 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700 dark:hover:bg-indigo-900/10">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                  <AcademicCapIcon className="h-5 w-5 text-indigo-600" />
                </div>
                <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                  {modalityLabels[course.modality]}
                </span>
              </div>
              <h2 className="line-clamp-2 font-semibold text-gray-900 dark:text-white">{course.name}</h2>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm text-gray-500 dark:text-gray-400">
                {course.description || 'Sem descrição cadastrada.'}
              </p>
              {course.agent_id && <p className="mt-3 truncate text-xs text-gray-500 dark:text-gray-400">Agente: {course.agent_id}</p>}
              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button onClick={() => openCourse(course)} className="rounded-lg bg-indigo-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700">
                  Gerenciar curso
                </button>
                <button onClick={() => setCourseModal({ open: true, course })} aria-label={`Editar ${course.name}`} className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-gray-50 hover:text-indigo-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  <PencilIcon className="h-4 w-4" />
                </button>
                {canDelete && (
                  <button onClick={() => setCourseToDelete(course)} aria-label={`Excluir ${course.name}`} className="rounded-lg border border-gray-300 p-2 text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-red-900/20">
                    <TrashIcon className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          <button
            type="button"
            onClick={backToCourses}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span>Voltar para cursos</span>
          </button>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{selectedCourse.name}</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {modalityLabels[selectedCourse.modality]}{selectedCourse.agent_id ? ` · Agente: ${selectedCourse.agent_id}` : ''}
              </p>
              {selectedCourse.description && <p className="mt-2 max-w-3xl text-sm text-gray-600 dark:text-gray-300">{selectedCourse.description}</p>}
            </div>
            <button onClick={() => setCourseModal({ open: true, course: selectedCourse })} className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
              <PencilIcon className="h-4 w-4" />
              <span>Editar curso</span>
            </button>
          </div>

          <div className="border-b border-gray-200 dark:border-gray-700">
            <nav className="-mb-px flex gap-6 overflow-x-auto" role="tablist" aria-label="Gestão do curso">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    aria-controls={`course-${tab.id}`}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex shrink-0 items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
                      active
                        ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                        : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.label}</span>
                    <span className={`inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 text-xs font-medium ${
                      active
                        ? 'bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300'
                        : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }`}>
                      {tab.badge}
                    </span>
                  </button>
                );
              })}
            </nav>
          </div>

          {detailLoading ? (
            <div className="flex items-center justify-center rounded-xl border border-gray-200 bg-white py-16 dark:border-gray-700 dark:bg-gray-800">
              <svg className="h-7 w-7 animate-spin text-indigo-600" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            </div>
          ) : (
            <div id={`course-${activeTab}`} role="tabpanel" className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
              {activeTab === 'modules' && <ModulesPanel courseId={selectedCourse.id} modules={modules} canDelete={canDelete} onChanged={handleModulesChanged} />}
              {activeTab === 'lessons' && <LessonsPanel courseId={selectedCourse.id} lessons={lessons} modules={modules} canDelete={canDelete} onChanged={loadLessons} />}
              {activeTab === 'prerequisites' && <PrerequisitesPanel courseId={selectedCourse.id} courses={courses} prerequisites={prerequisites} canDelete={canDelete} onChanged={loadPrerequisites} />}
            </div>
          )}
        </div>
      )}

      {courseModal.open && (
        <CourseModal
          course={courseModal.course}
          onClose={() => setCourseModal({ open: false })}
          onSave={saveCourse}
        />
      )}
      {courseToDelete && (
        <ConfirmDialog
          title="Excluir curso"
          message={`Deseja excluir "${courseToDelete.name}"?`}
          confirmLabel="Excluir"
          danger
          onCancel={() => setCourseToDelete(null)}
          onConfirm={deleteCourse}
        />
      )}
    </div>
  );
}
