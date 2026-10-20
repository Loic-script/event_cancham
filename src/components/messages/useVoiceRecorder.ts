"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceNote = {
  url: string;
  blob: Blob;
  seconds: number;
};

type Options = {
  onComplete: (note: VoiceNote) => void;
  onError: (message: string) => void;
  maxSeconds?: number;
};

export function useVoiceRecorder({ onComplete, onError, maxSeconds = 120 }: Options) {
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const cancelled = useRef(false);
  const startedAt = useRef(0);
  const ticker = useRef<number | undefined>(undefined);

  const stop = useCallback((cancel: boolean) => {
    cancelled.current = cancel;
    if (recorder.current && recorder.current.state !== "inactive") recorder.current.stop();
  }, []);

  const start = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      onError("Ce navigateur ne permet pas d'enregistrer un message vocal.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const rec = new MediaRecorder(stream);
      chunks.current = [];
      cancelled.current = false;

      rec.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.current.push(e.data);
      };
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        window.clearInterval(ticker.current);
        const seconds = Math.max(1, Math.round((Date.now() - startedAt.current) / 1000));
        setRecording(false);
        setElapsed(0);
        if (!cancelled.current && chunks.current.length > 0) {
          const blob = new Blob(chunks.current, { type: rec.mimeType || "audio/webm" });
          onComplete({ url: URL.createObjectURL(blob), blob, seconds });
        }
      };

      recorder.current = rec;
      startedAt.current = Date.now();
      rec.start(250);
      setRecording(true);
      setElapsed(0);
      ticker.current = window.setInterval(() => {
        const s = Math.floor((Date.now() - startedAt.current) / 1000);
        setElapsed(s);
        if (s >= maxSeconds) stop(false);
      }, 250);
    } catch {
      onError("Micro indisponible. Autorisez l'accès au micro dans le navigateur.");
    }
  }, [maxSeconds, onComplete, onError, stop]);

  useEffect(
    () => () => {
      window.clearInterval(ticker.current);
      if (recorder.current && recorder.current.state !== "inactive") {
        cancelled.current = true;
        recorder.current.stop();
      }
    },
    [],
  );

  return { recording, elapsed, start, stop };
}
