import { useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import ListaArchivosAdjuntos from './ListaArchivosAdjuntos.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/AdjuntosInformativos.css';

export default function AdjuntosInformativos({ punto }) {
  const { puedeEscribir } = useAuth();
  const { sesionFinalizada, eliminarArchivo } = useProyecto();
  const { abrirVistaArchivo } = useUI();
  const [archivoAQuitar, setArchivoAQuitar] = useState(null);
  const [error, setError] = useState(null);

  const informativos = (punto.archivos ?? []).filter((a) => a.informativo && a.id);
  const puedeQuitar = puedeEscribir && !sesionFinalizada;

  function cancelar() {
    setArchivoAQuitar(null);
    setError(null);
  }

  async function quitar() {
    setError(null);
    try {
      await eliminarArchivo(punto.id, archivoAQuitar.id);
      setArchivoAQuitar(null);
    } catch (e) {
      setError(e.mensaje || 'No se pudo quitar el archivo.');
    }
  }

  if (informativos.length === 0) return null;

  return (
    <div className="widget-adjuntos-informativos">
      <ListaArchivosAdjuntos
        agrupar={false}
        archivos={informativos.map((a) => ({
          clave: a.id,
          nombre: a.nombre,
          onClick: () => abrirVistaArchivo(a, { soloLectura: true }),
          onEliminar: puedeQuitar ? () => setArchivoAQuitar(a) : undefined,
        }))}
      />
      <Modal abierto={!!archivoAQuitar} titulo="Quitar archivo" onCerrar={cancelar}>
        <p className="widget-adjuntos-informativos-mensaje">
          ¿Quieres quitar «{archivoAQuitar?.nombre}» de este punto? Esta acción no se puede deshacer.
        </p>
        {error && <div className="widget-adjuntos-informativos-error">{error}</div>}
        <div className="widget-adjuntos-informativos-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={quitar}>Quitar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
