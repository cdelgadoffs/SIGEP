import { createContext, useContext, useState } from 'react';
import { leerAjustesVisuales, guardarAjustesVisuales } from '../services/AjustesVisuales.js';
import { FILTROS_CINTA } from '../utils/sesiones.js';
import { NIVELES_BRILLO } from '../utils/brillo.js';

const AjustesVisualesContext = createContext(null);

const FILTROS_RECICLAJE = ['todos', 'pendiente', 'eliminado'];

export function AjustesVisualesProvider({ children }) {
  const [ajustes, setAjustes] = useState(leerAjustesVisuales);

  function cambiarAjuste(clave, valor) {
    guardarAjustesVisuales({ [clave]: valor });
    setAjustes((a) => ({ ...a, [clave]: valor }));
  }

  const value = {
    vistaCompletaProyecto: ajustes.vistaCompletaProyecto === true,
    vistaCompletaSesion: ajustes.vistaCompletaSesion === true,
    infoNavegadorAbierta: ajustes.infoNavegadorAbierta === true,
    filtroReciclaje: FILTROS_RECICLAJE.includes(ajustes.filtroReciclaje) ? ajustes.filtroReciclaje : 'todos',
    filtroCinta: FILTROS_CINTA.some((f) => f.id === ajustes.filtroCinta) ? ajustes.filtroCinta : 'todas',
    brilloPantalla: NIVELES_BRILLO.includes(ajustes.brilloPantalla) ? ajustes.brilloPantalla : 0,
    cambiarAjuste,
  };
  return <AjustesVisualesContext.Provider value={value}>{children}</AjustesVisualesContext.Provider>;
}

export function useAjustesVisuales() {
  return useContext(AjustesVisualesContext);
}
