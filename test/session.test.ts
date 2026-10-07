let store: Record<string, string> = {};
(globalThis as any).localStorage = {
  getItem: (k: string) => (k in store ? store[k] : null),
  setItem: (k: string, v: string) => { store[k] = v; },
  removeItem: (k: string) => { delete store[k]; },
};
const { saveSession, loadSession, clearSession } = await import("../src/game/session");
let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fails++; };
ok(loadSession() === null, "sin sesión guardada: null");
saveSession("ABCD", "Ana");
ok(JSON.stringify(loadSession()) === '{"roomCode":"ABCD","playerName":"Ana"}', "guarda y recupera sala y nombre");
clearSession();
ok(loadSession() === null, "clearSession la borra");
store["michi3d-session"] = JSON.stringify({ roomCode: "ABCD", playerName: "Ana", savedAt: Date.now() - 4 * 3600 * 1000 });
ok(loadSession() === null && !("michi3d-session" in store), "una sesión de más de 3 horas caduca y se borra");
store["michi3d-session"] = "{no es json";
ok(loadSession() === null, "datos corruptos: null sin romper");
store["michi3d-session"] = JSON.stringify({ roomCode: 5, playerName: "x", savedAt: Date.now() });
ok(loadSession() === null, "datos con forma incorrecta: null");
console.log(fails === 0 ? "\nSESSION OK" : `\n${fails} FALLO(S)`); process.exit(fails ? 1 : 0);
