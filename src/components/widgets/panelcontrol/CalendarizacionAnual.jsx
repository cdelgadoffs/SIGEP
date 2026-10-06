import { useEffect, useLayoutEffect } from 'react';
import BotonS from '../../base/BotonS.jsx';
import FormularioCalendario from './FormularioCalendario.jsx';
import ListaSesionesMes from './ListaSesionesMes.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/CalendarizacionAnual.css';

export default function CalendarizacionAnual() {
  const { setSidebar5Ancho, setSidebar6Abierto, setPanelControlActivo, mostrarFormularioCalendario, setMostrarFormularioCalendario } = useUI();
  const { FECHAS_SESIONES, CALENDARIO } = useProyecto();

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

  return (
    <div className="widget-calendarizacion-anual">
      <div className="widget-calendarizacion-anual-volver">
        <BotonS onClick={() => setPanelControlActivo(null)}>Volver</BotonS>
      </div>
      {mostrarFormularioCalendario ? (
        <FormularioCalendario key={CALENDARIO ? 'con-calendario' : 'sin-calendario'} onGenerado={() => setMostrarFormularioCalendario(false)} />
      ) : (
        <ListaSesionesMes />
      )}
    </div>
  );
}
