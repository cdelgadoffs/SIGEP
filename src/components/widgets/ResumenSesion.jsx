import Card from '../base/Card.jsx';
import BotonDescargar from './BotonDescargar.jsx';
import BotonDescargarActa from './BotonDescargarActa.jsx';
import BotonDescargarEngroses from './BotonDescargarEngroses.jsx';
import BotonDescargarArchivosSesion from './BotonDescargarArchivosSesion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { horaDeISO } from '../../utils/fechas.js';
import { contarPuntos } from '../../utils/puntos.js';
import '../../styles/widgets/ResumenSesion.css';

export default function ResumenSesion() {
  const { sesionSeleccionada, sesionFinalizada, listaCerrada, PUNTOS } = useProyecto();

  if (!sesionSeleccionada) return null;

  const total = contarPuntos(PUNTOS);
  const { horaInicio, horaFin } = sesionSeleccionada;

  return (
    <div className="widget-resumen-sesion">
      <div className="widget-resumen-sesion-lista">
        {listaCerrada ? 'Lista de puntos cerrada' : 'Lista de puntos abierta'} · {total} {total === 1 ? 'punto' : 'puntos'}
      </div>
      {sesionFinalizada && (
        <>
          <div className="widget-resumen-sesion-celebrada">
            <Card>
              <div className="widget-resumen-sesion-celebrada-contenido">
                <div className="widget-resumen-sesion-celebrada-titulo">Sesión celebrada</div>
                {horaInicio && horaFin && (
                  <p className="widget-resumen-sesion-horario">
                    <strong>Inicio:</strong> {horaDeISO(horaInicio)} · <strong>Fin:</strong> {horaDeISO(horaFin)}
                  </p>
                )}
                <BotonDescargarArchivosSesion />
                <BotonDescargarEngroses etiqueta="Descargar engroses (ZIP)" />
              </div>
            </Card>
          </div>
          <BotonDescargar />
          <BotonDescargarActa />
        </>
      )}
    </div>
  );
}
