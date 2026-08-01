import { useEffect, useState } from "react";
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
}: HUDProps) {
  const { players, currentPlayerIndex, status, timerConfig, currentLife, maxLife } = game;
  const currentPlayer = players[currentPlayerIndex];
  const isMyTurn = myPlayerId !== undefined && currentPlayer?.id === myPlayerId;

  // Cronómetro visual: se recalcula cada segundo mientras la partida esté en curso
  // y tenga un modo de tiempo activo. No envía nada al servidor — es puramente informativo,
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
        <h1 style={styles.title}>Michi 3D</h1>
        <div style={styles.topRightGroup}>
          {roomCode && (
            <div style={styles.roomCodeBadge}>
              Sala <strong>{roomCode}</strong>
            </div>
          )}
          <button style={styles.resetButton} onClick={onReset}>
            Reiniciar
          </button>
          {isHost && onToggleLocked && (
            <button style={styles.hostButton} onClick={() => onToggleLocked(!locked)}>
              {locked ? "🔒 Cerrada" : "🔓 Abierta"}
            </button>
          )}
          {isHost && onEndGame && status.kind === "playing" && (
            <button style={styles.endButton} onClick={onEndGame}>
              Terminar
            </button>
          )}
          {onLeave && (
            <button style={styles.leaveButton} onClick={onLeave}>
              Salir
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
                  <strong>Es tu turno</strong>
                ) : (
                  <>
                    Turno de <strong>{currentPlayer.name}</strong>
                  </>
                )
              ) : (
                <>
                  Turno de <strong>{currentPlayer.name}</strong>
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
            ¡Ganó <strong>{players.find((p) => p.id === status.playerId)?.name}</strong>! 🎉
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
            ¡Ganó <strong>{players.find((p) => p.id === status.playerId)?.name}</strong> — los demás quedaron
            eliminados 💔
          </div>
        )}

        {status.kind === "draw" && <div style={styles.turnIndicator}>Empate — el tablero se llenó 🤝</div>}

        {status.kind === "ended_by_host" && (
          <div style={styles.turnIndicator}>El creador de la sala terminó la partida ⏹</div>
        )}

        <LifeBars players={players} currentLife={currentLife} maxLife={maxLife} />
      </div>

      <div style={styles.hint}>Arrastra para rotar la cámara · Clic en una casilla para jugar</div>
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
              {p.eliminated && " ☠️"}
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
    fontFamily: "system-ui, -apple-system, sans-serif",
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
    color: "#f5f5f5",
    fontSize: 22,
    margin: 0,
    fontWeight: 700,
    letterSpacing: 0.5,
  },
  roomCodeBadge: {
    pointerEvents: "none",
    background: "rgba(92, 157, 255, 0.15)",
    border: "1px solid #5c9dff",
    color: "#c7dcff",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    letterSpacing: 1,
  },
  resetButton: {
    pointerEvents: "auto",
    background: "#3d4456",
    color: "#f5f5f5",
    border: "1px solid #5a6377",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  hostButton: {
    pointerEvents: "auto",
    background: "#3d4456",
    color: "#f5f5f5",
    border: "1px solid #5a6377",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  endButton: {
    pointerEvents: "auto",
    background: "transparent",
    color: "#ffd75c",
    border: "1px solid #6b5d33",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  leaveButton: {
    pointerEvents: "auto",
    background: "transparent",
    color: "#ff9b9b",
    border: "1px solid #5a3d3d",
    borderRadius: 8,
    padding: "8px 16px",
    fontSize: 14,
    cursor: "pointer",
  },
  statusBox: {
    background: "rgba(20, 22, 30, 0.75)",
    backdropFilter: "blur(6px)",
    borderRadius: 10,
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
    color: "#f5f5f5",
    fontSize: 16,
    display: "flex",
    alignItems: "center",
    gap: 8,
  },
  timerBadge: {
    background: "rgba(92, 157, 255, 0.15)",
    border: "1px solid #5c9dff",
    color: "#c7dcff",
    borderRadius: 8,
    padding: "4px 10px",
    fontSize: 13,
    fontVariantNumeric: "tabular-nums",
  },
  timerBadgeLow: {
    background: "rgba(255, 92, 92, 0.2)",
    border: "1px solid #ff5c5c",
    color: "#ff9b9b",
  },
  swatch: {
    width: 14,
    height: 14,
    borderRadius: 4,
    display: "inline-block",
  },
  livesRow: {
    display: "flex",
    flexDirection: "column",
    gap: 4,
    paddingTop: 4,
    borderTop: "1px solid #333a4d",
  },
  livesEntry: {
    color: "#c5cad6",
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
    background: "#14161e",
    borderRadius: 4,
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
    color: "#9aa3b5",
    fontSize: 12,
    marginTop: "auto",
  },
};
