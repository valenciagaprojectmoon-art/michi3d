import { cellPosition, slicePositions, sceneExtent } from "../src/game/cubeLayout";

let fails = 0;
const ok = (c: boolean, m: string) => {
  console.log((c ? "OK   " : "FAIL ") + m);
  if (!c) fails++;
};

// 5D: tabla de size x size cubos (w en columnas, v en filas)
const size = 3;
ok(slicePositions(size, 5, 1).length === 9, "5D con 3 por lado: 9 cubos");
ok(slicePositions(size, 4, 1).length === 3, "4D con 3 por lado: sigue habiendo 3 cubos");
ok(slicePositions(size, 3, 1).length === 1, "3D: un solo cubo");
const a = cellPosition({ x: 0, y: 0, z: 0, w: 0, v: 0 }, size, 5, 1);
const b = cellPosition({ x: 0, y: 0, z: 0, w: 1, v: 0 }, size, 5, 1);
const c = cellPosition({ x: 0, y: 0, z: 0, w: 0, v: 1 }, size, 5, 1);
ok(b[0] > a[0] && b[1] === a[1], "subir w mueve el cubo a la derecha");
ok(c[1] < a[1] && c[0] === a[0], "subir v mueve el cubo hacia abajo");
const all = new Set<string>();
for (let w = 0; w < size; w++) for (let v = 0; v < size; v++) all.add(cellPosition({ x: 1, y: 1, z: 1, w, v }, size, 5, 1).join(","));
ok(all.size === 9, "las 9 casillas centrales de los 9 cubos no se solapan");
ok(sceneExtent(3, 5) > sceneExtent(3, 4) && sceneExtent(3, 4) > sceneExtent(3, 3), "la escena crece con las dimensiones");
ok(cellPosition({ x: 1, y: 2, z: 0, w: 0 }, 3, 3, 1).length === 3, "una coordenada sin v (3D y 4D) sigue funcionando");

console.log(fails ? `\n${fails} FALLO(S)` : "\nLAYOUT5D OK");
process.exit(fails ? 1 : 0);
