import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Board, Player, WinLine } from "../game/logic";
import { Board3D } from "./Board3D";

interface GameSceneProps {
  board: Board;
  players: Player[];
  winLine: WinLine | null;
  gameActive: boolean;
  onCellClick: (index: number) => void;
  cellSelectionMode?: { myPlayerId: number };
}

/**
 * Escena 3D pura: no sabe si el estado viene de una partida local o de red,
 * solo dibuja lo que recibe. Esto permite reusarla igual en ambos modos.
 */
export function GameScene({ board, players, winLine, gameActive, onCellClick, cellSelectionMode }: GameSceneProps) {
  return (
    <Canvas camera={{ position: [5, 4, 6], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />

      <Board3D
        board={board}
        players={players}
        winLine={winLine}
        gameActive={gameActive}
        onCellClick={onCellClick}
        cellSelectionMode={cellSelectionMode}
      />

      <OrbitControls enablePan={false} minDistance={4} maxDistance={14} />
    </Canvas>
  );
}
