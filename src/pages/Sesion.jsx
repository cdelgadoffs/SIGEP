import Topbar from '../components/widgets/Topbar.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar2 from '../components/base/Sidebar2.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import Sidebar6 from '../components/base/Sidebar6.jsx';
import ListaAsuetos from '../components/widgets/panelcontrol/ListaAsuetos.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import BotonMarcarTodos from '../components/widgets/BotonMarcarTodos.jsx';
import ListaPuntosSesion from '../components/widgets/ListaPuntosSesion.jsx';
import PuntoSesion from '../components/widgets/PuntoSesion.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import AsistenciaQuorum from '../components/widgets/AsistenciaQuorum.jsx';
import HorariosSesion from '../components/widgets/HorariosSesion.jsx';
import BotonComenzarSesion from '../components/widgets/BotonComenzarSesion.jsx';
import BotonFinalizarSesion from '../components/widgets/BotonFinalizarSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/panelcontrol/MenuPanelControl.jsx';
import { useUI, ANCHO_SIDEBAR2 } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion, subtituloAsuetos } from '../utils/sesiones.js';
import { contarPuntos } from '../utils/puntos.js';

const ANCHO_SIDEBAR1_SESION = 340;

export default function Sesion() {
  const {
    izquierdaSidebar1,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
    sidebar6Abierto, setSidebar6Abierto, izquierdaSidebar6,
    terminoBusqueda, setTerminoBusqueda,
  } = useUI();
  const { sesionSeleccionada, sesionFinalizada, CALENDARIO, PUNTOS } = useProyecto();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const izquierdaSidebar2 = izquierdaSidebar1 + ANCHO_SIDEBAR1_SESION;
  const panelIzquierda = izquierdaSidebar2 + ANCHO_SIDEBAR2;

  return (
    <>
      <Topbar
        terminoBusqueda={terminoBusqueda}
        onCambiarBusqueda={setTerminoBusqueda}
        mostrarNuevaExtraordinaria={false}
      />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        ancho={ANCHO_SIDEBAR1_SESION}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
        pie={sesionSeleccionada && !sesionFinalizada ? (sesionSeleccionada.horaInicio ? <BotonFinalizarSesion /> : <BotonComenzarSesion />) : null}
      >
        <MenuPrincipalSesion />
        <AsistenciaQuorum />
        <HorariosSesion />
      </Sidebar1>
      <Sidebar2
        izquierda={izquierdaSidebar2}
        badge="Sesión en curso"
        subtitulo={`${contarPuntos(PUNTOS)} ${contarPuntos(PUNTOS) === 1 ? 'punto' : 'puntos'}`}
        mostrarCerrar={false}
        accionesHeader={<BotonMarcarTodos />}
      >
        <ListaPuntosSesion />
      </Sidebar2>
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
      <PanelPrincipal izquierda={panelIzquierda}>
        <PuntoSesion />
      </PanelPrincipal>
    </>
  );
}
