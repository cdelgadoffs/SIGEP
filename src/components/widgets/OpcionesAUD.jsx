import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import SelectorArchivos from './SelectorArchivos.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/OpcionesAUD.css';

export default function OpcionesAUD({ punto, ocultar = [], children }) {
  const { eliminarPunto, adjuntarArchivos } = useProyecto();
  const { puntoEnEdicionId, abrirEdicionPunto, cerrarSidebar3 } = useUI();
  const [confirmando, setConfirmando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [error, setError] = useState(null);
  const [adjuntando, setAdjuntando] = useState(false);
  const [errorAdjuntar, setErrorAdjuntar] = useState(null);

  function cancelar() {
    setConfirmando(false);
    setError(null);
  }

  async function adjuntar(archivos) {
    setAdjuntando(true);
    try {
      await adjuntarArchivos(punto.id, archivos);
    } catch (err) {
      setErrorAdjuntar(err.mensaje || 'No se pudieron adjuntar los archivos.');
    } finally {
      setAdjuntando(false);
    }
  }

  async function eliminar() {
    setEliminando(true);
    setError(null);
    try {
      await eliminarPunto(punto.id);
      if (puntoEnEdicionId === punto.id) cerrarSidebar3();
      setConfirmando(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo eliminar el punto.');
    } finally {
      setEliminando(false);
    }
  }

  return (
    <div className="widget-opciones-aud">
      {!ocultar.includes('adjuntar') && (
        <SelectorArchivos compacto disabled={adjuntando} onSeleccionar={adjuntar} onAviso={setErrorAdjuntar} />
      )}
      {!ocultar.includes('editar') && (
        <BotonIcono icono="ri-edit-line" ariaLabel="Editar punto" onClick={() => abrirEdicionPunto(punto.id)} />
      )}
      {!ocultar.includes('eliminar') && (
        <BotonIcono icono="ri-delete-bin-line" ariaLabel="Eliminar punto" onClick={() => setConfirmando(true)} />
      )}
      {children}
      <Modal abierto={!!errorAdjuntar} titulo="Adjuntar archivos" onCerrar={() => setErrorAdjuntar(null)}>
        <p className="widget-opciones-aud-mensaje">{errorAdjuntar}</p>
        <div className="widget-opciones-aud-acciones">
          <BotonS variant="claro" onClick={() => setErrorAdjuntar(null)}>Cerrar</BotonS>
        </div>
      </Modal>
      <Modal abierto={confirmando} titulo="Eliminar punto" onCerrar={cancelar}>
        <p className="widget-opciones-aud-mensaje">Esta acción no se puede deshacer. ¿Quieres eliminar este punto?</p>
        {error && <div className="widget-opciones-aud-error">{error}</div>}
        <div className="widget-opciones-aud-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={eliminar} disabled={eliminando}>Eliminar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
