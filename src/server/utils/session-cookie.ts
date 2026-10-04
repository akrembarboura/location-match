import { cookies } from "next/headers";
import { AUTH_CONFIG } from "../config/auth";

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set({
    name: AUTH_CONFIG.SESSION_COOKIE_NAME,
    value: token,
    ...AUTH_CONFIG.COOKIE_OPTIONS,
  });
}

export async function getSessionCookie(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(AUTH_CONFIG.SESSION_COOKIE_NAME)?.value;
}

export async function deleteSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_CONFIG.SESSION_COOKIE_NAME);
}

