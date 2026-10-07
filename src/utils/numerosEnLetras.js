const UNIDADES = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
const ESPECIALES = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
const VEINTI_ACENTUADOS = { 2: 'VEINTIDÓS ', 3: 'VEINTITRÉS ', 6: 'VEINTISÉIS ' };
const DECENAS = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

export function numeroALetras(numero) {
  if (numero === 0) return 'CERO';
  let resto = Math.floor(numero);
  let resultado = '';

  const miles = Math.floor(resto / 1000);
  if (miles > 0) {
    resultado += miles === 1 ? 'MIL ' : `${numeroALetras(miles)} MIL `;
    resto %= 1000;
  }

  const centena = Math.floor(resto / 100);
  if (centena > 0) {
    resultado += centena === 1 && resto % 100 === 0 ? 'CIEN ' : `${CENTENAS[centena]} `;
    resto %= 100;
  }

  if (resto > 0) {
    if (resto < 10) resultado += `${UNIDADES[resto]} `;
    else if (resto < 20) resultado += `${ESPECIALES[resto - 10]} `;
    else {
      const decena = Math.floor(resto / 10);
      const unidad = resto % 10;
      if (decena === 2 && unidad > 0) resultado += VEINTI_ACENTUADOS[unidad] ?? `VEINTI${UNIDADES[unidad]} `;
      else {
        resultado += DECENAS[decena];
        if (unidad > 0) resultado += ` Y ${UNIDADES[unidad]}`;
        resultado += ' ';
      }
    }
  }
  return resultado.trim();
}
