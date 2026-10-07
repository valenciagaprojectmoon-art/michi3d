import { useState } from "react";
import { useI18n } from "../i18n";
import { ABILITY_INFO } from "../game/abilityInfo";
import type { AbilitiesConfig, AbilityId, ShuffleConfig, PapaCalienteState, AceleradorState } from "../game/abilities";
import type { AbilityExtras } from "../game/useMultiplayer";
import { shouldConsumeTurn } from "../game/abilities";
import type { Player } from "../game/logic";

interface AbilityPanelProps {
  myPlayerId: number;
  isMyTurn: boolean;
  assignedAbilities: AbilityId[]; // habilidades que YO tengo asignadas ahora mismo (con Shuffle: mi mano actual)
  abilitiesConfig: AbilitiesConfig; // parámetros de cada habilidad, para mostrarlos como referencia
  players: Player[]; // para armar la lista de objetivos posibles
  onUseAbility: (ability: AbilityId, targetPlayerId?: number) => void;
  onEnterCellTargetMode: (ability: AbilityId, primaryTargetPlayerId?: number) => void; // para habilidades con objetivo de CASILLA (ver App.tsx); con Postcognición lleva además el jugador copiado
  onCancelCellTargetMode: () => void;
  cellTargetModeActive: AbilityId | null; // si App.tsx está esperando que el jugador elija una casilla
  shuffle: ShuffleConfig | null; // presente si el sistema de Shuffle está activo en esta sala
  noConsumeUsesRemaining: number; // usos Z restantes en el turno actual (solo relevante si shuffle no es null)
  papaCaliente: PapaCalienteState; // quién tiene la Papa Caliente ahora mismo
  acelerador: AceleradorState; // votos del Acelerador de Partículas
  allAssigned: Record<number, AbilityId[]>; // manos de todos los jugadores: Postcognición copia la primera habilidad del objetivo
  onUsePostcognicion: (targetPlayerId: number, secondary: { playerId?: number; stepsBack?: number }) => void;
  globalTurnIndex: number; // turnos absolutos jugados (para saber si el Acelerador ya apareció)
  onUseAbilityExtras: (ability: AbilityId, targetPlayerId: number | undefined, extras: AbilityExtras) => void; // Brújula y Papa Caliente
}

/** Habilidades que necesitan elegir un JUGADOR objetivo (manejado aquí mismo, con botones). */
const PLAYER_TARGETED_ABILITIES: AbilityId[] = ["globo_pintura", "postcognicion"];

