import BuscadorGlobal from '../base/BuscadorGlobal.jsx';
import FechaDia from '../base/FechaDia.jsx';
import BotonS from '../base/BotonS.jsx';
import BotonExpandible from '../base/BotonExpandible.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { URL_LOGO } from '../../utils/logo.js';
import '../../styles/widgets/Topbar.css';

export default function Topbar({ terminoBusqueda, onCambiarBusqueda, opcionesConfiguracion = [], onSeleccionarConfiguracion }) {
  const { toggleSidebar5 } = useUI();
  const { cerrarSesion } = useAuth();

  return (
    <header className="widget-topbar">
      <div className="widget-topbar-left">
        <button type="button" className="widget-topbar-menu" aria-label="Alternar panel" onClick={toggleSidebar5}>☰</button>
        <img
          className="widget-topbar-logo"
          src={URL_LOGO}
          alt="Logo institucional"
        />
      </div>
      <div className="widget-topbar-right">
        <BuscadorGlobal value={terminoBusqueda} onChange={onCambiarBusqueda} placeholder="Buscar punto..." />
        <FechaDia />
        <BotonS onClick={cerrarSesion}>Salir</BotonS>
        <BotonExpandible
          icono="ri-settings-3-line"
          ariaLabel="Configuración visual"
          opciones={opcionesConfiguracion}
          onSeleccionar={onSeleccionarConfiguracion}
          textoVacio="Sin configuraciones en esta vista."
        />
      </div>
    </header>
  );
}
