import { useEffect, useRef, useState } from "react";

interface DistortedCursorProps {
  divergence: number; // magnitud del temblor; viene de globo_pintura.divergencia configurado por el creador
}

/**
 * Mientras el debuff de Globo de Pintura está activo, oculta el cursor real
 * del sistema y dibuja uno falso que sigue al ratón real pero con un
 * desplazamiento aleatorio que cambia constantemente — "la mano tiembla".
 *
 * IMPORTANTE: esto es puramente visual. El clic real del navegador sigue
 * registrándose en la posición real del ratón (donde Three.js hace el
 * raycasting), no en la posición del cursor falso. El efecto dificulta
 * apuntar visualmente sin cambiar qué casilla termina recibiendo el clic —
 * así lo pidió el diseño: "la mano tiembla", no "la jugada se desvía".
 *
 * La magnitud del temblor escala con `divergence`: más divergencia, mayor
 * el radio del desplazamiento aleatorio y más rápido cambia de dirección.
 */
export function DistortedCursor({ divergence }: DistortedCursorProps) {
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);
  const realPos = useRef({ x: 0, y: 0 });
  const offsetRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      realPos.current = { x: e.clientX, y: e.clientY };
    };
    window.addEventListener("mousemove", handleMouseMove);

    // El offset del temblor se re-sortea varias veces por segundo, no en cada
    // frame — un temblor demasiado rápido se ve como ruido ilegible en vez de
    // una mano temblorosa. La magnitud (radio del círculo de desplazamiento)
    // escala con divergence.
    const radius = Math.min(divergence * 4, 60); // clamp para que nunca sea imposible de usar
    const jitterInterval = setInterval(() => {
      const angle = Math.random() * Math.PI * 2;
      const distance = Math.random() * radius;
      offsetRef.current = { x: Math.cos(angle) * distance, y: Math.sin(angle) * distance };
    }, 90);

    // El render del cursor sí sigue cada frame (para que el seguimiento del
    // ratón real se sienta fluido), pero el offset del jitter solo cambia en
    // el intervalo de arriba.
    let animationFrame: number;
    const render = () => {
      setCursorPos({
        x: realPos.current.x + offsetRef.current.x,
        y: realPos.current.y + offsetRef.current.y,
      });
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(jitterInterval);
      cancelAnimationFrame(animationFrame);
    };
  }, [divergence]);

  if (!cursorPos) return null;

  return (
    <>
      {/* Oculta el cursor real del sistema mientras el cursor falso está activo. */}
      <style>{`* { cursor: none !important; }`}</style>
      <div
        style={{
          position: "fixed",
          left: cursorPos.x,
          top: cursorPos.y,
          width: 20,
          height: 20,
          borderRadius: "50%",
          border: "2px solid #ff5c5c",
          background: "rgba(255, 92, 92, 0.25)",
          pointerEvents: "none",
          transform: "translate(-50%, -50%)",
          zIndex: 9999,
        }}
      />
    </>
  );
}
