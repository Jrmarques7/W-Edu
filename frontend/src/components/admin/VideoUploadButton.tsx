'use client';

import { useRef, useState } from 'react';
import { ArrowUpTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import type { Lesson } from '@/types/course';

interface Props {
  lesson: Lesson;
  onUploaded: () => void;
}

export default function VideoUploadButton({ lesson, onUploaded }: Props) {
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await api.post(endpoints.lessons.videoUpload(lesson.id), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Vídeo enviado!');
      onUploaded();
    } catch {
      toast.error('Erro ao enviar vídeo.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={handleFileChange} />
      <button
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        title={lesson.has_video_file ? 'Substituir arquivo de vídeo' : 'Enviar arquivo de vídeo'}
        className="p-1.5 text-gray-400 hover:text-indigo-600 rounded transition-colors disabled:opacity-50"
      >
        {uploading ? (
          <svg className="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <ArrowUpTrayIcon className="w-3.5 h-3.5" />
        )}
      </button>
    </>
  );
}
