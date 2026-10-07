import { indexToCoord } from "../game/logic";
import type { Board, Player, WinLine } from "../game/logic";
import { Cell } from "./Cell";

interface Board3DProps {
  board: Board;
  size: number; // dimensión del cubo (casillas por lado)
  players: Player[];
  winLine: WinLine | null;
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

const SPACING = 1.1; // distancia entre centros de casillas contiguas

/** Coordenada de rejilla (0..size-1) a posición en el mundo, con el cubo centrado en el origen. */
function gridToWorld(coord: number, size: number): number {
  return (coord - (size - 1) / 2) * SPACING;
}

export function Board3D({ board, size, players, winLine, gameActive, onCellClick, cellSelectionMode }: Board3DProps) {
  const cells = [];
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
        position={[gridToWorld(x, size), gridToWorld(y, size), gridToWorld(z, size)]}
        mark={board[i]}
        players={players}
        isWinningCell={isWinningCell}
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
        <boxGeometry args={[SPACING * size, SPACING * size, SPACING * size]} />
        <meshBasicMaterial color="#4a5568" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
