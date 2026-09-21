import type {
  AdminOverview,
  AdminUserRow,
  AssignmentDTO,
  AuthUser,
  ExerciseResult,
  MathResult,
  StoredExercise,
  ServerSettings,
  StudentSummary,
  UsageEventDTO,
  UserStatus,
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
}): Promise<{ user: AuthUser | null; pending?: boolean; message?: string }> {
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
  gradeLevel: number;
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

export function repeatAssignment(
  id: string
): Promise<{ assignment: AssignmentDTO }> {
  return req(`/api/assignments/${id}/repeat`, { method: "POST" });
}

export function createAssignment(input: {
  studentIds: string[];
  title?: string;
  exercises: StoredExercise[];
  dueDate?: string | null;
}): Promise<{ assignments: AssignmentDTO[]; count: number }> {
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
    answers?: number[];
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

// --- Administração ------------------------------------------------------------

export function adminOverview(): Promise<AdminOverview> {
  return req("/api/admin/overview");
}

export function adminUsers(): Promise<{ users: AdminUserRow[] }> {
  return req("/api/admin/users");
}

export function adminSetUserStatus(
  id: string,
  status: UserStatus
): Promise<{ ok: boolean; status: UserStatus }> {
  return req(`/api/admin/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function adminUsage(limit = 50): Promise<{ events: UsageEventDTO[] }> {
  return req(`/api/admin/usage?limit=${limit}`);
}

export function adminUpdateSettings(
  patch: Partial<ServerSettings>
): Promise<{ settings: ServerSettings }> {
  return req("/api/admin/settings", {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}
