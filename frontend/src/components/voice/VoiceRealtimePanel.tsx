'use client';

import { ArrowPathIcon, BoltIcon, MicrophoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline';
import { useVoiceSession } from '@/lib/voice/useVoiceSession';
import type { Session } from '@/types/course';

interface VoiceRealtimePanelProps {
  lessonId: number;
  onSessionUpdate: (session: Session) => void;
}

export function VoiceRealtimePanel({ lessonId, onSessionUpdate }: VoiceRealtimePanelProps) {
  const { state, statusText, chatId, transcript, connect, disconnect, interrupt } = useVoiceSession(lessonId, onSessionUpdate);

  return (
    <div className="mt-5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white/70 dark:bg-gray-900/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversa em tempo real</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{statusText}{chatId ? ` · BeVox ${chatId}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {state === 'idle' ? (
            <button onClick={connect} className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors">
              <MicrophoneIcon className="w-4 h-4" /><span>Falar agora</span>
            </button>
          ) : (
            <>
              <button onClick={interrupt} disabled={state !== 'active'}
                className="inline-flex items-center gap-2 px-3 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50">
                <BoltIcon className="w-4 h-4" /><span>Interromper</span>
              </button>
              <button onClick={disconnect}
                className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors">
                <PhoneXMarkIcon className="w-4 h-4" /><span>Encerrar</span>
              </button>
            </>
          )}
          {state === 'connecting' && <ArrowPathIcon className="w-5 h-5 animate-spin text-indigo-600 self-center" />}
        </div>
      </div>

      {transcript.length > 0 && (
        <div className="mt-4 max-h-64 overflow-y-auto space-y-2">
          {transcript.map((entry) => (
            <div key={entry.id} className="rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2 text-sm text-gray-800 dark:text-gray-200">
              {entry.text}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
