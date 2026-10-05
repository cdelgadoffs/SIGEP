import { createContext, useContext, useState } from 'react';

export const ANCHO_SIDEBAR1 = 270;
export const ANCHO_SIDEBAR2 = 250;
export const ANCHO_SIDEBAR3 = 500;
export const ANCHO_SIDEBAR5 = 300;
export const ANCHO_SIDEBAR5_ANCHO = 420;
export const ALTO_TOPBAR = 52;
export const ALTO_CINTA = 50;

const UIContext = createContext(null);

export function UIProvider({ children }) {
  const [sidebar3Abierto, setSidebar3Abierto] = useState(false);
  const [sidebar4Abierto, setSidebar4Abierto] = useState(false);
  const [sidebar5Abierto, setSidebar5Abierto] = useState(false);
  const [sidebar5Ancho, setSidebar5Ancho] = useState(false);
  const [sidebar6Abierto, setSidebar6Abierto] = useState(false);
  const [panelControlActivo, setPanelControlActivo] = useState(null);
  const [mostrarFormularioCalendario, setMostrarFormularioCalendario] = useState(true);
  const [terminoBusqueda, setTerminoBusqueda] = useState('');
  const [vistaActual, setVistaActual] = useState('inicio');
  const [acordeonAbierto, setAcordeonAbierto] = useState(false);
  const [seccionNuevoPunto, setSeccionNuevoPunto] = useState(null);
  const [puntoEnEdicionId, setPuntoEnEdicionId] = useState(null);
  const [seccionActivaProyecto, setSeccionActivaProyecto] = useState(null);
  const [puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId] = useState(null);
  const izquierdaSidebar1 = 0;
  const izquierdaSidebar3 = izquierdaSidebar1 + ANCHO_SIDEBAR1;
  const izquierdaSidebar6 = sidebar5Ancho ? ANCHO_SIDEBAR5_ANCHO : ANCHO_SIDEBAR5;

  function toggleSidebar5() {
    if (sidebar5Abierto) setPanelControlActivo(null);
    setSidebar5Abierto((a) => !a);
  }
  function abrirEdicionPunto(id) {
    setPuntoEnEdicionId(id);
    setSidebar3Abierto(true);
  }
  function cerrarSidebar3() {
    setSidebar3Abierto(false);
    setPuntoEnEdicionId(null);
  }
  function cerrarSidebar5() {
    setSidebar5Abierto(false);
    setPanelControlActivo(null);
  }

  const value = {
    sidebar3Abierto, setSidebar3Abierto, cerrarSidebar3,
    sidebar4Abierto, setSidebar4Abierto,
    sidebar5Abierto, toggleSidebar5, cerrarSidebar5,
    sidebar5Ancho, setSidebar5Ancho,
    sidebar6Abierto, setSidebar6Abierto,
    panelControlActivo, setPanelControlActivo,
    mostrarFormularioCalendario, setMostrarFormularioCalendario,
    terminoBusqueda, setTerminoBusqueda,
    vistaActual, setVistaActual,
    acordeonAbierto, setAcordeonAbierto,
    seccionNuevoPunto, setSeccionNuevoPunto,
    puntoEnEdicionId, setPuntoEnEdicionId, abrirEdicionPunto,
    seccionActivaProyecto, setSeccionActivaProyecto,
    puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId,
    izquierdaSidebar1, izquierdaSidebar3, izquierdaSidebar6,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

export function useUI() {
  return useContext(UIContext);
}
