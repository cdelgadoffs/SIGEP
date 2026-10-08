import { generarWordPuntoAcuerdo, nombreArchivoPuntoAcuerdo } from './puntoAcuerdo.js';
import { generarWordOrdenDia } from './ordenDia.js';
import { generarWordActa } from './actaSesion.js';
import { formDePunto } from './plantillasActa.js';
import { tituloPunto } from './puntos.js';
import { nombreTipoSesion } from './sesiones.js';

const MIME_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function esArchivoAutomatico(id) {
  return typeof id === 'string' && id.startsWith('auto:');
}

export function analizarIdAutomatico(id) {
  const [, origen, ...resto] = id.split(':');
  return { origen, clave: resto.join(':') };
}

export async function generarArchivoAutomatico(id, { punto, sesion, puntos, secciones, plantillas, tiposBloque, textosActa, asistentes, logo = null }) {
  const { origen } = analizarIdAutomatico(id);

  if (origen === 'punto') {
    const resultado = await generarWordPuntoAcuerdo({
      punto: formDePunto(punto, plantillas, textosActa),
      plantillas,
      tiposBloque,
      logo,
      fecha: punto.sesionId,
    });
    if (!resultado) throw new Error('El punto no tiene contenido para exportar.');
    return { nombre: nombreArchivoPuntoAcuerdo(tituloPunto(punto.numero), punto.archivos?.find((a) => a.id === id)?.numero ?? 1), tipo: MIME_WORD, blob: resultado.blob };
  }

  if (origen === 'ordenDia') {
    const { blob, nombreArchivo } = await generarWordOrdenDia({ sesion, tipoSesion: nombreTipoSesion(sesion.tipo), puntos, secciones });
    return { nombre: nombreArchivo, tipo: MIME_WORD, blob };
  }

  if (origen === 'acta') {
    const { blob, nombreArchivo } = await generarWordActa({ sesion, tipoSesion: nombreTipoSesion(sesion.tipo), puntos, secciones, asistentes, logo });
    return { nombre: nombreArchivo, tipo: MIME_WORD, blob };
  }

  throw new Error('Archivo automático desconocido.');
}
