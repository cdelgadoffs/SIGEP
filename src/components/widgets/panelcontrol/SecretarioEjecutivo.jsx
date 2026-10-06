import { useState } from 'react';
import CardS from '../../base/CardS.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import BotonS from '../../base/BotonS.jsx';
import Modal from '../../base/Modal.jsx';
import { useOrgano } from '../../../context/OrganoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/SecretarioEjecutivo.css';

export default function SecretarioEjecutivo({ onEditar }) {
  const { SECRETARIO_EJECUTIVO: secretario, eliminarSecretarioEjecutivo } = useOrgano();
  const { GENEROS } = useProyecto();
  const [confirmando, setConfirmando] = useState(false);
  const [error, setError] = useState(null);

  if (!secretario) return null;

  function cancelar() {
    setConfirmando(false);
    setError(null);
  }

  async function eliminar() {
    setError(null);
    try {
      await eliminarSecretarioEjecutivo();
      setConfirmando(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo quitar al Secretario Ejecutivo.');
    }
  }

  return (
    <div className="widget-secretario-ejecutivo">
      <CardS
        titulo={secretario.nombre}
        subtitulo={secretario.email}
        acciones={(
          <>
            <BotonIcono icono="ri-edit-line" ariaLabel="Editar Secretario Ejecutivo" onClick={onEditar} />
            <BotonIcono icono="ri-close-line" ariaLabel="Quitar Secretario Ejecutivo" onClick={() => setConfirmando(true)} />
          </>
        )}
      >
        <div className="widget-secretario-ejecutivo-badges">
          <BadgeDinamico texto={GENEROS.find((g) => g.id === secretario.genero)?.nombre ?? secretario.genero} tono="gris" />
        </div>
      </CardS>
      <Modal abierto={confirmando} titulo="Quitar Secretario Ejecutivo" onCerrar={cancelar}>
        <p className="widget-secretario-ejecutivo-mensaje">¿Quitar al Secretario Ejecutivo del Pleno?</p>
        {error && <div className="widget-secretario-ejecutivo-error">{error}</div>}
        <div className="widget-secretario-ejecutivo-modal-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={eliminar}>Quitar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
