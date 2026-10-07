import { useState } from 'react';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import CampoFecha from '../../base/CampoFecha.jsx';
import Checkbox from '../../base/Checkbox.jsx';
import BotonS from '../../base/BotonS.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import Modal from '../../base/Modal.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import { etiquetaFecha } from '../../../utils/fechas.js';
import '../../../styles/widgets/panelcontrol/FormularioCalendario.css';

const DIAS = [
  { id: 1, label: 'Lunes' },
  { id: 2, label: 'Martes' },
  { id: 3, label: 'Miércoles' },
  { id: 4, label: 'Jueves' },
  { id: 5, label: 'Viernes' },
];
const DIA_POR_DEFECTO = 3;

export default function FormularioCalendario({ onGenerado }) {
  const { CALENDARIO, ANIO_CALENDARIO: anio, generarCalendarioAnual, resumenArchivoCalendario } = useProyecto();
  const existe = !!CALENDARIO;
  const diaGuardado = CALENDARIO ? CALENDARIO.diaSemana : null;
  const [diaSemana, setDiaSemana] = useState(diaGuardado ?? DIA_POR_DEFECTO);
  const [vacaciones, setVacaciones] = useState(CALENDARIO ? CALENDARIO.vacaciones : []);
  const [vacInicio, setVacInicio] = useState('');
  const [vacFin, setVacFin] = useState('');
  const [sobrescribir, setSobrescribir] = useState(!CALENDARIO);
  const [resumen, setResumen] = useState(null);
  const [enviando, setEnviando] = useState(false);
  const [estado, setEstado] = useState(null);

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
      setEstado({ texto: 'Debes marcar «Sobrescribir y empezar de cero» para regenerar el calendario.', ok: false });
      return;
    }
    if (existe) {
      setEnviando(true);
      setEstado(null);
      try {
        setResumen(await resumenArchivoCalendario(anio));
      } catch (e) {
        setEstado({ texto: e.mensaje || 'No se pudo preparar la regeneración del calendario.', ok: false });
      } finally {
        setEnviando(false);
      }
      return;
    }
    await ejecutarGeneracion();
  }

  async function ejecutarGeneracion() {
    setResumen(null);
    setEnviando(true);
    setEstado(null);
    try {
      const generacion = await generarCalendarioAnual(anio, { diaSemana, vacaciones }, sobrescribir);
      setEstado({
        texto: generacion && generacion.resumen.sesiones > 0
          ? `Calendario generado. Se archivaron ${generacion.resumen.sesiones} sesiones y ${generacion.resumen.puntos} puntos.`
          : 'Calendario generado correctamente.',
        ok: true,
      });
      setSobrescribir(false);
      if (onGenerado) onGenerado();
    } catch (e) {
      setEstado({ texto: e.mensaje || 'No se pudo generar el calendario.', ok: false });
    } finally {
      setEnviando(false);
    }
  }

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
        {existe && (
          <div className="widget-formulario-calendario-aviso">Al regenerar el calendario se archivan las sesiones, los puntos y los asuetos del año, y se empieza de cero.</div>
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
        <Checkbox checked={sobrescribir} onChange={setSobrescribir} label="Sobrescribir y empezar de cero" />
      </div>

      <BotonS onClick={generar} disabled={enviando}>Generar calendario anual</BotonS>
      <Modal abierto={!!resumen} titulo="Regenerar el calendario" onCerrar={() => setResumen(null)}>
        {resumen && (
          <>
            <p className="widget-formulario-calendario-modal-texto">
              Se archivarán {resumen.sesiones} {resumen.sesiones === 1 ? 'sesión' : 'sesiones'}
              {' '}({resumen.celebradas} {resumen.celebradas === 1 ? 'celebrada' : 'celebradas'}, {resumen.extraordinarias} {resumen.extraordinarias === 1 ? 'extraordinaria' : 'extraordinarias'}),
              {' '}{resumen.puntos} {resumen.puntos === 1 ? 'punto' : 'puntos'} y {resumen.archivos} {resumen.archivos === 1 ? 'archivo adjunto' : 'archivos adjuntos'} de {anio}.
              Dejarán de verse en la aplicación pero se conservan en la base de datos. Los asuetos se reinician y la numeración de las sesiones vuelve a empezar en 1.
            </p>
            <div className="widget-formulario-calendario-modal-acciones">
              <BotonS variant="claro" onClick={() => setResumen(null)}>Cancelar</BotonS>
              <BotonS variant="claro" onClick={ejecutarGeneracion}>Archivar y regenerar</BotonS>
            </div>
          </>
        )}
      </Modal>
      {estado && (
        <div className={'widget-formulario-calendario-estado' + (estado.ok ? ' widget-formulario-calendario-estado-ok' : '')}>
          {estado.texto}
        </div>
      )}
    </div>
  );
}
