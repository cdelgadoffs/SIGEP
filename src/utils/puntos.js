export function tituloPunto(numero) {
  if (!Number.isInteger(numero)) return '';
  return `PLE/${String(numero).padStart(3, '0')}`;
}

export function contarPuntos(puntos) {
  return puntos.filter((p) => !p.encabezado).length;
}

export function normalizarTexto(texto) {
  return String(texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

export function puntoCoincide(punto, termino) {
  const buscado = normalizarTexto(termino).trim();
  return !buscado || normalizarTexto(punto.contenido).includes(buscado);
}

export function puntosOrdenados(puntos, secciones, termino = '') {
  return puntos
    .filter((p) => !p.encabezado && puntoCoincide(p, termino))
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .map((punto) => ({ punto, seccion: secciones.find((s) => s.id === punto.seccion), titulo: tituloPunto(punto.numero) }))
    .filter((item) => item.seccion);
}

export function puntoActivo(items, id) {
  return items.find((i) => i.punto.id === id) ?? items[0] ?? null;
}

export function numeroSiguientePunto(puntos, secciones, seccionId) {
  const limite = secciones.findIndex((s) => s.id === seccionId);
  if (limite < 0) return null;
  const orden = (id) => secciones.findIndex((s) => s.id === id);
  const numeros = puntos.filter((p) => orden(p.seccion) <= limite && Number.isInteger(p.numero)).map((p) => p.numero);
  return Math.max(0, ...numeros) + 1;
}
