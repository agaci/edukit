// ============================================================================
// Tipos globais do EduKit
// ============================================================================

export type ModuleId = "ditado" | "compreensao" | "matematica";

export type Difficulty = "facil" | "medio" | "dificil";

export type InputMode = "keyboard" | "photo" | "both";

export type ExerciseType =
  | "calculo-mental"
  | "problemas"
  | "geometria"
  | "medidas"
  | "sequencias";

// --- Configuração de exercício -------------------------------------------------

export interface ExerciseConfig {
  gradeLevel: number; // 1 a 12 (ano escolar — ensino básico e secundário)
  difficulty: Difficulty;
  language: string; // "pt-PT"
  inputMode: InputMode;
}

// --- Correções e resultados ----------------------------------------------------

export interface Correction {
  original: string;
  correct: string;
  explanation: string;
}

export interface CriterionScore {
  name: string;
  score: number; // pontuação parcial (0 a max)
  max: number;
  comment?: string;
}

export interface ExerciseResult {
  score: number; // 0 a 20
  feedback: string;
  corrections: Correction[];
  criteria?: CriterionScore[];
  timeSpent?: number; // segundos
  readableText?: string; // texto lido de uma foto (manuscrito), quando aplicável
  illegible?: boolean; // foto ilegível — pedir para repetir
  mcResults?: McAnswer[]; // respostas de escolha múltipla (interpretação)
}

// --- Escolha múltipla (interpretação de inglês) -------------------------------

export interface McQuestion {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
}

export interface McAnswer {
  questionId: number;
  question: string;
  options: string[];
  selectedIndex: number;
  correctIndex: number;
  correct: boolean;
}

// --- Geração de texto ----------------------------------------------------------

export interface GeneratedText {
  text: string;
  wordCount: number;
  estimatedDuration: number; // segundos estimados de leitura/ditado
  theme?: string; // tema curto (para a dica na compreensão)
}

// --- Matemática ----------------------------------------------------------------

export interface Exercise {
  id: number;
  type: string;
  statement: string;
  correctAnswer: string;
  expectedSolution: string;
}

export interface ExerciseCorrection {
  exerciseId: number;
  studentAnswer: string;
  correct: "correct" | "partial" | "incorrect";
  partialCredit: number; // 0 a 1
  correctAnswer: string;
  explanation: string;
}

export interface MathResult extends ExerciseResult {
  exerciseResults: ExerciseCorrection[];
}

// --- TTS -----------------------------------------------------------------------

export interface TTSConfig {
  rate: number; // 0.5 a 1.5
  pitch: number;
  voice: string; // voiceURI
}

// --- Definições da aplicação ---------------------------------------------------

export interface AppSettings {
  inputMode: InputMode;
  gradeLevel: number;
  tutorPin: string;
  studentName: string;
  maxTTSPlays: number;
  ttsVoiceURI: string;
}

// --- Histórico -----------------------------------------------------------------

export interface SessionResult {
  id: string;
  module: ModuleId;
  date: string; // ISO
  score: number;
  timeSpent: number;
  feedback: string;
}

// ============================================================================
// Multi-utilizador (tutor/aluno) — DTOs serializáveis (sem tipos do Mongo).
// ============================================================================

export type Role = "admin" | "tutor" | "student";

export interface AuthUser {
  id: string;
  role: Role;
  username: string;
  displayName: string;
}

export interface StudentSummary {
  id: string;
  username: string;
  displayName: string;
  gradeLevel?: number; // ano escolar (1 a 12)
  createdAt: string;
  assignmentsCount: number;
}

// Exercício gerado e guardado num trabalho (conteúdo fixo para o aluno).
export type StoredExercise =
  | {
      type: "ditado";
      gradeLevel: number;
      text: string;
      wordCount: number;
      maxPlays: number;
      inputMode: InputMode;
    }
  | {
      type: "compreensao";
      gradeLevel: number;
      text: string;
      theme?: string;
      readMinutes: number;
      writeMinutes: number;
    }
  | {
      type: "matematica";
      gradeLevel: number;
      exercises: Exercise[];
    }
  | {
      // Tradução de Inglês -> Português (sourceText em inglês).
      type: "traducao-en-pt";
      gradeLevel: number;
      sourceText: string;
    }
  | {
      // Tradução de Português -> Inglês (sourceText em português).
      type: "traducao-pt-en";
      gradeLevel: number;
      sourceText: string;
    }
  | {
      // Interpretação de texto em inglês com perguntas de escolha múltipla.
      type: "interpretacao-en";
      gradeLevel: number;
      text: string;
      questions: McQuestion[];
    };

export type StoredExerciseType = StoredExercise["type"];

