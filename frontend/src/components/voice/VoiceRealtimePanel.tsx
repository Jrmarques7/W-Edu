'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowPathIcon, BoltIcon, MicrophoneIcon, PhoneXMarkIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAudioPlaybackQueue } from '@/lib/voice/useAudioPlaybackQueue';
import { useMicrophoneStream } from '@/lib/voice/useMicrophoneStream';
import type { Session, VoiceSessionStart } from '@/types/course';

type VoiceState = 'idle' | 'connecting' | 'active';

interface TranscriptEntry {
  id: number;
  type: 'user' | 'system';
  text: string;
}

interface VoiceRealtimePanelProps {
  lessonId: number;
  onSessionUpdate: (session: Session) => void;
}

function getSameOriginBevoxWsUrl() {
  if (typeof window === 'undefined') return 'ws://localhost:8001/ws/voice/stream';
  if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws/voice/stream`;
  }
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.hostname}:8001/ws/voice/stream`;
}

function resolveBevoxWsUrl(configuredUrl?: string | null) {
  const sameOriginUrl = getSameOriginBevoxWsUrl();
  const envUrl = process.env.NEXT_PUBLIC_BEVOX_URL
    ? `${process.env.NEXT_PUBLIC_BEVOX_URL.replace(/\/$/, '').replace(/^https/, 'wss').replace(/^http/, 'ws')}/ws/voice/stream`
    : null;
  const candidate = configuredUrl || envUrl;
  if (!candidate || typeof window === 'undefined') return candidate || sameOriginUrl;

  try {
    const url = new URL(candidate);
    const isSameProductionHost = url.hostname === window.location.hostname && url.port === '8001';
    if (isSameProductionHost && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return sameOriginUrl;
    }
  } catch {
    return sameOriginUrl;
  }

  return candidate;
}

function getMicrophoneErrorMessage(error: unknown) {
  if (typeof window !== 'undefined' && !window.isSecureContext) {
    return 'O navegador só libera o microfone em HTTPS ou localhost. Acesse a plataforma por HTTPS para usar a aula de voz.';
  }

  if (error instanceof DOMException) {
    if (error.name === 'NotAllowedError' || error.name === 'SecurityError') {
      return 'Permissão de microfone negada. Libere o microfone no navegador e tente novamente.';
    }
    if (error.name === 'NotFoundError' || error.name === 'DevicesNotFoundError') {
      return 'Nenhum microfone foi encontrado neste dispositivo.';
    }
    if (error.name === 'NotReadableError' || error.name === 'TrackStartError') {
      return 'O microfone está em uso por outro aplicativo ou não pôde ser iniciado.';
    }
  }

  if (error instanceof Error && error.message === 'microphone_api_unavailable') {
    return 'Este navegador não disponibiliza acesso ao microfone neste contexto.';
  }

  return 'Não foi possível acessar o microfone.';
}

