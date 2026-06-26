import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { AuthUser } from "@/types";

// ============================================================================
// Autenticação: hash de segredos (bcrypt) + sessão JWT em cookie httpOnly.
// Server-only.
// ============================================================================

export const COOKIE_NAME = "edukit_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 dias

function secretKey(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (!s || s.length < 16) {
    throw new Error(
      "AUTH_SECRET em falta ou demasiado curta. Define uma string longa e aleatória em .env.local."
    );
  }
  return new TextEncoder().encode(s);
}

export function hashSecret(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export function verifySecret(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export async function signSession(user: AuthUser): Promise<string> {
  return new SignJWT({
    role: user.role,
    username: user.username,
    displayName: user.displayName,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(user.id)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secretKey());
}

export async function verifySession(token: string): Promise<AuthUser | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    if (!payload.sub) return null;
    return {
      id: payload.sub,
      role: payload.role as AuthUser["role"],
      username: payload.username as string,
      displayName: payload.displayName as string,
    };
  } catch {
    return null;
  }
}

/** Lê a sessão actual a partir do cookie (read-only). */
export async function getSession(): Promise<AuthUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: MAX_AGE,
};
