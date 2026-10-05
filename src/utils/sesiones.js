export function encabezadoSesion(sesion) {
  return sesion
    ? { titulo: `Sesión Ordinaria N° ${sesion.numeroSesion ?? '—'}`, subtitulo: sesion.label }
    : { titulo: 'Sesión Ordinaria', subtitulo: 'Fecha por definir' };
}

export function subtituloAsuetos(calendario) {
  const n = calendario ? calendario.asuetos.length : 0;
  return `${n} registro${n === 1 ? '' : 's'}`;
}
