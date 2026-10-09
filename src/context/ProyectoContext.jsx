import { createContext, useContext, useEffect, useState } from 'react';
import {
  listarCatalogos, listarSesiones, celebrarSesion, comenzarSesion as comenzarSesionEnApi, editarHorario as editarHorarioEnApi, listarAsistencia, registrarAsistencia as registrarAsistenciaEnApi, listarFechasExtraordinaria, crearSesionExtraordinaria as crearSesionExtraordinariaEnApi, eliminarSesion as eliminarSesionEnApi, establecerListaCerrada as establecerListaCerradaEnApi,
  obtenerCalendario as obtenerCalendarioEnApi, generarCalendarioAnual as generarCalendarioAnualEnApi, resumenArchivoCalendario,
  agregarAsueto as agregarAsuetoEnApi, quitarAsueto as quitarAsuetoEnApi,
  listarPuntos, crearPunto, reordenarPuntos as reordenarPuntosEnApi, marcarPunto as marcarPuntoEnApi, marcarPuntos as marcarPuntosEnApi, enviarEngrose as enviarEngroseEnApi, registrarVotacion as registrarVotacionEnApi,
  editarPunto as editarPuntoEnApi, eliminarPunto as eliminarPuntoEnApi,
  retirarPunto as retirarPuntoEnApi, restaurarPunto as restaurarPuntoEnApi, listarPapelera,
  adjuntarArchivos as adjuntarArchivosEnApi, eliminarArchivo as eliminarArchivoEnApi, reordenarArchivos as reordenarArchivosEnApi,
  descargarArchivo as descargarArchivoEnApi,
  listarAvisosEdicion, enviarAvisoEdicion as enviarAvisoEdicionEnApi, descartarAvisoEdicion as descartarAvisoEdicionEnApi,
} from '../services/api.js';
import {
  guardarBorrador, obtenerBorrador, eliminarBorrador,
  guardarCache, obtenerCache,
} from '../services/SesionIndexedDB.js';
import { etiquetaFecha } from '../utils/fechas.js';
import { cargarLogo } from '../utils/logo.js';
import { esArchivoAutomatico, analizarIdAutomatico, generarArchivoAutomatico } from '../utils/archivosAutomaticos.js';

const ProyectoContext = createContext(null);

const CACHE_CATALOGOS = 'catalogos';
const CACHE_SESIONES = 'sesiones';
const cachePuntos = (sesionId) => `puntos:${sesionId}`;
const cacheAsistencia = (sesionId) => `asistencia:${sesionId}`;
const cacheAvisos = (sesionId) => `avisos:${sesionId}`;
const CACHE_PAPELERA = 'papelera';
const cacheCalendario = (anio) => `calendario:${anio}`;

const ANIO_CALENDARIO = new Date().getFullYear();

const conEtiqueta = (sesiones) => sesiones.map((s) => ({ ...s, label: etiquetaFecha(s.id) }));
const conSync = (punto) => ({ ...punto, sincronizacion: 'servidor' });
const porNumero = (lista) => [...lista].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

const CATALOGOS_VACIOS = { secciones: [], remitentes: [], categorias: [], tiposVoto: [], tiposVotacion: [], estadosVoto: [], generos: [], grados: [], tiposConocimiento: [], tiposSesion: [], plantillasActa: [], tiposBloqueActa: [], textosActa: [], considerandosFijos: [] };

