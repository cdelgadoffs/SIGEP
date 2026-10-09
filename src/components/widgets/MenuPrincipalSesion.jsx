import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import SubMenuDD from './SubMenuDD.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { contarPuntos } from '../../utils/puntos.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';

const VISTAS_MENU_PRINCIPAL = [
  { id: 'inicio', label: 'Inicio' },
  { id: 'proyecto', label: 'Proyecto del orden del día', expandible: true, mostrarTotalPuntos: true, estados: ['proxima', 'pendiente'] },
  { id: 'sesion', label: 'Celebrar sesión', estados: ['proxima', 'celebrada'] },
  { id: 'historial', label: 'Historial' },
];

export default function MenuPrincipalSesion() {
  const { puedeEscribir } = useAuth();
  const { SECCIONES_DOCUMENTO, PUNTOS, sesionSeleccionada, sesionFinalizada, listaCerrada, cargando, error } = useProyecto();
  const {
    vistaActual, setVistaActual,
    acordeonAbierto, setAcordeonAbierto,
    sidebar3Abierto, setSidebar3Abierto, setSeccionNuevoPunto,
    puntoEnEdicionId, setPuntoEnEdicionId,
    seccionActivaProyecto, setSeccionActivaProyecto,
  } = useUI();

  const estadoSesion = sesionSeleccionada?.estado;
  const disponibles = VISTAS_MENU_PRINCIPAL.filter((v) => !v.estados || v.estados.includes(estadoSesion));
  const vistaDisponible = disponibles.some((v) => v.id === vistaActual);

  useEffect(() => {
    if (!vistaDisponible) setVistaActual('inicio');
  }, [vistaDisponible, setVistaActual]);

  const enCurso = !!sesionSeleccionada?.horaInicio && !sesionFinalizada;
  const nombreSesion = `${nombreTipoSesion(sesionSeleccionada?.tipo)} N° ${sesionSeleccionada?.numeroSesion ?? '—'}`;
  const etiquetaCelebrar = sesionFinalizada
    ? `Sesión ${nombreSesion} celebrada`
    : enCurso ? `Celebrando sesión ${nombreSesion}` : `Celebrar sesión ${nombreSesion}`;

  const seccionesConBadge = SECCIONES_DOCUMENTO.map((s) => ({
    ...s,
    badge: PUNTOS.filter((p) => p.seccion === s.id && !p.encabezado).length,
    sinAgregar: !puedeEscribir || s.soloPuntosFijos || (listaCerrada && !s.admiteConListaCerrada),
  }));

  const avisoSecciones = seccionesConBadge.length > 0
    ? undefined
    : error ? 'No se pudieron cargar las secciones.' : cargando ? 'Cargando…' : undefined;

  function seleccionarSeccion(seccionId) {
    setSeccionActivaProyecto(seccionId);
    if (sidebar3Abierto && !puntoEnEdicionId) setSeccionNuevoPunto(seccionId);
  }

  function seleccionarVista(v) {
    if (v.expandible) {
      if (vistaActual === v.id) {
        setAcordeonAbierto((a) => !a);
      } else {
        setVistaActual(v.id);
        setAcordeonAbierto(true);
      }
      return;
    }
    setVistaActual(v.id);
  }

  return (
    <>
      {disponibles.map((v) => {
        const activo = vistaActual === v.id;
        const expandido = v.expandible && activo && acordeonAbierto;
        const label = v.id === 'sesion' && sesionSeleccionada ? etiquetaCelebrar : v.label;
        return (
          <div key={v.id}>
            <BotonSeleccionableMenu
              activo={activo}
              badge={v.mostrarTotalPuntos ? contarPuntos(PUNTOS) : undefined}
              expandible={v.expandible}
              expandido={expandido}
              deshabilitado={v.id === 'sesion' ? !listaCerrada && !sesionFinalizada && !enCurso : enCurso}
              onClick={() => seleccionarVista(v)}
            >
              {label}
            </BotonSeleccionableMenu>
            {expandido && (
              <SubMenuDD
                items={seccionesConBadge}
                subtitulo={avisoSecciones}
                activoId={seccionActivaProyecto ?? SECCIONES_DOCUMENTO[0]?.id}
                onSeleccionar={seleccionarSeccion}
                onAgregar={(seccionId) => { setSeccionActivaProyecto(seccionId); setPuntoEnEdicionId(null); setSeccionNuevoPunto(seccionId); setSidebar3Abierto(true); }}
                iconoAgregar="+"
              />
            )}
          </div>
        );
      })}
    </>
  );
}
