// Colocación de las casillas en el espacio 3D. Aparte de Board3D para poder probarla sin WebGL.

export const SPACING = 1.1; // distancia entre centros de casillas contiguas con el cubo cerrado

/** 0 = cubo cerrado, 1 = totalmente abierto. Cualquier otro valor se recorta a ese rango. */
export function clampSpread(spread: number): number {
  return Number.isFinite(spread) ? Math.min(1, Math.max(0, spread)) : 0;
}

/** Cuánto se separan las casillas: 1 con el cubo cerrado, 2.2 con el cubo abierto del todo. */
export function spreadFactor(spread: number): number {
  return 1 + clampSpread(spread) * 1.2;
}

/** Coordenada de rejilla (0..size-1) a posición en el mundo, con el cubo centrado en el origen. */
export function gridToWorld(coord: number, size: number, factor: number = 1): number {
  return (coord - (size - 1) / 2) * SPACING * factor;
}

const SLICE_GAP = 1.6; // hueco entre rodajas de la cuarta dimensión (en 4D)

/** Cuántas columnas y filas de cubos hacen falta para colocar las `size` rodajas del 4D lo más compactas posible. */
export function sliceGrid(size: number): { cols: number; rows: number } {
  const cols = Math.ceil(Math.sqrt(size));
  return { cols, rows: Math.ceil(size / cols) };
}

/** Lado de un cubo (una rodaja) con el factor de apertura actual. */
export function sliceExtent(size: number, factor: number): number {
  return SPACING * size * factor;
}

/**
 * Posición 3D de una casilla. En 3D es la del cubo centrado en el origen. En 4D cada valor de la cuarta
 * coordenada (w) es un cubo aparte; los cubos se reparten en una cuadrícula centrada (2 cubos en fila, 3 en
 * 2x2 con un hueco, 4 en 2x2) y las líneas ganadoras pueden cruzar de un cubo a otro.
 */
export function cellPosition(c: { x: number; y: number; z: number; w: number }, size: number, dimensions: number, factor: number = 1): [number, number, number] {
  const x = gridToWorld(c.x, size, factor), y = gridToWorld(c.y, size, factor), z = gridToWorld(c.z, size, factor);
  if (dimensions !== 4) return [x, y, z];
  const { cols, rows } = sliceGrid(size);
  const pitch = sliceExtent(size, factor) + SLICE_GAP;
  const col = c.w % cols, row = Math.floor(c.w / cols);
  return [x + (col - (cols - 1) / 2) * pitch, y - (row - (rows - 1) / 2) * pitch, z];
}

/** Centro de cada rodaja (para dibujar su marco y su etiqueta). En 3D solo hay una, en el origen. */
export function slicePositions(size: number, dimensions: number, factor: number = 1): [number, number, number][] {
  if (dimensions !== 4) return [[0, 0, 0]];
  return Array.from({ length: size }, (_, w) => cellPosition({ x: (size - 1) / 2, y: (size - 1) / 2, z: (size - 1) / 2, w }, size, 4, factor));
}

/** Tamaño aproximado de toda la escena en "casillas", para alejar la cámara lo justo. */
export function sceneExtent(size: number, dimensions: number): number {
  if (dimensions !== 4) return size;
  const { cols, rows } = sliceGrid(size);
  return Math.max(cols, rows) * (size + SLICE_GAP / SPACING);
}

/** Los cubos grandes arrancan medio abiertos: si no, las casillas de dentro quedan tapadas. */
export function defaultSpread(size: number): number {
  return size >= 4 ? 0.5 : 0;
}
