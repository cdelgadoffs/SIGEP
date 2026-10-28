import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import SelectorArchivos from './SelectorArchivos.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import '../../styles/widgets/OpcionesAUD.css';

export default function OpcionesAUD({ punto, ocultar = [], children }) {
  const { eliminarPunto, moverABorradores, adjuntarArchivos } = useProyecto();
  const { puntoEnEdicionId, abrirEdicionPunto, cerrarSidebar3, setBorradorRecienteId, setSidebar4Abierto } = useUI();
  const { filtroReciclaje, cambiarAjuste } = useAjustesVisuales();
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

  async function eliminar(aBorradores) {
    setEliminando(true);
    setError(null);
    try {
      if (aBorradores) await moverABorradores(punto.id);
      else await eliminarPunto(punto.id);
      const motivo = aBorradores ? 'borrador' : 'eliminado';
      if (filtroReciclaje !== motivo && filtroReciclaje !== 'todos') cambiarAjuste('filtroReciclaje', motivo);
      setBorradorRecienteId(punto.id);
      setSidebar4Abierto(true);
      if (puntoEnEdicionId === punto.id) cerrarSidebar3();
      setConfirmando(false);
    } catch (e) {
      setError(e.mensaje || (aBorradores ? 'No se pudo mover el punto a borradores.' : 'No se pudo eliminar el punto.'));
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
        <p className="widget-opciones-aud-mensaje">¿Quieres eliminar este punto? También puedes moverlo a borradores para completarlo después.</p>
        {error && <div className="widget-opciones-aud-error">{error}</div>}
        <div className="widget-opciones-aud-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <span className="widget-opciones-aud-eliminar">
            <BotonS variant="claro" onClick={() => eliminar(false)} disabled={eliminando}>Eliminar</BotonS>
          </span>
          <span className="widget-opciones-aud-borradores">
            <BotonS variant="claro" onClick={() => eliminar(true)} disabled={eliminando}>Mover a borradores</BotonS>
          </span>
        </div>
      </Modal>
    </div>
  );
}
