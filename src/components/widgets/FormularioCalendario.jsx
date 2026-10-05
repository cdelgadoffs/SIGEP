import { useState } from 'react';
import ListaExpandible from '../base/ListaExpandible.jsx';
import CampoFecha from '../base/CampoFecha.jsx';
import Checkbox from '../base/Checkbox.jsx';
import BotonS from '../base/BotonS.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { etiquetaFecha, sumarDiasISO, diaDeSemana } from '../../utils/fechas.js';
import '../../styles/widgets/FormularioCalendario.css';

const DIAS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
];
const DIA_POR_DEFECTO = 3;

export default function FormularioCalendario({ onGenerado }) {
  const { CALENDARIO, ANIO_CALENDARIO: anio, generarCalendarioAnual, agregarAsueto } = useProyecto();
  const { sidebar6Abierto, setSidebar6Abierto } = useUI();
  const existe = !!CALENDARIO;
  const diaGuardado = CALENDARIO ? CALENDARIO.diaSemana : null;
  const asuetos = CALENDARIO ? CALENDARIO.asuetos : [];
  const [diaSemana, setDiaSemana] = useState(diaGuardado ?? DIA_POR_DEFECTO);
  const [vacaciones, setVacaciones] = useState(CALENDARIO ? CALENDARIO.vacaciones : []);
  const [vacInicio, setVacInicio] = useState('');
  const [vacFin, setVacFin] = useState('');
  const [asuetoFecha, setAsuetoFecha] = useState('');
  const [asuetoDestino, setAsuetoDestino] = useState('');
  const [sobrescribir, setSobrescribir] = useState(!CALENDARIO);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null);
  const [estadoAsueto, setEstadoAsueto] = useState(null);
  const [guardandoAsueto, setGuardandoAsueto] = useState(false);

  function agregarVacacion() {
    if (!vacInicio || !vacFin) {
      setEstado({ texto: 'Selecciona ambas fechas.', ok: false });
      return;
    }
    if (vacInicio > vacFin) {
      setEstado({ texto: 'La fecha de inicio debe ser anterior a la de fin.', ok: false });
      return;
    }
    setVacaciones((lista) => [...lista, { inicio: vacInicio, fin: vacFin }]);
    setVacInicio('');
    setVacFin('');
    setEstado(null);
  }

  async function generar() {
    if (enviando) return;
    if (existe && !sobrescribir) {
      setEstado({ texto: 'Debes marcar «Sobrescribir calendario existente» para regenerar el calendario.', ok: false });
      return;
    }
    setEnviando(true);
    setEstado(null);
    try {
      await generarCalendarioAnual(anio, { diaSemana, vacaciones }, sobrescribir);
      setEstado({ texto: 'Calendario generado correctamente.', ok: true });
      setSobrescribir(false);
      if (onGenerado) onGenerado();
    } catch (e) {
      setEstado({ texto: e.mensaje || 'No se pudo generar el calendario.', ok: false });
    } finally {
      setEnviando(false);
    }
  }

  async function agregarElAsueto() {
    setGuardandoAsueto(true);
    setEstadoAsueto(null);
    try {
      await agregarAsueto(anio, { fecha: asuetoFecha, destino: asuetoDestino });
      setAsuetoFecha('');
      setAsuetoDestino('');
      setEstadoAsueto({ texto: 'Asueto agregado.', ok: true });
    } catch (e) {
      setEstadoAsueto({ texto: e.mensaje || 'No se pudo agregar el asueto.', ok: false });
    } finally {
      setGuardandoAsueto(false);
    }
  }

  const esDiaDeSesion = !!asuetoFecha && diaGuardado !== null && diaDeSemana(asuetoFecha) === diaGuardado;
  const asuetoRepetido = !!asuetoFecha && asuetos.some((a) => a.fecha === asuetoFecha);
  const anterior = asuetoFecha ? sumarDiasISO(asuetoFecha, -1) : '';
  const siguiente = asuetoFecha ? sumarDiasISO(asuetoFecha, 1) : '';
  const destinos = esDiaDeSesion && !asuetoRepetido
    ? [
        { id: anterior, label: `${etiquetaFecha(anterior)} (día anterior)` },
        { id: siguiente, label: `${etiquetaFecha(siguiente)} (día siguiente)` },
      ]
    : [];
  const etiquetaDestino = destinos.find((d) => d.id === asuetoDestino)?.label ?? 'Selecciona destino';
  const desde = `${anio}-01-01`;
  const hasta = `${anio}-12-31`;

  return (
    <div className="widget-formulario-calendario">
      <div className="widget-formulario-calendario-seccion">
        <div className="widget-formulario-calendario-titulo">
          <span className="widget-formulario-calendario-num">1</span>
          Día de sesión ordinaria
        </div>
        <div className="widget-formulario-calendario-selector">
          <ListaExpandible
            valorActual={diaSemana}
            etiquetaActual={DIAS.find((d) => d.id === diaSemana).label}
            opciones={DIAS}
            onSeleccionar={setDiaSemana}
          />
        </div>
        <div className="widget-formulario-calendario-pista">
          Las sesiones ordinarias de {anio} se programarán cada semana en este día.
        </div>
        {existe && diaGuardado !== diaSemana && asuetos.length > 0 && (
          <div className="widget-formulario-calendario-aviso">Al cambiar el día se descartarán los asuetos registrados.</div>
        )}
      </div>

      <div className="widget-formulario-calendario-seccion">
        <div className="widget-formulario-calendario-titulo">
          <span className="widget-formulario-calendario-num">2</span>
          Periodo vacacional
        </div>
        <div className="widget-formulario-calendario-fechas">
          <div className="widget-formulario-calendario-campo">
            <span className="widget-formulario-calendario-etiqueta">Inicio</span>
            <CampoFecha value={vacInicio} onChange={setVacInicio} min={desde} max={hasta} ariaLabel="Inicio del periodo vacacional" />
          </div>
          <div className="widget-formulario-calendario-campo">
            <span className="widget-formulario-calendario-etiqueta">Fin</span>
            <CampoFecha value={vacFin} onChange={setVacFin} min={vacInicio || desde} max={hasta} ariaLabel="Fin del periodo vacacional" />
          </div>
        </div>
        <div className="widget-formulario-calendario-accion">
          <BotonS onClick={agregarVacacion}>Agregar periodo vacacional</BotonS>
        </div>
        <div className="widget-formulario-calendario-chips">
          {vacaciones.length === 0
            ? <span className="widget-formulario-calendario-vacio">Ningún periodo agregado</span>
            : vacaciones.map((v, i) => (
                <BadgeDinamico
                  key={`${v.inicio}-${v.fin}-${i}`}
                  texto={`${etiquetaFecha(v.inicio)} — ${etiquetaFecha(v.fin)}`}
                  onEliminar={() => setVacaciones((lista) => lista.filter((_, j) => j !== i))}
                />
              ))}
        </div>
      </div>

      <div className="widget-formulario-calendario-sobrescribir">
        <Checkbox checked={sobrescribir} onChange={setSobrescribir} label="Sobrescribir calendario existente" />
      </div>

      <BotonS onClick={generar} disabled={enviando}>Generar calendario anual</BotonS>
      {estado && (
        <div className={'widget-formulario-calendario-estado' + (estado.ok ? ' widget-formulario-calendario-estado-ok' : '')}>
          {estado.texto}
        </div>
      )}

      <div className="widget-formulario-calendario-seccion widget-formulario-calendario-seccion-asueto">
        <div className="widget-formulario-calendario-titulo">
          <span className="widget-formulario-calendario-num">3</span>
          Día de asueto
        </div>
        {!existe ? (
          <div className="widget-formulario-calendario-pista">Genera primero el calendario para poder agregar asuetos.</div>
        ) : (
          <>
            <div className="widget-formulario-calendario-pista">
              Si un día de sesión cae en asueto, la sesión se reprograma al día anterior o siguiente. Se aplica de inmediato, sin regenerar el calendario; los asuetos registrados están en el panel lateral.
            </div>
            <div className="widget-formulario-calendario-campo">
              <span className="widget-formulario-calendario-etiqueta">Fecha</span>
              <CampoFecha
                value={asuetoFecha}
                onChange={(valor) => { setAsuetoFecha(valor); setAsuetoDestino(''); setEstadoAsueto(null); }}
                min={desde}
                max={hasta}
                ariaLabel="Fecha del asueto"
              />
            </div>
            {destinos.length > 0 && (
              <div className="widget-formulario-calendario-campo">
                <span className="widget-formulario-calendario-etiqueta">Reprogramar a</span>
                <div className="widget-formulario-calendario-selector">
                  <ListaExpandible valorActual={asuetoDestino} etiquetaActual={etiquetaDestino} opciones={destinos} onSeleccionar={setAsuetoDestino} />
                </div>
              </div>
            )}
            {asuetoFecha && !esDiaDeSesion && (
              <div className="widget-formulario-calendario-aviso">Esa fecha no coincide con un día de sesión ordinaria; no requiere reprogramación.</div>
            )}
            {asuetoRepetido && <div className="widget-formulario-calendario-aviso">Ya existe un asueto registrado en esa fecha.</div>}
            <div className="widget-formulario-calendario-acciones">
              <BotonS onClick={agregarElAsueto} disabled={!asuetoDestino || guardandoAsueto}>Agregar asueto</BotonS>
              {asuetoFecha && <BotonS onClick={() => { setAsuetoFecha(''); setAsuetoDestino(''); }}>Cancelar</BotonS>}
              {!sidebar6Abierto && <BotonS onClick={() => setSidebar6Abierto(true)}>Ver asuetos</BotonS>}
            </div>
            {estadoAsueto && (
              <div className={'widget-formulario-calendario-estado' + (estadoAsueto.ok ? ' widget-formulario-calendario-estado-ok' : '')}>
                {estadoAsueto.texto}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
