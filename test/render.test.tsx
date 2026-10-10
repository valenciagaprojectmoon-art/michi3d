// Renderiza los componentes reales con el idioma activo y comprueba los textos (sin navegador).
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../src/i18n";
import { LanguageSwitcher } from "../src/i18n/LanguageSwitcher";
import { CubeControls } from "../src/components/CubeControls";
import { AuthBox } from "../src/components/AuthBox";
import { Lobby } from "../src/components/Lobby";
import { HUD } from "../src/components/HUD";
import { ChatPanel } from "../src/components/ChatPanel";
import { createInitialState } from "../src/game/logic";

let fails = 0;
const ok = (c: boolean, m: string) => { console.log((c ? "OK   " : "FAIL ") + m); if (!c) fails++; };

function withLang(lang: string, node: JSX.Element): string {
  (globalThis as any).localStorage = { getItem: () => lang, setItem: () => {} };
  return renderToStaticMarkup(<I18nProvider>{node}</I18nProvider>);
}
const lobby = <Lobby onCreateRoom={() => {}} onJoinRoom={() => {}} onPlayLocal={() => {}} errorMessage={null} connecting={false} />;

const es = withLang("es", lobby), en = withLang("en", lobby);
ok(es.includes("crear sala nueva") && es.includes("tu nombre") && es.includes('href="/terminos.html"') && es.includes('href="/privacidad.html"'), "Lobby en español: textos y enlaces legales en español");
ok(en.includes("create a new room") && en.includes("your name") && en.includes("join with a code") && en.includes('href="/terms.html"') && en.includes('href="/privacy.html"'), "Lobby en inglés: textos y enlaces legales en inglés");
ok(en.includes("i am at least 14 years old and i accept the") && en.includes(">terms of service</a>") && en.includes(">privacy policy</a>"), "Lobby en inglés: casilla de términos con enlaces traducidos");
ok(!en.includes("Crear sala") && !en.includes("tu nombre") && !en.includes("Unirme"), "Lobby en inglés: no queda español visible");

const de = withLang("de", lobby);
ok(de.includes("neuen raum erstellen") && de.includes("dein name") && de.includes('href="/nutzungsbedingungen.html"') && de.includes('href="/datenschutz.html"'), "Lobby en alemán: textos y enlaces legales en alemán");
ok(de.includes(">nutzungsbedingungen</a>") && !de.includes("crear sala"), "Lobby en alemán: casilla de términos traducida y sin español visible");
ok(withLang("de", <LanguageSwitcher />).includes("deutsch") && withLang("de", <LanguageSwitcher />).includes('aria-label="sprache"'), "Selector de idioma incluye alemán");

const game = createInitialState([
  { id: 0, name: "Ana", color: "#e63946", eliminated: false },
  { id: 1, name: "Beto", color: "#457b9d", eliminated: false },
] as any);
const hud = (lang: string) => withLang(lang, <HUD game={game} onReset={() => {}} roomCode="ABCD" myPlayerId={0} isHost locked={false} onLeave={() => {}} onEndGame={() => {}} onToggleLocked={() => {}} />);
const hEs = hud("es"), hEn = hud("en");
ok(hEs.includes("es tu turno") && hEs.includes("reiniciar") && hEs.includes("salir") && hEs.includes("🔓 abierta"), "HUD en español");
ok(hEn.includes("it&#x27;s your turn") && hEn.includes("restart") && hEn.includes("leave") && hEn.includes("🔓 open") && hEn.includes("room"), "HUD en inglés");
const hOther = withLang("en", <HUD game={game} onReset={() => {}} roomCode="ABCD" myPlayerId={1} />);
ok(hOther.includes("<strong>") && /turn/.test(hOther) && hOther.includes("&#x27;s turn"), "HUD en inglés: «{name}'s turn» con el nombre en negrita");

const chat = (lang: string) => withLang(lang, <ChatPanel messages={[{ playerId: 1, playerName: "Beto", text: "hola", sentAt: 1 } as any]} players={game.players} myPlayerId={0} onSendChat={() => {}} onReportMessage={() => {}} />);
// El panel arranca contraído o abierto según su estado: se comprueban ambos posibles textos
const cEn = chat("en"), cEs = chat("es");
ok((cEn.includes("send") || cEn.includes("💬 chat")) && !cEn.includes("enviar"), "Chat en inglés");
ok(cEs.includes("enviar") || cEs.includes("💬 chat"), "Chat en español");

