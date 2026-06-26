"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function DitadoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ditado]", error);
  }, [error]);
  return <ErrorFallback reset={reset} title="Erro no Ditado" />;
}
