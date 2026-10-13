const NOMBRES_TIPO = { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria' };

export function nombreTipoSesion(tipo) {
  return NOMBRES_TIPO[tipo] ?? NOMBRES_TIPO.ordinaria;
}

export function encabezadoSesion(sesion) {
  return sesion
    ? { titulo: `Sesión ${nombreTipoSesion(sesion.tipo)} N° ${sesion.numeroSesion ?? '—'}`, subtitulo: sesion.label }
    : { titulo: 'Sesión Ordinaria', subtitulo: 'Fecha por definir' };
}

export function subtituloAsuetos(calendario) {
  const n = calendario ? calendario.asuetos.length : 0;
  return `${n} registro${n === 1 ? '' : 's'}`;
}

export function sesionOrdinariaAnterior(sesiones, sesionId) {
  return sesiones
    .filter((s) => (s.tipo ?? 'ordinaria') === 'ordinaria' && s.id < sesionId)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .pop() ?? null;
}

export function nombreActaDeSesion(sesion) {
  if (!sesion) return 'Acta de la sesión anterior';
  const { titulo, subtitulo } = encabezadoSesion(sesion);
  return `Acta de la ${titulo} (${subtitulo})`;
}
