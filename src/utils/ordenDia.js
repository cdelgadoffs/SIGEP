import { MESES } from './meses.js';

const DIAS_SEMANA = ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'];

const NUMERO_SANGRIA = 2160;
const TEXTO_SANGRIA = 2520;
const SANGRIA_TITULO = 2880;

const MARGEN_SUPERIOR = 1559;
const MARGEN_IZQUIERDO = 1077;
const MARGEN_INFERIOR = 1440;
const MARGEN_DERECHO = 1440;

const INTERLINEADO = { line: 276, lineRule: 'auto' };

function aplicarEspaciadoTexto(texto) {
  return texto.split(' ').map((palabra) => palabra.split('').join(' ')).join('  ');
}

function fechaEnLetras(fecha) {
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${dia} DE ${MESES[fecha.getMonth()].toUpperCase()} DE ${fecha.getFullYear()}`;
}

export async function generarWordOrdenDia({ sesion, tipoSesion = 'Ordinaria', puntos, secciones, hoy = new Date() }) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, UnderlineType } = await import('docx');

  const corrida = (text, extra = {}) => new TextRun({ text, size: 24, color: '000000', font: 'Arial', ...extra });
  const centrado = (text, spacing, extra = {}) => new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: SANGRIA_TITULO },
    spacing,
    children: [corrida(text, { bold: true, ...extra })],
  });
  const subrayado = { underline: { type: UnderlineType.SINGLE } };

  const fecha = new Date(sesion.id + 'T00:00:00');
  const fechaConDia = `${DIAS_SEMANA[fecha.getDay()]} ${fechaEnLetras(fecha)}`;
  const tituloBase = sesion.numeroSesion
    ? `SESIÓN ${tipoSesion.toUpperCase()} NÚMERO ${sesion.numeroSesion}`
    : 'PROYECTO DEL ORDEN DEL DÍA';

  const parrafos = [
    centrado(aplicarEspaciadoTexto(tituloBase), { before: 200, after: 200 }),
    centrado('PROYECTO DE ORDEN DEL DÍA', { ...INTERLINEADO, after: 0 }, subrayado),
    centrado('ÓRGANO DE ADMINISTRACIÓN JUDICIAL', { ...INTERLINEADO, after: 0 }, subrayado),
    centrado(fechaConDia, { ...INTERLINEADO, after: 300 }, subrayado),
  ];

  let primera = true;
  secciones.forEach((seccion) => {
    const delaSeccion = puntos.filter((p) => p.seccion === seccion.id);
    if (delaSeccion.length === 0) return;

    if (!seccion.sinTituloEnDocumento) {
      parrafos.push(new Paragraph({
        indent: { left: TEXTO_SANGRIA },
        spacing: { before: 280, after: 140 },
        children: [corrida(seccion.nombre.toUpperCase(), { bold: true })],
      }));
    } else if (primera) {
      parrafos.push(new Paragraph({ spacing: { before: 280, after: 140 } }));
    }
    primera = false;

    delaSeccion.forEach((punto) => {
      const texto = punto.confidencial ? 'CONFIDENCIAL' : (punto.contenido || '');
      parrafos.push(new Paragraph({
        indent: { left: TEXTO_SANGRIA, hanging: TEXTO_SANGRIA - NUMERO_SANGRIA },
        tabs: [{ type: 'left', position: TEXTO_SANGRIA }],
        spacing: { before: 160, after: 100 },
        alignment: AlignmentType.JUSTIFIED,
        children: [corrida(`${punto.numero}.\t`), corrida(texto)],
      }));
    });
  });

  parrafos.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 400 },
    children: [corrida(fechaEnLetras(hoy), { bold: true })],
  }));

  const documento = new Document({
    sections: [{
      properties: {
        page: {
          margin: { top: MARGEN_SUPERIOR, left: MARGEN_IZQUIERDO, bottom: MARGEN_INFERIOR, right: MARGEN_DERECHO },
        },
      },
      children: parrafos,
    }],
  });

  return { blob: await Packer.toBlob(documento), nombreArchivo: `Orden del dia - ${tituloBase}.docx` };
}
