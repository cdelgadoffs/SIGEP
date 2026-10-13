const NOMBRES_TIPO = { ordinaria: 'Ordinaria', extraordinaria: 'Extraordinaria' };

export function nombreTipoSesion(tipo) {
  return NOMBRES_TIPO[tipo] ?? NOMBRES_TIPO.ordinaria;
}

export const FILTROS_CINTA = [
  { id: 'todas', label: 'Todas' },
  { id: 'ordinaria', label: 'Sesiones Ordinarias' },
  { id: 'extraordinaria', label: 'Sesiones Extraordinarias' },
  { id: 'semanal', label: 'Vista semanal' },
];

export const PREFIJO_OPCION_FILTRO_CINTA = 'filtroCinta:';

export function opcionesFiltroCinta(filtroActivo) {
  return FILTROS_CINTA.map((f) => ({
    id: `${PREFIJO_OPCION_FILTRO_CINTA}${f.id}`,
    label: f.label,
    grupo: 'Cinta de sesiones',
    icono: f.id === filtroActivo ? 'ri-radio-button-line' : 'ri-checkbox-blank-circle-line',
  }));
}

export function esOpcionFiltroCinta(id) {
  return typeof id === 'string' && id.startsWith(PREFIJO_OPCION_FILTRO_CINTA);
}

export function filtroDeOpcion(id) {
  return id.slice(PREFIJO_OPCION_FILTRO_CINTA.length);
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
