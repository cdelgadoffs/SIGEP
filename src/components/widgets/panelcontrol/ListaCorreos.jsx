import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import Scrollbar from '../../base/Scrollbar.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import { formatoFechaCorreo } from '../../../utils/correos.js';
import '../../../styles/widgets/panelcontrol/ListaCorreos.css';

export default function ListaCorreos() {
  const { CORREOS_ENVIADOS, cargando } = useCorreo();
  const { correoSeleccionadoId, setCorreoSeleccionadoId } = useUI();
  const [busqueda, setBusqueda] = useState('');

  const termino = busqueda.trim().toLowerCase();
  const visibles = CORREOS_ENVIADOS.filter((c) => (
    !termino || c.asunto.toLowerCase().includes(termino) || c.para.some((p) => p.toLowerCase().includes(termino))
  ));

  return (
    <div className="widget-lista-correos">
      <div className="widget-lista-correos-encabezado">
        <h3 className="widget-lista-correos-titulo">Enviados</h3>
        <CampoTexto variant="claro" value={busqueda} onChange={setBusqueda} placeholder="Buscar en Enviados" ariaLabel="Buscar en Enviados" />
      </div>
      <div className="widget-lista-correos-cuerpo">
        <Scrollbar>
          {visibles.length === 0 ? (
            <div className="widget-lista-correos-vacio">
              {cargando ? 'Cargando…' : CORREOS_ENVIADOS.length === 0 ? 'No has enviado correos.' : 'Sin resultados.'}
            </div>
          ) : visibles.map((c) => (
            <div
              key={c.id}
              className={'widget-lista-correos-item' + (c.id === correoSeleccionadoId ? ' widget-lista-correos-item-activo' : '')}
              onClick={() => setCorreoSeleccionadoId(c.id)}
            >
              <div className="widget-lista-correos-fila">
                <span className="widget-lista-correos-para">{c.para.join(', ')}</span>
                <span className="widget-lista-correos-fecha">{formatoFechaCorreo(c.enviadoEn)}</span>
              </div>
              <span className="widget-lista-correos-asunto">{c.asunto}</span>
              <span className="widget-lista-correos-vista">{c.cuerpo.replace(/\s+/g, ' ').trim() || 'Sin contenido'}</span>
            </div>
          ))}
        </Scrollbar>
      </div>
    </div>
  );
}
