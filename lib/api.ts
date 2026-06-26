import type {
  AssignmentDTO,
  AuthUser,
  ExerciseResult,
  MathResult,
  StoredExercise,
  StudentSummary,
} from "@/types";

// ============================================================================
// Chamadas client-side às API routes de auth / alunos / trabalhos.
// ============================================================================

async function req<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data?.error ?? "Ocorreu um erro.") as Error & {
      data?: unknown;
    };
    err.data = data;
    throw err;
  }
  return data as T;
}

// --- Auth ---------------------------------------------------------------------

export function fetchMe(): Promise<{ user: AuthUser | null }> {
  return req("/api/auth/me");
}

export function login(username: string, secret: string): Promise<{ user: AuthUser }> {
  return req("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ username, secret }),
  });
}

export function registerTutor(input: {
  displayName: string;
  username: string;
  password: string;
}): Promise<{ user: AuthUser }> {
  return req("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function logout(): Promise<{ ok: boolean }> {
  return req("/api/auth/logout", { method: "POST" });
}

// --- Alunos -------------------------------------------------------------------

export function listStudents(): Promise<{ students: StudentSummary[] }> {
  return req("/api/students");
}

export function createStudent(input: {
  displayName: string;
  username?: string;
  pin: string;
}): Promise<{ student: StudentSummary }> {
  return req("/api/students", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function suggestUsername(
  name: string
): Promise<{ username: string; available: boolean }> {
  return req(`/api/students/check?name=${encodeURIComponent(name)}`);
}

// --- Trabalhos ----------------------------------------------------------------

export function listAssignments(): Promise<{ assignments: AssignmentDTO[] }> {
  return req("/api/assignments");
}

export function getAssignment(id: string): Promise<{ assignment: AssignmentDTO }> {
  return req(`/api/assignments/${id}`);
}

export function createAssignment(input: {
  studentId: string;
  title?: string;
  exercises: StoredExercise[];
}): Promise<{ assignment: AssignmentDTO }> {
  return req("/api/assignments", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function submitAssignmentItem(
  id: string,
  input: {
    index: number;
    studentText?: string;
    photoBase64?: string;
    mimeType?: string;
    timeSpent?: number;
  }
): Promise<{
  result: ExerciseResult | MathResult;
  assignment?: AssignmentDTO;
  illegible?: boolean;
}> {
  return req(`/api/assignments/${id}/submit`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}
