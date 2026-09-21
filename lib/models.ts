import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db";
import type {
  AssignmentDTO,
  AssignmentItem,
  AssignmentStatus,
  AuthUser,
  PastAttempt,
  Role,
  ServerSettings,
  UserStatus,
} from "@/types";

// ============================================================================
// Formas dos documentos no Mongo + conversores para DTO. Server-only.
// ============================================================================

export interface UserDoc {
  _id?: ObjectId;
  role: Role;
  username: string; // único, minúsculas (identificador de login)
  displayName: string;
  secretHash: string; // password (tutor) ou PIN (aluno), com bcrypt
  tutorId?: ObjectId; // para alunos: tutor que o criou
  gradeLevel?: number; // para alunos: ano escolar (1 a 12)
  createdAt: Date;

  // --- Administração ---------------------------------------------------------
  /** Ausente nas contas criadas antes do painel — equivale a "active". */
  status?: UserStatus;
  approvedAt?: Date;
  approvedBy?: string;
  lastSeenAt?: Date;
  adminNotes?: string;
}

export interface AssignmentDoc {
  _id?: ObjectId;
  tutorId: ObjectId;
  tutorName: string;
  studentId: ObjectId;
  studentUsername: string;
  studentName: string;
  title?: string;
  status: AssignmentStatus;
  items: AssignmentItem[];
  finalScore?: number;
  dueDate?: Date;
  attemptNumber?: number;
  attempts?: PastAttempt[]; // arquivado em formato DTO (datas em ISO)
  createdAt: Date;
  completedAt?: Date;
}

/** Documento único de configuração do servidor (_id fixo: "app"). */
export interface SettingsDoc extends Omit<ServerSettings, "updatedAt"> {
  _id: "app";
  updatedAt?: Date;
}

export async function usersCol(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function assignmentsCol(): Promise<Collection<AssignmentDoc>> {
  const db = await getDb();
  return db.collection<AssignmentDoc>("assignments");
}

export async function settingsCol(): Promise<Collection<SettingsDoc>> {
  const db = await getDb();
  return db.collection<SettingsDoc>("app_settings");
}

/** Contas antigas não têm `status`; a ausência conta como activa. */
export function userStatus(doc: UserDoc): UserStatus {
  return doc.status ?? "active";
}

export function toAuthUser(doc: UserDoc): AuthUser {
  return {
    id: doc._id!.toString(),
    role: doc.role,
    username: doc.username,
    displayName: doc.displayName,
  };
}

export function toAssignmentDTO(doc: AssignmentDoc): AssignmentDTO {
  return {
    id: doc._id!.toString(),
    tutorId: doc.tutorId.toString(),
    tutorName: doc.tutorName,
    studentId: doc.studentId.toString(),
    studentUsername: doc.studentUsername,
    studentName: doc.studentName,
    title: doc.title,
    status: doc.status,
    items: doc.items,
    finalScore: doc.finalScore,
    dueDate: doc.dueDate?.toISOString(),
    attemptNumber: doc.attemptNumber,
    attempts: doc.attempts,
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt?.toISOString(),
  };
}

export { ObjectId };
