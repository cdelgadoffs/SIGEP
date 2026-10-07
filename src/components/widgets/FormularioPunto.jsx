import { useEffect, useRef, useState } from 'react';
import ListaExpandible from '../base/ListaExpandible.jsx';
import Checkbox from '../base/Checkbox.jsx';
import BotonS from '../base/BotonS.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import Modal from '../base/Modal.jsx';
import EditorTexto from './EditorTexto.jsx';
import VistaPreviaFlotante from './VistaPreviaFlotante.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI, ANCHO_SIDEBAR3, ALTO_TOPBAR, ALTO_CINTA } from '../../context/UIContext.jsx';
import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import { estiloArchivo, guardarEnDisco } from '../../utils/archivos.js';
import { docDesdeTexto, docVacio, esDocVacio } from '../../utils/documento.js';
import { contenidoPorOmision, hojaPorOmision } from '../../utils/plantillasActa.js';
import { tituloPunto } from '../../utils/puntos.js';
import '../../styles/widgets/FormularioPunto.css';

function estadoVacio(seccion, esInforme, plantillas, textosActa, plantillaId) {
  return {
    seccion: seccion || '',
    categoria: '',
    remitente: '',
    contenidoDoc: contenidoPorOmision(textosActa, esInforme),
    acuerdoDoc: docVacio(),
    confidencial: false,
    archivos: [],
    ...hojaPorOmision(plantillas, textosActa, plantillaId),
  };
}

function claveBorrador(seccion) {
  return `formularioPunto:${seccion}`;
}

function aDocumentos(borrador) {
  const { contenido, acuerdo, ...resto } = borrador;
  return {
    ...resto,
    ...(typeof contenido === 'string' ? { contenidoDoc: docDesdeTexto(contenido) } : null),
    ...(typeof acuerdo === 'string' ? { acuerdoDoc: docDesdeTexto(acuerdo) } : null),
  };
}

