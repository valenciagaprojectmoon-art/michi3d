import { useI18n } from "../i18n";
import { winRate } from "../game/leaderboard";
import type { LeaderboardRow } from "../game/leaderboard";

interface LeaderboardProps {
  rows: LeaderboardRow[] | null | "loading"; // null = no se pudo cargar
}

/** Clasificación pública: las cuentas con más victorias. */
export function Leaderboard({ rows }: LeaderboardProps) {
  const { t } = useI18n();
  if (rows === "loading") return <div style={styles.box}>{t("Cargando clasificación...")}</div>;
  if (rows === null) return <div style={styles.box}>{t("No se pudo cargar la clasificación.")}</div>;
  if (rows.length === 0) return <div style={styles.box}>{t("Aún no hay partidas entre cuentas. Juega con tu cuenta y aparecerás aquí.")}</div>;
  return (
    <div style={styles.box}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>#</th>
            <th style={{ ...styles.th, textAlign: "left" }}>{t("Jugador")}</th>
            <th style={styles.th}>{t("Victorias")}</th>
            <th style={styles.th}>{t("Partidas")}</th>
            <th style={styles.th}>{t("% victorias")}</th>
            <th style={styles.th}>{t("Mejor racha")}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.rank}>
              <td style={styles.td}>{r.rank}</td>
              <td style={{ ...styles.td, textAlign: "left", color: "#fff" }}>{r.name}</td>
              <td style={styles.td}>{r.wins}</td>
              <td style={styles.td}>{r.games}</td>
              <td style={styles.td}>{winRate(r)}%</td>
              <td style={styles.td}>{r.bestStreak}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div style={styles.note}>{t("Solo cuentan las partidas con al menos dos cuentas.")}</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: { padding: "10px 12px", marginTop: 10, border: "1px solid var(--line)", borderRadius: 3, background: "rgba(255,255,255,0.03)", color: "var(--text2)", fontSize: 13 },
  table: { width: "100%", borderCollapse: "collapse" },
  th: { padding: "4px 6px", color: "var(--muted)", fontWeight: 500, textAlign: "center", fontSize: 12 },
  td: { padding: "4px 6px", textAlign: "center", borderTop: "1px solid var(--surface2)" },
  note: { marginTop: 8, color: "var(--muted)", fontSize: 12 },
};
