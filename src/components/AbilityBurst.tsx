import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../i18n";
import type { AbilityId } from "../game/abilities";
import { ABILITY_LABELS } from "./AbilityPanel";

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
 * Animacion que ven TODOS los jugadores cuando alguien usa una habilidad: dos ondas que se expanden, doce chispas,
 * el nombre de la habilidad que sube y se apaga, y debajo quien la uso. Dura poco mas de un segundo y se quita sola.
 */
export function AbilityBurst({ ability, who }: { ability: AbilityId; who?: string }) {
  const { t } = useI18n();
  const [on, setOn] = useState(true);
  useEffect(() => {
    const id = window.setTimeout(() => setOn(false), 1300);
    return () => window.clearTimeout(id);
  }, []);
  if (!on) return null;
  return (
    <div className="ab-burst" aria-hidden="true" style={{ "--c": COLORS[ability] } as CSSProperties}>
      <div className="ab-ring" />
      <div className="ab-ring b" />
      {SPARKS.map((a) => (
        <div key={a} className="ab-spark" style={{ "--a": `${a}deg` } as CSSProperties} />
      ))}
      <div className="ab-name">{t(ABILITY_LABELS[ability])}</div>
      {who && <div className="ab-who">{who}</div>}
    </div>
  );
}
