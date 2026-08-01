import { useState } from "react";
import { Text } from "@react-three/drei";
import type { ThreeEvent } from "@react-three/fiber";
import type { Player } from "../game/logic";

interface CellProps {
  position: [number, number, number];
  mark: number | null; // id del jugador dueño de la marca, o null
  players: Player[];
  isWinningCell: boolean;
  canPlay: boolean; // false si la partida terminó o la casilla está ocupada
  onClick: () => void;
}

const CELL_SIZE = 0.85; // deja un pequeño hueco (0.15) entre casillas para que se vea la rejilla
const EMPTY_COLOR = "#2a2f3a";
const EMPTY_HOVER_COLOR = "#3d4456";

/**
 * Una casilla individual del cubo 3x3x3.
 * - Vacía: cubo translúcido oscuro, se ilumina levemente al pasar el mouse.
 * - Ocupada: cubo sólido en el color del jugador, con su letra inicial encima.
 * - Ganadora: además se dibuja con emissive intensa para resaltarla.
 */
export function Cell({ position, mark, players, isWinningCell, canPlay, onClick }: CellProps) {
  const [hovered, setHovered] = useState(false);
  const player = mark !== null ? players.find((p) => p.id === mark) : undefined;
  const isEmpty = mark === null;

  const baseColor = player ? player.color : hovered && canPlay ? EMPTY_HOVER_COLOR : EMPTY_COLOR;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (canPlay) onClick();
  };

  return (
    <group position={position}>
      <mesh
        onClick={handleClick}
        onPointerOver={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          if (canPlay) setHovered(true);
        }}
        onPointerOut={(e: ThreeEvent<PointerEvent>) => {
          e.stopPropagation();
          setHovered(false);
        }}
      >
        <boxGeometry args={[CELL_SIZE, CELL_SIZE, CELL_SIZE]} />
        <meshStandardMaterial
          color={baseColor}
          transparent={isEmpty}
          opacity={isEmpty ? 0.35 : 1}
          emissive={isWinningCell ? baseColor : "#000000"}
          emissiveIntensity={isWinningCell ? 0.9 : 0}
          roughness={0.4}
          metalness={0.1}
        />
      </mesh>
      {player && (
        <Text
          position={[0, 0, CELL_SIZE / 2 + 0.02]}
          fontSize={0.35}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          {player.name.charAt(0).toUpperCase()}
        </Text>
      )}
    </group>
  );
}
