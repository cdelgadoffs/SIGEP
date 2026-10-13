import { nombreActaDeSesion, sesionOrdinariaAnterior } from './sesiones.js';

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
export const ID_CARPETA_ACTA_ANTERIOR = 'acta-anterior';

const PREFIJO_ACTA_EXTRAORDINARIA = 'acta-auto-';

function limpiarNombre(texto) {
  return texto.replace(/[\\/:*?"<>|]/g, '-').trim();
}

function entradasDe(punto) {
  return archivosDescargables(punto).map((archivo) => ({ archivo, puntoId: punto.id }));
}

export function carpetasDeSesion(puntos, sesion, sesiones = [], secciones = []) {
  if (puntos.length === 0) return [];
  const esOrdinaria = (sesion?.tipo ?? 'ordinaria') === 'ordinaria';
  const fijo = (clave) => puntos.find((p) => p.fijo && p.clave === clave);
  const ordenDia = fijo('orden-dia');
  const carpetas = [{
    id: ID_CARPETA_ORDEN_DIA,
    nombre: '01-Aprobación del orden del día',
    puntoId: null,
    puntoRef: ordenDia?.id ?? null,
    archivos: puntos.flatMap((p) => (p.archivos || []).filter((a) => a.origen === 'ordenDia').map((archivo) => ({ archivo, puntoId: p.id }))),
  }];
  const reservadas = new Set(['orden-dia']);
  if (esOrdinaria) {
    const actaAnterior = fijo('acta-anterior');
    carpetas.push({
      id: ID_CARPETA_ACTA_ANTERIOR,
      nombre: limpiarNombre(`02-${nombreActaDeSesion(sesion ? sesionOrdinariaAnterior(sesiones, sesion.id) : null)}`),
      puntoId: null,
      puntoRef: actaAnterior?.id ?? null,
      archivos: actaAnterior ? entradasDe(actaAnterior) : [],
    });
    reservadas.add('acta-anterior');
  }
  puntos
    .filter((p) => !(p.fijo && reservadas.has(p.clave)) && archivosDescargables(p).length > 0)
    .forEach((punto, i) => {
      const numero = String(i + 1 + reservadas.size).padStart(2, '0');
      const esActaExtraordinaria = punto.fijo && punto.clave?.startsWith(PREFIJO_ACTA_EXTRAORDINARIA);
      const resumen = punto.nombreCarpeta || (secciones.find((x) => x.id === punto.seccion)?.requiereAcuerdo === false ? 'Informe' : 'Proyecto de acuerdo');
      carpetas.push({
        id: punto.id,
        nombre: esActaExtraordinaria
          ? limpiarNombre(`${numero}-${nombreActaDeSesion(sesiones.find((s) => s.id === punto.clave.slice(PREFIJO_ACTA_EXTRAORDINARIA.length)))}`)
          : nombreSeguro(`${numero}-${resumen}`),
        prefijo: `${numero}-`,
        renombrable: !punto.fijo,
        puntoId: punto.id,
        puntoRef: punto.id,
        archivos: entradasDe(punto),
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
