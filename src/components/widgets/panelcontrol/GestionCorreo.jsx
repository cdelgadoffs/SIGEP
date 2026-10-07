import ContactosCorreo from './ContactosCorreo.jsx';
import ListasDestinatarios from './ListasDestinatarios.jsx';
import CorreosRemitentes from './CorreosRemitentes.jsx';
import PlantillasCorreo from './PlantillasCorreo.jsx';
import '../../../styles/widgets/panelcontrol/GestionCorreo.css';

export default function GestionCorreo() {
  return (
    <div className="widget-gestion-correo">
      <div className="widget-gestion-correo-columna">
        <ContactosCorreo />
        <ListasDestinatarios />
      </div>
      <div className="widget-gestion-correo-columna">
        <CorreosRemitentes />
      </div>
      <div className="widget-gestion-correo-columna">
        <PlantillasCorreo />
      </div>
    </div>
  );
}
