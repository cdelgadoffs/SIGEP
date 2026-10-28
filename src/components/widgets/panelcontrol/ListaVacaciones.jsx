import CardS from '../../base/CardS.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import { etiquetaFecha } from '../../../utils/fechas.js';
import '../../../styles/widgets/panelcontrol/ListaVacaciones.css';

function diasEntre(inicio, fin) {
  return Math.round((new Date(`${fin}T00:00:00`) - new Date(`${inicio}T00:00:00`)) / 86400000) + 1;
}

export default function ListaVacaciones() {
  const { CALENDARIO } = useProyecto();
  const vacaciones = [...(CALENDARIO?.vacaciones ?? [])].sort((a, b) => (a.inicio < b.inicio ? -1 : 1));

  return (
    <div className="widget-lista-vacaciones">
      <span className="widget-lista-vacaciones-titulo">Periodos vacacionales ({vacaciones.length})</span>
      {vacaciones.length === 0 ? (
        <div className="widget-lista-vacaciones-vacio">No hay periodos vacacionales registrados</div>
      ) : (
        vacaciones.map((v) => {
          const dias = diasEntre(v.inicio, v.fin);
          return (
            <CardS
              key={`${v.inicio}-${v.fin}`}
              titulo={`${etiquetaFecha(v.inicio)} — ${etiquetaFecha(v.fin)}`}
              subtitulo={`${dias} ${dias === 1 ? 'día' : 'días'}`}
            />
          );
        })
      )}
    </div>
  );
}
