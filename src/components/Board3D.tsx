import { indexToCoord, HOLE } from "../game/logic";
import { SPACING, cellPosition, slicePositions, spreadFactor } from "../game/cubeLayout";
import { hoverStore } from "../game/hoverStore";
import type { Board, Player, WinLine } from "../game/logic";
import { useMemo, useSyncExternalStore } from "react";
import { BoxGeometry, EdgesGeometry } from "three";
import { Billboard, Line, Text } from "@react-three/drei";
import { Cell } from "./Cell";

const ECHO_EDGES = new EdgesGeometry(new BoxGeometry(0.97, 0.97, 0.97));

/** Color de cada capa de la cuarta dimension: de ambar (w 1) a azul verdoso (la ultima), para distinguirlas de un vistazo. */
function shade(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (shift: number) => Math.round(((n >> shift) & 255) * f).toString(16).padStart(2, "0");
  return "#" + ch(16) + ch(8) + ch(0);
}

/** Color de un cubo: w manda el matiz (de ámbar a azul verdoso) y, en 5D, v lo oscurece según la fila. */
function sliceColor(w: number, v: number, size: number, is5D: boolean): string {
  const base = layerColor(w, size);
  return is5D ? shade(base, 1 - 0.4 * (size <= 1 ? 0 : v / (size - 1))) : base;
}

function layerColor(w: number, size: number): string {
  const t = size <= 1 ? 0 : w / (size - 1);
  const a = [0xd9, 0xa4, 0x41];
  const b = [0x5f, 0xb3, 0xc0];
  return "#" + a.map((v, i) => Math.round(v + (b[i] - v) * t).toString(16).padStart(2, "0")).join("");
}

function Frame({ center, side, color }: { center: [number, number, number]; side: number; color: string }) {
  const geo = useMemo(() => new EdgesGeometry(new BoxGeometry(side, side, side)), [side]);
  return (
    <lineSegments position={center} geometry={geo} raycast={() => null}>
      <lineBasicMaterial color={color} transparent opacity={0.8} />
    </lineSegments>
  );
}

/**
 * En 4D, al pasar el raton por una casilla se marca "el mismo sitio" en todas las demas capas (w) y se unen con
 * lineas: asi se ve que la cuarta dimension es otro eje mas, y que una linea puede saltar de un cubo a otro.
 */
function Echoes({ board, size, dimensions, factor }: { board: Board; size: number; dimensions: number; factor: number }) {
  const hover = useSyncExternalStore(hoverStore.subscribe, hoverStore.get);
  if (hover === null) return null;
  const c = indexToCoord(hover, size);
  const origin = cellPosition(c, size, dimensions, factor);
  const is5D = dimensions === 5;
  const n3 = size * size * size;
  const n4 = n3 * size;
  // Los ecos: el mismo sitio en los otros cubos de su fila (otros w) y, en 5D, también de su columna (otros v).
  const targets: { w: number; v: number }[] = [];
  for (let w = 0; w < size; w++) if (w !== c.w) targets.push({ w, v: c.v ?? 0 });
  if (is5D) for (let v = 0; v < size; v++) if (v !== (c.v ?? 0)) targets.push({ w: c.w, v });
  const echoes = [];
  for (const { w, v } of targets) {
    const idx = (hover % n3) + w * n3 + v * n4;
    if (board[idx] === HOLE) continue;
    const pos = cellPosition({ ...c, w, v }, size, dimensions, factor);
    const color = sliceColor(w, v, size, is5D);
    echoes.push(
      <group key={`${w}-${v}`}>
        <lineSegments position={pos} raycast={() => null}>
          <primitive object={ECHO_EDGES} attach="geometry" />
          <lineBasicMaterial color={color} transparent opacity={0.95} />
        </lineSegments>
        <Line points={[origin, pos]} color={color} lineWidth={1} transparent opacity={0.4} dashed dashSize={0.25} gapSize={0.18} raycast={() => null} />
      </group>
    );
  }
  return <group>{echoes}</group>;
}

interface Board3DProps {
  board: Board;
  size: number; // casillas por lado
  dimensions: number; // 3 = cubo, 4 = hipercubo (size cubos, uno por cada valor de la cuarta coordenada)
  spread: number; // 0 = cerrado, 1 = abierto del todo (casillas separadas para ver y pulsar las de dentro)
  players: Player[];
  winLine: WinLine | null;
  lastMoveIndex: number | null; // casilla de la última jugada
  gameActive: boolean; // false cuando ya hay ganador o empate
  onCellClick: (index: number) => void;
  /**
   * Cuando está presente, el tablero está en modo "elegir una casilla ajena
   * ocupada" (ej. Malversión de Fondos) en vez del modo normal "elegir una
   * casilla vacía para jugar". myPlayerId se usa para no ofrecer como
   * clickeables las casillas que ya son del propio jugador.
   */
  cellSelectionMode?: { myPlayerId: number };
}

export function Board3D({ board, size, dimensions, spread, players, winLine, lastMoveIndex, gameActive, onCellClick, cellSelectionMode }: Board3DProps) {
  const cells = [];
  const factor = spreadFactor(spread);
  const cellCount = size ** dimensions;
  for (let i = 0; i < cellCount; i++) {
    if (board[i] === HOLE) continue; // hueco del fractal: no existe, ni se dibuja ni se puede pulsar
    const coord = indexToCoord(i, size);
    const isWinningCell = winLine !== null && winLine.includes(i);
    const canPlay = cellSelectionMode
      ? board[i] !== null && board[i] !== cellSelectionMode.myPlayerId
      : gameActive && board[i] === null;

    cells.push(
      <Cell
        key={i}
        position={cellPosition(coord, size, dimensions, factor)}
        mark={board[i]}
        players={players}
        isWinningCell={isWinningCell}
        isLastMove={i === lastMoveIndex}
        canPlay={canPlay}
        showEdges={cellCount <= 256}
        onClick={() => onCellClick(i)}
        onHover={(on) => hoverStore.set(on ? i : null)}
      />
    );
  }

  const side = SPACING * size * factor;
  const hasW = dimensions >= 4; // 4D y 5D se dibujan como varios cubos
  const is5D = dimensions === 5;
  const winPoints = winLine ? winLine.map((i) => cellPosition(indexToCoord(i, size), size, dimensions, factor)) : null;

  return (
    <group>
      {cells}
      {/* Marco de cada cubo: ayuda a percibir el cubo como un todo. En 4D cada capa (w) lleva su color y su etiqueta */}
      {slicePositions(size, dimensions, factor).map((center, k) => {
        const w = hasW ? k % size : 0;
        const v = is5D ? Math.floor(k / size) : 0;
        const color = hasW ? sliceColor(w, v, size, is5D) : "#a67c3d";
        return (
          <group key={k}>
            <Frame center={center as [number, number, number]} side={side} color={color} />
            {hasW && (
              <Billboard position={[center[0], center[1] + side / 2 + 0.55, center[2]]}>
                <Text fontSize={0.42} color={color} anchorX="center" anchorY="middle">
                  {is5D ? `w ${w + 1} v ${v + 1}` : `w ${w + 1}`}
                </Text>
              </Billboard>
            )}
          </group>
        );
      })}
      {hasW && <Echoes board={board} size={size} dimensions={dimensions} factor={factor} />}
      {/* La linea ganadora se une con un trazo brillante, incluso cuando salta de un cubo a otro */}
      {winPoints && winPoints.length > 1 && <Line points={winPoints} color="#f0a31c" lineWidth={3} raycast={() => null} />}
    </group>
  );
}
