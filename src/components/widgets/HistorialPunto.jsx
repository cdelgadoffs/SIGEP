import { useEffect, useState } from 'react';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { encabezadoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/HistorialPunto.css';

const ACCIONES = {
  creado: { texto: 'Creado', icono: 'ri-add-circle-line' },
  editado: { texto: 'Editado', icono: 'ri-edit-line' },
  trasladado: { texto: 'Trasladado de sesión', icono: 'ri-share-forward-line' },
  eliminado: { texto: 'Eliminado', icono: 'ri-delete-bin-line' },
};

const LIMITE_FRAGMENTO = 90;

function recortar(texto) {
  return texto.length > LIMITE_FRAGMENTO ? `${texto.slice(0, LIMITE_FRAGMENTO)}…` : texto;
}

function fechaHora(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function HistorialPunto({ puntoId }) {
  const { PUNTOS, FECHAS_SESIONES, listarHistorialPunto } = useProyecto();
  const [carga, setCarga] = useState({ clave: null, eventos: [], error: false });
  const version = PUNTOS.find((p) => p.id === puntoId)?.version;
  const clave = `${puntoId}:${version}`;

  useEffect(() => {
    let vigente = true;
    listarHistorialPunto(puntoId)
      .then((eventos) => { if (vigente) setCarga({ clave, eventos, error: false }); })
      .catch(() => { if (vigente) setCarga({ clave, eventos: [], error: true }); });
    return () => { vigente = false; };
  }, [puntoId, clave, listarHistorialPunto]);

  const cargando = carga.clave !== clave;

  function nombreSesion(id) {
    const sesion = FECHAS_SESIONES.find((s) => s.id === id);
    if (!sesion) return id;
    const { titulo, subtitulo } = encabezadoSesion(sesion);
    return `${titulo} · ${subtitulo}`;
  }

  function detalleDe(evento) {
    const d = evento.detalle;
    if (!d) return null;
    if (evento.accion === 'trasladado') return `${nombreSesion(d.origenId)} → ${nombreSesion(d.destinoId)}`;
    if (evento.accion === 'editado') {
      if (!d.fragmento && !d.fragmentoAnterior) return null;
      if (d.tipo === 'agregado') return `Se agregó: «${recortar(d.fragmento)}»`;
      if (d.tipo === 'eliminado') return `Se quitó: «${recortar(d.fragmento)}»`;
      if (d.fragmentoAnterior) return `«${recortar(d.fragmentoAnterior)}» → «${recortar(d.fragmento)}»`;
      return `Cambio: «${recortar(d.fragmento)}»`;
    }
    return null;
  }

  return (
    <div className="widget-historial-punto">
      <div className="widget-historial-punto-titulo">Historial</div>
      {cargando && <p className="widget-historial-punto-vacio">Cargando…</p>}
      {!cargando && carga.error && <p className="widget-historial-punto-vacio">No se pudo cargar el historial.</p>}
      {!cargando && !carga.error && carga.eventos.length === 0 && <p className="widget-historial-punto-vacio">Sin eventos registrados.</p>}
      {!cargando && !carga.error && carga.eventos.length > 0 && (
        <ol className="widget-historial-punto-lista">
          {carga.eventos.map((evento) => {
            const accion = ACCIONES[evento.accion] ?? { texto: evento.accion, icono: 'ri-time-line' };
            const detalle = detalleDe(evento);
            return (
              <li key={evento.id} className="widget-historial-punto-evento">
                <i className={`${accion.icono} widget-historial-punto-icono`}></i>
                <div className="widget-historial-punto-cuerpo">
                  <span className="widget-historial-punto-accion">{accion.texto}</span>
                  {detalle && <span className="widget-historial-punto-detalle">{detalle}</span>}
                  <span className="widget-historial-punto-meta">{[evento.autor, fechaHora(evento.creadoEn)].filter(Boolean).join(' · ')}</span>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
