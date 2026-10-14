import BuscadorGlobal from '../base/BuscadorGlobal.jsx';
import FechaDia from '../base/FechaDia.jsx';
import BotonS from '../base/BotonS.jsx';
import BotonExpandible from '../base/BotonExpandible.jsx';
import NuevaSesionExtraordinaria from './NuevaSesionExtraordinaria.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import { NIVELES_BRILLO } from '../../utils/brillo.js';
import { URL_LOGO } from '../../utils/logo.js';
import logoSigepNegro from '../../assets/SIGEP-black.jpg';
import '../../styles/widgets/Topbar.css';

const PREFIJO_BRILLO = 'brillo:';

export default function Topbar({ terminoBusqueda, onCambiarBusqueda, opcionesConfiguracion = [], onSeleccionarConfiguracion, mostrarNuevaExtraordinaria = true }) {
  const { toggleSidebar5 } = useUI();
  const { usuario, cerrarSesion, puedeEscribir } = useAuth();
  const { brilloPantalla, cambiarAjuste } = useAjustesVisuales();
  const opcionesBrillo = NIVELES_BRILLO.map((nivel) => ({
    id: `${PREFIJO_BRILLO}${nivel}`,
    label: nivel === 0 ? 'Normal' : `Atenuado ${nivel} %`,
    grupo: 'Brillo de la pantalla',
    icono: nivel === brilloPantalla ? 'ri-radio-button-line' : 'ri-checkbox-blank-circle-line',
  }));

  function seleccionarConfiguracion(id) {
    if (id.startsWith(PREFIJO_BRILLO)) cambiarAjuste('brilloPantalla', Number(id.slice(PREFIJO_BRILLO.length)));
    else if (onSeleccionarConfiguracion) onSeleccionarConfiguracion(id);
  }

  return (
    <header className="widget-topbar">
      <div className="widget-topbar-left">
        {puedeEscribir && (
          <button type="button" className="widget-topbar-menu" aria-label="Alternar panel" onClick={toggleSidebar5}>☰</button>
        )}
        <img
          className="widget-topbar-logo"
          src={URL_LOGO}
          alt="Logo institucional"
        />
        <img className="widget-topbar-logo-sigep" src={logoSigepNegro} alt="SIGEP" />
      </div>
      <div className="widget-topbar-right">
        <BuscadorGlobal value={terminoBusqueda} onChange={onCambiarBusqueda} placeholder="Buscar punto..." />
        {mostrarNuevaExtraordinaria && puedeEscribir && <NuevaSesionExtraordinaria />}
        <FechaDia />
        <div className="widget-topbar-sesion">
          <span className="widget-topbar-usuario">{usuario?.nombre || usuario?.correo || ''}</span>
          <BotonS onClick={cerrarSesion}>Salir</BotonS>
        </div>
        <BotonExpandible
          icono="ri-settings-3-line"
          ariaLabel="Configuración visual"
          opciones={[...opcionesConfiguracion, ...opcionesBrillo]}
          onSeleccionar={seleccionarConfiguracion}
          textoVacio="Sin configuraciones en esta vista."
        />
      </div>
    </header>
  );
}
