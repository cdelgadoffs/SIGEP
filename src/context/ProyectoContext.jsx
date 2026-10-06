import { createContext, useContext, useEffect, useState } from 'react';
import {
  listarCatalogos, listarSesiones, celebrarSesion, establecerListaCerrada as establecerListaCerradaEnApi,
  obtenerCalendario as obtenerCalendarioEnApi, generarCalendarioAnual as generarCalendarioAnualEnApi,
  agregarAsueto as agregarAsuetoEnApi, quitarAsueto as quitarAsuetoEnApi,
  listarPuntos, crearPunto, reordenarPuntos as reordenarPuntosEnApi, marcarPunto as marcarPuntoEnApi, marcarPuntos as marcarPuntosEnApi, registrarVotacion as registrarVotacionEnApi,
  editarPunto as editarPuntoEnApi, eliminarPunto as eliminarPuntoEnApi,
  adjuntarArchivos as adjuntarArchivosEnApi, eliminarArchivo as eliminarArchivoEnApi,
  descargarArchivo as descargarArchivoEnApi,
} from '../services/api.js';
import {
  guardarBorrador, obtenerBorrador, eliminarBorrador,
  guardarCache, obtenerCache,
} from '../services/SesionIndexedDB.js';
import { etiquetaFecha } from '../utils/fechas.js';

const ProyectoContext = createContext(null);

const CACHE_CATALOGOS = 'catalogos';
const CACHE_SESIONES = 'sesiones';
const cachePuntos = (sesionId) => `puntos:${sesionId}`;
const cacheCalendario = (anio) => `calendario:${anio}`;

const ANIO_CALENDARIO = new Date().getFullYear();

const conEtiqueta = (sesiones) => sesiones.map((s) => ({ ...s, label: etiquetaFecha(s.id) }));
const conSync = (punto) => ({ ...punto, sincronizacion: 'servidor' });
const porNumero = (lista) => [...lista].sort((a, b) => (a.numero ?? 0) - (b.numero ?? 0));

const CATALOGOS_VACIOS = { secciones: [], remitentes: [], categorias: [], tiposVoto: [], tiposVotacion: [], estadosVoto: [], integrantes: [], tiposConocimiento: [] };

export function ProyectoProvider({ children }) {
  const [fechasSesiones, setFechasSesiones] = useState([]);
  const [sesionActivaFecha, setSesionActivaFecha] = useState(null);
  const [puntos, setPuntos] = useState([]);
  const [catalogos, setCatalogos] = useState(CATALOGOS_VACIOS);
  const [calendario, setCalendario] = useState(null);
  const [cargas, setCargas] = useState({ catalogos: { cargando: true }, sesiones: { cargando: true }, calendario: { cargando: true }, puntos: {} });

  function marcarCarga(recurso, estado) {
    setCargas((c) => ({ ...c, [recurso]: estado }));
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
    if (sesionActivaFecha !== null) return;
    const proxima = fechasSesiones.find((f) => f.estado === 'proxima');
    if (proxima) setSesionActivaFecha(proxima.id);
  }, [fechasSesiones, sesionActivaFecha]);

  useEffect(() => {
    setPuntos([]);
    if (!sesionActivaFecha) {
      marcarCarga('puntos', {});
      return;
    }
    marcarCarga('puntos', { cargando: true });
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
    return aplicarCalendario(await generarCalendarioAnualEnApi(anio, datos, sobrescribir));
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
  async function establecerListaCerrada(cerrada) {
    await establecerListaCerradaEnApi(sesionActivaFecha, cerrada);
    aplicarSesiones(await listarSesiones());
  }
  async function finalizarSesion() {
    await celebrarSesion(sesionActivaFecha);
    aplicarSesiones(await listarSesiones());
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
    } catch (e) {
      if (e.codigo === 'CONFLICTO') await refrescarPuntos();
      throw e;
    }
  }
  async function eliminarPunto(id) {
    await eliminarPuntoEnApi(id);
    await refrescarPuntos();
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
  async function registrarVotacion(id, votacion) {
    reemplazarPunto(id, await registrarVotacionEnApi(id, votacion));
  }
  async function marcarTodosPuntos(tratado) {
    aplicarPuntos((await marcarPuntosEnApi(sesionActivaFecha, tratado)).map(conSync));
  }
  async function adjuntarArchivos(puntoId, archivos) {
    reemplazarPunto(puntoId, await adjuntarArchivosEnApi(puntoId, archivos));
  }
  async function eliminarArchivo(puntoId, archivoId) {
    reemplazarPunto(puntoId, await eliminarArchivoEnApi(puntoId, archivoId));
  }
  function descargarArchivo(archivoId) {
    return descargarArchivoEnApi(archivoId);
  }

  const cargando = Object.values(cargas).some((c) => c.cargando);
  const error = Object.values(cargas).map((c) => c.error).find(Boolean) ?? null;

  const sesionSeleccionada = fechasSesiones.find((f) => f.id === sesionActivaFecha);
  const sesionFinalizada = !!sesionSeleccionada?.celebrada;
  const listaCerrada = !!sesionSeleccionada?.listaCerrada;

  const value = {
    sesionSeleccionada,
    SECCIONES_DOCUMENTO: catalogos.secciones, REMITENTES: catalogos.remitentes, CATEGORIAS: catalogos.categorias,
    TIPOS_VOTO: catalogos.tiposVoto, TIPOS_VOTACION: catalogos.tiposVotacion, ESTADOS_VOTO: catalogos.estadosVoto, INTEGRANTES: catalogos.integrantes, TIPOS_CONOCIMIENTO: catalogos.tiposConocimiento,
    FECHAS_SESIONES: fechasSesiones,
    sesionActivaFecha, cargarSesion,
    sesionFinalizada, finalizarSesion,
    listaCerrada, establecerListaCerrada,
    PUNTOS: puntos, agregarPunto, editarPunto, eliminarPunto, reordenarPuntos,
    marcarPunto, registrarVotacion, marcarTodosPuntos, adjuntarArchivos, eliminarArchivo, descargarArchivo,
    CALENDARIO: calendario, ANIO_CALENDARIO, generarCalendarioAnual, agregarAsueto, quitarAsueto,
    guardarBorrador, obtenerBorrador, eliminarBorrador,
    cargando, error,
  };
  return <ProyectoContext.Provider value={value}>{children}</ProyectoContext.Provider>;
}

export function useProyecto() {
  return useContext(ProyectoContext);
}
