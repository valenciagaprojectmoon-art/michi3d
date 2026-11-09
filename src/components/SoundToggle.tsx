import { useState } from "react";
import type { CSSProperties } from "react";
import { useI18n } from "../i18n";
import { isSoundOn, playSound, setSoundOn } from "../game/sound";

const style: CSSProperties = {
  position: "fixed",
  left: 16,
  bottom: 60,
  zIndex: 20,
  background: "var(--surface2)",
  border: "1px solid var(--line2)",
  color: "var(--text2)",
  padding: "6px 12px",
  fontSize: 12,
  cursor: "pointer",
};

export function SoundToggle() {
  const { t } = useI18n();
  const [on, setOn] = useState(isSoundOn);
  return (
    <button
      style={style}
      onClick={() => {
        const next = !on;
        setSoundOn(next);
        setOn(next);
        if (next) playSound("turn");
      }}
    >
      {on ? t("Sonido activado") : t("Sonido apagado")}
    </button>
  );
}