const over = { ...game, status: { kind: "draw" } } as any;
const hudOver = (lang: string, votes: number[]) => withLang(lang, <HUD game={over} onReset={() => {}} roomCode="ABCD" myPlayerId={1} onRematch={() => {}} rematchVotes={votes} rematchTotal={2} />);
ok(hudOver("en", []).includes(">rematch<") && hudOver("es", []).includes(">revancha<"), "HUD: botón de revancha al terminar la partida");
ok(hudOver("en", [0]).includes("rematch: 1 of 2") && hudOver("es", [0]).includes("revancha: 1 de 2"), "HUD: contador de votos de revancha");
ok(hudOver("en", [1]).includes("disabled"), "HUD: si ya votaste, el botón queda desactivado");
ok(!hud("en").includes("rematch"), "HUD: sin partida terminada no hay revancha");
ok(hudOver("en", []).includes("copy link") && hudOver("es", []).includes("copiar enlace"), "HUD: botón de copiar enlace de invitación");

const cc = (lang: string, spread: number) => withLang(lang, <CubeControls spread={spread} onChange={() => {}} />);
ok(cc("en", 0).includes("open cube") && cc("es", 0).includes("abrir cubo"), "deslizador de abrir cubo, en ambos idiomas");
ok(cc("en", 0.5).includes('value="50"') && cc("en", 1).includes('value="100"'), "el deslizador refleja cuánto está abierto");

const authBox = (lang: string, auth: any) => withLang(lang, <AuthBox auth={auth} onLogin={() => {}} onLogout={() => {}} onRetry={() => {}} />);
const both = { phase: "ready", providers: { discord: true, google: true, required: true }, me: null, authError: null };
ok(authBox("es", { phase: "loading" }).includes("comprobando sesión..."), "login: comprobando sesión");
ok(authBox("es", both).includes("entrar con discord") && authBox("es", both).includes("entrar con google") && authBox("es", both).includes("inicia sesión para jugar online"), "login: sin sesión y obligatoria, botones de Discord y Google");
ok(authBox("en", both).includes("sign in with discord") && authBox("de", both).includes("mit discord anmelden") && authBox("de", both).includes("mit google anmelden"), "login: botones en inglés y alemán");
ok(!authBox("es", { ...both, providers: { discord: true, google: false, required: true } }).includes("google"), "login: solo muestra los proveedores configurados");
ok(authBox("es", { ...both, providers: { discord: false, google: false, required: true } }) === "", "login: sin proveedores configurados no muestra nada");
ok(authBox("es", { ...both, providers: { discord: true, google: true, required: false } }) === "", "login: si el servidor no la exige y no hay sesión, no molesta");
ok(authBox("es", { ...both, me: { id: "1", displayName: "Ana", status: "approved" } }).includes("sesión iniciada como Ana") && authBox("es", { ...both, me: { id: "1", displayName: "Ana", status: "approved" } }).includes("cerrar sesión"), "login: con sesión muestra el nombre (con su mayúscula) y cerrar sesión");
ok(authBox("es", { ...both, me: { id: "1", displayName: "Ana", status: "pending" } }).includes("pendiente de aprobación") && authBox("en", { ...both, me: { id: "1", displayName: "Ana", status: "pending" } }).includes("waiting for approval"), "login: cuenta pendiente avisa");
ok(authBox("es", { ...both, me: { id: "1", displayName: "Ana", status: "banned" } }).includes("baneada") && authBox("de", { ...both, me: { id: "1", displayName: "Ana", status: "banned" } }).includes("gesperrt"), "login: cuenta baneada avisa");
ok(authBox("es", { ...both, providers: null }).includes("reintentar") && authBox("en", { ...both, providers: null }).includes("try again"), "login: servidor sin respuesta ofrece reintentar");
ok(authBox("es", { ...both, authError: "cancelled" }).includes("cancelaste") && authBox("es", { ...both, authError: "provider" }).includes("no se pudo iniciar sesión"), "login: errores al volver del proveedor");

const sw = withLang("en", <LanguageSwitcher />);
ok(sw.includes("español") && sw.includes("english") && sw.includes('aria-label="language"'), "Selector de idioma: opciones y etiqueta accesible en inglés");
ok(withLang("es", <LanguageSwitcher />).includes('aria-label="idioma"'), "Selector de idioma: etiqueta en español");

console.log(fails === 0 ? "\nRENDER OK" : `\n${fails} FALLO(S)`);
process.exit(fails ? 1 : 0);