/**
 * Habilidades que necesitan elegir una CASILLA objetivo (delegado a App.tsx,
 * que controla el clic sobre el tablero 3D - este panel no puede manejar esa
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
  abilitiesConfig,
  papaCaliente,
  acelerador,
  globalTurnIndex,
  allAssigned,
  onUsePostcognicion,
  onUseAbilityExtras,
}: AbilityPanelProps) {
  const { t } = useI18n();
  const [pickingTargetFor, setPickingTargetFor] = useState<AbilityId | null>(null);
  const [pickingPapaPass, setPickingPapaPass] = useState(false);
  const [pickingBrujulaSteps, setPickingBrujulaSteps] = useState(false);
  // Postcognición: tras elegir a quién copiar, si la habilidad copiada necesita un 2.º objetivo se pide aquí.
  const [postcog, setPostcog] = useState<{ target: number; stage: "player" | "steps"; copied: AbilityId } | null>(null);

  // El dueño de la Papa Caliente SIEMPRE ve el botón de pasarla, aunque con Shuffle
  // no la tenga en la mano ahora mismo (si no, no podría librarse de ella).
  const iHoldPapa = papaCaliente.holderId === myPlayerId;
  const displayedAbilities: AbilityId[] =
    iHoldPapa && !assignedAbilities.includes("papa_caliente") ? [...assignedAbilities, "papa_caliente"] : assignedAbilities;
  if (displayedAbilities.length === 0) return null;

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
    if (ability === "brujula_mal_imantada") {
      setPickingBrujulaSteps(true);
      return;
    }
    if (ability === "papa_caliente") {
      if (papaCaliente.holderId === null) {
        onUseAbilityExtras("papa_caliente", undefined, { papaCalienteAction: "activate" });
      } else if (papaCaliente.holderId === myPlayerId) {
        setPickingPapaPass(true);
      }
      return;
    }
    onUseAbility(ability);
  };

  const holderName = papaCaliente.holderId === null ? null : players.find((p) => p.id === papaCaliente.holderId)?.name ?? "otro jugador";
  const maxSteps = abilitiesConfig.brujula_mal_imantada?.maxTurnosAtras ?? 1;
  const aceleradorParams = abilitiesConfig.acelerador_particulas;
  const aceleradorNotYet = !!aceleradorParams && globalTurnIndex < aceleradorParams.turnoDeAparicion;
  const aceleradorBlocked =
    !aceleradorParams || aceleradorNotYet || acelerador.effectLive || acelerador.activatedByPlayerIds.includes(myPlayerId);
  const aceleradorNeeded = aceleradorParams
    ? Math.max(1, Math.min(aceleradorParams.jugadoresParaActivar, players.filter((p) => !p.eliminated).length))
    : 0;

  const handlePickTarget = (targetId: number) => {
    if (!pickingTargetFor) return;
    if (pickingTargetFor === "postcognicion") {
      // El servidor copia la PRIMERA habilidad de la mano del objetivo (determinista),
      // así que el cliente sabe de antemano qué segundo objetivo hará falta.
      const copied = allAssigned[targetId]?.[0];
      setPickingTargetFor(null);
      if (copied === "globo_pintura" || (copied === "papa_caliente" && papaCaliente.holderId === myPlayerId)) {
        setPostcog({ target: targetId, stage: "player", copied });
        return;
      }
      if (copied === "malversion_fondos") {
        onEnterCellTargetMode("postcognicion", targetId);
        return;
      }
      if (copied === "brujula_mal_imantada") {
        setPostcog({ target: targetId, stage: "steps", copied });
        return;
      }
      onUsePostcognicion(targetId, {});
      return;
    }
    onUseAbility(pickingTargetFor, targetId);
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
            {t("Elige una casilla ajena para {ability}", { ability: t(ABILITY_LABELS[cellTargetModeActive]) })}
          </div>
          <button style={styles.cancelButton} onClick={onCancelCellTargetMode}>
            {t("Cancelar")}
          </button>
        </div>
      </div>
    );
  }

  if (postcog) {
    const copiedLabel = ABILITY_LABELS[postcog.copied];
    return (
      <div style={styles.container}>
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>
            {postcog.stage === "player"
              ? t("Postcognición copia {ability}: elige su objetivo", { ability: t(copiedLabel) })
              : t("Postcognición copia {ability}: ¿cuántos turnos retrocedes?", { ability: t(copiedLabel) })}
          </div>
          <div style={styles.targetButtons}>
            {postcog.stage === "player"
              ? possibleTargets.map((p) => (
                  <button
                    key={p.id}
                    style={{ ...styles.targetButton, borderColor: p.color }}
                    onClick={() => {
                      onUsePostcognicion(postcog.target, { playerId: p.id });
                      setPostcog(null);
                    }}
                  >
                    {p.name}
                  </button>
                ))
              : Array.from({ length: Math.max(1, maxSteps) }, (_, i) => i + 1).map((n) => (
                  <button
                    key={n}
                    style={styles.targetButton}
                    onClick={() => {
                      onUsePostcognicion(postcog.target, { stepsBack: n });
                      setPostcog(null);
                    }}
                  >
                    {n}
                  </button>
                ))}
            <button style={styles.cancelButton} onClick={() => setPostcog(null)}>
              {t("Cancelar")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pickingBrujulaSteps) {
    return (
      <div style={styles.container}>
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>{t("¿Cuántos turnos quieres retroceder con {ability}?", { ability: t(ABILITY_LABELS.brujula_mal_imantada) })}</div>
          <div style={styles.targetButtons}>
            {Array.from({ length: Math.max(1, maxSteps) }, (_, i) => i + 1).map((n) => (
              <button
                key={n}
                style={styles.targetButton}
                onClick={() => {
                  onUseAbilityExtras("brujula_mal_imantada", undefined, { stepsBack: n });
                  setPickingBrujulaSteps(false);
                }}
              >
                {n}
              </button>
            ))}
            <button style={styles.cancelButton} onClick={() => setPickingBrujulaSteps(false)}>
              {t("Cancelar")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (pickingPapaPass) {
    return (
      <div style={styles.container}>
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>{t("¿A quién le pasas la {ability}?", { ability: t(ABILITY_LABELS.papa_caliente) })}</div>
          <div style={styles.targetButtons}>
            {possibleTargets.map((p) => (
              <button
                key={p.id}
                style={{ ...styles.targetButton, borderColor: p.color }}
                onClick={() => {
                  onUseAbilityExtras("papa_caliente", p.id, { papaCalienteAction: "pass" });
                  setPickingPapaPass(false);
                }}
              >
                {p.name}
              </button>
            ))}
            <button style={styles.cancelButton} onClick={() => setPickingPapaPass(false)}>
              {t("Cancelar")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {pickingTargetFor ? (
        <div style={styles.targetPicker}>
          <div style={styles.targetPickerTitle}>{t("Elige un objetivo para {ability}", { ability: t(ABILITY_LABELS[pickingTargetFor]) })}</div>
          <div style={styles.targetButtons}>
            {possibleTargets.map((p) => (
              <button key={p.id} style={{ ...styles.targetButton, borderColor: p.color }} onClick={() => handlePickTarget(p.id)}>
                {p.name}
              </button>
            ))}
            <button style={styles.cancelButton} onClick={() => setPickingTargetFor(null)}>
              {t("Cancelar")}
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.abilityButtons}>
          {holderName && (
            <div style={styles.zCounter}>
              {t("🥔 La Papa Caliente la tiene {who} · turnos sostenida: {turns}", { who: papaCaliente.holderId === myPlayerId ? t("TI") : (holderName ?? ""), turns: papaCaliente.turnsHeld })}
            </div>
          )}
          {aceleradorParams && (
            <div style={styles.zCounter}>
              {acelerador.effectLive
                ? t("⚛️ ¡Acelerador ACTIVO! −{damage} de vida por cada {seconds}s que tardes en jugar", { damage: aceleradorParams.danoPorTardanza, seconds: aceleradorParams.segundosPorDano })
                : aceleradorNotYet
                  ? t("⚛️ El Acelerador aparece tras {turn} turnos jugados (van {played})", { turn: aceleradorParams.turnoDeAparicion, played: globalTurnIndex })
                  : t("⚛️ Acelerador: votos {votes}/{needed}", { votes: acelerador.activatedByPlayerIds.length, needed: aceleradorNeeded })}
            </div>
          )}
          {shuffle && (
            <div style={styles.zCounter}>
              {noConsumeUsesRemaining > 0
                ? t("Usos gratis restantes este turno: {n}", { n: noConsumeUsesRemaining })
                : t("Sin usos gratis, la próxima habilidad te cuesta el turno.")}
            </div>
          )}
          {displayedAbilities.map((ability) => {
            const willConsume = shuffle
              ? shouldConsumeTurn({ shuffle, noConsumeUsesRemaining }, ability)
              : true;
            const papaBlocked =
              ability === "papa_caliente" && papaCaliente.holderId !== null && papaCaliente.holderId !== myPlayerId;
            const acelBlocked = ability === "acelerador_particulas" && aceleradorBlocked;
            const label =
              ability === "papa_caliente"
                ? papaCaliente.holderId === null
                  ? "🥔 Tomar Papa Caliente"
                  : papaCaliente.holderId === myPlayerId
                    ? "🥔 Pasar Papa Caliente"
                    : ABILITY_LABELS[ability]
                : ABILITY_LABELS[ability];
            return (
              <button
                key={ability}
                style={{ ...styles.abilityButton, opacity: isMyTurn && !papaBlocked && !acelBlocked ? 1 : 0.5 }}
                disabled={!isMyTurn || papaBlocked || acelBlocked}
                onClick={() => handleClick(ability)}
                title={t(ABILITY_INFO[ability]) + "\n\n" + (!isMyTurn
                    ? t("Solo puedes usar habilidades en tu turno")
                    : papaBlocked
                      ? t("La Papa Caliente la tiene {who}", { who: holderName ?? "" })
                      : acelBlocked
                        ? aceleradorNotYet
                          ? t("El Acelerador aparece tras {turn} turnos jugados (van {played})", { turn: aceleradorParams?.turnoDeAparicion ?? 0, played: globalTurnIndex })
                          : acelerador.effectLive
                            ? t("El Acelerador ya está activo")
                            : t("Ya votaste para activar el Acelerador")
                        : willConsume
                      ? t("Usar habilidad (consume tu turno)")
                      : t("Usar habilidad (no consume tu turno, te queda al menos 1 uso gratis)"))}
              >
                {t(label)}
                {shuffle && !willConsume && <span style={styles.freeTag}>{t(" · gratis")}</span>}
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
