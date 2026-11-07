// Los colores de jugador llegan del servidor en tonos neon. Aqui se pasan a la paleta de la interfaz.
const SKIN: Record<string, string> = {
  "#ff5c5c": "#c9432e",
  "#5c9dff": "#5b9fc4",
  "#5cff8f": "#7f9f55",
  "#ffd75c": "#c9a13a",
};
export function skin(color: string): string {
  return SKIN[color.toLowerCase()] ?? color;
}
