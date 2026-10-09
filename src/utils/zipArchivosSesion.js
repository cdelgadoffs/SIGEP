import { generarWordOrdenDia } from './ordenDia.js';
import { carpetasDeSesion, ID_CARPETA_ORDEN_DIA, nombreConNumero, puntosConAdjuntos } from './arbolArchivos.js';

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

  carpetasDeSesion(puntos, listaCerrada).filter((c) => c.id !== ID_CARPETA_ORDEN_DIA).forEach((c) => {
    const carpeta = zip.folder(c.nombre);
    const usados = new Set();
    c.archivos.filter(({ archivo }) => binarios.has(archivo.id)).forEach(({ archivo }) => {
      carpeta.file(nombreUnico(`${archivo.ruta ? `${archivo.ruta}/` : ''}${nombreConNumero(archivo)}`, usados), binarios.get(archivo.id));
    });
  });

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    nombreArchivo: `Archivos - Sesión ${tipoSesion} ${sesion.numeroSesion ?? ''}.zip`.replace(/\s+\.zip$/, '.zip'),
  };
}
