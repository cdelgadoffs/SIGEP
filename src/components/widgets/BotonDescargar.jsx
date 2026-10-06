import { useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { generarWordOrdenDia } from '../../utils/ordenDia.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/BotonDescargar.css';

export default function BotonDescargar() {
  const { sesionSeleccionada, PUNTOS, SECCIONES_DOCUMENTO } = useProyecto();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const { blob, nombreArchivo } = await generarWordOrdenDia({
        sesion: sesionSeleccionada,
        tipoSesion: nombreTipoSesion(sesionSeleccionada.tipo),
        puntos: PUNTOS,
        secciones: SECCIONES_DOCUMENTO,
      });
      guardarEnDisco(nombreArchivo, blob);
    } catch (e) {
      setError(`No se pudo generar el documento Word: ${e.message || 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  }

  return (
    <div className="widget-boton-descargar">
      <BotonS variant="claro" onClick={descargar} disabled={generando || !sesionSeleccionada || PUNTOS.length === 0}>
        {generando ? 'Generando...' : 'Descargar orden del día'}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo descargar" onCerrar={() => setError(null)}>
        <p className="widget-boton-descargar-mensaje">{error}</p>
      </Modal>
    </div>
  );
}
