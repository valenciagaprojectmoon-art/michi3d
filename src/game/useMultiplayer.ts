import { useCallback, useEffect, useRef, useState } from "react";
import type { ClientMessage, ServerMessage, PublicRoomState, ChatMessage } from "./protocol";
import type { TimerConfig, LifeConfig } from "./logic";
import type { AbilitiesConfig, AbilityId, ActiveEffect, ShuffleConfig } from "./abilities";

/**
 * Fases posibles de la conexión multijugador, en el orden en que ocurren:
 * lobby (eligiendo crear/unirse) -> connecting -> in_room (jugando) -> error/disconnected.
 */
export type ConnectionPhase =
  | { kind: "lobby" }
  | { kind: "connecting" }
  | { kind: "in_room"; playerId: number; roomCode: string; state: PublicRoomState }
  | { kind: "error"; message: string };

interface CreateRoomOptions {
  timerConfig: TimerConfig;
  lifeConfig: LifeConfig;
  abilitiesConfig: AbilitiesConfig;
  shuffleConfig: ShuffleConfig | null;
}

interface UseMultiplayerResult {
  phase: ConnectionPhase;
  createRoom: (playerName: string, options: CreateRoomOptions) => void;
  joinRoom: (roomCode: string, playerName: string) => void;
  playMove: (index: number) => void;
  resetGame: () => void;
  leaveRoom: () => void;
  endGame: () => void;
  setLocked: (locked: boolean) => void;
  useAbility: (ability: AbilityId, targetPlayerId?: number, targetCellIndex?: number) => void;
  sendChat: (text: string) => void;
  chatMessages: ChatMessage[]; // historial completo de chat de la sala actual
  lastNotice: string | null; // avisos efímeros: "X se desconectó", etc.
  lastEffects: ActiveEffect[] | null; // efectos que te acaban de aplicar a TI (ej. pantalla desorientada)
}

/**
 * Construye la URL del WebSocket a partir de VITE_SERVER_URL (definida en .env),
 * con fallback a localhost para desarrollo sin configurar nada.
 */
function getServerUrl(): string {
  const configured = import.meta.env.VITE_SERVER_URL as string | undefined;
  if (configured) return configured;
  return "ws://localhost:8080";
}

export function useMultiplayer(): UseMultiplayerResult {
  const [phase, setPhase] = useState<ConnectionPhase>({ kind: "lobby" });
  const [lastNotice, setLastNotice] = useState<string | null>(null);
  const [lastEffects, setLastEffects] = useState<ActiveEffect[] | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  // Guarda el mensaje pendiente de enviar en cuanto el socket abra (create/join se piden antes de que exista conexión).
  const pendingInitialMessage = useRef<ClientMessage | null>(null);

  const connect = useCallback((onOpenMessage: ClientMessage) => {
    // Si ya había una conexión abierta o en curso (ej. un reintento tras error,
    // o un doble clic accidental), la cerramos antes de abrir una nueva para
    // no dejar sockets huérfanos en segundo plano.
    if (wsRef.current) {
      wsRef.current.onclose = null; // evita que el cierre de la conexión vieja dispare lógica de estado
      wsRef.current.close();
    }

    setPhase({ kind: "connecting" });
    pendingInitialMessage.current = onOpenMessage;

    const ws = new WebSocket(getServerUrl());
    wsRef.current = ws;

    ws.onopen = () => {
      if (pendingInitialMessage.current) {
        ws.send(JSON.stringify(pendingInitialMessage.current));
        pendingInitialMessage.current = null;
      }
    };

    ws.onmessage = (event) => {
      const msg: ServerMessage = JSON.parse(event.data);
      switch (msg.type) {
        case "room_created":
        case "room_joined":
          setPhase({ kind: "in_room", playerId: msg.playerId, roomCode: msg.roomCode, state: msg.state });
          setChatMessages(msg.state.chatHistory);
          break;
        case "state_update":
          setPhase((prev) =>
            prev.kind === "in_room" ? { ...prev, state: msg.state } : prev
          );
          break;
        case "player_disconnected":
          setLastNotice(`${msg.playerName} se desconectó.`);
          break;
        case "player_reconnected":
          setLastNotice(`${msg.playerName} volvió a conectarse.`);
          break;
        case "effects_applied":
          setLastEffects(msg.effects);
          break;
        case "chat_message":
          setChatMessages((prev) => [...prev, msg.message]);
          break;
        case "error":
          // Si ya estamos dentro de una sala, un error (ej. "No es tu turno",
          // "casilla ocupada") es transitorio: se muestra como aviso pasajero,
          // sin sacar al jugador del tablero. Solo si el error ocurre ANTES de
          // entrar a una sala (create_room o join_room fallidos) tiene sentido
          // mostrar la pantalla de error completa, porque ahí nunca llegamos
          // a tener una sala que mostrar.
          setPhase((prev) => {
            if (prev.kind === "in_room") {
              setLastNotice(msg.message);
              return prev;
            }
            return { kind: "error", message: msg.message };
          });
          break;
      }
    };

    ws.onerror = () => {
      setPhase({ kind: "error", message: "No se pudo conectar al servidor. Verifica la dirección o tu conexión." });
    };

    ws.onclose = () => {
      // Solo mostramos error si el cierre no fue provocado por un `leaveRoom` intencional
      // (en ese caso ya volvimos a 'lobby' antes de cerrar; ver leaveRoom más abajo).
      wsRef.current = null;
    };
  }, []);

  const createRoom = useCallback(
    (playerName: string, options: CreateRoomOptions) => {
      connect({
        type: "create_room",
        playerName,
        timerConfig: options.timerConfig,
        lifeConfig: options.lifeConfig,
        abilitiesConfig: options.abilitiesConfig,
        shuffleConfig: options.shuffleConfig,
      });
    },
    [connect]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      connect({ type: "join_room", roomCode: roomCode.toUpperCase(), playerName });
    },
    [connect]
  );

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const playMove = useCallback((index: number) => send({ type: "play_move", index }), [send]);
  const resetGame = useCallback(() => send({ type: "reset_game" }), [send]);
  const endGame = useCallback(() => send({ type: "end_game" }), [send]);
  const setLocked = useCallback((locked: boolean) => send({ type: "set_locked", locked }), [send]);
  const useAbility = useCallback(
    (ability: AbilityId, targetPlayerId?: number, targetCellIndex?: number) =>
      send({ type: "use_ability", ability, targetPlayerId, targetCellIndex }),
    [send]
  );
  const sendChat = useCallback((text: string) => send({ type: "send_chat", text }), [send]);

  const leaveRoom = useCallback(() => {
    send({ type: "leave_room" });
    wsRef.current?.close();
    wsRef.current = null;
    setPhase({ kind: "lobby" });
  }, [send]);

  // Limpieza: cerrar el socket si el componente se desmonta con una conexión abierta.
  useEffect(() => {
    return () => {
      wsRef.current?.close();
    };
  }, []);

  return {
    phase,
    createRoom,
    joinRoom,
    playMove,
    resetGame,
    leaveRoom,
    endGame,
    setLocked,
    useAbility,
    sendChat,
    chatMessages,
    lastNotice,
    lastEffects,
  };
}
