import { SPACING, clampSpread, spreadFactor, gridToWorld, defaultSpread } from "../src/game/cubeLayout";
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fails++; };
const near = (a: number, b: number) => Math.abs(a - b) < 1e-9;

ok(spreadFactor(0) === 1 && near(spreadFactor(1), 2.2), "cerrado = factor 1, abierto del todo = 2.2");
ok(clampSpread(-3) === 0 && clampSpread(7) === 1 && clampSpread(NaN) === 0 && near(clampSpread(0.4), 0.4), "el valor del deslizador se recorta a 0..1 y basura cae a 0");
ok(defaultSpread(3) === 0 && defaultSpread(2) === 0 && defaultSpread(4) === 0.5 && defaultSpread(6) === 0.5, "cubos de 3 o menos arrancan cerrados, de 4 o más medio abiertos");

for (const size of [2, 3, 4, 6]) {
  const coords = Array.from({ length: size }, (_, i) => i);
  for (const spread of [0, 0.5, 1]) {
    const f = spreadFactor(spread);
    const pos = coords.map((c) => gridToWorld(c, size, f));
    ok(near(pos.reduce((a, b) => a + b, 0), 0), `cubo ${size}, abierto ${spread}: centrado en el origen`);
    const gap = pos[1] - pos[0];
    ok(near(gap, SPACING * f), `cubo ${size}, abierto ${spread}: separación entre casillas ${SPACING * f}`);
    const wireHalf = (SPACING * size * f) / 2;
    ok(Math.max(...pos.map(Math.abs)) < wireHalf, `cubo ${size}, abierto ${spread}: las casillas caben dentro del marco`);
  }
}
// con el cubo abierto, ninguna casilla se solapa con otra (cada casilla mide menos que la separación)
{ const size = 4, f = spreadFactor(1); const pts: number[][] = [];
  for (let x = 0; x < size; x++) for (let y = 0; y < size; y++) for (let z = 0; z < size; z++) pts.push([x, y, z].map((c) => gridToWorld(c, size, f)));
  let min = Infinity;
  for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) min = Math.min(min, Math.hypot(pts[i][0] - pts[j][0], pts[i][1] - pts[j][1], pts[i][2] - pts[j][2]));
  ok(near(min, SPACING * f) && min > 0.85 * 2, `cubo 4 abierto: la distancia mínima entre casillas es ${min.toFixed(2)}, mucho mayor que lo que mide una casilla`);
}
console.log(fails === 0 ? "\nLAYOUT OK" : `\n${fails} FALLO(S)`); process.exit(fails ? 1 : 0);
