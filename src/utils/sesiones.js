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
