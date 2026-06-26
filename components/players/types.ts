import type { ExerciseResult, MathResult } from "@/types";

export interface SubmitPayload {
  studentText?: string;
  photoBase64?: string;
  mimeType?: string;
  timeSpent?: number;
}

export interface SubmitResponse {
  result: ExerciseResult | MathResult;
  illegible?: boolean;
}

export interface PlayerProps<E> {
  exercise: E;
  /** Envia a resposta ao servidor para correção e devolve o resultado. */
  submit: (payload: SubmitPayload) => Promise<SubmitResponse>;
  /** Avança para o exercício seguinte (ou para o resumo final). */
  onDone: () => void;
  /** Número do exercício (1..3) e total, para o cabeçalho. */
  step: { index: number; total: number };
}
