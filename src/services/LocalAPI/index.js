import { ApiError } from '../ApiError.js';
import {
  STORE_SESIONES, STORE_PUNTOS, STORE_CATALOGOS, STORE_ARCHIVOS, STORE_CALENDARIOS, STORE_INTEGRANTES, STORE_SECRETARIO,
  obtenerTodos, obtener, guardar, escribirVarios,
} from './db.js';
import {
  usuarioActual, exigirEscritura, puedeVerConfidencial,
  validarFechasISO, calcularEstados, validarCalendario, validarAsueto, generarFechasAnuales, enVacaciones,
  camposPunto, validarPunto, normalizarPunto,
  esPuntoFijo, analizarPuntoFijo, exigirNoFijo, exigirListaAbierta, validarVotacion, decorarPunto, engroseDePunto, generarPuntosFijos, ordenarPuntosDocumento, ocultarConfidencial,
  validarArchivos, prepararArchivos,
  combinarCambios, validarHoraDelDia, conHoraDelDia, fechasDisponiblesExtraordinaria, tipoDeSesion, decorarIntegrante, validarIntegrante, exigirEspacioEnQuorum, validarSecretario,
} from './reglas.js';

async function exigirSesionAbierta(sesionId) {
  const sesion = await obtener(STORE_SESIONES, sesionId);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  if (sesion.celebrada) throw new ApiError('SESION_CELEBRADA', 'La sesión ya fue celebrada y no admite cambios.');
  return sesion;
}

function porOrden(a, b) {
  if (a.orden !== b.orden) return a.orden - b.orden;
  if (a.creadoEn !== b.creadoEn) return a.creadoEn < b.creadoEn ? -1 : 1;
  return a.id < b.id ? -1 : 1;
}

function siguienteOrden(todos, sesionId, seccion) {
  const ordenes = todos.filter((p) => p.sesionId === sesionId && p.seccion === seccion).map((p) => p.orden);
  return Math.max(0, ...ordenes) + 1;
}

export async function listarCatalogos() {
  const filas = await obtenerTodos(STORE_CATALOGOS);
  return Object.fromEntries(filas.map((f) => [f.nombre, f.items]));
}

async function catalogosConIntegrantes() {
  const catalogos = await listarCatalogos();
  return { ...catalogos, integrantes: await listarIntegrantes() };
}

export async function listarSesiones() {
  return calcularEstados(await obtenerTodos(STORE_SESIONES));
}

export async function crearSesiones(fechas) {
  exigirEscritura();
  validarFechasISO(fechas);
  const existentes = new Set((await obtenerTodos(STORE_SESIONES)).map((s) => s.id));
  const ahora = new Date().toISOString();
  for (const id of new Set(fechas)) {
    if (existentes.has(id)) continue;
    await guardar(STORE_SESIONES, {
      id, tipo: 'ordinaria', celebrada: false, celebradaEn: null, version: 1,
      creadaEn: ahora, creadaPor: usuarioActual().id,
    });
  }
  return listarSesiones();
}

export async function obtenerCalendario(anio) {
  if (!Number.isInteger(anio)) throw new ApiError('VALIDACION', 'El año del calendario es inválido.');
  return (await obtener(STORE_CALENDARIOS, anio)) ?? null;
}

async function puntosPorSesion() {
  return new Set((await obtenerTodos(STORE_PUNTOS)).map((p) => p.sesionId));
}

function nuevaSesion(id, ahora) {
  return { id, tipo: 'ordinaria', celebrada: false, celebradaEn: null, version: 1, creadaEn: ahora, creadaPor: usuarioActual().id };
}

function registroCalendario(calendario, existente, ahora) {
  return {
    ...calendario,
    version: (existente?.version ?? 0) + 1,
    modificadoEn: ahora,
    modificadoPor: usuarioActual().id,
  };
}

