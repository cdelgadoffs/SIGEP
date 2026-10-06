import { useState } from 'react';
import CardS from '../../base/CardS.jsx';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import { etiquetaMes } from '../../../utils/fechas.js';
import '../../../styles/widgets/panelcontrol/ListaSesionesMes.css';

const ESTADO_LABEL = {
  proxima: 'Próxima',
  'no-celebrada': 'No celebrada',
  pendiente: 'Pendiente',
  celebrada: 'Celebrada',
};

function mesActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export default function ListaSesionesMes() {
  const { FECHAS_SESIONES, sesionActivaFecha, cargarSesion } = useProyecto();
  const [mes, setMes] = useState(() => (sesionActivaFecha || mesActualISO()).slice(0, 7));

  const mesesDisponibles = [...new Set([...FECHAS_SESIONES.map((f) => f.id.slice(0, 7)), mesActualISO()])].sort();
  const opcionesMes = mesesDisponibles.map((m) => ({ id: m, label: etiquetaMes(m) }));
  const delMes = FECHAS_SESIONES.filter((f) => f.id.startsWith(`${mes}-`));
  const celebradas = delMes.filter((f) => f.estado === 'celebrada').length;

  return (
    <div className="widget-lista-sesiones-mes">
      <div className="widget-lista-sesiones-mes-selector">
        <ListaExpandible valorActual={mes} etiquetaActual={etiquetaMes(mes)} opciones={opcionesMes} onSeleccionar={setMes} />
      </div>
      <p className="widget-lista-sesiones-mes-resumen">Sesiones: {delMes.length} · Celebradas: {celebradas}</p>
      <div className="widget-lista-sesiones-mes-lista">
        {delMes.length === 0 && <p className="widget-lista-sesiones-mes-vacio">No hay sesiones en este mes.</p>}
        {delMes.map((f) => (
          <CardS
            key={f.id}
            estado={f.estado}
            titulo={`Sesión Ordinaria N° ${f.numeroSesion ?? '—'}`}
            subtitulo={f.label}
            estadoLabel={f.id === sesionActivaFecha ? 'Activa' : ESTADO_LABEL[f.estado]}
            onClick={() => cargarSesion(f.id)}
            onEliminar={() => {}}
            eliminarDeshabilitado
          />
        ))}
      </div>
    </div>
  );
}
