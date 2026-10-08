import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import type { Board, Player, WinLine } from "../game/logic";
import { Board3D } from "./Board3D";
import { spreadFactor } from "../game/cubeLayout";

/** Al abrir o cerrar el cubo, acerca o aleja la cámara en la misma proporción para que siga entrando entero. */
function CameraFit({ factor }: { factor: number }) {
  const camera = useThree((state) => state.camera);
  const previous = useRef(factor);
  useEffect(() => {
    if (previous.current !== factor) {
      camera.position.multiplyScalar(factor / previous.current);
      previous.current = factor;
    }
  }, [factor, camera]);
  return null;
}

interface GameSceneProps {
  board: Board;
  size: number; // dimensión del cubo
  spread: number; // 0 = cerrado, 1 = abierto del todo
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
export function GameScene({ board, size, spread, players, winLine, gameActive, onCellClick, cellSelectionMode }: GameSceneProps) {
  // La cámara se aleja en proporción al cubo (la distancia base está pensada para 3x3x3).
  const factor = spreadFactor(spread);
  const scale = Math.max(0.8, size / 3);
  return (
    <Canvas key={size} camera={{ position: [5 * scale * factor, 4 * scale * factor, 6 * scale * factor], fov: 45 }}>
      <CameraFit factor={factor} />
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1} />
      <directionalLight position={[-5, -3, -5]} intensity={0.3} />

      <Board3D
        board={board}
        size={size}
        spread={spread}
        players={players}
        winLine={winLine}
        gameActive={gameActive}
        onCellClick={onCellClick}
        cellSelectionMode={cellSelectionMode}
      />

      <OrbitControls enablePan={false} minDistance={4 * scale} maxDistance={14 * scale * 2.2} />
    </Canvas>
  );
}
