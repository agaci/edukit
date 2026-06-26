"use client";

import { useEffect } from "react";
import { ErrorFallback } from "@/components/shared/ErrorFallback";

export default function CompreensaoError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[compreensao]", error);
  }, [error]);
  return <ErrorFallback reset={reset} title="Erro na Compreensão" />;
}
