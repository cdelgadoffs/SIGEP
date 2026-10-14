import { MESES } from './meses.js';
import { horaDeISO } from './fechas.js';
import { numeroALetras } from './numerosEnLetras.js';
import { docDesdeTexto } from './documento.js';
import { nombreTipoSesion } from './sesiones.js';

const FUENTE = { size: 24, color: '000000', font: 'Arial' };
const INTERLINEADO = { line: 276, lineRule: 'auto' };
const SANGRIA = 720;
const ENTRE_PARRAFOS = 120;

const FORMATOS = {
  intro: { primera: { firstLine: SANGRIA }, resto: { firstLine: SANGRIA }, antes: 0, despues: 300, linea: INTERLINEADO },
  contenido: { primera: { left: SANGRIA, hanging: 360 }, resto: { left: SANGRIA }, antes: 160, despues: 240 },
  confidencial: { primera: { left: SANGRIA, hanging: 360 }, resto: { left: SANGRIA }, antes: 160, despues: 240 },
  votacion: { primera: { left: SANGRIA }, resto: { left: SANGRIA }, antes: 0, linea: { line: 360, lineRule: 'auto' } },
  acuerdo: { primera: { left: SANGRIA }, resto: { left: SANGRIA }, antes: 0, despues: 280 },
  anexo: { primera: { left: SANGRIA }, resto: { left: SANGRIA }, antes: 0, despues: 280 },
  cierre: { primera: { left: SANGRIA }, resto: { left: SANGRIA }, antes: 280, despues: 0, linea: INTERLINEADO },
};

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

export function tituloActa({ sesion, tipoSesion = 'Ordinaria' }) {
  const { dia, mes, anio } = fechaDeSesion(sesion.id);
  const fechaMayuscula = `${dia} DE ${mes} DE ${anio}`;
  const tituloSesion = sesion.numeroSesion
    ? `SESIÓN ${tipoSesion.toUpperCase()} NÚMERO ${numeroALetras(sesion.numeroSesion)}`
    : 'ACTA DE SESIÓN';
  return {
    texto: `ACTA DE LA ${tituloSesion} DEL PLENO DEL ÓRGANO DE ADMINISTRACIÓN JUDICIAL CORRESPONDIENTE AL DÍA ${fechaMayuscula}`,
    nombreArchivo: `Acta - ${tituloSesion}.docx`,
    fechaMinuscula: fechaMayuscula.toLowerCase(),
  };
}

export function construirBloquesActa({ sesion, tipoSesion = 'Ordinaria', puntos, secciones, asistentes = [] }) {
  const { fechaMinuscula } = tituloActa({ sesion, tipoSesion });
  const excluidas = new Set(secciones.filter((s) => s.excluidaDelActa).map((s) => s.id));
  const incluidos = puntos.filter((p) => !p.encabezado && !excluidas.has(p.seccion));
  if (incluidos.length === 0) return [];

  const bloques = [{ clave: 'intro', tipo: 'intro', titulo: 'Introducción', texto: textoIntroduccion({ sesion, tipoSesion, fechaMinuscula, asistentes }) }];
  incluidos.forEach((punto, i) => {
    const n = i + 1;
    const base = `punto_${punto.id}`;
    const identificador = `${n}. PLE./${String(n).padStart(3, '0')}.- `;
    if (punto.confidencial) {
      bloques.push({ clave: `${base}_contenido`, tipo: 'confidencial', titulo: `Punto ${n}`, identificador, puntoId: punto.id, texto: 'CONFIDENCIAL', bloqueado: true });
      return;
    }
    const esOrdenDia = punto.id.endsWith(':orden-dia');
    const contenido = esOrdenDia
      ? `Se somete a consideración el orden del día de la sesión ${tipoSesion.toLowerCase()} de ${fechaMinuscula}, con ${numeroALetras(incluidos.length).toLowerCase()} puntos.`
      : punto.contenido || '';
    bloques.push({ clave: `${base}_contenido`, tipo: 'contenido', titulo: `Punto ${n}`, identificador, puntoId: punto.id, texto: contenido });
    const conAcuerdoAparte = (punto.acuerdoLineas || []).length > 1;
    if (punto.textoVotacion) bloques.push({ clave: `${base}_votacion`, tipo: 'votacion', titulo: `Punto ${n} · Votación`, puntoId: punto.id, texto: punto.textoVotacion, conAcuerdoAparte });
    if (conAcuerdoAparte) bloques.push({ clave: `${base}_acuerdo`, tipo: 'acuerdo', titulo: `Punto ${n} · Acuerdo`, puntoId: punto.id, lineas: punto.acuerdoLineas });
    bloques.push({ clave: `${base}_anexo`, tipo: 'anexo', titulo: `Punto ${n} · Anexo`, puntoId: punto.id, texto: `La documentación relativa a este punto se agrega al apéndice como Anexo ${n}.` });
  });
  bloques.push({ clave: 'cierre', tipo: 'cierre', titulo: 'Cierre', texto: textoCierre(sesion) });
  return bloques;
}

export function bloquesDeSesion({ sesion, puntos, secciones }) {
  return construirBloquesActa({ sesion, tipoSesion: nombreTipoSesion(sesion.tipo), puntos, secciones, asistentes: sesion.asistentes ?? [] });
}

export function docAutomaticoDeBloque(bloque) {
  if (bloque.tipo === 'acuerdo') {
    return {
      type: 'doc',
      content: bloque.lineas.flatMap((linea) => {
        const [primera, ...continuaciones] = linea.texto.split('\n').filter((t) => t.trim() !== '');
        return [
          {
            type: 'paragraph',
            content: [
              { type: 'text', text: `${linea.prefijo}. `, marks: [{ type: 'bold' }] },
              ...(primera ? [{ type: 'text', text: primera }] : []),
            ],
          },
          ...continuaciones.map((texto) => ({ type: 'paragraph', attrs: { continuacion: true }, content: [{ type: 'text', text: texto }] })),
        ];
      }),
    };
  }
  return docDesdeTexto(bloque.texto);
}

