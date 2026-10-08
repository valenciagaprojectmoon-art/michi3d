import type { ChangeEvent } from "react";
import { useI18n } from "../i18n";

interface CubeControlsProps {
  spread: number; // 0 = cerrado, 1 = abierto
  onChange: (spread: number) => void;
}

/** Deslizador para abrir el cubo: separa las casillas y deja ver y pulsar las que quedan por dentro. */
export function CubeControls({ spread, onChange }: CubeControlsProps) {
  const { t } = useI18n();
  return (
    <label style={styles.box}>
      <span style={styles.text}>{t("Abrir cubo")}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={Math.round(spread * 100)}
        aria-label={t("Abrir cubo")}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(Number(e.target.value) / 100)}
        style={styles.slider}
      />
    </label>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    position: "fixed",
    left: 16,
    top: "50%",
    transform: "translateY(-50%)",
    zIndex: 5,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 6,
    padding: "10px 8px",
    background: "rgba(28, 32, 48, 0.85)",
    border: "1px solid #333a4d",
    borderRadius: 10,
    fontFamily: "system-ui, -apple-system, sans-serif",
  },
  text: { color: "#aab1c3", fontSize: 12 },
  slider: { width: 90, cursor: "pointer" },
};
