import { useEffect, useRef } from "react";
import { useI18n } from "../i18n";
import { HOLE } from "../game/logic";
import type { PublicRoomState } from "../game/protocol";
import { playSound } from "../game/sound";

const BASE_TITLE = typeof document !== "undefined" ? document.title : "";

/**
 * Sonidos de la partida (ficha puesta, habilidad, tu turno, final) y aviso en el titulo de la pestana cuando te toca
 * estando fuera de la ventana. abilityKey cambia cada vez que alguien usa una habilidad.
 */
export function useGameEffects(state: PublicRoomState, playerId: number, abilityKey: number | null): void {
  const { t } = useI18n();
  const game = state.game;
  const kind = game.status.kind;
  const marks = game.board.reduce<number>((n, m) => (m !== null && m !== HOLE ? n + 1 : n), 0);
  const isMyTurn = kind === "playing" && game.players[game.currentPlayerIndex]?.id === playerId;

  const prevMarks = useRef(marks);
  useEffect(() => {
    if (marks > prevMarks.current) playSound("place");
    prevMarks.current = marks;
  }, [marks]);

  const prevKind = useRef(kind);
  useEffect(() => {
    if (prevKind.current === "playing" && kind !== "playing") playSound("end");
    prevKind.current = kind;
  }, [kind]);

  const prevMyTurn = useRef(isMyTurn);
  useEffect(() => {
    if (isMyTurn && !prevMyTurn.current) {
      playSound("turn");
      if (document.hidden) document.title = `(!) ${t("Es tu turno")}`;
    }
    prevMyTurn.current = isMyTurn;
  }, [isMyTurn, t]);

  useEffect(() => {
    if (abilityKey !== null) playSound("ability");
  }, [abilityKey]);

  useEffect(() => {
    const restore = () => {
      if (!document.hidden) document.title = BASE_TITLE;
    };
    document.addEventListener("visibilitychange", restore);
    return () => {
      document.removeEventListener("visibilitychange", restore);
      document.title = BASE_TITLE;
    };
  }, []);
}
