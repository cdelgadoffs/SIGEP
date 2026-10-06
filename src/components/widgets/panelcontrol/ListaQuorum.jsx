import { useState } from 'react';
import CardS from '../../base/CardS.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import BotonS from '../../base/BotonS.jsx';
import Modal from '../../base/Modal.jsx';
import { useOrgano } from '../../../context/OrganoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/ListaQuorum.css';

export default function ListaQuorum({ onEditar }) {
  const { INTEGRANTES, eliminarIntegrante, cargando, error: errorCarga } = useOrgano();
  const { GENEROS, GRADOS, refrescarPuntos } = useProyecto();
  const [aEliminar, setAEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState(null);

  function cancelar() {
    setAEliminar(null);
    setErrorEliminar(null);
  }

  async function eliminar() {
    setErrorEliminar(null);
    try {
      await eliminarIntegrante(aEliminar.id);
      await refrescarPuntos().catch(() => {});
      setAEliminar(null);
    } catch (e) {
      setErrorEliminar(e.mensaje || 'No se pudo eliminar al integrante.');
    }
  }

  if (errorCarga) return <div className="widget-lista-quorum-error">No se pudo cargar la información: {errorCarga.mensaje}</div>;
  if (INTEGRANTES.length === 0) {
    return <div className="widget-lista-quorum-vacio">{cargando ? 'Cargando…' : 'No hay integrantes registrados'}</div>;
  }

  return (
    <div className="widget-lista-quorum">
      {INTEGRANTES.map((i) => (
        <div key={i.id} className={i.presidente ? 'widget-lista-quorum-presidente' : undefined}>
          <CardS
            titulo={i.presidente ? `${i.nombre} · Presidente` : i.nombre}
            subtitulo={i.email}
            acciones={(
              <>
                <BotonIcono icono="ri-edit-line" ariaLabel="Editar integrante" onClick={() => onEditar(i)} />
                <BotonIcono icono="ri-close-line" ariaLabel="Eliminar integrante" onClick={() => setAEliminar(i)} />
              </>
            )}
          >
            <div className="widget-lista-quorum-badges">
              <BadgeDinamico texto={GENEROS.find((g) => g.id === i.genero)?.nombre ?? i.genero} tono="gris" />
              <BadgeDinamico texto={GRADOS.find((g) => g.id === i.grado)?.nombre ?? i.grado} tono="gris" />
            </div>
          </CardS>
        </div>
      ))}
      <Modal abierto={!!aEliminar} titulo="Eliminar integrante" onCerrar={cancelar}>
        <p className="widget-lista-quorum-mensaje">¿Quieres eliminar a {aEliminar?.nombre} del Pleno?</p>
        {errorEliminar && <div className="widget-lista-quorum-error-modal">{errorEliminar}</div>}
        <div className="widget-lista-quorum-modal-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={eliminar}>Eliminar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
