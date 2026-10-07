import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Board, Player, WinLine } from "../game/logic";
import { Board3D } from "./Board3D";

interface GameSceneProps {
  board: Board;
  size: number; // dimensión del cubo
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
export function GameScene({ board, size, players, winLine, gameActive, onCellClick, cellSelectionMode }: GameSceneProps) {
  // La cámara se aleja en proporción al cubo (la distancia base está pensada para 3x3x3).
  const scale = Math.max(0.8, size / 3);
  return (
    <Canvas key={size} camera={{ position: [5 * scale, 4 * scale, 6 * scale], fov: 45 }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />

      <Board3D
        board={board}
        size={size}
        players={players}
        winLine={winLine}
        gameActive={gameActive}
        onCellClick={onCellClick}
        cellSelectionMode={cellSelectionMode}
      />

      <OrbitControls enablePan={false} minDistance={4 * scale} maxDistance={14 * scale} />
    </Canvas>
  );
}
