import { useState } from 'react';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import ExploradorArchivos from './ExploradorArchivos.jsx';
import { carpetasDePapelera } from '../../utils/arbolArchivos.js';
import { etiquetaFecha } from '../../utils/fechas.js';
import { motivoPapelera } from '../../utils/papelera.js';
import ReintegrarPunto from './ReintegrarPunto.jsx';
import '../../styles/widgets/NavegadorPapelera.css';

export default function NavegadorPapelera() {
  const { PAPELERA, SECCIONES_DOCUMENTO } = useProyecto();
  const { abrirVistaArchivo } = useUI();
  const [seleccion, setSeleccion] = useState(null);

  const carpetas = carpetasDePapelera(PAPELERA, SECCIONES_DOCUMENTO).map((c) => {
    const punto = PAPELERA.find((p) => p.id === c.id);
    const motivo = motivoPapelera(punto.motivo);
    const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === punto.seccion)?.nombre ?? punto.seccion;
    const origen = punto.motivo === 'borrador' ? 'Sin sesión' : `Sesión del ${etiquetaFecha(punto.sesionOrigenId)}`;
    return { ...c, tono: motivo.tono, detalle: `${motivo.texto} · ${seccion} · ${origen}` };
  });

  function accionFila(puntoId) {
    const punto = PAPELERA.find((p) => p.id === puntoId);
    return punto ? <ReintegrarPunto punto={punto} /> : null;
  }

  return (
    <div className="widget-navegador-papelera">
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
