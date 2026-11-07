import type { CSSProperties } from "react";

/** Marco de panel: doble borde de bronce con bisel negro por dentro y una sombra pesada. */
export const FRAME: CSSProperties = {
  background: "linear-gradient(180deg, rgba(30, 20, 13, 0.97), rgba(14, 10, 7, 0.97))",
  border: "2px solid var(--line2)",
  borderRadius: 2,
  boxShadow: "inset 0 0 0 2px #000, inset 0 0 0 3px var(--line), 0 8px 28px rgba(0, 0, 0, 0.65)",
};
