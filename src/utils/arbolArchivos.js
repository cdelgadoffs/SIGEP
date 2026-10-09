export function nombreSeguro(texto) {
  return (texto || 'Sin nombre').replace(/[\\/:*?"<>|]/g, '-').slice(0, 60).trim();
}

export function nombreConNumero(archivo) {
  if (archivo.autogenerado || !archivo.numero) return archivo.nombre;
  return `${String(archivo.numero).padStart(2, '0')}-${archivo.nombre}`;
}

export function archivosDescargables(punto) {
  return (punto.archivos || []).filter((a) => a.id && a.origen !== 'ordenDia' && !a.informativo);
}

export function puntosConAdjuntos(puntos) {
  return puntos.filter((p) => archivosDescargables(p).length > 0);
}

export const ID_CARPETA_ORDEN_DIA = 'orden-dia';

export function carpetasDeSesion(puntos, listaCerrada) {
  const carpetas = [];
  const conOrdenDia = listaCerrada && puntos.length > 0;
  if (conOrdenDia) {
    const archivos = puntos.flatMap((p) => (p.archivos || []).filter((a) => a.origen === 'ordenDia').map((archivo) => ({ archivo, puntoId: p.id })));
    carpetas.push({ id: ID_CARPETA_ORDEN_DIA, nombre: '01-Aprobación del orden del día', puntoId: null, archivos });
  }
  const desplazamiento = conOrdenDia ? 1 : 0;
  puntosConAdjuntos(puntos).forEach((punto, i) => {
    const numero = String(i + 1 + desplazamiento).padStart(2, '0');
    const resumen = punto.nombreCarpeta || (punto.contenido ? punto.contenido.slice(0, 35).trim() : 'Punto');
    carpetas.push({
      id: punto.id,
      nombre: nombreSeguro(`${numero}-${resumen}`),
      prefijo: `${numero}-`,
      renombrable: !punto.fijo,
      puntoId: punto.id,
      archivos: archivosDescargables(punto).map((archivo) => ({ archivo, puntoId: punto.id })),
    });
  });
  return carpetas;
}

export function contenidoDeNivel(carpeta, ruta) {
  const prefijo = ruta.length ? `${ruta.join('/')}/` : '';
  const subcarpetas = new Map();
  const archivos = [];
  carpeta.archivos.forEach((entrada) => {
    const rutaArchivo = entrada.archivo.ruta || '';
    if (rutaArchivo === ruta.join('/')) {
      archivos.push(entrada);
    } else if (`${rutaArchivo}/`.startsWith(prefijo) && rutaArchivo.length > prefijo.length - 1) {
      const siguiente = rutaArchivo.slice(prefijo.length).split('/')[0];
      subcarpetas.set(siguiente, (subcarpetas.get(siguiente) || 0) + 1);
    }
  });
  return {
    subcarpetas: [...subcarpetas.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es')),
    archivos,
  };
}
