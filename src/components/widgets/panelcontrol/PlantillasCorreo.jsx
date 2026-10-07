import { useRef, useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import EditorTexto from '../EditorTexto.jsx';
import BarraHerramientasTexto from '../BarraHerramientasTexto.jsx';
import BotonS from '../../base/BotonS.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import { docVacio } from '../../../utils/documento.js';
import '../../../styles/widgets/panelcontrol/PlantillasCorreo.css';

export default function PlantillasCorreo() {
  const { PLANTILLAS_CORREO, agregarPlantilla, eliminarPlantilla, cargando } = useCorreo();
  const [nombre, setNombre] = useState('');
  const [asunto, setAsunto] = useState('');
  const editorRef = useRef(null);
  const [cuerpoDoc, setCuerpoDoc] = useState(docVacio);
  const [tokenEditor, setTokenEditor] = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState(null);

  async function guardar() {
    if (guardando) return;
    setGuardando(true);
    setError(null);
    try {
      await agregarPlantilla({ nombre, asunto, cuerpoDoc });
      setNombre('');
      setAsunto('');
      setCuerpoDoc(docVacio());
      setTokenEditor((t) => t + 1);
    } catch (e) {
      setError(e.mensaje || 'No se pudo guardar la plantilla.');
    } finally {
      setGuardando(false);
    }
  }

  async function quitar(id) {
    setError(null);
    try {
      await eliminarPlantilla(id);
    } catch (e) {
      setError(e.mensaje || 'No se pudo eliminar la plantilla.');
    }
  }

  return (
    <section className="widget-plantillas-correo">
      <h3 className="widget-plantillas-correo-titulo">Plantillas de correo</h3>
      <CampoTexto variant="claro" value={nombre} onChange={setNombre} placeholder="Nombre de la plantilla" ariaLabel="Nombre de la plantilla" />
      <CampoTexto variant="claro" value={asunto} onChange={setAsunto} placeholder="Asunto" ariaLabel="Asunto de la plantilla" />
      <div className="widget-plantillas-correo-barra">
        <BarraHerramientasTexto obtenerEditor={() => editorRef.current} onError={setError} />
      </div>
      <div className="widget-plantillas-correo-editor">
        <EditorTexto
          value={cuerpoDoc}
          onChange={setCuerpoDoc}
          placeholder="Cuerpo de la plantilla"
          onFocusEditor={(ed) => { editorRef.current = ed; }}
          resetToken={tokenEditor}
          ariaLabel="Cuerpo de la plantilla"
        />
      </div>
      {error && <span className="widget-plantillas-correo-error">{error}</span>}
      <BotonS variant="claro" onClick={guardar} disabled={guardando}>Guardar plantilla</BotonS>
      <div className="widget-plantillas-correo-lista">
        {PLANTILLAS_CORREO.length === 0 ? (
          <span className="widget-plantillas-correo-vacio">{cargando ? 'Cargando…' : 'No hay plantillas guardadas'}</span>
        ) : PLANTILLAS_CORREO.map((p) => (
          <div key={p.id} className="widget-plantillas-correo-fila">
            <div className="widget-plantillas-correo-texto">
              <span className="widget-plantillas-correo-nombre">{p.nombre}</span>
              <span className="widget-plantillas-correo-asunto">{p.asunto}</span>
            </div>
            <BotonIcono icono="ri-close-line" ariaLabel="Eliminar plantilla" onClick={() => quitar(p.id)} />
          </div>
        ))}
      </div>
    </section>
  );
}
