import { useCallback, useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '@/lib/api/client';
import { endpoints } from '@/lib/api/endpoints';
import { useAudioPlaybackQueue } from './useAudioPlaybackQueue';
import { useMicrophoneStream } from './useMicrophoneStream';
import { getMicrophoneErrorMessage, resolveBevoxWsUrl } from './voiceConfig';
import type { Session, VoiceSessionStart } from '@/types/course';

export type VoiceState = 'idle' | 'connecting' | 'active';

export interface TranscriptEntry {
  id: number;
  type: 'user' | 'system';
  text: string;
}

export function useVoiceSession(lessonId: number, onSessionUpdate: (session: Session) => void) {
  const [state, setState] = useState<VoiceState>('idle');
  const [statusText, setStatusText] = useState('Pronto para conectar');
  const [chatId, setChatId] = useState<string | null>(null);
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
    if (wsRef.current && wsRef.current.readyState < WebSocket.CLOSING) wsRef.current.close();
    wsRef.current = null;
  }, [microphone, playback]);

  const persistSession = useCallback(async (ended: boolean) => {
    const session = localSessionRef.current;
    if (!session) return;
    const transcriptText = transcriptRef.current.map((e) => `${e.type === 'user' ? 'Aluno' : 'Sistema'}: ${e.text}`).join('\n\n');
    try {
      const { data } = await api.patch<Session>(endpoints.sessions.voice(session.id), { bevox_session_id: chatId, transcript: transcriptText || null, ended });
      localSessionRef.current = data;
      onSessionUpdate(data);
    } catch {
      if (ended) toast.error('Sessão encerrada, mas não foi possível salvar a transcrição.');
    }
  }, [chatId, onSessionUpdate]);

  useEffect(() => { transcriptRef.current = transcript; }, [transcript]);
  useEffect(() => () => { manualCloseRef.current = true; cleanup(); }, [cleanup]);

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
      localSessionRef.current = data.session;
      onSessionUpdate(data.session);
    } catch (error: any) {
      setState('idle');
      setStatusText('Pronto para conectar');
      toast.error(error?.response?.data?.detail ?? 'Erro ao criar sessão de voz no W-Edu.');
      return;
    }

    setStatusText('Acessando microfone...');
    if (!(await playback.prepare())) {
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
        type: 'start', agent_id: startConfig.agent_id,
        session_id: startConfig.session.bevox_session_id || undefined,
        language: startConfig.language, output_format: startConfig.output_format,
        caller_phone: startConfig.caller_id, context: startConfig.context,
      }));
    };

    ws.onmessage = (event) => {
      if (event.data instanceof ArrayBuffer) { playback.appendChunk(event.data); return; }
      const msg = JSON.parse(event.data as string) as Record<string, unknown>;
      switch (msg.type) {
        case 'session_ready': {
          const nextChatId = msg.chat_id as string;
          setChatId(nextChatId);
          setState('active');
          setStatusText('Sessão ativa. Pode falar.');
          void api.patch<Session>(endpoints.sessions.voice(startConfig.session.id), { bevox_session_id: nextChatId })
            .then(({ data }) => { localSessionRef.current = data; onSessionUpdate(data); }).catch(() => {});
          microphone.start(stream, (data) => { if (wsRef.current?.readyState === WebSocket.OPEN) wsRef.current.send(data); }).catch(() => toast.error('Erro ao iniciar o microfone.'));
          break;
        }
        case 'transcript': playback.stop(); setStatusText('Transcrito. Aguardando resposta...'); setTranscript((p) => [...p, { id: ++entryIdRef.current, type: 'user', text: msg.text as string }]); break;
        case 'tts_chunk_ready': playback.finalizeChunk(); setStatusText('Professor respondendo...'); break;
        case 'turn_done': playback.finalizeChunk(); setStatusText('Sessão ativa. Pode falar.'); break;
        case 'interrupt_ack': setStatusText('Interrompido. Pode falar.'); break;
        case 'error': toast.error((msg.message as string) || 'Erro no BeVox.'); break;
      }
    };

    ws.onclose = () => { setState('idle'); setStatusText('Conexão encerrada'); cleanup(); if (!manualCloseRef.current) void persistSession(true); };
    ws.onerror = () => { toast.error('Erro na conexão com o BeVox.'); setState('idle'); setStatusText('Pronto para conectar'); cleanup(); };
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

  return { state, statusText, chatId, transcript, connect, disconnect, interrupt };
}
