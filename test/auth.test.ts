let store: Record<string, string> = {};
(globalThis as any).localStorage = { getItem: (k: string) => (k in store ? store[k] : null), setItem: (k: string, v: string) => { store[k] = v; }, removeItem: (k: string) => { delete store[k]; } };
const win: any = { location: { hostname: "juego.example.com", hash: "", pathname: "/", search: "" }, history: { calls: [] as unknown[][], replaceState(...a: unknown[]) { this.calls.push(a); } } };
(globalThis as any).window = win;
let fetched: { url: string; auth?: string }[] = [];
const respond = (status: number, body: unknown) => async (url: string, init?: any) => { fetched.push({ url, auth: init?.headers?.Authorization }); return { status, ok: status >= 200 && status < 300, json: async () => body } as any; };

const { loadToken, saveToken, clearToken, consumeAuthFragment, fetchProviders, fetchMe, loginUrl } = await import("../src/game/auth");
const { getServerHttpUrl, getServerUrl } = await import("../src/game/serverUrl");
const { fetchLeaderboard, winRate } = await import("../src/game/leaderboard");
let fails = 0; const ok = (c: boolean, m: string) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fails++; };

ok(getServerHttpUrl("wss://x.onrender.com") === "https://x.onrender.com" && getServerHttpUrl("ws://localhost:8080/") === "http://localhost:8080", "dirección HTTP a partir de la del WebSocket");
ok(getServerUrl() === "wss://michi3d-server.onrender.com", "publicado: usa el servidor de producción");
win.location.hostname = "localhost"; ok(getServerUrl() === "ws://localhost:8080", "en localhost: usa el servidor local"); win.location.hostname = "juego.example.com";
ok(loginUrl("discord") === "https://michi3d-server.onrender.com/auth/discord/start" && loginUrl("google").endsWith("/auth/google/start"), "enlaces de inicio de sesión");

ok(loadToken() === null, "sin sesión guardada: null");
saveToken("abc"); ok(loadToken() === "abc", "guarda la sesión"); clearToken(); ok(loadToken() === null, "borra la sesión");

win.location.hash = "#session=tok123"; let f = consumeAuthFragment();
ok(f.token === "tok123" && loadToken() === "tok123" && win.history.calls.length === 1, "vuelta del proveedor: guarda la sesión y limpia la dirección");
win.location.hash = "#auth_error=cancelled"; ok(consumeAuthFragment().error === "cancelled" && loadToken() === "tok123", "error cancelled, sin tocar la sesión anterior");
win.location.hash = "#auth_error=state"; ok(consumeAuthFragment().error === "state", "error state");
win.location.hash = "#auth_error=lo-que-sea"; ok(consumeAuthFragment().error === "provider", "errores desconocidos se tratan como provider");
win.location.hash = "#otra-cosa"; const calls = win.history.calls.length; ok(Object.keys(consumeAuthFragment()).length === 0 && win.history.calls.length === calls, "otros fragmentos no se tocan");
win.location.hash = ""; ok(Object.keys(consumeAuthFragment()).length === 0, "sin fragmento: nada");

(globalThis as any).fetch = respond(200, { discord: true, google: false, required: true });
ok(JSON.stringify(await fetchProviders()) === '{"discord":true,"google":false,"required":true}' && fetched[0].url === "https://michi3d-server.onrender.com/auth/providers", "fetchProviders lee lo configurado");
(globalThis as any).fetch = respond(500, {}); ok((await fetchProviders()) === null, "fetchProviders: error del servidor, null");
(globalThis as any).fetch = async () => { throw new Error("red"); }; ok((await fetchProviders()) === null && (await fetchMe("t")) === null, "sin red: null, sin romper");
fetched = [];
(globalThis as any).fetch = respond(200, { id: "1", displayName: "Ana", status: "approved" });
ok((await fetchMe("TOK") as any)?.status === "approved" && fetched[0].auth === "Bearer TOK", "fetchMe manda la sesión como Bearer");
(globalThis as any).fetch = respond(401, {}); ok((await fetchMe("T")) === "invalid", "fetchMe: 401 = sesión inválida");
(globalThis as any).fetch = respond(200, { status: "inventado" }); ok((await fetchMe("T")) === null, "fetchMe: estado desconocido, null");
// ---- clasificación ----
fetched = [];
(globalThis as any).fetch = respond(200, [{ rank: 1, name: "ana", wins: 2, losses: 0, draws: 0, games: 2, bestStreak: 2 }, { basura: true }, null]);
{ const rows = await fetchLeaderboard(5);
  ok(rows?.length === 1 && rows[0].name === "ana" && fetched[0].url === "https://michi3d-server.onrender.com/leaderboard?limit=5", "fetchLeaderboard: pide la clasificación con el límite y descarta filas basura"); }
(globalThis as any).fetch = respond(200, { no: "es una lista" }); ok((await fetchLeaderboard()) === null, "fetchLeaderboard: respuesta que no es una lista, null");
(globalThis as any).fetch = respond(500, []); ok((await fetchLeaderboard()) === null, "fetchLeaderboard: error del servidor, null");
(globalThis as any).fetch = async () => { throw new Error("red"); }; ok((await fetchLeaderboard()) === null, "fetchLeaderboard: sin red, null sin romper");
ok(winRate({ wins: 3, games: 4 }) === 75 && winRate({ wins: 1, games: 3 }) === 33 && winRate({ wins: 2, games: 3 }) === 67 && winRate({ wins: 0, games: 0 }) === 0, "winRate: redondea y 0 partidas dan 0");
console.log(fails === 0 ? "\nAUTHFRONT OK" : `\n${fails} FALLO(S)`); process.exit(fails ? 1 : 0);
