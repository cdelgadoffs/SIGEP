import Topbar from '../components/widgets/Topbar.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import Sidebar6 from '../components/base/Sidebar6.jsx';
import ListaAsuetos from '../components/widgets/panelcontrol/ListaAsuetos.jsx';
import FormularioAsueto from '../components/widgets/panelcontrol/FormularioAsueto.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import VisorArchivo from '../components/widgets/VisorArchivo.jsx';
import VistaNavegador from '../components/widgets/VistaNavegador.jsx';
import ResumenSesion from '../components/widgets/ResumenSesion.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/panelcontrol/MenuPanelControl.jsx';
import { useUI, ALTO_TOPBAR, ALTO_CINTA, ANCHO_SIDEBAR1 } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion, subtituloAsuetos } from '../utils/sesiones.js';

const ANCHO_SIDEBAR1_CELEBRADA = 340;

export default function Inicio() {
  const {
    izquierdaSidebar1,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
    sidebar5Amplio,
    sidebar6Abierto, izquierdaSidebar6,
    terminoBusqueda, setTerminoBusqueda,
  } = useUI();
  const { sesionSeleccionada, sesionFinalizada, CALENDARIO } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const anchoSidebar1 = sesionFinalizada ? ANCHO_SIDEBAR1_CELEBRADA : ANCHO_SIDEBAR1;
  const panelIzquierda = izquierdaSidebar1 + anchoSidebar1;
  const arriba = ALTO_TOPBAR + ALTO_CINTA;
  const arribaSidebar = arriba - 1;

  return (
    <>
      <VisorArchivo />
      <Topbar
        terminoBusqueda={terminoBusqueda}
        onCambiarBusqueda={setTerminoBusqueda}
      />
      <CintaSesiones textoVacio="Aún no hay sesiones programadas." />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        arriba={arribaSidebar}
        ancho={anchoSidebar1}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
      >
        <MenuPrincipalSesion />
        <ResumenSesion />
      </Sidebar1>
      <Sidebar5
        abierto={sidebar5Abierto}
        ancho={sidebar5Ancho}
        amplio={sidebar5Amplio}
        claro={sidebar5Amplio}
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
        mostrarCerrar={false}
        encabezado={<FormularioAsueto />}
      >
        <ListaAsuetos />
      </Sidebar6>
      <PanelPrincipal izquierda={panelIzquierda} arriba={arriba}>
        <VistaNavegador />
      </PanelPrincipal>
    </>
  );
}
