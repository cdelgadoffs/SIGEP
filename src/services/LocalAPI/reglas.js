import { ApiError } from '../ApiError.js';
import { usuarioActual as usuarioDelToken } from '../auth.js';

const CAMPOS_PUNTO = ['seccion', 'remitente', 'contenido', 'acuerdo', 'confidencial', 'contenidoDoc', 'acuerdoDoc', 'plantilla', 'introDoc', 'puenteDoc', 'bloquesActa', 'considerandosFijos', 'nombreCarpeta'];
const MAX_TEXTO = 20000;
const MAX_BYTES_ARCHIVO = 100 * 1024 * 1024;
const MAX_ARCHIVOS_PUNTO = 30;
const EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

const SIN_USUARIO = { id: 'anonimo', nombre: 'Anónimo', rol: null };

export function usuarioActual() {
  return usuarioDelToken() ?? SIN_USUARIO;
}

export function exigirEscritura() {
  if (usuarioActual().rol !== 'administrador') {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para modificar.');
  }
}

export function exigirDescarga() {
  if (usuarioActual().rol !== 'administrador') {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para descargar archivos.');
  }
}

export function puedeVerConfidencial() {
  return usuarioActual().rol === 'administrador';
}

export function fechaISO(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dia = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dia}`;
}

export function validarFechasISO(fechas) {
  if (!Array.isArray(fechas) || fechas.length === 0) {
    throw new ApiError('VALIDACION', 'Debes indicar al menos una fecha.');
  }
  fechas.forEach((f) => {
    const valida = typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && fechaISO(new Date(f + 'T00:00:00')) === f;
    if (!valida) throw new ApiError('VALIDACION', `Fecha inválida: ${f}.`);
  });
}

function fechaValida(f) {
  return typeof f === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(f) && fechaISO(new Date(f + 'T00:00:00')) === f;
}

function sumarDias(f, dias) {
  const d = new Date(f + 'T00:00:00');
  d.setDate(d.getDate() + dias);
  return fechaISO(d);
}

function diaDeSemana(f) {
  return new Date(f + 'T00:00:00').getDay();
}

export function enVacaciones(vacaciones, f) {
  return vacaciones.some((v) => f >= v.inicio && f <= v.fin);
}

function validarAnio(anio) {
  if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) {
    throw new ApiError('VALIDACION', 'El año del calendario es inválido.');
  }
}

export function validarCalendario(anio, datos) {
  validarAnio(anio);
  if (!datos || typeof datos !== 'object') throw new ApiError('VALIDACION', 'Datos de calendario inválidos.');
  const { diaSemana } = datos;
  if (!Number.isInteger(diaSemana) || diaSemana < 1 || diaSemana > 5) {
    throw new ApiError('VALIDACION', 'El día de sesión debe ser de lunes a viernes.');
  }
  const vacaciones = datos.vacaciones ?? [];
  if (!Array.isArray(vacaciones)) throw new ApiError('VALIDACION', 'Las vacaciones deben ser una lista.');
  vacaciones.forEach((v) => {
    if (!v || !fechaValida(v.inicio) || !fechaValida(v.fin)) {
      throw new ApiError('VALIDACION', 'Periodo vacacional con fechas inválidas.');
    }
    if (v.inicio > v.fin) throw new ApiError('VALIDACION', 'El inicio de las vacaciones debe ser anterior a su fin.');
  });
  return {
    anio,
    diaSemana,
    vacaciones: vacaciones.map((v) => ({ inicio: v.inicio, fin: v.fin })),
  };
}

export function validarAsueto(anio, calendario, asueto) {
  validarAnio(anio);
  if (!asueto || !fechaValida(asueto.fecha) || !fechaValida(asueto.destino)) {
    throw new ApiError('VALIDACION', 'Asueto con fechas inválidas.');
  }
  const { fecha, destino } = asueto;
  if (!fecha.startsWith(`${anio}-`)) throw new ApiError('VALIDACION', `El asueto del ${fecha} no es del año ${anio}.`);
  if (diaDeSemana(fecha) !== calendario.diaSemana) {
    throw new ApiError('VALIDACION', `El ${fecha} no es día de sesión ordinaria; no requiere reprogramación.`);
  }
  if (destino !== sumarDias(fecha, -1) && destino !== sumarDias(fecha, 1)) {
    throw new ApiError('VALIDACION', 'Un asueto solo puede reprogramarse al día anterior o al siguiente.');
  }
  if (enVacaciones(calendario.vacaciones, destino)) {
    throw new ApiError('VALIDACION', 'El día de destino cae en un periodo vacacional.');
  }
  if (calendario.asuetos.some((a) => a.fecha === fecha)) {
    throw new ApiError('VALIDACION', `Ya existe un asueto registrado el ${fecha}.`);
  }
  return { fecha, destino };
}

export function generarFechasAnuales({ anio, diaSemana, vacaciones, asuetos }) {
  const d = new Date(anio, 0, 1);
  let diferencia = diaSemana - d.getDay();
  if (diferencia < 0) diferencia += 7;
  d.setDate(d.getDate() + diferencia);
  const fechas = [];
  while (d.getFullYear() === anio) {
    const f = fechaISO(d);
    if (!enVacaciones(vacaciones, f)) {
      const destino = asuetos.find((a) => a.fecha === f)?.destino ?? f;
      if (!enVacaciones(vacaciones, destino) && !fechas.includes(destino)) fechas.push(destino);
    }
    d.setDate(d.getDate() + 7);
  }
  return fechas.sort();
}

export function sumarDiasISO(id, dias) {
  const fecha = new Date(id + 'T00:00:00');
  fecha.setDate(fecha.getDate() + dias);
  return fechaISO(fecha);
}

export const tipoDeSesion = (s) => s.tipo ?? 'ordinaria';

export function calcularEstados(sesiones) {
  const hoyISO = fechaISO(new Date());
  const ordenadas = [...sesiones].sort((a, b) => (a.id < b.id ? -1 : 1));
  const proxima = ordenadas.find((s) => s.id >= hoyISO && !s.celebrada);
  const contadores = {};
  return ordenadas.map((s) => {
    const tipo = tipoDeSesion(s);
    const clave = `${s.id.slice(0, 4)}_${tipo}`;
    let estado = 'pendiente';
    if (s.celebrada) estado = 'celebrada';
    else if (proxima && s.id === proxima.id) estado = 'proxima';
    else if (s.id < hoyISO) estado = 'no-celebrada';
    if (estado !== 'no-celebrada') contadores[clave] = (contadores[clave] ?? 0) + 1;
    return {
      id: s.id,
      tipo,
      numeroSesion: estado === 'no-celebrada' ? null : contadores[clave],
      estado,
      celebrada: !!s.celebrada,
      celebradaEn: s.celebradaEn || null,
      horaInicio: s.horaInicio || null,
      horaFin: s.horaFin || null,
      enCurso: !!s.horaInicio && !s.celebrada,
      listaCerrada: !!s.listaCerrada,
      asistentes: s.celebrada ? s.asistentes ?? null : null,
      version: s.version,
    };
  });
}

export function validarHoraDelDia(texto) {
  if (typeof texto !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)) {
    throw new ApiError('VALIDACION', 'La hora debe tener el formato HH:MM (de 00:00 a 23:59).');
  }
}

export function conHoraDelDia(iso, hhmm) {
  const fecha = new Date(iso);
  const [h, m] = hhmm.split(':').map(Number);
  fecha.setHours(h, m, 0, 0);
  return fecha.toISOString();
}

export function fechasDisponiblesExtraordinaria(sesiones, calendarios, hoy = fechaISO(new Date())) {
  const ordinarias = sesiones.filter((s) => tipoDeSesion(s) === 'ordinaria').map((s) => s.id).sort();
  let anterior = null;
  let siguiente = null;
  ordinarias.forEach((f) => {
    if (f <= hoy) anterior = f;
    if (f > hoy && !siguiente) siguiente = f;
  });
  const inicio = anterior && sumarDiasISO(anterior, 1) > hoy ? sumarDiasISO(anterior, 1) : hoy;
  const fin = siguiente ? sumarDiasISO(siguiente, -1) : sumarDiasISO(hoy, 60);
  const ocupadas = new Set(sesiones.map((s) => s.id));
  const disponibles = [];
  for (let cursor = inicio; cursor <= fin; cursor = sumarDiasISO(cursor, 1)) {
    const diaSemana = new Date(cursor + 'T00:00:00').getDay();
    const calendario = calendarios.find((c) => c.anio === Number(cursor.slice(0, 4)));
    if (diaSemana !== 0 && diaSemana !== 6 && diaSemana !== calendario?.diaSemana && !ocupadas.has(cursor)) disponibles.push(cursor);
  }
  return disponibles;
}

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaLarga(id) {
  const d = new Date(id + 'T00:00:00');
  return `${d.getDate()} de ${MESES_LARGOS[d.getMonth()]} de ${d.getFullYear()}`;
}

const UNIDADES_LETRAS = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez', 'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte', 'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS_LETRAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS_LETRAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function numeroEnLetras(n) {
  if (n === 0) return 'cero';
  const partes = [];
  const miles = Math.floor(n / 1000);
  let resto = n % 1000;
  if (miles > 0) partes.push(miles === 1 ? 'mil' : `${numeroEnLetras(miles)} mil`);
  const centena = Math.floor(resto / 100);
  resto %= 100;
  if (centena > 0) partes.push(centena === 1 && resto === 0 ? 'cien' : CENTENAS_LETRAS[centena]);
  if (resto > 0) {
    if (resto < 30) partes.push(UNIDADES_LETRAS[resto]);
    else partes.push(resto % 10 ? `${DECENAS_LETRAS[Math.floor(resto / 10)]} y ${UNIDADES_LETRAS[resto % 10]}` : DECENAS_LETRAS[Math.floor(resto / 10)]);
  }
  return partes.join(' ');
}

function fechaEnLetras(id) {
  const d = new Date(id + 'T00:00:00');
  return `${numeroEnLetras(d.getDate())} de ${MESES_LARGOS[d.getMonth()]} de ${numeroEnLetras(d.getFullYear())}`;
}

export function esPuntoFijo(id) {
  return typeof id === 'string' && id.startsWith('fijo:');
}

export function analizarPuntoFijo(id) {
  const [, sesionId, clave] = id.split(':');
  return { sesionId, clave };
}

export function exigirListaAbierta(sesion, seccion, catalogos) {
  if (!sesion.listaCerrada) return;
  const admite = seccion && (catalogos.secciones || []).find((s) => s.id === seccion)?.admiteConListaCerrada;
  if (!admite) {
    throw new ApiError('LISTA_CERRADA', 'La lista de puntos está cerrada. Ábrela para añadir, editar, eliminar o mover puntos.');
  }
}

export function exigirSeccionAbierta(seccion, catalogos) {
  const encontrada = (catalogos.secciones || []).find((s) => s.id === seccion);
  if (encontrada?.soloPuntosFijos) {
    throw new ApiError('VALIDACION', `La sección «${encontrada.nombre}» solo contiene puntos fijos y no admite puntos nuevos.`);
  }
}

export function exigirNoFijo(id) {
  if (esPuntoFijo(id)) {
    throw new ApiError('VALIDACION', 'Los puntos fijos se generan automáticamente y no se pueden modificar.');
  }
}

function cumpleCondicion(requiere, anterior) {
  if (!requiere) return true;
  if (requiere === 'sesion-anterior-celebrada') return !!anterior && !!anterior.celebrada;
  return false;
}

function actasExtraordinariasPendientes(sesion, sesiones, anterior) {
  const fechaAnterior = anterior ? anterior.id : sumarDiasISO(sesion.id, -7);
  return sesiones
    .filter((x) => tipoDeSesion(x) === 'extraordinaria' && x.celebrada)
    .map((x) => x.id)
    .filter((f) => {
      if (sumarDiasISO(f, 1) === sesion.id) return false;
      if (sumarDiasISO(f, 1) === fechaAnterior) return f < sesion.id;
      return f > fechaAnterior && f < sesion.id;
    })
    .sort();
}

export function generarPuntosFijos(sesion, sesiones, catalogoFijos) {
  const tipo = tipoDeSesion(sesion);
  const anterior = sesiones
    .filter((x) => tipoDeSesion(x) === 'ordinaria' && x.id < sesion.id)
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .pop();
  const fecha = anterior ? fechaLarga(anterior.id) : '';
  const catalogo = catalogoFijos || [];
  const armar = (f, orden, clave, contenido) => ({
    id: `fijo:${sesion.id}:${clave}`,
    sesionId: sesion.id,
    seccion: f.seccion,
    remitente: f.remitente,
    contenido,
    acuerdo: '',
    confidencial: false,
    archivos: [],
    orden,
    tratado: sesion.fijosTratados?.[clave] ?? true,
    textoVotacion: f.textoVoto ?? null,
    fijo: true,
    encabezado: !!f.encabezado,
    version: 1,
    creadoPor: 'sistema',
    creadoEn: sesion.creadaEn ?? '',
    modificadoEn: sesion.creadaEn ?? '',
  });
  const delCatalogo = catalogo
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => !f.tipos || f.tipos.includes(tipo))
    .filter(({ f }) => cumpleCondicion(f.requiere, anterior))
    .map(({ f, i }) => armar(f, i, f.id, f.texto.replaceAll('{tipo}', 'ordinaria').replaceAll('{fecha}', fecha)));
  if (tipo !== 'ordinaria') return delCatalogo;
  const indiceActa = catalogo.findIndex((f) => f.id === 'acta-anterior');
  const moldeActa = catalogo[indiceActa] ?? catalogo.find((f) => f.id === 'orden-dia');
  if (!moldeActa) return delCatalogo;
  const base = indiceActa >= 0 ? indiceActa : Math.max(0, catalogo.findIndex((f) => f.id === 'orden-dia'));
  const automaticas = actasExtraordinariasPendientes(sesion, sesiones, anterior).map((f, k) => armar(
    { ...moldeActa, encabezado: false },
    base + (k + 1) / 1000,
    `acta-auto-${f}`,
    `Aprobación, en su caso, del acta de la sesión extraordinaria del ${fechaLarga(f)}.`,
  ));
  return [...delCatalogo, ...automaticas];
}

export function ordenarPuntosDocumento(puntos, secciones) {
  const posicion = new Map(secciones.map((s, i) => [s.id, i]));
  const rango = (p) => (posicion.has(p.seccion) ? posicion.get(p.seccion) : secciones.length);
  return [...puntos]
    .sort((a, b) => {
      if (rango(a) !== rango(b)) return rango(a) - rango(b);
      if (!!a.fijo !== !!b.fijo) return a.fijo ? -1 : 1;
      if (a.orden !== b.orden) return a.orden - b.orden;
      if (a.creadoEn !== b.creadoEn) return a.creadoEn < b.creadoEn ? -1 : 1;
      return a.id < b.id ? -1 : 1;
    })
    .map((p, i) => ({ ...p, numero: i + 1 }));
}

export function ocultarConfidencial(p) {
  if (!p.confidencial) return p;
  return {
    ...p, contenido: 'CONFIDENCIAL', acuerdo: '', archivos: [], votacion: null, acuerdoLineas: [], textoVotacion: null,
    contenidoDoc: null, acuerdoDoc: null, introDoc: null, puenteDoc: null, bloquesActa: [], considerandosFijos: [], engrose: null,
  };
}

export function camposPunto(datos) {
  const limpio = {};
  CAMPOS_PUNTO.forEach((c) => {
    if (c in datos) limpio[c] = datos[c];
  });
  return limpio;
}

function buscarSeccion(catalogos, id) {
  return (catalogos.secciones || []).find((s) => s.id === id);
}

function textoDeEntrada(p, campo) {
  const doc = p[campo + 'Doc'];
  if (doc !== undefined && doc !== null) return textoPlanoDeDoc(validarDocumento(doc));
  return typeof p[campo] === 'string' ? p[campo] : '';
}

export function combinarCambios(actual, cambios) {
  const combinado = { ...actual, ...camposPunto(cambios) };
  ['contenido', 'acuerdo'].forEach((campo) => {
    if (campo in cambios && !(campo + 'Doc' in cambios)) delete combinado[campo + 'Doc'];
  });
  return combinado;
}

export function validarPunto(p, catalogos) {
  const seccion = buscarSeccion(catalogos, p.seccion);
  if (!seccion) throw new ApiError('VALIDACION', 'Sección inválida.');
  if (!(catalogos.remitentes || []).some((r) => r.id === p.remitente)) {
    throw new ApiError('VALIDACION', 'Remitente inválido.');
  }
  const contenido = textoDeEntrada(p, 'contenido');
  if (contenido.trim().length === 0) throw new ApiError('VALIDACION', 'El contenido es obligatorio.');
  if (contenido.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'El contenido es demasiado largo.');
  const acuerdo = textoDeEntrada(p, 'acuerdo');
  if (seccion.requiereAcuerdo && acuerdo.trim().length === 0) {
    throw new ApiError('VALIDACION', 'El acuerdo es obligatorio.');
  }
  if (acuerdo.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'El acuerdo es demasiado largo.');
  if (typeof p.confidencial !== 'boolean') throw new ApiError('VALIDACION', 'Indicador de confidencialidad inválido.');
}

const MAX_NIVELES_RUTA = 8;
const MAX_LARGO_RUTA = 260;

function normalizarRuta(ruta) {
  if (ruta === undefined || ruta === null || ruta === '') return '';
  if (typeof ruta !== 'string') throw new ApiError('ARCHIVO_INVALIDO', 'La carpeta del archivo es inválida.');
  const limpia = ruta.replace(/\\/g, '/').replace(/^\/+|\/+$/g, '');
  if (limpia === '') return '';
  const tramos = limpia.split('/');
  if (limpia.length > MAX_LARGO_RUTA || tramos.length > MAX_NIVELES_RUTA || tramos.some((t) => t === '' || t === '.' || t === '..')) {
    throw new ApiError('ARCHIVO_INVALIDO', `La carpeta «${ruta}» no es válida (máximo ${MAX_NIVELES_RUTA} niveles y ${MAX_LARGO_RUTA} caracteres, sin «..»).`);
  }
  return limpia;
}

export function entradasDeArchivos(archivos) {
  if (!Array.isArray(archivos)) throw new ApiError('ARCHIVO_INVALIDO', 'Lista de archivos inválida.');
  return archivos.map((item) => {
    if (item instanceof File) return { archivo: item, ruta: '' };
    if (item && item.archivo instanceof File) return { archivo: item.archivo, ruta: normalizarRuta(item.ruta) };
    throw new ApiError('ARCHIVO_INVALIDO', 'Archivo inválido.');
  });
}

export function validarArchivos(entradas, yaAdjuntos = 0) {
  if (yaAdjuntos + entradas.length > MAX_ARCHIVOS_PUNTO) {
    throw new ApiError('ARCHIVO_INVALIDO', `Un punto admite como máximo ${MAX_ARCHIVOS_PUNTO} archivos.`);
  }
  entradas.forEach(({ archivo: a }) => {
    if (a.name.length === 0) throw new ApiError('ARCHIVO_INVALIDO', 'Archivo inválido.');
    const extension = a.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}»: tipo de archivo no permitido.`);
    }
    if (a.size > MAX_BYTES_ARCHIVO) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}» supera el máximo de 100 MB.`);
    }
  });
}

export function validarNuevoNombreArchivo(nombre, actual) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';
  if (!limpio) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre del archivo es obligatorio.');
  if (limpio.length > 200) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre del archivo es demasiado largo (máx. 200 caracteres).');
  if (/[\\/:*?"<>|]/.test(limpio)) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre no puede incluir \\ / : * ? " < > |.');
  const extension = (n) => (n.includes('.') ? n.split('.').pop().toLowerCase() : '');
  if (extension(limpio) !== extension(actual)) throw new ApiError('ARCHIVO_INVALIDO', 'No se puede cambiar la extensión del archivo.');
  return limpio;
}

export function validarNombreCarpeta(nombre) {
  const limpio = typeof nombre === 'string' ? nombre.trim() : '';
  if (!limpio) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre de la carpeta es obligatorio.');
  if (limpio.length > 100) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre de la carpeta es demasiado largo (máx. 100 caracteres).');
  if (limpio === '.' || limpio === '..' || /[\\/:*?"<>|]/.test(limpio)) throw new ApiError('ARCHIVO_INVALIDO', 'El nombre de la carpeta no es válido.');
  return limpio;
}

export function prepararArchivos(puntoId, entradas, ordenBase = 0, informativo = false) {
  const ahora = new Date().toISOString();
  const creadoPor = usuarioActual().id;
  const registros = entradas.map(({ archivo: a, ruta }, i) => ({
    id: crypto.randomUUID(), puntoId, nombre: a.name, tipo: a.type, tamano: a.size, ...(ruta ? { ruta } : null), orden: ordenBase + i + 1, ...(informativo ? { informativo: true } : null), creadoEn: ahora, creadoPor, blob: a,
  }));
  const metadatos = registros.map((r) => ({
    id: r.id, nombre: r.nombre, tipo: r.tipo, tamano: r.tamano, ...(r.ruta ? { ruta: r.ruta } : null), orden: r.orden, ...(r.informativo ? { informativo: true } : null), creadoEn: r.creadoEn, creadoPor: r.creadoPor,
  }));
  return { registros, metadatos };
}

function elegir(lista, id, mensaje) {
  const opcion = id === undefined ? lista[0] : lista.find((o) => o.id === id);
  if (!opcion) throw new ApiError('VALIDACION', mensaje);
  return opcion;
}

export function validarVotacion(v, catalogos, esInforme = false) {
  if (v === null) return null;
  if (typeof v !== 'object' || Array.isArray(v)) throw new ApiError('VALIDACION', 'Votación inválida.');
  if (v.textoManual !== undefined && (typeof v.textoManual !== 'string' || v.textoManual.length > MAX_TEXTO)) {
    throw new ApiError('VALIDACION', 'El texto de la votación es inválido o demasiado largo.');
  }
  const extra = v.textoManual !== undefined ? { textoManual: v.textoManual } : {};
  if (esInforme) {
    const tipo = elegir(catalogos.tiposConocimiento || [], v.conocimiento, 'Tipo de conocimiento inválido.');
    const complemento = typeof v.complemento === 'string' ? v.complemento : '';
    if (complemento.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'El complemento es demasiado largo.');
    return { conocimiento: tipo.id, complemento: tipo.admiteComplemento ? complemento : '', ...extra };
  }
  const voto = elegir(catalogos.tiposVoto || [], v.voto, 'Tipo de voto inválido.');
  const votacion = elegir(catalogos.tiposVotacion || [], v.votacion, 'Tipo de votación inválido.');
  const estado = elegir(catalogos.estadosVoto || [], v.estado, 'Estado de la votación inválido.');
  const quorum = Array.isArray(v.quorum) ? v.quorum : [];
  const integrantes = catalogos.integrantes || [];
  if (new Set(quorum).size !== quorum.length || !quorum.every((id) => integrantes.some((i) => i.id === id))) {
    throw new ApiError('VALIDACION', 'Quórum inválido.');
  }
  const requeridos = voto.votosRequeridos || 0;
  if (quorum.length > requeridos) {
    throw new ApiError('VALIDACION', `El voto elegido admite como máximo ${requeridos} integrante(s) en el quórum.`);
  }
  const precision = typeof v.precision === 'string' ? v.precision : '';
  if (precision.length > MAX_TEXTO) throw new ApiError('VALIDACION', 'La precisión es demasiado larga.');
  const admitePrecision = !!voto.admitePrecision && !!votacion.admitePrecision;
  return { voto: voto.id, votacion: votacion.id, estado: estado.id, quorum, precision: admitePrecision ? precision : '', ...extra };
}

const ORDINALES = ['PRIMERO', 'SEGUNDO', 'TERCERO', 'CUARTO', 'QUINTO', 'SEXTO', 'SÉPTIMO', 'OCTAVO', 'NOVENO', 'DÉCIMO'];
const PREFIJO_ACUERDO = /^\*{0,2}(ÚNICO|PRIMERO|SEGUNDO|TERCERO|CUARTO|QUINTO|SEXTO|SÉPTIMO|OCTAVO|NOVENO|DÉCIMO[A-ZÁÉÍÓÚ\s]*)\*{0,2}\.\*{0,2}\s*/i;

function prefijoOrdinal(indice, total) {
  if (total === 1) return 'ÚNICO';
  return ORDINALES[indice] ?? `DÉCIMO ${ORDINALES[indice - 10] ?? ''}`.trim();
}

export function lineasDeAcuerdoDoc(doc) {
  const textos = parrafosDeNivelSuperior(doc).map((t) => t.replace(/\n/g, ' '));
  return textos.map((texto, i) => ({ prefijo: prefijoOrdinal(i, textos.length), texto: texto.replace(PREFIJO_ACUERDO, '').trim() }));
}

export function lineasDeAcuerdo(acuerdo) {
  const lineas = (acuerdo || '').split('\n').map((l) => l.trim()).filter(Boolean);
  return lineas.map((linea, i) => ({ prefijo: prefijoOrdinal(i, lineas.length), texto: linea.replace(PREFIJO_ACUERDO, '').trim() }));
}

const sinPunto = (t) => t.replace(/\.\s*$/, '');
const enMinuscula = (t) => t.charAt(0).toLowerCase() + t.slice(1);

function textoInforme(v, catalogos) {
  const { conocimiento, complemento } = validarVotacion(v ?? {}, catalogos, true);
  const tipo = (catalogos.tiposConocimiento || []).find((o) => o.id === conocimiento);
  if (!tipo.admiteComplemento) return tipo.texto;
  const extra = complemento.trim();
  return extra ? `${tipo.textoBase} ${extra}.` : '';
}

function textoVotacionGenerado(v, lineas, catalogos) {
  const norm = validarVotacion(v ?? {}, catalogos);
  const voto = catalogos.tiposVoto.find((o) => o.id === norm.voto);
  const votacion = catalogos.tiposVotacion.find((o) => o.id === norm.votacion);
  const estado = catalogos.estadosVoto.find((o) => o.id === norm.estado);
  const unico = lineas.length === 1 ? enMinuscula(sinPunto(lineas[0].texto)) : null;
  if (voto.votosRequeridos) {
    const nombres = norm.quorum
      .map((id) => {
        const i = (catalogos.integrantes || []).find((x) => x.id === id);
        return i ? `${i.tratamiento} ${i.nombre}`.trim() : id;
      })
      .join(' y ') || '<<pendiente>>';
    const base = `El Pleno, ${voto.frase}, con el voto en contra de ${nombres}, ${estado.nombre}`;
    return unico ? `${base} ${unico}.` : `${base}:`;
  }
  let completo;
  if (voto.sinVotacion) completo = `El Pleno, ${voto.frase}.`;
  else if (voto.admitePrecision && votacion.admitePrecision && norm.precision) {
    completo = `El Pleno, ${voto.frase} de votos, con la precisión de que ${norm.precision}, ${estado.nombre}.`;
  } else completo = `El Pleno, en ${votacion.nombre}, ${voto.frase}, ${estado.nombre}.`;
  return unico ? `${sinPunto(completo)}, ${unico}.` : completo;
}

function descriptorVotacionEngrose(v, catalogos) {
  const norm = validarVotacion(v ?? {}, catalogos);
  const voto = catalogos.tiposVoto.find((o) => o.id === norm.voto);
  const votacion = catalogos.tiposVotacion.find((o) => o.id === norm.votacion);
  if (voto.votosRequeridos) {
    const nombres = norm.quorum
      .map((id) => {
        const i = (catalogos.integrantes || []).find((x) => x.id === id);
        return i ? `${i.tratamiento} ${i.nombre}`.trim() : id;
      })
      .join(' y ') || '<<pendiente>>';
    return `${voto.frase}, con el voto en contra de ${nombres},`;
  }
  const base = voto.fraseEngrose ?? voto.frase;
  if (voto.sinVotacion) return `${base},`;
  return voto.admitePrecision && votacion.admitePrecision ? `${base}, en ${votacion.nombre},` : base;
}

function nombreFirmante(tratamiento, nombre) {
  return `${(tratamiento || '').replace(/^(el|la)\s+/i, '')} ${nombre}`.trim().toUpperCase();
}

export function engroseDePunto(punto, { sesion, tipo, presidente, secretario }, catalogos) {
  const texto = (catalogos.textosActa || []).find((t) => t.id === 'engrose');
  if (!texto || punto.fijo || punto.confidencial) return null;
  let descriptor;
  try {
    descriptor = descriptorVotacionEngrose(punto.votacion, catalogos);
  } catch {
    descriptor = 'por unanimidad de votos';
  }
  return {
    parrafo: texto.texto
      .replace('{votacion}', descriptor)
      .replace('{tipo}', tipo)
      .replace('{fecha}', fechaEnLetras(sesion.id)),
    firmaPresidente: {
      nombre: presidente ? nombreFirmante(presidente.tratamiento, presidente.nombre) : '<<presidente>>',
      cargo1: texto.cargoPresidente[0],
      cargo2: texto.cargoPresidente[1],
    },
    firmaSecretario: {
      nombre: secretario ? secretario.nombre.toUpperCase() : '<<secretario>>',
      cargo1: texto.cargoSecretario[0],
      cargo2: texto.cargoSecretario[1],
    },
  };
}

export function decorarPunto(p, catalogos) {
  if (p.fijo) return { ...p, acuerdoLineas: [] };
  const seccion = (catalogos.secciones || []).find((s) => s.id === p.seccion);
  const esInforme = !!seccion && !seccion.requiereAcuerdo;
  const contenido = p.contenidoDoc ? textoPlanoDeDoc(p.contenidoDoc) : (p.contenido ?? '');
  const acuerdo = p.acuerdoDoc ? textoPlanoDeDoc(p.acuerdoDoc) : (p.acuerdo ?? '');
  const acuerdoLineas = esInforme ? [] : (p.acuerdoDoc ? lineasDeAcuerdoDoc(p.acuerdoDoc) : lineasDeAcuerdo(acuerdo));
  let textoVotacion;
  if (typeof p.votacion?.textoManual === 'string') textoVotacion = p.votacion.textoManual;
  else {
    try {
      textoVotacion = esInforme ? textoInforme(p.votacion, catalogos) : textoVotacionGenerado(p.votacion, acuerdoLineas, catalogos);
    } catch {
      textoVotacion = '';
    }
  }
  return { ...p, contenido, acuerdo, acuerdoLineas, textoVotacion };
}

const NODOS = new Set(['doc', 'paragraph', 'text', 'hardBreak', 'orderedList', 'listItem', 'table', 'tableRow', 'tableHeader', 'tableCell']);
const MARCAS = new Set(['bold', 'italic', 'oculto', 'fontSize']);
const ATRIBUTOS_NODO = {
  paragraph: ['textAlign'],
  orderedList: ['start', 'type'],
  tableHeader: ['colspan', 'rowspan', 'colwidth', 'align'],
  tableCell: ['colspan', 'rowspan', 'colwidth', 'align'],
};
const ALINEACIONES = ['left', 'center', 'right', 'justify'];
const MAX_PROFUNDIDAD_DOC = 12;
const MAX_TAMANO_DOC = 200000;
const MAX_BLOQUES = 20;

function invalido(mensaje) {
  return new ApiError('VALIDACION', mensaje);
}

function validarMarca(m) {
  if (!m || typeof m !== 'object' || !MARCAS.has(m.type)) throw invalido('El documento tiene una marca de formato no permitida.');
  if (m.type === 'fontSize') {
    const tamano = m.attrs?.size;
    if (typeof tamano !== 'string' || !/^\d{1,3}(\.\d+)?px$/.test(tamano)) throw invalido('Tamaño de letra inválido.');
  }
}

function validarNodo(n, profundidad) {
  if (!n || typeof n !== 'object' || !NODOS.has(n.type)) throw invalido('El documento tiene un elemento no permitido.');
  if (profundidad > MAX_PROFUNDIDAD_DOC) throw invalido('El documento es demasiado profundo.');
  if (n.attrs) {
    const permitidos = ATRIBUTOS_NODO[n.type] || [];
    Object.keys(n.attrs).forEach((k) => {
      if (!permitidos.includes(k)) throw invalido(`El documento tiene un atributo no permitido (${n.type}.${k}).`);
    });
    if (n.type === 'paragraph' && n.attrs.textAlign != null && !ALINEACIONES.includes(n.attrs.textAlign)) {
      throw invalido('Alineación inválida.');
    }
    if ((n.type === 'tableHeader' || n.type === 'tableCell') && n.attrs.align != null && !ALINEACIONES.includes(n.attrs.align)) {
      throw invalido('Alineación inválida.');
    }
  }
  if (n.type === 'text') {
    if (typeof n.text !== 'string') throw invalido('Texto inválido en el documento.');
    (n.marks || []).forEach(validarMarca);
    return;
  }
  if (n.content !== undefined && !Array.isArray(n.content)) throw invalido('Contenido inválido en el documento.');
  (n.content || []).forEach((hijo) => validarNodo(hijo, profundidad + 1));
}

export function validarDocumento(doc) {
  if (!doc || typeof doc !== 'object' || doc.type !== 'doc') throw invalido('Documento inválido.');
  if (JSON.stringify(doc).length > MAX_TAMANO_DOC) throw invalido('El documento es demasiado grande.');
  validarNodo(doc, 0);
  return doc;
}

function textoDeNodo(n) {
  if (n.type === 'text') return n.text || '';
  if (n.type === 'hardBreak') return '\n';
  const hijos = (n.content || []).map(textoDeNodo);
  if (n.type === 'tableRow') return hijos.join('\t');
  if (n.type === 'paragraph') return hijos.join('');
  return hijos.filter((t) => t !== '').join('\n');
}

export function textoPlanoDeDoc(doc) {
  return doc ? textoDeNodo(doc) : '';
}

export function parrafosDeNivelSuperior(doc) {
  return ((doc && doc.content) || [])
    .filter((n) => n.type === 'paragraph')
    .map(textoDeNodo)
    .filter((t) => t.trim() !== '');
}

export function docVacio() {
  return { type: 'doc', content: [{ type: 'paragraph' }] };
}

export function docDesdeTexto(texto) {
  const lineas = String(texto || '').split('\n').filter((l) => l.trim() !== '');
  if (lineas.length === 0) return docVacio();
  return { type: 'doc', content: lineas.map((l) => ({ type: 'paragraph', content: [{ type: 'text', text: l }] })) };
}

function docIntro(catalogos) {
  const intro = (catalogos.textosActa || []).find((t) => t.id === 'intro');
  if (!intro) return docVacio();
  const contenido = [];
  if (intro.negrita) contenido.push({ type: 'text', text: intro.negrita, marks: [{ type: 'bold' }] });
  if (intro.texto) contenido.push({ type: 'text', text: intro.texto });
  return { type: 'doc', content: [{ type: 'paragraph', content: contenido }] };
}

function docTextoActa(catalogos, id) {
  const texto = (catalogos.textosActa || []).find((t) => t.id === id);
  return texto ? docDesdeTexto(texto.texto) : docVacio();
}

function bloquesDePlantilla(plantilla) {
  return (plantilla?.bloques || []).map((tipo) => ({ id: crypto.randomUUID(), tipo, doc: docVacio() }));
}

export function hojaPorOmision(catalogos, plantillaId) {
  const plantillas = catalogos.plantillasActa || [];
  const plantilla = plantillas.find((x) => x.id === plantillaId) || plantillas[0];
  return {
    plantilla: plantilla?.id ?? 'introduccion',
    introDoc: docIntro(catalogos),
    puenteDoc: docTextoActa(catalogos, 'puente'),
    bloquesActa: bloquesDePlantilla(plantilla),
  };
}

function normalizarBloques(bloques, catalogos) {
  if (!Array.isArray(bloques) || bloques.length > MAX_BLOQUES) throw invalido('Lista de bloques inválida.');
  const vistos = new Set();
  return bloques.map((b) => {
    if (!b || typeof b.id !== 'string' || !b.id || b.id.length > 64 || vistos.has(b.id)) throw invalido('Bloque inválido.');
    vistos.add(b.id);
    const tipo = (catalogos.tiposBloqueActa || []).find((t) => t.id === b.tipo);
    if (!tipo) throw invalido('Tipo de bloque inválido.');
    const bloque = { id: b.id, tipo: tipo.id, doc: validarDocumento(b.doc ?? docVacio()) };
    if (tipo.titulo === null) {
      const titulo = typeof b.titulo === 'string' ? b.titulo.trim() : '';
      if (!titulo || titulo.length > 200) throw invalido('El título del bloque es obligatorio (máx. 200 caracteres).');
      bloque.titulo = titulo;
    }
    return bloque;
  });
}

function considerandosPorOmision(catalogos) {
  return (catalogos.considerandosFijos || []).map((c) => ({ id: c.id, doc: docDesdeTexto(c.texto) }));
}

function normalizarConsiderandosFijos(lista, catalogos) {
  const catalogo = catalogos.considerandosFijos || [];
  if (!Array.isArray(lista) || lista.length > catalogo.length) throw invalido('Lista de considerandos inválida.');
  const vistos = new Set();
  lista.forEach((c) => {
    if (!c || !catalogo.some((x) => x.id === c.id) || vistos.has(c.id)) throw invalido('Considerando inválido.');
    vistos.add(c.id);
  });
  return catalogo
    .map((x) => lista.find((c) => c.id === x.id))
    .filter(Boolean)
    .map((c) => ({ id: c.id, doc: validarDocumento(c.doc ?? docVacio()) }));
}

function docDeEntrada(p, campo) {
  const doc = p[campo + 'Doc'];
  if (doc !== undefined && doc !== null) return validarDocumento(doc);
  return docDesdeTexto(typeof p[campo] === 'string' ? p[campo].trim() : '');
}

export function normalizarPunto(p, catalogos, esNuevo = false) {
  const seccion = buscarSeccion(catalogos, p.seccion);
  const omision = hojaPorOmision(catalogos, p.plantilla ?? seccion.plantillaPorOmision);
  const plantilla = p.plantilla ?? omision.plantilla;
  if (!(catalogos.plantillasActa || []).some((x) => x.id === plantilla)) throw invalido('Plantilla inválida.');
  const nombreCarpeta = typeof p.nombreCarpeta === 'string' ? p.nombreCarpeta.trim() : '';
  return {
    seccion: p.seccion,
    remitente: p.remitente,
    ...(nombreCarpeta ? { nombreCarpeta: validarNombreCarpeta(nombreCarpeta) } : null),
    contenidoDoc: docDeEntrada(p, 'contenido'),
    acuerdoDoc: seccion.requiereAcuerdo ? docDeEntrada(p, 'acuerdo') : docVacio(),
    confidencial: p.confidencial,
    plantilla,
    introDoc: p.introDoc != null ? validarDocumento(p.introDoc) : omision.introDoc,
    puenteDoc: p.puenteDoc != null ? validarDocumento(p.puenteDoc) : omision.puenteDoc,
    bloquesActa: p.bloquesActa != null ? normalizarBloques(p.bloquesActa, catalogos) : omision.bloquesActa,
    considerandosFijos: p.considerandosFijos != null
      ? normalizarConsiderandosFijos(p.considerandosFijos, catalogos)
      : esNuevo ? considerandosPorOmision(catalogos) : [],
  };
}

const MAX_INTEGRANTES = 5;
const MAX_NOMBRE = 200;
const FORMATO_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function decorarIntegrante(i, catalogos) {
  const genero = (catalogos.generos || []).find((g) => g.id === i.genero);
  const grado = (catalogos.grados || []).find((g) => g.id === i.grado);
  const titulo = grado?.titulo?.[i.genero];
  return { ...i, tratamiento: [genero?.articulo, titulo].filter(Boolean).join(' ') };
}

function exigirTexto(valor, etiqueta) {
  const texto = typeof valor === 'string' ? valor.trim() : '';
  if (!texto) throw new ApiError('VALIDACION', `${etiqueta} es obligatorio.`);
  if (texto.length > MAX_NOMBRE) throw new ApiError('VALIDACION', `${etiqueta} es demasiado largo.`);
  return texto;
}

function exigirEnCatalogo(lista, id, mensaje) {
  if (!(lista || []).some((o) => o.id === id)) throw new ApiError('VALIDACION', mensaje);
  return id;
}

export function validarIntegrante(datos, catalogos, existentes, idActual = null) {
  const nombre = exigirTexto(datos.nombre, 'El nombre');
  const email = exigirTexto(datos.email, 'El correo');
  if (!FORMATO_EMAIL.test(email)) throw new ApiError('VALIDACION', 'El correo no tiene un formato válido.');
  if (existentes.some((x) => x.id !== idActual && x.email.toLowerCase() === email.toLowerCase())) {
    throw new ApiError('DUPLICADO', 'Ya existe un integrante con ese correo.');
  }
  const genero = exigirEnCatalogo(catalogos.generos, datos.genero, 'Género inválido.');
  const grado = exigirEnCatalogo(catalogos.grados, datos.grado, 'Grado académico inválido.');
  if (typeof datos.presidente !== 'boolean') throw new ApiError('VALIDACION', 'Indicador de presidente inválido.');
  return { nombre, email, genero, grado, presidente: datos.presidente };
}

export function exigirEspacioEnQuorum(existentes) {
  if (existentes.length >= MAX_INTEGRANTES) {
    throw new ApiError('LIMITE_ALCANZADO', `El Pleno admite como máximo ${MAX_INTEGRANTES} integrantes.`);
  }
}

export function validarSecretario(datos, catalogos) {
  const nombre = exigirTexto(datos.nombre, 'El nombre');
  const email = typeof datos.email === 'string' ? datos.email.trim() : '';
  if (email && !FORMATO_EMAIL.test(email)) throw new ApiError('VALIDACION', 'El correo no tiene un formato válido.');
  const genero = exigirEnCatalogo(catalogos.generos, datos.genero, 'Género inválido.');
  return { nombre, email, genero };
}

const MAX_ASUNTO = 300;
const MAX_CUERPO = 20000;
const MAX_EXTERNOS = 10;
const MAX_BYTES_EXTERNOS = 25 * 1024 * 1024;

function claveNombre(texto) {
  return texto.toLowerCase();
}

function exigirCorreo(valor, etiqueta) {
  const correo = typeof valor === 'string' ? valor.trim() : '';
  if (!correo) throw new ApiError('VALIDACION', `${etiqueta} es obligatorio.`);
  if (!FORMATO_EMAIL.test(correo)) throw new ApiError('VALIDACION', `${etiqueta} no tiene un formato válido.`);
  return correo;
}

function normalizarListaCorreos(valor, etiqueta) {
  if (!Array.isArray(valor)) throw new ApiError('VALIDACION', `${etiqueta} debe ser una lista de correos.`);
  const vistos = new Set();
  const salida = [];
  valor.forEach((c) => {
    const correo = exigirCorreo(c, `Cada correo de ${etiqueta}`);
    if (vistos.has(claveNombre(correo))) return;
    vistos.add(claveNombre(correo));
    salida.push(correo);
  });
  return salida;
}

export function validarContactoCorreo(datos, existentes) {
  const nombre = exigirTexto(datos.nombre, 'El nombre');
  const correo = exigirCorreo(datos.correo, 'El correo');
  if (existentes.some((x) => claveNombre(x.correo) === claveNombre(correo))) {
    throw new ApiError('DUPLICADO', 'Ya existe un contacto con ese correo.');
  }
  return { nombre, correo };
}

export function validarPlantillaCorreo(datos, existentes) {
  const nombre = exigirTexto(datos.nombre, 'El nombre');
  const asunto = exigirTexto(datos.asunto, 'El asunto');
  const cuerpoDoc = docDeEntrada(datos, 'cuerpo');
  if (textoPlanoDeDoc(cuerpoDoc).length > MAX_CUERPO) throw new ApiError('VALIDACION', 'El cuerpo es demasiado largo.');
  if (existentes.some((x) => claveNombre(x.nombre) === claveNombre(nombre))) {
    throw new ApiError('DUPLICADO', 'Ya existe una plantilla con ese nombre.');
  }
  return { nombre, asunto, cuerpoDoc };
}

export function validarListaCorreo(datos, existentes) {
  const nombre = exigirTexto(datos.nombre, 'El nombre');
  const correos = normalizarListaCorreos(datos.correos, 'La lista');
  if (correos.length === 0) throw new ApiError('VALIDACION', 'La lista necesita al menos un correo.');
  if (existentes.some((x) => claveNombre(x.nombre) === claveNombre(nombre))) {
    throw new ApiError('DUPLICADO', 'Ya existe una lista con ese nombre.');
  }
  return { nombre, correos };
}

export function validarCorreoRemitente(remitenteId, correo, catalogos) {
  exigirEnCatalogo(catalogos.remitentes, remitenteId, 'Remitente inválido.');
  const limpio = typeof correo === 'string' ? correo.trim() : '';
  if (limpio && !FORMATO_EMAIL.test(limpio)) throw new ApiError('VALIDACION', 'El correo no tiene un formato válido.');
  return limpio;
}

export function validarEnvioCorreo(datos) {
  const para = normalizarListaCorreos(datos.para ?? [], 'Los destinatarios');
  const cc = normalizarListaCorreos(datos.cc ?? [], 'La copia');
  const cco = normalizarListaCorreos(datos.cco ?? [], 'La copia oculta');
  if (para.length === 0) throw new ApiError('VALIDACION', 'Indica al menos un destinatario.');
  const asunto = typeof datos.asunto === 'string' ? datos.asunto.trim() : '';
  if (!asunto) throw new ApiError('VALIDACION', 'El asunto es obligatorio.');
  if (asunto.length > MAX_ASUNTO) throw new ApiError('VALIDACION', 'El asunto es demasiado largo.');
  const cuerpoDoc = docDeEntrada(datos, 'cuerpo');
  if (textoPlanoDeDoc(cuerpoDoc).length > MAX_CUERPO) throw new ApiError('VALIDACION', 'El cuerpo es demasiado largo.');
  const archivosPunto = Array.isArray(datos.archivosPunto) ? [...new Set(datos.archivosPunto)] : [];
  const archivosExternos = Array.isArray(datos.archivosExternos) ? datos.archivosExternos : [];
  if (archivosExternos.length > MAX_EXTERNOS) throw new ApiError('ARCHIVO_INVALIDO', `Máximo ${MAX_EXTERNOS} archivos externos.`);
  if (archivosExternos.reduce((t, f) => t + (f?.size ?? 0), 0) > MAX_BYTES_EXTERNOS) {
    throw new ApiError('ARCHIVO_INVALIDO', 'Los archivos externos superan los 25 MB en total.');
  }
  return { para, cc, cco, asunto, cuerpoDoc, archivosPunto, archivosExternos };
}

export function diferenciaTexto(anterior, nuevo) {
  const a = (anterior || '').trim();
  const n = (nuevo || '').trim();
  if (a === n) return { tipo: 'modificado', fragmento: '' };
  const palabrasA = a.split(/\s+/).filter(Boolean);
  const palabrasN = n.split(/\s+/).filter(Boolean);
  let inicio = 0;
  while (inicio < palabrasA.length && inicio < palabrasN.length && palabrasA[inicio] === palabrasN[inicio]) inicio++;
  let finA = palabrasA.length;
  let finN = palabrasN.length;
  while (finA > inicio && finN > inicio && palabrasA[finA - 1] === palabrasN[finN - 1]) { finA--; finN--; }
  const quitado = palabrasA.slice(inicio, finA).join(' ');
  const agregado = palabrasN.slice(inicio, finN).join(' ');
  if (!quitado && agregado) return { tipo: 'agregado', fragmento: agregado };
  if (quitado && !agregado) return { tipo: 'eliminado', fragmento: quitado };
  if (quitado && agregado) return { tipo: 'modificado', fragmentoAnterior: quitado, fragmento: agregado };
  return { tipo: 'modificado', fragmento: n };
}

const MIME_WORD = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

export function archivoAutomatico(origen, clave, nombre) {
  return {
    id: `auto:${origen}:${clave}`,
    nombre,
    tipo: MIME_WORD,
    tamano: null,
    origen,
    autogenerado: true,
    creadoEn: null,
    creadoPor: 'sistema',
  };
}

export function nombreArchivoPunto(numero, primero = 1) {
  return `${String(primero).padStart(2, '0')}-Punto de acuerdo_PLE${String(numero).padStart(3, '0')}.docx`;
}

export function numerarArchivos(archivos, primero = 1) {
  const guardados = archivos.filter((a) => !a.autogenerado && !a.informativo).map((a, i) => ({ a, o: a.orden ?? i + 1 }));
  const porOrden = (x, y) => x.o - y.o;
  const sueltos = guardados.filter(({ a }) => !a.ruta).sort(porOrden).map(({ a }) => a);
  const enCarpeta = guardados.filter(({ a }) => a.ruta);
  const rutas = [...new Set(enCarpeta.map(({ a }) => a.ruta))].sort((x, y) => x.localeCompare(y));
  const resultado = [...archivos.filter((a) => a.autogenerado), ...sueltos].map((a, i) => ({ ...a, numero: primero + i }));
  rutas.forEach((ruta) => {
    enCarpeta.filter(({ a }) => a.ruta === ruta).sort(porOrden).forEach(({ a }, i) => resultado.push({ ...a, numero: i + 1 }));
  });
  return [...resultado, ...archivos.filter((a) => a.informativo)];
}

export function nombreArchivoOrdenDia(numeroSesion, nombreTipo) {
  const titulo = numeroSesion ? `SESIÓN ${nombreTipo.toUpperCase()} NÚMERO ${numeroSesion}` : 'PROYECTO DEL ORDEN DEL DÍA';
  return `Orden del dia - ${titulo}.docx`;
}

export function nombreArchivoActa(numeroSesion, nombreTipo) {
  const titulo = numeroSesion ? `SESIÓN ${nombreTipo.toUpperCase()} NÚMERO ${numeroEnLetras(numeroSesion).toUpperCase()}` : 'ACTA DE SESIÓN';
  return `Acta - ${titulo}.docx`;
}

export function archivosAutomaticosDe(punto, { conHoja, primero = 1, sesion, sesiones, infoSesiones, nombreTipo }) {
  if (!punto.fijo) {
    return conHoja ? [archivoAutomatico('punto', punto.id, nombreArchivoPunto(punto.numero, primero))] : [];
  }
  const { clave } = analizarPuntoFijo(punto.id);
  if (clave === 'orden-dia') {
    if (!sesion.listaCerrada) return [];
    const info = infoSesiones.get(sesion.id);
    return [archivoAutomatico('ordenDia', sesion.id, nombreArchivoOrdenDia(info?.numeroSesion, nombreTipo(info?.tipo)))];
  }
  let referenciada = null;
  if (clave === 'acta-anterior') {
    referenciada = sesiones.filter((x) => tipoDeSesion(x) === 'ordinaria' && x.id < sesion.id).sort((a, b) => (a.id < b.id ? -1 : 1)).pop();
  } else if (clave.startsWith('acta-auto-')) {
    referenciada = sesiones.find((x) => x.id === clave.slice('acta-auto-'.length));
  }
  if (!referenciada?.celebrada) return [];
  const info = infoSesiones.get(referenciada.id);
  return [archivoAutomatico('acta', referenciada.id, nombreArchivoActa(info?.numeroSesion, nombreTipo(info?.tipo)))];
}
