import { useI18n } from "../i18n";
import type { AuthState } from "../hooks/useAuth";
import type { Provider } from "../game/auth";

interface AuthBoxProps {
  auth: AuthState;
  onLogin: (provider: Provider) => void;
  onLogout: () => void;
  onRetry: () => void;
}

/** Bloque de inicio de sesión del lobby: qué botones mostrar según lo que exija el servidor y el estado de tu cuenta. */
export function AuthBox({ auth, onLogin, onLogout, onRetry }: AuthBoxProps) {
  const { t } = useI18n();

  if (auth.phase === "loading") return <div style={styles.box}>{t("Comprobando sesión...")}</div>;

  const { providers, me, authError } = auth;
  const errorText =
    authError === "cancelled" ? t("Cancelaste el inicio de sesión.") : authError ? t("No se pudo iniciar sesión, prueba otra vez.") : null;

  // No se pudo hablar con el servidor: sin esto no sabemos si hace falta iniciar sesión.
  if (!providers) {
    return (
      <div style={styles.box}>
        <div>{t("No se pudo hablar con el servidor para comprobar tu sesión. Si estaba dormido, prueba otra vez en un minuto.")}</div>
        <button type="button" style={styles.button} onClick={onRetry}>
          {t("Reintentar")}
        </button>
      </div>
    );
  }

  if (me) {
    return (
      <div style={styles.box}>
        <div>{t("Sesión iniciada como {name}", { name: me.displayName })}</div>
        {me.status === "pending" && <div style={styles.warn}>{t("Tu cuenta está pendiente de aprobación. Avisa al administrador para que te deje entrar.")}</div>}
        {me.status === "banned" && <div style={styles.warn}>{t("Tu cuenta está baneada.")}</div>}
        <button type="button" style={styles.link} onClick={onLogout}>
          {t("Cerrar sesión")}
        </button>
      </div>
    );
  }

  // Sin sesión. Si el servidor no la exige, no molestamos.
  if (!providers.required) return errorText ? <div style={styles.box}><div style={styles.warn}>{errorText}</div></div> : null;
  if (!providers.discord && !providers.google) return null;

  return (
    <div style={styles.box}>
      <div>{t("Inicia sesión para jugar online")}</div>
      {errorText && <div style={styles.warn}>{errorText}</div>}
      <div style={styles.row}>
        {providers.discord && (
          <button type="button" style={styles.button} onClick={() => onLogin("discord")}>
            {t("Entrar con Discord")}
          </button>
        )}
        {providers.google && (
          <button type="button" style={styles.button} onClick={() => onLogin("google")}>
            {t("Entrar con Google")}
          </button>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  box: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
    padding: "10px 12px",
    marginBottom: 12,
    border: "1px solid #333a4d",
    borderRadius: 8,
    background: "rgba(255, 255, 255, 0.03)",
    color: "#d7dbe6",
    fontSize: 13,
  },
  row: { display: "flex", flexWrap: "wrap", gap: 8 },
  button: { padding: "8px 12px", borderRadius: 8, border: "1px solid #4a5270", background: "#242a40", color: "#d7dbe6", cursor: "pointer", fontSize: 13 },
  link: { alignSelf: "flex-start", padding: 0, border: "none", background: "none", color: "#7aa2f7", cursor: "pointer", fontSize: 12, textDecoration: "underline" },
  warn: { color: "#f5a97f" },
};
