import Topbar from '../components/widgets/Topbar.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import Sidebar6 from '../components/base/Sidebar6.jsx';
import ListaAsuetos from '../components/widgets/panelcontrol/ListaAsuetos.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/panelcontrol/MenuPanelControl.jsx';
import { useUI, ALTO_TOPBAR, ALTO_CINTA } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion, subtituloAsuetos } from '../utils/sesiones.js';
import '../styles/pages/Inicio.css';

export default function Inicio() {
  const {
    izquierdaSidebar1, izquierdaSidebar3,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
    sidebar6Abierto, setSidebar6Abierto, izquierdaSidebar6,
    terminoBusqueda, setTerminoBusqueda,
  } = useUI();
  const { sesionSeleccionada, CALENDARIO } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const panelIzquierda = izquierdaSidebar3;
  const arriba = ALTO_TOPBAR + ALTO_CINTA;
  const arribaSidebar = arriba - 1;

  return (
    <>
      <Topbar
        terminoBusqueda={terminoBusqueda}
        onCambiarBusqueda={setTerminoBusqueda}
      />
      <CintaSesiones textoVacio="Aún no hay sesiones programadas." />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        arriba={arribaSidebar}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
      >
        <MenuPrincipalSesion />
      </Sidebar1>
      <Sidebar5
        abierto={sidebar5Abierto}
        ancho={sidebar5Ancho}
        accionesHeader={<AccionesHeaderPanelControl />}
        onCerrar={cerrarSidebar5}
      >
        <MenuPanelControl />
      </Sidebar5>
      <Sidebar6
        abierto={sidebar6Abierto}
        izquierda={izquierdaSidebar6}
        titulo="Días de asueto"
        subtitulo={subtituloAsuetos(CALENDARIO)}
        onCerrar={() => setSidebar6Abierto(false)}
      >
        <ListaAsuetos />
      </Sidebar6>
      <PanelPrincipal izquierda={panelIzquierda} arriba={arriba}>
        <div className="pg-inicio">
          <h1 className="pg-inicio-titulo">Inicio</h1>
          <p className="pg-inicio-texto">Aún no hay una sesión en curso.</p>
        </div>
      </PanelPrincipal>
    </>
  );
}
