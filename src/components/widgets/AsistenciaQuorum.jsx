import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Checkbox from '../base/Checkbox.jsx';
import Modal from '../base/Modal.jsx';
import BotonS from '../base/BotonS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useOrgano } from '../../context/OrganoContext.jsx';
import '../../styles/widgets/AsistenciaQuorum.css';

function iniciales(nombre) {
  return (nombre || '').trim().split(/\s+/).slice(0, 2).map((p) => p[0]).join('').toUpperCase();
}

export default function AsistenciaQuorum() {
  const { ASISTENCIA, GRADOS, registrarAsistencia, sesionActivaFecha, sesionFinalizada, cargando, error } = useProyecto();
  const { INTEGRANTES } = useOrgano();
  const { puedeEscribir } = useAuth();
  const [errorAccion, setErrorAccion] = useState(null);

  const filas = ASISTENCIA
    .map((a) => ({ ...a, integrante: INTEGRANTES.find((i) => i.id === a.integranteId) }))
    .filter((f) => f.integrante);
  const presentes = filas.filter((f) => f.presente).length;
  const deshabilitado = !sesionActivaFecha || sesionFinalizada || !puedeEscribir;

  async function cambiar(integranteId, presente) {
    setErrorAccion(null);
    try {
      await registrarAsistencia(integranteId, presente);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo registrar la asistencia.');
    }
  }

  function alternarFila(e, fila) {
    if (deshabilitado || e.target.closest('input, label')) return;
    cambiar(fila.integranteId, !fila.presente);
  }

  const vacio = error
    ? `No se pudo cargar la información: ${error.mensaje}`
    : cargando ? 'Cargando…' : 'Sin integrantes registrados';

  return (
    <div className="widget-asistencia-quorum">
      <div className="widget-asistencia-quorum-encabezado">
        <span className="widget-asistencia-quorum-titulo">Quórum</span>
        <span className={'widget-asistencia-quorum-conteo' + (filas.length > 0 && presentes === filas.length ? ' widget-asistencia-quorum-conteo-completo' : '')}>
          {presentes} / {filas.length}
        </span>
      </div>
      <div className="widget-asistencia-quorum-lista">
        {filas.length === 0 && <span className="widget-asistencia-quorum-vacio">{vacio}</span>}
        {filas.map((f) => (
          <div
            key={f.integranteId}
            className={'widget-asistencia-quorum-fila' + (f.presente ? ' widget-asistencia-quorum-fila-presente' : '') + (deshabilitado ? ' widget-asistencia-quorum-fila-fija' : '')}
            onClick={(e) => alternarFila(e, f)}
          >
            <div className={'widget-asistencia-quorum-avatar' + (f.integrante.presidente ? ' widget-asistencia-quorum-avatar-presidente' : '')}>
              {iniciales(f.integrante.nombre) || '?'}
            </div>
            <div className="widget-asistencia-quorum-datos">
              <div className="widget-asistencia-quorum-nombre">{f.integrante.nombre}{f.integrante.presidente ? ' · Presidente' : ''}</div>
              <div className="widget-asistencia-quorum-grado">{GRADOS.find((g) => g.id === f.integrante.grado)?.nombre ?? ''}</div>
            </div>
            <Checkbox checked={f.presente} disabled={deshabilitado} onChange={(valor) => cambiar(f.integranteId, valor)} />
          </div>
        ))}
      </div>
      <Modal abierto={!!errorAccion} titulo="Quórum" onCerrar={() => setErrorAccion(null)}>
        <p className="widget-asistencia-quorum-mensaje">{errorAccion}</p>
        <div className="widget-asistencia-quorum-modal-acciones">
          <BotonS variant="claro" onClick={() => setErrorAccion(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