export function docDeBloque(bloque, editados) {
  return editados?.[bloque.clave] ?? docAutomaticoDeBloque(bloque);
}

function tamanoDeFuente(marcas) {
  const marca = (marcas || []).find((m) => m.type === 'fontSize');
  const px = marca ? parseFloat(marca.attrs?.size) : NaN;
  return Number.isFinite(px) ? Math.round(px * 1.5) : FUENTE.size;
}

export async function generarWordActa({ sesion, tipoSesion = 'Ordinaria', puntos, secciones, asistentes, logo = null }) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header, Footer, PageNumber, Table, TableRow, TableCell, WidthType,
  } = await import('docx');

  const ALINEACION = {
    left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED,
  };
  const corrida = (text, extra = {}) => new TextRun({ text, ...FUENTE, ...extra });
  const sangriaDe = (nodo) => (nodo.attrs?.sangria || 0) * SANGRIA;
  const tieneTexto = (nodo) => (nodo.content || []).some((h) => h.type === 'text' && (h.text || '').trim() !== '');

  function runsDeParrafo(nodo, negrita = false) {
    return (nodo.content || []).map((h) => {
      if (h.type === 'hardBreak') return new TextRun({ break: 1, ...FUENTE });
      const marcas = h.marks || [];
      return corrida(h.text || '', {
        bold: negrita || marcas.some((m) => m.type === 'bold'),
        italics: marcas.some((m) => m.type === 'italic'),
        size: tamanoDeFuente(marcas),
      });
    });
  }

  function tablaDeNodo(nodo) {
    const filas = (nodo.content || []).map((fila) => new TableRow({
      children: (fila.content || []).map((celda) => {
        const parrafos = (celda.content || []).filter((n) => n.type === 'paragraph').map((n) => new Paragraph({
          alignment: ALINEACION[n.attrs?.textAlign] ?? AlignmentType.CENTER,
          children: runsDeParrafo(n, celda.type === 'tableHeader'),
        }));
        return new TableCell({ children: parrafos.length ? parrafos : [new Paragraph({ children: [] })] });
      }),
    }));
    return new Table({ rows: filas, width: { size: 100, type: WidthType.PERCENTAGE } });
  }

  function piezasDeDoc(doc) {
    const piezas = [];
    ((doc && doc.content) || []).forEach((nodo) => {
      if (nodo.type === 'paragraph') {
        if (tieneTexto(nodo)) piezas.push({ alineacion: ALINEACION[nodo.attrs?.textAlign] ?? AlignmentType.JUSTIFIED, sangria: sangriaDe(nodo), continuacion: !!nodo.attrs?.continuacion, runs: runsDeParrafo(nodo) });
      } else if (nodo.type === 'orderedList' || nodo.type === 'bulletList') {
        let n = 0;
        (nodo.content || []).forEach((li) => {
          (li.content || []).filter((p) => p.type === 'paragraph' && tieneTexto(p)).forEach((p) => {
            n += 1;
            piezas.push({ alineacion: AlignmentType.JUSTIFIED, sangria: 400 + sangriaDe(p), runs: [corrida(nodo.type === 'orderedList' ? `${n}. ` : '• '), ...runsDeParrafo(p)] });
          });
        });
      } else if (nodo.type === 'table') {
        piezas.push({ tabla: tablaDeNodo(nodo) });
      }
    });
    return piezas;
  }

  function parrafosDeBloque(bloque, doc) {
    const formato = FORMATOS[bloque.tipo];
    const despues = bloque.tipo === 'votacion' ? (bloque.conAcuerdoAparte ? 120 : 280) : formato.despues;
    const piezas = piezasDeDoc(doc);
    if (bloque.identificador && (piezas.length === 0 || piezas[0].tabla)) piezas.unshift({ alineacion: AlignmentType.JUSTIFIED, sangria: 0, runs: [] });
    const resultado = [];
    piezas.forEach((pieza, i) => {
      if (pieza.tabla) {
        resultado.push(pieza.tabla);
        return;
      }
      const esPrimera = i === 0;
      const esUltima = i === piezas.length - 1;
      const runs = esPrimera && bloque.identificador ? [corrida(bloque.identificador, { bold: true }), ...pieza.runs] : pieza.runs;
      const indentacion = { ...(esPrimera ? formato.primera : formato.resto) };
      if (pieza.sangria) indentacion.left = (indentacion.left || 0) + pieza.sangria;
      resultado.push(new Paragraph({
        alignment: pieza.alineacion,
        indent: indentacion,
        spacing: { ...(formato.linea || {}), before: esPrimera ? formato.antes : 0, after: esUltima ? despues : piezas[i + 1]?.continuacion ? 0 : ENTRE_PARRAFOS },
        children: runs,
      }));
    });
    return resultado;
  }

  const bloques = construirBloquesActa({ sesion, tipoSesion, puntos, secciones, asistentes });
  if (bloques.length === 0) throw new Error('No hay puntos para generar el acta.');
  const titulo = tituloActa({ sesion, tipoSesion });

  const parrafos = [
    new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { ...INTERLINEADO, after: 500 },
      children: [corrida(titulo.texto, { bold: true, size: 28 })],
    }),
    ...bloques.flatMap((bloque) => parrafosDeBloque(bloque, docDeBloque(bloque, sesion.actaBloques))),
  ];

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

  return { blob: await Packer.toBlob(documento), nombreArchivo: titulo.nombreArchivo };
}
