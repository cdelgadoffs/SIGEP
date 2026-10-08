import BadgeDinamico from '../base/BadgeDinamico.jsx';
import { agruparPorRuta, estiloArchivo } from '../../utils/archivos.js';
import '../../styles/widgets/ListaArchivosAdjuntos.css';

export default function ListaArchivosAdjuntos({ archivos, alineacion = 'inicio', agrupar = true }) {
  return (
    <div className={`widget-archivos-adjuntos widget-archivos-adjuntos-${alineacion}`}>
      {(agrupar ? agruparPorRuta(archivos) : [{ ruta: '', archivos }]).map(({ ruta, archivos: grupo }) => (
        <div key={ruta} className="widget-archivos-adjuntos-grupo">
          {ruta && (
            <span className="widget-archivos-adjuntos-carpeta" title={ruta}>
              <i className="ri-folder-line"></i>
              <span>{ruta}</span>
            </span>
          )}
          {grupo.map((a) => {
            const { icono, tono } = estiloArchivo(a.nombre);
            return (
              <BadgeDinamico
                key={a.clave}
                texto={a.nombre}
                title={!agrupar && a.ruta ? `${a.ruta}/${a.nombre}` : undefined}
                icono={icono}
                tono={tono}
                onClick={a.onClick}
                onEliminar={a.onEliminar}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
}
