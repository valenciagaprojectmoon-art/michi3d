import { useEffect, useRef, useState } from "react";

/**
 * Genera un offset de temblor (x, y en píxeles) que cambia de DIRECCIÓN
 * aleatoriamente cada cierto intervalo, a diferencia de una animación CSS
 * fija (@keyframes) que siempre repite el mismo patrón predecible.
 *
 * Se usa para el temblor de pantalla del debuff de Globo de Pintura — mismo
 * principio que DistortedCursor.tsx (offset aleatorio re-sorteado a
 * intervalos), pero aplicado al contenedor completo de la pantalla en vez
 * del cursor.
 *
 * `divergence` null o 0 desactiva el temblor (devuelve siempre {x:0, y:0}).
 */
export function useScreenShake(divergence: number | null): { x: number; y: number } {
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const currentOffsetRef = useRef({ x: 0, y: 0 });
  const targetOffsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    if (!divergence || divergence <= 0) {
      setOffset({ x: 0, y: 0 });
      return;
    }

    // El radio del temblor de pantalla es intencionalmente más chico que el
    // del cursor (que puede llegar a 60px) — un temblor de pantalla completa
    // demasiado grande sería mareante en vez de solo molesto. Tope en 14px.
    const radius = Math.min(divergence * 1.2, 14);

    // Cada 150ms se sortea una nueva dirección objetivo al azar (esto es lo
    // que hace que "cambie de dirección" en vez de repetir siempre el mismo
    // patrón de 4 pasos que tenía la animación CSS anterior).
    const directionInterval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      targetOffsetRef.current = { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius };
    }, 150);

    // El render interpola suavemente hacia la dirección objetivo en cada
    // frame, para que el cambio de dirección se sienta como una sacudida y
    // no como un salto brusco de teletransporte.
    let animationFrame: number;
    const render = () => {
      const current = currentOffsetRef.current;
      const target = targetOffsetRef.current;
      const next = {
        x: current.x + (target.x - current.x) * 0.3,
        y: current.y + (target.y - current.y) * 0.3,
      };
      currentOffsetRef.current = next;
      setOffset(next);
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      clearInterval(directionInterval);
      cancelAnimationFrame(animationFrame);
    };
  }, [divergence]);

  return offset;
}
