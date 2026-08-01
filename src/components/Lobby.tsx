import { useState } from "react";
import type { ChangeEvent } from "react";
import type { TimerConfig, TimeoutAction, LifeConfig } from "../game/logic";
import type { AbilitiesConfig, AbilityId, ShuffleConfig } from "../game/abilities";

interface LobbyProps {
  onCreateRoom: (
    playerName: string,
    options: {
      timerConfig: TimerConfig;
      lifeConfig: LifeConfig;
      abilitiesConfig: AbilitiesConfig;
      shuffleConfig: ShuffleConfig | null;
    }
  ) => void;
  onJoinRoom: (roomCode: string, playerName: string) => void;
  onPlayLocal: () => void;
  errorMessage: string | null;
  connecting: boolean;
}

type LobbyMode = "choose" | "configure" | "join";

/**
 * Habilidades ya conectadas al servidor y disponibles para elegir en el lobby.
 * Papa Caliente, Postcognición, Acelerador de Partículas y Brújula Mal Imantada
 * llegan en una tanda posterior — no aparecen aquí todavía.
 */
const AVAILABLE_ABILITIES: AbilityId[] = [
  "chicharron",
  "goyslop",
  "balanza",
  "globo_pintura",
  "reloj_roto",
  "malversion_fondos",
];

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

