import { useEffect, useRef, useState } from 'react';
import Scrollbar from '../base/Scrollbar.jsx';
import Modal from '../base/Modal.jsx';
import EditorTexto from './EditorTexto.jsx';
import BarraHerramientasTexto from './BarraHerramientasTexto.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { bloquesDeSesion, docAutomaticoDeBloque, docDeBloque } from '../../utils/actaSesion.js';
import { docsEquivalentes } from '../../utils/documento.js';
import { hayActaVisible } from '../../utils/sesiones.js';
import '../../styles/widgets/VistaPreviaActa.css';

const RETRASO_GUARDADO = 600;

export default function VistaPreviaActa() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, PUNTOS, SECCIONES_DOCUMENTO, editarBloqueActa, restablecerBloqueActa } = useProyecto();
  const { actaEditandoDe, setActaEstadoGuardado, actaPuntoFiltrado } = useUI();
  const [reinicios, setReinicios] = useState({});
  const [error, setError] = useState(null);
  const editorActivoRef = useRef(null);
  const cuerpoRef = useRef(null);
  const temporizadores = useRef({});

  const visible = hayActaVisible(sesionSeleccionada, puedeEscribir);
  const sesionId = sesionSeleccionada?.id;
  const editando = actaEditandoDe !== null && actaEditandoDe === sesionId;

  useEffect(() => {
    cuerpoRef.current?.querySelector('.base-scrollbar')?.scrollTo({ top: 0 });
  }, [actaPuntoFiltrado]);

  useEffect(() => {
    const pendientes = temporizadores.current;
    return () => Object.values(pendientes).forEach(clearTimeout);
  }, []);

  if (!visible) return null;

  const editados = sesionSeleccionada.actaBloques ?? {};
  const todosLosBloques = bloquesDeSesion({ sesion: sesionSeleccionada, puntos: PUNTOS, secciones: SECCIONES_DOCUMENTO });
  const bloques = actaPuntoFiltrado && todosLosBloques.some((b) => b.puntoId === actaPuntoFiltrado)
    ? todosLosBloques.filter((b) => b.puntoId === actaPuntoFiltrado)
    : todosLosBloques;

  function programarGuardado(bloque, doc) {
    if (!editando || bloque.bloqueado || docsEquivalentes(doc, docDeBloque(bloque, editados))) return;
    clearTimeout(temporizadores.current[bloque.clave]);
    setActaEstadoGuardado('guardando');
    temporizadores.current[bloque.clave] = setTimeout(async () => {
      try {
        if (docsEquivalentes(doc, docAutomaticoDeBloque(bloque))) await restablecerBloqueActa(bloque.clave);
        else await editarBloqueActa(bloque.clave, doc);
        setActaEstadoGuardado('guardado');
      } catch (e) {
        setActaEstadoGuardado('inactivo');
        setError(e.mensaje || 'No se pudo guardar el cambio del acta.');
      }
    }, RETRASO_GUARDADO);
  }

  async function restablecer(bloque) {
    clearTimeout(temporizadores.current[bloque.clave]);
    try {
      await restablecerBloqueActa(bloque.clave);
      setReinicios((r) => ({ ...r, [bloque.clave]: (r[bloque.clave] ?? 0) + 1 }));
    } catch (e) {
      setError(e.mensaje || 'No se pudo restablecer el bloque.');
    }
  }

  return (
    <div className="widget-vista-acta">
      <div className="widget-vista-acta-cuerpo" ref={cuerpoRef}>
        <Scrollbar>
          <div className="widget-vista-acta-fondo">
            {editando && (
              <div className="widget-vista-acta-flotante">
                <BarraHerramientasTexto obtenerEditor={() => editorActivoRef.current} onError={setError} ocultar={['copiar', 'pegar']} sangria />
              </div>
            )}
            {bloques.length === 0 ? (
              <div className="widget-vista-acta-vacio">No hay puntos para armar el acta.</div>
            ) : (
              <div className="widget-vista-acta-hoja">
                {bloques.map((bloque) => {
                  const editado = !!editados[bloque.clave];
                  const editable = editando && !bloque.bloqueado;
                  return (
                    <div
                      key={bloque.clave}
                      id={`acta-${bloque.clave}`}
                      className={'widget-vista-acta-bloque' + (editado ? ' widget-vista-acta-bloque-editado' : '') + (editable ? ' widget-vista-acta-bloque-editable' : '') + (bloque.tipo === 'confidencial' ? ' widget-vista-acta-bloque-confidencial' : '')}
                    >
                      {bloque.identificador && <span className="widget-vista-acta-identificador">{bloque.identificador}</span>}
                      <EditorTexto
                        key={`${bloque.clave}:${reinicios[bloque.clave] ?? 0}`}
                        value={docDeBloque(bloque, editados)}
                        onChange={(doc) => programarGuardado(bloque, doc)}
                        soloLectura={!editable}
                        onFocusEditor={(ed) => { editorActivoRef.current = ed; }}
                        ariaLabel={bloque.titulo}
                      />
                      {editado && editando && (
                        <button type="button" className="widget-vista-acta-restablecer" onClick={() => restablecer(bloque)}>Restablecer texto original</button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </Scrollbar>
      </div>
      <Modal abierto={!!error} titulo="No se pudo guardar" onCerrar={() => setError(null)}>
        <p className="widget-vista-acta-mensaje">{error}</p>
      </Modal>
    </div>
  );
}
