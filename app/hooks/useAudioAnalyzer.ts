'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

interface AudioContextData {
  frequencies: number[];
  isActive: boolean;
  level: number;
}

export const useAudioAnalyzer = () => {
  const [data, setData] = useState<AudioContextData>({
    frequencies: Array(256).fill(0),
    isActive: false,
    level: 0,
  });
  const [permissionState, setPermissionState] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [autoStartAttempted, setAutoStartAttempted] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const startAudio = useCallback(async () => {
    try {
      // On mobile, permissions.query() is often unreliable or not supported.
      // Instead, we'll directly try getUserMedia and infer permission state from success/error.
      // Only attempt permissions.query if we're on desktop and it's supported.
      if (typeof window !== 'undefined' && window.innerWidth >= 768) {
        try {
          if (navigator.permissions && (navigator.permissions as any).query) {
            const status = await (navigator.permissions as any).query({ name: 'microphone' });
            setPermissionState(status.state || 'unknown');
            if (status.state === 'denied') {
              setData((prev) => ({ ...prev, isActive: false }));
              return;
            }
          }
        } catch (permErr) {
          // Some browsers do not support permissions.query; ignore and continue
        }
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: false,
        },
      });

      // Update permission state to 'granted' after successful getUserMedia
      setPermissionState('granted');
      setAutoStartAttempted(true);

      streamRef.current = stream;

      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;

      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 2048;
      analyzerRef.current = analyzer;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyzer);

      const frequencyData = new Uint8Array(analyzer.frequencyBinCount);

      const updateFrequencies = () => {
        if (analyzerRef.current) {
          analyzerRef.current.getByteFrequencyData(frequencyData);

          // Calculate average level
          const sum = frequencyData.reduce((a, b) => a + b, 0);
          const average = sum / frequencyData.length;

          setData({
            frequencies: Array.from(frequencyData),
            isActive: average > 5,
            level: average,
          });
        }

        animationFrameRef.current = requestAnimationFrame(updateFrequencies);
      };

      updateFrequencies();
      setData((prev) => ({ ...prev, isActive: true }));
    } catch (error) {
      // Map common permission errors to denied state
      try {
        const errName = (error as any)?.name || '';
        if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
          setPermissionState('denied');
        }
      } catch (e) {
        /* ignore */
      }
      setData((prev) => ({ ...prev, isActive: false }));
    }
  }, []);

  const stopAudio = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
    }

    setData({
      frequencies: Array(256).fill(0),
      isActive: false,
      level: 0,
    });
  }, []);

  return {
    ...data,
    permissionState,
    startAudio,
    stopAudio,
  };
};
