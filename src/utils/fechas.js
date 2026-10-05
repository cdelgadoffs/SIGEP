import { MESES } from './meses.js';

export function etiquetaFecha(id) {
  const fecha = new Date(id + 'T00:00:00');
  return `${fecha.getDate()} de ${MESES[fecha.getMonth()]}`;
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
