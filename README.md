# Michi 3D

Tres en raya en un cubo 3×3×3. React + TypeScript + Three.js (`@react-three/fiber`).

Tiene dos modos:
- **Local**: hotseat en el mismo dispositivo, sin internet, sin servidor. Funciona solo con este proyecto.
- **Online**: cada jugador desde su casa, por código de sala. Necesita el servidor de la carpeta `michi3d-server` (al lado de esta) corriendo en algún lugar.

## Modo local (rápido, sin servidor)

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite y elige "Jugar en este dispositivo". Ya está.

## Modo online

Necesitas DOS cosas corriendo:
1. El **servidor** (`michi3d-server`) — coordina las salas y las partidas.
2. Este **frontend**, apuntando a ese servidor.

### 1. Correr el servidor en tu compu, para probar en local primero

```bash
cd ../michi3d-server
npm install
npm run dev
```

Va a decir `Servidor Michi 3D escuchando en el puerto 8080`.

### 2. Correr el frontend apuntando a ese servidor local

```bash
npm install
npm run dev
```

Abre la URL, crea una sala, comparte el código con alguien EN TU MISMA RED (esto todavía no funciona entre casas distintas — sigue leyendo para eso).

### 3. Desplegar para que funcione entre casas distintas

Mientras el servidor viva solo en tu compu, nadie fuera de tu red puede llegar a él. Para jugar de verdad entre casas, el servidor tiene que vivir en internet. La forma gratuita más simple es **Render**:

**a) Sube ambas carpetas (`michi3d` y `michi3d-server`) a un repositorio de GitHub.**

**b) En [render.com](https://render.com), crea una cuenta gratis (no pide tarjeta) y luego:**
   - "New" → "Web Service"
   - Conecta tu repositorio de GitHub
   - **Root directory**: `michi3d-server`
   - **Build command**: `npm install && npm run build`
   - **Start command**: `npm start`
   - Plan: Free
   - Dale a "Create Web Service"

   Espera a que termine el deploy (unos minutos). Cuando termine, Render te da una URL como:
   ```
   https://michi3d-server.onrender.com
   ```
   Esa es tu URL de servidor. Guárdala.

**c) Configura el frontend para usar esa URL:**

   En la carpeta `michi3d` (esta), crea un archivo llamado `.env` (copia `.env.example` y renómbralo) con:
   ```
   VITE_SERVER_URL=wss://michi3d-server.onrender.com
   ```
   **Importante**: es `wss://` (con "s" de seguro), no `ws://`, y no `https://`. Usa exactamente el dominio que te dio Render, cambiando `https` por `wss`.

