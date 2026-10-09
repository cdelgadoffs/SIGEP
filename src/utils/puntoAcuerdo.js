import { itemsDeNivelSuperior, prefijoOrdinal } from './ordinales.js';
import { esDocVacio } from './documento.js';

const BASE = { size: 24, color: '000000', font: 'Arial' };
const ANCHO_LOGO = 100;

export function nombreArchivoPuntoAcuerdo(codigo, numeroArchivo = 1) {
  return `${String(numeroArchivo).padStart(2, '0')}-Punto de acuerdo_${(codigo || '').replace(/\//g, '')}.docx`;
}

export function nombreArchivoEngrose(codigo) {
  return `ENGROSE_${(codigo || '').replace(/\//g, '')}.docx`;
}

function tamanoDeFuente(marcas) {
  const marca = (marcas || []).find((m) => m.type === 'fontSize');
  const px = marca ? parseFloat(marca.attrs?.size) : NaN;
  return Number.isFinite(px) ? Math.round(px * 1.5) : BASE.size;
}

export async function generarWordPuntoAcuerdo({ punto, plantillas, tiposBloque, logo = null, fecha = '', engrose = null }) {
  const {
    Document, Packer, Paragraph, TextRun, AlignmentType, ImageRun, Header, Footer, PageNumber, Table, TableRow, TableCell, WidthType,
  } = await import('docx');

  const ALINEACION = {
    left: AlignmentType.LEFT, center: AlignmentType.CENTER, right: AlignmentType.RIGHT, justify: AlignmentType.JUSTIFIED,
  };

  const corrida = (text, extra = {}) => new TextRun({ text, ...BASE, ...extra });

  function runsDeParrafo(nodo, { mayusculas = false, negrita = false } = {}) {
    return (nodo.content || []).map((h) => {
      if (h.type === 'hardBreak') return new TextRun({ break: 1, ...BASE });
      const marcas = h.marks || [];
      const texto = mayusculas ? (h.text || '').toUpperCase() : (h.text || '');
      return corrida(texto, {
        bold: negrita || marcas.some((m) => m.type === 'bold'),
        italics: marcas.some((m) => m.type === 'italic'),
        size: tamanoDeFuente(marcas),
      });
    });
  }

  const tieneTexto = (nodo) => (nodo.content || []).some((h) => h.type === 'text' && (h.text || '').trim() !== '');

  function tablaDeNodo(nodo) {
    const filas = (nodo.content || []).map((fila) => new TableRow({
      children: (fila.content || []).map((celda) => {
        const esEncabezado = celda.type === 'tableHeader';
        const parrafos = (celda.content || []).filter((n) => n.type === 'paragraph').map((n) => new Paragraph({
          alignment: ALINEACION[n.attrs?.textAlign] ?? AlignmentType.CENTER,
          children: runsDeParrafo(n, { negrita: esEncabezado }),
        }));
        return new TableCell({ children: parrafos.length ? parrafos : [new Paragraph({ children: [] })] });
      }),
    }));
    return new Table({ rows: filas, width: { size: 100, type: WidthType.PERCENTAGE } });
  }

  function piezasDeDoc(doc, { prefijos = null, mayusculas = false, negrita = false } = {}) {
    const items = prefijos ? itemsDeNivelSuperior(doc) : [];
    const piezas = [];
    ((doc && doc.content) || []).forEach((nodo, indice) => {
      if (nodo.type === 'paragraph') {
        if (!tieneTexto(nodo)) return;
        const runs = runsDeParrafo(nodo, { mayusculas, negrita });
        const k = items.findIndex((it) => it.indice === indice);
        if (prefijos && k >= 0) { const desde = prefijos.desde || 0; runs.unshift(corrida(`${prefijoOrdinal(desde + k, desde + items.length, prefijos.sinUnico)}. `, { bold: true })); }
        piezas.push({ alineacion: ALINEACION[nodo.attrs?.textAlign] ?? AlignmentType.JUSTIFIED, runs });
      } else if (nodo.type === 'orderedList') {
        let n = 0;
        (nodo.content || []).forEach((li) => {
          (li.content || []).filter((p) => p.type === 'paragraph' && tieneTexto(p)).forEach((p) => {
            n += 1;
            piezas.push({ alineacion: AlignmentType.JUSTIFIED, sangria: 400, runs: [corrida(`${n}. `), ...runsDeParrafo(p, { mayusculas, negrita })] });
          });
        });
      } else if (nodo.type === 'table') {
        piezas.push({ tabla: tablaDeNodo(nodo) });
      }
    });
    return piezas;
  }

  function aParrafos(piezas, afterUltima = 200) {
    const resultado = [];
    piezas.forEach((pz, i) => {
      if (pz.tabla) {
        resultado.push(pz.tabla);
        if (i === piezas.length - 1) resultado.push(new Paragraph({ spacing: { after: afterUltima }, children: [] }));
        return;
      }
      resultado.push(new Paragraph({
        alignment: pz.alineacion,
        indent: pz.sangria ? { left: pz.sangria } : undefined,
        spacing: { after: i === piezas.length - 1 ? afterUltima : 120 },
        children: pz.runs,
      }));
    });
    return resultado;
  }

  const tituloCentrado = (texto) => new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 100, after: 160 },
    children: [corrida(texto, { bold: true })],
  });

  const plantilla = plantillas.find((p) => p.id === punto.plantilla) || plantillas[0];
  const orden = plantilla?.orden || ['contenido', 'acuerdo'];
  const hayAcuerdo = !esDocVacio(punto.acuerdoDoc);
  const parrafos = [];

  orden.forEach((seccion) => {
    if (seccion === 'intro') parrafos.push(...aParrafos(piezasDeDoc(punto.introDoc), 300));
    else if (seccion === 'puente') {
      parrafos.push(new Paragraph({ spacing: { after: 200 }, children: [corrida('')] }));
      parrafos.push(...aParrafos(piezasDeDoc(punto.puenteDoc), 200));
    } else if (seccion === 'bloques') {
      const bloques = punto.bloquesActa || [];
      const fijos = plantilla?.considerandosFijos ? (punto.considerandosFijos || []).filter((c) => !esDocVacio(c.doc)) : [];
      const anfitrion = bloques.find((b) => b.tipo === 'considerando');
      const totalFijos = fijos.reduce((n, c) => n + itemsDeNivelSuperior(c.doc).length, 0);
      const escribirFijos = () => {
        let desde = 0;
        fijos.forEach((c) => {
          parrafos.push(...aParrafos(piezasDeDoc(c.doc, { prefijos: { sinUnico: true, desde } }), 120));
          desde += itemsDeNivelSuperior(c.doc).length;
        });
      };
      if (fijos.length > 0 && !anfitrion) {
        parrafos.push(tituloCentrado(tiposBloque.find((t) => t.id === 'considerando')?.titulo ?? 'CONSIDERANDO'));
        escribirFijos();
      }
      bloques.forEach((bloque) => {
        const alojaFijos = fijos.length > 0 && bloque === anfitrion;
        if (esDocVacio(bloque.doc) && !alojaFijos) return;
        const tipo = tiposBloque.find((t) => t.id === bloque.tipo);
        parrafos.push(tituloCentrado(tipo?.titulo ?? bloque.titulo ?? 'SECCIÓN'));
        if (alojaFijos) escribirFijos();
        parrafos.push(...aParrafos(piezasDeDoc(bloque.doc, { prefijos: { sinUnico: true, desde: alojaFijos ? totalFijos : 0 } }), 300));
      });
    } else if (seccion === 'contenido') {
      if (!esDocVacio(punto.contenidoDoc)) {
        parrafos.push(...aParrafos(piezasDeDoc(punto.contenidoDoc, { mayusculas: true, negrita: true }), 300));
      }
    } else if (seccion === 'tituloAcuerdo') {
      if (hayAcuerdo) parrafos.push(tituloCentrado('ACUERDO'));
    } else if (seccion === 'acuerdo') {
      if (hayAcuerdo) parrafos.push(...aParrafos(piezasDeDoc(punto.acuerdoDoc, { prefijos: { sinUnico: false } }), 200));
    }
  });

  if (engrose) {
    parrafos.push(new Paragraph({
      alignment: AlignmentType.JUSTIFIED,
      spacing: { before: 300, after: 0 },
      children: [corrida(engrose.parrafo)],
    }));
    for (let i = 0; i < 5; i += 1) parrafos.push(new Paragraph({ children: [corrida('')] }));
    const firma = (f, sinEspacioPrevio) => [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { before: sinEspacioPrevio ? 0 : 500, after: 40 }, children: [corrida('_______________________________', { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 20 }, children: [corrida(f.nombre, { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 0 }, children: [corrida(f.cargo1, { bold: true })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 200 }, children: [corrida(f.cargo2, { bold: true })] }),
    ];
    parrafos.push(...firma(engrose.firmaPresidente, true), ...firma(engrose.firmaSecretario, false));
  }

  if (parrafos.length === 0) return null;

  const header = logo && logo.width > 0 && logo.height > 0
    ? new Header({
        children: [new Paragraph({
          alignment: AlignmentType.LEFT,
          children: [new ImageRun({
            data: logo.data,
            transformation: { width: ANCHO_LOGO, height: Math.round(ANCHO_LOGO / (logo.width / logo.height)) },
            type: 'png',
          })],
        })],
      })
    : undefined;

  const footer = new Footer({
    children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ children: [PageNumber.CURRENT], size: 20, color: '000000', font: 'Arial' })] })],
  });

  const doc = new Document({
    styles: { default: { document: { paragraph: { spacing: { line: 276, lineRule: 'auto' } } } } },
    sections: [{ properties: {}, headers: header ? { default: header } : undefined, footers: { default: footer }, children: parrafos }],
  });
  const blob = await Packer.toBlob(doc);
  return { blob, nombreArchivo: `Punto de acuerdo${fecha ? ` ${fecha}` : ''}.docx` };
}
