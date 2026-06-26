"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function MatematicaError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[matematica]", error);
  }, [error]);
  return <ErrorFallback reset={reset} title="Erro na Matemática" />;
}
