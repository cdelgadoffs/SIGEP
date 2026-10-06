const ORDINALES = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO'];

export function prefijoOrdinal(indice, total, sinUnico = false) {
  if (total <= 1) return sinUnico ? 'PRIMERO' : 'ÚNICO';
  return ORDINALES[indice] ?? `DÉCIMO ${ORDINALES[indice - 10] ?? ''}`.trim();
}

function textoDeParrafo(n) {
  return (n.content || []).map((h) => (h.type === 'text' ? h.text || '' : h.type === 'hardBreak' ? ' ' : '')).join('');
}

export function itemsDeNivelSuperior(doc) {
  const items = [];
  ((doc && doc.content) || []).forEach((n, indice) => {
    if (n.type !== 'paragraph') return;
    const texto = textoDeParrafo(n);
    if (texto.trim() !== '') items.push({ indice, texto });
  });
  return items;
}
