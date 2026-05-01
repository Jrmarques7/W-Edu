'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useAudioPlaybackQueue() {
  const playbackAudioCtxRef = useRef<AudioContext | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const currentChunkBytesRef = useRef<Uint8Array[]>([]);
  const isPlayingRef = useRef(false);
  const currentSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const playbackGenerationRef = useRef(0);

  const resetQueue = useCallback(() => {
    audioQueueRef.current = [];
    currentChunkBytesRef.current = [];
    isPlayingRef.current = false;
    playbackGenerationRef.current += 1;
  }, []);

  const stop = useCallback(() => {
    currentSourceRef.current?.stop();
    currentSourceRef.current?.disconnect();
    currentSourceRef.current = null;
    resetQueue();
  }, [resetQueue]);

  const playNext = useCallback(() => {
    const playbackCtx = playbackAudioCtxRef.current;
    if (!playbackCtx) {
      isPlayingRef.current = false;
      return;
    }
    if (audioQueueRef.current.length === 0) {
      isPlayingRef.current = false;
      currentSourceRef.current = null;
      return;
    }

    isPlayingRef.current = true;
    const blob = audioQueueRef.current.shift()!;
    const generation = playbackGenerationRef.current;

    void blob.arrayBuffer()
      .then((buffer) => playbackCtx.decodeAudioData(buffer))
      .then((audioBuffer) => {
        if (playbackGenerationRef.current !== generation) return;

        const source = playbackCtx.createBufferSource();
        source.buffer = audioBuffer;
        source.connect(playbackCtx.destination);
        source.onended = () => {
          if (currentSourceRef.current === source) {
            currentSourceRef.current.disconnect();
            currentSourceRef.current = null;
          }
          playNext();
        };
        currentSourceRef.current = source;
        source.start();
      })
      .catch(() => {
        if (playbackGenerationRef.current !== generation) return;
        playNext();
      });
  }, []);

  const prepare = useCallback(async () => {
    resetQueue();
    playbackAudioCtxRef.current?.close().catch(() => {});

    try {
      const playbackCtx = new AudioContext();
      playbackAudioCtxRef.current = playbackCtx;
      await playbackCtx.resume();
      return true;
    } catch {
      playbackAudioCtxRef.current = null;
      return false;
    }
  }, [resetQueue]);

  const appendChunk = useCallback((data: ArrayBuffer) => {
    currentChunkBytesRef.current.push(new Uint8Array(data));
  }, []);

  const finalizeChunk = useCallback(() => {
    if (currentChunkBytesRef.current.length === 0) return;

    const totalLen = currentChunkBytesRef.current.reduce((sum, chunk) => sum + chunk.length, 0);
    const merged = new Uint8Array(totalLen);
    let offset = 0;
    for (const chunk of currentChunkBytesRef.current) {
      merged.set(chunk, offset);
      offset += chunk.length;
    }

    currentChunkBytesRef.current = [];
    audioQueueRef.current.push(new Blob([merged], { type: 'audio/mpeg' }));
    if (!isPlayingRef.current) {
      playNext();
    }
  }, [playNext]);

  const cleanup = useCallback(() => {
    currentSourceRef.current?.stop();
    currentSourceRef.current?.disconnect();
    currentSourceRef.current = null;
    playbackAudioCtxRef.current?.close().catch(() => {});
    playbackAudioCtxRef.current = null;
    resetQueue();
  }, [resetQueue]);

  useEffect(() => cleanup, [cleanup]);

  return { appendChunk, cleanup, finalizeChunk, prepare, stop };
}
