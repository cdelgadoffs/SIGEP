import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import '../../styles/widgets/BotonFinalizarSesion.css';

export default function BotonFinalizarSesion() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, finalizarSesion } = useProyecto();
  const [confirmando, setConfirmando] = useState(false);
  const [finalizando, setFinalizando] = useState(false);
  const [error, setError] = useState(null);

  function cancelar() {
    setConfirmando(false);
    setError(null);
  }

  async function finalizar() {
    setFinalizando(true);
    setError(null);
    try {
      await finalizarSesion();
      setConfirmando(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo finalizar la sesión.');
    } finally {
      setFinalizando(false);
    }
  }

  if (!puedeEscribir) return null;

  return (
    <div className="widget-boton-finalizar">
      <BotonS variant="claro" onClick={() => setConfirmando(true)} disabled={!sesionSeleccionada}>
        Finalizar sesión
      </BotonS>
      <Modal abierto={confirmando} titulo="Finalizar sesión" onCerrar={cancelar}>
        <p className="widget-boton-finalizar-mensaje">
          ¿Finalizar la sesión? Quedará celebrada y ya no se podrán modificar sus puntos, votaciones ni asistencia. Esta acción no se puede deshacer.
        </p>
        {error && <div className="widget-boton-finalizar-error">{error}</div>}
        <div className="widget-boton-finalizar-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={finalizar} disabled={finalizando}>Finalizar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
