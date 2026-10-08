import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/BotonComenzarSesion.css';

export default function BotonComenzarSesion() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, listaCerrada, comenzarSesion } = useProyecto();
  const [comenzando, setComenzando] = useState(false);
  const [error, setError] = useState(null);

  async function comenzar() {
    setComenzando(true);
    setError(null);
    try {
      await comenzarSesion();
    } catch (e) {
      setError(e.mensaje || 'No se pudo comenzar la sesión.');
    } finally {
      setComenzando(false);
    }
  }

  if (!listaCerrada) {
    return <div className="widget-boton-comenzar-aviso">Debes cerrar la lista de puntos antes de poder comenzar la sesión.</div>;
  }

  if (!puedeEscribir) return null;

  return (
    <div className="widget-boton-comenzar">
      <BotonS variant="claro" onClick={comenzar} disabled={comenzando || !sesionSeleccionada}>
        Comenzar sesión {nombreTipoSesion(sesionSeleccionada?.tipo)} N° {sesionSeleccionada?.numeroSesion ?? '—'}
      </BotonS>
      <Modal abierto={!!error} titulo="No se pudo comenzar" onCerrar={() => setError(null)}>
        <p className="widget-boton-comenzar-mensaje">{error}</p>
      </Modal>
    </div>
  );
}
