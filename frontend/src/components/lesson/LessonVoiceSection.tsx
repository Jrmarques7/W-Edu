'use client';

import { MicrophoneIcon } from '@heroicons/react/24/outline';
import type { Session } from '@/types/course';
import { VoiceRealtimePanel } from '@/components/voice/VoiceRealtimePanel';

export default function LessonVoiceSection({ lessonId, session, onSessionUpdate }: {
  lessonId: number;
  session: Session | null;
  onSessionUpdate: (s: Session) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-200 dark:border-indigo-700 p-6">
      <div className="flex items-start space-x-4">
        <div className="w-12 h-12 bg-indigo-600 rounded-xl flex items-center justify-center flex-shrink-0">
          <MicrophoneIcon className="w-6 h-6 text-white" />
        </div>
        <div className="flex-1">
          <h2 className="text-base font-semibold text-gray-900 dark:text-white">Professor IA por Voz</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Fale com o professor IA sobre o conteúdo desta aula em tempo real. A conversa será salva no histórico de sessões.
          </p>
        </div>
      </div>
      <VoiceRealtimePanel lessonId={lessonId} onSessionUpdate={onSessionUpdate} />
      {session?.transcript && (
        <div className="mt-5 pt-5 border-t border-indigo-200 dark:border-indigo-700">
          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">Transcrição da última sessão</p>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3 leading-relaxed">{session.transcript}</p>
        </div>
      )}
    </div>
  );
}
