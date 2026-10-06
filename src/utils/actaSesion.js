import { MESES } from './meses.js';
import { horaDeISO } from './fechas.js';
import { numeroALetras } from './numerosEnLetras.js';

const FUENTE = { size: 24, color: '000000', font: 'Arial' };
const INTERLINEADO = { line: 276, lineRule: 'auto' };
const SANGRIA = 720;

function fechaDeSesion(id) {
  const fecha = new Date(id + 'T00:00:00');
  return {
    dia: numeroALetras(fecha.getDate()),
    mes: MESES[fecha.getMonth()].toUpperCase(),
    anio: numeroALetras(fecha.getFullYear()),
  };
}

function nombreConTratamiento(asistente) {
  const titulo = (asistente.tratamiento || '').replace(/^(el|la)\s+/i, '');
  return `${titulo} ${asistente.nombre}`.trim();
}

function textoIntroduccion({ sesion, tipoSesion, fechaMinuscula, asistentes }) {
  const hora = sesion.horaInicio ? horaDeISO(sesion.horaInicio) : '<<hora>>';
  const presentes = asistentes.filter((a) => a.presente);
  const presidente = presentes.find((a) => a.presidente);
  const nombres = [
    ...presentes.filter((a) => !a.presidente).map(nombreConTratamiento),
    presidente ? `y el Presidente ${nombreConTratamiento(presidente)}` : '',
  ].filter(Boolean).join(', ');
  return `En la Ciudad de México, siendo las ${hora} horas del ${fechaMinuscula}, se reúnen de manera presencial en el salón del Pleno del Órgano de Administración Judicial para celebrar la sesión ${tipoSesion.toLowerCase()} convocada por las y los integrantes: ${nombres || '<<integrantes>>'}; con lo cual se da cuenta sobre la adopción de las siguientes determinaciones:`;
}

function textoCierre(sesion) {
  const hora = sesion.horaFin ? horaDeISO(sesion.horaFin) : (sesion.horaInicio ? horaDeISO(sesion.horaInicio) : '<<hora>>');
  return `No habiendo otro asunto que tratar, se da por concluida la sesión a las ${hora} horas del día de su fecha, firmando al calce el Presidente del Órgano de Administración Judicial y la persona titular de la Secretaría Ejecutiva del Pleno, de conformidad con lo dispuesto en el artículo 91 de la Ley Orgánica del Poder Judicial de la Federación.`;
}

function bloquesDePuntos({ puntos, secciones, tipoSesion, fechaMinuscula }) {
  const excluidas = new Set(secciones.filter((s) => s.excluidaDelActa).map((s) => s.id));
  const incluidos = puntos.filter((p) => !p.encabezado && !excluidas.has(p.seccion));
  const bloques = [];
  incluidos.forEach((punto, i) => {
    const n = i + 1;
    const identificador = `${n}. PLE./${String(n).padStart(3, '0')}.- `;
    if (punto.confidencial) {
      bloques.push({ tipo: 'confidencial', identificador, texto: 'CONFIDENCIAL' });
      return;
    }
    const esOrdenDia = punto.id.endsWith(':orden-dia');
    const contenido = esOrdenDia
      ? `Se somete a consideración el orden del día de la sesión ${tipoSesion.toLowerCase()} de ${fechaMinuscula}, con ${numeroALetras(incluidos.length).toLowerCase()} puntos.`
      : punto.contenido || '';
    bloques.push({ tipo: 'contenido', identificador, texto: contenido });
    const conAcuerdoAparte = (punto.acuerdoLineas || []).length > 1;
    if (punto.textoVotacion) bloques.push({ tipo: 'votacion', texto: punto.textoVotacion, conAcuerdoAparte });
    if (conAcuerdoAparte) bloques.push({ tipo: 'acuerdo', lineas: punto.acuerdoLineas });
    bloques.push({ tipo: 'anexo', texto: `La documentación relativa a este punto se agrega al apéndice como Anexo ${n}.` });
  });
  return bloques;
}