export function VoiceRealtimePanel({ lessonId, onSessionUpdate }: VoiceRealtimePanelProps) {
  const [state, setState] = useState<VoiceState>('idle');
  const [statusText, setStatusText] = useState('Pronto para conectar');
  const [chatId, setChatId] = useState<string | null>(null);
  const [localSession, setLocalSession] = useState<Session | null>(null);
  const [transcript, setTranscript] = useState<TranscriptEntry[]>([]);

  const wsRef = useRef<WebSocket | null>(null);
  const entryIdRef = useRef(0);
  const localSessionRef = useRef<Session | null>(null);
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  const manualCloseRef = useRef(false);

  const playback = useAudioPlaybackQueue();
  const microphone = useMicrophoneStream();

  const cleanup = useCallback(() => {
    playback.cleanup();
    microphone.cleanup();
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) {
      wsRef.current.close();
    }
    wsRef.current = null;
  }, [microphone, playback]);

  const persistSession = useCallback(async (ended: boolean) => {
    const session = localSessionRef.current;
    if (!session) return;
    const transcriptText = transcriptRef.current.map((entry) => `${entry.type === 'user' ? 'Aluno' : 'Sistema'}: ${entry.text}`).join('\n\n');
    try {
      const { data } = await api.patch<Session>(endpoints.sessions.voice(session.id), {
        bevox_session_id: chatId,
        transcript: transcriptText || null,
        ended,
      });
      setLocalSession(data);
      localSessionRef.current = data;
      onSessionUpdate(data);
    } catch {
      if (ended) toast.error('Sessão encerrada, mas não foi possível salvar a transcrição.');
    }
  }, [chatId, onSessionUpdate]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => () => {
    manualCloseRef.current = true;
    cleanup();
  }, [cleanup]);

  const connect = async () => {
    setState('connecting');
    setStatusText('Criando sessão...');
    setTranscript([]);
    setChatId(null);
    entryIdRef.current = 0;
    manualCloseRef.current = false;
    playback.stop();

    let startConfig: VoiceSessionStart;
    try {
      const { data } = await api.post<VoiceSessionStart>(endpoints.sessions.voiceStart, { lesson_id: lessonId });
      startConfig = data;
      setLocalSession(data.session);
      localSessionRef.current = data.session;
      onSessionUpdate(data.session);
    } catch (error: any) {
      setState('idle');
      setStatusText('Pronto para conectar');
      toast.error(error?.response?.data?.detail ?? 'Erro ao criar sessão de voz no W-Edu.');
      return;
    }

    setStatusText('Acessando microfone...');
    const playbackReady = await playback.prepare();
    if (!playbackReady) {
      setState('idle');
      setStatusText('Pronto para conectar');
      toast.error('Erro ao preparar reprodução de áudio.');
      return;
    }

    let stream: MediaStream;
    try {
      stream = await microphone.requestAccess();
    } catch (error) {
      playback.cleanup();
      setState('idle');
      setStatusText('Pronto para conectar');
      toast.error(getMicrophoneErrorMessage(error), { duration: 7000 });
      return;
    }

    const ws = new WebSocket(resolveBevoxWsUrl(startConfig.bevox_ws_url));
    ws.binaryType = 'arraybuffer';
    wsRef.current = ws;

    ws.onopen = () => {
      setStatusText('Iniciando professor IA...');
      ws.send(JSON.stringify({
        type: 'start',
        agent_id: startConfig.agent_id,
        session_id: startConfig.session.bevox_session_id || undefined,
        language: startConfig.language,
        output_format: startConfig.output_format,
        caller_phone: startConfig.caller_id,
        context: startConfig.context,
      }));
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) {
        playback.appendChunk(event.data);
        return;
      }

      const msg = JSON.parse(event.data as string) as Record<string, unknown>;
      switch (msg.type) {
        case 'session_ready': {
          const nextChatId = msg.chat_id as string;
          setChatId(nextChatId);
          setState('active');
          setStatusText('Sessão ativa. Pode falar.');
          void api.patch<Session>(endpoints.sessions.voice(startConfig.session.id), { bevox_session_id: nextChatId })
            .then(({ data }) => {
              setLocalSession(data);
              localSessionRef.current = data;
              onSessionUpdate(data);
            })
            .catch(() => {});
          microphone.start(stream, (data) => {
            if (wsRef.current?.readyState === WebSocket.OPEN) {
              wsRef.current.send(data);
            }
          }).catch(() => toast.error('Erro ao iniciar o microfone.'));
          break;
        }
        case 'transcript':
          playback.stop();
          setStatusText('Transcrito. Aguardando resposta...');
          setTranscript((prev) => [...prev, { id: ++entryIdRef.current, type: 'user', text: msg.text as string }]);
          break;
        case 'tts_chunk_ready':
          playback.finalizeChunk();
          setStatusText('Professor respondendo...');
          break;
        case 'turn_done':
          playback.finalizeChunk();
          setStatusText('Sessão ativa. Pode falar.');
          break;
        case 'interrupt_ack':
          setStatusText('Interrompido. Pode falar.');
          break;
        case 'error':
          toast.error((msg.message as string) || 'Erro no BeVox.');
          break;
      }
    };

    ws.onclose = () => {
      setState('idle');
      setStatusText('Conexão encerrada');
      cleanup();
      if (!manualCloseRef.current) {
        void persistSession(true);
      }
    };

    ws.onerror = () => {
      toast.error('Erro na conexão com o BeVox.');
      setState('idle');
      setStatusText('Pronto para conectar');
      cleanup();
    };
  };

  const disconnect = async () => {
    manualCloseRef.current = true;
    setState('idle');
    setStatusText('Conexão encerrada');
    cleanup();
    await persistSession(true);
  };

  const interrupt = () => {
    wsRef.current?.send(JSON.stringify({ type: 'interrupt' }));
    playback.stop();
  };

  return (
    <div className="mt-5 rounded-xl border border-indigo-200 dark:border-indigo-700 bg-white/70 dark:bg-gray-900/40 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-gray-900 dark:text-white">Conversa em tempo real</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{statusText}{chatId ? ` · BeVox ${chatId}` : ''}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {state === 'idle' ? (
            <button
              onClick={connect}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <MicrophoneIcon className="w-4 h-4" />
              <span>Falar agora</span>
            </button>
          ) : (
            <>
              <button
                onClick={interrupt}
                disabled={state !== 'active'}
                className="inline-flex items-center gap-2 px-3 py-2 border border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:text-amber-300 dark:hover:bg-amber-900/20 text-sm font-medium rounded-lg transition-colors disabled:opacity-50"
              >
                <BoltIcon className="w-4 h-4" />
                <span>Interromper</span>
              </button>
              <button
                onClick={disconnect}
                className="inline-flex items-center gap-2 px-3 py-2 border border-red-300 text-red-700 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 text-sm font-medium rounded-lg transition-colors"
              >
                <PhoneXMarkIcon className="w-4 h-4" />
                <span>Encerrar</span>
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
