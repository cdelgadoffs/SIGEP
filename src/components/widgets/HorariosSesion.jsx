import { useState } from 'react';
import CampoHora from '../base/CampoHora.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { horaDeISO } from '../../utils/fechas.js';
import '../../styles/widgets/HorariosSesion.css';

export default function HorariosSesion() {
  const { sesionSeleccionada, sesionFinalizada, editarHorario } = useProyecto();
  const [error, setError] = useState(null);

  const inicio = sesionSeleccionada?.horaInicio;
  const fin = sesionSeleccionada?.horaFin;
  if (!inicio && !fin) return null;

  async function cambiar(clave, hhmm) {
    if (clave === 'horaInicio' && fin && hhmm > horaDeISO(fin)) {
      setError('La hora de inicio no puede ser posterior a la hora de fin.');
      return;
    }
    if (clave === 'horaFin' && inicio && hhmm < horaDeISO(inicio)) {
      setError('La hora de fin no puede ser anterior a la hora de inicio.');
      return;
    }
    try {
      await editarHorario({ [clave]: hhmm });
    } catch (e) {
      setError(e.mensaje || 'No se pudo actualizar el horario.');
    }
  }

  return (
    <div className="widget-horarios-sesion">
      {inicio && (
        <div className="widget-horarios-sesion-tarjeta widget-horarios-sesion-inicio">
          <span>Comenzó a las</span>
          <CampoHora value={horaDeISO(inicio)} onChange={(hhmm) => cambiar('horaInicio', hhmm)} tono="verde" ariaLabel="Hora de inicio" disabled={sesionFinalizada} />
        </div>
      )}
      {fin && (
        <div className="widget-horarios-sesion-tarjeta widget-horarios-sesion-fin">
          <span>Finalizó a las</span>
          <CampoHora value={horaDeISO(fin)} onChange={(hhmm) => cambiar('horaFin', hhmm)} tono="rojo" ariaLabel="Hora de fin" disabled={sesionFinalizada} />
        </div>
      )}
      <Modal abierto={!!error} titulo="Horario" onCerrar={() => setError(null)}>
        <p className="widget-horarios-sesion-mensaje">{error}</p>
        <div className="widget-horarios-sesion-modal-acciones">
          <BotonS variant="claro" onClick={() => setError(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
