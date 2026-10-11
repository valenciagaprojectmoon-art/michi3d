import type { AbilityId } from "./abilities";

/** Paquetes de habilidades del lobby. Cada uno marca de golpe un conjunto; luego se puede ajustar a mano. */
export const PRESET_ABILITIES = {
  ninguna: [] as AbilityId[],
  // suave: nada que fastidie demasiado
  tranquilo: ["chicharron", "balanza", "reloj_roto", "brujula_mal_imantada"] as AbilityId[],
  // todo gira alrededor de la vida
  solo_vida: ["chicharron", "balanza", "goyslop"] as AbilityId[],
  // jugar con el orden de los turnos y con el tablero
  estrategia: ["reloj_roto", "brujula_mal_imantada", "balanza", "malversion_fondos"] as AbilityId[],
  // fastidiar al rival
  sabotaje: ["globo_pintura", "malversion_fondos", "brujula_mal_imantada", "postcognicion"] as AbilityId[],
  // tiempo y vida: no te puedes dormir
  presion: ["papa_caliente", "acelerador_particulas", "goyslop", "chicharron"] as AbilityId[],
  // lo más tonto y divertido
  bromas: ["globo_pintura", "papa_caliente", "postcognicion", "goyslop"] as AbilityId[],
};

/** "Sorpresa": `count` habilidades distintas al azar. */
export function randomAbilities(all: readonly AbilityId[], count: number = 4, rng: () => number = Math.random): AbilityId[] {
  const pool = [...all];
  const picked: AbilityId[] = [];
  while (picked.length < count && pool.length > 0) {
    picked.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]);
  }
  return picked;
}
