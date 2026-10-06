import { ApiError } from '../ApiError.js';

const CAMPOS_PUNTO = ['seccion', 'remitente', 'contenido', 'acuerdo', 'confidencial', 'contenidoDoc', 'acuerdoDoc', 'plantilla', 'introDoc', 'puenteDoc', 'bloquesActa'];
const MAX_TEXTO = 20000;
const MAX_BYTES_ARCHIVO = 100 * 1024 * 1024;
const MAX_ARCHIVOS_PUNTO = 30;
const EXTENSIONES_PERMITIDAS = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg', 'gif', 'webp'];

const USUARIO = { id: 'usuario-local', nombre: 'Capturista local', rol: 'capturista' };

export function usuarioActual() {
  return USUARIO;
}

export function exigirEscritura() {
  if (USUARIO.rol !== 'capturista') {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para modificar.');
  }
}

export function puedeVerConfidencial() {
  return USUARIO.rol === 'capturista';
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

export function calcularEstados(sesiones) {
  const hoyISO = fechaISO(new Date());
  const ordenadas = [...sesiones].sort((a, b) => (a.id < b.id ? -1 : 1));
  const proxima = ordenadas.find((s) => s.id >= hoyISO && !s.celebrada);
  let anioActual = null;
  let consecutivo = 0;
  return ordenadas.map((s) => {
    const anio = s.id.slice(0, 4);
    if (anio !== anioActual) {
      anioActual = anio;
      consecutivo = 0;
    }
    let estado = 'pendiente';
    if (s.celebrada) estado = 'celebrada';
    else if (proxima && s.id === proxima.id) estado = 'proxima';
    else if (s.id < hoyISO) estado = 'no-celebrada';
    if (estado !== 'no-celebrada') consecutivo += 1;
    return {
      id: s.id,
      numeroSesion: estado === 'no-celebrada' ? null : consecutivo,
      estado,
      celebrada: !!s.celebrada,
      celebradaEn: s.celebradaEn || null,
      listaCerrada: !!s.listaCerrada,
      version: s.version,
    };
  });
}

const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

function fechaLarga(id) {
  const d = new Date(id + 'T00:00:00');
  return `${d.getDate()} de ${MESES_LARGOS[d.getMonth()]} de ${d.getFullYear()}`;
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

export function generarPuntosFijos(sesion, sesiones, catalogoFijos) {
  const anterior = sesiones.filter((s) => s.id < sesion.id).sort((a, b) => (a.id < b.id ? -1 : 1)).pop();
  const fecha = anterior ? fechaLarga(anterior.id) : '';
  return (catalogoFijos || [])
    .map((f, i) => ({ f, i }))
    .filter(({ f }) => cumpleCondicion(f.requiere, anterior))
    .map(({ f, i }) => ({
      id: `fijo:${sesion.id}:${f.id}`,
      sesionId: sesion.id,
      seccion: f.seccion,
      remitente: f.remitente,
      contenido: f.texto.replaceAll('{tipo}', 'ordinaria').replaceAll('{fecha}', fecha),
      acuerdo: '',
      confidencial: false,
      archivos: [],
      orden: i,
      tratado: !!sesion.fijosTratados?.[f.id],
      textoVotacion: f.textoVoto ?? null,
      fijo: true,
      encabezado: !!f.encabezado,
      version: 1,
      creadoPor: 'sistema',
      creadoEn: sesion.creadaEn ?? '',
      modificadoEn: sesion.creadaEn ?? '',
    }));
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
    contenidoDoc: null, acuerdoDoc: null, introDoc: null, puenteDoc: null, bloquesActa: [],
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

export function validarArchivos(archivos, yaAdjuntos = 0) {
  if (!Array.isArray(archivos)) throw new ApiError('ARCHIVO_INVALIDO', 'Lista de archivos inválida.');
  if (yaAdjuntos + archivos.length > MAX_ARCHIVOS_PUNTO) {
    throw new ApiError('ARCHIVO_INVALIDO', `Un punto admite como máximo ${MAX_ARCHIVOS_PUNTO} archivos.`);
  }
  archivos.forEach((a) => {
    if (!(a instanceof File) || a.name.length === 0) throw new ApiError('ARCHIVO_INVALIDO', 'Archivo inválido.');
    const extension = a.name.split('.').pop().toLowerCase();
    if (!EXTENSIONES_PERMITIDAS.includes(extension)) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}»: tipo de archivo no permitido.`);
    }
    if (a.size > MAX_BYTES_ARCHIVO) {
      throw new ApiError('ARCHIVO_INVALIDO', `«${a.name}» supera el máximo de 100 MB.`);
    }
  });
}

export function prepararArchivos(puntoId, archivos) {
  const ahora = new Date().toISOString();
  const creadoPor = USUARIO.id;
  const registros = archivos.map((a) => ({
    id: crypto.randomUUID(), puntoId, nombre: a.name, tipo: a.type, tamano: a.size, creadoEn: ahora, creadoPor, blob: a,
  }));
  const metadatos = registros.map((r) => ({
    id: r.id, nombre: r.nombre, tipo: r.tipo, tamano: r.tamano, creadoEn: r.creadoEn, creadoPor: r.creadoPor,
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

function docDeEntrada(p, campo) {
  const doc = p[campo + 'Doc'];
  if (doc !== undefined && doc !== null) return validarDocumento(doc);
  return docDesdeTexto(typeof p[campo] === 'string' ? p[campo].trim() : '');
}

export function normalizarPunto(p, catalogos) {
  const seccion = buscarSeccion(catalogos, p.seccion);
  const omision = hojaPorOmision(catalogos, p.plantilla ?? seccion.plantillaPorOmision);
  const plantilla = p.plantilla ?? omision.plantilla;
  if (!(catalogos.plantillasActa || []).some((x) => x.id === plantilla)) throw invalido('Plantilla inválida.');
  return {
    seccion: p.seccion,
    remitente: p.remitente,
    contenidoDoc: docDeEntrada(p, 'contenido'),
    acuerdoDoc: seccion.requiereAcuerdo ? docDeEntrada(p, 'acuerdo') : docVacio(),
    confidencial: p.confidencial,
    plantilla,
    introDoc: p.introDoc != null ? validarDocumento(p.introDoc) : omision.introDoc,
    puenteDoc: p.puenteDoc != null ? validarDocumento(p.puenteDoc) : omision.puenteDoc,
    bloquesActa: p.bloquesActa != null ? normalizarBloques(p.bloquesActa, catalogos) : omision.bloquesActa,
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
