import { PRESET_ABILITIES, randomAbilities } from "../src/game/presets";
let fails = 0; const ok = (c: boolean, m: string) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fails++; };
const ALL = ["chicharron", "balanza", "goyslop", "globo_pintura", "reloj_roto", "malversion_fondos", "postcognicion", "brujula_mal_imantada", "papa_caliente", "acelerador_particulas"] as any[];
for (const [name, list] of Object.entries(PRESET_ABILITIES)) {
  ok(list.every((a) => ALL.includes(a)) && new Set(list).size === list.length, `preajuste ${name}: solo habilidades que existen y sin repetir`);
  if (name !== "ninguna") ok(list.length >= 3, `preajuste ${name}: tiene al menos 3 habilidades (${list.length})`);
}
ok(PRESET_ABILITIES.ninguna.length === 0, "preajuste ninguna: vacío");
const sets = Object.entries(PRESET_ABILITIES).filter(([n]) => n !== "ninguna").map(([, l]) => [...l].sort().join());
ok(new Set(sets).size === sets.length, "ningún preajuste es igual a otro");
const r = randomAbilities(ALL); ok(r.length === 4 && new Set(r).size === 4 && r.every((a) => ALL.includes(a)), "sorpresa: 4 habilidades distintas y válidas");
ok(randomAbilities(ALL, 99).length === 10 && randomAbilities(ALL, 0).length === 0 && randomAbilities([], 4).length === 0, "sorpresa: nunca pide más de las que hay");
// Con este generador fijo el reparto es: 0 -> la 1.ª (chicharron); 0.99 sobre 9 -> la última (acelerador); 0.5 sobre 8 -> la 5.ª (malversion); 0.2 sobre 7 -> la 2.ª (goyslop)
const seq = [0, 0.99, 0.5, 0.2]; let i = 0;
ok(JSON.stringify(randomAbilities(ALL, 4, () => seq[i++])) === JSON.stringify(["chicharron", "acelerador_particulas", "malversion_fondos", "goyslop"]), "sorpresa: con un generador fijo el resultado es el esperado");
const seen = new Set<string>(); for (let k = 0; k < 200; k++) randomAbilities(ALL).forEach((a) => seen.add(a));
ok(seen.size === 10, "sorpresa: con el tiempo sale cualquier habilidad (no siempre las mismas)");
console.log(fails === 0 ? "\nPRESETS OK" : `\n${fails} FALLO(S)`); process.exit(fails ? 1 : 0);