export function ProyectoProvider({ children }) {
  const [fechasSesiones, setFechasSesiones] = useState([]);
  const [sesionActivaFecha, setSesionActivaFecha] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
  const [calendario, setCalendario] = useState(null);
  const [asistencia, setAsistencia] = useState([]);
  const [avisos, setAvisos] = useState([]);
  const [papelera, setPapelera] = useState([]);
  const [sesionDeDatos, setSesionDeDatos] = useState(null);
  const [cargas, setCargas] = useState({ catalogos: { cargando: true }, sesiones: { cargando: true }, calendario: { cargando: true }, puntos: {} });

  function marcarCarga(recurso, estado) {
    setCargas((c) => ({ ...c, [recurso]: estado }));
  }

  if (sesionActivaFecha === null) {
    const proxima = fechasSesiones.find((f) => f.estado === 'proxima');
    if (proxima) setSesionActivaFecha(proxima.id);
  }

  if (sesionDeDatos !== sesionActivaFecha) {
    setSesionDeDatos(sesionActivaFecha);
    setPuntos([]);
    setAsistencia([]);
    setAvisos([]);
    const estado = sesionActivaFecha ? { cargando: true } : {};
    setCargas((c) => ({ ...c, puntos: estado, asistencia: estado, avisos: estado }));
  }

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    obtenerCache(CACHE_CATALOGOS).then((c) => {
      if (vigente && !servidorListo && c) setCatalogos({ ...CATALOGOS_VACIOS, ...c });
    });
    listarCatalogos()
      .then((c) => {
        if (!vigente) return;
        servidorListo = true;
        const completos = { ...CATALOGOS_VACIOS, ...c };
        setCatalogos(completos);
        guardarCache(CACHE_CATALOGOS, completos);
        marcarCarga('catalogos', {});
      })
      .catch((e) => vigente && marcarCarga('catalogos', { error: e }));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    obtenerCache(CACHE_SESIONES).then((c) => {
      if (vigente && !servidorListo && c) setFechasSesiones(c);
    });
    listarSesiones()
      .then((sesiones) => {
        if (!vigente) return;
        servidorListo = true;
        const lista = conEtiqueta(sesiones);
        setFechasSesiones(lista);
        guardarCache(CACHE_SESIONES, lista);
        marcarCarga('sesiones', {});
      })
      .catch((e) => vigente && marcarCarga('sesiones', { error: e }));
    return () => { vigente = false; };
  }, []);

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    const clave = cacheCalendario(ANIO_CALENDARIO);
    obtenerCache(clave).then((c) => {
      if (vigente && !servidorListo && c) setCalendario(c);
    });
    obtenerCalendarioEnApi(ANIO_CALENDARIO)
      .then((c) => {
        if (!vigente) return;
        servidorListo = true;
        setCalendario(c);
        guardarCache(clave, c);
        marcarCarga('calendario', {});
      })
      .catch((e) => vigente && marcarCarga('calendario', { error: e }));
    return () => { vigente = false; };
  }, []);


  useEffect(() => {
    if (!sesionActivaFecha) return;
    let vigente = true;
    let servidorListo = false;
    const clave = cachePuntos(sesionActivaFecha);
    obtenerCache(clave).then((c) => {
      if (vigente && !servidorListo && c) setPuntos(c);
    });
    listarPuntos(sesionActivaFecha)
      .then((lista) => {
        if (!vigente) return;
        servidorListo = true;
        const conEstado = lista.map(conSync);
        setPuntos(conEstado);
        guardarCache(clave, conEstado);
        marcarCarga('puntos', {});
      })
      .catch((e) => vigente && marcarCarga('puntos', { error: e }));
    return () => { vigente = false; };
  }, [sesionActivaFecha]);

  useEffect(() => {
    if (!sesionActivaFecha) return;
    let vigente = true;
    let servidorListo = false;
    const clave = cacheAsistencia(sesionActivaFecha);
    obtenerCache(clave).then((c) => {
      if (vigente && !servidorListo && Array.isArray(c)) setAsistencia(c);
    });
    listarAsistencia(sesionActivaFecha)
      .then((lista) => {
        if (!vigente) return;
        servidorListo = true;
        setAsistencia(lista);
        guardarCache(clave, lista);
        marcarCarga('asistencia', {});
      })
      .catch((e) => vigente && marcarCarga('asistencia', { error: e }));
    return () => { vigente = false; };
  }, [sesionActivaFecha]);

  useEffect(() => {
    if (!sesionActivaFecha) return;
    let vigente = true;
    let servidorListo = false;
    const clave = cacheAvisos(sesionActivaFecha);
    obtenerCache(clave).then((c) => {
      if (vigente && !servidorListo && Array.isArray(c)) setAvisos(c);
    });
    listarAvisosEdicion(sesionActivaFecha)
      .then((lista) => {
        if (!vigente) return;
        servidorListo = true;
        setAvisos(lista);
        guardarCache(clave, lista);
        marcarCarga('avisos', {});
      })
      .catch((e) => vigente && marcarCarga('avisos', { error: e }));
    return () => { vigente = false; };
  }, [sesionActivaFecha]);

  useEffect(() => {
    let vigente = true;
    let servidorListo = false;
    obtenerCache(CACHE_PAPELERA).then((cache) => {
      if (vigente && !servidorListo && Array.isArray(cache)) setPapelera(cache);
    });
    listarPapelera()
      .then((lista) => {
        if (!vigente) return;
        servidorListo = true;
        setPapelera(lista);
        guardarCache(CACHE_PAPELERA, lista);
        marcarCarga('papelera', {});
      })
      .catch((e) => vigente && marcarCarga('papelera', { error: e }));
    return () => { vigente = false; };
  }, []);

  function aplicarSesiones(sesiones) {
    const lista = conEtiqueta(sesiones);
    setFechasSesiones(lista);
    guardarCache(CACHE_SESIONES, lista);
  }

  function aplicarCalendario({ calendario: actualizado, sesiones }) {
    aplicarSesiones(sesiones);
    setCalendario(actualizado);
    guardarCache(cacheCalendario(actualizado.anio), actualizado);
    if (!sesiones.some((s) => s.id === sesionActivaFecha)) setSesionActivaFecha(null);
    return actualizado;
  }
  async function generarCalendarioAnual(anio, datos, sobrescribir) {
    const respuesta = await generarCalendarioAnualEnApi(anio, datos, sobrescribir);
    aplicarCalendario(respuesta);
    if (respuesta.generacion) setSesionActivaFecha(null);
    return respuesta.generacion;
  }
  async function agregarAsueto(anio, asueto) {
    return aplicarCalendario(await agregarAsuetoEnApi(anio, asueto));
  }
  async function quitarAsueto(anio, fecha) {
    return aplicarCalendario(await quitarAsuetoEnApi(anio, fecha));
  }
  function cargarSesion(fecha) {
    setSesionActivaFecha(fecha);
  }
  function obtenerFechasExtraordinaria() {
    return listarFechasExtraordinaria();
  }
  async function crearSesionExtraordinaria(fecha) {
    await crearSesionExtraordinariaEnApi(fecha);
    aplicarSesiones(await listarSesiones());
    setSesionActivaFecha(fecha);
  }
  async function eliminarSesion(id) {
    aplicarSesiones(await eliminarSesionEnApi(id));
    if (id === sesionActivaFecha) setSesionActivaFecha(null);
  }
  function aplicarAsistencia(lista) {
    setAsistencia(lista);
    guardarCache(cacheAsistencia(sesionActivaFecha), lista);
  }
  async function refrescarAsistencia() {
    if (sesionActivaFecha) aplicarAsistencia(await listarAsistencia(sesionActivaFecha));
  }
  async function registrarAsistencia(integranteId, presente) {
    aplicarAsistencia(await registrarAsistenciaEnApi(sesionActivaFecha, integranteId, presente));
  }
  function aplicarAvisos(lista) {
    setAvisos(lista);
    guardarCache(cacheAvisos(sesionActivaFecha), lista);
  }
  async function refrescarAvisos() {
    if (sesionActivaFecha) aplicarAvisos(await listarAvisosEdicion(sesionActivaFecha));
  }
  async function refrescarPapelera() {
    const lista = await listarPapelera();
    setPapelera(lista);
    guardarCache(CACHE_PAPELERA, lista);
  }
  async function retirarPunto(id) {
    await retirarPuntoEnApi(id);
    await refrescarPuntos();
    await refrescarPapelera();
    await refrescarAvisos();
  }
  async function restaurarPunto(id) {
    await restaurarPuntoEnApi(id, sesionActivaFecha);
    await refrescarPuntos();
    await refrescarPapelera();
  }
  async function enviarAvisoEdicion(id) {
    await enviarAvisoEdicionEnApi(id);
    await refrescarAvisos();
  }
  async function descartarAvisoEdicion(id) {
    await descartarAvisoEdicionEnApi(id);
    await refrescarAvisos();
  }
  async function establecerListaCerrada(cerrada) {
    await establecerListaCerradaEnApi(sesionActivaFecha, cerrada);
    aplicarSesiones(await listarSesiones());
    await refrescarPuntos();
  }
  async function comenzarSesion() {
    await comenzarSesionEnApi(sesionActivaFecha);
    aplicarSesiones(await listarSesiones());
  }
  async function editarHorario(cambios) {
    await editarHorarioEnApi(sesionActivaFecha, cambios);
    aplicarSesiones(await listarSesiones());
  }
  async function finalizarSesion() {
    await celebrarSesion(sesionActivaFecha);
    aplicarSesiones(await listarSesiones());
    await refrescarPuntos();
    await refrescarPapelera();
  }
  function aplicarPuntos(lista) {
    const ordenada = porNumero(lista);
    setPuntos(ordenada);
    guardarCache(cachePuntos(sesionActivaFecha), ordenada);
  }
  async function refrescarPuntos() {
    aplicarPuntos((await listarPuntos(sesionActivaFecha)).map(conSync));
  }
  function reemplazarPunto(id, nuevo) {
    aplicarPuntos(puntos.map((p) => (p.id === id ? conSync(nuevo) : p)));
  }
  async function agregarPunto(datos) {
    await crearPunto(sesionActivaFecha, datos);
    await refrescarPuntos();
  }
  async function editarPunto(id, version, cambios) {
    try {
      await editarPuntoEnApi(id, version, cambios);
      await refrescarPuntos();
      await refrescarAvisos();
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await refrescarPuntos();
      throw e;
    }
  }
  async function eliminarPunto(id) {
    await eliminarPuntoEnApi(id);
    await refrescarPuntos();
    await refrescarPapelera();
    await refrescarAvisos();
  }
  async function reordenarPuntos(seccion, ids) {
    try {
      const reordenados = (await reordenarPuntosEnApi(sesionActivaFecha, seccion, ids)).map(conSync);
      aplicarPuntos([...puntos.filter((p) => p.seccion !== seccion), ...reordenados]);
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await refrescarPuntos();
      throw e;
    }
  }
  async function marcarPunto(id, tratado) {
    reemplazarPunto(id, await marcarPuntoEnApi(id, tratado));
  }
  async function enviarEngrose(id) {
    await enviarEngroseEnApi(id);
    await refrescarPuntos();
  }
  async function registrarVotacion(id, votacion) {
    reemplazarPunto(id, await registrarVotacionEnApi(id, votacion));
  }
  async function marcarTodosPuntos(tratado) {
    aplicarPuntos((await marcarPuntosEnApi(sesionActivaFecha, tratado)).map(conSync));
  }
  async function adjuntarArchivos(puntoId, archivos, opciones) {
    reemplazarPunto(puntoId, await adjuntarArchivosEnApi(puntoId, archivos, opciones));
  }
  async function reordenarArchivos(puntoId, ids) {
    try {
      reemplazarPunto(puntoId, await reordenarArchivosEnApi(puntoId, ids));
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await refrescarPuntos();
      throw e;
    }
  }
  async function eliminarArchivo(puntoId, archivoId) {
    reemplazarPunto(puntoId, await eliminarArchivoEnApi(puntoId, archivoId));
  }
  async function descargarArchivoAutomatico(archivoId) {
    const { origen, clave } = analizarIdAutomatico(archivoId);
    const logo = await cargarLogo();
    if (origen === 'punto') {
      const punto = puntos.find((p) => p.id === clave);
      if (!punto) throw new Error('El punto ya no existe.');
      return generarArchivoAutomatico(archivoId, {
        punto, logo, plantillas: catalogos.plantillasActa, tiposBloque: catalogos.tiposBloqueActa, textosActa: catalogos.textosActa,
      });
    }
    const sesion = fechasSesiones.find((s) => s.id === clave);
    if (!sesion) throw new Error('La sesión ya no existe.');
    return generarArchivoAutomatico(archivoId, {
      sesion, logo, puntos: await listarPuntos(clave), secciones: catalogos.secciones, asistentes: sesion.asistentes ?? [],
    });
  }
  function descargarArchivo(archivoId) {
    return esArchivoAutomatico(archivoId) ? descargarArchivoAutomatico(archivoId) : descargarArchivoEnApi(archivoId);
  }

  const cargando = Object.values(cargas).some((c) => c.cargando);
  const error = Object.values(cargas).map((c) => c.error).find(Boolean) ?? null;

  const sesionSeleccionada = fechasSesiones.find((f) => f.id === sesionActivaFecha);
  const sesionFinalizada = !!sesionSeleccionada?.celebrada;
  const listaCerrada = !!sesionSeleccionada?.listaCerrada;

  const value = {
    sesionSeleccionada,
    SECCIONES_DOCUMENTO: catalogos.secciones, REMITENTES: catalogos.remitentes, CATEGORIAS: catalogos.categorias,
    TIPOS_VOTO: catalogos.tiposVoto, TIPOS_VOTACION: catalogos.tiposVotacion, ESTADOS_VOTO: catalogos.estadosVoto, TIPOS_CONOCIMIENTO: catalogos.tiposConocimiento, GENEROS: catalogos.generos, GRADOS: catalogos.grados,
    PLANTILLAS_ACTA: catalogos.plantillasActa, TIPOS_BLOQUE_ACTA: catalogos.tiposBloqueActa, TEXTOS_ACTA: catalogos.textosActa, CONSIDERANDOS_FIJOS: catalogos.considerandosFijos,
    FECHAS_SESIONES: fechasSesiones,
    ASISTENCIA: asistencia, registrarAsistencia, refrescarAsistencia,
    sesionActivaFecha, cargarSesion, obtenerFechasExtraordinaria, crearSesionExtraordinaria, eliminarSesion,
    TIPOS_SESION: catalogos.tiposSesion,
    sesionFinalizada, comenzarSesion, finalizarSesion, editarHorario,
    listaCerrada, establecerListaCerrada,
    AVISOS_EDICION: avisos, enviarAvisoEdicion, descartarAvisoEdicion,
    PUNTOS: puntos, PAPELERA: papelera, retirarPunto, restaurarPunto, refrescarPuntos, agregarPunto, editarPunto, eliminarPunto, reordenarPuntos,
    marcarPunto, enviarEngrose, registrarVotacion, marcarTodosPuntos, adjuntarArchivos, eliminarArchivo, reordenarArchivos, descargarArchivo,
    CALENDARIO: calendario, ANIO_CALENDARIO, generarCalendarioAnual, resumenArchivoCalendario, agregarAsueto, quitarAsueto,
    guardarBorrador, obtenerBorrador, eliminarBorrador,
    cargando, error,
  };
  return <ProyectoContext.Provider value={value}>{children}</ProyectoContext.Provider>;
}

export function useProyecto() {
  return useContext(ProyectoContext);
}
