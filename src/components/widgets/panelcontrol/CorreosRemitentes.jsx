import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import '../../../styles/widgets/panelcontrol/CorreosRemitentes.css';

export default function CorreosRemitentes() {
  const { CORREOS_REMITENTES, guardarCorreoRemitente } = useCorreo();
  const { REMITENTES, CATEGORIAS } = useProyecto();
  const [borradores, setBorradores] = useState({});
  const [guardando, setGuardando] = useState(null);
  const [error, setError] = useState(null);

  const guardado = (id) => CORREOS_REMITENTES.find((c) => c.remitenteId === id)?.correo ?? '';
  const valor = (id) => borradores[id] ?? guardado(id);

  async function guardar(id) {
    if (guardando) return;
    setGuardando(id);
    setError(null);
    try {
      await guardarCorreoRemitente(id, valor(id));
      setBorradores((b) => {
        const { [id]: _, ...resto } = b;
        return resto;
      });
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar el correo.');
    } finally {
      setGuardando(null);
    }
  }

  return (
    <section className="widget-correos-remitentes">
      <h3 className="widget-correos-remitentes-titulo">Correo de cada remitente</h3>
      {error && <span className="widget-correos-remitentes-error">{error}</span>}
      {CATEGORIAS.map((categoria) => (
        <div key={categoria.id} className="widget-correos-remitentes-grupo">
          <span className="widget-correos-remitentes-categoria">{categoria.nombre}</span>
          {REMITENTES.filter((r) => r.categoria === categoria.id).map((r) => {
            const cambiado = valor(r.id).trim() !== guardado(r.id);
            return (
              <div key={r.id} className="widget-correos-remitentes-fila">
                <span className="widget-correos-remitentes-nombre">{r.nombre}</span>
                <CampoTexto
                  variant="claro"
                  type="email"
                  value={valor(r.id)}
                  onChange={(v) => setBorradores((b) => ({ ...b, [r.id]: v }))}
                  onEnter={() => cambiado && guardar(r.id)}
                  placeholder="correo@ejemplo.com"
                  ariaLabel={`Correo de ${r.nombre}`}
                />
                <BotonIcono icono="ri-save-line" ariaLabel={`Guardar correo de ${r.nombre}`} disabled={!cambiado || guardando === r.id} onClick={() => guardar(r.id)} />
              </div>
            );
          })}
        </div>
      ))}
    </section>
  );
}
