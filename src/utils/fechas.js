import { MESES } from './meses.js';

export function etiquetaFecha(id) {
  const fecha = new Date(id + 'T00:00:00');
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
}

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

export function etiquetaFechaConDia(id) {
  return `${DIAS[new Date(id + 'T00:00:00').getDay()]} ${etiquetaFecha(id)}`;
}

export function horaDeISO(iso) {
  return new Date(iso).toTimeString().slice(0, 5);
}

export function fechaHoyISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;
}

export function etiquetaMes(mesISO) {
  const [anio, mes] = mesISO.split('-');
  return `${MESES[Number(mes) - 1]} ${anio}`;
}

export function sumarDiasISO(id, dias) {
  const fecha = new Date(id + 'T00:00:00');
  fecha.setDate(fecha.getDate() + dias);
  const mes = String(fecha.getMonth() + 1).padStart(2, '0');
  const dia = String(fecha.getDate()).padStart(2, '0');
  return `${fecha.getFullYear()}-${mes}-${dia}`;
}

export function diaDeSemana(id) {
  return new Date(id + 'T00:00:00').getDay();
}
