import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../i18n";
import { skin } from "../game/skin";
import type { PublicRoomState } from "../game/protocol";

const SPARKS = Array.from({ length: 16 }, (_, i) => i * 22.5);

/** Cartel que aparece unos segundos al terminar la partida, con ondas y chispas del color de quien gana. */
export function WinBanner({ status, players }: { status: PublicRoomState["game"]["status"]; players: PublicRoomState["game"]["players"] }) {
  const { t, tx } = useI18n();
  const ended = status.kind === "win" || status.kind === "win_by_elimination" || status.kind === "draw";
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ended) {
      setShown(false);
      return;
    }
    setShown(true);
    const id = window.setTimeout(() => setShown(false), 3800);
    return () => window.clearTimeout(id);
  }, [ended]);
  if (!shown) return null;

  const winner = status.kind === "win" || status.kind === "win_by_elimination" ? players.find((p) => p.id === status.playerId) : undefined;
  const color = winner ? skin(winner.color) : "#cdb990";
  return (
    <div className="win-banner" aria-hidden="true" style={{ "--c": color } as CSSProperties}>
      <div className="win-anchor">
        <div className="ab-ring" />
        <div className="ab-ring b" />
        {SPARKS.map((a) => (
          <div key={a} className="ab-spark" style={{ "--a": `${a}deg` } as CSSProperties} />
        ))}
      </div>
      <div className="win-text">{winner ? tx("¡Ganó {name}! ", { name: <strong>{winner.name}</strong> }) : t("Empate: el tablero se llenó ")}</div>
    </div>
  );
}
