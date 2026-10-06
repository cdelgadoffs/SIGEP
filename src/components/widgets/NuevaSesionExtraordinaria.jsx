import { useState } from 'react';
import BotonAgregar from '../base/BotonAgregar.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import Checkbox from '../base/Checkbox.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { etiquetaFechaConDia, fechaHoyISO } from '../../utils/fechas.js';
import '../../styles/widgets/NuevaSesionExtraordinaria.css';

export default function NuevaSesionExtraordinaria() {
  const { obtenerFechasExtraordinaria, crearSesionExtraordinaria } = useProyecto();
  const { setVistaActual } = useUI();
  const [abierto, setAbierto] = useState(false);
  const [fechas, setFechas] = useState([]);
  const [fecha, setFecha] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [creando, setCreando] = useState(false);
  const [error, setError] = useState(null);

  async function abrir() {
    setAbierto(true);
    setConfirmado(false);
    setError(null);
    setFechas([]);
    setFecha('');
    setCargando(true);
    try {
      const disponibles = await obtenerFechasExtraordinaria();
      setFechas(disponibles);
      setFecha(disponibles.includes(fechaHoyISO()) ? fechaHoyISO() : (disponibles[0] ?? ''));
    } catch (e) {
      setError(e.mensaje || 'No se pudieron consultar las fechas disponibles.');
    } finally {
      setCargando(false);
    }
  }

  async function crear() {
    if (!confirmado || !fecha || creando) return;
    setCreando(true);
    setError(null);
    try {
      await crearSesionExtraordinaria(fecha);
      setAbierto(false);
      setVistaActual('proyecto');
    } catch (e) {
      setError(e.mensaje || 'No se pudo crear la sesión.');
    } finally {
      setCreando(false);
    }
  }

  const etiqueta = fecha ? etiquetaFechaConDia(fecha) : (cargando ? 'Cargando…' : 'No hay fechas disponibles');

  return (
    <>
      <BotonAgregar etiqueta="Nueva extraordinaria" onClick={abrir}>+</BotonAgregar>
      <Modal abierto={abierto} titulo="Nueva sesión extraordinaria" onCerrar={() => setAbierto(false)}>
        <div className="widget-nueva-extraordinaria">
          <span className="widget-nueva-extraordinaria-etiqueta">Fecha de la sesión</span>
          <div className="widget-nueva-extraordinaria-selector">
            <ListaExpandible
              valorActual={fecha}
              etiquetaActual={etiqueta}
              opciones={fechas.map((f) => ({ id: f, label: etiquetaFechaConDia(f) }))}
              onSeleccionar={setFecha}
            />
          </div>
          <Checkbox checked={confirmado} onChange={setConfirmado} label="Confirmo que quiero crear esta sesión extraordinaria" />
          {error && <div className="widget-nueva-extraordinaria-error">{error}</div>}
          <div className="widget-nueva-extraordinaria-acciones">
            <BotonS variant="claro" onClick={() => setAbierto(false)}>Cancelar</BotonS>
            <BotonS variant="claro" onClick={crear} disabled={!confirmado || !fecha || creando}>Crear</BotonS>
          </div>
        </div>
      </Modal>
    </>
  );
}
