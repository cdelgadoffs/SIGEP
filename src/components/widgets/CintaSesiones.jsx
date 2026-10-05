import { useState } from 'react';
import FechasSesiones from '../base/FechasSesiones.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { etiquetaMes } from '../../utils/fechas.js';
import '../../styles/widgets/CintaSesiones.css';

export default function CintaSesiones({ textoVacio }) {
  const { FECHAS_SESIONES: fechas, sesionActivaFecha, cargarSesion, cargando, error } = useProyecto();
  const [mesSeleccionadoManual, setMesSeleccionadoManual] = useState(null);

  const mesesDisponibles = Array.from(new Set(fechas.map((f) => f.id.substring(0, 7)))).sort();
  const mesPorDefecto = sesionActivaFecha ? sesionActivaFecha.substring(0, 7) : mesesDisponibles[0];
  const mesFiltro = mesSeleccionadoManual ?? mesPorDefecto;

  const opcionesMes = mesesDisponibles.map((m) => ({ id: m, label: etiquetaMes(m) }));
  const etiquetaActual = mesFiltro ? etiquetaMes(mesFiltro) : '—';
  const fechasFiltradas = mesFiltro
    ? fechas.filter((f) => f.id.substring(0, 7) === mesFiltro)
    : fechas;

  const proximaGlobal = fechas.find((f) => f.estado === 'proxima');
  const mostrarVolverProxima = proximaGlobal && proximaGlobal.id.substring(0, 7) !== mesFiltro;

  const textoSinSesiones = error
    ? `No se pudo cargar la información: ${error.mensaje}`
    : cargando ? 'Cargando…' : textoVacio;

  function volverAProxima() {
    setMesSeleccionadoManual(proximaGlobal.id.substring(0, 7));
    cargarSesion(proximaGlobal.id);
  }

  function avanzarMes(delta) {
    const [anio, mes] = mesFiltro.split('-').map(Number);
    let nuevoMes = mes + delta;
    let nuevoAnio = anio;
    if (nuevoMes < 1) { nuevoMes = 12; nuevoAnio--; }
    if (nuevoMes > 12) { nuevoMes = 1; nuevoAnio++; }
    setMesSeleccionadoManual(`${nuevoAnio}-${String(nuevoMes).padStart(2, '0')}`);
  }

  return (
    <div className="widget-cinta-sesiones">
      <OpcionesNavegacion
        onAnterior={() => avanzarMes(-1)}
        onSiguiente={() => avanzarMes(1)}
        etiquetaAnterior="Mes anterior"
        etiquetaSiguiente="Mes siguiente"
      >
        {mostrarVolverProxima && (
          <BotonIcono icono="ri-arrow-go-back-line" ariaLabel="Volver a la próxima sesión" onClick={volverAProxima} />
        )}
      </OpcionesNavegacion>
      <ListaExpandible
        valorActual={mesFiltro}
        etiquetaActual={etiquetaActual}
        opciones={opcionesMes}
        onSeleccionar={setMesSeleccionadoManual}
      />
      <FechasSesiones fechas={fechasFiltradas} activaId={sesionActivaFecha} onSeleccionar={cargarSesion} textoVacio={textoSinSesiones} />
    </div>
  );
}
