import Topbar from '../components/widgets/Topbar.jsx';
import CintaSesiones from '../components/widgets/CintaSesiones.jsx';
import Sidebar1 from '../components/base/Sidebar1.jsx';
import Sidebar5 from '../components/base/Sidebar5.jsx';
import Sidebar4 from '../components/base/Sidebar4.jsx';
import Sidebar6 from '../components/base/Sidebar6.jsx';
import ListaAsuetos from '../components/widgets/panelcontrol/ListaAsuetos.jsx';
import FormularioAsueto from '../components/widgets/panelcontrol/FormularioAsueto.jsx';
import PanelPrincipal from '../components/base/PanelPrincipal.jsx';
import VisorArchivo from '../components/widgets/VisorArchivo.jsx';
import VistaNavegador from '../components/widgets/VistaNavegador.jsx';
import VistaPreviaActa from '../components/widgets/VistaPreviaActa.jsx';
import EncabezadoActa from '../components/widgets/EncabezadoActa.jsx';
import TituloActa from '../components/widgets/TituloActa.jsx';
import BotonActa from '../components/widgets/BotonActa.jsx';
import InfoElementoNavegador from '../components/widgets/InfoElementoNavegador.jsx';
import ResumenSesion from '../components/widgets/ResumenSesion.jsx';
import MenuPrincipalSesion from '../components/widgets/MenuPrincipalSesion.jsx';
import MenuPanelControl, { AccionesHeaderPanelControl } from '../components/widgets/panelcontrol/MenuPanelControl.jsx';
import { useUI, ALTO_TOPBAR, ALTO_CINTA, ANCHO_SIDEBAR1, ANCHO_SIDEBAR4, ANCHO_ACTA, ANCHO_PESTANA_ACTA } from '../context/UIContext.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useAjustesVisuales } from '../context/AjustesVisualesContext.jsx';
import { useProyecto } from '../context/ProyectoContext.jsx';
import { encabezadoSesion, subtituloAsuetos, opcionesFiltroCinta, filtroDeOpcion, hayActaVisible, claveAjusteInfoNavegador } from '../utils/sesiones.js';

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
  const { usuario, puedeEscribir } = useAuth();
  const { sesionSeleccionada, sesionFinalizada, CALENDARIO } = useProyecto();
  const { infoNavegadorAbierta, infoNavegadorConActa, actaPlegada, filtroCinta, cambiarAjuste } = useAjustesVisuales();
  const sesionActual = encabezadoSesion(sesionSeleccionada);
  const anchoSidebar1 = sesionFinalizada ? ANCHO_SIDEBAR1_CELEBRADA : ANCHO_SIDEBAR1;
  const panelIzquierda = izquierdaSidebar1 + anchoSidebar1;
  const arriba = ALTO_TOPBAR + ALTO_CINTA;
  const arribaSidebar = arriba - 1;
  const hayActa = hayActaVisible(sesionSeleccionada, puedeEscribir);
  const actaAbierta = hayActa && !actaPlegada;
  const ocupaActa = hayActa ? (actaAbierta ? ANCHO_ACTA : ANCHO_PESTANA_ACTA) : 0;
  const infoAbierta = hayActa ? infoNavegadorConActa : infoNavegadorAbierta;

  return (
    <>
      <VisorArchivo />
      <Topbar
        terminoBusqueda={terminoBusqueda}
        onCambiarBusqueda={setTerminoBusqueda}
        opcionesConfiguracion={opcionesFiltroCinta(filtroCinta)}
        onSeleccionarConfiguracion={(id) => cambiarAjuste('filtroCinta', filtroDeOpcion(id))}
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
        subtitulo={usuario?.correo}
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
      <Sidebar4
        abierto={infoAbierta}
        derecha={ocupaActa}
        arriba={arriba}
        titulo="Información"
        onCerrar={() => cambiarAjuste(claveAjusteInfoNavegador(hayActa), false)}
      >
        <InfoElementoNavegador />
      </Sidebar4>
      {hayActa && (
        <Sidebar4
          abierto={actaAbierta}
          ancho={ANCHO_ACTA}
          arriba={arriba}
          titulo={<TituloActa />}
          encabezadoBlanco
          encabezado={<EncabezadoActa />}
          onCerrar={() => cambiarAjuste('actaPlegada', true)}
        >
          <VistaPreviaActa />
        </Sidebar4>
      )}
      {hayActa && !actaAbierta && <BotonActa arriba={arriba} />}
      <PanelPrincipal izquierda={panelIzquierda} derecha={ocupaActa + (infoAbierta ? ANCHO_SIDEBAR4 : 0)} arriba={arriba}>
        <VistaNavegador />
      </PanelPrincipal>
    </>
  );
}
