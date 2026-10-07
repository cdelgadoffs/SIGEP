import BotonSeleccionablePanel from '../../base/BotonSeleccionablePanel.jsx';
import CalendarizacionAnual from './CalendarizacionAnual.jsx';
import BotonNuevoCalendarioAnual from './BotonNuevoCalendarioAnual.jsx';
import Quorum from './Quorum.jsx';
import SEPLE from './SEPLE.jsx';
import Email from './Email.jsx';
import { useUI } from '../../../context/UIContext.jsx';

const ITEMS_PANEL_CONTROL = [
  { id: 'calendarizacionAnual', label: 'Calendarización anual', Panel: CalendarizacionAnual, AccionHeader: BotonNuevoCalendarioAnual },
  { id: 'quorum', label: 'Quorum', Panel: Quorum },
  { id: 'seple', label: 'SEPLE', Panel: SEPLE },
  { id: 'email', label: 'Email', Panel: Email },
];

export function AccionesHeaderPanelControl() {
  const { panelControlActivo } = useUI();
  const item = ITEMS_PANEL_CONTROL.find((i) => i.id === panelControlActivo);
  if (!item || !item.AccionHeader) return null;
  const AccionHeader = item.AccionHeader;
  return <AccionHeader />;
}

export default function MenuPanelControl() {
  const { panelControlActivo, setPanelControlActivo } = useUI();
  const activo = ITEMS_PANEL_CONTROL.find((i) => i.id === panelControlActivo);

  if (activo) {
    const Panel = activo.Panel;
    return <Panel />;
  }

  return (
    <>
      {ITEMS_PANEL_CONTROL.map((item) => (
        <BotonSeleccionablePanel key={item.id} onClick={() => setPanelControlActivo(item.id)}>
          {item.label}
        </BotonSeleccionablePanel>
      ))}
    </>
  );
}
