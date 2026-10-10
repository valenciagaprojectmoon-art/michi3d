// Dirección del servidor, para el WebSocket (juego) y para HTTP (inicio de sesión).

// Servidor de producción (Render). Se usa cuando el juego está publicado y nadie configuró VITE_SERVER_URL.
const PRODUCTION_SERVER_URL = "wss://michi3d-server.onrender.com";

/**
 * Dirección del WebSocket, por orden de prioridad:
 * 1. VITE_SERVER_URL, si está definida (en .env o en Vercel).
 * 2. localhost:8080 si la página se abrió desde tu propio ordenador (desarrollo).
 * 3. El servidor de producción, si la página está publicada (ej. en Vercel).
 */
export function getServerUrl(): string {
  const configured = import.meta.env?.VITE_SERVER_URL as string | undefined;
  if (configured) return configured;
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host === "[::1]" || host.endsWith(".local");
  return isLocal ? "ws://localhost:8080" : PRODUCTION_SERVER_URL;
}

/** La misma dirección pero para peticiones HTTP normales (wss -> https, ws -> http). */
export function getServerHttpUrl(wsUrl: string = getServerUrl()): string {
  return wsUrl.replace(/^wss:/, "https:").replace(/^ws:/, "http:").replace(/\/+$/, "");
}
