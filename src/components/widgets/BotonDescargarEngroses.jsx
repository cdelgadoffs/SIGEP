import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { generarZipEngroses } from '../../utils/zipEngroses.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import { cargarLogo } from '../../utils/logo.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/BotonDescargarEngroses.css';

export default function BotonDescargarEngroses({ etiqueta = 'Descargar ZIP de engroses' }) {
  const { puedeDescargar } = useAuth();
  const { sesionSeleccionada, PUNTOS, PLANTILLAS_ACTA, TIPOS_BLOQUE_ACTA, TEXTOS_ACTA } = useProyecto();
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState(null);

  const conEngrose = PUNTOS.filter((p) => p.engrose);

  async function descargar() {
    setGenerando(true);
    setError(null);
    try {
      const { blob, nombreArchivo } = await generarZipEngroses({
        sesion: sesionSeleccionada,
        tipoSesion: nombreTipoSesion(sesionSeleccionada.tipo),
        puntos: conEngrose,
        plantillas: PLANTILLAS_ACTA,
        tiposBloque: TIPOS_BLOQUE_ACTA,
        textosActa: TEXTOS_ACTA,
        logo: await cargarLogo(),
      });
      guardarEnDisco(nombreArchivo, blob);
    } catch (e) {
      setError(`No se pudo generar el ZIP de engroses: ${e.message || 'error desconocido'}`);
    } finally {
      setGenerando(false);
    }
  }

  if (!puedeDescargar) return null;

  return (
    <>
      <BotonS variant="claro" onClick={descargar} disabled={generando || !sesionSeleccionada || conEngrose.length === 0}>
        {generando ? 'Generando ZIP...' : etiqueta}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo descargar" onCerrar={() => setError(null)}>
        <p className="widget-boton-descargar-engroses-mensaje">{error}</p>
      </Modal>
    </>
  );
}
