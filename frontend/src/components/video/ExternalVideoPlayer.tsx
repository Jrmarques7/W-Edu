'use client';

import { useRef } from 'react';

interface Props {
  url: string;
  onConsumed: () => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([A-Za-z0-9_-]{11})/);
  return match ? match[1] : null;
}

function extractVimeoId(url: string): string | null {
  const match = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return match ? match[1] : null;
}

export default function ExternalVideoPlayer({ url, onConsumed }: Props) {
  const consumedRef = useRef(false);

  const handleConsumed = () => {
    if (consumedRef.current) return;
    consumedRef.current = true;
    onConsumed();
  };

  const youtubeId = extractYouTubeId(url);
  if (youtubeId) {
    return (
      <div className="space-y-3">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={`https://www.youtube.com/embed/${youtubeId}?enablejsapi=1`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          onClick={handleConsumed}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Marcar vídeo como assistido
        </button>
      </div>
    );
  }

  const vimeoId = extractVimeoId(url);
  if (vimeoId) {
    return (
      <div className="space-y-3">
        <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
          <iframe
            className="absolute inset-0 w-full h-full rounded-lg"
            src={`https://player.vimeo.com/video/${vimeoId}`}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
        <button
          onClick={handleConsumed}
          className="text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
        >
          Marcar vídeo como assistido
        </button>
      </div>
    );
  }

  // Generic direct video URL
  return (
    <video
      className="w-full rounded-lg"
      controls
      onEnded={handleConsumed}
      onTimeUpdate={(e) => {
        const video = e.currentTarget;
        if (video.duration && video.currentTime / video.duration >= 0.9) {
          handleConsumed();
        }
      }}
    >
      <source src={url} />
      Seu navegador não suporta reprodução de vídeo.
    </video>
  );
}
