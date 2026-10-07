import { useState } from 'react';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import CampoFecha from '../../base/CampoFecha.jsx';
import BotonS from '../../base/BotonS.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import { etiquetaFecha, sumarDiasISO, diaDeSemana } from '../../../utils/fechas.js';
import '../../../styles/widgets/panelcontrol/FormularioAsueto.css';

export default function FormularioAsueto() {
  const { CALENDARIO, ANIO_CALENDARIO: anio, agregarAsueto } = useProyecto();
  const [fecha, setFecha] = useState('');
  const [destino, setDestino] = useState('');
  const [estado, setEstado] = useState(null);
  const [guardando, setGuardando] = useState(false);

  if (!CALENDARIO) return null;

  async function agregar() {
    setGuardando(true);
    setEstado(null);
    try {
      await agregarAsueto(anio, { fecha, destino });
      setFecha('');
      setDestino('');
      setEstado({ texto: 'Asueto agregado.', ok: true });
    } catch (e) {
      setEstado({ texto: e.mensaje || 'No se pudo agregar el asueto.', ok: false });
    } finally {
      setGuardando(false);
    }
  }

  const esDiaDeSesion = !!fecha && diaDeSemana(fecha) === CALENDARIO.diaSemana;
  const repetido = !!fecha && CALENDARIO.asuetos.some((a) => a.fecha === fecha);
  const anterior = fecha ? sumarDiasISO(fecha, -1) : '';
  const siguiente = fecha ? sumarDiasISO(fecha, 1) : '';
  const destinos = esDiaDeSesion && !repetido
    ? [
        { id: anterior, label: `${etiquetaFecha(anterior)} (día anterior)` },
        { id: siguiente, label: `${etiquetaFecha(siguiente)} (día siguiente)` },
      ]
    : [];
  const etiquetaDestino = destinos.find((d) => d.id === destino)?.label ?? 'Selecciona destino';

  return (
    <div className="widget-formulario-asueto">
      <div className="widget-formulario-asueto-campo">
        <span className="widget-formulario-asueto-etiqueta">Fecha</span>
        <CampoFecha
          value={fecha}
          onChange={(valor) => { setFecha(valor); setDestino(''); setEstado(null); }}
          min={`${anio}-01-01`}
          max={`${anio}-12-31`}
          ariaLabel="Fecha del asueto"
        />
      </div>
      {destinos.length > 0 && (
        <div className="widget-formulario-asueto-campo">
          <span className="widget-formulario-asueto-etiqueta">Reprogramar a</span>
          <div className="widget-formulario-asueto-selector">
            <ListaExpandible valorActual={destino} etiquetaActual={etiquetaDestino} opciones={destinos} onSeleccionar={setDestino} />
          </div>
        </div>
      )}
      {fecha && !esDiaDeSesion && (
        <div className="widget-formulario-asueto-aviso">Esa fecha no coincide con un día de sesión ordinaria; no requiere reprogramación.</div>
      )}
      {repetido && <div className="widget-formulario-asueto-aviso">Ya existe un asueto registrado en esa fecha.</div>}
      <div className="widget-formulario-asueto-acciones">
        <BotonS onClick={agregar} disabled={!destino || guardando}>Agregar asueto</BotonS>
        {fecha && <BotonS onClick={() => { setFecha(''); setDestino(''); }}>Cancelar</BotonS>}
      </div>
      {estado && (
        <div className={'widget-formulario-asueto-estado' + (estado.ok ? ' widget-formulario-asueto-estado-ok' : '')}>
          {estado.texto}
        </div>
      )}
    </div>
  );
}