export async function generarCalendarioAnual(anio, datos, sobrescribir) {
  exigirEscritura();
  const base = validarCalendario(anio, datos);
  const existente = await obtener(STORE_CALENDARIOS, anio);
  if (existente && sobrescribir !== true) {
    throw new ApiError('CALENDARIO_EXISTE', `Ya existe un calendario para ${anio}. Marca «Sobrescribir» para regenerarlo.`);
  }
  const asuetos = existente && existente.diaSemana === base.diaSemana ? existente.asuetos : [];
  const calendario = { ...base, asuetos };
  const fechas = generarFechasAnuales(calendario);
  const sesiones = await obtenerTodos(STORE_SESIONES);
  const conPuntos = await puntosPorSesion();
  const ahora = new Date().toISOString();
  const nuevas = fechas.filter((id) => !sesiones.some((s) => s.id === id)).map((id) => nuevaSesion(id, ahora));
  const sobrantes = sobrescribir === true
    ? sesiones.filter((s) => s.id.startsWith(`${anio}-`) && !fechas.includes(s.id) && !s.celebrada && !conPuntos.has(s.id))
    : [];
  const registro = registroCalendario(calendario, existente, ahora);
  await escribirVarios({
    poner: [
      ...nuevas.map((valor) => ({ store: STORE_SESIONES, valor })),
      { store: STORE_CALENDARIOS, valor: registro },
    ],
    borrar: sobrantes.map((s) => ({ store: STORE_SESIONES, id: s.id })),
  });
  return { calendario: registro, sesiones: await listarSesiones() };
}

async function exigirCalendario(anio) {
  const calendario = await obtener(STORE_CALENDARIOS, anio);
  if (!calendario) throw new ApiError('NO_ENCONTRADO', `Aún no hay calendario para ${anio}. Genera el calendario primero.`);
  return calendario;
}

async function exigirSesionLibre(id, conPuntos, mensajePuntos) {
  const sesion = await obtener(STORE_SESIONES, id);
  if (!sesion) return null;
  if (sesion.celebrada) throw new ApiError('SESION_CELEBRADA', `La sesión del ${id} ya fue celebrada y no se puede reprogramar.`);
  if (conPuntos.has(id)) throw new ApiError('VALIDACION', mensajePuntos);
  return sesion;
}

export async function agregarAsueto(anio, asueto) {
  exigirEscritura();
  const calendario = await exigirCalendario(anio);
  const nuevo = validarAsueto(anio, calendario, asueto);
  const origen = await obtener(STORE_SESIONES, nuevo.fecha);
  if (!origen) throw new ApiError('VALIDACION', `No hay una sesión programada el ${nuevo.fecha}.`);
  if (tipoDeSesion(origen) !== 'ordinaria') throw new ApiError('VALIDACION', 'Las sesiones extraordinarias no se reprograman con asuetos.');
  await exigirSesionLibre(nuevo.fecha, await puntosPorSesion(), `La sesión del ${nuevo.fecha} ya tiene puntos; no se puede reprogramar.`);
  const destinoExiste = await obtener(STORE_SESIONES, nuevo.destino);
  if (destinoExiste && tipoDeSesion(destinoExiste) !== 'ordinaria') {
    throw new ApiError('VALIDACION', `El ${nuevo.destino} ya tiene una sesión extraordinaria; elige otro día.`);
  }
  const ahora = new Date().toISOString();
  const registro = registroCalendario({ ...calendario, asuetos: [...calendario.asuetos, nuevo] }, calendario, ahora);
  await escribirVarios({
    poner: [
      { store: STORE_CALENDARIOS, valor: registro },
      ...(destinoExiste ? [] : [{ store: STORE_SESIONES, valor: nuevaSesion(nuevo.destino, ahora) }]),
    ],
    borrar: [{ store: STORE_SESIONES, id: nuevo.fecha }],
  });
  return { calendario: registro, sesiones: await listarSesiones() };
}

