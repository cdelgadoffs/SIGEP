import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useOrgano } from '../../context/OrganoContext.jsx';
import { generarWordActa } from '../../utils/actaSesion.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import { cargarLogo } from '../../utils/logo.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/BotonDescargarActa.css';

export default function BotonDescargarActa() {
  const { puedeDescargar } = useAuth();
  const { sesionSeleccionada, PUNTOS, SECCIONES_DOCUMENTO, ASISTENCIA } = useProyecto();
  const { INTEGRANTES } = useOrgano();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  function asistentesDeLaSesion() {
    if (sesionSeleccionada.asistentes) return sesionSeleccionada.asistentes;
    return ASISTENCIA
      .map((a) => ({ ...a, integrante: INTEGRANTES.find((i) => i.id === a.integranteId) }))
      .filter((a) => a.integrante)
      .map((a) => ({ ...a.integrante, integranteId: a.integranteId, presente: a.presente }));
  }

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const { blob, nombreArchivo } = await generarWordActa({
        sesion: sesionSeleccionada,
        tipoSesion: nombreTipoSesion(sesionSeleccionada.tipo),
        puntos: PUNTOS,
        secciones: SECCIONES_DOCUMENTO,
        asistentes: asistentesDeLaSesion(),
        logo: await cargarLogo(),
      });
      guardarEnDisco(nombreArchivo, blob);
    } catch (e) {
      setError(`No se pudo generar el acta: ${e.message || 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  }

  if (!puedeDescargar) return null;

  return (
    <div className="widget-boton-descargar-acta">
      <BotonS variant="claro" onClick={descargar} disabled={generando || !sesionSeleccionada || PUNTOS.length === 0}>
        {generando ? 'Generando...' : 'Descargar acta'}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo descargar" onCerrar={() => setError(null)}>
        <p className="widget-boton-descargar-acta-mensaje">{error}</p>
      </Modal>
    </div>
  );
}
