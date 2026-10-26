import { ApiError } from '../ApiError.js';
import { obtenerToken } from '../auth.js';

const URL_API = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');

function noImplementado() {
  return Promise.reject(new ApiError('NO_IMPLEMENTADO', 'Esta función aún no está disponible en el servidor.'));
}

async function solicitar(metodo, ruta, cuerpo) {
  const token = await obtenerToken();
  const encabezados = { Accept: 'application/json' };
  if (token) encabezados.Authorization = `Bearer ${token}`;
  if (cuerpo !== undefined) encabezados['Content-Type'] = 'application/json';

  let respuesta;
  try {
    respuesta = await fetch(`${URL_API}${ruta}`, {
      method: metodo,
      headers: encabezados,
      body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo),
    });
  } catch {
    throw new ApiError('SIN_CONEXION', 'No se pudo contactar al servidor.');
  }

  const datos = await respuesta.json().catch(() => null);
  if (respuesta.ok) return datos;
  if (datos?.codigo) throw new ApiError(datos.codigo, datos.mensaje ?? 'El servidor rechazó la operación.');
  throw new ApiError('SIN_CONEXION', `El servidor respondió con un error inesperado (${respuesta.status}).`);
}

export const listarCatalogos = () => solicitar('GET', '/catalogos');
export const listarSesiones = () => solicitar('GET', '/sesiones');
export const crearSesiones = () => noImplementado();
export const obtenerCalendario = (anio) => solicitar('GET', `/calendarios/${anio}`);
export const generarCalendarioAnual = (anio, datos, sobrescribir) =>
  solicitar('POST', `/calendarios/${anio}/generar`, {
    diaSemana: datos?.diaSemana,
    vacaciones: datos?.vacaciones ?? [],
    sobrescribir: sobrescribir === true,
  });
export const resumenArchivoCalendario = (anio) => solicitar('GET', `/calendarios/${anio}/resumen-archivo`);
export const listarGeneraciones = (anio) => solicitar('GET', `/calendarios/${anio}/generaciones`);
export const agregarAsueto = (anio, asueto) =>
  solicitar('POST', `/calendarios/${anio}/asuetos`, { fecha: asueto?.fecha, destino: asueto?.destino });
export const quitarAsueto = (anio, fecha) =>
  solicitar('DELETE', `/calendarios/${anio}/asuetos/${encodeURIComponent(fecha)}`);
export const establecerListaCerrada = () => noImplementado();
export const establecerNumeroSesion = () => noImplementado();
export const celebrarSesion = () => noImplementado();
export const comenzarSesion = () => noImplementado();
export const editarHorario = () => noImplementado();
export const editarBloqueActa = () => noImplementado();
export const restablecerBloqueActa = () => noImplementado();
export const listarAsistencia = () => noImplementado();
export const registrarAsistencia = () => noImplementado();
export const listarFechasExtraordinaria = () => noImplementado();
export const crearSesionExtraordinaria = () => noImplementado();
export const eliminarSesion = () => noImplementado();
export const listarPuntos = () => noImplementado();
export const crearPunto = () => noImplementado();
export const editarPunto = () => noImplementado();
export const eliminarPunto = () => noImplementado();
export const retirarPunto = () => noImplementado();
export const restaurarPunto = () => noImplementado();
export const trasladarPunto = () => noImplementado();
export const listarPapelera = () => noImplementado();
export const guardarPuntoBorrador = () => noImplementado();
export const editarPuntoBorrador = () => noImplementado();
export const eliminarPuntoBorrador = () => noImplementado();
export const moverABorradores = () => noImplementado();
export const reordenarPuntos = () => noImplementado();
export const marcarPunto = () => noImplementado();
export const marcarPuntos = () => noImplementado();
export const enviarEngrose = () => noImplementado();
export const registrarVotacion = () => noImplementado();
export const listarIntegrantes = () => noImplementado();
export const crearIntegrante = () => noImplementado();
export const editarIntegrante = () => noImplementado();
export const eliminarIntegrante = () => noImplementado();
export const obtenerSecretarioEjecutivo = () => noImplementado();
export const guardarSecretarioEjecutivo = () => noImplementado();
export const eliminarSecretarioEjecutivo = () => noImplementado();
export const adjuntarArchivos = () => noImplementado();
export const eliminarArchivo = () => noImplementado();
export const renombrarArchivo = () => noImplementado();
export const renombrarCarpeta = () => noImplementado();
export const reordenarArchivos = () => noImplementado();
export const descargarArchivo = () => noImplementado();
export const listarContactosCorreo = () => noImplementado();
export const crearContactoCorreo = () => noImplementado();
export const eliminarContactoCorreo = () => noImplementado();
export const listarPlantillasCorreo = () => noImplementado();
export const crearPlantillaCorreo = () => noImplementado();
export const eliminarPlantillaCorreo = () => noImplementado();
export const listarListasCorreo = () => noImplementado();
export const crearListaCorreo = () => noImplementado();
export const eliminarListaCorreo = () => noImplementado();
export const listarCorreosRemitentes = () => noImplementado();
export const guardarCorreoRemitente = () => noImplementado();
export const enviarCorreo = () => noImplementado();
export const listarCorreosEnviados = () => noImplementado();
export const listarAvisosEdicion = () => noImplementado();
export const enviarAvisoEdicion = () => noImplementado();
export const descartarAvisoEdicion = () => noImplementado();
export const listarHistorialPunto = () => noImplementado();
