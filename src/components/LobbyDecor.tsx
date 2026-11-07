import { useEffect, useState } from "react";

// Adornos del menu: un teseracto que gira despacio (el cubo de 4 dimensiones), una rejilla tenue de fondo
// y tableros enormes casi invisibles en las esquinas. Todo es decorativo y no recibe clics.

const VERTS: number[][] = [];
for (let i = 0; i < 16; i++) VERTS.push([i & 1 ? 1 : -1, i & 2 ? 1 : -1, i & 4 ? 1 : -1, i & 8 ? 1 : -1]);
const EDGES: [number, number][] = [];
for (let i = 0; i < 16; i++) for (let b = 0; b < 4; b++) if ((i ^ (1 << b)) > i) EDGES.push([i, i ^ (1 << b)]);

function rot(a: number, b: number, ang: number): [number, number] {
  return [a * Math.cos(ang) - b * Math.sin(ang), a * Math.sin(ang) + b * Math.cos(ang)];
}

function project(v: number[], t: number): [number, number] {
  let [x, y, z, w] = v;
  [x, w] = rot(x, w, t);
  [y, w] = rot(y, w, t * 0.7);
  [z, w] = rot(z, w, t * 0.4);
  const k = 2.6 / (2.6 - w * 0.9);
  x *= k;
  y *= k;
  z *= k;
  [x, z] = rot(x, z, 0.6);
  [y, z] = rot(y, z, 0.45);
  const s = 4 / (4 + z * 0.35);
  return [60 + x * 17 * s, 60 + y * 17 * s];
}

export function Tesseract() {
  const [t, setT] = useState(0.7);
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    let raf = 0;
    let last = 0;
    const tick = (now: number) => {
      if (now - last > 33) {
        last = now;
        setT(now / 4200);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  const pts = VERTS.map((v) => project(v, t));
  return (
    <svg viewBox="0 0 120 120" width={124} height={124} aria-hidden="true" style={{ alignSelf: "center", marginBottom: -6 }}>
      {EDGES.map(([a, b], i) => {
        const wa = VERTS[a][3];
        const wb = VERTS[b][3];
        const stroke = wa === wb ? (wa > 0 ? "var(--text2)" : "var(--accent)") : "var(--line2)";
        return (
          <line
            key={i}
            x1={pts[a][0]}
            y1={pts[a][1]}
            x2={pts[b][0]}
            y2={pts[b][1]}
            style={{ stroke }}
            strokeWidth={wa === wb ? 1.4 : 1}
            strokeLinecap="round"
          />
        );
      })}
      {pts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={1.7} style={{ fill: VERTS[i][3] > 0 ? "var(--text)" : "var(--accent)" }} />
      ))}
    </svg>
  );
}

/** Linea fina con un mini tablero en el centro (una x y una o ya puestas). */
export function Rule() {
  const line = { flex: 1, height: 1, background: "var(--line)" } as const;
  return (
    <div aria-hidden="true" style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={line} />
      <svg viewBox="0 0 24 24" width={20} height={20}>
        <g style={{ stroke: "var(--line2)" }} strokeWidth={1}>
          <line x1={8} y1={2} x2={8} y2={22} />
          <line x1={16} y1={2} x2={16} y2={22} />
          <line x1={2} y1={8} x2={22} y2={8} />
          <line x1={2} y1={16} x2={22} y2={16} />
        </g>
        <g style={{ stroke: "var(--accent)" }} strokeWidth={1.6} strokeLinecap="round">
          <line x1={3.6} y1={3.6} x2={6.4} y2={6.4} />
          <line x1={6.4} y1={3.6} x2={3.6} y2={6.4} />
        </g>
        <circle cx={12} cy={12} r={2.2} fill="none" style={{ stroke: "var(--text2)" }} strokeWidth={1.4} />
      </svg>
      <div style={line} />
    </div>
  );
}

function BigBoard({ style }: { style: React.CSSProperties }) {
  return (
    <svg viewBox="0 0 300 300" className="lobby-bigboard" aria-hidden="true" style={style}>
      <g style={{ stroke: "var(--text)" }} strokeWidth={3} strokeLinecap="round" fill="none">
        <line x1={100} y1={10} x2={100} y2={290} />
        <line x1={200} y1={10} x2={200} y2={290} />
        <line x1={10} y1={100} x2={290} y2={100} />
        <line x1={10} y1={200} x2={290} y2={200} />
        <line x1={30} y1={30} x2={80} y2={80} />
        <line x1={80} y1={30} x2={30} y2={80} />
        <circle cx={150} cy={150} r={32} />
        <line x1={230} y1={230} x2={270} y2={270} />
        <line x1={270} y1={230} x2={230} y2={270} />
      </g>
    </svg>
  );
}

/** Capa fija detras del menu: rejilla tenue y dos tableros grandes en esquinas opuestas. */
export function Backdrop() {
  return (
    <>
      <div className="lobby-grid" aria-hidden="true" />
      <BigBoard style={{ left: -70, bottom: -60 }} />
      <BigBoard style={{ right: -90, top: -70, transform: "rotate(14deg)" }} />
    </>
  );
}
