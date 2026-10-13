import { useState } from 'react';
import FechasSesiones from '../base/FechasSesiones.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import { etiquetaMes, fechaHoyISO, inicioDeSemana, sumarDiasISO } from '../../utils/fechas.js';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import '../../styles/widgets/CintaSesiones.css';

export default function CintaSesiones({ textoVacio, titulo }) {
  const { FECHAS_SESIONES: fechas, sesionActivaFecha, cargarSesion, cargando, error } = useProyecto();
  const { filtroCinta } = useAjustesVisuales();
  const [mesSeleccionadoManual, setMesSeleccionadoManual] = useState(null);
  const [semanaAnclaManual, setSemanaAnclaManual] = useState(null);
  const semanal = filtroCinta === 'semanal';

  const mesesDisponibles = Array.from(new Set(fechas.map((f) => f.id.substring(0, 7)))).sort();
  const mesPorDefecto = sesionActivaFecha ? sesionActivaFecha.substring(0, 7) : mesesDisponibles[0];
  const proximaGlobal = fechas.find((f) => f.estado === 'proxima');
  const semanaAncla = semanaAnclaManual ?? sesionActivaFecha ?? proximaGlobal?.id ?? fechaHoyISO();
  const inicioActual = inicioDeSemana(semanaAncla);
  const mesFiltro = semanal ? semanaAncla.substring(0, 7) : mesSeleccionadoManual ?? mesPorDefecto;

  const opcionesMes = mesesDisponibles.map((m) => ({ id: m, label: etiquetaMes(m) }));
  const etiquetaActual = mesFiltro ? etiquetaMes(mesFiltro) : '—';
  const delPeriodo = semanal
    ? fechas.filter((f) => inicioDeSemana(f.id) === inicioActual)
    : mesFiltro
      ? fechas.filter((f) => f.id.substring(0, 7) === mesFiltro)
      : fechas;
  const fechasFiltradas = filtroCinta === 'ordinaria' || filtroCinta === 'extraordinaria'
    ? delPeriodo.filter((f) => f.tipo === filtroCinta)
    : delPeriodo;
  const fechasConForma = fechasFiltradas.map((f) => ({ ...f, label: `${nombreTipoSesion(f.tipo)} del ${f.label}`, pildora: f.tipo === 'extraordinaria' }));

  const mostrarVolverProxima = proximaGlobal && (semanal
    ? inicioDeSemana(proximaGlobal.id) !== inicioActual
    : proximaGlobal.id.substring(0, 7) !== mesFiltro);

  const textoFiltrado = fechas.length === 0 ? textoVacio : semanal
    ? 'No hay sesiones en esta semana.'
    : filtroCinta === 'todas' ? 'No hay sesiones en este mes.' : `No hay sesiones ${filtroCinta === 'ordinaria' ? 'ordinarias' : 'extraordinarias'} en este mes.`;
  const textoSinSesiones = error
    ? `No se pudo cargar la información: ${error.mensaje}`
    : cargando ? 'Cargando…' : textoFiltrado;

  function volverAProxima() {
    setMesSeleccionadoManual(proximaGlobal.id.substring(0, 7));
    setSemanaAnclaManual(proximaGlobal.id);
    cargarSesion(proximaGlobal.id);
  }

  function seleccionarMes(mes) {
    setMesSeleccionadoManual(mes);
    if (semanal) setSemanaAnclaManual(fechas.find((f) => f.id.substring(0, 7) === mes)?.id ?? `${mes}-01`);
  }

  function avanzarSemana(delta) {
    setSemanaAnclaManual(sumarDiasISO(semanaAncla, delta * 7));
  }

  function avanzarMes(delta) {
    const [anio, mes] = mesFiltro.split('-').map(Number);
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    setMesSeleccionadoManual(`${nuevoAnio}-${String(nuevoMes).padStart(2, '0')}`);
  }

  if (titulo) {
    return (
      <div className="widget-cinta-sesiones widget-cinta-sesiones-titulo">
        <span>{titulo}</span>
      </div>
    );
  }

  return (
    <div className="widget-cinta-sesiones">
      <OpcionesNavegacion
        onAnterior={() => (semanal ? avanzarSemana(-1) : avanzarMes(-1))}
        onSiguiente={() => (semanal ? avanzarSemana(1) : avanzarMes(1))}
        etiquetaAnterior={semanal ? 'Semana anterior' : 'Mes anterior'}
        etiquetaSiguiente={semanal ? 'Semana siguiente' : 'Mes siguiente'}
      >
        {mostrarVolverProxima && (
          <BotonIcono icono="ri-arrow-go-back-line" ariaLabel="Volver a la próxima sesión" onClick={volverAProxima} />
        )}
      </OpcionesNavegacion>
      <ListaExpandible
        valorActual={mesFiltro}
        etiquetaActual={etiquetaActual}
        opciones={opcionesMes}
        onSeleccionar={seleccionarMes}
      />
      <FechasSesiones fechas={fechasConForma} activaId={sesionActivaFecha} onSeleccionar={cargarSesion} textoVacio={textoSinSesiones} />
    </div>
  );
}
