import { useEffect, useRef, useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import CampoTexto from '../base/CampoTexto.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/EditarNumeroSesion.css';

export default function EditarNumeroSesion() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, establecerNumeroSesion } = useProyecto();
  const [abierto, setAbierto] = useState(false);
  const [texto, setTexto] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);
  const campoRef = useRef(null);

  useEffect(() => {
    if (abierto) campoRef.current?.focus();
  }, [abierto]);

  if (!puedeEscribir || !sesionSeleccionada || sesionSeleccionada.celebrada) return null;

  const numero = Number(texto);
  const valido = Number.isInteger(numero) && numero >= 1;

  function abrir() {
    setTexto('');
    setError(null);
    setAbierto(true);
  }

  async function guardar() {
    if (!valido || guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await establecerNumeroSesion(numero);
      setAbierto(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar el número de sesión.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <>
      <BotonIcono icono="ri-pencil-line" ariaLabel="Editar número de sesión" onClick={abrir} />
      <Modal abierto={abierto} titulo="Editar número de sesión" onCerrar={() => setAbierto(false)}>
        <div className="widget-editar-numero-sesion">
          <div className="widget-editar-numero-sesion-actual">
            <span className="widget-editar-numero-sesion-actual-texto">Sesión {nombreTipoSesion(sesionSeleccionada.tipo)} · número actual</span>
            <span className="widget-editar-numero-sesion-actual-numero">N° {sesionSeleccionada.numeroSesion ?? '—'}</span>
          </div>
          <span className="widget-editar-numero-sesion-etiqueta">Nuevo número</span>
          <CampoTexto variant="claro" type="number" value={texto} onChange={setTexto} onEnter={guardar} placeholder="Escribe el nuevo número" ariaLabel="Nuevo número de sesión" inputRef={campoRef} />
          <span className="widget-editar-numero-sesion-ayuda">Las sesiones siguientes de este año continuarán desde este número.</span>
          {error && <div className="widget-editar-numero-sesion-error">{error}</div>}
          <div className="widget-editar-numero-sesion-acciones">
            <BotonS variant="claro" onClick={() => setAbierto(false)}>Cancelar</BotonS>
            <BotonS variant="claro" onClick={guardar} disabled={!valido || guardando}>Guardar</BotonS>
          </div>
        </div>
      </Modal>
    </>
  );
}
