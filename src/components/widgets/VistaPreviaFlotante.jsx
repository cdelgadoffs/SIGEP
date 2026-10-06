import { useEffect, useRef, useState } from 'react';
import PanelFlotante from '../base/PanelFlotante.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import Modal from '../base/Modal.jsx';
import EditorTexto from './EditorTexto.jsx';
import BarraHerramientasTexto from './BarraHerramientasTexto.jsx';
import { bloquesParaPlantilla, nuevoIdBloque, tiposBloqueDisponibles } from '../../utils/plantillasActa.js';
import { docVacio } from '../../utils/documento.js';
import { generarWordPuntoAcuerdo, nombreArchivoPuntoAcuerdo } from '../../utils/puntoAcuerdo.js';
import { cargarLogo, URL_LOGO_DOCUMENTO } from '../../utils/logo.js';
import { guardarEnDisco } from '../../utils/archivos.js';
import '../../styles/widgets/VistaPreviaFlotante.css';

const ICONOS_BLOQUE = { considerando: 'ri-scales-line', antecedente: 'ri-history-line', personalizada: 'ri-pencil-line' };
const PLACEHOLDERS_BLOQUE = { considerando: 'Considerandos...', antecedente: 'Antecedentes...', personalizada: 'Escribe el contenido...' };

