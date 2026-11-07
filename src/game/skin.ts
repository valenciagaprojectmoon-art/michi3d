// Los colores de jugador llegan del servidor en tonos neon. Aqui se pasan a la paleta de la interfaz.
const SKIN: Record<string, string> = {
  "#ff5c5c": "#d9573a",
  "#5c9dff": "#5f8fb0",
  "#5cff8f": "#8fae6b",
  "#ffd75c": "#d9a441",
};
export function skin(color: string): string {
  return SKIN[color.toLowerCase()] ?? color;
}
