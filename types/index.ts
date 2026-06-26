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

export type Role = "tutor" | "student";

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
    };

export interface AssignmentItem {
  exercise: StoredExercise;
  result?: ExerciseResult | MathResult;
  score?: number; // 0-20
  completedAt?: string;
}

export type AssignmentStatus = "pending" | "in_progress" | "completed";

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
  finalScore?: number; // média das 3 notas
  createdAt: string;
  completedAt?: string;
}
