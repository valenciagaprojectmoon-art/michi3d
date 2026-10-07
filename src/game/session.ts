// Guarda en el navegador a qué sala estabas jugando, para volver a entrar si refrescas la página.
// Solo se guardan el código de sala y el nombre (lo mismo que ya ves en pantalla). Caduca a las 3 horas.

const KEY = "michi3d-session";
const MAX_AGE_MS = 3 * 60 * 60 * 1000;

export interface SavedSession {
  roomCode: string;
  playerName: string;
}

export function saveSession(roomCode: string, playerName: string): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ roomCode, playerName, savedAt: Date.now() }));
  } catch {
    // Sin almacenamiento (modo privado): simplemente no se podrá reconectar al refrescar.
  }
}

export function clearSession(): void {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // nada que hacer
  }
}

export function loadSession(): SavedSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as { roomCode?: unknown; playerName?: unknown; savedAt?: unknown };
    if (typeof data.roomCode !== "string" || typeof data.playerName !== "string" || typeof data.savedAt !== "number") return null;
    if (Date.now() - data.savedAt > MAX_AGE_MS) {
      clearSession();
      return null;
    }
    return { roomCode: data.roomCode, playerName: data.playerName };
  } catch {
    return null;
  }
}
