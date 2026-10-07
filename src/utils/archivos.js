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
