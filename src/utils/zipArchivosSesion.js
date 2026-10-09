import { generarWordOrdenDia } from './ordenDia.js';

function nombreSeguro(texto) {
  return (texto || 'Sin nombre').replace(/[\\/:*?"<>|]/g, '-').slice(0, 60).trim();
}

function nombreUnico(nombre, usados) {
  if (!usados.has(nombre)) {
    usados.add(nombre);
    return nombre;
  }
  const punto = nombre.lastIndexOf('.');
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  const extension = punto > 0 ? nombre.slice(punto) : '';
  let contador = 2;
  while (usados.has(`${base} (${contador})${extension}`)) contador += 1;
  const nuevo = `${base} (${contador})${extension}`;
  usados.add(nuevo);
  return nuevo;
}

function nombreConNumero(archivo) {
  if (archivo.autogenerado || !archivo.numero) return archivo.nombre;
  return `${String(archivo.numero).padStart(2, '0')}-${archivo.nombre}`;
}

export function archivosDescargables(punto) {
  return (punto.archivos || []).filter((a) => a.id && a.origen !== 'ordenDia' && !a.informativo);
}

export function puntosConAdjuntos(puntos) {
  return puntos.filter((p) => archivosDescargables(p).length > 0);
}

export async function generarZipArchivosSesion({ sesion, tipoSesion = 'Ordinaria', puntos, secciones, listaCerrada, binarios }) {
  const conAdjuntos = puntosConAdjuntos(puntos);
  const conOrdenDia = listaCerrada && puntos.length > 0;
  if (conAdjuntos.length === 0 && !conOrdenDia) throw new Error('No hay archivos adjuntos en esta sesión.');

  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();

  if (conOrdenDia) {
    const { blob, nombreArchivo } = await generarWordOrdenDia({ sesion, tipoSesion, puntos, secciones });
    zip.folder('01-Aprobación del orden del día').file(nombreArchivo, blob);
  }

  const desplazamiento = conOrdenDia ? 1 : 0;
  conAdjuntos.forEach((punto, i) => {
    const numero = String(i + 1 + desplazamiento).padStart(2, '0');
    const resumen = punto.contenido ? punto.contenido.slice(0, 35).trim() : 'Punto';
    const carpeta = zip.folder(nombreSeguro(`${numero}-${resumen}`));
    const usados = new Set();
    archivosDescargables(punto).filter((a) => binarios.has(a.id)).forEach((archivo) => {
      carpeta.file(nombreUnico(`${archivo.ruta ? `${archivo.ruta}/` : ''}${nombreConNumero(archivo)}`, usados), binarios.get(archivo.id));
    });
  });

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    nombreArchivo: `Archivos - Sesión ${tipoSesion} ${sesion.numeroSesion ?? ''}.zip`.replace(/\s+\.zip$/, '.zip'),
  };
}
