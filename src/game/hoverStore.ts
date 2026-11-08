// Estado de "que casilla esta bajo el raton" fuera de React: asi mover el raton no vuelve a pintar las 1296 casillas,
// solo se actualizan las pocas piezas que dependen de ello (los ecos de la cuarta dimension).
let current: number | null = null;
const subs = new Set<() => void>();

export const hoverStore = {
  get: (): number | null => current,
  set(v: number | null) {
    if (v === current) return;
    current = v;
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) {
    subs.add(f);
    return () => {
      subs.delete(f);
    };
  },
};
