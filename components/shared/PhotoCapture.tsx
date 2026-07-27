"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Camera, Upload, RotateCcw, Check, X } from "lucide-react";
import { useCamera, type CapturedImage } from "@/hooks/useCamera";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

interface PhotoCaptureProps {
  onCapture: (image: CapturedImage) => void;
  onClear?: () => void;
  hint?: string;
}

/**
 * Componente de captura de foto: câmara (getUserMedia) ou upload de ficheiro.
 * Mostra preview, permite refazer e devolve a imagem em base64.
 */
export function PhotoCapture({ onCapture, onClear, hint }: PhotoCaptureProps) {
  const {
    videoRef,
    streaming,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    fileToImage,
  } = useCamera();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<CapturedImage | null>(null);

  function handleCapture() {
    const img = capturePhoto();
    if (img) {
      setPreview(img);
      onCapture(img);
    }
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const img = await fileToImage(file);
    setPreview(img);
    onCapture(img);
  }

  function reset() {
    setPreview(null);
    stopCamera();
    onClear?.();
  }

  // Estado 3: preview capturado.
  if (preview) {
    return (
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-full max-w-md overflow-hidden rounded-3xl border-2 border-success/40 bg-slate-50">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview.dataUrl} alt="Foto capturada" className="w-full" />
          <span className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success px-3 py-1 text-sm font-bold text-white shadow-soft">
            <Check size={16} /> Capturado
          </span>
        </div>
        <Button variant="outline" icon={<RotateCcw size={18} />} onClick={reset}>
          Refazer foto
        </Button>
      </div>
    );
  }

  // Estado 2: câmara activa — ecrã inteiro.
  if (streaming) {
    return createPortal(
      <div className="fixed inset-0 z-[70] flex flex-col bg-black">
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full flex-1 object-cover"
        />
        {/* Fechar (canto superior) */}
        <button
          onClick={stopCamera}
          aria-label="Fechar câmara"
          className="absolute right-4 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur transition hover:bg-black/70"
        >
          <X size={22} />
        </button>
        {/* Controlos inferiores */}
        <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-10 bg-gradient-to-t from-black/70 to-transparent px-6 pb-10 pt-16">
          <button
            onClick={stopCamera}
            className="font-display font-bold text-white/80 transition hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleCapture}
            aria-label="Tirar foto"
            className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-white/25 backdrop-blur transition active:scale-95"
          >
            <Camera size={32} className="text-white" />
          </button>
          <span className="w-16" aria-hidden="true" />
        </div>
      </div>,
      document.body
    );
  }

  // Estado 1: escolha inicial.
  return (
    <div className="flex flex-col items-center gap-4">
      {hint && (
        <p className="max-w-md text-center text-sm text-slate-500">{hint}</p>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          onClick={startCamera}
          className={cn(
            "flex min-h-[120px] w-44 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-secondary/40 bg-secondary/5 p-4 text-secondary-dark transition hover:border-secondary hover:bg-secondary/10",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/30"
          )}
        >
          <Camera size={36} />
          <span className="font-display font-bold">Usar câmara</span>
        </button>
        <button
          onClick={() => fileRef.current?.click()}
          className={cn(
            "flex min-h-[120px] w-44 flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-primary/40 bg-primary/5 p-4 text-primary-dark transition hover:border-primary hover:bg-primary/10",
            "focus:outline-none focus-visible:ring-4 focus-visible:ring-primary/30"
          )}
        >
          <Upload size={36} />
          <span className="font-display font-bold">Carregar foto</span>
        </button>
      </div>
      {/* Sem `capture`: abre o explorador de ficheiros/galeria, não a câmara. */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
      {error && (
        <p className="text-center text-sm font-semibold text-danger">{error}</p>
      )}
    </div>
  );
}
