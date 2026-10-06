import { docDesdeTexto, docVacio } from './documento.js';

export function nuevoIdBloque() {
  return 'blq_' + crypto.randomUUID();
}

function textoActa(textosActa, id) {
  return (textosActa || []).find((t) => t.id === id);
}

export function contenidoPorOmision(textosActa, esInforme) {
  const texto = textoActa(textosActa, esInforme ? 'contenidoInforme' : 'contenido');
  return texto ? docDesdeTexto(texto.texto) : docVacio();
}

function bloquesVacios(plantilla) {
  return (plantilla?.bloques || []).map((tipo) => ({ id: nuevoIdBloque(), tipo, doc: docVacio() }));
}

export function hojaPorOmision(plantillasActa, textosActa, plantillaId) {
  const plantilla = (plantillasActa || []).find((x) => x.id === plantillaId) || (plantillasActa || [])[0];
  const intro = textoActa(textosActa, 'intro');
  const introContenido = [];
  if (intro?.negrita) introContenido.push({ type: 'text', text: intro.negrita, marks: [{ type: 'bold' }] });
  if (intro?.texto) introContenido.push({ type: 'text', text: intro.texto });
  return {
    plantilla: plantilla?.id ?? '',
    introDoc: introContenido.length ? { type: 'doc', content: [{ type: 'paragraph', content: introContenido }] } : docVacio(),
    puenteDoc: docDesdeTexto(textoActa(textosActa, 'puente')?.texto),
    bloquesActa: bloquesVacios(plantilla),
  };
}

export function bloquesParaPlantilla(plantilla, bloques) {
  const tipos = plantilla?.bloques || [];
  const ordenados = tipos.map((tipo) => bloques.find((b) => b.tipo === tipo) || { id: nuevoIdBloque(), tipo, doc: docVacio() });
  const personalizados = bloques.filter((b) => b.tipo === 'personalizada');
  return [...ordenados, ...personalizados];
}

export function tiposBloqueDisponibles(tiposBloque, bloques) {
  const libres = tiposBloque.filter((t) => t.titulo !== null && !bloques.some((b) => b.tipo === t.id));
  const personalizada = tiposBloque.find((t) => t.titulo === null);
  return personalizada ? [...libres, personalizada] : libres;
}
