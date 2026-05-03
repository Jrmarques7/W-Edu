'use client';

import { useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { endpoints } from '@/lib/api/endpoints';

interface Props {
  lessonId: number;
  onConsumed: () => void;
}

export default function LocalVideoPlayer({ lessonId, onConsumed }: Props) {
  const token = useAuthStore((s) => s.tokens?.access_token);
  const consumedRef = useRef(false);
  const streamUrl = `${process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000'}${endpoints.lessons.videoStream(lessonId)}?token=${token}`;

  const handleConsumed = () => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    onConsumed();
  };

  return (
    <video
      className="w-full rounded-lg"
      controls
      preload="metadata"
      onEnded={handleConsumed}
      onTimeUpdate={(e) => {
        const video = e.currentTarget;
        if (video.duration && video.currentTime / video.duration >= 0.9) {
          handleConsumed();
        }
      }}
    >
      <source src={streamUrl} />
      Seu navegador não suporta reprodução de vídeo.
    </video>
  );
}
