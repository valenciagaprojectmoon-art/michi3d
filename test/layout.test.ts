import { SPACING, clampSpread, spreadFactor, gridToWorld, defaultSpread, cellPosition, slicePositions, sliceGrid, sceneExtent } from "../src/game/cubeLayout";
import { indexToCoord } from "../src/game/logic";
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
// ---------- 4D: size cubos repartidos en cuadrícula ----------
ok(JSON.stringify([sliceGrid(2), sliceGrid(3), sliceGrid(4)]) === JSON.stringify([{ cols: 2, rows: 1 }, { cols: 2, rows: 2 }, { cols: 2, rows: 2 }]), "4D: 2 cubos en fila, 3 y 4 en cuadrícula de 2x2");
for (const size of [2, 3, 4]) for (const spread of [0, 1]) {
  const f = spreadFactor(spread), N = size ** 4, pts: number[][] = [];
  for (let i = 0; i < N; i++) pts.push(cellPosition(indexToCoord(i, size), size, 4, f));
  const key = (p: number[]) => p.map((v) => v.toFixed(6)).join(",");
  ok(new Set(pts.map(key)).size === N, `4D tamaño ${size}, abierto ${spread}: las ${N} casillas tienen posiciones distintas`);
  let min = Infinity; for (let a = 0; a < N; a++) for (let b = a + 1; b < N; b++) min = Math.min(min, Math.hypot(pts[a][0] - pts[b][0], pts[a][1] - pts[b][1], pts[a][2] - pts[b][2]));
  ok(min >= SPACING * f - 1e-9 && min > 0.85, `4D tamaño ${size}, abierto ${spread}: ninguna casilla se solapa (distancia mínima ${min.toFixed(2)})`);
  const slices = slicePositions(size, 4, f);
  ok(slices.length === size, `4D tamaño ${size}: ${size} marcos de rodaja`);
  // el marco que envuelve toda la escena (de la casilla más lejana a la opuesta) queda centrado: con 3 rodajas en 2x2 hay un hueco y el centro de masas no cuenta
  const mid = [0, 1, 2].map((k) => (Math.min(...pts.map((p) => p[k])) + Math.max(...pts.map((p) => p[k]))) / 2);
  ok(mid.every((v) => Math.abs(v) < 1e-6), `4D tamaño ${size}, abierto ${spread}: la escena entera queda centrada en el origen`);
  // los cubos no se montan unos sobre otros
  for (let a = 0; a < slices.length; a++) for (let b = a + 1; b < slices.length; b++) ok(Math.hypot(slices[a][0] - slices[b][0], slices[a][1] - slices[b][1]) > SPACING * size * f, `4D tamaño ${size}, abierto ${spread}: las rodajas ${a} y ${b} no se solapan`);
}
// una línea ganadora a lo largo de la cuarta dimensión une casillas de cubos distintos, en el mismo sitio dentro de cada cubo
{ const a = cellPosition({ x: 1, y: 1, z: 1, w: 0 }, 3, 4), b = cellPosition({ x: 1, y: 1, z: 1, w: 1 }, 3, 4);
  ok(a[2] === b[2] && (a[0] !== b[0] || a[1] !== b[1]), "4D: misma casilla en rodajas distintas queda a la misma altura pero en otro cubo"); }
ok(JSON.stringify(cellPosition({ x: 0, y: 0, z: 0, w: 0 }, 3, 3)) === JSON.stringify([gridToWorld(0, 3), gridToWorld(0, 3), gridToWorld(0, 3)]), "3D: la posición es la de siempre");
ok(sceneExtent(3, 3) === 3 && sceneExtent(4, 4) > sceneExtent(4, 3) && sceneExtent(2, 4) > 2, "la escena en 4D es más grande que en 3D (la cámara se aleja)");
console.log(fails === 0 ? "\nLAYOUT OK" : `\n${fails} FALLO(S)`); process.exit(fails ? 1 : 0);
