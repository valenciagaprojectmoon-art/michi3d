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
  "Cubo": "Cube",
  "Dimensión del cubo": "Cube dimension",
  "Dimensión de línea": "Line dimension",
  "Cubo de {size}×{size}×{size}: {cells} casillas. Gana quien junte {line} en línea recta.":
    "{size}×{size}×{size} cube: {cells} cells. Whoever gets {line} in a straight line wins.",
  "Mínimo {min}, máximo {max}. La línea no puede ser mayor que el cubo.": "Minimum {min}, maximum {max}. The line can't be longer than the cube.",
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
  "Sin usos gratis, la próxima habilidad te cuesta el turno.": "No free uses left, the next ability costs you your turn.",
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


  // Descripciones de habilidades
  "Te saltas tu turno y recuperas algo de vida.": "You skip your turn and get a bit of life back.",
  "Iguala la vida de todos los que siguen vivos (se hace la media), tú incluido.": "Evens out the life of everyone still alive (it takes the average), you included.",
  "Te curas, pero tu vida máxima baja. Si te pasas, puedes caer.": "You heal, but your max life goes down. Push it too far and you can drop.",
  "Eliges a un rival y en su próximo turno ve la pantalla hecha un lío.": "Pick a rival and on their next turn their screen turns into a mess.",
  "Te protege: nadie puede devolverte el turno con la brújula.": "It protects you: nobody can send the turn back to you with the compass.",
  "Cambias una casilla de otro jugador por una tuya. Si cierra una línea, ganas.": "You swap another player's cell for one of yours. If it completes a line, you win.",
  "Copias la primera habilidad de la mano de otro jugador y la usas tú.": "You copy the first ability in another player's hand and use it yourself.",
  "El turno vuelve atrás unos cuantos jugadores, sin tocar el tablero.": "The turn goes back a few players, without touching the board.",
  "Tómala o pásasela a alguien. Si se la queda demasiado tiempo, le explota y pierde vida.": "Take it or pass it on. If someone holds it for too long, it blows up on them and they lose life.",
  "Aparece tarde en la partida. Si votan los suficientes, el que tarde en jugar pierde vida.": "It shows up late in the game. If enough players vote for it, whoever takes too long to play loses life.",

  // Cubo
  "Abrir cubo": "Open cube",

  // Revancha e invitación
  "Revancha": "Rematch",
  "Revancha: {votes} de {total}": "Rematch: {votes} of {total}",
  "Copiar enlace": "Copy link",
  "Enlace copiado": "Link copied",

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
  "Conectando... si el servidor estaba dormido, puede tardar un minuto.": "Connecting... if the server was asleep it can take a minute.",
  "{name} se desconectó.": "{name} disconnected.",
  "{name} volvió a conectarse.": "{name} reconnected.",
  "Reporte enviado, lo revisaremos.": "Report sent, we'll take a look.",
  "No hay forma de conectar con el servidor. Revisa tu internet y prueba otra vez.": "Couldn't reach the server. Check your internet and try again.",
  "Te sacamos por mandar demasiadas peticiones. Espera un par de minutos y vuelve a entrar.":
    "We kicked you out for sending too many requests. Wait a couple of minutes and come back.",
  "Hay demasiadas conexiones desde tu red ahora mismo. Prueba de nuevo en un rato.":
    "There are too many connections from your network right now. Try again in a bit.",
  "Se envió un mensaje demasiado grande y se cerró la conexión.": "A message that was too large was sent and the connection was closed.",
  "🎨 ¡Te tiraron un Globo de Pintura! Tu pantalla se ve rara este turno.": "🎨 You got hit by a Paint Balloon! Your screen looks weird this turn.",
  "Te tocó un efecto.": "You got hit by an effect.",
  "Idioma": "Language",
};
