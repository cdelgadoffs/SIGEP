import { useState } from 'react';
import Modal from '../base/Modal.jsx';
import BotonS from '../base/BotonS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import '../../styles/widgets/BotonCerrarLista.css';

export default function BotonCerrarLista() {
  const { sesionActivaFecha, listaCerrada, establecerListaCerrada } = useProyecto();
  const [confirmando, setConfirmando] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  function cancelar() {
    setConfirmando(false);
    setError(null);
  }

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      await establecerListaCerrada(!listaCerrada);
      setConfirmando(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo actualizar la lista.');
    } finally {
      setEnviando(false);
    }
  }

  const mensaje = listaCerrada
    ? '¿Abrir el registro de puntos? Se permitirá añadir, editar y eliminar puntos.'
    : '¿Cerrar el registro de puntos? No se podrán añadir, editar ni eliminar puntos hasta reabrirlo.';

  return (
    <>
      <button
        type="button"
        className={'widget-boton-cerrar-lista ' + (listaCerrada ? 'widget-boton-cerrar-lista-cerrada' : 'widget-boton-cerrar-lista-abierta')}
        disabled={!sesionActivaFecha}
        onClick={() => setConfirmando(true)}
      >
        {listaCerrada ? 'Abrir lista' : 'Cerrar lista'}
      </button>
      <Modal abierto={confirmando} titulo={listaCerrada ? 'Abrir lista' : 'Cerrar lista'} onCerrar={cancelar}>
        <p className="widget-boton-cerrar-lista-mensaje">{mensaje}</p>
        {error && <div className="widget-boton-cerrar-lista-error">{error}</div>}
        <div className="widget-boton-cerrar-lista-acciones">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={confirmar} disabled={enviando}>{listaCerrada ? 'Abrir' : 'Cerrar'}</BotonS>
        </div>
      </Modal>
    </>
  );
}
