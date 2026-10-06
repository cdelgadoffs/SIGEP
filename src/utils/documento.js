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

function sinValoresPorOmision(clave, valor) {
  if (clave === 'textAlign' && (valor === 'left' || valor === null)) return undefined;
  if (clave === 'attrs' && valor && typeof valor === 'object' && Object.keys(valor).every((k) => valor[k] === undefined || (k === 'textAlign' && (valor[k] === 'left' || valor[k] === null)))) return undefined;
  return valor;
}

export function claveDeDoc(doc) {
  return JSON.stringify(doc, sinValoresPorOmision);
}

export function docsEquivalentes(a, b) {
  return claveDeDoc(a) === claveDeDoc(b);
}
