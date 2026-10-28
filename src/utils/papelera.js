export const MOTIVOS_PAPELERA = {
  borrador: { texto: 'Borrador', tono: 'azul' },
  pendiente: { texto: 'Pendiente en lista', tono: 'naranja' },
  eliminado: { texto: 'Eliminado', tono: 'rojo' },
};

export const MAX_SESIONES_REINTEGRO = 5;

export function motivoPapelera(motivo) {
  return MOTIVOS_PAPELERA[motivo] ?? MOTIVOS_PAPELERA.pendiente;
}

export function sesionesParaReintegrar(sesiones) {
  return sesiones
    .filter((s) => (s.estado === 'proxima' || s.estado === 'pendiente') && !s.horaInicio)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .slice(0, MAX_SESIONES_REINTEGRO);
}
