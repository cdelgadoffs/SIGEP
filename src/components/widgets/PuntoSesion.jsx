import { useEffect, useRef } from 'react';
import TarjetaPuntoSesion from './TarjetaPuntoSesion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import { puntosOrdenados, puntoActivo } from '../../utils/puntos.js';
import '../../styles/widgets/PuntoSesion.css';

export default function PuntoSesion() {
  const { PUNTOS, SECCIONES_DOCUMENTO, cargando, error } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId } = useUI();
  const { vistaCompletaSesion } = useAjustesVisuales();
  const elementos = useRef({});

  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO);
  const activo = puntoActivo(items, puntoSesionSeleccionadoId);
  const activoId = activo?.punto.id;

  useEffect(() => {
    if (vistaCompletaSesion && activoId) elementos.current[activoId]?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [vistaCompletaSesion, activoId]);

  if (!activo) {
    const mensaje = error
      ? `No se pudo cargar la información: ${error.mensaje}`
      : cargando ? 'Cargando…' : 'Esta sesión no tiene puntos.';
    return <div className="widget-punto-sesion"><div className="widget-punto-sesion-vacio">{mensaje}</div></div>;
  }

  if (!vistaCompletaSesion) {
    const indice = items.indexOf(activo);
    const irA = (delta) => setPuntoSesionSeleccionadoId(items[indice + delta].punto.id);
    return (
      <div className="widget-punto-sesion">
        <TarjetaPuntoSesion
          item={activo}
          navegacion={{
            onAnterior: () => irA(-1),
            onSiguiente: () => irA(1),
            anteriorDeshabilitado: indice === 0,
            siguienteDeshabilitado: indice === items.length - 1,
          }}
        />
      </div>
    );
  }

  return (
    <div className="widget-punto-sesion">
      {SECCIONES_DOCUMENTO.map((seccion) => {
        const delaSeccion = items.filter((i) => i.seccion.id === seccion.id);
        if (delaSeccion.length === 0) return null;
        return (
          <div key={seccion.id} className="widget-punto-sesion-grupo">
            <div className="widget-punto-sesion-seccion-titulo">{seccion.nombre}</div>
            {delaSeccion.map((item) => (
              <div
                key={item.punto.id}
                ref={(el) => { elementos.current[item.punto.id] = el; }}
                className={'widget-punto-sesion-item' + (item.punto.id === activoId ? ' widget-punto-sesion-item-seleccionado' : '')}
                onClick={() => setPuntoSesionSeleccionadoId(item.punto.id)}
              >
                <TarjetaPuntoSesion item={item} />
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}
