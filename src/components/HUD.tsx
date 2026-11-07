import { useEffect, useState } from "react";
import { useI18n } from "../i18n";
import type { GameState, Player } from "../game/logic";

interface HUDProps {
  game: GameState;
  onReset: () => void;
  roomCode?: string; // presente solo en modo online
  myPlayerId?: number; // presente solo en modo online
  isHost?: boolean; // presente solo en modo online
  locked?: boolean; // presente solo en modo online
  onLeave?: () => void; // presente solo en modo online
  onEndGame?: () => void; // presente solo en modo online, solo el host lo usa realmente
  onToggleLocked?: (locked: boolean) => void; // presente solo en modo online, solo el host lo usa realmente
  onRematch?: () => void; // presente solo en modo online
  rematchVotes?: number[]; // ids de quienes ya pidieron revancha
  rematchTotal?: number; // cuántos jugadores conectados tienen que pedirla
}

/**
 * Calcula segundos restantes del turno actual a partir de turnStartedAt + secondsPerTurn.
 * Se recalcula localmente cada segundo (ver useEffect abajo) porque el servidor solo
 * manda actualizaciones cuando algo cambia, no en cada tick del reloj.
 */
function computeSecondsLeft(game: GameState): number | null {
  if (game.timerConfig.mode === "none") return null;
  const elapsedMs = Date.now() - game.turnStartedAt;
  const remaining = game.timerConfig.secondsPerTurn - Math.floor(elapsedMs / 1000);
  return Math.max(0, remaining);
}

export function HUD({
  game,
  onReset,
  roomCode,
  myPlayerId,
  isHost,
  locked,
  onLeave,
  onEndGame,
  onToggleLocked,
  onRematch,
  rematchVotes = [],
  rematchTotal = 0,
}: HUDProps) {
  const { t, tx } = useI18n();
  const [copied, setCopied] = useState(false);

  const copyInvite = () => {
    if (!roomCode) return;
    const link = `${window.location.origin}/?sala=${roomCode}`;
    navigator.clipboard?.writeText(link).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      },
      () => window.prompt(t("Copiar enlace"), link) // si el navegador no deja copiar solo, lo mostramos para copiarlo a mano
    );
  };
  const { players, currentPlayerIndex, status, timerConfig, currentLife, maxLife } = game;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = myPlayerId !== undefined && currentPlayer?.id === myPlayerId;

  // Cronómetro visual: se recalcula cada segundo mientras la partida esté en curso
  // y tenga un modo de tiempo activo. No envía nada al servidor - es puramente informativo,
  // la autoridad real del timeout vive en el servidor (ver server.ts).
  const [secondsLeft, setSecondsLeft] = useState(() => computeSecondsLeft(game));
  useEffect(() => {
    setSecondsLeft(computeSecondsLeft(game));
    if (timerConfig.mode === "none" || status.kind !== "playing") return;
    const interval = setInterval(() => setSecondsLeft(computeSecondsLeft(game)), 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game.turnStartedAt, game.currentPlayerIndex, status.kind]);

  const isLowTime = secondsLeft !== null && secondsLeft <= 5;

  return (
    <div style={styles.container}>
      <div style={styles.topRow}>
        <h1 style={styles.title}>michi súper-bidimensional</h1>
        <div style={styles.topRightGroup}>
          {roomCode && (
            <div style={styles.roomCodeBadge}>
              {t("Sala")} <strong>{roomCode}</strong>
            </div>
          )}
          {roomCode && (
            <button style={styles.resetButton} onClick={copyInvite}>
              {copied ? t("Enlace copiado") : t("Copiar enlace")}
            </button>
          )}
          {onRematch && status.kind !== "playing" && (
            <button
              style={{ ...styles.resetButton, opacity: myPlayerId !== undefined && rematchVotes.includes(myPlayerId) ? 0.6 : 1 }}
              disabled={myPlayerId !== undefined && rematchVotes.includes(myPlayerId)}
              onClick={onRematch}
            >
              {rematchVotes.length > 0
                ? t("Revancha: {votes} de {total}", { votes: rematchVotes.length, total: rematchTotal })
                : t("Revancha")}
            </button>
          )}
          <button style={styles.resetButton} onClick={onReset}>
            {t("Reiniciar")}
          </button>
          {isHost && onToggleLocked && (
            <button style={styles.hostButton} onClick={() => onToggleLocked(!locked)}>
              {locked ? t("Cerrada") : t("Abierta")}
            </button>
          )}
          {isHost && onEndGame && status.kind === "playing" && (
            <button style={styles.endButton} onClick={onEndGame}>
              {t("Terminar")}
            </button>
          )}
          {onLeave && (
            <button style={styles.leaveButton} onClick={onLeave}>
              {t("Salir")}
            </button>
          )}
        </div>
      </div>

      <div style={styles.statusBox}>
        {status.kind === "playing" && (
          <div style={styles.turnRow}>
            <div style={styles.turnIndicator}>
              <span style={{ ...styles.swatch, backgroundColor: currentPlayer.color }} />
              {myPlayerId !== undefined ? (
                isMyTurn ? (
                  <strong>{t("Es tu turno")}</strong>
                ) : (
                  <>
                    {tx("Turno de {name}", { name: <strong>{currentPlayer.name}</strong> })}
                  </>
                )
              ) : (
                <>
                  {tx("Turno de {name}", { name: <strong>{currentPlayer.name}</strong> })}
                </>
              )}
            </div>
            {secondsLeft !== null && (
              <div style={{ ...styles.timerBadge, ...(isLowTime ? styles.timerBadgeLow : {}) }}>
                ⏱ {secondsLeft}s
              </div>
            )}
          </div>
        )}

        {status.kind === "win" && (
          <div style={styles.turnIndicator}>
            <span
              style={{
                ...styles.swatch,
                backgroundColor: players.find((p) => p.id === status.playerId)?.color,
              }}
            />
            {tx("¡Ganó {name}! ", { name: <strong>{players.find((p) => p.id === status.playerId)?.name}</strong> })}
          </div>
        )}

        {status.kind === "win_by_elimination" && (
          <div style={styles.turnIndicator}>
            <span
              style={{
                ...styles.swatch,
                backgroundColor: players.find((p) => p.id === status.playerId)?.color,
              }}
            />
            {tx("¡Ganó {name}, los demás quedaron eliminados ", { name: <strong>{players.find((p) => p.id === status.playerId)?.name}</strong> })}
          </div>
        )}

        {status.kind === "draw" && <div style={styles.turnIndicator}>{t("Empate: el tablero se llenó ")}</div>}

        {status.kind === "ended_by_host" && (
          <div style={styles.turnIndicator}>{t("El creador de la sala terminó la partida ⏹")}</div>
        )}

        <LifeBars players={players} currentLife={currentLife} maxLife={maxLife} />
      </div>

      <div style={styles.hint}>{t("Arrastra para rotar la cámara, clic en una casilla para jugar")}</div>
    </div>
  );
}

