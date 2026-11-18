// Interruptores de funcionalidades.
//
// Equipos (invitar miembros, crear equipos, compartir con equipo o compañía)
// está apagado mientras las suscripciones sean individuales. El código se
// queda listo: para volver a prenderlo basta con definir
// NEXT_PUBLIC_TEAMS_ENABLED=true en las variables de entorno y redeployar.
export function teamsEnabled(): boolean {
  return process.env.NEXT_PUBLIC_TEAMS_ENABLED === 'true'
}
