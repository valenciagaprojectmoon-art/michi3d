/**
 * Traducciones al inglés. La CLAVE es el texto original en español (idioma base):
 * t("Crear sala") devuelve "Create room" en inglés y el mismo texto en español.
 * Si falta una clave en un idioma, se muestra el español (nunca se rompe la pantalla).
 * El test `test/i18n.test.mjs` (en el servidor) comprueba que no falte ninguna.
 *
 * Para añadir otro idioma: crea un diccionario como este, regístralo en `index.tsx`
 * (DICTIONARIES y LANGUAGES) y añade las páginas legales y de error de ese idioma.
 */
export const EN: Record<string, string> = {
  // Lobby
  "Tres en raya en un cubo 3×3×3": "Tic-tac-toe in a 3×3×3 cube",
  "Tu nombre": "Your name",
  "Ej: Ana": "e.g. Ana",
  "Tengo al menos 14 años y acepto los {terms} y la {privacy}, incluido el registro del chat de la sala para moderación. (Solo para jugar online.)":
    "I am at least 14 years old and I accept the {terms} and the {privacy}, including the logging of the room chat for moderation. (Online play only.)",
  "Términos de Servicio": "Terms of Service",
  "Política de Privacidad": "Privacy Policy",
  "Crear sala nueva": "Create a new room",
  "Unirme con un código": "Join with a code",
  "Jugar en este dispositivo (sin internet)": "Play on this device (offline)",
  "Vida": "Life",
  "Vida inicial de cada jugador": "Starting life for each player",
  "Tiempo por turno": "Time per turn",
  "Sin límite": "No limit",
  "Con límite: pierde el turno": "Time limit: lose the turn",
  "Con límite: pierde vida": "Time limit: lose life",
  "Segundos por turno": "Seconds per turn",
  "Al vencer el tiempo": "When time runs out",
  "Se omite el turno": "The turn is skipped",
  "Se juega al azar": "A random move is played",
  "Daño al vencer el tiempo": "Damage when time runs out",
  "Habilidades": "Abilities",
  "Chicharrón: vida que cura": "Chicharrón: life healed",
  "Goyslop: vida que cura": "Goyslop: life healed",
  "Goyslop: vida máxima que pierde": "Goyslop: max life lost",
  "Globo de Pintura: divergencia": "Paint Balloon: divergence",
  "Brújula Mal Imantada: máximo de turnos atrás": "Miscalibrated Compass: max turns back",
  "Papa Caliente: turnos para pasarla": "Hot Potato: turns to pass it",
  "Papa Caliente: turnos para repasarla (si ya fue pasada)": "Hot Potato: turns to re-pass it (if already passed)",
  "Papa Caliente: daño de la explosión": "Hot Potato: explosion damage",
  "Papa Caliente: segundos para jugar": "Hot Potato: seconds to play",
  "Acelerador: turno de aparición (turnos jugados)": "Accelerator: turn it appears (turns played)",
  "Acelerador: jugadores para activarlo": "Accelerator: players needed to activate it",
  "Acelerador: segundos por tick de daño": "Accelerator: seconds per damage tick",
  "Acelerador: daño por tick": "Accelerator: damage per tick",
  "Shuffle (mano rotativa)": "Shuffle (rotating hand)",
  "Activar Shuffle": "Enable Shuffle",
  "Cada jugador ve solo algunas de las habilidades activadas arriba a la vez; la mano rota al empezar cada turno tuyo.":
    "Each player only sees some of the abilities enabled above at a time; the hand rotates at the start of each of your turns.",
  "Tamaño de la mano (cuántas habilidades ves a la vez)": "Hand size (how many abilities you see at once)",
  "Tienes {n} habilidad activada, la mano incluirá todas, no {hand}.":
    "You have {n} ability enabled, the hand will include all of them, not {hand}.",
  "Tienes {n} habilidades activadas, la mano incluirá todas, no {hand}.":
    "You have {n} abilities enabled, the hand will include all of them, not {hand}.",
  "Usos sin consumir turno, por turno": "Uses that don't consume the turn, per turn",
  "Chicharrón, Balanza, Brújula, Papa Caliente y Acelerador siempre consumen el turno completo, sin importar este número.":
    "Chicharrón, Scales, Compass, Hot Potato and Accelerator always consume the whole turn, regardless of this number.",
  "Conectando...": "Connecting...",
  "Crear sala": "Create room",
  "Volver": "Back",
  "Código de sala": "Room code",
  "Unirme": "Join",

  // Nombres de habilidades (con emoji)
  "🥔 Papa Caliente": "🥔 Hot Potato",
  "🍖 Chicharrón": "🍖 Chicharrón",
  "🔮 Postcognición": "🔮 Postcognition",
  "⚛️ Acelerador de Partículas": "⚛️ Particle Accelerator",
  "🎨 Globo de Pintura": "🎨 Paint Balloon",
  "⚖️ Balanza": "⚖️ Scales",
  "⏰ Reloj Roto": "⏰ Broken Clock",
  "🧭 Brújula Mal Imantada": "🧭 Miscalibrated Compass",
  "🥫 Goyslop": "🥫 Goyslop",
  "💰 Malversión de Fondos": "💰 Embezzlement",

  // Panel de habilidades
  "Elige una casilla ajena para {ability}": "Pick another player's cell for {ability}",
  "Cancelar": "Cancel",
  "Postcognición copia {ability}: elige su objetivo": "Postcognition copies {ability}: choose its target",
  "Postcognición copia {ability}: ¿cuántos turnos retrocedes?": "Postcognition copies {ability}: how many turns do you go back?",
  "¿Cuántos turnos quieres retroceder con {ability}?": "How many turns do you want to go back with {ability}?",
  "¿A quién le pasas la {ability}?": "Who do you pass the {ability} to?",
  "Elige un objetivo para {ability}": "Choose a target for {ability}",
  "🥔 La Papa Caliente la tiene {who} · turnos sostenida: {turns}": "🥔 {who} has the Hot Potato · turns held: {turns}",
  "TI": "YOU",
  "⚛️ ¡Acelerador ACTIVO! −{damage} de vida por cada {seconds}s que tardes en jugar":
    "⚛️ Accelerator ACTIVE! −{damage} life for every {seconds}s you take to play",
  "⚛️ El Acelerador aparece tras {turn} turnos jugados (van {played})": "⚛️ The Accelerator appears after {turn} turns played ({played} so far)",
  "⚛️ Acelerador: votos {votes}/{needed}": "⚛️ Accelerator: votes {votes}/{needed}",
  "Usos gratis restantes este turno: {n}": "Free uses left this turn: {n}",
  "Sin usos gratis: la siguiente habilidad consumirá tu turno": "No free uses: the next ability will consume your turn",
  "🥔 Tomar Papa Caliente": "🥔 Take Hot Potato",
  "🥔 Pasar Papa Caliente": "🥔 Pass Hot Potato",
  "Solo puedes usar habilidades en tu turno": "You can only use abilities on your turn",
  "La Papa Caliente la tiene {who}": "{who} has the Hot Potato",
  "El Acelerador aparece tras {turn} turnos jugados (van {played})": "The Accelerator appears after {turn} turns played ({played} so far)",
  "El Acelerador ya está activo": "The Accelerator is already active",
  "Ya votaste para activar el Acelerador": "You already voted to activate the Accelerator",
  "Usar habilidad (consume tu turno)": "Use ability (consumes your turn)",
  "Usar habilidad (no consume tu turno, te queda al menos 1 uso gratis)": "Use ability (doesn't consume your turn, you have at least 1 free use left)",
  " · gratis": " · free",

  // HUD
  "Sala": "Room",
  "Reiniciar": "Restart",
  "🔒 Cerrada": "🔒 Closed",
  "🔓 Abierta": "🔓 Open",
  "Terminar": "End game",
  "Salir": "Leave",
  "Es tu turno": "It's your turn",
  "Turno de {name}": "{name}'s turn",
  "¡Ganó {name}! 🎉": "{name} wins! 🎉",
  "¡Ganó {name}, los demás quedaron eliminados 💔": "{name} wins, everyone else was eliminated 💔",
  "Empate: el tablero se llenó 🤝": "Draw: the board is full 🤝",
  "El creador de la sala terminó la partida ⏹": "The room creator ended the game ⏹",
  "Arrastra para rotar la cámara · Clic en una casilla para jugar": "Drag to rotate the camera · Click a cell to play",

  // Chat
  "💬 Chat": "💬 Chat",
  "Chat": "Chat",
  "🔒 El chat de esta sala se registra para moderación.": "🔒 This room's chat is logged for moderation.",
  "Más info": "More info",
  "Nadie ha escrito todavía.": "Nobody has written yet.",
  "Tú": "You",
  "Reportar este mensaje": "Report this message",
  "Reportar el mensaje de {name}.\n¿Cuál es el motivo? (opcional)": "Report {name}'s message.\nWhat is the reason? (optional)",
  "Escribe un mensaje...": "Type a message...",
  "Enviar": "Send",

  // App / avisos del cliente
  "Conectando al servidor...": "Connecting to the server...",
  "{name} se desconectó.": "{name} disconnected.",
  "{name} volvió a conectarse.": "{name} reconnected.",
  "Reporte enviado. Un moderador lo revisará.": "Report sent. A moderator will review it.",
  "No se pudo conectar al servidor. Verifica la dirección o tu conexión.": "Could not connect to the server. Check the address or your connection.",
  "Te desconectamos por enviar demasiadas peticiones. Espera un par de minutos antes de volver a entrar.":
    "You were disconnected for sending too many requests. Wait a couple of minutes before coming back.",
  "El servidor tiene demasiadas conexiones desde tu red ahora mismo. Inténtalo de nuevo en un momento.":
    "The server has too many connections from your network right now. Try again in a moment.",
  "Se envió un mensaje demasiado grande y se cerró la conexión.": "A message that was too large was sent and the connection was closed.",
  "🎨 ¡Te tiraron un Globo de Pintura! Tu pantalla se ve rara este turno.": "🎨 You got hit by a Paint Balloon! Your screen looks weird this turn.",
  "Se aplicó un efecto.": "An effect was applied.",
  "Idioma": "Language",
};
