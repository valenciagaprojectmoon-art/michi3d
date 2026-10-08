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

/** Los cubos grandes arrancan medio abiertos: si no, las casillas de dentro quedan tapadas. */
export function defaultSpread(size: number): number {
  return size >= 4 ? 0.5 : 0;
}
