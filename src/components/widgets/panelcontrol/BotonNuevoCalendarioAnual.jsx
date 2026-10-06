import BotonAgregar from '../../base/BotonAgregar.jsx';
import { useUI } from '../../../context/UIContext.jsx';

export default function BotonNuevoCalendarioAnual() {
  const { panelControlActivo, setMostrarFormularioCalendario } = useUI();

  if (panelControlActivo !== 'calendarizacionAnual') return null;

  return (
    <BotonAgregar etiqueta="Nuevo calendario" onClick={() => setMostrarFormularioCalendario((v) => !v)}>+</BotonAgregar>
  );
}
