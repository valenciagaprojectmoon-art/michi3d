import { useCallback, useEffect, useRef, useState } from "react";
import { translate, useI18n } from "../i18n";
import { saveSession, clearSession } from "./session";
import { getServerUrl } from "./serverUrl";
import { loadToken } from "./auth";
import type { ClientMessage, ServerMessage, PublicRoomState, ChatMessage } from "./protocol";
import { TERMS_VERSION } from "./protocol";
import type { TimerConfig, LifeConfig, BoardConfig } from "./logic";
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
  boardConfig: BoardConfig;
}

/** Parámetros extra de habilidades que no encajan en los objetivos de jugador/casilla. */
export interface AbilityExtras {
  stepsBack?: number; // Brújula Mal Imantada
  papaCalienteAction?: "activate" | "pass"; // Papa Caliente
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
  useAbility: (
    ability: AbilityId,
    targetPlayerId?: number,
    targetCellIndex?: number,
    secondaryTargetPlayerId?: number,
    secondaryTargetCellIndex?: number,
    extras?: AbilityExtras
  ) => void;
  sendChat: (text: string) => void;
  rematch: () => void;
  reportMessage: (message: ChatMessage, reason: string) => void;
  chatMessages: ChatMessage[]; // historial completo de chat de la sala actual
  lastNotice: string | null; // avisos efímeros: "X se desconectó", etc.
  lastEffects: ActiveEffect[] | null; // efectos que te acaban de aplicar a TI (ej. pantalla desorientada)
}

export function useMultiplayer(): UseMultiplayerResult {
  const { lang } = useI18n();
  // Los manejadores del socket se crean una sola vez; la ref les da siempre el idioma actual.
  const langRef = useRef(lang);
  langRef.current = lang;
  const tr = (key: string, params?: Record<string, string | number>) => translate(langRef.current, key, params);
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
          if ("playerName" in onOpenMessage) saveSession(msg.roomCode, onOpenMessage.playerName); // para volver si refrescas
          setPhase({ kind: "in_room", playerId: msg.playerId, roomCode: msg.roomCode, state: msg.state });
          setChatMessages(msg.state.chatHistory);
          break;
        case "state_update":
          setPhase((prev) =>
            prev.kind === "in_room" ? { ...prev, state: msg.state } : prev
          );
          break;
        case "player_disconnected":
          setLastNotice(tr("{name} se desconectó.", { name: msg.playerName }));
          break;
        case "player_reconnected":
          setLastNotice(tr("{name} volvió a conectarse.", { name: msg.playerName }));
          break;
        case "effects_applied":
          setLastEffects(msg.effects);
          break;
        case "chat_message":
          setChatMessages((prev) => [...prev, msg.message]);
          break;
        case "report_received":
          setLastNotice(tr("Reporte enviado, lo revisaremos."));
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
            clearSession(); // si la sala ya no existe, no insistir en reconectar
            return { kind: "error", message: msg.message };
          });
          break;
      }
    };

    ws.onerror = () => {
      setPhase({ kind: "error", message: tr("No hay forma de conectar con el servidor. Revisa tu internet y prueba otra vez.") });
    };

    ws.onclose = (event) => {
      // Solo mostramos error si el cierre no fue provocado por un `leaveRoom` intencional
      // (en ese caso ya volvimos a 'lobby' antes de cerrar; ver leaveRoom más abajo).
      wsRef.current = null;
      // Cierres por límites del servidor (ver ratelimit.ts): se explican en vez de fallar en silencio.
      const reasons: Record<number, string> = {
        1008: tr("Te sacamos por mandar demasiadas peticiones. Espera un par de minutos y vuelve a entrar."),
        1013: tr("Hay demasiadas conexiones desde tu red ahora mismo. Prueba de nuevo en un rato."),
        1009: tr("Se envió un mensaje demasiado grande y se cerró la conexión."),
      };
      const message = reasons[event.code];
      if (message) setPhase({ kind: "error", message });
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
        boardConfig: options.boardConfig,
        sessionToken: loadToken() ?? undefined,
        // El Lobby solo permite llamar aquí si el jugador marcó la casilla de aceptación.
        acceptedTerms: TERMS_VERSION,
        lang: langRef.current,
      });
    },
    [connect]
  );

  const joinRoom = useCallback(
    (roomCode: string, playerName: string) => {
      connect({
      type: "join_room",
      roomCode: roomCode.toUpperCase(),
      playerName,
      acceptedTerms: TERMS_VERSION,
      lang: langRef.current,
      sessionToken: loadToken() ?? undefined,
    });
    },
    [connect]
  );

  const send = useCallback((msg: ClientMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  // Si el jugador cambia de idioma con la sala abierta, el servidor debe enterarse para traducir sus avisos.
  useEffect(() => {
    send({ type: "set_language", lang });
  }, [lang, send]);

  const playMove = useCallback((index: number) => send({ type: "play_move", index }), [send]);
  const resetGame = useCallback(() => send({ type: "reset_game" }), [send]);
  const endGame = useCallback(() => send({ type: "end_game" }), [send]);
  const setLocked = useCallback((locked: boolean) => send({ type: "set_locked", locked }), [send]);
  const useAbility = useCallback(
    (
      ability: AbilityId,
      targetPlayerId?: number,
      targetCellIndex?: number,
      secondaryTargetPlayerId?: number,
      secondaryTargetCellIndex?: number,
      extras?: AbilityExtras
    ) =>
      send({
        type: "use_ability",
        ability,
        targetPlayerId,
        targetCellIndex,
        secondaryTargetPlayerId,
        secondaryTargetCellIndex,
        stepsBack: extras?.stepsBack,
        papaCalienteAction: extras?.papaCalienteAction,
      }),
    [send]
  );
  const rematch = useCallback(() => send({ type: "rematch" }), [send]);
  const sendChat = useCallback((text: string) => send({ type: "send_chat", text }), [send]);
  const reportMessage = useCallback(
    (message: ChatMessage, reason: string) =>
      send({ type: "report_message", reportedPlayerId: message.playerId, messageSentAt: message.sentAt, reason }),
    [send]
  );

  const leaveRoom = useCallback(() => {
    clearSession(); // salir a propósito: no volver a entrar solo al refrescar
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
    rematch,
    reportMessage,
    chatMessages,
    lastNotice,
    lastEffects,
  };
}
