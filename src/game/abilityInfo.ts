import type { AbilityId } from "./abilities";

/** Qué hace cada habilidad, en una frase y en cristiano. El texto en español es la clave de traducción. */
export const ABILITY_INFO: Record<AbilityId, string> = {
  chicharron: "Te saltas tu turno y recuperas algo de vida.",
  balanza: "Iguala la vida de todos los que siguen vivos (se hace la media), tú incluido.",
  goyslop: "Te curas, pero tu vida máxima baja. Si te pasas, puedes caer.",
  globo_pintura: "Eliges a un rival y en su próximo turno ve la pantalla hecha un lío.",
  reloj_roto: "Te protege: nadie puede devolverte el turno con la brújula.",
  malversion_fondos: "Cambias una casilla de otro jugador por una tuya. Si cierra una línea, ganas.",
  postcognicion: "Copias la primera habilidad de la mano de otro jugador y la usas tú.",
  brujula_mal_imantada: "El turno vuelve atrás unos cuantos jugadores, sin tocar el tablero.",
  papa_caliente: "Tómala o pásasela a alguien. Si se la queda demasiado tiempo, le explota y pierde vida.",
  acelerador_particulas: "Aparece tarde en la partida. Si votan los suficientes, el que tarde en jugar pierde vida.",
};
