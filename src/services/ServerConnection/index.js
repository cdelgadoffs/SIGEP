import { ApiError } from '../ApiError.js';

function noImplementado() {
  return Promise.reject(new ApiError('NO_IMPLEMENTADO', 'La conexión con el servidor aún no está implementada.'));
}

export const listarCatalogos = () => noImplementado();
export const listarSesiones = () => noImplementado();
export const crearSesiones = () => noImplementado();
export const obtenerCalendario = () => noImplementado();
export const generarCalendarioAnual = () => noImplementado();
export const agregarAsueto = () => noImplementado();
export const quitarAsueto = () => noImplementado();
export const establecerListaCerrada = () => noImplementado();
export const celebrarSesion = () => noImplementado();
export const listarPuntos = () => noImplementado();
export const crearPunto = () => noImplementado();
export const editarPunto = () => noImplementado();
export const eliminarPunto = () => noImplementado();
export const reordenarPuntos = () => noImplementado();
export const marcarPunto = () => noImplementado();
export const marcarPuntos = () => noImplementado();
export const adjuntarArchivos = () => noImplementado();
export const eliminarArchivo = () => noImplementado();
export const descargarArchivo = () => noImplementado();
