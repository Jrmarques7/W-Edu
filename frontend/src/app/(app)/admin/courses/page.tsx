'use client';

import { useEffect, useState } from 'react';
import { PlusIcon, BookOpenIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course } from '@/types/course';
import CourseModal from '@/components/admin/CourseModal';
import CourseListItem from '@/components/admin/CourseListItem';

export default function AdminCoursesPage() {
  const { student } = useAuthStore();
  const canDelete = student?.role === 'admin';
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [courseModal, setCourseModal] = useState<{ open: boolean; course?: Course }>({ open: false });

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
    } catch { toast.error('Erro ao salvar curso.'); }
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
            <CourseListItem
              key={course.id}
              course={course}
              courses={courses}
              canDelete={canDelete}
              onEdit={(c) => setCourseModal({ open: true, course: c })}
              onDeleted={loadCourses}
            />
          ))}
        </div>
      )}

      {courseModal.open && (
        <CourseModal
          course={courseModal.course}
          onClose={() => setCourseModal({ open: false })}
          onSave={saveCourse}
        />
      )}
    </div>
  );
}