export interface AssignmentItem {
  exercise: StoredExercise;
  result?: ExerciseResult | MathResult;
  score?: number; // 0-20
  completedAt?: string;
  studentAnswer?: string; // texto entregue pelo aluno (teclado)
  viaPhoto?: boolean; // entregue por fotografia
}

export type AssignmentStatus = "pending" | "in_progress" | "completed";

// Tentativa anterior arquivada (para o histórico de repetições).
export interface PastAttempt {
  attemptNumber: number;
  items: AssignmentItem[];
  finalScore?: number;
  completedAt?: string;
}

export interface AssignmentDTO {
  id: string;
  tutorId: string;
  tutorName: string;
  studentId: string;
  studentUsername: string;
  studentName: string;
  title?: string;
  status: AssignmentStatus;
  items: AssignmentItem[];
  finalScore?: number; // média das notas
  dueDate?: string; // prazo (ISO); ausente = sem prazo
  attemptNumber?: number; // tentativa atual (1 = primeira)
  attempts?: PastAttempt[]; // tentativas anteriores (mais antiga primeiro)
  createdAt: string;
  completedAt?: string;
}

// ============================================================================
// Administração: estado das contas e definições globais do servidor.
// ============================================================================

/** Contas antigas não têm o campo; a ausência equivale a "active". */
export type UserStatus = "active" | "pending" | "suspended";

/**
 * open     — qualquer pessoa cria conta e usa logo
 * approval — qualquer pessoa cria conta, mas fica à espera de aprovação
 * closed   — ninguém cria conta
 */
export type RegistrationMode = "open" | "approval" | "closed";

export interface ServerSettings {
  /** Interruptor geral: a false, nenhuma rota chama a API do Claude. */
  apiEnabled: boolean;
  /** Mensagem mostrada ao utilizador quando apiEnabled é false. */
  disabledMessage: string;
  registrationMode: RegistrationMode;
  /** Modelo usado em todas as chamadas. Só o administrador o muda. */
  model: ClaudeModelId;
  /** Euros por dólar, para converter o teto em euros no custo real em USD. */
  eurPerUsd: number;
  /** Fração do teto a partir da qual se avisa (0,8 = 80%). */
  warnThreshold: number;
  /** Teto mensal para toda a instalação, em cêntimos de euro. */
  globalMonthlyBudgetCents: number;
  updatedAt?: string;
  updatedBy?: string;
}

// --- Modelos e consumo ---------------------------------------------------------

/**
 * Modelos permitidos. Fechado de propósito: o custo por token difere em 5x
 * entre os extremos, por isso não se escreve um identificador à mão em lado
 * nenhum — escolhe-se daqui.
 */
export type ClaudeModelId =
  | "claude-sonnet-5"
  | "claude-haiku-4-5"
  | "claude-opus-4-8";

export type Operation =
  | "gerar-ditado"
  | "gerar-compreensao"
  | "gerar-matematica"
  | "gerar-traducao"
  | "gerar-interpretacao"
  | "corrigir-ditado"
  | "corrigir-compreensao"
  | "corrigir-traducao"
  | "corrigir-matematica";

/** Uma chamada à API, como fica registada no ledger. */
export interface UsageEventDTO {
  id: string;
  ts: string;
  userId: string;
  username: string;
  role: Role;
  operation: Operation;
  model: ClaudeModelId;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
  imageBytes?: number;
  /** Custo em milionésimos de dólar. Inteiro — nunca vírgula flutuante. */
  costMicros: number;
  latencyMs: number;
  ok: boolean;
  errorCode?: string;
}

export interface SpendSummary {
  periodMonth: string; // "2026-09"
  costMicros: number;
  calls: number;
  budgetMicros: number;
  /** 0 a 1+; acima de 1 significa que o teto foi ultrapassado. */
  ratio: number;
}

// --- Painel de administração ---------------------------------------------------

export interface AdminUserRow {
  id: string;
  username: string;
  displayName: string;
  role: Role;
  status: UserStatus;
  gradeLevel?: number;
  /** Para alunos: nome do tutor que os criou. */
  tutorName?: string;
  createdAt: string;
  lastSeenAt?: string;
  /** Trabalhos criados (tutor) ou recebidos (aluno). */
  assignmentsCount: number;
  completedCount: number;
  /** Só para tutores: quantos alunos tem. */
  studentsCount?: number;
  /** Gasto no mês corrente, em milionésimos de dólar. */
  costMicros: number;
  calls: number;
}

export interface OperationSpend {
  operation: Operation;
  calls: number;
  costMicros: number;
  inputTokens: number;
  outputTokens: number;
}

export interface AdminOverview {
  spend: SpendSummary;
  settings: ServerSettings;
  totals: {
    admins: number;
    tutors: number;
    students: number;
    pending: number;
    assignments: number;
    completed: number;
  };
  byOperation: OperationSpend[];
}
