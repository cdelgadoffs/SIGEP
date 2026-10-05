export function tituloPunto(numero) {
  if (!Number.isInteger(numero)) return '';
  return `PLE/${String(numero).padStart(3, '0')}`;
}

export function contarPuntos(puntos) {
  return puntos.filter((p) => !p.encabezado).length;
}

export function puntosOrdenados(puntos, secciones) {
  return puntos
    .filter((p) => !p.encabezado)
    .sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0))
    .map((punto) => ({ punto, seccion: secciones.find((s) => s.id === punto.seccion), titulo: tituloPunto(punto.numero) }))
    .filter((item) => item.seccion);
}

export function puntoActivo(items, id) {
  return items.find((i) => i.punto.id === id) ?? items[0] ?? null;
}
