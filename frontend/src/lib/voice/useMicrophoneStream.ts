'use client';

import { useCallback, useEffect, useRef } from 'react';

export function useMicrophoneStream() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const workletNodeRef = useRef<AudioWorkletNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const requestAccess = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: 1,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });
    streamRef.current = stream;
    return stream;
  }, []);

  const start = useCallback(async (stream: MediaStream, onChunk: (data: ArrayBuffer) => void) => {
    const ctx = new AudioContext({ sampleRate: 16000 });
    audioCtxRef.current = ctx;
    await ctx.resume();
    await ctx.audioWorklet.addModule('/pcm-processor.js');

    const source = ctx.createMediaStreamSource(stream);
    const worklet = new AudioWorkletNode(ctx, 'pcm-processor');
    workletNodeRef.current = worklet;
    worklet.port.onmessage = (event: MessageEvent<ArrayBuffer>) => onChunk(event.data);

    source.connect(worklet);
    worklet.connect(ctx.destination);
  }, []);

  const cleanup = useCallback(() => {
    workletNodeRef.current?.disconnect();
    workletNodeRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  return { cleanup, requestAccess, start };
}
