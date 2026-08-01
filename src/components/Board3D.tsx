import { indexToCoord, CELL_COUNT } from "../game/logic";
import type { Board, Player, WinLine } from "../game/logic";
import { Cell } from "./Cell";

interface Board3DProps {
  board: Board;
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
const OFFSET = 1.1; // centra el cubo (coord 0..2 -> -1.1..0..1.1)

/**
 * Convierte coordenada de rejilla (0,1,2) a posición en el mundo 3D,
 * centrando el cubo completo en el origen.
 */
function gridToWorld(coord: number): number {
  return coord * SPACING - OFFSET;
}

export function Board3D({ board, players, winLine, gameActive, onCellClick, cellSelectionMode }: Board3DProps) {
  const cells = [];
  for (let i = 0; i < CELL_COUNT; i++) {
    const { x, y, z } = indexToCoord(i);
    const isWinningCell = winLine !== null && winLine.includes(i);
    const canPlay = cellSelectionMode
      ? board[i] !== null && board[i] !== cellSelectionMode.myPlayerId
      : gameActive && board[i] === null;

    cells.push(
      <Cell
        key={i}
        position={[gridToWorld(x), gridToWorld(y), gridToWorld(z)]}
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
      {/* Wireframe contenedor: ayuda a percibir el cubo como un todo, no solo 27 cubitos sueltos */}
      <mesh>
        <boxGeometry args={[SPACING * 3, SPACING * 3, SPACING * 3]} />
        <meshBasicMaterial color="#4a5568" wireframe transparent opacity={0.25} />
      </mesh>
    </group>
  );
}