export default function FormularioPunto() {
  const { SECCIONES_DOCUMENTO, REMITENTES, CATEGORIAS, PLANTILLAS_ACTA, TIPOS_BLOQUE_ACTA, TEXTOS_ACTA, sesionActivaFecha, PUNTOS, listaCerrada, agregarPunto, editarPunto, eliminarArchivo, descargarArchivo, guardarBorrador, obtenerBorrador, eliminarBorrador, error: errorCarga } = useProyecto();
  const { sidebar3Abierto, cerrarSidebar3, seccionNuevoPunto, puntoEnEdicionId, izquierdaSidebar3 } = useUI();
  const esInformeSeccion = (id) => SECCIONES_DOCUMENTO.find((x) => x.id === id)?.requiereAcuerdo === false;
  const formularioVacio = (seccion) => estadoVacio(seccion, esInformeSeccion(seccion), PLANTILLAS_ACTA, TEXTOS_ACTA, SECCIONES_DOCUMENTO.find((x) => x.id === seccion)?.plantillaPorOmision);
  const [form, setForm] = useState(() => formularioVacio(seccionNuevoPunto));
  const [aporte, setAporte] = useState(false);
  const [previaVisible, setPreviaVisible] = useState(false);
  const [reinicioEditor, setReinicioEditor] = useState(0);
  const reiniciarEditor = () => setReinicioEditor((n) => n + 1);
  const [restaurado, setRestaurado] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);
  const [archivoAQuitar, setArchivoAQuitar] = useState(null);
  const [errorQuitar, setErrorQuitar] = useState(null);
  const claveGuardadaRef = useRef(null);
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  const punto = puntoEnEdicionId ? PUNTOS.find((p) => p.id === puntoEnEdicionId) : null;
  const editando = !!punto;

  useEffect(() => {
    if (puntoEnEdicionId && !punto) cerrarSidebar3();
  }, [puntoEnEdicionId, punto]);

  useEffect(() => {
    if (!sidebar3Abierto) return;
    setRestaurado(false);
    setError(null);
    if (puntoEnEdicionId) {
      const original = PUNTOS.find((p) => p.id === puntoEnEdicionId);
      if (original) {
        setForm({
          seccion: original.seccion,
          categoria: '',
          remitente: original.remitente,
          contenidoDoc: original.contenidoDoc ?? docDesdeTexto(original.contenido),
          acuerdoDoc: original.acuerdoDoc ?? docDesdeTexto(original.acuerdo),
          confidencial: original.confidencial,
          archivos: original.archivos,
          plantilla: original.plantilla,
          introDoc: original.introDoc,
          puenteDoc: original.puenteDoc,
          bloquesActa: original.bloquesActa,
        });
        setAporte(true);
        setPreviaVisible(false);
      }
      return;
    }
    let vigente = true;
    const seccion = seccionNuevoPunto || SECCIONES_DOCUMENTO[0]?.id || '';
    setForm(formularioVacio(seccion));
    setAporte(false);
    setPreviaVisible(false);
    reiniciarEditor();
    obtenerBorrador(claveBorrador(seccion))
      .catch(() => null)
      .then((borrador) => {
        if (!vigente) return;
        claveGuardadaRef.current = borrador ? claveBorrador(seccion) : null;
        if (borrador) {
          setForm({ ...formularioVacio(seccion), ...aDocumentos(borrador), seccion });
          setAporte(true);
          reiniciarEditor();
        }
        setRestaurado(true);
      });
    return () => { vigente = false; };
  }, [sidebar3Abierto, seccionNuevoPunto, puntoEnEdicionId]);

  useEffect(() => {
    if (!restaurado) return;
    const clave = claveBorrador(form.seccion);
    const temporizador = setTimeout(() => {
      const anterior = claveGuardadaRef.current;
      if (anterior && anterior !== clave) eliminarBorrador(anterior);
      if (aporte) {
        guardarBorrador(clave, { ...form, archivos: [] });
        claveGuardadaRef.current = clave;
      } else {
        eliminarBorrador(clave);
        claveGuardadaRef.current = null;
      }
    }, 300);
    return () => clearTimeout(temporizador);
  }, [form, restaurado, aporte]);

  const opcionesSeccion = SECCIONES_DOCUMENTO
    .filter((s) => !listaCerrada || s.admiteConListaCerrada)
    .map((s) => ({ id: s.id, label: s.nombre }));
  const seccionActual = SECCIONES_DOCUMENTO.find((s) => s.id === form.seccion);
  const esInforme = seccionActual ? !seccionActual.requiereAcuerdo : false;
  const categoriaActual = CATEGORIAS.find((c) => c.id === form.categoria)
    || CATEGORIAS.find((c) => c.id === REMITENTES.find((r) => r.id === form.remitente)?.categoria)
    || CATEGORIAS[0];
  const remitentesDeCategoria = REMITENTES.filter((r) => r.categoria === categoriaActual?.id);
  const remitenteActual = remitentesDeCategoria.some((r) => r.id === form.remitente) ? form.remitente : (remitentesDeCategoria[0]?.id || '');
  const seccionOrigen = SECCIONES_DOCUMENTO.find((s) => s.id === seccionNuevoPunto);
  const mostrarSeccion = editando || !!seccionOrigen?.permiteCambiarSeccion;

  function cambiarCategoria(id) {
    setForm((f) => ({ ...f, categoria: id, remitente: REMITENTES.find((r) => r.categoria === id)?.id || '' }));
  }

  function actualizar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
  }

  function cambiarCampos(cambios) {
    setForm((f) => ({ ...f, ...cambios }));
  }

  function cambiarDoc(campo, doc) {
    setAporte(true);
    setPreviaVisible(true);
    actualizar(campo, doc);
  }

  function adjuntarArchivos(e) {
    const nuevos = Array.from(e.target.files || []);
    setForm((f) => ({ ...f, archivos: [...f.archivos, ...nuevos] }));
    e.target.value = '';
  }

  function quitarArchivoPendiente(indice) {
    setForm((f) => ({ ...f, archivos: f.archivos.filter((_, i) => i !== indice) }));
  }

  async function descargar(archivo) {
    setError(null);
    try {
      const { nombre, blob } = await descargarArchivo(archivo.id);
      guardarEnDisco(nombre, blob);
    } catch (e) {
      setError(e.mensaje || 'No se pudo descargar el archivo.');
    }
  }

  function cancelarQuitar() {
    setArchivoAQuitar(null);
    setErrorQuitar(null);
  }

  async function quitarArchivo() {
    setErrorQuitar(null);
    try {
      await eliminarArchivo(punto.id, archivoAQuitar.id);
      setArchivoAQuitar(null);
    } catch (e) {
      setErrorQuitar(e.mensaje || 'No se pudo quitar el archivo.');
    }
  }

  function cancelar() {
    cerrarSidebar3();
  }

  function borrar() {
    setForm(formularioVacio(form.seccion));
    setAporte(false);
    setPreviaVisible(false);
    reiniciarEditor();
  }

  async function confirmar() {
    setEnviando(true);
    setError(null);
    try {
      const datos = {
        seccion: form.seccion,
        remitente: remitenteActual,
        contenidoDoc: form.contenidoDoc,
        acuerdoDoc: esInforme ? docVacio() : form.acuerdoDoc,
        confidencial: form.confidencial,
        plantilla: form.plantilla,
        introDoc: form.introDoc,
        puenteDoc: form.puenteDoc,
        bloquesActa: form.bloquesActa,
      };
      if (editando) {
        await editarPunto(punto.id, punto.version, datos);
        cerrarSidebar3();
      } else {
        await agregarPunto({ ...datos, archivos: form.archivos });
        setForm(formularioVacio(form.seccion));
        setAporte(false);
        setPreviaVisible(false);
        reiniciarEditor();
      }
    } catch (e) {
      setError(e.mensaje || (editando ? 'No se pudo guardar el punto.' : 'No se pudo añadir el punto.'));
    } finally {
      setEnviando(false);
    }
  }

  const puedeConfirmar = !enviando && !!seccionActual && !!remitenteActual && !esDocVacio(form.contenidoDoc) && (esInforme || !esDocVacio(form.acuerdoDoc));

  return (
    <div className="widget-formulario-punto-wrap">
      <div className="widget-formulario-punto" key={form.seccion} ref={contenedorRef} onScroll={onScroll}>
      <div className="widget-formulario-punto-fila">
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">Categoría</label>
          <ListaExpandible
            valorActual={categoriaActual?.id}
            etiquetaActual={categoriaActual?.nombre ?? ''}
            opciones={CATEGORIAS.map((c) => ({ id: c.id, label: c.nombre }))}
            onSeleccionar={cambiarCategoria}
          />
        </div>
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">Remitente</label>
          <ListaExpandible
            valorActual={remitenteActual}
            etiquetaActual={remitentesDeCategoria.find((r) => r.id === remitenteActual)?.nombre ?? ''}
            opciones={remitentesDeCategoria.map((r) => ({ id: r.id, label: r.nombre }))}
            onSeleccionar={(id) => actualizar('remitente', id)}
          />
        </div>
      </div>

      {mostrarSeccion && (
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">Sección</label>
          <ListaExpandible
            valorActual={form.seccion}
            etiquetaActual={seccionActual ? seccionActual.nombre : ''}
            opciones={opcionesSeccion}
            onSeleccionar={(id) => actualizar('seccion', id)}
          />
        </div>
      )}

      {(!editando || punto.archivos.length > 0) && (
        <div className="widget-formulario-punto-campo">
          <label className="widget-formulario-punto-label">{editando ? 'Archivos' : 'Adjuntar archivos'}</label>
          {!editando && (
            <input type="file" className="widget-formulario-punto-archivo-input" multiple onChange={adjuntarArchivos} />
          )}
          {(editando ? punto.archivos : form.archivos).length > 0 && (
            <div className="widget-formulario-punto-archivos">
              {editando
                ? punto.archivos.map((a, i) => {
                    const { icono, tono } = estiloArchivo(a.nombre);
                    return (
                      <BadgeDinamico
                        key={a.id ?? i}
                        texto={a.nombre}
                        icono={icono}
                        tono={tono}
                        onClick={a.id ? () => descargar(a) : undefined}
                        onEliminar={a.id && !a.autogenerado ? () => setArchivoAQuitar(a) : undefined}
                      />
                    );
                  })
                : form.archivos.map((a, i) => {
                    const { icono, tono } = estiloArchivo(a.name);
                    return (
                      <BadgeDinamico
                        key={`${a.name}-${i}`}
                        texto={a.name}
                        icono={icono}
                        tono={tono}
                        onEliminar={() => quitarArchivoPendiente(i)}
                      />
                    );
                  })}
            </div>
          )}
        </div>
      )}

      <div className="widget-formulario-punto-campo widget-formulario-punto-editor widget-formulario-punto-editor-contenido">
        <label className="widget-formulario-punto-label">{esInforme ? 'Informe' : 'Punto de acuerdo'}</label>
        <EditorTexto
          value={form.contenidoDoc}
          onChange={(doc) => cambiarDoc('contenidoDoc', doc)}
          placeholder={esInforme ? 'Informe' : '...por el que/cual se...'}
          autoFocus={sidebar3Abierto && !editando}
          resetToken={reinicioEditor}
          ariaLabel={esInforme ? 'Informe' : 'Punto de acuerdo'}
        />
      </div>

      {!esInforme && (
        <div className="widget-formulario-punto-campo widget-formulario-punto-editor">
          <label className="widget-formulario-punto-label">Acuerdo</label>
          <EditorTexto
            value={form.acuerdoDoc}
            onChange={(doc) => cambiarDoc('acuerdoDoc', doc)}
            placeholder="Acuerdos"
            ordinal="acuerdo"
            ariaLabel="Acuerdo"
          />
        </div>
      )}

      <Checkbox
        checked={form.confidencial}
        onChange={(v) => { setAporte(true); actualizar('confidencial', v); }}
        label="Marcar como confidencial"
      />

      {(error || errorCarga) && (
        <div className="widget-formulario-punto-error">
          {error || `No se pudo cargar la información: ${errorCarga.mensaje}`}
        </div>
      )}

      <div className="widget-formulario-punto-acciones">
        {editando ? <span></span> : <BotonIcono icono="ri-eraser-line" ariaLabel="Borrar formulario" onClick={borrar} />}
        <div className="widget-formulario-punto-acciones-grupo">
          <BotonS variant="claro" onClick={cancelar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={confirmar} disabled={!puedeConfirmar}>{editando ? 'Guardar' : 'Añadir'}</BotonS>
        </div>
      </div>
      </div>
      <Modal abierto={!!archivoAQuitar} titulo="Quitar archivo" onCerrar={cancelarQuitar}>
        <p className="widget-formulario-punto-modal-mensaje">
          ¿Quieres quitar «{archivoAQuitar?.nombre}» de este punto? Esta acción no se puede deshacer.
        </p>
        {errorQuitar && <div className="widget-formulario-punto-error">{errorQuitar}</div>}
        <div className="widget-formulario-punto-modal-acciones">
          <BotonS variant="claro" onClick={cancelarQuitar}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={quitarArchivo}>Quitar</BotonS>
        </div>
      </Modal>
      <VistaPreviaFlotante
        abierto={sidebar3Abierto && !esInforme && previaVisible}
        izquierda={izquierdaSidebar3 + ANCHO_SIDEBAR3}
        arriba={ALTO_TOPBAR + ALTO_CINTA - 1}
        form={form}
        onCambiar={cambiarCampos}
        onAporte={() => { setAporte(true); setPreviaVisible(true); }}
        plantillas={PLANTILLAS_ACTA}
        tiposBloque={TIPOS_BLOQUE_ACTA}
        codigo={editando ? tituloPunto(punto.numero) : undefined}
        fecha={sesionActivaFecha ?? ''}
      />
      {thumb.visible && (
        <div
          className="widget-formulario-punto-scrollbar-thumb"
          style={{ height: thumb.alto, top: thumb.top }}
          onMouseDown={onArrastrarThumb}
        />
      )}
    </div>
  );
}
