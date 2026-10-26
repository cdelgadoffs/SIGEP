import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import { etiquetaFecha } from '../../utils/fechas.js';
import '../../styles/widgets/ListaReciclaje.css';

const MAX_RESUMEN = 140;

function fechaLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const MOTIVOS = {
  pendiente: 'Pendiente',
  eliminado: 'Eliminado',
  borrador: 'Borrador',
};

export default function ListaReciclaje() {
  const { PAPELERA, SECCIONES_DOCUMENTO, REMITENTES, sesionSeleccionada, sesionFinalizada, restaurarPunto, eliminarPuntoBorrador, cargando } = useProyecto();
  const { continuarBorrador, borradorRecienteId } = useUI();
  const [borradorAEliminar, setBorradorAEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const { filtroReciclaje } = useAjustesVisuales();
  const { puedeEscribir } = useAuth();
  const [error, setError] = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);

  const puedeRestaurar = puedeEscribir && !!sesionSeleccionada && !sesionFinalizada && !sesionSeleccionada.horaInicio;
  const puedeContinuar = puedeEscribir && ['proxima', 'pendiente'].includes(sesionSeleccionada?.estado);
  const visibles = PAPELERA.filter((p) => filtroReciclaje === 'todos' || p.motivo === filtroReciclaje);

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

  function faltantes(p) {
    const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === p.seccion);
    return [
      !p.remitente && 'remitente',
      !p.contenido?.trim() && (seccion?.requiereAcuerdo === false ? 'informe' : 'punto de acuerdo'),
      seccion?.requiereAcuerdo && !p.acuerdo?.trim() && 'acuerdo',
    ].filter(Boolean);
  }

  function cancelarEliminar() {
    setBorradorAEliminar(null);
    setErrorEliminar(null);
  }

  async function confirmarEliminar() {
    setErrorEliminar(null);
    try {
      await eliminarPuntoBorrador(borradorAEliminar.id);
      setBorradorAEliminar(null);
    } catch (e) {
      setErrorEliminar(e.mensaje || 'No se pudo eliminar el borrador.');
    }
  }

  const resumen = (texto) => (texto.length > MAX_RESUMEN ? `${texto.slice(0, MAX_RESUMEN).trimEnd()}…` : texto);

  return (
    <div className="widget-lista-reciclaje">
      <Scrollbar>
        <div className="widget-lista-reciclaje-contenido">
          {error && <div className="widget-lista-reciclaje-error">{error}</div>}
          {visibles.length === 0 && (
            <div className="widget-lista-reciclaje-vacio">{cargando ? 'Cargando…' : 'No hay puntos en esta lista.'}</div>
          )}
          {visibles.map((p) => (
            <div key={p.id} className={`widget-lista-reciclaje-item widget-lista-reciclaje-item-${p.motivo}${p.id === borradorRecienteId ? ' widget-lista-reciclaje-item-reciente' : ''}`}>
              <div className="widget-lista-reciclaje-cabecera">
                <div className="widget-lista-reciclaje-etiquetas">
                  <BadgeDinamico texto={p.remitente ? (REMITENTES.find((r) => r.id === p.remitente)?.nombre ?? p.remitente) : 'Sin remitente'} tono={p.remitente ? 'azul' : 'gris'} />
                  <span className={`widget-lista-reciclaje-motivo widget-lista-reciclaje-motivo-${p.motivo}`}>{MOTIVOS[p.motivo] ?? MOTIVOS.pendiente}</span>
                </div>
                {p.motivo === 'borrador' ? (
                  <div className="widget-lista-reciclaje-botones">
                    <BotonIcono icono="ri-edit-line" ariaLabel="Continuar borrador" disabled={!puedeContinuar} onClick={() => continuarBorrador(p.id, p.seccion)} />
                    <BotonIcono icono="ri-delete-bin-line" ariaLabel="Eliminar borrador" disabled={!puedeEscribir} onClick={() => setBorradorAEliminar(p)} />
                  </div>
                ) : (
                  <BotonIcono
                    icono="ri-arrow-go-back-line"
                    ariaLabel="Reintegrar a la sesión"
                    disabled={!puedeRestaurar || restaurandoId === p.id}
                    onClick={() => restaurar(p.id)}
                  />
                )}
              </div>
              <span className="widget-lista-reciclaje-seccion">
                {SECCIONES_DOCUMENTO.find((s) => s.id === p.seccion)?.nombre ?? p.seccion} · {p.motivo === 'borrador' ? `Guardado el ${etiquetaFecha(fechaLocal(p.movidoEn))}` : `Sesión del ${etiquetaFecha(p.sesionOrigenId)}`}
              </span>
              <p className="widget-lista-reciclaje-texto">{p.contenido?.trim() ? resumen(p.contenido) : 'Sin texto'}</p>
              {p.motivo === 'borrador' && faltantes(p).length > 0 && (
                <span className="widget-lista-reciclaje-falta">Falta: {faltantes(p).join(', ')}</span>
              )}
            </div>
          ))}
        </div>
      </Scrollbar>
      <Modal abierto={!!borradorAEliminar} titulo="Eliminar borrador" onCerrar={cancelarEliminar}>
        <p className="widget-lista-reciclaje-modal-mensaje">
          ¿Quieres eliminar este borrador y sus archivos? Esta acción no se puede deshacer.
        </p>
        {errorEliminar && <div className="widget-lista-reciclaje-error">{errorEliminar}</div>}
        <div className="widget-lista-reciclaje-modal-acciones">
          <BotonS variant="claro" onClick={cancelarEliminar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={confirmarEliminar}>Eliminar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
