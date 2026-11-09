// Sonidos sintetizados con WebAudio (no hay archivos de audio). Volumen bajo; se pueden silenciar y se recuerda la eleccion.
const KEY = "michi-sound";
let ctx: AudioContext | null = null;

export function isSoundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSoundOn(on: boolean): void {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    /* sin almacenamiento: se queda solo en memoria de la pagina */
  }
}

export type SoundKind = "place" | "ability" | "turn" | "end";

function tone(c: AudioContext, freq: number, at: number, dur: number, type: OscillatorType, vol: number, endFreq?: number) {
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, at);
  if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, at + dur);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  o.connect(g);
  g.connect(c.destination);
  o.start(at);
  o.stop(at + dur + 0.02);
}

export function playSound(kind: SoundKind): void {
  if (!isSoundOn()) return;
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    ctx ??= new AC();
    if (ctx.state === "suspended") void ctx.resume();
    const t = ctx.currentTime;
    if (kind === "place") {
      tone(ctx, 190, t, 0.13, "triangle", 0.12, 80);
    } else if (kind === "ability") {
      tone(ctx, 280, t, 0.28, "sawtooth", 0.05, 900);
      tone(ctx, 1200, t + 0.16, 0.14, "sine", 0.05, 1800);
    } else if (kind === "turn") {
      tone(ctx, 523, t, 0.14, "sine", 0.08);
      tone(ctx, 659, t + 0.13, 0.18, "sine", 0.08);
    } else {
      [523, 659, 784, 1047].forEach((f, i) => tone(ctx!, f, t + i * 0.12, 0.3, "triangle", 0.08));
    }
  } catch {
    /* el navegador bloqueo el audio: no pasa nada */
  }
}