export async function generarWordActa({ sesion, tipoSesion = 'Ordinaria', puntos, secciones, asistentes, logo = null }) {
  const { Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header, Footer, PageNumber } = await import('docx');

  const corrida = (text, extra = {}) => new TextRun({ text, ...FUENTE, ...extra });
  const { dia, mes, anio } = fechaDeSesion(sesion.id);
  const fechaMayuscula = `${dia} DE ${mes} DE ${anio}`;
  const fechaMinuscula = fechaMayuscula.toLowerCase();
  const tituloSesion = sesion.numeroSesion
    ? `SESIÓN ${tipoSesion.toUpperCase()} NÚMERO ${numeroALetras(sesion.numeroSesion)}`
    : 'ACTA DE SESIÓN';

  const bloques = bloquesDePuntos({ puntos, secciones, tipoSesion, fechaMinuscula });
  if (bloques.length === 0) throw new Error('No hay puntos para generar el acta.');

  const parrafos = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { ...INTERLINEADO, after: 500 },
      children: [corrida(`ACTA DE LA ${tituloSesion} DEL PLENO DEL ÓRGANO DE ADMINISTRACIÓN JUDICIAL CORRESPONDIENTE AL DÍA ${fechaMayuscula}`, { bold: true, size: 28 })],
    }),
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { ...INTERLINEADO, before: 0, after: 300 },
      indent: { firstLine: SANGRIA },
      children: [corrida(textoIntroduccion({ sesion, tipoSesion, fechaMinuscula, asistentes }))],
    }),
  ];

  bloques.forEach((bloque) => {
    switch (bloque.tipo) {
      case 'confidencial':
      case 'contenido':
        parrafos.push(new Paragraph({
          indent: { left: SANGRIA, hanging: 360 },
          spacing: { before: 160, after: 240 },
          alignment: AlignmentType.JUSTIFIED,
          children: [
            corrida(bloque.identificador, { bold: true }),
            corrida(bloque.texto, { bold: bloque.tipo === 'confidencial' }),
          ],
        }));
        break;
      case 'votacion':
        parrafos.push(new Paragraph({
          indent: { left: SANGRIA },
          spacing: { before: 0, after: bloque.conAcuerdoAparte ? 120 : 280, line: 360, lineRule: 'auto' },
          alignment: AlignmentType.JUSTIFIED,
          children: [corrida(bloque.texto)],
        }));
        break;
      case 'acuerdo':
        bloque.lineas.forEach((linea, i) => parrafos.push(new Paragraph({
          indent: { left: SANGRIA },
          spacing: { before: 0, after: i === bloque.lineas.length - 1 ? 280 : 120 },
          alignment: AlignmentType.JUSTIFIED,
          children: [corrida(`${linea.prefijo}. `, { bold: true }), corrida(linea.texto)],
        })));
        break;
      case 'anexo':
        parrafos.push(new Paragraph({
          indent: { left: SANGRIA },
          spacing: { before: 0, after: 280 },
          alignment: AlignmentType.JUSTIFIED,
          children: [corrida(bloque.texto)],
        }));
        break;
      default:
        break;
    }
  });

  parrafos.push(new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { ...INTERLINEADO, before: 280, after: 0 },
    indent: { left: SANGRIA },
    children: [corrida(textoCierre(sesion))],
  }));

  const encabezado = logo
    ? [new Paragraph({
      alignment: AlignmentType.LEFT,
      children: [new ImageRun({
        data: logo.data,
        transformation: { width: 120, height: Math.round(120 / (logo.width / logo.height)) },
        type: 'png',
      })],
    })]
    : [];

  const documento = new Document({
    sections: [{
      properties: {},
      headers: { default: new Header({ children: encabezado }) },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.RIGHT,
            children: [new TextRun({ children: [PageNumber.CURRENT], bold: true, size: 20, color: '000000', font: 'Arial' })],
          })],
        }),
      },
      children: parrafos,
    }],
  });

  return { blob: await Packer.toBlob(documento), nombreArchivo: `Acta - ${tituloSesion}.docx` };
}