/**
 * Barras de vida de todos los jugadores. A diferencia del sistema de vidas
 * anterior (que solo aparecía en el modo "life" del timer), esto SIEMPRE se
 * muestra: toda partida tiene vida configurada por el creador, independiente
 * del timer.
 */
function LifeBars({
  players,
  currentLife,
  maxLife,
}: {
  players: Player[];
  currentLife: Record<number, number>;
  maxLife: Record<number, number>;
}) {
  return (
    <div style={styles.livesRow}>
      {players.map((p) => {
        const current = currentLife[p.id] ?? 0;
        const max = maxLife[p.id] ?? 1;
        const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
        return (
          <div key={p.id} style={{ ...styles.livesEntry, opacity: p.eliminated ? 0.4 : 1 }}>
            <span style={{ ...styles.swatch, backgroundColor: p.color }} />
            <span style={styles.lifeName}>{p.name}</span>
            <div style={styles.lifeBarTrack}>
              <div style={{ ...styles.lifeBarFill, width: `${pct}%`, backgroundColor: p.color }} />
            </div>
            <span style={styles.lifeNumbers}>
              {current}/{max}
            </span>
          </div>
        );
      })}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    padding: "16px 20px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    pointerEvents: "none",
    fontFamily: "var(--font-body)",
  },
  topRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 8,
  },
  topRightGroup: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  title: {
    color: "var(--text)",
    fontFamily: "var(--font-display)",
    fontSize: 22,
    margin: 0,
    fontWeight: 500,
    letterSpacing: -0.2,
  },
  roomCodeBadge: {
    pointerEvents: "none",
    background: "var(--accent-wash)",
    border: "1px solid var(--accent)",
    color: "var(--accent-soft)",
    borderRadius: 3,
    padding: "8px 14px",
    fontSize: 13,
    letterSpacing: 1,
  },
  resetButton: {
    pointerEvents: "auto",
    background: "var(--line2)",
    color: "var(--text)",
    border: "1px solid var(--line2)",
    borderRadius: 3,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  hostButton: {
    pointerEvents: "auto",
    background: "var(--line2)",
    color: "var(--text)",
    border: "1px solid var(--line2)",
    borderRadius: 3,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  endButton: {
    pointerEvents: "auto",
    background: "transparent",
    color: "var(--warn)",
    border: "1px solid var(--warn-line)",
    borderRadius: 3,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  leaveButton: {
    pointerEvents: "auto",
    background: "transparent",
    color: "var(--danger-soft)",
    border: "1px solid var(--danger-line)",
    borderRadius: 3,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  statusBox: {
    background: "rgba(19, 18, 16, 0.75)",
    borderRadius: 3,
    padding: "10px 16px",
    alignSelf: "flex-start",
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  turnRow: {
    display: "flex",
    alignItems: "center",
    gap: 12,
  },
  turnIndicator: {
    color: "var(--text)",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  timerBadge: {
    background: "var(--accent-wash)",
    border: "1px solid var(--accent)",
    color: "var(--accent-soft)",
    borderRadius: 3,
    padding: "4px 10px",
    fontSize: 13,
    fontVariantNumeric: "tabular-nums",
  },
  timerBadgeLow: {
    background: "var(--danger-wash)",
    border: "1px solid var(--danger)",
    color: "var(--danger-soft)",
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 2,
    display: "inline-block",
  },
  livesRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 4,
    borderTop: "1px solid var(--line)",
  },
  livesEntry: {
    color: "var(--text2)",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
  },
  lifeName: {
    minWidth: 60,
  },
  lifeBarTrack: {
    width: 80,
    height: 8,
    background: "var(--bg)",
    borderRadius: 2,
    overflow: "hidden",
  },
  lifeBarFill: {
    height: "100%",
    transition: "width 0.2s ease",
  },
  lifeNumbers: {
    fontVariantNumeric: "tabular-nums",
    minWidth: 40,
  },
  hint: {
    color: "var(--muted)",
    fontSize: 12,
    marginTop: "auto",
  },
};
