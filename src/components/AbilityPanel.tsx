import { useState } from "react";
import type { AbilitiesConfig, AbilityId, ShuffleConfig } from "../game/abilities";
import { shouldConsumeTurn } from "../game/abilities";
import type { Player } from "../game/logic";

interface AbilityPanelProps {
  myPlayerId: number;
  isMyTurn: boolean;
  assignedAbilities: AbilityId[]; // habilidades que YO tengo asignadas ahora mismo (con Shuffle: mi mano actual)
  abilitiesConfig: AbilitiesConfig; // parámetros de cada habilidad, para mostrarlos como referencia
  players: Player[]; // para armar la lista de objetivos posibles
  onUseAbility: (ability: AbilityId, targetPlayerId?: number) => void;
  onEnterCellTargetMode: (ability: AbilityId) => void; // para habilidades con objetivo de CASILLA (ver App.tsx)
  onCancelCellTargetMode: () => void;
  cellTargetModeActive: AbilityId | null; // si App.tsx está esperando que el jugador elija una casilla
  shuffle: ShuffleConfig | null; // presente si el sistema de Shuffle está activo en esta sala
  noConsumeUsesRemaining: number; // usos Z restantes en el turno actual (solo relevante si shuffle no es null)
}

/** Habilidades que necesitan elegir un JUGADOR objetivo (manejado aquí mismo, con botones). */
const PLAYER_TARGETED_ABILITIES: AbilityId[] = ["globo_pintura"];

/**
 * Habilidades que necesitan elegir una CASILLA objetivo (delegado a App.tsx,
 * que controla el clic sobre el tablero 3D — este panel no puede manejar esa
 * selección por sí mismo, ya que el tablero vive fuera de este componente).
 */
const CELL_TARGETED_ABILITIES: AbilityId[] = ["malversion_fondos"];

/** Nombres legibles para mostrar en botones, ya que los ids internos usan snake_case. */
const ABILITY_LABELS: Record<AbilityId, string> = {
  papa_caliente: "🥔 Papa Caliente",
  chicharron: "🍖 Chicharrón",
  postcognicion: "🔮 Postcognición",
  acelerador_particulas: "⚛️ Acelerador de Partículas",
  globo_pintura: "🎨 Globo de Pintura",
  balanza: "⚖️ Balanza",
  reloj_roto: "⏰ Reloj Roto",
  brujula_mal_imantada: "🧭 Brújula Mal Imantada",
  goyslop: "🥫 Goyslop",
  malversion_fondos: "💰 Malversión de Fondos",
};

export function AbilityPanel({
  myPlayerId,
  isMyTurn,
  assignedAbilities,
  players,
  onUseAbility,
  onEnterCellTargetMode,
  onCancelCellTargetMode,
  cellTargetModeActive,
  shuffle,
  noConsumeUsesRemaining,
}: AbilityPanelProps) {
  const [pickingTargetFor, setPickingTargetFor] = useState<AbilityId | null>(null);

  if (assignedAbilities.length === 0) return null;

  const possibleTargets = players.filter((p) => p.id !== myPlayerId && !p.eliminated);

  const handleClick = (ability: AbilityId) => {
    if (!isMyTurn) return;
    if (CELL_TARGETED_ABILITIES.includes(ability)) {
      onEnterCellTargetMode(ability);
      return;
    }
    if (PLAYER_TARGETED_ABILITIES.includes(ability)) {
      setPickingTargetFor(ability);
      return;
    }
    onUseAbility(ability);
  };

  const handlePickTarget = (targetId: number) => {
    if (pickingTargetFor) onUseAbility(pickingTargetFor, targetId);
    setPickingTargetFor(null);
  };

  // Mientras App.tsx espera que el jugador elija una casilla, mostramos un
  // aviso simple en vez de la lista de botones (el propio tablero es la UI
  // de selección en este caso, no este panel).
  if (cellTargetModeActive) {
    return (
      <div style={styles.container}>
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>
            Elige una casilla ajena para {ABILITY_LABELS[cellTargetModeActive]}
          </div>
          <button style={styles.cancelButton} onClick={onCancelCellTargetMode}>
            Cancelar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {pickingTargetFor ? (
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>Elige un objetivo para {ABILITY_LABELS[pickingTargetFor]}</div>
          <div style={styles.targetButtons}>
            {possibleTargets.map((p) => (
              <button key={p.id} style={{ ...styles.targetButton, borderColor: p.color }} onClick={() => handlePickTarget(p.id)}>
                {p.name}
              </button>
            ))}
            <button style={styles.cancelButton} onClick={() => setPickingTargetFor(null)}>
              Cancelar
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.abilityButtons}>
          {shuffle && (
            <div style={styles.zCounter}>
              {noConsumeUsesRemaining > 0
                ? `Usos gratis restantes este turno: ${noConsumeUsesRemaining}`
                : "Sin usos gratis — la siguiente habilidad consumirá tu turno"}
            </div>
          )}
          {assignedAbilities.map((ability) => {
            const willConsume = shuffle
              ? shouldConsumeTurn({ shuffle, noConsumeUsesRemaining }, ability)
              : true;
            return (
              <button
                key={ability}
                style={{ ...styles.abilityButton, opacity: isMyTurn ? 1 : 0.5 }}
                disabled={!isMyTurn}
                onClick={() => handleClick(ability)}
                title={
                  !isMyTurn
                    ? "Solo puedes usar habilidades en tu turno"
                    : willConsume
                      ? "Usar habilidad (consume tu turno)"
                      : "Usar habilidad (no consume tu turno — te queda al menos 1 uso gratis)"
                }
              >
                {ABILITY_LABELS[ability]}
                {shuffle && !willConsume && <span style={styles.freeTag}> · gratis</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: "absolute",
    bottom: 60,
    left: "50%",
    transform: "translateX(-50%)",
    pointerEvents: "none",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  abilityButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
    maxWidth: "90vw",
    alignItems: "center",
  },
  zCounter: {
    pointerEvents: "none",
    color: "#9aa3b5",
    fontSize: 12,
    width: "100%",
    textAlign: "center",
    marginBottom: 2,
  },
  freeTag: {
    color: "#7be495",
    fontSize: 11,
  },
  abilityButton: {
    pointerEvents: "auto",
    background: "rgba(28, 32, 48, 0.9)",
    backdropFilter: "blur(6px)",
    color: "#f5f5f5",
    border: "1px solid #3d4456",
    borderRadius: 10,
    padding: "10px 14px",
    fontSize: 13,
    cursor: "pointer",
    whiteSpace: "nowrap",
  },
  targetPicker: {
    pointerEvents: "auto",
    background: "rgba(20, 22, 30, 0.95)",
    backdropFilter: "blur(6px)",
    border: "1px solid #3d4456",
    borderRadius: 12,
    padding: "14px 18px",
    display: "flex",
    flexDirection: "column",
    gap: 10,
    alignItems: "center",
  },
  targetPickerTitle: {
    color: "#c5cad6",
    fontSize: 13,
  },
  targetButtons: {
    display: "flex",
    gap: 8,
    flexWrap: "wrap",
    justifyContent: "center",
  },
  targetButton: {
    background: "#14161e",
    color: "#f5f5f5",
    border: "2px solid",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
  cancelButton: {
    background: "transparent",
    color: "#9aa3b5",
    border: "1px solid #3d4456",
    borderRadius: 8,
    padding: "8px 14px",
    fontSize: 13,
    cursor: "pointer",
  },
};
