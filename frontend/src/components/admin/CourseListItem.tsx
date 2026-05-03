'use client';

import { useState } from 'react';
import { PencilIcon, TrashIcon, BookOpenIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Course, CourseModule, CoursePrerequisite, Lesson } from '@/types/course';
import ModulesPanel from './ModulesPanel';
import PrerequisitesPanel from './PrerequisitesPanel';
import LessonsPanel from './LessonsPanel';

interface Props {
  course: Course;
  courses: Course[];
  canDelete: boolean;
  onEdit: (course: Course) => void;
  onDeleted: () => void;
}

export default function CourseListItem({ course, courses, canDelete, onEdit, onDeleted }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [prerequisites, setPrerequisites] = useState<CoursePrerequisite[]>([]);

  const loadLessons = async () => {
    const { data } = await api.get<Lesson[]>(endpoints.courses.lessons(course.id));
    setLessons(data);
  };

  const loadModules = async () => {
    const { data } = await api.get<CourseModule[]>(endpoints.courses.modules(course.id));
    setModules(data);
  };

  const loadPrerequisites = async () => {
    const { data } = await api.get<CoursePrerequisite[]>(endpoints.courses.prerequisites(course.id));
    setPrerequisites(data);
  };

  const toggleExpand = async () => {
    if (expanded) { setExpanded(false); return; }
    setExpanded(true);
    await Promise.all([loadModules(), loadLessons(), loadPrerequisites()]);
  };

  const handleModulesChanged = async () => {
    await Promise.all([loadModules(), loadLessons()]);
  };

  const deleteCourse = async () => {
    if (!confirm('Excluir este curso?')) return;
    try {
      await api.delete(endpoints.courses.detail(course.id));
      toast.success('Curso excluído.');
      onDeleted();
    } catch { toast.error('Erro ao excluir curso.'); }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4">
        <button onClick={toggleExpand} className="flex items-center space-x-3 flex-1 text-left">
          <div className="w-9 h-9 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center">
            <BookOpenIcon className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{course.name}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {course.modality === 'online' ? 'Online' : course.modality === 'in_person' ? 'Presencial' : 'Híbrido'}
              {course.agent_id ? ` · Agente: ${course.agent_id}` : ''}
            </p>
          </div>
          {expanded ? <ChevronUpIcon className="w-4 h-4 text-gray-400 ml-2" /> : <ChevronDownIcon className="w-4 h-4 text-gray-400 ml-2" />}
        </button>
        <div className="flex items-center space-x-2 ml-4">
          <button onClick={() => onEdit(course)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors">
            <PencilIcon className="w-4 h-4" />
          </button>
          {canDelete && (
            <button onClick={deleteCourse} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors">
              <TrashIcon className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="border-t border-gray-100 dark:border-gray-700 px-5 py-4 space-y-4">
          <ModulesPanel courseId={course.id} modules={modules} canDelete={canDelete} onChanged={handleModulesChanged} />
          <PrerequisitesPanel courseId={course.id} courses={courses} prerequisites={prerequisites} canDelete={canDelete} onChanged={loadPrerequisites} />
          <LessonsPanel courseId={course.id} lessons={lessons} modules={modules} canDelete={canDelete} onChanged={loadLessons} />
        </div>
      )}
    </div>
  );
}
