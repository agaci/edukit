"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Trophy } from "lucide-react";
import { Card, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ScoreDisplay } from "@/components/ui/ScoreDisplay";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";
import { DitadoPlayer } from "@/components/players/DitadoPlayer";
import { CompreensaoPlayer } from "@/components/players/CompreensaoPlayer";
import { MatematicaPlayer } from "@/components/players/MatematicaPlayer";
import { TraducaoPlayer } from "@/components/players/TraducaoPlayer";
import { InterpretacaoPlayer } from "@/components/players/InterpretacaoPlayer";
import { useAuth } from "@/components/auth/AuthProvider";
import { useToast } from "@/components/ui/Toast";
import { getAssignment, submitAssignmentItem } from "@/lib/api";
import { scoreColor, exerciseLabelShort } from "@/lib/utils";
import type { AssignmentDTO, StoredExercise } from "@/types";
import type { SubmitPayload, SubmitResponse } from "@/components/players/types";

export default function TrabalhoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { user, loading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const [assignment, setAssignment] = useState<AssignmentDTO | null>(null);
  const [index, setIndex] = useState(0);
  const [summary, setSummary] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    getAssignment(id)
      .then((r) => {
        const a = r.assignment;
        setAssignment(a);
        const next = a.items.findIndex((it) => typeof it.score !== "number");
        if (next === -1) {
          setSummary(true);
        } else {
          setIndex(next);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro a carregar."));
  }, [id]);

  const submit = useCallback(
    async (payload: SubmitPayload): Promise<SubmitResponse> => {
      const resp = await submitAssignmentItem(id, { index, ...payload });
      if (resp.assignment) setAssignment(resp.assignment);
      return { result: resp.result, illegible: resp.illegible };
    },
    [id, index]
  );

  const onDone = useCallback(() => {
    setAssignment((a) => {
      if (!a) return a;
      const next = a.items.findIndex((it) => typeof it.score !== "number");
      if (next === -1) setSummary(true);
      else setIndex(next);
      return a;
    });
  }, []);

  if (loading || (!assignment && !error)) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner size={48} />
      </div>
    );
  }

  if (error || !assignment) {
    return (
      <Card className="mx-auto max-w-md space-y-4 text-center">
        <p className="text-slate-500">{error ?? "Trabalho não encontrado."}</p>
        <Button onClick={() => router.replace("/")} icon={<Home size={18} />}>
          Voltar
        </Button>
      </Card>
    );
  }

  if (summary) {
    return <Summary assignment={assignment} onHome={() => router.replace("/")} />;
  }

  const item = assignment.items[index];
  const step = { index: index + 1, total: assignment.items.length };
  const ex = item.exercise;

  return (
    <div className="mx-auto max-w-2xl">
      {ex.type === "ditado" && (
        <DitadoPlayer
          key={index}
          exercise={ex as Extract<StoredExercise, { type: "ditado" }>}
          submit={submit}
          onDone={onDone}
          step={step}
        />
      )}
      {ex.type === "compreensao" && (
        <CompreensaoPlayer
          key={index}
          exercise={ex as Extract<StoredExercise, { type: "compreensao" }>}
          submit={submit}
          onDone={onDone}
          step={step}
        />
      )}
      {ex.type === "matematica" && (
        <MatematicaPlayer
          key={index}
          exercise={ex as Extract<StoredExercise, { type: "matematica" }>}
          submit={submit}
          onDone={onDone}
          step={step}
        />
      )}
      {(ex.type === "traducao-en-pt" || ex.type === "traducao-pt-en") && (
        <TraducaoPlayer
          key={index}
          exercise={
            ex as Extract<
              StoredExercise,
              { type: "traducao-en-pt" | "traducao-pt-en" }
            >
          }
          submit={submit}
          onDone={onDone}
          step={step}
        />
      )}
      {ex.type === "interpretacao-en" && (
        <InterpretacaoPlayer
          key={index}
          exercise={ex as Extract<StoredExercise, { type: "interpretacao-en" }>}
          submit={submit}
          onDone={onDone}
          step={step}
        />
      )}
    </div>
  );
}

function Summary({
  assignment,
  onHome,
}: {
  assignment: AssignmentDTO;
  onHome: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-2xl space-y-6"
    >
      <div className="text-center">
        <h1 className="font-display text-3xl font-extrabold text-ink">
          Trabalho concluído!
        </h1>
        <p className="text-slate-500">{assignment.title || "Bom trabalho!"}</p>
      </div>

      <Card className="flex flex-col items-center">
        <span className="mb-2 flex items-center gap-2 font-display font-bold text-slate-500">
          <Trophy size={18} className="text-gold" /> Nota final (média)
        </span>
        <ScoreDisplay score={assignment.finalScore ?? 0} />
      </Card>

      <div className="grid gap-3 sm:grid-cols-3">
        {assignment.items.map((it, i) => (
          <Card key={i} className="flex flex-col items-center py-5 text-center">
            <span className="text-sm font-semibold text-slate-400">
              {exerciseLabelShort(it.exercise.type)}
            </span>
            <span
              className={`mt-1 font-display text-3xl font-extrabold ${
                typeof it.score === "number"
                  ? scoreColor(it.score).text
                  : "text-slate-300"
              }`}
            >
              {typeof it.score === "number" ? it.score.toFixed(1) : "—"}
            </span>
          </Card>
        ))}
      </div>

      <div className="flex justify-center">
        <Button size="lg" icon={<Home size={20} />} onClick={onHome}>
          Voltar ao início
        </Button>
      </div>
    </motion.div>
  );
}