export async function quitarAsueto(anio, fecha) {
  exigirEscritura();
  const calendario = await exigirCalendario(anio);
  const asueto = calendario.asuetos.find((a) => a.fecha === fecha);
  if (!asueto) throw new ApiError('NO_ENCONTRADO', `No hay un asueto registrado el ${fecha}.`);
  const destino = await exigirSesionLibre(
    asueto.destino,
    await puntosPorSesion(),
    `La sesión del ${asueto.destino} ya tiene puntos; no se puede devolver al ${fecha}.`,
  );
  if (destino && tipoDeSesion(destino) !== 'ordinaria') {
    throw new ApiError('VALIDACION', `La sesión del ${asueto.destino} es extraordinaria; no se puede devolver al ${fecha}.`);
  }
  const origenExiste = await obtener(STORE_SESIONES, fecha);
  const ahora = new Date().toISOString();
  const restantes = calendario.asuetos.filter((a) => a.fecha !== fecha);
  const registro = registroCalendario({ ...calendario, asuetos: restantes }, calendario, ahora);
  const recrear = !origenExiste && !enVacaciones(calendario.vacaciones, fecha);
  await escribirVarios({
    poner: [
      { store: STORE_CALENDARIOS, valor: registro },
      ...(recrear ? [{ store: STORE_SESIONES, valor: nuevaSesion(fecha, ahora) }] : []),
    ],
    borrar: destino ? [{ store: STORE_SESIONES, id: asueto.destino }] : [],
  });
  return { calendario: registro, sesiones: await listarSesiones() };
}

export async function listarFechasExtraordinaria() {
  return fechasDisponiblesExtraordinaria(await obtenerTodos(STORE_SESIONES), await obtenerTodos(STORE_CALENDARIOS));
}

export async function crearSesionExtraordinaria(fecha) {
  exigirEscritura();
  validarFechasISO([fecha]);
  if (!(await listarFechasExtraordinaria()).includes(fecha)) {
    throw new ApiError('FECHA_NO_DISPONIBLE', 'Esa fecha no está disponible para una sesión extraordinaria.');
  }
  await guardar(STORE_SESIONES, { ...nuevaSesion(fecha, new Date().toISOString()), tipo: 'extraordinaria' });
  return (await listarSesiones()).find((s) => s.id === fecha);
}

export async function eliminarSesion(id) {
  exigirEscritura();
  const sesion = await obtener(STORE_SESIONES, id);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  if (tipoDeSesion(sesion) !== 'extraordinaria') {
    throw new ApiError('SESION_ORDINARIA', 'Las sesiones ordinarias no se pueden eliminar, solo ajustar con vacaciones o asuetos.');
  }
  if (sesion.celebrada) throw new ApiError('SESION_CELEBRADA', 'La sesión ya fue celebrada y no se puede eliminar.');
  const puntos = (await obtenerTodos(STORE_PUNTOS)).filter((p) => p.sesionId === id);
  const idsPuntos = new Set(puntos.map((p) => p.id));
  const archivos = (await obtenerTodos(STORE_ARCHIVOS)).filter((a) => idsPuntos.has(a.puntoId));
  await escribirVarios({
    borrar: [
      { store: STORE_SESIONES, id },
      ...puntos.map((p) => ({ store: STORE_PUNTOS, id: p.id })),
      ...archivos.map((a) => ({ store: STORE_ARCHIVOS, id: a.id })),
    ],
  });
  return listarSesiones();
}