**d) Despliega el frontend** (por ejemplo en [Vercel](https://vercel.com) o [Netlify](https://netlify.com), ambos gratis y con "Import from GitHub" tan simple como Render). Configura la misma variable `VITE_SERVER_URL` en el panel de variables de entorno del hosting que elijas.

Una vez desplegado, comparte el link del frontend con quien quieras — cualquiera que lo abra puede crear o unirse a una sala con código, desde donde sea.

**Nota sobre el plan gratis de Render**: los servicios gratuitos "duermen" tras 15 minutos sin uso y tardan ~30-60 segundos en despertar con la primera conexión. Es normal que la primera vez que alguien crea una sala tarde un poco — no es un error.

## Estructura

```
michi3d/                  # este proyecto (frontend)
  src/
    game/
      logic.ts             # Lógica pura del juego: líneas ganadoras, turnos, victoria/empate
      protocol.ts           # Tipos de mensajes compartidos con el servidor
      useMultiplayer.ts      # Hook de conexión WebSocket
    components/
      Cell.tsx               # Una casilla individual
      Board3D.tsx              # Las 27 casillas + wireframe del cubo
      GameScene.tsx             # Canvas 3D + luces + controles de cámara
      HUD.tsx                    # Turno, resultado, código de sala, reinicio
      Lobby.tsx                   # Pantalla de crear/unirse a sala
    App.tsx                        # Orquesta local vs online

michi3d-server/            # servidor (carpeta hermana, deploy aparte)
  src/
    logic.ts                 # Copia idéntica de la lógica de juego
    protocol.ts                # Copia idéntica del protocolo de mensajes
    rooms.ts                    # Gestión de salas: crear, unir, reconectar, expirar
    server.ts                    # Servidor WebSocket real
```

## Controles

- **Clic izquierdo + arrastrar**: rotar cámara.
- **Scroll**: zoom.
- **Clic en una casilla**: jugar, si está vacía y es tu turno.
- **Botón "Reiniciar"**: nueva partida (misma sala, mismos jugadores, vidas restauradas).
- **Botón "🔒 Cerrada" / "🔓 Abierta"** (solo el host, solo online): impide o permite que gente nueva se una a la sala. Quienes ya estaban dentro siempre pueden reconectar, incluso con la sala cerrada.
- **Botón "Terminar"** (solo el host, solo online): termina la partida en cualquier momento, sin esperar a que alguien gane.
- **Botón "Salir"** (solo online): abandona la sala y vuelve al inicio.

## Partidas personalizadas (modo online)

Al crear una sala, el host puede configurar:

- **Sin límite de tiempo** (el comportamiento original, sin prisa).
- **Con límite — pierde el turno**: cada jugador tiene X segundos para jugar. Si se pasa, el creador eligió de antemano si simplemente se omite su turno, o si se juega automáticamente en una casilla al azar.
- **Con límite — pierde corazones**: igual que arriba, pero además cada jugador arranca con un número de corazones configurable. Si se le acaba el tiempo, pierde un corazón; al llegar a 0, queda eliminado de esa partida (sus marcas ya puestas se quedan en el tablero, pero no puede seguir jugando). Si al eliminar a alguien solo queda un jugador activo, ese jugador gana automáticamente. Con 3+ jugadores, la partida sigue normal entre los que quedan.

Solo el que crea la sala configura esto — quienes se unen después heredan la configuración ya elegida.

## Decisiones técnicas

| Decisión | Por qué |
|---|---|
| `logic.ts` idéntico copiado en frontend y servidor, en vez de un paquete compartido | Evita configurar un monorepo con workspaces solo para esto; a este tamaño, copiar el archivo es más simple que la infraestructura de compartirlo. Si el proyecto crece, migrar a un paquete `shared/` es sencillo. |
| Reconexión por nombre, no por token/sesión | Si alguien recarga la página, vuelve a su mismo jugador con solo escribir el mismo nombre + código de sala. Más simple que manejar tokens, suficiente para un prototipo. |
| Código de sala de 4 caracteres (sin O/0/I/1) | Fácil de dictar o escribir sin ambigüedad, ~1.19M combinaciones — de sobra para uso casual. |
| El cliente bloquea el clic si no es tu turno, ADEMÁS del servidor | El servidor es la autoridad real (rechaza igual si alguien se salta el bloqueo del cliente), pero bloquear también en el cliente evita una vuelta de red innecesaria y dice claramente "no te toca" en vez de fallar en silencio. |
| Salas vacías se borran a los 5 minutos | Sin esto, un servidor gratis de larga duración acumula salas abandonadas para siempre en memoria. |
| El servidor revisa los temporizadores cada 1 segundo (no por jugador) | Un único `setInterval` recorriendo todas las salas activas es más simple y predecible que un timer independiente por jugador, y 1s de resolución es más que suficiente para un juego de mesa por turnos. |
| Un jugador desconectado se salta automáticamente en la rotación de turnos | Sin esto, si alguien cierra el navegador a mitad de partida, el juego queda esperando su turno para siempre y nadie más puede jugar. Al reconectar, vuelve a entrar en la rotación normal en la siguiente vuelta. |
| El host se identifica de forma explícita (`isHost`), no "el primer jugador" | Si se calculara dinámicamente como "el jugador con id más bajo", el host perdería su rol especial si se desconecta y otro jugador termina con un id menor en algún reordenamiento. Marcarlo explícitamente es robusto ante cualquier reordenamiento futuro. |

## Límites conocidos

1. Con 2 jugadores y sin modo Vida, el empate es matemáticamente casi imposible en este tablero (resultado conocido del 3D tic-tac-toe 3×3×3) — no es un bug, siempre se puede forzar una victoria antes de llenar el tablero. Con 3+ jugadores el empate sí ocurre normalmente.
2. Reconexión por nombre: si dos personas en la misma sala usan el mismo nombre, la segunda podría "robarle" la sesión a la primera al reconectar. Para un prototipo entre amigos no es un problema real, pero no es apto para producción seria sin agregar autenticación.
3. Sin IA ni modo un jugador.
4. El plan gratis de Render duerme tras inactividad (ver nota arriba).
5. No hay reconexión automática si se cae la conexión a mitad de partida — hay que recargar la página manualmente.
6. El cronómetro visible en pantalla es solo informativo (se recalcula en tu navegador cada segundo); la autoridad real de cuándo se acaba el tiempo vive en el servidor, con resolución de 1 segundo. En una conexión muy lenta, el número que ves podría no coincidir exactamente al milisegundo con el momento real en que el servidor aplica el timeout.
7. El modo local (mismo dispositivo) no tiene configuración de tiempo/vidas — esas reglas están pensadas para el modo online, donde el servidor actúa como reloj compartido entre jugadores en dispositivos distintos.
