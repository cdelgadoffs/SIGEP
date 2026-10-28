import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { etiquetaSesionCorta } from '../../utils/sesiones.js';
import { sesionesParaReintegrar } from '../../utils/papelera.js';
import '../../styles/widgets/ReintegrarPunto.css';

const MAX_RESUMEN = 90;

export default function ReintegrarPunto({ punto }) {
  const { puedeEscribir } = useAuth();
  const { FECHAS_SESIONES, restaurarPunto, cargarSesion } = useProyecto();
  const { continuarBorrador } = useUI();
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  const esBorrador = punto.motivo === 'borrador';
  const opciones = sesionesParaReintegrar(FECHAS_SESIONES);
  const elegida = opciones.find((s) => s.id === destino);
  const texto = (punto.contenido || '').trim();
  const resumen = texto.length > MAX_RESUMEN ? `${texto.slice(0, MAX_RESUMEN).trimEnd()}…` : texto;

  function abrir() {
    setDestino(opciones[0]?.id ?? '');
    setError(null);
    setAbierto(true);
  }

  async function confirmar() {
    if (!elegida || enviando) return;
    if (esBorrador) {
      setAbierto(false);
      cargarSesion(elegida.id);
      continuarBorrador(punto.id, punto.seccion);
      return;
    }
    setEnviando(true);
    setError(null);
    try {
      await restaurarPunto(punto.id, elegida.id);
      setAbierto(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo reintegrar el punto.');
    } finally {
      setEnviando(false);
    }
  }

  const detener = (e) => e.stopPropagation();

  return (
    <span className="widget-reintegrar-punto" onClick={detener} onDoubleClick={detener} onPointerDown={detener} onKeyDown={detener}>
      <BotonIcono
        icono={esBorrador ? 'ri-edit-line' : 'ri-arrow-go-back-line'}
        ariaLabel={esBorrador ? 'Continuar borrador' : 'Reintegrar a una sesión'}
        disabled={!puedeEscribir || opciones.length === 0}
        onClick={abrir}
      />
      <Modal abierto={abierto} titulo={esBorrador ? 'Continuar borrador' : 'Reintegrar punto'} onCerrar={() => setAbierto(false)}>
        <div className="widget-reintegrar-punto-cuerpo">
          <div className="widget-reintegrar-punto-resumen">{resumen || 'Sin texto'}</div>
          <span className="widget-reintegrar-punto-etiqueta">{esBorrador ? 'Sesión en la que se registrará' : 'Sesión a la que se reintegra'}</span>
          <div className="widget-reintegrar-punto-selector">
            <ListaExpandible
              valorActual={destino}
              etiquetaActual={elegida ? etiquetaSesionCorta(elegida) : 'No hay sesiones disponibles'}
              opciones={opciones.map((s) => ({ id: s.id, label: etiquetaSesionCorta(s) }))}
              onSeleccionar={setDestino}
            />
          </div>
          {error && <div className="widget-reintegrar-punto-error">{error}</div>}
          <div className="widget-reintegrar-punto-acciones">
            <BotonS variant="claro" onClick={() => setAbierto(false)}>Cancelar</BotonS>
            <BotonS variant="claro" onClick={confirmar} disabled={!elegida || enviando}>{esBorrador ? 'Continuar' : 'Reintegrar'}</BotonS>
          </div>
        </div>
      </Modal>
    </span>
  );
}
