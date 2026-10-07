import Topbar from '../components/widgets/Topbar.jsx';
import VisorArchivo from '../components/widgets/VisorArchivo.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar3 from '../components/base/Sidebar3.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import Sidebar6 from '../components/base/Sidebar6.jsx';
import ListaAsuetos from '../components/widgets/panelcontrol/ListaAsuetos.jsx';
import FormularioAsueto from '../components/widgets/panelcontrol/FormularioAsueto.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import FormularioPunto from '../components/widgets/FormularioPunto.jsx';
import ListaPuntosProyecto from '../components/widgets/ListaPuntosProyecto.jsx';
import BotonCerrarLista from '../components/widgets/BotonCerrarLista.jsx';
import BotonDescargar from '../components/widgets/BotonDescargar.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/panelcontrol/MenuPanelControl.jsx';
import { useUI, ANCHO_SIDEBAR3, ALTO_TOPBAR, ALTO_CINTA } from '../context/UIContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { useAjustesVisuales } from '../context/AjustesVisualesContext.jsx';
import { encabezadoSesion, subtituloAsuetos } from '../utils/sesiones.js';
import '../styles/pages/ProyectoOrdenDia.css';

export default function ProyectoOrdenDia() {
  const {
    izquierdaSidebar1, izquierdaSidebar3,
    sidebar3Abierto, cerrarSidebar3, puntoEnEdicionId,
    sidebar5Abierto, cerrarSidebar5,
    sidebar5Ancho,
    sidebar5Amplio,
    sidebar6Abierto, izquierdaSidebar6,
    terminoBusqueda, setTerminoBusqueda,
  } = useUI();
  const { sesionSeleccionada, sesionFinalizada, listaCerrada, CALENDARIO } = useProyecto();
  const { vistaCompletaProyecto, cambiarAjuste } = useAjustesVisuales();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const panelIzquierda = izquierdaSidebar3 + (sidebar3Abierto ? ANCHO_SIDEBAR3 : 0);
  const arriba = ALTO_TOPBAR + ALTO_CINTA;
  const arribaSidebar = arriba - 1;

  return (
    <>
      <VisorArchivo />
      <Topbar
        terminoBusqueda={terminoBusqueda}
        onCambiarBusqueda={setTerminoBusqueda}
        mostrarNuevaExtraordinaria={!sidebar3Abierto}
        opcionesConfiguracion={[
          vistaCompletaProyecto
            ? { id: 'vista', label: 'Ver por sección', icono: 'ri-list-unordered' }
            : { id: 'vista', label: 'Ver lista completa', icono: 'ri-stack-line' },
        ]}
        onSeleccionarConfiguracion={() => cambiarAjuste('vistaCompletaProyecto', !vistaCompletaProyecto)}
      />
      <CintaSesiones
        textoVacio="Aún no hay sesiones programadas."
        titulo={sidebar3Abierto && sesionSeleccionada ? `${sesionActual.titulo} · ${sesionActual.subtitulo}` : undefined}
      />
      <Sidebar1
        izquierda={izquierdaSidebar1}
        arriba={arribaSidebar}
        titulo={sesionActual.titulo}
        subtitulo={sesionActual.subtitulo}
        pie={sesionSeleccionada && !sesionFinalizada && !sidebar3Abierto ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <BotonCerrarLista />
            {listaCerrada && <BotonDescargar />}
          </div>
        ) : null}
      >
        <MenuPrincipalSesion />
      </Sidebar1>
      <Sidebar3
        abierto={sidebar3Abierto}
        izquierda={izquierdaSidebar3}
        arriba={arribaSidebar}
        badge={puntoEnEdicionId ? 'Editar punto' : 'Nuevo punto'}
        onCerrar={cerrarSidebar3}
      >
        <FormularioPunto />
      </Sidebar3>
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
        <ListaPuntosProyecto />
      </PanelPrincipal>
    </>
  );
}
