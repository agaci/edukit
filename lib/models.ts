import { ObjectId, type Collection } from "mongodb";
import { getDb } from "@/lib/db";
import type {
  AssignmentDTO,
  AssignmentItem,
  AssignmentStatus,
  AuthUser,
  Role,
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
  createdAt: Date;
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
  createdAt: Date;
  completedAt?: Date;
}

export async function usersCol(): Promise<Collection<UserDoc>> {
  const db = await getDb();
  return db.collection<UserDoc>("users");
}

export async function assignmentsCol(): Promise<Collection<AssignmentDoc>> {
  const db = await getDb();
  return db.collection<AssignmentDoc>("assignments");
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
    createdAt: doc.createdAt.toISOString(),
    completedAt: doc.completedAt?.toISOString(),
  };
}

export { ObjectId };
