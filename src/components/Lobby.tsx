import { useState } from "react";
import { useI18n, legalHref } from "../i18n";
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
 * Con Acelerador de Partículas el catálogo completo está disponible.
 */
const AVAILABLE_ABILITIES: AbilityId[] = [
  "chicharron",
  "goyslop",
  "balanza",
  "globo_pintura",
  "reloj_roto",
  "malversion_fondos",
  "postcognicion",
  "brujula_mal_imantada",
  "papa_caliente",
  "acelerador_particulas",
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
  const { t, tx, lang } = useI18n();
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
  const [acceptedTerms, setAcceptedTerms] = useState(false); // obligatorio para jugar ONLINE (el modo local no lo necesita)
  const [brujulaMaxTurnosAtras, setBrujulaMaxTurnosAtras] = useState(2);
  const [papaTurnosParaPasar, setPapaTurnosParaPasar] = useState(2);
  const [papaSegundosParaJugar, setPapaSegundosParaJugar] = useState(30);
  const [papaDanoExplosion, setPapaDanoExplosion] = useState(3);
  const [papaTurnosParaRepasar, setPapaTurnosParaRepasar] = useState(1);
  const [acelTurnoDeAparicion, setAcelTurnoDeAparicion] = useState(20);
  const [acelSegundosPorDano, setAcelSegundosPorDano] = useState(10);
  const [acelDanoPorTardanza, setAcelDanoPorTardanza] = useState(1);
  const [acelJugadoresParaActivar, setAcelJugadoresParaActivar] = useState(2);

  // Sistema de Shuffle: mano rotativa de habilidades. Y (el pool) es implícito
  // — es simplemente cuántas habilidades el creador activó arriba.
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [handSize, setHandSize] = useState(2); // X
  const [noConsumeUsesPerTurn, setNoConsumeUsesPerTurn] = useState(1); // Z

  const trimmedName = name.trim();
  const canSubmit = trimmedName.length > 0 && !connecting && acceptedTerms;

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
    if (enabledAbilities.has("postcognicion")) config.postcognicion = {};
    if (enabledAbilities.has("brujula_mal_imantada")) config.brujula_mal_imantada = { maxTurnosAtras: brujulaMaxTurnosAtras };
    if (enabledAbilities.has("acelerador_particulas"))
      config.acelerador_particulas = {
        turnoDeAparicion: acelTurnoDeAparicion,
        segundosPorDano: acelSegundosPorDano,
        danoPorTardanza: acelDanoPorTardanza,
        jugadoresParaActivar: acelJugadoresParaActivar,
      };
    if (enabledAbilities.has("papa_caliente"))
      config.papa_caliente = {
        turnosParaPasar: papaTurnosParaPasar,
        segundosParaJugar: papaSegundosParaJugar,
        danoExplosion: papaDanoExplosion,
        turnosParaRepasar: papaTurnosParaRepasar,
      };
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
        <p style={styles.subtitle}>{t("Tres en raya en un cubo 3×3×3")}</p>

        <label style={styles.label}>
          {t("Tu nombre")}
          <input
            style={styles.input}
            value={name}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setName(e.target.value)}
            placeholder={t("Ej: Ana")}
            maxLength={20}
            autoFocus
          />
        </label>

        <label style={styles.termsLabel}>
          <input
            type="checkbox"
            checked={acceptedTerms}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setAcceptedTerms(e.target.checked)}
            style={styles.termsCheckbox}
          />
          <span>
            {tx(
              "Tengo al menos 14 años y acepto los {terms} y la {privacy}, incluido el registro del chat de la sala para moderación. (Solo para jugar online.)",
              {
                terms: (
                  <a href={legalHref(lang, "terms")} target="_blank" rel="noreferrer" style={styles.termsLink}>
                    {t("Términos de Servicio")}
                  </a>
                ),
                privacy: (
                  <a href={legalHref(lang, "privacy")} target="_blank" rel="noreferrer" style={styles.termsLink}>
                    {t("Política de Privacidad")}
                  </a>
                ),
              }
            )}
          </span>
        </label>

        {errorMessage && <div style={styles.error}>{errorMessage}</div>}

        {mode === "choose" && (
          <div style={styles.buttonColumn}>
            <button
              style={{ ...styles.primaryButton, opacity: canSubmit ? 1 : 0.5 }}
              disabled={!canSubmit}
              onClick={() => setMode("configure")}
            >
              {t("Crear sala nueva")}
            </button>
            <button
              style={{ ...styles.secondaryButton, opacity: trimmedName && acceptedTerms ? 1 : 0.5 }}
              disabled={!trimmedName || !acceptedTerms}
              onClick={() => setMode("join")}
            >
              {t("Unirme con un código")}
            </button>
            <button style={styles.textButton} onClick={onPlayLocal}>
              {t("Jugar en este dispositivo (sin internet)")}
            </button>
          </div>
        )}

        {mode === "configure" && (
          <div style={styles.buttonColumn}>
            <div style={styles.sectionTitle}>{t("Vida")}</div>
            <label style={styles.label}>
              {t("Vida inicial de cada jugador")}
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

            <div style={styles.sectionTitle}>{t("Tiempo por turno")}</div>
            <label style={styles.label}>
              <select
                style={styles.input}
                value={timeMode}
                onChange={(e: ChangeEvent<HTMLSelectElement>) => setTimeMode(e.target.value as TimerConfig["mode"])}
              >
                <option value="none">{t("Sin límite")}</option>
                <option value="turn">{t("Con límite — pierde el turno")}</option>
                <option value="life">{t("Con límite — pierde vida")}</option>
              </select>
            </label>

            {timeMode !== "none" && (
              <>
                <label style={styles.label}>
                  {t("Segundos por turno")}
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
                  {t("Al vencer el tiempo")}
                  <select
                    style={styles.input}
                    value={onTimeout}
                    onChange={(e: ChangeEvent<HTMLSelectElement>) => setOnTimeout(e.target.value as TimeoutAction)}
                  >
                    <option value="skip_turn">{t("Se omite el turno")}</option>
                    <option value="random_move">{t("Se juega al azar")}</option>
                  </select>
                </label>
              </>
            )}

            {timeMode === "life" && (
              <label style={styles.label}>
                {t("Daño al vencer el tiempo")}
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

            <div style={styles.sectionTitle}>{t("Habilidades")}</div>
            <div style={styles.abilityList}>
              {AVAILABLE_ABILITIES.map((ability) => (
                <label key={ability} style={styles.abilityCheckboxRow}>
                  <input
                    type="checkbox"
                    checked={enabledAbilities.has(ability)}
                    onChange={() => toggleAbility(ability)}
                  />
                  {t(ABILITY_LABELS[ability])}
                </label>
              ))}
            </div>

            {enabledAbilities.has("chicharron") && (
              <label style={styles.label}>
                {t("Chicharrón — vida que cura")}
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
                  {t("Goyslop — vida que cura")}
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
                  {t("Goyslop — vida máxima que pierde")}
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
                {t("Globo de Pintura — divergencia")}
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

            {enabledAbilities.has("brujula_mal_imantada") && (
              <>
                <label style={styles.label}>
                  {t("Brújula Mal Imantada — máximo de turnos atrás")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={99}
                    value={brujulaMaxTurnosAtras}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setBrujulaMaxTurnosAtras(Number.isFinite(parsed) ? parsed : 2);
                    }}
                  />
                </label>
              </>
            )}

            {enabledAbilities.has("papa_caliente") && (
              <>
                <label style={styles.label}>
                  {t("Papa Caliente — turnos para pasarla")}
                  <input
                    style={styles.input}
                    type="number"
                    min={0}
                    max={99}
                    value={papaTurnosParaPasar}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setPapaTurnosParaPasar(Number.isFinite(parsed) ? parsed : 2);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Papa Caliente — turnos para repasarla (si ya fue pasada)")}
                  <input
                    style={styles.input}
                    type="number"
                    min={0}
                    max={99}
                    value={papaTurnosParaRepasar}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setPapaTurnosParaRepasar(Number.isFinite(parsed) ? parsed : 1);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Papa Caliente — daño de la explosión")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={papaDanoExplosion}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setPapaDanoExplosion(Number.isFinite(parsed) ? parsed : 3);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Papa Caliente — segundos para jugar")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={papaSegundosParaJugar}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setPapaSegundosParaJugar(Number.isFinite(parsed) ? parsed : 30);
                    }}
                  />
                </label>
              </>
            )}

            {enabledAbilities.has("acelerador_particulas") && (
              <>
                <label style={styles.label}>
                  {t("Acelerador — turno de aparición (turnos jugados)")}
                  <input
                    style={styles.input}
                    type="number"
                    min={0}
                    max={999}
                    value={acelTurnoDeAparicion}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setAcelTurnoDeAparicion(Number.isFinite(parsed) ? parsed : 20);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Acelerador — jugadores para activarlo")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={4}
                    value={acelJugadoresParaActivar}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setAcelJugadoresParaActivar(Number.isFinite(parsed) ? parsed : 2);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Acelerador — segundos por tick de daño")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={acelSegundosPorDano}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setAcelSegundosPorDano(Number.isFinite(parsed) ? parsed : 10);
                    }}
                  />
                </label>
                <label style={styles.label}>
                  {t("Acelerador — daño por tick")}
                  <input
                    style={styles.input}
                    type="number"
                    min={1}
                    max={999}
                    value={acelDanoPorTardanza}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => {
                      const parsed = parseInt(e.target.value, 10);
                      setAcelDanoPorTardanza(Number.isFinite(parsed) ? parsed : 1);
                    }}
                  />
                </label>
              </>
            )}

            <div style={styles.sectionTitle}>{t("Shuffle (mano rotativa)")}</div>
            <label style={styles.abilityCheckboxRow}>
              <input
                type="checkbox"
                checked={shuffleEnabled}
                onChange={() => setShuffleEnabled((prev) => !prev)}
              />
              {t("Activar Shuffle")}
            </label>

            {shuffleEnabled && (
              <>
                <p style={styles.hint}>
                  {t("Cada jugador ve solo algunas de las habilidades activadas arriba a la vez; la mano rota al empezar cada turno tuyo.")}
                </p>
                <label style={styles.label}>
                  {t("Tamaño de la mano (cuántas habilidades ves a la vez)")}
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
                    {t(
                    enabledAbilities.size === 1
                      ? "Tienes {n} habilidad activada — la mano incluirá todas, no {hand}."
                      : "Tienes {n} habilidades activadas — la mano incluirá todas, no {hand}.",
                    { n: enabledAbilities.size, hand: handSize }
                  )}
                  </p>
                )}
                <label style={styles.label}>
                  {t("Usos sin consumir turno, por turno")}
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
                  {t("Chicharrón, Balanza, Brújula, Papa Caliente y Acelerador siempre consumen el turno completo, sin importar este número.")}
                </p>
              </>
            )}

            <button
              style={{ ...styles.primaryButton, opacity: canSubmit ? 1 : 0.5 }}
              disabled={!canSubmit}
              onClick={handleCreate}
            >
              {connecting ? t("Conectando...") : t("Crear sala")}
            </button>
            <button style={styles.textButton} onClick={() => setMode("choose")}>
              {t("Volver")}
            </button>
          </div>
        )}

        {mode === "join" && (
          <div style={styles.buttonColumn}>
            <label style={styles.label}>
              {t("Código de sala")}
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
              {connecting ? t("Conectando...") : t("Unirme")}
            </button>
            <button style={styles.textButton} onClick={() => setMode("choose")}>
              {t("Volver")}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  termsLabel: {
    display: "flex",
    alignItems: "flex-start",
    gap: 8,
    fontSize: 12,
    lineHeight: 1.4,
    color: "#aab1c3",
    margin: "4px 0 12px",
    cursor: "pointer",
  },
  termsCheckbox: {
    marginTop: 2,
    flexShrink: 0,
  },
  termsLink: {
    color: "#7aa2f7",
  },
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
