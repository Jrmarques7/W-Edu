'use client';

import { useState } from 'react';
import { PlusIcon, PencilIcon, TrashIcon, FilmIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import type { CourseModule, Lesson } from '@/types/course';
import LessonModal from './LessonModal';
import VideoUploadButton from './VideoUploadButton';

interface Props {
  courseId: number;
  lessons: Lesson[];
  modules: CourseModule[];
  canDelete: boolean;
  onChanged: () => void;
}

export default function LessonsPanel({ courseId, lessons, modules, canDelete, onChanged }: Props) {
  const [lessonModal, setLessonModal] = useState<{ open: boolean; lesson?: Lesson }>({ open: false });

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
      onChanged();
    } catch { toast.error('Erro ao salvar aula.'); }
  };

  const deleteLesson = async (lessonId: number) => {
    if (!confirm('Excluir esta aula?')) return;
    try {
      await api.delete(`/lessons/${lessonId}`);
      toast.success('Aula excluída.');
      onChanged();
    } catch { toast.error('Erro ao excluir aula.'); }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Aulas</p>
        <button onClick={() => setLessonModal({ open: true })} className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-medium">
          <PlusIcon className="w-3.5 h-3.5" /><span>Adicionar aula</span>
        </button>
      </div>

      {lessons.length === 0 ? (
        <p className="text-sm text-gray-400">Nenhuma aula ainda.</p>
      ) : (
        <div className="space-y-2">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-900 rounded-lg px-4 py-2.5">
              <div className="flex items-center space-x-3">
                <span className="text-xs text-gray-400 w-5 text-right">{lesson.order}.</span>
                <span className="text-sm text-gray-900 dark:text-white">{lesson.title}</span>
                <span className="text-xs px-1.5 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded capitalize">{lesson.type}</span>
                {lesson.type === 'video' && lesson.has_video_file && (
                  <span title="Arquivo de vídeo enviado" className="text-green-500"><FilmIcon className="w-3.5 h-3.5" /></span>
                )}
                {lesson.module_id && (
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {modules.find((m) => m.id === lesson.module_id)?.title}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-1">
                {lesson.type === 'video' && <VideoUploadButton lesson={lesson} onUploaded={onChanged} />}
                <button onClick={() => setLessonModal({ open: true, lesson })} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors">
                  <PencilIcon className="w-3.5 h-3.5" />
                </button>
                {canDelete && (
                  <button onClick={() => deleteLesson(lesson.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded transition-colors">
                    <TrashIcon className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lessonModal.open && (
        <LessonModal
          courseId={courseId}
          modules={modules}
          lesson={lessonModal.lesson}
          onClose={() => setLessonModal({ open: false })}
          onSave={saveLesson}
        />
      )}
    </div>
  );
}
