import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import BotonS from '../../base/BotonS.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import CampoCorreos from './CampoCorreos.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import '../../../styles/widgets/panelcontrol/ListasDestinatarios.css';

export default function ListasDestinatarios() {
  const { LISTAS_CORREO, agregarLista, eliminarLista, cargando } = useCorreo();
  const [nombre, setNombre] = useState('');
  const [correos, setCorreos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await agregarLista({ nombre, correos });
      setNombre('');
      setCorreos([]);
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar la lista.');
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id) {
    setError(null);
    try {
      await eliminarLista(id);
    } catch (e) {
      setError(e.mensaje || 'No se pudo eliminar la lista.');
    }
  }

  return (
    <section className="widget-listas-destinatarios">
      <h3 className="widget-listas-destinatarios-titulo">Listas de destinatarios</h3>
      <CampoTexto variant="claro" value={nombre} onChange={setNombre} placeholder="Nombre de la lista (ej. Concejales)" ariaLabel="Nombre de la lista" />
      <CampoCorreos
        valores={correos}
        onAgregar={(c) => setCorreos((prev) => [...prev, c])}
        onQuitar={(c) => setCorreos((prev) => prev.filter((x) => x !== c))}
        vacio="Agrega los correos de la lista"
      />
      {error && <span className="widget-listas-destinatarios-error">{error}</span>}
      <BotonS variant="claro" onClick={guardar} disabled={guardando}>Guardar lista</BotonS>
      <div className="widget-listas-destinatarios-lista">
        {LISTAS_CORREO.length === 0 ? (
          <span className="widget-listas-destinatarios-vacio">{cargando ? 'Cargando…' : 'No hay listas guardadas'}</span>
        ) : LISTAS_CORREO.map((l) => (
          <div key={l.id} className="widget-listas-destinatarios-fila">
            <span className="widget-listas-destinatarios-nombre">{l.nombre}</span>
            <span className="widget-listas-destinatarios-total">{l.correos.length} {l.correos.length === 1 ? 'correo' : 'correos'}</span>
            <BotonIcono icono="ri-close-line" ariaLabel="Eliminar lista" onClick={() => quitar(l.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
