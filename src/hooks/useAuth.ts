import { useCallback, useEffect, useState } from "react";
import { clearToken, consumeAuthFragment, fetchMe, fetchProviders, loadToken, loginUrl } from "../game/auth";
import type { AuthFragmentError, Me, Provider, ProvidersInfo } from "../game/auth";

export type AuthState =
  | { phase: "loading" }
  | {
      phase: "ready";
      providers: ProvidersInfo | null; // null: no se pudo hablar con el servidor
      me: Me | null; // null: sin sesión
      authError: AuthFragmentError | null; // error al volver del proveedor
    };

/** Estado del inicio de sesión: proveedores disponibles, quién eres y qué estado tiene tu cuenta. */
export function useAuth() {
  const [state, setState] = useState<AuthState>({ phase: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const fragment = consumeAuthFragment();
    (async () => {
      const providers = await fetchProviders();
      let me: Me | null = null;
      const token = loadToken();
      if (providers && token) {
        const result = await fetchMe(token);
        if (result === "invalid") clearToken();
        else if (result) me = result;
      }
      if (!cancelled) setState({ phase: "ready", providers, me, authError: fragment.error ?? null });
    })();
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const login = useCallback((provider: Provider) => window.location.assign(loginUrl(provider)), []);
  const logout = useCallback(() => {
    clearToken();
    setAttempt((n) => n + 1);
  }, []);
  const retry = useCallback(() => {
    setState({ phase: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  /** ¿Puede esta persona jugar online? Si el servidor no exige sesión, sí; si la exige, hace falta cuenta aprobada. */
  const canPlayOnline = state.phase === "ready" && (state.providers === null || !state.providers.required || state.me?.status === "approved");

  return { state, login, logout, retry, canPlayOnline };
}
