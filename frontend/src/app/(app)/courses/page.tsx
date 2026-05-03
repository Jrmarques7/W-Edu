'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpenIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAuthStore } from '@/store/authStore';
import type { Course, Enrollment, LearningPath, LearningPathCourse } from '@/types/course';

export default function CoursesPage() {
  const { student } = useAuthStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [pathCourses, setPathCourses] = useState<Record<number, LearningPathCourse[]>>({});
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!student) return;
    Promise.all([
      api.get<Course[]>(endpoints.courses.list),
      api.get<LearningPath[]>(endpoints.learningPaths.list),
      api.get<Enrollment[]>(endpoints.enrollments.byStudent(student.id)),
    ]).then(async ([c, p, e]) => {
      setCourses(c.data);
      setLearningPaths(p.data);
      setEnrollments(e.data);
      const entries = await Promise.all(
        p.data.map(async (path) => {
          try {
            const { data } = await api.get<LearningPathCourse[]>(endpoints.learningPaths.courses(path.id));
            return [path.id, data.sort((a, b) => a.order - b.order)] as const;
          } catch {
            return [path.id, []] as const;
          }
        })
      );
      setPathCourses(Object.fromEntries(entries));
    }).finally(() => setLoading(false));
  }, [student]);

  const isEnrolled = (courseId: number) => enrollments.some((e) => e.course_id === courseId);
  const courseName = (courseId: number) => courses.find((course) => course.id === courseId)?.name ?? `Curso #${courseId}`;

  const enroll = async (courseId: number) => {
    if (!student) return;
    try {
      const { data } = await api.post<Enrollment>(endpoints.enrollments.create, {
        student_id: student.id,
        course_id: courseId,
      });
      setEnrollments((prev) => [...prev, data]);
      toast.success('Matriculado com sucesso!');
    } catch {
      toast.error('Erro ao matricular no curso.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Catálogo de Cursos</h1>

      {learningPaths.length > 0 && (
        <section className="space-y-3">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Trilhas de aprendizagem</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Jornadas organizadas por sequência de cursos.</p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {learningPaths.map((path) => (
              <div key={path.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                <h3 className="font-semibold text-gray-900 dark:text-white">{path.name}</h3>
                {path.description && <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{path.description}</p>}
                {(pathCourses[path.id] ?? []).length === 0 ? (
                  <p className="mt-3 text-sm text-gray-400">Nenhum curso vinculado.</p>
                ) : (
                  <div className="mt-4 space-y-2">
                    {(pathCourses[path.id] ?? []).map((item) => {
                      const enrolled = isEnrolled(item.course_id);
                      return (
                        <div key={item.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 dark:bg-gray-900">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.order}. {courseName(item.course_id)}</p>
                            {enrolled && <p className="text-xs text-green-600 dark:text-green-400">Matriculado</p>}
                          </div>
                          {enrolled ? (
                            <Link href={`/courses/${item.course_id}`} className="text-xs font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400">
                              Continuar
                            </Link>
                          ) : (
                            <button onClick={() => enroll(item.course_id)}
                              className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700">
                              Matricular
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {courses.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 p-10 text-center">
          <BookOpenIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500 dark:text-gray-400">Nenhum curso disponível no momento.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course) => {
            const enrolled = isEnrolled(course.id);
            return (
              <div key={course.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 flex flex-col">
                <div className="w-10 h-10 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg flex items-center justify-center mb-3">
                  <BookOpenIcon className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">{course.name}</h3>
                {course.description && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 flex-1 line-clamp-3">{course.description}</p>
                )}
                <div className="mt-4 flex items-center justify-between">
                  {enrolled ? (
                    <Link
                      href={`/courses/${course.id}`}
                      className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400"
                    >
                      Continuar →
                    </Link>
                  ) : (
                    <button
                      onClick={() => enroll(course.id)}
                      className="flex items-center space-x-1 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      <PlusCircleIcon className="w-4 h-4" />
                      <span>Matricular</span>
                    </button>
                  )}
                  {enrolled && (
                    <span className="text-xs px-2 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-full font-medium">
                      Matriculado
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
