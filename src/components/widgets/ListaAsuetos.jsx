import { useState } from 'react';
import CardS from '../base/CardS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { etiquetaFecha } from '../../utils/fechas.js';
import '../../styles/widgets/ListaAsuetos.css';

export default function ListaAsuetos() {
  const { CALENDARIO, ANIO_CALENDARIO, quitarAsueto } = useProyecto();
  const [error, setError] = useState(null);
  const [quitando, setQuitando] = useState(false);

  const asuetos = [...(CALENDARIO?.asuetos ?? [])].sort((a, b) => (a.fecha < b.fecha ? -1 : 1));

  async function quitar(fecha) {
    setError(null);
    setQuitando(true);
    try {
      await quitarAsueto(ANIO_CALENDARIO, fecha);
    } catch (e) {
      setError(e.mensaje || 'No se pudo quitar el asueto.');
    } finally {
      setQuitando(false);
    }
  }

  return (
    <div className="widget-lista-asuetos">
      {error && <div className="widget-lista-asuetos-error">{error}</div>}
      {asuetos.length === 0 ? (
        <div className="widget-lista-asuetos-vacio">No hay asuetos registrados</div>
      ) : (
        asuetos.map((a) => (
          <CardS
            key={a.fecha}
            titulo={etiquetaFecha(a.fecha)}
            subtitulo={`→ ${etiquetaFecha(a.destino)}`}
            onEliminar={() => quitar(a.fecha)}
            eliminarDeshabilitado={quitando}
          />
        ))
      )}
    </div>
  );
}
