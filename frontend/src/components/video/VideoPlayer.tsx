'use client';

import ExternalVideoPlayer from './ExternalVideoPlayer';
import LocalVideoPlayer from './LocalVideoPlayer';

interface Props {
  lessonId: number;
  videoUrl: string | null;
  hasVideoFile: boolean;
  onConsumed: () => void;
}

export default function VideoPlayer({ lessonId, videoUrl, hasVideoFile, onConsumed }: Props) {
  if (hasVideoFile) {
    return <LocalVideoPlayer lessonId={lessonId} onConsumed={onConsumed} />;
  }
  if (videoUrl) {
    return <ExternalVideoPlayer url={videoUrl} onConsumed={onConsumed} />;
  }
  return (
    <div className="flex items-center justify-center h-40 rounded-lg bg-gray-100 dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-600">
      <p className="text-sm text-gray-400">Nenhum vídeo disponível para esta aula.</p>
    </div>
  );
}
