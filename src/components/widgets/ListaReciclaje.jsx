import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import '../../styles/widgets/ListaReciclaje.css';

const MAX_RESUMEN = 140;

export default function ListaReciclaje() {
  const { RETIRADOS, SECCIONES_DOCUMENTO, REMITENTES, sesionSeleccionada, sesionFinalizada, restaurarPunto, cargando } = useProyecto();
  const { puedeEscribir } = useAuth();
  const [error, setError] = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);

  const puedeRestaurar = puedeEscribir && !sesionFinalizada && !sesionSeleccionada?.horaInicio;

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

  const resumen = (texto) => (texto.length > MAX_RESUMEN ? `${texto.slice(0, MAX_RESUMEN).trimEnd()}…` : texto);

  return (
    <div className="widget-lista-reciclaje">
      <Scrollbar>
        <div className="widget-lista-reciclaje-contenido">
          {error && <div className="widget-lista-reciclaje-error">{error}</div>}
          {RETIRADOS.length === 0 && (
            <div className="widget-lista-reciclaje-vacio">{cargando ? 'Cargando…' : 'No hay puntos retirados.'}</div>
          )}
          {RETIRADOS.map((p) => (
            <div key={p.id} className="widget-lista-reciclaje-item">
              <div className="widget-lista-reciclaje-cabecera">
                <BadgeDinamico texto={REMITENTES.find((r) => r.id === p.remitente)?.nombre ?? p.remitente} tono="azul" />
                <BotonIcono
                  icono="ri-arrow-go-back-line"
                  ariaLabel="Reintegrar a la lista"
                  disabled={!puedeRestaurar || restaurandoId === p.id}
                  onClick={() => restaurar(p.id)}
                />
              </div>
              <span className="widget-lista-reciclaje-seccion">
                {SECCIONES_DOCUMENTO.find((s) => s.id === p.seccion)?.nombre ?? p.seccion}
              </span>
              <p className="widget-lista-reciclaje-texto">{resumen(p.contenido)}</p>
            </div>
          ))}
        </div>
      </Scrollbar>
    </div>
  );
}
