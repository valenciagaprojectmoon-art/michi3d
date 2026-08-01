import { useEffect, useRef, useState } from "react";
import { createInitialState, playMove, resetGame } from "./game/logic";
import type { TimerConfig, LifeConfig } from "./game/logic";
import type { AbilitiesConfig, AbilityId, ShuffleConfig } from "./game/abilities";
import { isValidCellTarget } from "./game/abilities";
import { useMultiplayer } from "./game/useMultiplayer";
import type { ConnectionPhase } from "./game/useMultiplayer";
import { GameScene } from "./components/GameScene";
import { HUD } from "./components/HUD";
import { Lobby } from "./components/Lobby";
import { AbilityPanel } from "./components/AbilityPanel";
import { DistortedCursor } from "./components/DistortedCursor";
import { ChatPanel } from "./components/ChatPanel";
import { useScreenShake } from "./hooks/useScreenShake";

interface CreateRoomOptions {
  timerConfig: TimerConfig;
  lifeConfig: LifeConfig;
  abilitiesConfig: AbilitiesConfig;
  shuffleConfig: ShuffleConfig | null;
}

type PendingAction =
  | { kind: "create"; playerName: string; options: CreateRoomOptions }
  | { kind: "join"; roomCode: string; playerName: string };

type AppMode = { kind: "choosing" } | { kind: "local" } | { kind: "online"; initialAction: PendingAction };

export default function App() {
  const [mode, setMode] = useState<AppMode>({ kind: "choosing" });

  if (mode.kind === "local") {
    return <AppLocal onExit={() => setMode({ kind: "choosing" })} />;
  }

  if (mode.kind === "online") {
    return <AppOnline onExit={() => setMode({ kind: "choosing" })} initialAction={mode.initialAction} />;
  }

  // "choosing": formulario inicial. El dato de create/join se guarda directamente
  // en `mode` al hacer la transición, así nunca se pierde al desmontar este componente.
  return (
    <div style={{ width: "100vw", height: "100vh", background: "#14161e", position: "relative" }}>
      <Lobby
        onCreateRoom={(playerName, options) =>
          setMode({ kind: "online", initialAction: { kind: "create", playerName, options } })
        }
        onJoinRoom={(roomCode, playerName) =>
          setMode({ kind: "online", initialAction: { kind: "join", roomCode, playerName } })
        }
        onPlayLocal={() => setMode({ kind: "local" })}
        errorMessage={null}
        connecting={false}
      />
    </div>
  );
}

// ---------- Modo local: hotseat en el mismo dispositivo (sin red) ----------
// El modo local no ofrece configuración de tiempo/vida/habilidades por ahora:
// es el modo "rápido y simple" sin servidor, y el temporizador/habilidades con
// objetivo necesitan un reloj y una autoridad compartida entre jugadores, que
// en local no aporta nada (todos comparten el mismo dispositivo).

function AppLocal({ onExit }: { onExit: () => void }) {
  const [state, setState] = useState(() => createInitialState());

  const handleCellClick = (index: number) => {
    setState((prev) => playMove(prev, index));
  };

  const handleReset = () => {
    setState((prev) => resetGame(prev));
  };

  const winLine = state.status.kind === "win" ? state.status.line : null;
  const gameActive = state.status.kind === "playing";

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#14161e", position: "relative" }}>
      <GameScene
        board={state.board}
        players={state.players}
        winLine={winLine}
        gameActive={gameActive}
        onCellClick={handleCellClick}
      />
      <HUD game={state} onReset={handleReset} onLeave={onExit} />
    </div>
  );
}

// ---------- Modo online: conecta al servidor, crea o une sala, juega en tiempo real ----------
//
// AppOnline SOLO decide qué pantalla mostrar según la fase de conexión — no
// tiene Hooks propios de "estar jugando" (como useScreenShake). Eso vive en
// AppInRoom, un componente que React monta/desmonta según la fase, en vez de
// compartir el mismo árbol de Hooks que la pantalla de "Conectando..." o de
// error. Esto evita por construcción el error #310 de React (Hooks en orden
// inconsistente entre renders): como AppInRoom es un componente aparte,
// nunca coexiste con menos Hooks que en otro render — simplemente no existe
// hasta que la fase es in_room, y React lo trata como un montaje nuevo, no
// como "el mismo componente con menos Hooks esta vez".

