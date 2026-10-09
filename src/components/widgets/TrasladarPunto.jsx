import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import Checkbox from '../base/Checkbox.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { nombreTipoSesion } from '../../utils/sesiones.js';
import { tituloPunto } from '../../utils/puntos.js';
import '../../styles/widgets/TrasladarPunto.css';

export default function TrasladarPunto({ punto }) {
  const { FECHAS_SESIONES, sesionActivaFecha, trasladarPunto } = useProyecto();
  const [abierto, setAbierto] = useState(false);
  const [destino, setDestino] = useState('');
  const [confirmado, setConfirmado] = useState(false);
  const [trasladando, setTrasladando] = useState(false);
  const [error, setError] = useState(null);

  const proximas = FECHAS_SESIONES
    .filter((s) => s.id !== sesionActivaFecha && (s.estado === 'proxima' || s.estado === 'pendiente'))
    .sort((a, b) => (a.id < b.id ? -1 : 1))
    .slice(0, 3);
  const etiquetaDe = (s) => `${nombreTipoSesion(s.tipo)} N° ${s.numeroSesion ?? '—'} · ${s.label}`;
  const elegida = proximas.find((s) => s.id === destino);
  const resumen = (punto.contenido || '').slice(0, 90).trim();

  function abrir() {
    setDestino(proximas[0]?.id ?? '');
    setConfirmado(false);
    setError(null);
    setAbierto(true);
  }

  async function trasladar() {
    if (!confirmado || !elegida || trasladando) return;
    setTrasladando(true);
    setError(null);
    try {
      await trasladarPunto(punto.id, elegida.id);
      setAbierto(false);
    } catch (e) {
      setError(e.mensaje || 'No se pudo trasladar el punto.');
    } finally {
      setTrasladando(false);
    }
  }

  return (
    <>
      <BotonIcono icono="ri-share-forward-line" ariaLabel="Trasladar a otra sesión" onClick={abrir} />
      <Modal abierto={abierto} titulo="Trasladar punto a otra sesión" onCerrar={() => setAbierto(false)}>
        <div className="widget-trasladar-punto">
          <div className="widget-trasladar-punto-resumen">
            <strong>{tituloPunto(punto.numero)}</strong>
            {resumen && <span>{resumen}{punto.contenido.length > 90 ? '…' : ''}</span>}
          </div>
          <span className="widget-trasladar-punto-etiqueta">Sesión de destino</span>
          <div className="widget-trasladar-punto-selector">
            <ListaExpandible
              valorActual={destino}
              etiquetaActual={elegida ? etiquetaDe(elegida) : 'No hay sesiones próximas disponibles'}
              opciones={proximas.map((s) => ({ id: s.id, label: etiquetaDe(s) }))}
              onSeleccionar={setDestino}
            />
          </div>
          <Checkbox checked={confirmado} onChange={setConfirmado} label="Confirmo que quiero trasladar este punto a esa sesión" />
          {error && <div className="widget-trasladar-punto-error">{error}</div>}
          <div className="widget-trasladar-punto-acciones">
            <BotonS variant="claro" onClick={() => setAbierto(false)}>Cancelar</BotonS>
            <BotonS variant="claro" onClick={trasladar} disabled={!confirmado || !elegida || trasladando}>Trasladar</BotonS>
          </div>
        </div>
      </Modal>
    </>
  );
}
