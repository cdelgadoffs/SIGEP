import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { generarZipArchivosSesion } from '../../utils/zipArchivosSesion.js';
import { puntosConAdjuntos, archivosDescargables } from '../../utils/arbolArchivos.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/BotonDescargarArchivosSesion.css';

export default function BotonDescargarArchivosSesion() {
  const { puedeDescargar } = useAuth();
  const { sesionSeleccionada, PUNTOS, SECCIONES_DOCUMENTO, listaCerrada, descargarArchivo } = useProyecto();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  const hayArchivos = puntosConAdjuntos(PUNTOS).length > 0 || (listaCerrada && PUNTOS.length > 0);
  if (!hayArchivos) return null;

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const binarios = new Map();
      for (const punto of puntosConAdjuntos(PUNTOS)) {
        for (const archivo of archivosDescargables(punto)) {
          binarios.set(archivo.id, (await descargarArchivo(archivo.id)).blob);
        }
      }
      const { blob, nombreArchivo } = await generarZipArchivosSesion({
        sesion: sesionSeleccionada,
        tipoSesion: nombreTipoSesion(sesionSeleccionada.tipo),
        puntos: PUNTOS,
        secciones: SECCIONES_DOCUMENTO,
        listaCerrada,
        binarios,
      });
      guardarEnDisco(nombreArchivo, blob);
    } catch (e) {
      setError(`No se pudo generar el ZIP: ${e.message || e.mensaje || 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  }

  if (!puedeDescargar) return null;

  return (
    <>
      <BotonS variant="claro" onClick={descargar} disabled={generando || !sesionSeleccionada}>
        {generando ? 'Generando ZIP...' : 'Descargar archivos de sesión'}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo descargar" onCerrar={() => setError(null)}>
        <p className="widget-boton-descargar-archivos-mensaje">{error}</p>
      </Modal>
    </>
  );
}
