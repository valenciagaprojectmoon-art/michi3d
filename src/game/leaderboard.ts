import { getServerHttpUrl } from "./serverUrl";

export interface LeaderboardRow {
  rank: number;
  name: string;
  wins: number;
  losses: number;
  draws: number;
  games: number;
  bestStreak: number;
}

const TIMEOUT_MS = 60_000; // el servidor gratuito puede tardar casi un minuto en despertar

/** La clasificación pública. null si no se pudo cargar. */
export async function fetchLeaderboard(limit: number = 10): Promise<LeaderboardRow[] | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(`${getServerHttpUrl()}/leaderboard?limit=${limit}`, { signal: ctrl.signal });
    if (!res.ok) return null;
    const data = (await res.json()) as unknown;
    if (!Array.isArray(data)) return null;
    return data.filter((r): r is LeaderboardRow => !!r && typeof r.name === "string" && typeof r.wins === "number" && typeof r.games === "number");
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Porcentaje de victorias redondeado, 0 si no hay partidas. */
export function winRate(row: Pick<LeaderboardRow, "wins" | "games">): number {
  return row.games > 0 ? Math.round((row.wins / row.games) * 100) : 0;
}