export async function establecerListaCerrada(id, cerrada) {
  exigirEscritura();
  if (typeof cerrada !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "cerrada" debe ser verdadero o falso.');
  const sesion = await exigirSesionAbierta(id);
  if (!!sesion.listaCerrada !== cerrada) {
    await guardar(STORE_SESIONES, { ...sesion, listaCerrada: cerrada, version: sesion.version + 1 });
  }
  return (await listarSesiones()).find((s) => s.id === id);
}

export async function celebrarSesion(id) {
  exigirEscritura();
  const sesion = await obtener(STORE_SESIONES, id);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  if (sesion.celebrada) throw new ApiError('SESION_CELEBRADA', 'La sesión ya fue celebrada.');
  if (!sesion.listaCerrada) throw new ApiError('LISTA_ABIERTA', 'Debes cerrar la lista de puntos antes de celebrar la sesión.');
  if (!sesion.horaInicio) throw new ApiError('SESION_NO_COMENZADA', 'Debes comenzar la sesión antes de celebrarla.');
  const ahora = new Date().toISOString();
  const ausentes = sesion.ausentes ?? [];
  const secretario = await obtenerSecretarioEjecutivo();
  const asistentes = (await listarIntegrantes()).map((i) => ({
    integranteId: i.id, nombre: i.nombre, tratamiento: i.tratamiento, presidente: !!i.presidente, presente: !ausentes.includes(i.id),
  }));
  await guardar(STORE_SESIONES, {
    ...sesion, celebrada: true, celebradaEn: ahora, horaFin: ahora, asistentes, secretarioEjecutivo: secretario ? { nombre: secretario.nombre } : null, version: sesion.version + 1,
  });
  const lista = await listarSesiones();
  return lista.find((s) => s.id === id);
}

export async function comenzarSesion(id) {
  exigirEscritura();
  const sesion = await exigirSesionAbierta(id);
  if (!sesion.listaCerrada) throw new ApiError('LISTA_ABIERTA', 'Debes cerrar la lista de puntos antes de comenzar la sesión.');
  if (!sesion.horaInicio) {
    await guardar(STORE_SESIONES, { ...sesion, horaInicio: new Date().toISOString(), version: sesion.version + 1 });
  }
  return (await listarSesiones()).find((s) => s.id === id);
}

export async function editarHorario(id, cambios) {
  exigirEscritura();
  const sesion = await obtener(STORE_SESIONES, id);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  const claves = ['horaInicio', 'horaFin'].filter((k) => cambios && k in cambios);
  if (claves.length === 0) throw new ApiError('VALIDACION', 'Indica la hora de inicio o la de fin.');
  const nuevo = { ...sesion };
  claves.forEach((clave) => {
    validarHoraDelDia(cambios[clave]);
    if (!sesion[clave]) {
      throw new ApiError('VALIDACION', clave === 'horaInicio' ? 'La sesión aún no ha comenzado.' : 'La sesión aún no ha terminado.');
    }
    nuevo[clave] = conHoraDelDia(sesion[clave], cambios[clave]);
  });
  if (nuevo.horaInicio && nuevo.horaFin && nuevo.horaInicio > nuevo.horaFin) {
    throw new ApiError('HORARIO_INVALIDO', claves.includes('horaInicio')
      ? 'La hora de inicio no puede ser posterior a la hora de fin.'
      : 'La hora de fin no puede ser anterior a la hora de inicio.');
  }
  await guardar(STORE_SESIONES, { ...nuevo, version: sesion.version + 1 });
  return (await listarSesiones()).find((s) => s.id === id);
}

async function armarPuntos(sesionId) {
  const sesiones = await obtenerTodos(STORE_SESIONES);
  const sesion = sesiones.find((s) => s.id === sesionId);
  if (!sesion) return [];
  const catalogos = await catalogosConIntegrantes();
  const almacenados = (await obtenerTodos(STORE_PUNTOS)).filter((p) => p.sesionId === sesionId);
  const fijos = generarPuntosFijos(sesion, sesiones, catalogos.puntosFijos);
  const secretario = sesion.secretarioEjecutivo ?? await obtenerSecretarioEjecutivo();
  const presidente = sesion.asistentes
    ? sesion.asistentes.find((a) => a.presidente)
    : (catalogos.integrantes || []).find((i) => i.presidente);
  const contexto = { sesion, tipo: tipoDeSesion(sesion), presidente, secretario };
  return ordenarPuntosDocumento([...fijos, ...almacenados], catalogos.secciones || []).map((punto) => {
    const decorado = decorarPunto(punto, catalogos);
    const conHoja = !!(catalogos.secciones || []).find((s) => s.id === punto.seccion)?.requiereAcuerdo;
    return { ...decorado, engrose: conHoja ? engroseDePunto(decorado, contexto, catalogos) : null };
  });
}

async function puntoArmado(sesionId, id) {
  return (await armarPuntos(sesionId)).find((p) => p.id === id);
}

export async function listarPuntos(sesionId) {
  const lista = await armarPuntos(sesionId);
  return puedeVerConfidencial() ? lista : lista.map(ocultarConfidencial);
}

export async function crearPunto(sesionId, datos) {
  exigirEscritura();
  if (!sesionId) throw new ApiError('VALIDACION', 'Debes indicar la sesión del punto.');
  const sesion = await exigirSesionAbierta(sesionId);
  const catalogos = await listarCatalogos();
  validarPunto(datos, catalogos);
  exigirListaAbierta(sesion, datos.seccion, catalogos);
  const archivos = Array.from(datos.archivos || []);
  validarArchivos(archivos);
  const id = crypto.randomUUID();
  const { registros, metadatos } = prepararArchivos(id, archivos);
  const orden = siguienteOrden(await obtenerTodos(STORE_PUNTOS), sesionId, datos.seccion);
  const ahora = new Date().toISOString();
  const punto = {
    id,
    sesionId,
    ...normalizarPunto(datos, catalogos),
    archivos: metadatos,
    orden,
    tratado: false,
    votacion: null,
    version: 1,
    creadoPor: usuarioActual().id,
    creadoEn: ahora,
    modificadoEn: ahora,
  };
  await escribirVarios({
    poner: [
      { store: STORE_PUNTOS, valor: punto },
      ...registros.map((valor) => ({ store: STORE_ARCHIVOS, valor })),
    ],
  });
  return puntoArmado(sesionId, id);
}

export async function editarPunto(id, version, cambios) {
  exigirEscritura();
  exigirNoFijo(id);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  const sesion = await exigirSesionAbierta(actual.sesionId);
  exigirListaAbierta(sesion);
  if (actual.version !== version) {
    throw new ApiError('CONFLICTO', 'El punto cambió desde que lo cargaste. Recarga e intenta de nuevo.');
  }
  const combinado = combinarCambios(actual, cambios);
  const catalogos = await listarCatalogos();
  validarPunto(combinado, catalogos);
  const cambiaSeccion = combinado.seccion !== actual.seccion;
  const { contenido: _contenido, acuerdo: _acuerdo, ...almacenado } = actual;
  const punto = {
    ...almacenado,
    ...normalizarPunto(combinado, catalogos),
    orden: cambiaSeccion ? siguienteOrden(await obtenerTodos(STORE_PUNTOS), actual.sesionId, combinado.seccion) : actual.orden,
    ...(cambiaSeccion ? { votacion: null } : {}),
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await guardar(STORE_PUNTOS, punto);
  return puntoArmado(punto.sesionId, id);
}

async function marcarFijo(id, tratado) {
  const { sesionId, clave } = analizarPuntoFijo(id);
  await exigirSesionAbierta(sesionId);
  const punto = await puntoArmado(sesionId, id);
  if (!punto) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  if (punto.encabezado) throw new ApiError('VALIDACION', 'Este punto no se marca como tratado.');
  if (!!punto.tratado !== tratado) {
    const sesion = await obtener(STORE_SESIONES, sesionId);
    await guardar(STORE_SESIONES, { ...sesion, fijosTratados: { ...(sesion.fijosTratados ?? {}), [clave]: tratado } });
  }
  return puntoArmado(sesionId, id);
}

export async function marcarPunto(id, tratado) {
  exigirEscritura();
  if (typeof tratado !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "tratado" debe ser verdadero o falso.');
  if (esPuntoFijo(id)) return marcarFijo(id, tratado);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  if (!!actual.tratado !== tratado) {
    await guardar(STORE_PUNTOS, { ...actual, tratado, version: actual.version + 1, modificadoEn: new Date().toISOString() });
  }
  return puntoArmado(actual.sesionId, id);
}

export async function registrarVotacion(id, votacion) {
  exigirEscritura();
  exigirNoFijo(id);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  const catalogos = await catalogosConIntegrantes();
  const seccion = (catalogos.secciones || []).find((x) => x.id === actual.seccion);
  if (!actual.tratado) {
    throw new ApiError('VALIDACION', 'El punto debe estar marcado como tratado para registrar su votación.');
  }
  const nueva = validarVotacion(votacion ?? null, catalogos, !seccion?.requiereAcuerdo);
  if (JSON.stringify(nueva) !== JSON.stringify(actual.votacion ?? null)) {
    await guardar(STORE_PUNTOS, { ...actual, votacion: nueva, version: actual.version + 1, modificadoEn: new Date().toISOString() });
  }
  return puntoArmado(actual.sesionId, id);
}

export async function marcarPuntos(sesionId, tratado) {
  exigirEscritura();
  if (typeof tratado !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "tratado" debe ser verdadero o falso.');
  await exigirSesionAbierta(sesionId);
  const lista = await armarPuntos(sesionId);
  const ahora = new Date().toISOString();
  const cambiados = (await obtenerTodos(STORE_PUNTOS))
    .filter((p) => p.sesionId === sesionId && !!p.tratado !== tratado)
    .map((p) => ({ ...p, tratado, version: p.version + 1, modificadoEn: ahora }));
  const clavesFijas = lista.filter((p) => p.fijo && !p.encabezado).map((p) => analizarPuntoFijo(p.id).clave);
  const sesion = await obtener(STORE_SESIONES, sesionId);
  const hayFijosPorCambiar = clavesFijas.some((c) => !!sesion.fijosTratados?.[c] !== tratado);
  await escribirVarios({
    poner: [
      ...cambiados.map((valor) => ({ store: STORE_PUNTOS, valor })),
      ...(hayFijosPorCambiar
        ? [{
            store: STORE_SESIONES,
            valor: { ...sesion, fijosTratados: { ...(sesion.fijosTratados ?? {}), ...Object.fromEntries(clavesFijas.map((c) => [c, tratado])) } },
          }]
        : []),
    ],
  });
  return armarPuntos(sesionId);
}

export async function eliminarPunto(id) {
  exigirEscritura();
  exigirNoFijo(id);
  const actual = await obtener(STORE_PUNTOS, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  exigirListaAbierta(await exigirSesionAbierta(actual.sesionId));
  await escribirVarios({
    borrar: [
      { store: STORE_PUNTOS, id },
      ...actual.archivos.filter((a) => a.id).map((a) => ({ store: STORE_ARCHIVOS, id: a.id })),
    ],
  });
}

export async function adjuntarArchivos(puntoId, archivos) {
  exigirEscritura();
  exigirNoFijo(puntoId);
  const actual = await obtener(STORE_PUNTOS, puntoId);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  const nuevos = Array.from(archivos || []);
  validarArchivos(nuevos, actual.archivos.length);
  const { registros, metadatos } = prepararArchivos(puntoId, nuevos);
  const punto = {
    ...actual,
    archivos: [...actual.archivos, ...metadatos],
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await escribirVarios({
    poner: [
      { store: STORE_PUNTOS, valor: punto },
      ...registros.map((valor) => ({ store: STORE_ARCHIVOS, valor })),
    ],
  });
  return puntoArmado(actual.sesionId, puntoId);
}

export async function eliminarArchivo(puntoId, archivoId) {
  exigirEscritura();
  exigirNoFijo(puntoId);
  const actual = await obtener(STORE_PUNTOS, puntoId);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El punto no existe.');
  await exigirSesionAbierta(actual.sesionId);
  if (!actual.archivos.some((a) => a.id === archivoId)) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  const punto = {
    ...actual,
    archivos: actual.archivos.filter((a) => a.id !== archivoId),
    version: actual.version + 1,
    modificadoEn: new Date().toISOString(),
  };
  await escribirVarios({
    poner: [{ store: STORE_PUNTOS, valor: punto }],
    borrar: [{ store: STORE_ARCHIVOS, id: archivoId }],
  });
  return puntoArmado(actual.sesionId, puntoId);
}

export async function descargarArchivo(archivoId) {
  const registro = await obtener(STORE_ARCHIVOS, archivoId);
  if (!registro) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  const punto = await obtener(STORE_PUNTOS, registro.puntoId);
  if (!punto) throw new ApiError('NO_ENCONTRADO', 'El archivo no existe.');
  if (punto.confidencial && !puedeVerConfidencial()) {
    throw new ApiError('NO_AUTORIZADO', 'No tienes permiso para ver este archivo.');
  }
  return { nombre: registro.nombre, tipo: registro.tipo, blob: registro.blob };
}

export async function reordenarPuntos(sesionId, seccion, ids) {
  exigirEscritura();
  exigirListaAbierta(await exigirSesionAbierta(sesionId));
  const catalogos = await listarCatalogos();
  if (!catalogos.secciones.some((s) => s.id === seccion)) throw new ApiError('VALIDACION', 'Sección inválida.');
  if (!Array.isArray(ids)) throw new ApiError('VALIDACION', 'El orden debe ser una lista de ids.');
  const actuales = (await obtenerTodos(STORE_PUNTOS))
    .filter((p) => p.sesionId === sesionId && p.seccion === seccion)
    .sort(porOrden);
  const mismoConjunto = ids.length === actuales.length
    && new Set(ids).size === ids.length
    && ids.every((id) => actuales.some((p) => p.id === id));
  if (!mismoConjunto) {
    throw new ApiError('CONFLICTO', 'Los puntos de la sección cambiaron. Recarga e intenta de nuevo.');
  }
  const ahora = new Date().toISOString();
  const cambiados = [];
  ids.forEach((id, i) => {
    const actual = actuales.find((p) => p.id === id);
    if (actual.orden === i + 1) return;
    cambiados.push({ ...actual, orden: i + 1, version: actual.version + 1, modificadoEn: ahora });
  });
  await escribirVarios({ poner: cambiados.map((valor) => ({ store: STORE_PUNTOS, valor })) });
  return (await armarPuntos(sesionId)).filter((p) => p.seccion === seccion);
}

export async function listarIntegrantes() {
  const catalogos = await listarCatalogos();
  const lista = await obtenerTodos(STORE_INTEGRANTES);
  return lista
    .sort((a, b) => (a.creadoEn !== b.creadoEn ? (a.creadoEn < b.creadoEn ? -1 : 1) : a.id < b.id ? -1 : 1))
    .map((i) => decorarIntegrante(i, catalogos));
}

export async function crearIntegrante(datos) {
  exigirEscritura();
  const catalogos = await listarCatalogos();
  const existentes = await obtenerTodos(STORE_INTEGRANTES);
  const campos = validarIntegrante(datos, catalogos, existentes);
  exigirEspacioEnQuorum(existentes);
  const ahora = new Date().toISOString();
  const nuevo = { id: crypto.randomUUID(), ...campos, version: 1, creadoEn: ahora, modificadoEn: ahora };
  const otros = campos.presidente
    ? existentes.filter((x) => x.presidente).map((x) => ({ ...x, presidente: false, version: x.version + 1, modificadoEn: ahora }))
    : [];
  await escribirVarios({ poner: [...otros, nuevo].map((valor) => ({ store: STORE_INTEGRANTES, valor })) });
  return decorarIntegrante(nuevo, catalogos);
}

export async function editarIntegrante(id, version, cambios) {
  exigirEscritura();
  const catalogos = await listarCatalogos();
  const existentes = await obtenerTodos(STORE_INTEGRANTES);
  const actual = existentes.find((x) => x.id === id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El integrante no existe.');
  if (actual.version !== version) {
    throw new ApiError('CONFLICTO', 'El integrante cambió desde que lo cargaste. Recarga e intenta de nuevo.');
  }
  const campos = validarIntegrante({ ...actual, ...cambios }, catalogos, existentes, id);
  const ahora = new Date().toISOString();
  const editado = { ...actual, ...campos, version: actual.version + 1, modificadoEn: ahora };
  const otros = campos.presidente
    ? existentes.filter((x) => x.id !== id && x.presidente).map((x) => ({ ...x, presidente: false, version: x.version + 1, modificadoEn: ahora }))
    : [];
  await escribirVarios({ poner: [...otros, editado].map((valor) => ({ store: STORE_INTEGRANTES, valor })) });
  return decorarIntegrante(editado, catalogos);
}

export async function eliminarIntegrante(id) {
  exigirEscritura();
  const actual = await obtener(STORE_INTEGRANTES, id);
  if (!actual) throw new ApiError('NO_ENCONTRADO', 'El integrante no existe.');
  const sesiones = await obtenerTodos(STORE_SESIONES);
  const celebradas = new Set(sesiones.filter((s) => s.celebrada).map((s) => s.id));
  const puntos = (await obtenerTodos(STORE_PUNTOS)).filter((p) => p.votacion?.quorum?.includes(id));
  if (puntos.some((p) => celebradas.has(p.sesionId))) {
    throw new ApiError('EN_USO', 'El integrante figura en la votación de una sesión ya celebrada y no se puede eliminar.');
  }
  const ahora = new Date().toISOString();
  const conAusencia = sesiones.filter((s) => !s.celebrada && s.ausentes?.includes(id));
  await escribirVarios({
    poner: [
      ...puntos.map((p) => ({
        store: STORE_PUNTOS,
        valor: { ...p, votacion: { ...p.votacion, quorum: p.votacion.quorum.filter((q) => q !== id) }, version: p.version + 1, modificadoEn: ahora },
      })),
      ...conAusencia.map((s) => ({
        store: STORE_SESIONES,
        valor: { ...s, ausentes: s.ausentes.filter((a) => a !== id), version: s.version + 1 },
      })),
    ],
    borrar: [{ store: STORE_INTEGRANTES, id }],
  });
}

function asistenciaDe(sesion, integrantes) {
  const ausentes = sesion.ausentes ?? [];
  return integrantes.map((i) => ({ integranteId: i.id, presente: !ausentes.includes(i.id) }));
}

export async function listarAsistencia(sesionId) {
  const sesion = await obtener(STORE_SESIONES, sesionId);
  if (!sesion) throw new ApiError('NO_ENCONTRADO', 'La sesión no existe.');
  if (sesion.asistentes) return sesion.asistentes.map(({ integranteId, presente }) => ({ integranteId, presente }));
  return asistenciaDe(sesion, await listarIntegrantes());
}

export async function registrarAsistencia(sesionId, integranteId, presente) {
  exigirEscritura();
  if (typeof presente !== 'boolean') throw new ApiError('VALIDACION', 'El valor de "presente" debe ser verdadero o falso.');
  const sesion = await exigirSesionAbierta(sesionId);
  const integrantes = await listarIntegrantes();
  if (!integrantes.some((i) => i.id === integranteId)) throw new ApiError('NO_ENCONTRADO', 'El integrante no existe.');
  const ausentes = (sesion.ausentes ?? []).filter((a) => a !== integranteId);
  const nuevos = presente ? ausentes : [...ausentes, integranteId];
  if (nuevos.length !== (sesion.ausentes ?? []).length || nuevos.some((a, i) => a !== (sesion.ausentes ?? [])[i])) {
    await guardar(STORE_SESIONES, { ...sesion, ausentes: nuevos, version: sesion.version + 1 });
  }
  return asistenciaDe({ ausentes: nuevos }, integrantes);
}

const ID_SECRETARIO = 'seple';

export async function obtenerSecretarioEjecutivo() {
  const actual = await obtener(STORE_SECRETARIO, ID_SECRETARIO);
  if (!actual) return null;
  const { id, ...secretario } = actual;
  return secretario;
}

export async function guardarSecretarioEjecutivo(datos) {
  exigirEscritura();
  const catalogos = await listarCatalogos();
  const campos = validarSecretario(datos, catalogos);
  const actual = await obtener(STORE_SECRETARIO, ID_SECRETARIO);
  const nuevo = { id: ID_SECRETARIO, ...campos, version: (actual?.version ?? 0) + 1, modificadoEn: new Date().toISOString() };
  await guardar(STORE_SECRETARIO, nuevo);
  return obtenerSecretarioEjecutivo();
}

export async function eliminarSecretarioEjecutivo() {
  exigirEscritura();
  await escribirVarios({ borrar: [{ store: STORE_SECRETARIO, id: ID_SECRETARIO }] });
}
