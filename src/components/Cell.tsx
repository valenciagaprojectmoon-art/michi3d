import { useRef, useState, useEffect } from "react";
import type { RefObject } from "react";
import { skin } from "../game/skin";
import { BoxGeometry, EdgesGeometry } from "three";
import type { Group, LineBasicMaterial, LineSegments, MeshStandardMaterial } from "three";
import { Text } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import type { ThreeEvent } from "@react-three/fiber";
import type { Player } from "../game/logic";

interface CellProps {
  position: [number, number, number];
  mark: number | null; // id del jugador dueño de la marca, o null
  players: Player[];
  isWinningCell: boolean;
  isLastMove: boolean; // la casilla que acaba de cambiar: se marca con un marco y una onda
  showEdges: boolean;
  canPlay: boolean; // false si la partida terminó o la casilla está ocupada
  onClick: () => void;
}

const CELL_SIZE = 0.85; // deja un pequeño hueco (0.15) entre casillas para que se vea la rejilla
const EMPTY_COLOR = "#8f7f5e";
const EMPTY_HOVER_COLOR = "#e8d3a2";
const INK = "#f1e4c8";
const DARK_INK = "#120b05";
const AMBER = "#f0a31c";

// Todas las casillas comparten las mismas geometrías: con un hipercubo de 6 son 1296 casillas y crear una por casilla
// gastaba memoria y tiempo de arranque para nada.
const CELL_BOX = new BoxGeometry(CELL_SIZE, CELL_SIZE, CELL_SIZE);
const CELL_EDGES = new EdgesGeometry(CELL_BOX);
const LAST_MOVE_BOX = new BoxGeometry(CELL_SIZE * 1.14, CELL_SIZE * 1.14, CELL_SIZE * 1.14);
const LAST_MOVE_EDGES = new EdgesGeometry(LAST_MOVE_BOX);

interface FxProps {
  target: RefObject<Group | null>;
  mat: RefObject<MeshStandardMaterial | null>;
  hasMark: boolean;
  isLast: boolean;
  isWin: boolean;
}

/**
 * Efectos de una casilla con marca: la ficha entra con un rebote, la ultima jugada lanza una onda
 * de marco que se expande y se apaga, y las casillas ganadoras laten. Solo se monta en casillas
 * que lo necesitan, asi un tablero grande no paga por animar las casillas vacias.
 */
function CellFx({ target, mat, hasMark, isLast, isWin }: FxProps) {
  const born = useRef<number | null>(null);
  const ring = useRef<LineSegments>(null);
  const ringMat = useRef<LineBasicMaterial>(null);

  useEffect(() => {
    return () => {
      target.current?.scale.setScalar(1);
    };
  }, [target]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const g = target.current;
    if (g) {
      let s = 1;
      if (hasMark) {
        if (born.current === null) born.current = t;
        const k = Math.min(1, (t - born.current) / 0.38);
        const c1 = 1.70158;
        const c3 = c1 + 1;
        s = k >= 1 ? 1 : Math.max(0.02, 1 + c3 * Math.pow(k - 1, 3) + c1 * Math.pow(k - 1, 2));
      }
      if (isWin) s *= 1 + 0.045 * Math.sin(t * 5);
      g.scale.setScalar(s);
    }
    if (mat.current && isWin) mat.current.emissiveIntensity = 0.45 + 0.4 * Math.sin(t * 4);
    if (ring.current && ringMat.current && isLast) {
      const k = (t % 1.5) / 1.5;
      ring.current.scale.setScalar(1 + k * 0.95);
      ringMat.current.opacity = 0.9 * (1 - k);
    }
  });

  if (!isLast) return null;
  return (
    <lineSegments ref={ring} raycast={() => null}>
      <primitive object={LAST_MOVE_EDGES} attach="geometry" />
      <lineBasicMaterial ref={ringMat} color={AMBER} transparent opacity={0} />
    </lineSegments>
  );
}

/**
 * Una casilla individual del cubo.
 * - Vacía: cubo translúcido, se ilumina levemente al pasar el mouse.
 * - Ocupada: cubo sólido en el color del jugador, con su letra inicial encima.
 * - Ganadora: late con emissive para resaltarla.
 */
export function Cell({ position, mark, players, isWinningCell, isLastMove, showEdges, canPlay, onClick }: CellProps) {
  const [hovered, setHovered] = useState(false);
  const body = useRef<Group>(null);
  const matRef = useRef<MeshStandardMaterial>(null);
  const player = mark !== null ? players.find((p) => p.id === mark) : undefined;
  const isEmpty = mark === null;

  const baseColor = player ? skin(player.color) : hovered && canPlay ? EMPTY_HOVER_COLOR : EMPTY_COLOR;

  const handleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    if (canPlay) onClick();
  };

  return (
    <group position={position}>
      <group ref={body}>
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
          <primitive object={CELL_BOX} attach="geometry" />
          <meshStandardMaterial
            ref={matRef}
            color={baseColor}
            transparent={isEmpty}
            opacity={isEmpty ? (hovered && canPlay ? 0.5 : 0.2) : 1}
            emissive={isWinningCell || isLastMove ? baseColor : "#000000"}
            emissiveIntensity={isWinningCell ? 0.55 : isLastMove ? 0.2 : 0}
            roughness={0.8}
            metalness={0.1}
          />
        </mesh>
        {isLastMove && (
          <lineSegments raycast={() => null}>
            <primitive object={LAST_MOVE_EDGES} attach="geometry" />
            <lineBasicMaterial color={AMBER} />
          </lineSegments>
        )}
        {(player || hovered || showEdges) && (
          <lineSegments raycast={() => null}>
            <primitive object={CELL_EDGES} attach="geometry" />
            <lineBasicMaterial color={player ? DARK_INK : INK} transparent opacity={player ? 0.6 : hovered ? 0.8 : 0.3} />
          </lineSegments>
        )}
        {player && (
          <Text position={[0, 0, CELL_SIZE / 2 + 0.02]} fontSize={0.35} color={DARK_INK} anchorX="center" anchorY="middle">
            {player.name.charAt(0).toUpperCase()}
          </Text>
        )}
      </group>
      {(player || isLastMove || isWinningCell) && (
        <CellFx target={body} mat={matRef} hasMark={!!player} isLast={isLastMove} isWin={isWinningCell} />
      )}
    </group>
  );
}