function AppOnline({ onExit, initialAction }: { onExit: () => void; initialAction: PendingAction }) {
  const multiplayer = useMultiplayer();
  const { phase, createRoom, joinRoom } = multiplayer;
  const firedInitialAction = useRef(false);

  // Dispara la acción (crear o unir) exactamente una vez al montar. La guarda con
  // useRef evita reenviarla en re-renders posteriores (p. ej. cuando llega state_update).
  useEffect(() => {
    if (!firedInitialAction.current) {
      firedInitialAction.current = true;
      if (initialAction.kind === "create") {
        createRoom(initialAction.playerName, initialAction.options);
      } else {
        joinRoom(initialAction.roomCode, initialAction.playerName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (phase.kind === "in_room") {
    return <AppInRoom phase={phase} multiplayer={multiplayer} onExit={onExit} />;
  }

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#14161e", position: "relative" }}>
      {phase.kind === "connecting" && <div style={connectingStyle}>Conectando al servidor...</div>}
      {phase.kind === "error" && (
        <div style={{ width: "100vw", height: "100vh", position: "relative" }}>
          <Lobby
            onCreateRoom={createRoom}
            onJoinRoom={joinRoom}
            onPlayLocal={onExit}
            errorMessage={phase.message}
            connecting={false}
          />
        </div>
      )}
    </div>
  );
}

// ---------- Componente separado: solo existe mientras phase.kind === "in_room" ----------

type InRoomPhase = Extract<ConnectionPhase, { kind: "in_room" }>;

function AppInRoom({
  phase,
  multiplayer,
  onExit,
}: {
  phase: InRoomPhase;
  multiplayer: ReturnType<typeof useMultiplayer>;
  onExit: () => void;
}) {
  const { playMove, resetGame, leaveRoom, endGame, setLocked, useAbility, sendChat, chatMessages, lastNotice, lastEffects } =
    multiplayer;
  const { state, playerId, roomCode } = phase;

  const lastDistortionRef = useRef<number | null>(null);
  const [pickingCellFor, setPickingCellFor] = useState<AbilityId | null>(null);
  const [distortionForShake, setDistortionForShake] = useState<number | null>(null);
  const shakeOffset = useScreenShake(distortionForShake);

  const winLine = state.game.status.kind === "win" ? state.game.status.line : null;
  const gameActive = state.game.status.kind === "playing";
  const myPlayer = state.game.players.find((p) => p.id === playerId);
  const isEliminated = myPlayer?.eliminated ?? false;
  const isMyTurn = gameActive && !isEliminated && state.game.players[state.game.currentPlayerIndex]?.id === playerId;
  const isHost = state.hostId === playerId;
  const myAbilities = state.assignedAbilities[playerId] ?? [];

  // El servidor entrega el efecto de Globo de Pintura justo cuando empieza tu turno
  // (ver consumeEffectsForTurn en el servidor). Visualmente, "vivimos" ese debuff
  // mientras dure tu turno: en cuanto isMyTurn se vuelve false, el filtro desaparece
  // solo, sin necesitar temporizador propio en el cliente — coincide exactamente
  // con el timing que ya define el servidor.
  if (isMyTurn) {
    const distortEffect = lastEffects?.find((e) => e.kind === "screen_distort");
    if (distortEffect) lastDistortionRef.current = distortEffect.divergence ?? 5;
  } else if (lastDistortionRef.current !== null) {
    lastDistortionRef.current = null;
  }
  const activeDistortion = isMyTurn ? lastDistortionRef.current : null;

  // Sincroniza activeDistortion al useState que useScreenShake lee, solo
  // cuando CAMBIA (no en cada mensaje de red que no lo toca). Este useEffect
  // ahora vive en un componente que SIEMPRE tiene los mismos Hooks en el
  // mismo orden (AppInRoom no tiene ningún return condicional antes de él),
  // así que no puede volver a producir el error #310.
  useEffect(() => {
    setDistortionForShake(activeDistortion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDistortion]);

  const handleLeave = () => {
    leaveRoom();
    onExit();
  };

  const handleCellClick = (index: number) => {
    if (pickingCellFor) {
      // Modo selección de casilla para una habilidad (ej. Malversión de Fondos):
      // validamos en el cliente igual que cualquier otro bloqueo (evita un viaje
      // de red inútil), y si es válida, la enviamos como objetivo de la habilidad
      // en vez de como una jugada normal.
      if (isValidCellTarget(state.game, playerId, index)) {
        useAbility(pickingCellFor, undefined, index);
      }
      setPickingCellFor(null);
      return;
    }
    // Bloqueo también en el cliente: si no es mi turno (o estoy eliminado), ni se
    // envía el mensaje. El servidor igual lo rechazaría, pero esto evita un viaje
    // de red inútil y deja claro visualmente que la casilla no reacciona.
    if (!isMyTurn) return;
    playMove(index);
  };

  return (
    <div style={{ width: "100vw", height: "100vh", background: "#14161e", position: "relative" }}>
      {activeDistortion && <DistortedCursor divergence={activeDistortion} />}
      <div
        style={
          activeDistortion
            ? {
                width: "100%",
                height: "100%",
                filter: `hue-rotate(${activeDistortion * 20}deg) blur(${Math.min(activeDistortion, 6) * 0.4}px) saturate(${1 + activeDistortion * 0.15})`,
                transform: `translate(${shakeOffset.x}px, ${shakeOffset.y}px)`,
              }
            : { width: "100%", height: "100%" }
        }
      >
        <GameScene
          board={state.game.board}
          players={state.game.players}
          winLine={winLine}
          gameActive={gameActive && isMyTurn}
          onCellClick={handleCellClick}
          cellSelectionMode={pickingCellFor ? { myPlayerId: playerId } : undefined}
        />
      </div>
      <HUD
        game={state.game}
        onReset={resetGame}
        roomCode={roomCode}
        myPlayerId={playerId}
        isHost={isHost}
        locked={state.locked}
        onLeave={handleLeave}
        onEndGame={endGame}
        onToggleLocked={setLocked}
      />
      {gameActive && (
        <AbilityPanel
          myPlayerId={playerId}
          isMyTurn={isMyTurn}
          assignedAbilities={myAbilities}
          abilitiesConfig={state.abilitiesConfig}
          players={state.game.players}
          onUseAbility={useAbility}
          onEnterCellTargetMode={setPickingCellFor}
          onCancelCellTargetMode={() => setPickingCellFor(null)}
          cellTargetModeActive={pickingCellFor}
          shuffle={state.shuffle}
          noConsumeUsesRemaining={state.noConsumeUsesRemaining}
        />
      )}
      {lastNotice && <div style={noticeStyle}>{lastNotice}</div>}
      {lastEffects && lastEffects.length > 0 && (
        <div style={effectNoticeStyle}>
          {lastEffects.map((e, i) => (
            <div key={i}>{e.kind === "screen_distort" ? "🎨 ¡Te tiraron un Globo de Pintura! Tu pantalla se ve rara este turno." : "Se aplicó un efecto."}</div>
          ))}
        </div>
      )}
      <ChatPanel messages={chatMessages} players={state.game.players} myPlayerId={playerId} onSendChat={sendChat} />
    </div>
  );
}

const connectingStyle: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  color: "#9aa3b5",
  fontFamily: "system-ui, -apple-system, sans-serif",
  fontSize: 15,
};

const noticeStyle: React.CSSProperties = {
  position: "absolute",
  bottom: 16,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(20, 22, 30, 0.9)",
  color: "#f5f5f5",
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "system-ui, -apple-system, sans-serif",
};

const effectNoticeStyle: React.CSSProperties = {
  position: "absolute",
  top: 90,
  left: "50%",
  transform: "translateX(-50%)",
  background: "rgba(255, 92, 92, 0.2)",
  border: "1px solid #ff5c5c",
  color: "#ff9b9b",
  padding: "10px 18px",
  borderRadius: 8,
  fontSize: 13,
  fontFamily: "system-ui, -apple-system, sans-serif",
};
