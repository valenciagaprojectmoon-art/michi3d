// Inicio de sesión con Discord o Google: la sesión se guarda en el navegador y se manda al servidor al jugar online.
// El servidor es quien decide si la cuenta puede jugar (aprobada, pendiente o baneada); aquí solo se muestra.

import { getServerHttpUrl } from "./serverUrl";

const KEY = "michi3d-auth";
const TIMEOUT_MS = 60_000; // el servidor gratuito de Render puede tardar casi un minuto en despertar

export type Provider = "discord" | "google";
export type AccountStatus = "pending" | "approved" | "banned";

export interface ProvidersInfo {
  discord: boolean;
  google: boolean;
  required: boolean; // si el servidor exige iniciar sesión para jugar online
}

export interface Me {
  id: string | null;
  displayName: string;
  status: AccountStatus;
}

export function loadToken(): string | null {
  try {
    return localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function saveToken(token: string): void {
  try {
    localStorage.setItem(KEY, token);
  } catch {
    // sin almacenamiento (modo privado): la sesión durará solo hasta recargar
  }
}

export function clearToken(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nada que hacer
  }
}

export type AuthFragmentError = "cancelled" | "state" | "provider";

/**
 * Tras iniciar sesión el servidor vuelve al juego con "#session=..." (o "#auth_error=...") en la dirección.
 * Se lee, se guarda y se borra de la barra de direcciones para que no se quede a la vista ni en el historial.
 */
export function consumeAuthFragment(): { token?: string; error?: AuthFragmentError } {
  try {
    const hash = window.location.hash.replace(/^#/, "");
    if (!hash) return {};
    const params = new URLSearchParams(hash);
    const token = params.get("session");
    const error = params.get("auth_error");
    if (!token && !error) return {};
    window.history.replaceState(null, "", window.location.pathname + window.location.search);
    if (token) {
      saveToken(token);
      return { token };
    }
    return { error: error === "cancelled" || error === "state" ? error : "provider" };
  } catch {
    return {};
  }
}

async function request(path: string, token?: string): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    return await fetch(`${getServerHttpUrl()}${path}`, { headers: token ? { Authorization: `Bearer ${token}` } : {}, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/** null si no se pudo hablar con el servidor. */
export async function fetchProviders(): Promise<ProvidersInfo | null> {
  try {
    const res = await request("/auth/providers");
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<ProvidersInfo>;
    return { discord: !!data.discord, google: !!data.google, required: !!data.required };
  } catch {
    return null;
  }
}

/** "invalid" si el servidor dice que la sesión no vale; null si no se pudo hablar con él. */
export async function fetchMe(token: string): Promise<Me | "invalid" | null> {
  try {
    const res = await request("/auth/me", token);
    if (res.status === 401) return "invalid";
    if (!res.ok) return null;
    const data = (await res.json()) as Partial<Me>;
    const status = data.status === "approved" || data.status === "pending" || data.status === "banned" ? data.status : null;
    if (!status) return null;
    return { id: data.id ?? null, displayName: typeof data.displayName === "string" ? data.displayName : "", status };
  } catch {
    return null;
  }
}

export function loginUrl(provider: Provider): string {
  return `${getServerHttpUrl()}/auth/${provider}/start`;
}
