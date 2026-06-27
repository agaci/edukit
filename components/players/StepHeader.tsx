import { cn } from "@/lib/utils";

const TYPE_LABEL: Record<string, string> = {
  ditado: "Ditado",
  compreensao: "Compreensão",
  matematica: "Matemática",
  "traducao-en-pt": "Inglês→PT",
  "traducao-pt-en": "PT→Inglês",
  "interpretacao-en": "Interpretação EN",
};

export function StepHeader({
  index,
  total,
  type,
}: {
  index: number;
  total: number;
  type: string;
}) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between">
        <span className="font-display text-sm font-bold text-slate-400">
          Exercício {index} de {total}
        </span>
        <span className="rounded-full bg-primary/15 px-3 py-1 text-sm font-bold text-primary-dark">
          {TYPE_LABEL[type] ?? type}
        </span>
      </div>
      <div className="flex gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 flex-1 rounded-full",
              i < index ? "bg-primary" : "bg-slate-200"
            )}
          />
        ))}
      </div>
    </div>
  );
}
