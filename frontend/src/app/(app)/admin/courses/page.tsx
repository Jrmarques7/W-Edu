'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, BookOpenIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course, Lesson } from '@/types/course';

function CourseModal({ course, onClose, onSave }: {
  course?: Course;
  onClose: () => void;
  onSave: (data: Partial<Course>) => Promise<void>;
}) {
  const [name, setName] = useState(course?.name ?? '');
  const [description, setDescription] = useState(course?.description ?? '');
  const [agentId, setAgentId] = useState(course?.agent_id ?? '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ name, description: description || null, agent_id: agentId || null });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {course ? 'Editar Curso' : 'Novo Curso'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID do Agente W-Matrix</label>
            <input value={agentId} onChange={(e) => setAgentId(e.target.value)} placeholder="ex: agent-mat-001"
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LessonModal({ courseId, lesson, onClose, onSave }: {
  courseId: number;
  lesson?: Lesson;
  onClose: () => void;
  onSave: (data: Partial<Lesson>) => Promise<void>;
}) {
  const [title, setTitle] = useState(lesson?.title ?? '');
  const [content, setContent] = useState(lesson?.content ?? '');
  const [order, setOrder] = useState(lesson?.order ?? 1);
  const [type, setType] = useState<Lesson['type']>(lesson?.type ?? 'text');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    await onSave({ title, content: content || null, order, type, course_id: courseId });
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {lesson ? 'Editar Aula' : 'Nova Aula'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Título *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipo</label>
              <select value={type} onChange={(e) => setType(e.target.value as Lesson['type'])}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="text">Texto</option>
                <option value="video">Vídeo</option>
                <option value="voice">Voz</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ordem</label>
              <input type="number" value={order} min={1} onChange={(e) => setOrder(Number(e.target.value))}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Conteúdo</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4}
              className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">
              Cancelar
            </button>
            <button type="submit" disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
              {saving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AdminCoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [lessons, setLessons] = useState<Record<number, Lesson[]>>({});
  const [expanded, setExpanded] = useState<number | null>(null);
  const [courseModal, setCourseModal] = useState<{ open: boolean; course?: Course }>({ open: false });
  const [lessonModal, setLessonModal] = useState<{ open: boolean; courseId?: number; lesson?: Lesson }>({ open: false });
  const [loading, setLoading] = useState(true);

  const loadCourses = () =>
    api.get<Course[]>(endpoints.courses.list).then((r) => setCourses(r.data)).finally(() => setLoading(false));

  const loadLessons = async (courseId: number) => {
    const { data } = await api.get<Lesson[]>(endpoints.courses.lessons(courseId));
    setLessons((prev) => ({ ...prev, [courseId]: data }));
  };

  useEffect(() => { loadCourses(); }, []);

  const toggleExpand = async (courseId: number) => {
    if (expanded === courseId) { setExpanded(null); return; }
    setExpanded(courseId);
    if (!lessons[courseId]) await loadLessons(courseId);
  };

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
    } catch { toast.error('Erro ao salvar curso.'); }
  };

  const deleteCourse = async (courseId: number) => {
    if (!confirm('Excluir este curso?')) return;
    try {
      await api.delete(endpoints.courses.detail(courseId));
      toast.success('Curso excluído.');
      loadCourses();
    } catch { toast.error('Erro ao excluir curso.'); }
  };

  const saveLesson = async (data: Partial<Lesson>) => {
    try {
      if (lessonModal.lesson) {
        await api.patch(`/lessons/${lessonModal.lesson.id}`, data);
        toast.success('Aula atualizada!');
      } else {
        await api.post('/lessons', data);
        toast.success('Aula criada!');
      }
      setLessonModal({ open: false });
      if (lessonModal.courseId) await loadLessons(lessonModal.courseId);
    } catch { toast.error('Erro ao salvar aula.'); }
  };

  const deleteLesson = async (lessonId: number, courseId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      toast.success('Aula excluída.');
      await loadLessons(courseId);
    } catch { toast.error('Erro ao excluir aula.'); }
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Gerenciar Cursos</h1>
        <button onClick={() => setCourseModal({ open: true })}
          className="flex items-center space-x-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
          <PlusIcon className="w-4 h-4" />
          <span>Novo Curso</span>
        </button>
      </div>

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum curso criado ainda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {courses.map((course) => (
            <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-5 py-4">
                <button onClick={() => toggleExpand(course.id)} className="flex items-center space-x-3 flex-1 text-left">
                  <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
                    <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{course.name}</p>
                    {course.agent_id && <p className="text-xs text-gray-500 dark:text-gray-400">Agente: {course.agent_id}</p>}
                  </div>
                  {expanded === course.id ? <ChevronUpIcon className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-2" />}
                </button>
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => setCourseModal({ open: true, course })}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
                    <PencilIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteCourse(course.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
                    <TrashIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expanded === course.id && (
                <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aulas</p>
                    <button onClick={() => setLessonModal({ open: true, courseId: course.id })}
                      className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
                      <PlusIcon className="w-3.5 h-3.5" />
                      <span>Adicionar aula</span>
                    </button>
                  </div>
                  {(lessons[course.id] ?? []).length === 0 ? (
                    <p className="text-sm text-gray-400">Nenhuma aula ainda.</p>
                  ) : (
                    <div className="space-y-2">
                      {(lessons[course.id] ?? []).map((lesson) => (
                        <div key={lesson.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-2.5">
                          <div className="flex items-center space-x-3">
                            <span className="text-xs text-gray-400 w-5 text-right">{lesson.order}.</span>
                            <span className="text-sm text-gray-900 dark:text-white">{lesson.title}</span>
                            <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded capitalize">{lesson.type}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <button onClick={() => setLessonModal({ open: true, courseId: course.id, lesson })}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors">
                              <PencilIcon className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deleteLesson(lesson.id, course.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                              <TrashIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {courseModal.open && (
        <CourseModal course={courseModal.course} onClose={() => setCourseModal({ open: false })} onSave={saveCourse} />
      )}
      {lessonModal.open && lessonModal.courseId && (
        <LessonModal courseId={lessonModal.courseId} lesson={lessonModal.lesson} onClose={() => setLessonModal({ open: false })} onSave={saveLesson} />
      )}
    </div>
  );
}
