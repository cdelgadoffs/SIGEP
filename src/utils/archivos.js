const TIPOS = [
  { extensiones: ['pdf'], icono: 'ri-file-pdf-2-line', tono: 'rojo' },
  { extensiones: ['doc', 'docx'], icono: 'ri-file-word-2-line', tono: 'azul' },
  { extensiones: ['xls', 'xlsx'], icono: 'ri-file-excel-2-line', tono: 'verde' },
  { extensiones: ['png', 'jpg', 'jpeg', 'gif', 'webp'], icono: 'ri-image-line', tono: 'morado' },
];

const GENERICO = { icono: 'ri-file-line', tono: 'gris' };

export function estiloArchivo(nombre) {
  const extension = String(nombre).split('.').pop().toLowerCase();
  const tipo = TIPOS.find((t) => t.extensiones.includes(extension));
  return tipo ? { icono: tipo.icono, tono: tipo.tono } : GENERICO;
}

export function guardarEnDisco(nombre, blob) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombre;
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const EXTENSIONES_IMAGEN = ['png', 'jpg', 'jpeg', 'gif', 'webp'];
const MIME_DOCX = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function tipoDeVistaPrevia(nombre, tipo = '') {
  const extension = String(nombre).split('.').pop().toLowerCase();
  if (tipo === MIME_DOCX || extension === 'docx') return 'word';
  if (tipo.startsWith('image/') || EXTENSIONES_IMAGEN.includes(extension)) return 'imagen';
  if (tipo === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (tipo.startsWith('text/')) return 'texto';
  return null;
}

const EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

const carpetaDe = (ruta) => ruta.split('/').slice(0, -1).join('/');

export function entradasDeLista(lista) {
  return Array.from(lista || []).map((archivo) => ({ archivo, ruta: carpetaDe(archivo.webkitRelativePath || '') }));
}

function archivoDeEntrada(entrada) {
  return new Promise((resolver, rechazar) => entrada.file(resolver, rechazar));
}

async function leerDirectorio(directorio) {
  const lector = directorio.createReader();
  const hijos = [];
  for (;;) {
    const lote = await new Promise((resolver, rechazar) => lector.readEntries(resolver, rechazar));
    if (lote.length === 0) return hijos;
    hijos.push(...lote);
  }
}

async function recorrerEntrada(entrada) {
  if (entrada.isFile) {
    return [{ archivo: await archivoDeEntrada(entrada), ruta: carpetaDe(entrada.fullPath.replace(/^\/+/, '')) }];
  }
  if (!entrada.isDirectory) return [];
  const hijos = await leerDirectorio(entrada);
  return (await Promise.all(hijos.map(recorrerEntrada))).flat();
}

export async function entradasDeArrastre(transferencia) {
  const entradas = Array.from(transferencia.items || [])
    .filter((item) => item.kind === 'file')
    .map((item) => (typeof item.webkitGetAsEntry === 'function' ? item.webkitGetAsEntry() : null));
  if (entradas.length === 0 || entradas.some((e) => !e)) return entradasDeLista(transferencia.files);
  return (await Promise.all(entradas.map(recorrerEntrada))).flat();
}

export function separarPermitidos(entradas) {
  const validas = [];
  const omitidos = [];
  entradas.forEach((e) => {
    const extension = e.archivo.name.split('.').pop().toLowerCase();
    (EXTENSIONES_PERMITIDAS.includes(extension) ? validas : omitidos).push(e);
  });
  return { validas, omitidos: omitidos.map((e) => e.archivo.name) };
}

export function agruparPorRuta(archivos) {
  const grupos = new Map();
  archivos.forEach((a) => {
    const ruta = a.ruta || '';
    if (!grupos.has(ruta)) grupos.set(ruta, []);
    grupos.get(ruta).push(a);
  });
  return [...grupos.entries()]
    .sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)))
    .map(([ruta, lista]) => ({ ruta, archivos: lista }));
}

export function numerarPendientes(entradas, primero, conWord) {
  const conIndice = entradas.map((e, i) => ({ ...e, indice: i }));
  const sueltos = conIndice.filter((e) => !e.ruta);
  const rutas = [...new Set(conIndice.filter((e) => e.ruta).map((e) => e.ruta))].sort((a, b) => a.localeCompare(b));
  const inicio = primero + (conWord ? 1 : 0);
  return [
    ...sueltos.map((e, i) => ({ ...e, numero: inicio + i })),
    ...rutas.flatMap((ruta) => conIndice.filter((e) => e.ruta === ruta).map((e, i) => ({ ...e, numero: i + 1 }))),
  ];
}
