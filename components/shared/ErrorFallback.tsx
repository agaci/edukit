"use client";

import Link from "next/link";
import { AlertTriangle, RotateCcw, Home } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export function ErrorFallback({
  reset,
  title = "Algo correu mal",
}: {
  reset: () => void;
  title?: string;
}) {
  return (
    <div className="mx-auto max-w-md py-10">
      <Card className="space-y-4 text-center">
        <AlertTriangle className="mx-auto text-warning" size={48} />
        <h2 className="font-display text-2xl font-extrabold text-ink">{title}</h2>
        <p className="text-slate-500">
          Aconteceu um problema inesperado. Podes tentar novamente.
        </p>
        <div className="flex justify-center gap-3">
          <Button icon={<RotateCcw size={18} />} onClick={reset}>
            Tentar de novo
          </Button>
          <Link href="/">
            <Button variant="outline" icon={<Home size={18} />}>
              Início
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
