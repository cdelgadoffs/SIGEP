const FORMATO_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function esCorreoValido(texto) {
  return FORMATO_CORREO.test(texto.trim());
}

export function formatoFechaCorreo(iso) {
  const fecha = new Date(iso);
  const hoy = new Date();
  if (fecha.toDateString() === hoy.toDateString()) return fecha.toTimeString().slice(0, 5);
  const dia = String(fecha.getDate()).padStart(2, '0');
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${fecha.getFullYear()}`;
}

export function formatoFechaCompleta(iso) {
  const fecha = new Date(iso);
  const dia = fecha.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  return `${dia.charAt(0).toUpperCase()}${dia.slice(1)}, ${fecha.toTimeString().slice(0, 5)}`;
}

export function formatoTamano(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
