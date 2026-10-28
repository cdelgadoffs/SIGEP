import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import ExploradorArchivos from './ExploradorArchivos.jsx';
import { carpetasDePapelera } from '../../utils/arbolArchivos.js';
import { etiquetaFecha } from '../../utils/fechas.js';
import '../../styles/widgets/NavegadorPapelera.css';

const MOTIVOS = {
  borrador: { texto: 'Borrador', tono: 'azul' },
  pendiente: { texto: 'Pendiente en lista', tono: 'naranja' },
  eliminado: { texto: 'Eliminado', tono: 'rojo' },
};

export default function NavegadorPapelera() {
  const { puedeEscribir } = useAuth();
  const { PAPELERA, SECCIONES_DOCUMENTO, sesionSeleccionada, sesionFinalizada, restaurarPunto } = useProyecto();
  const { abrirVistaArchivo, continuarBorrador } = useUI();
  const [seleccion, setSeleccion] = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);
  const [error, setError] = useState(null);

  const puedeRestaurar = puedeEscribir && !!sesionSeleccionada && !sesionFinalizada && !sesionSeleccionada.horaInicio;
  const puedeContinuar = puedeEscribir && ['proxima', 'pendiente'].includes(sesionSeleccionada?.estado);

  const carpetas = carpetasDePapelera(PAPELERA, SECCIONES_DOCUMENTO).map((c) => {
    const punto = PAPELERA.find((p) => p.id === c.id);
    const motivo = MOTIVOS[punto.motivo] ?? MOTIVOS.pendiente;
    const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === punto.seccion)?.nombre ?? punto.seccion;
    const origen = punto.motivo === 'borrador' ? 'Sin sesión' : `Sesión del ${etiquetaFecha(punto.sesionOrigenId)}`;
    return { ...c, tono: motivo.tono, detalle: `${motivo.texto} · ${seccion} · ${origen}` };
  });

  async function restaurar(id) {
    setError(null);
    setRestaurandoId(id);
    try {
      await restaurarPunto(id);
    } catch (e) {
      setError(e.mensaje || 'No se pudo reintegrar el punto.');
    } finally {
      setRestaurandoId(null);
    }
  }

  function accionFila(puntoId) {
    const punto = PAPELERA.find((p) => p.id === puntoId);
    if (!punto) return null;
    const detener = { onDoubleClick: (e) => e.stopPropagation() };
    if (punto.motivo === 'borrador') {
      return (
        <span {...detener}>
          <BotonIcono icono="ri-edit-line" ariaLabel="Continuar borrador" disabled={!puedeContinuar} onClick={(e) => { e.stopPropagation(); continuarBorrador(punto.id, punto.seccion); }} />
        </span>
      );
    }
    return (
      <span {...detener}>
        <BotonIcono
          icono="ri-arrow-go-back-line"
          ariaLabel="Reintegrar a la sesión"
          disabled={!puedeRestaurar || restaurandoId === punto.id}
          onClick={(e) => { e.stopPropagation(); restaurar(punto.id); }}
        />
      </span>
    );
  }

  return (
    <div className="widget-navegador-papelera">
      {error && <div className="widget-navegador-papelera-error">{error}</div>}
      <ExploradorArchivos
        carpetas={carpetas}
        tituloRaiz="Papelería de reciclaje"
        placeholderBusqueda="Buscar en la papelera"
        textoVacio={({ buscando, busqueda, enCarpeta }) => (buscando ? `Sin resultados para «${busqueda}».` : enCarpeta ? 'Esta carpeta está vacía.' : 'La papelera está vacía.')}
        claveSeleccionada={seleccion}
        onSeleccionar={(el) => setSeleccion(el?.clave ?? null)}
        onAbrirArchivo={(archivo) => abrirVistaArchivo(archivo)}
        accionFila={accionFila}
      />
    </div>
  );
}
