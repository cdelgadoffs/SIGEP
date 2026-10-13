export function docVacio() {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function docDesdeTexto(texto) {
  const lineas = String(texto || '').split('\n').filter((l) => l.trim() !== '');
  if (lineas.length === 0) return docVacio();
  return { type: 'doc', content: lineas.map((l) => ({ type: 'paragraph', content: [{ type: 'text', text: l }] })) };
}

function textoDeNodo(n) {
  if (n.type === 'text') return n.text || '';
  if (n.type === 'hardBreak') return '\n';
  const hijos = (n.content || []).map(textoDeNodo);
  if (n.type === 'tableRow') return hijos.join('\t');
  if (n.type === 'paragraph') return hijos.join('');
  return hijos.filter((t) => t !== '').join('\n');
}

export function textoDeDoc(doc) {
  return doc ? textoDeNodo(doc) : '';
}

export function esDocVacio(doc) {
  return textoDeDoc(doc).trim() === '';
}

const ES_VALOR_POR_OMISION = {
  textAlign: (valor) => valor === 'left' || valor === null,
  sangria: (valor) => valor === 0 || valor === null,
  continuacion: (valor) => valor === false || valor === null,
};

function sinValoresPorOmision(clave, valor) {
  if (ES_VALOR_POR_OMISION[clave]?.(valor)) return undefined;
  if (clave === 'attrs' && valor && typeof valor === 'object' && Object.keys(valor).every((k) => valor[k] === undefined || ES_VALOR_POR_OMISION[k]?.(valor[k]))) return undefined;
  return valor;
}

export function claveDeDoc(doc) {
  return JSON.stringify(doc, sinValoresPorOmision);
}

export function docsEquivalentes(a, b) {
  return claveDeDoc(a) === claveDeDoc(b);
}
