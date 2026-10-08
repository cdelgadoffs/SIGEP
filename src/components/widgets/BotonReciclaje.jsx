import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/BotonReciclaje.css';

export default function BotonReciclaje() {
  const { PAPELERA } = useProyecto();
  const { setSidebar4Abierto } = useUI();
  return (
    <button type="button" className="widget-boton-reciclaje" onClick={() => setSidebar4Abierto(true)}>
      Reciclaje{PAPELERA.length > 0 ? ` (${PAPELERA.length})` : ''}
    </button>
  );
}
