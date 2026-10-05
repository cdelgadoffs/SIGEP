import { useEffect, useLayoutEffect, useState } from 'react';
import BotonS from '../../components/base/BotonS.jsx';
import BotonAgregar from '../../components/base/BotonAgregar.jsx';
import CardS from '../../components/base/CardS.jsx';
import ListaExpandible from '../../components/base/ListaExpandible.jsx';
import FormularioCalendario from '../../components/widgets/FormularioCalendario.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { etiquetaMes } from '../../utils/fechas.js';

const ESTADO_LABEL = {
  proxima: 'Próxima',
  'no-celebrada': 'No celebrada',
  pendiente: 'Pendiente',
  celebrada: 'Celebrada',
};

const ESTILO_SELECTOR = {
  background: '#232323',
  border: '1px solid #3a3a3a',
  borderRadius: '4px',
  padding: '7px 10px',
  color: '#eee',
  fontSize: '12.5px',
};

function mesActualISO() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
}

export function BotonNuevoCalendarioAnual() {
  const { panelControlActivo, setMostrarFormularioCalendario } = useUI();

  if (panelControlActivo !== 'calendarizacionAnual') return null;

  return (
    <BotonAgregar etiqueta="Nuevo calendario" onClick={() => setMostrarFormularioCalendario((v) => !v)}>+</BotonAgregar>
  );
}

export default function CalendarizacionAnual() {
  const { setSidebar5Ancho, setSidebar6Abierto, setPanelControlActivo, mostrarFormularioCalendario, setMostrarFormularioCalendario } = useUI();
  const { FECHAS_SESIONES, CALENDARIO, sesionActivaFecha, cargarSesion } = useProyecto();
  const [mes, setMes] = useState(() => (sesionActivaFecha || mesActualISO()).slice(0, 7));

  useEffect(() => {
    setSidebar5Ancho(true);
    return () => setSidebar5Ancho(false);
  }, [setSidebar5Ancho]);

  useEffect(() => {
    setSidebar6Abierto(mostrarFormularioCalendario);
    return () => setSidebar6Abierto(false);
  }, [mostrarFormularioCalendario, setSidebar6Abierto]);

  useLayoutEffect(() => {
    setMostrarFormularioCalendario(FECHAS_SESIONES.length === 0);
  }, []);

  const mesesDisponibles = [...new Set([...FECHAS_SESIONES.map((f) => f.id.slice(0, 7)), mesActualISO()])].sort();
  const opcionesMes = mesesDisponibles.map((m) => ({ id: m, label: etiquetaMes(m) }));
  const delMes = FECHAS_SESIONES.filter((f) => f.id.startsWith(`${mes}-`));
  const celebradas = delMes.filter((f) => f.estado === 'celebrada').length;

  return (
    <div style={{ margin: '16px 20px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
      <div style={{ alignSelf: 'flex-start' }}>
        <BotonS onClick={() => setPanelControlActivo(null)}>Volver</BotonS>
      </div>

      {mostrarFormularioCalendario ? (
        <FormularioCalendario key={CALENDARIO ? 'con-calendario' : 'sin-calendario'} onGenerado={() => setMostrarFormularioCalendario(false)} />
      ) : (
        <>
          <div style={ESTILO_SELECTOR}>
            <ListaExpandible valorActual={mes} etiquetaActual={etiquetaMes(mes)} opciones={opcionesMes} onSeleccionar={setMes} />
          </div>
          <p style={{ color: '#aaa', fontSize: '12.5px', margin: 0 }}>
            Sesiones: {delMes.length} · Celebradas: {celebradas}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {delMes.length === 0 && (
              <p style={{ color: '#777', fontSize: '12.5px', fontStyle: 'italic', margin: 0 }}>No hay sesiones en este mes.</p>
            )}
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
        </>
      )}
    </div>
  );
}
