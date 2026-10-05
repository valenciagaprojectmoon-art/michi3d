// Renderiza los componentes reales con el idioma activo y comprueba los textos (sin navegador).
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { I18nProvider } from "../src/i18n";
import { LanguageSwitcher } from "../src/i18n/LanguageSwitcher";
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
ok(es.includes("Crear sala nueva") && es.includes("Tu nombre") && es.includes('href="/terminos.html"') && es.includes('href="/privacidad.html"'), "Lobby en español: textos y enlaces legales en español");
ok(en.includes("Create a new room") && en.includes("Your name") && en.includes("Join with a code") && en.includes('href="/terms.html"') && en.includes('href="/privacy.html"'), "Lobby en inglés: textos y enlaces legales en inglés");
ok(en.includes("I am at least 14 years old and I accept the") && en.includes(">Terms of Service</a>") && en.includes(">Privacy Policy</a>"), "Lobby en inglés: casilla de términos con enlaces traducidos");
ok(!en.includes("Crear sala") && !en.includes("Tu nombre") && !en.includes("Unirme"), "Lobby en inglés: no queda español visible");

const game = createInitialState([
  { id: 0, name: "Ana", color: "#e63946", eliminated: false },
  { id: 1, name: "Beto", color: "#457b9d", eliminated: false },
] as any);
const hud = (lang: string) => withLang(lang, <HUD game={game} onReset={() => {}} roomCode="ABCD" myPlayerId={0} isHost locked={false} onLeave={() => {}} onEndGame={() => {}} onToggleLocked={() => {}} />);
const hEs = hud("es"), hEn = hud("en");
ok(hEs.includes("Es tu turno") && hEs.includes("Reiniciar") && hEs.includes("Salir") && hEs.includes("🔓 Abierta"), "HUD en español");
ok(hEn.includes("It&#x27;s your turn") && hEn.includes("Restart") && hEn.includes("Leave") && hEn.includes("🔓 Open") && hEn.includes("Room"), "HUD en inglés");
const hOther = withLang("en", <HUD game={game} onReset={() => {}} roomCode="ABCD" myPlayerId={1} />);
ok(hOther.includes("<strong>") && /turn/.test(hOther) && hOther.includes("&#x27;s turn"), "HUD en inglés: «{name}'s turn» con el nombre en negrita");

const chat = (lang: string) => withLang(lang, <ChatPanel messages={[{ playerId: 1, playerName: "Beto", text: "hola", sentAt: 1 } as any]} players={game.players} myPlayerId={0} onSendChat={() => {}} onReportMessage={() => {}} />);
// El panel arranca contraído o abierto según su estado: se comprueban ambos posibles textos
const cEn = chat("en"), cEs = chat("es");
ok((cEn.includes("Send") || cEn.includes("💬 Chat")) && !cEn.includes("Enviar"), "Chat en inglés");
ok(cEs.includes("Enviar") || cEs.includes("💬 Chat"), "Chat en español");

const sw = withLang("en", <LanguageSwitcher />);
ok(sw.includes("Español") && sw.includes("English") && sw.includes('aria-label="Language"'), "Selector de idioma: opciones y etiqueta accesible en inglés");
ok(withLang("es", <LanguageSwitcher />).includes('aria-label="Idioma"'), "Selector de idioma: etiqueta en español");

console.log(fails === 0 ? "\nRENDER OK" : `\n${fails} FALLO(S)`);
process.exit(fails ? 1 : 0);