export function Lobby({ onCreateRoom, onJoinRoom, onPlayLocal, errorMessage, connecting }: LobbyProps) {
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [mode, setMode] = useState<LobbyMode>("choose");

  // Configuración de tiempo, solo relevante en modo "configure".
  const [timeMode, setTimeMode] = useState<TimerConfig["mode"]>("none");
  const [secondsPerTurn, setSecondsPerTurn] = useState(20);
  const [onTimeout, setOnTimeout] = useState<TimeoutAction>("skip_turn");
  const [damageOnTimeout, setDamageOnTimeout] = useState(1);

  // Configuración de vida: SIEMPRE presente, independiente del timer.
  const [startingLife, setStartingLife] = useState(10);

  // Configuración de habilidades: cuáles están activas, con sus parámetros.
  const [enabledAbilities, setEnabledAbilities] = useState<Set<AbilityId>>(new Set());
  const [chicharronCuracion, setChicharronCuracion] = useState(3);
  const [goyslopCuracion, setGoyslopCuracion] = useState(4);
  const [goyslopPerdidaMaxima, setGoyslopPerdidaMaxima] = useState(2);
  const [globoDivergencia, setGloboDivergencia] = useState(5);

  // Sistema de Shuffle: mano rotativa de habilidades. Y (el pool) es implícito
  // — es simplemente cuántas habilidades el creador activó arriba.
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [handSize, setHandSize] = useState(2); // X
  const [noConsumeUsesPerTurn, setNoConsumeUsesPerTurn] = useState(1); // Z

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !connecting;

  const buildTimerConfig = (): TimerConfig => {
    if (timeMode === "none") return { mode: "none" };
    if (timeMode === "turn") return { mode: "turn", secondsPerTurn, onTimeout };
    return { mode: "life", secondsPerTurn, onTimeout, damageOnTimeout };
  };

  const buildLifeConfig = (): LifeConfig => ({ startingLife });

  const buildAbilitiesConfig = (): AbilitiesConfig => {
    const config: AbilitiesConfig = {};
    if (enabledAbilities.has("chicharron")) config.chicharron = { curacion: chicharronCuracion };
    if (enabledAbilities.has("goyslop")) config.goyslop = { curacion: goyslopCuracion, perdidaMaxima: goyslopPerdidaMaxima };
    if (enabledAbilities.has("balanza")) config.balanza = {};
    if (enabledAbilities.has("globo_pintura")) config.globo_pintura = { divergencia: globoDivergencia };
    if (enabledAbilities.has("reloj_roto")) config.reloj_roto = {};
    if (enabledAbilities.has("malversion_fondos")) config.malversion_fondos = {};
    return config;
  };

  const buildShuffleConfig = (): ShuffleConfig | null => {
    if (!shuffleEnabled) return null;
    return { handSize, noConsumeUsesPerTurn };
  };

  const toggleAbility = (ability: AbilityId) => {
    setEnabledAbilities((prev) => {
      const next = new Set(prev);
      if (next.has(ability)) next.delete(ability);
      else next.add(ability);
      return next;
    });
  };

  const handleCreate = () => {
    onCreateRoom(trimmedName, {
      timerConfig: buildTimerConfig(),
      lifeConfig: buildLifeConfig(),
      abilitiesConfig: buildAbilitiesConfig(),
      shuffleConfig: buildShuffleConfig(),
    });
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.card}>
        <h1 style={styles.title}>Michi 3D</h1>
        <p style={styles.subtitle}>Tres en raya en un cubo 3×3×3</p>

        <label style={styles.label}>
          Tu nombre
          <input
            style={styles.input}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder="Ej: Ana"
            maxLength={20}
            autoFocus
          />
        </label>

        {errorMessage && <div style={styles.error}>{errorMessage}</div>}

        {mode === "choose" && (
          <div style={styles.buttonColumn}>
            <button
              style={{ ...styles.primaryButton, opacity: canSubmit ? 1 : 0.5 }}
              disabled={!canSubmit}
              onClick={() => setMode("configure")}
            >
              Crear sala nueva
            </button>
            <button
              style={{ ...styles.secondaryButton, opacity: trimmedName ? 1 : 0.5 }}
              disabled={!trimmedName}
              onClick={() => setMode("join")}
            >
              Unirme con un código
            </button>
            <button style={styles.textButton} onClick={onPlayLocal}>
              Jugar en este dispositivo (sin internet)
            </button>
          </div>
        )}

        {mode === "configure" && (
          <div style={styles.buttonColumn}>
            <div style={styles.sectionTitle}>Vida</div>
            <label style={styles.label}>
              Vida inicial de cada jugador
              <input
                style={styles.input}
                type="number"
                min={1}
                max={999}
                value={startingLife}
                onChange={(e: ChangeEvent<HTMLInputElement>) => {
                  const parsed = parseInt(e.target.value, 10);
                  setStartingLife(Number.isFinite(parsed) ? parsed : 10);
                }}
              />
            </label>

            <div style={styles.sectionTitle}>Tiempo por turno</div>
            <label style={styles.label}>
              <select
                style={styles.input}
                value={timeMode}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTimeMode(e.target.value as TimerConfig["mode"])}
              >
                <option value="none">Sin límite</option>
                <option value="turn">Con límite — pierde el turno</option>
                <option value="life">Con límite — pierde vida</option>
              </select>
            </label>

            {timeMode !== "none" && (
              <>
                <label style={styles.label}>
                  Segundos por turno
                  <input
                    style={styles.input}
                    type="number"
                    min={5}
                    max={300}
                    value={secondsPerTurn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setSecondsPerTurn(Number.isFinite(parsed) ? parsed : 20);
                    }}
                  />
                </label>

                <label style={styles.label}>
                  Al vencer el tiempo
                  <select
                    style={styles.input}
                    value={onTimeout}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setOnTimeout(e.target.value as TimeoutAction)}
                  >
                    <option value="skip_turn">Se omite el turno</option>
                    <option value="random_move">Se juega al azar</option>
                  </select>
                </label>
              </>
            )}

            {timeMode === "life" && (
              <label style={styles.label}>
                Daño al vencer el tiempo
                <input
                  style={styles.input}
                  type="number"
                  min={1}
                  max={999}
                  value={damageOnTimeout}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const parsed = parseInt(e.target.value, 10);
                    setDamageOnTimeout(Number.isFinite(parsed) ? parsed : 1);
                  }}
                />
              </label>
            )}

            <div style={styles.sectionTitle}>Habilidades</div>
            <div style={styles.abilityList}>
              {AVAILABLE_ABILITIES.map((ability) => (
                <label key={ability} style={styles.abilityCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={enabledAbilities.has(ability)}
                    onChange={() => toggleAbility(ability)}
                  />
                  {ABILITY_LABELS[ability]}
                </label>
              ))}
            </div>

            {enabledAbilities.has("chicharron") && (
              <label style={styles.label}>
                Chicharrón — vida que cura
                <input
                  style={styles.input}
                  type="number"
                  min={1}
                  max={999}
                  value={chicharronCuracion}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const parsed = parseInt(e.target.value, 10);
                    setChicharronCuracion(Number.isFinite(parsed) ? parsed : 3);
                  }}
                />
              </label>
            )}

            {enabledAbilities.has("goyslop") && (
              <>
                <label style={styles.label}>
                  Goyslop — vida que cura
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={goyslopCuracion}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setGoyslopCuracion(Number.isFinite(parsed) ? parsed : 4);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  Goyslop — vida máxima que pierde
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={goyslopPerdidaMaxima}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setGoyslopPerdidaMaxima(Number.isFinite(parsed) ? parsed : 2);
                    }}
                  />
                </label>
              </>
            )}

            {enabledAbilities.has("globo_pintura") && (
              <label style={styles.label}>
                Globo de Pintura — divergencia
                <input
                  style={styles.input}
                  type="number"
                  min={1}
                  max={999}
                  value={globoDivergencia}
                  onChange={(e: ChangeEvent<HTMLInputElement>) => {
                    const parsed = parseInt(e.target.value, 10);
                    setGloboDivergencia(Number.isFinite(parsed) ? parsed : 5);
                  }}
                />
              </label>
            )}

            <div style={styles.sectionTitle}>Shuffle (mano rotativa)</div>
            <label style={styles.abilityCheckboxRow}>
              <input
                type="checkbox"
                checked={shuffleEnabled}
                onChange={() => setShuffleEnabled((prev) => !prev)}
              />
              Activar Shuffle
            </label>

            {shuffleEnabled && (
              <>
                <p style={styles.hint}>
                  Cada jugador ve solo algunas de las habilidades activadas arriba a la vez; la mano
                  rota al empezar cada turno tuyo.
                </p>
                <label style={styles.label}>
                  Tamaño de la mano (cuántas habilidades ves a la vez)
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={enabledAbilities.size || 1}
                    value={handSize}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setHandSize(Number.isFinite(parsed) ? parsed : 2);
                    }}
                  />
                </label>
                {enabledAbilities.size > 0 && handSize > enabledAbilities.size && (
                  <p style={styles.hint}>
                    Tienes {enabledAbilities.size} habilidad{enabledAbilities.size === 1 ? "" : "es"} activada
                    {enabledAbilities.size === 1 ? "" : "s"} — la mano incluirá todas, no {handSize}.
                  </p>
                )}
                <label style={styles.label}>
                  Usos sin consumir turno, por turno
                  <input
                    style={styles.input}
                    type="number"
                    min={0}
                    max={20}
                    value={noConsumeUsesPerTurn}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setNoConsumeUsesPerTurn(Number.isFinite(parsed) ? parsed : 1);
                    }}
                  />
                </label>
                <p style={styles.hint}>
                  Chicharrón y Balanza siempre consumen el turno completo, sin importar este número.
                </p>
              </>
            )}

            <button
              style={{ ...styles.primaryButton, opacity: canSubmit ? 1 : 0.5 }}
              disabled={!canSubmit}
              onClick={handleCreate}
            >
              {connecting ? "Conectando..." : "Crear sala"}
            </button>
            <button style={styles.textButton} onClick={() => setMode("choose")}>
              Volver
            </button>
          </div>
        )}

        {mode === "join" && (
          <div style={styles.buttonColumn}>
            <label style={styles.label}>
              Código de sala
              <input
                style={{ ...styles.input, textTransform: "uppercase", letterSpacing: 4, textAlign: "center" }}
                value={roomCodeInput}
                onChange={(e: ChangeEvent<HTMLInputElement>) => setRoomCodeInput(e.target.value.toUpperCase())}
                placeholder="ABCD"
                maxLength={4}
              />
            </label>
            <button
              style={{ ...styles.primaryButton, opacity: canSubmit && roomCodeInput.length === 4 ? 1 : 0.5 }}
              disabled={!canSubmit || roomCodeInput.length !== 4}
              onClick={() => onJoinRoom(roomCodeInput, trimmedName)}
            >
              {connecting ? "Conectando..." : "Unirme"}
            </button>
            <button style={styles.textButton} onClick={() => setMode("choose")}>
              Volver
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "absolute",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "rgba(10, 11, 16, 0.85)",
    fontFamily: "system-ui, -apple-system, sans-serif",
    zIndex: 10,
    overflowY: "auto",
    padding: "24px 0",
  },
  card: {
    background: "#1c2030",
    border: "1px solid #333a4d",
    borderRadius: 16,
    padding: "32px 28px",
    width: 340,
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  title: {
    color: "#f5f5f5",
    fontSize: 28,
    margin: 0,
    textAlign: "center",
  },
  subtitle: {
    color: "#9aa3b5",
    fontSize: 14,
    margin: 0,
    textAlign: "center",
    marginTop: -12,
  },
  label: {
    color: "#c5cad6",
    fontSize: 13,
    display: "flex",
    flexDirection: "column",
    gap: 6,
  },
  sectionTitle: {
    color: "#5c9dff",
    fontSize: 12,
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
    borderTop: "1px solid #333a4d",
    paddingTop: 10,
  },
  input: {
    background: "#14161e",
    border: "1px solid #3d4456",
    borderRadius: 8,
    padding: "10px 12px",
    color: "#f5f5f5",
    fontSize: 15,
    outline: "none",
  },
  abilityList: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  abilityCheckboxRow: {
    color: "#f5f5f5",
    fontSize: 14,
    display: "flex",
    alignItems: "center",
    gap: 8,
    cursor: "pointer",
  },
  hint: {
    color: "#9aa3b5",
    fontSize: 12,
    lineHeight: 1.4,
    margin: 0,
  },
  buttonColumn: {
    display: "flex",
    flexDirection: "column",
    gap: 10,
    marginTop: 4,
  },
  primaryButton: {
    background: "#5c9dff",
    color: "#0a0b10",
    border: "none",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    background: "transparent",
    color: "#f5f5f5",
    border: "1px solid #3d4456",
    borderRadius: 8,
    padding: "12px 16px",
    fontSize: 15,
    cursor: "pointer",
  },
  textButton: {
    background: "transparent",
    color: "#9aa3b5",
    border: "none",
    padding: "6px",
    fontSize: 13,
    cursor: "pointer",
    textDecoration: "underline",
  },
  error: {
    background: "rgba(255, 92, 92, 0.15)",
    border: "1px solid #ff5c5c",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#ff9b9b",
    fontSize: 13,
  },
};