export default function VistaPreviaFlotante({
  abierto,
  izquierda,
  arriba,
  form,
  onCambiar,
  onAporte,
  plantillas,
  tiposBloque,
  codigo,
  fecha,
  soloLectura = false,
}) {
  const [tipoNuevo, setTipoNuevo] = useState('');
  const [tituloPersonalizado, setTituloPersonalizado] = useState('');
  const [menuAbierto, setMenuAbierto] = useState(null);
  const [descargando, setDescargando] = useState(false);
  const [errorDescarga, setErrorDescarga] = useState(null);
  const editorActivoRef = useRef(null);

  const plantilla = plantillas.find((p) => p.id === form.plantilla) || plantillas[0];
  const bloques = form.bloquesActa || [];
  const disponibles = tiposBloqueDisponibles(tiposBloque, bloques);
  const tipoElegido = disponibles.find((t) => t.id === tipoNuevo) || disponibles[0];
  const esPersonalizada = !!tipoElegido && tipoElegido.titulo === null;
  const aceptaBloquesLibres = !!plantilla && plantilla.bloques.length === 0 && plantilla.orden.includes('bloques');

  useEffect(() => {
    if (!menuAbierto) return;
    function cerrar(e) {
      if (!e.target.closest('.widget-vista-previa-menu-envoltorio')) setMenuAbierto(null);
    }
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, [menuAbierto]);

  if (!plantilla) return null;

  function aporte(cambios) {
    if (onAporte) onAporte();
    onCambiar(cambios);
  }

  function cambiarPlantilla(id) {
    const nueva = plantillas.find((p) => p.id === id);
    onCambiar({ plantilla: id, bloquesActa: bloquesParaPlantilla(nueva, bloques) });
  }

  function agregarBloque() {
    if (!tipoElegido) return;
    if (esPersonalizada) {
      const titulo = tituloPersonalizado.trim();
      if (!titulo) return;
      onCambiar({ bloquesActa: [...bloques, { id: nuevoIdBloque(), tipo: tipoElegido.id, titulo: titulo.toUpperCase(), doc: docVacio() }] });
      setTituloPersonalizado('');
      return;
    }
    onCambiar({ bloquesActa: [...bloques, { id: nuevoIdBloque(), tipo: tipoElegido.id, doc: docVacio() }] });
  }

  function cambiarBloque(id, doc) {
    aporte({ bloquesActa: bloques.map((b) => (b.id === id ? { ...b, doc } : b)) });
  }

  function quitarBloque(id) {
    onCambiar({ bloquesActa: bloques.filter((b) => b.id !== id) });
  }

  async function descargarWord() {
    setDescargando(true);
    setErrorDescarga(null);
    try {
      const logo = await cargarLogo();
      const resultado = await generarWordPuntoAcuerdo({ punto: form, plantillas, tiposBloque, logo, fecha });
      if (!resultado) {
        setErrorDescarga('El punto no tiene contenido para exportar.');
        return;
      }
      guardarEnDisco(codigo ? nombreArchivoPuntoAcuerdo(codigo) : resultado.nombreArchivo, resultado.blob);
    } catch (e) {
      setErrorDescarga(e?.message || 'No se pudo generar el documento.');
    } finally {
      setDescargando(false);
    }
  }

  const secciones = plantilla.orden.map((seccion) => {
    if (seccion === 'intro') {
      return (
        <div key="intro" className="widget-vista-previa-intro">
          <EditorTexto value={form.introDoc} onChange={(doc) => aporte({ introDoc: doc })} placeholder="Fundamento..." soloLectura={soloLectura} onFocusEditor={(ed) => { editorActivoRef.current = ed; }} />
        </div>
      );
    }
    if (seccion === 'puente') {
      return (
        <div key="puente" className="widget-vista-previa-puente">
          <EditorTexto value={form.puenteDoc} onChange={(doc) => aporte({ puenteDoc: doc })} placeholder="Frase puente..." soloLectura={soloLectura} onFocusEditor={(ed) => { editorActivoRef.current = ed; }} />
        </div>
      );
    }
    if (seccion === 'bloques') {
      return bloques.map((bloque) => {
        const tipo = tiposBloque.find((t) => t.id === bloque.tipo);
        return (
          <div key={bloque.id} className="widget-vista-previa-bloque">
            <div className="widget-vista-previa-bloque-titulo">
              {tipo?.titulo ?? bloque.titulo ?? 'SECCIÓN'}
              {!soloLectura && (
                <button type="button" className="widget-vista-previa-bloque-quitar" title="Quitar sección" onClick={() => quitarBloque(bloque.id)}>
                  <i className="ri-close-line"></i>
                </button>
              )}
            </div>
            <EditorTexto
              value={bloque.doc}
              onChange={(doc) => cambiarBloque(bloque.id, doc)}
              placeholder={PLACEHOLDERS_BLOQUE[bloque.tipo] ?? PLACEHOLDERS_BLOQUE.personalizada}
              ordinal="bloque"
              soloLectura={soloLectura}
              onFocusEditor={(ed) => { editorActivoRef.current = ed; }}
            />
          </div>
        );
      });
    }
    if (seccion === 'contenido') {
      return (
        <div key="contenido" className="widget-vista-previa-contenido">
          <EditorTexto value={form.contenidoDoc} onChange={(doc) => aporte({ contenidoDoc: doc })} placeholder="Punto de acuerdo..." soloLectura={soloLectura} onFocusEditor={(ed) => { editorActivoRef.current = ed; }} />
        </div>
      );
    }
    if (seccion === 'tituloAcuerdo') return <div key="tituloAcuerdo" className="widget-vista-previa-bloque-titulo">ACUERDO</div>;
    if (seccion === 'acuerdo') {
      return (
        <div key="acuerdo" className="widget-vista-previa-acuerdo">
          <EditorTexto value={form.acuerdoDoc} onChange={(doc) => aporte({ acuerdoDoc: doc })} placeholder="Acuerdos..." ordinal="acuerdo" soloLectura={soloLectura} onFocusEditor={(ed) => { editorActivoRef.current = ed; }} />
        </div>
      );
    }
    return null;
  });

  return (
    <>
      <PanelFlotante abierto={abierto} izquierda={izquierda} arriba={arriba}>
        {!soloLectura && (
          <div className="widget-vista-previa-barra">
            <select className="widget-vista-previa-select" value={plantilla.id} onChange={(e) => cambiarPlantilla(e.target.value)} title="Plantilla">
              {plantillas.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {aceptaBloquesLibres && tipoElegido && (
              <>
                <div className="widget-vista-previa-menu-envoltorio">
                  <BotonIcono icono={ICONOS_BLOQUE[tipoElegido.id] ?? 'ri-list-unordered'} ariaLabel={`Sección: ${tipoElegido.nombre}`} onClick={() => setMenuAbierto((m) => (m === 'seccion' ? null : 'seccion'))} />
                  {menuAbierto === 'seccion' && (
                    <div className="widget-vista-previa-menu">
                      {disponibles.map((t) => (
                        <button
                          type="button"
                          key={t.id}
                          className={'widget-vista-previa-menu-item' + (t.id === tipoElegido.id ? ' widget-vista-previa-menu-item-activo' : '')}
                          onClick={() => { setTipoNuevo(t.id); setMenuAbierto(null); }}
                        >
                          <i className={ICONOS_BLOQUE[t.id] ?? 'ri-list-unordered'}></i>
                          <span>{t.nombre}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {esPersonalizada && (
                  <input
                    type="text"
                    className="widget-vista-previa-input"
                    value={tituloPersonalizado}
                    onChange={(e) => setTituloPersonalizado(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') agregarBloque(); }}
                    placeholder="Título de la sección"
                    aria-label="Título de la sección"
                  />
                )}
                <BotonIcono icono="ri-add-line" ariaLabel="Añadir sección" onClick={agregarBloque} disabled={esPersonalizada && !tituloPersonalizado.trim()} />
              </>
            )}
            <BarraHerramientasTexto obtenerEditor={() => editorActivoRef.current} onError={setErrorDescarga} />
            <span className="widget-vista-previa-separador"></span>
            <BotonIcono icono="ri-file-word-2-line" ariaLabel={descargando ? 'Generando...' : 'Descargar Word'} onClick={descargarWord} disabled={descargando} />
          </div>
        )}
        <div className="widget-vista-previa-hoja">
          <div className="widget-vista-previa-logo">
            <img src={URL_LOGO_DOCUMENTO} alt="Logo" />
          </div>
          {secciones}
        </div>
      </PanelFlotante>
      <Modal abierto={!!errorDescarga} titulo="Vista previa" onCerrar={() => setErrorDescarga(null)}>
        <p className="widget-vista-previa-mensaje">{errorDescarga}</p>
        <div className="widget-vista-previa-modal-acciones">
          <BotonS variant="claro" onClick={() => setErrorDescarga(null)}>Cerrar</BotonS>
        </div>
      </Modal>
    </>
  );
}
