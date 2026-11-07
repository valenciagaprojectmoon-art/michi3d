import { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../i18n";
import type { AbilityId } from "../game/abilities";

/** Color de cada habilidad en la animacion de uso. */
const COLORS: Record<AbilityId, string> = {
  papa_caliente: "#e8782a",
  chicharron: "#d9a441",
  postcognicion: "#8fb4d8",
  acelerador_particulas: "#f0d060",
  globo_pintura: "#d4553f",
  balanza: "#cdb990",
  reloj_roto: "#b07f3f",
  brujula_mal_imantada: "#6fb3a0",
  goyslop: "#9bb87a",
  malversion_fondos: "#e3b866",
};

const SPARKS = Array.from({ length: 12 }, (_, i) => i * 30);

/**
 * Animacion que aparece al usar una habilidad: dos ondas que se expanden, doce chispas que salen
 * disparadas y el nombre de la habilidad que sube y se apaga. Dura poco mas de un segundo.
 */
export function AbilityBurst({ ability, label, onDone }: { ability: AbilityId; label: string; onDone: () => void }) {
  const { t } = useI18n();
  const done = useRef(onDone);
  done.current = onDone;
  useEffect(() => {
    const id = window.setTimeout(() => done.current(), 1300);
    return () => window.clearTimeout(id);
  }, []);
  return (
    <div className="ab-burst" aria-hidden="true" style={{ "--c": COLORS[ability] } as CSSProperties}>
      <div className="ab-ring" />
      <div className="ab-ring b" />
      {SPARKS.map((a) => (
        <div key={a} className="ab-spark" style={{ "--a": `${a}deg` } as CSSProperties} />
      ))}
      <div className="ab-name">{t(label)}</div>
    </div>
  );
}
