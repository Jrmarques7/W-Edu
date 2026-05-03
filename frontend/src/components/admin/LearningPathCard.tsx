'use client';

import { PencilIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';
import type { Course, LearningPath, LearningPathCourse } from '@/types/course';

export default function LearningPathCard({ path, courses, pathCourses, canDelete, onEdit, onDelete, onAddCourse, onRemoveCourse }: {
  path: LearningPath;
  courses: Course[];
  pathCourses: LearningPathCourse[];
  canDelete: boolean;
  onEdit: (path: LearningPath) => void;
  onDelete: (id: number) => void;
  onAddCourse: (pathId: number) => void;
  onRemoveCourse: (pathId: number, courseId: number) => void;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-gray-900 dark:text-white">{path.name}</h2>
          {path.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{path.description}</p>}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onEdit(path)} className="rounded-lg p-2 text-gray-400 hover:bg-indigo-50 hover:text-indigo-600 dark:hover:bg-indigo-900/20">
            <PencilIcon className="h-4 w-4" />
          </button>
          {canDelete && (
            <button onClick={() => onDelete(path.id)} className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20">
              <TrashIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-900">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Cursos da trilha</p>
          <button onClick={() => onAddCourse(path.id)} className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
            <PlusIcon className="h-3.5 w-3.5" /><span>Adicionar curso</span>
          </button>
        </div>
        {pathCourses.length === 0 ? (
          <div className="mt-2 rounded-lg border border-dashed border-gray-200 bg-white p-3 text-sm text-gray-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">
            Nenhum curso vinculado.
          </div>
        ) : (
          <div className="mt-2 flex flex-wrap gap-2">
            {pathCourses.map((item) => {
              const course = courses.find((c) => c.id === item.course_id);
              return (
                <div key={item.id} className="inline-flex items-center gap-1 rounded bg-white px-2 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300">
                  <span>{item.order}. {course?.name ?? `Curso #${item.course_id}`}</span>
                  {canDelete && (
                    <button onClick={() => onRemoveCourse(path.id, item.course_id)} className="rounded p-0.5 text-gray-400 hover:text-red-600" aria-label="Remover curso">
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
  );
}
