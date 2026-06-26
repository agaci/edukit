"use client";

import { useCallback, useRef, useState } from "react";

// ============================================================================
// Hook para captura por câmara (getUserMedia) e conversão para base64.
// Suporta também upload de ficheiro (tratado no componente).
// ============================================================================

export interface CapturedImage {
  dataUrl: string; // data:image/...;base64,...
  base64: string; // só os dados, sem prefixo
  mimeType: string;
}

export interface UseCamera {
  videoRef: React.RefObject<HTMLVideoElement>;
  streaming: boolean;
  error: string | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  capturePhoto: () => CapturedImage | null;
  fileToImage: (file: File) => Promise<CapturedImage>;
}

export function useCamera(): UseCamera {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStreaming(false);
  }, []);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("A câmara não é suportada neste dispositivo.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStreaming(true);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Não foi possível aceder à câmara.";
      setError(message);
      setStreaming(false);
    }
  }, []);

  const capturePhoto = useCallback((): CapturedImage | null => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return null;

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
    const base64 = dataUrl.split(",")[1] ?? "";
    stopCamera();
    return { dataUrl, base64, mimeType: "image/jpeg" };
  }, [stopCamera]);

  const fileToImage = useCallback((file: File): Promise<CapturedImage> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1] ?? "";
        const mimeType = file.type || "image/jpeg";
        resolve({ dataUrl, base64, mimeType });
      };
      reader.onerror = () => reject(new Error("Não foi possível ler o ficheiro."));
      reader.readAsDataURL(file);
    });
  }, []);

  return {
    videoRef,
    streaming,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    fileToImage,
  };
}
