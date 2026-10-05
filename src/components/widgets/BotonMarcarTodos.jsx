import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';

export default function BotonMarcarTodos() {
  const { PUNTOS, sesionFinalizada, marcarTodosPuntos } = useProyecto();
  const [guardando, setGuardando] = useState(false);
  const [errorAccion, setErrorAccion] = useState(null);
  const marcables = PUNTOS.filter((p) => !p.encabezado);
  const todosMarcados = marcables.length > 0 && marcables.every((p) => p.tratado);

  async function alternar() {
    setGuardando(true);
    try {
      await marcarTodosPuntos(!todosMarcados);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudieron actualizar los puntos.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <BotonIcono
        icono={todosMarcados ? 'ri-checkbox-multiple-blank-line' : 'ri-checkbox-multiple-line'}
        ariaLabel={todosMarcados ? 'Desmarcar todos' : 'Marcar todos'}
        disabled={marcables.length === 0 || sesionFinalizada || guardando}
        onClick={alternar}
      />
      <Modal abierto={!!errorAccion} titulo="No se pudo actualizar" onCerrar={() => setErrorAccion(null)}>
        <p>{errorAccion}</p>
      </Modal>
    </>
  );
}
