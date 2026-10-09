import { indexToCoord } from "../game/logic";
import { SPACING, gridToWorld, spreadFactor } from "../game/cubeLayout";
import type { Board, Player, WinLine } from "../game/logic";
import { Cell } from "./Cell";

interface Board3DProps {
  board: Board;
  size: number; // dimensión del cubo (casillas por lado)
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

export function Board3D({ board, size, spread, players, winLine, lastMoveIndex, gameActive, onCellClick, cellSelectionMode }: Board3DProps) {
  const cells = [];
  const factor = spreadFactor(spread);
  const cellCount = size * size * size;
  for (let i = 0; i < cellCount; i++) {
    const { x, y, z } = indexToCoord(i, size);
    const isWinningCell = winLine !== null && winLine.includes(i);
    const canPlay = cellSelectionMode
      ? board[i] !== null && board[i] !== cellSelectionMode.myPlayerId
      : gameActive && board[i] === null;

    cells.push(
      <Cell
        key={i}
        position={[gridToWorld(x, size, factor), gridToWorld(y, size, factor), gridToWorld(z, size, factor)]}
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
      <mesh>
        <boxGeometry args={[SPACING * size * factor, SPACING * size * factor, SPACING * size * factor]} />
        <meshBasicMaterial color="#4a5568" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
