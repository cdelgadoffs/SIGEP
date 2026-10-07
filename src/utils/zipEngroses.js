import { generarWordPuntoAcuerdo, nombreArchivoEngrose } from './puntoAcuerdo.js';
import { formDePunto } from './plantillasActa.js';
import { tituloPunto } from './puntos.js';

export async function generarZipEngroses({ sesion, tipoSesion = 'Ordinaria', puntos, plantillas, tiposBloque, textosActa, logo = null }) {
  if (puntos.length === 0) throw new Error('No hay engroses para descargar.');
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  const usados = new Set();

  for (const punto of puntos) {
    const resultado = await generarWordPuntoAcuerdo({
      punto: formDePunto(punto, plantillas, textosActa),
      plantillas,
      tiposBloque,
      logo,
      fecha: sesion.id,
      engrose: punto.engrose,
    });
    if (!resultado) continue;
    let nombre = nombreArchivoEngrose(tituloPunto(punto.numero));
    if (usados.has(nombre)) nombre = nombre.replace(/\.docx$/, `_${punto.id}.docx`);
    usados.add(nombre);
    zip.file(nombre, resultado.blob);
  }

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    nombreArchivo: `Engroses - Sesión ${tipoSesion} ${sesion.numeroSesion ?? ''}.zip`.replace(/\s+\.zip$/, '.zip'),
  };
}
