import { indexToCoord, HOLE } from "../game/logic";
import { SPACING, cellPosition, slicePositions, spreadFactor } from "../game/cubeLayout";
import type { Board, Player, WinLine } from "../game/logic";
import { Cell } from "./Cell";

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
        onClick={() => onCellClick(i)}
      />
    );
  }

  return (
    <group>
      {cells}
      {/* Wireframe contenedor: ayuda a percibir el cubo como un todo, no solo cubitos sueltos */}
      {slicePositions(size, dimensions, factor).map((center, w) => (
        <mesh key={w} position={center}>
          <boxGeometry args={[SPACING * size * factor, SPACING * size * factor, SPACING * size * factor]} />
          <meshBasicMaterial color="#4a5568" wireframe transparent opacity={0.25} />
        </mesh>
      ))}
    </group>
  );
}
