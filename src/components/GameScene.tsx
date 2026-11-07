import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { AdditiveBlending } from "three";
import type { BufferAttribute, Points } from "three";
import { OrbitControls } from "@react-three/drei";
import type { Board, Player, WinLine } from "../game/logic";
import { Board3D } from "./Board3D";
import { spreadFactor, sceneExtent } from "../game/cubeLayout";

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

/** Brasas que suben despacio por detras del tablero. Son puro adorno: no reciben clics y se apagan con "reducir movimiento". */
function Embers({ extent }: { extent: number }) {
  const count = 70;
  const ref = useRef<Points>(null);
  const reduced = typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const data = useMemo(() => {
    const pos = new Float32Array(count * 3);
    const speed = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * extent * 2.4;
      pos[i * 3 + 1] = (Math.random() - 0.5) * extent * 2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * extent * 2.4;
      speed[i] = 0.12 + Math.random() * 0.3;
    }
    return { pos, speed };
  }, [extent]);
  useFrame((state, dt) => {
    const p = ref.current;
    if (!p || reduced) return;
    const attr = p.geometry.attributes.position as BufferAttribute;
    const arr = attr.array as Float32Array;
    const t = state.clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3 + 1] += data.speed[i] * dt;
      arr[i * 3] += Math.sin(t * 0.6 + i) * 0.06 * dt;
      if (arr[i * 3 + 1] > extent) {
        arr[i * 3 + 1] = -extent;
        arr[i * 3] = (Math.random() - 0.5) * extent * 2.4;
      }
    }
    attr.needsUpdate = true;
  });
  if (reduced) return null;
  return (
    <points ref={ref} raycast={() => null}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[data.pos, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f0a31c" size={0.11} sizeAttenuation transparent opacity={0.85} depthWrite={false} blending={AdditiveBlending} />
    </points>
  );
}

interface GameSceneProps {
  board: Board;
  size: number; // casillas por lado
  dimensions: number; // 3 o 4
  spread: number; // 0 = cerrado, 1 = abierto del todo
  lastMoveIndex: number | null;
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
export function GameScene({ board, size, dimensions, spread, lastMoveIndex, players, winLine, gameActive, onCellClick, cellSelectionMode }: GameSceneProps) {
  // La cámara se aleja en proporción al cubo (la distancia base está pensada para 3x3x3).
  const factor = spreadFactor(spread);
  const scale = Math.max(0.8, sceneExtent(size, dimensions) / 3);
  return (
    <Canvas key={`${dimensions}-${size}`} camera={{ position: [5 * scale * factor, 4 * scale * factor, 6 * scale * factor], fov: 45 }}>
      <CameraFit factor={factor} />
      <Embers extent={scale * 3.2 * factor} />
      <hemisphereLight args={["#ffeccc", "#55442f", 1.25]} />
      <directionalLight position={[5, 8, 5]} intensity={0.9} color="#fff0d8" />
      <directionalLight position={[-5, -3, -5]} intensity={0.25} color="#a0b4d0" />

      <Board3D
        board={board}
        size={size}
        dimensions={dimensions}
        spread={spread}
        lastMoveIndex={lastMoveIndex}
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
