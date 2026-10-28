import { useEffect, useRef, useState } from 'react';
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
const UMBRAL_ARRASTRE = 5;
const SEPARACION = 8;

function ordenarPapelera(papelera, orden) {
  const posicion = new Map(orden.map((id, i) => [id, i]));
  const nuevos = papelera.filter((p) => !posicion.has(p.id));
  const conLugar = papelera.filter((p) => posicion.has(p.id)).sort((a, b) => posicion.get(a.id) - posicion.get(b.id));
  return [...nuevos, ...conLugar];
}

function fechaLocal(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
const MOTIVOS = {
  pendiente: 'Pendiente en lista',
  eliminado: 'Eliminado',
  borrador: 'Borrador',
};

export default function ListaReciclaje() {
  const { PAPELERA, SECCIONES_DOCUMENTO, REMITENTES, sesionSeleccionada, sesionFinalizada, restaurarPunto, eliminarPuntoBorrador, cargando } = useProyecto();
  const { continuarBorrador, borradorRecienteId, borradorEnEdicionId, sidebar3Abierto } = useUI();
  const [borradorAEliminar, setBorradorAEliminar] = useState(null);
  const [errorEliminar, setErrorEliminar] = useState(null);
  const { filtroReciclaje, ordenPapelera, cambiarAjuste } = useAjustesVisuales();
  const [arrastre, setArrastre] = useState(null);
  const inicioRef = useRef(null);
  const itemsRef = useRef(new Map());
  const { puedeEscribir } = useAuth();
  const [error, setError] = useState(null);
  const [restaurandoId, setRestaurandoId] = useState(null);

  const puedeRestaurar = puedeEscribir && !!sesionSeleccionada && !sesionFinalizada && !sesionSeleccionada.horaInicio;
  const puedeContinuar = puedeEscribir && ['proxima', 'pendiente'].includes(sesionSeleccionada?.estado);
  const ordenada = ordenarPapelera(PAPELERA, ordenPapelera);
  const visibles = ordenada.filter((p) => filtroReciclaje === 'todos' || p.motivo === filtroReciclaje);

  const destino = (() => {
    if (!arrastre) return null;
    const desde = arrastre.indice;
    const centro = arrastre.centros[desde] + arrastre.dy;
    return arrastre.centros.filter((c, i) => i !== desde && c < centro).length;
  })();

  function desplazamiento(i) {
    if (!arrastre) return 0;
    const desde = arrastre.indice;
    if (i === desde) return arrastre.dy;
    const paso = arrastre.alturas[desde] + SEPARACION;
    if (i > desde && i <= destino) return -paso;
    if (i < desde && i >= destino) return paso;
    return 0;
  }

  function soltar(final) {
    const ids = visibles.map((p) => p.id);
    const [movido] = ids.splice(final.desde, 1);
    ids.splice(final.hasta, 0, movido);
    const visiblesSet = new Set(ids);
    let k = 0;
    const completo = ordenada.map((p) => (visiblesSet.has(p.id) ? ids[k++] : p.id));
    cambiarAjuste('ordenPapelera', completo);
  }

  const soltarRef = useRef(soltar);
  useEffect(() => {
    soltarRef.current = soltar;
  });

  useEffect(() => {
    function mover(e) {
      const inicio = inicioRef.current;
      if (!inicio) return;
      const dy = e.clientY - inicio.y;
      if (!inicio.activo) {
        if (Math.abs(dy) < UMBRAL_ARRASTRE) return;
        inicio.activo = true;
        const rects = inicio.ids.map((id) => itemsRef.current.get(id)?.getBoundingClientRect());
        inicio.centros = rects.map((r) => (r ? r.top + r.height / 2 : 0));
        inicio.alturas = rects.map((r) => (r ? r.height : 0));
        document.body.classList.add('widget-lista-reciclaje-arrastrando');
      }
      inicio.dy = dy;
      setArrastre({ indice: inicio.indice, dy, centros: inicio.centros, alturas: inicio.alturas });
    }
    function terminar(cancelado) {
      const inicio = inicioRef.current;
      inicioRef.current = null;
      setArrastre(null);
      if (!inicio?.activo) return;
      document.body.classList.remove('widget-lista-reciclaje-arrastrando');
      if (cancelado) return;
      const centro = inicio.centros[inicio.indice] + inicio.dy;
      const hasta = inicio.centros.filter((c, i) => i !== inicio.indice && c < centro).length;
      if (hasta !== inicio.indice) soltarRef.current({ desde: inicio.indice, hasta });
    }
    const alSoltar = () => terminar(false);
    const alTecla = (e) => { if (e.key === 'Escape' && inicioRef.current) terminar(true); };
    window.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', alSoltar);
    window.addEventListener('pointercancel', alSoltar);
    window.addEventListener('keydown', alTecla);
    return () => {
      window.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', alSoltar);
      window.removeEventListener('pointercancel', alSoltar);
      window.removeEventListener('keydown', alTecla);
    };
  }, []);

  function empezarArrastre(e, indice) {
    if (e.button !== 0 || e.target.closest('button, a, input, textarea')) return;
    e.preventDefault();
    inicioRef.current = { y: e.clientY, indice, ids: visibles.map((p) => p.id), activo: false };
  }

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
          {visibles.map((p, i) => (
            <div
              key={p.id}
              ref={(el) => { if (el) itemsRef.current.set(p.id, el); else itemsRef.current.delete(p.id); }}
              onPointerDown={(e) => empezarArrastre(e, i)}
              style={arrastre ? { transform: `translateY(${desplazamiento(i)}px)` } : undefined}
              className={`widget-lista-reciclaje-item widget-lista-reciclaje-item-${p.motivo}${p.id === borradorRecienteId ? ' widget-lista-reciclaje-item-reciente' : ''}${sidebar3Abierto && p.id === borradorEnEdicionId ? ' widget-lista-reciclaje-item-editando' : ''}${arrastre ? (arrastre.indice === i ? ' widget-lista-reciclaje-item-arrastrado' : ' widget-lista-reciclaje-item-desplazable') : ''}`}
            >
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
