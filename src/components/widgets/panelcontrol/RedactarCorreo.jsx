import { useEffect, useRef, useState } from 'react';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import Scrollbar from '../../base/Scrollbar.jsx';
import EditorTexto from '../EditorTexto.jsx';
import BarraHerramientasTexto from '../BarraHerramientasTexto.jsx';
import FilaDestinatarios from './FilaDestinatarios.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import { useProyecto } from '../../../context/ProyectoContext.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { estiloArchivo } from '../../../utils/archivos.js';
import { docVacio, esDocVacio } from '../../../utils/documento.js';
import '../../../styles/widgets/panelcontrol/RedactarCorreo.css';

const CLAVE_BORRADOR = 'correoNuevo';

const formularioVacio = () => ({ para: [], cc: [], cco: [], mostrarCco: false, asunto: '', cuerpoDoc: docVacio() });

const sinRepetir = (lista, correos) => [...lista, ...correos.filter((c) => !lista.some((x) => x.toLowerCase() === c.toLowerCase()))];

const horaDe = (fecha) => fecha.toTimeString().slice(0, 5);

export default function RedactarCorreo() {
  const {
    CONTACTOS_CORREO, PLANTILLAS_CORREO, LISTAS_CORREO, CORREOS_REMITENTES,
    enviarCorreo, guardarBorrador, obtenerBorrador, eliminarBorrador,
  } = useCorreo();
  const { REMITENTES, PUNTOS } = useProyecto();
  const { setEmailSeccion, setCorreoSeleccionadoId } = useUI();

  const editorRef = useRef(null);
  const entradaArchivos = useRef(null);
  const [form, setForm] = useState(formularioVacio);
  const [archivosPunto, setArchivosPunto] = useState([]);
  const [externos, setExternos] = useState([]);
  const [restaurado, setRestaurado] = useState(false);
  const [guardadoA, setGuardadoA] = useState(null);
  const [tokenEditor, setTokenEditor] = useState(0);
  const [error, setError] = useState(null);
  const [enviando, setEnviando] = useState(false);

  const documentos = PUNTOS.flatMap((p) => (p.archivos ?? []).filter((a) => a.id && !a.autogenerado && !a.informativo).map((a) => ({ id: a.id, nombre: a.nombre })));
  const hayContenido = form.para.length > 0 || form.cc.length > 0 || form.cco.length > 0
    || form.asunto.trim() !== '' || !esDocVacio(form.cuerpoDoc);

  useEffect(() => {
    let vigente = true;
    obtenerBorrador(CLAVE_BORRADOR)
      .catch(() => null)
      .then((borrador) => {
        if (!vigente) return;
        if (borrador) {
          const { guardadoEn, ...campos } = borrador;
          setForm({ ...formularioVacio(), ...campos });
          setGuardadoA(guardadoEn ? new Date(guardadoEn) : null);
          setTokenEditor((t) => t + 1);
        }
        setRestaurado(true);
      });
    return () => { vigente = false; };
  }, [obtenerBorrador]);

  useEffect(() => {
    if (!restaurado) return;
    const temporizador = setTimeout(() => {
      if (hayContenido) {
        const ahora = new Date();
        guardarBorrador(CLAVE_BORRADOR, { ...form, guardadoEn: ahora.toISOString() });
        setGuardadoA(ahora);
      } else {
        eliminarBorrador(CLAVE_BORRADOR);
        setGuardadoA(null);
      }
    }, 600);
    return () => clearTimeout(temporizador);
  }, [form, restaurado, hayContenido, guardarBorrador, eliminarBorrador]);

  const cambiar = (cambios) => setForm((f) => ({ ...f, ...cambios }));

  function opcionesDestinatarios() {
    const opciones = [
      ...CONTACTOS_CORREO.map((c) => ({ id: `c:${c.id}`, label: `${c.nombre} <${c.correo}>` })),
      ...LISTAS_CORREO.map((l) => ({ id: `l:${l.id}`, label: `Lista · ${l.nombre} (${l.correos.length})` })),
      ...REMITENTES.filter((r) => CORREOS_REMITENTES.some((c) => c.remitenteId === r.id)).map((r) => ({ id: `r:${r.id}`, label: `Remitente · ${r.nombre}` })),
    ];
    return opciones.length > 0 ? opciones : [{ id: '', label: 'No hay contactos, listas ni remitentes con correo' }];
  }

  function correosDe(id) {
    const [tipo, clave] = [id.slice(0, 1), id.slice(2)];
    if (tipo === 'c') return [CONTACTOS_CORREO.find((c) => c.id === clave)?.correo].filter(Boolean);
    if (tipo === 'l') return LISTAS_CORREO.find((l) => l.id === clave)?.correos ?? [];
    if (tipo === 'r') return [CORREOS_REMITENTES.find((c) => c.remitenteId === clave)?.correo].filter(Boolean);
    return [];
  }

  const filaDe = (campo) => ({
    opciones: opcionesDestinatarios(),
    onElegir: (id) => cambiar({ [campo]: sinRepetir(form[campo], correosDe(id)) }),
    valores: form[campo],
    onAgregar: (correo) => cambiar({ [campo]: sinRepetir(form[campo], [correo]) }),
    onQuitar: (correo) => cambiar({ [campo]: form[campo].filter((x) => x !== correo) }),
  });

  function elegirAdjunto(id) {
    if (id === 'externo') entradaArchivos.current?.click();
    else if (id.startsWith('d:')) setArchivosPunto((a) => sinRepetir(a, [id.slice(2)]));
  }

  function elegirArchivos(e) {
    const nuevos = Array.from(e.target.files ?? []);
    setExternos((prev) => [...prev, ...nuevos]);
    e.target.value = '';
  }

  function aplicarPlantilla(id) {
    const elegida = PLANTILLAS_CORREO.find((p) => p.id === id);
    if (!elegida) return;
    cambiar({ asunto: elegida.asunto, cuerpoDoc: elegida.cuerpoDoc });
    setTokenEditor((t) => t + 1);
  }

  async function descartar() {
    setForm(formularioVacio());
    setArchivosPunto([]);
    setExternos([]);
    setError(null);
    setGuardadoA(null);
    setTokenEditor((t) => t + 1);
    await eliminarBorrador(CLAVE_BORRADOR);
  }

  async function enviar() {
    if (enviando) return;
    setEnviando(true);
    setError(null);
    try {
      const enviado = await enviarCorreo({
        para: form.para, cc: form.cc, cco: form.cco, asunto: form.asunto, cuerpoDoc: form.cuerpoDoc,
        archivosPunto, archivosExternos: externos,
      });
      await eliminarBorrador(CLAVE_BORRADOR);
      setCorreoSeleccionadoId(enviado.id);
      setEmailSeccion('enviados');
    } catch (e) {
      setError(e.mensaje || 'No se pudo enviar el correo.');
      setEnviando(false);
    }
  }

  const opcionesAdjuntar = [
    { id: 'externo', label: 'Archivo externo…' },
    ...documentos.filter((d) => !archivosPunto.includes(d.id)).map((d) => ({ id: `d:${d.id}`, label: `Documento · ${d.nombre}` })),
  ];
  const opcionesPlantillas = PLANTILLAS_CORREO.length > 0
    ? PLANTILLAS_CORREO.map((p) => ({ id: p.id, label: p.nombre }))
    : [{ id: '', label: 'No hay plantillas guardadas' }];

  return (
    <div className="widget-redactar-correo">
      <div className="widget-redactar-correo-cinta">
        <button type="button" className="widget-redactar-correo-enviar" onClick={enviar} disabled={enviando}>
          <i className="ri-send-plane-line"></i>
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
        <div className="widget-redactar-correo-menu">
          <ListaExpandible valorActual="" etiquetaActual={<span><i className="ri-attachment-2"></i> Adjuntar</span>} opciones={opcionesAdjuntar} onSeleccionar={elegirAdjunto} />
        </div>
        <div className="widget-redactar-correo-menu">
          <ListaExpandible valorActual="" etiquetaActual={<span><i className="ri-file-text-line"></i> Plantillas</span>} opciones={opcionesPlantillas} onSeleccionar={aplicarPlantilla} />
        </div>
        <BarraHerramientasTexto obtenerEditor={() => editorRef.current} onError={setError} />
        <span className="widget-redactar-correo-espacio"></span>
        <BotonIcono icono="ri-delete-bin-line" ariaLabel="Descartar" onClick={descartar} />
        <input ref={entradaArchivos} type="file" multiple hidden onChange={elegirArchivos} />
      </div>
      <div className="widget-redactar-correo-cabecera">
        <FilaDestinatarios etiqueta="Para" {...filaDe('para')}>
          {!form.mostrarCco && (
            <button type="button" className="widget-redactar-correo-cco" onClick={() => cambiar({ mostrarCco: true })}>CCO</button>
          )}
        </FilaDestinatarios>
        <FilaDestinatarios etiqueta="CC" {...filaDe('cc')} />
        {form.mostrarCco && <FilaDestinatarios etiqueta="CCO" {...filaDe('cco')} />}
        <div className="widget-redactar-correo-asunto">
          <input
            type="text"
            className="widget-redactar-correo-asunto-entrada"
            value={form.asunto}
            onChange={(e) => cambiar({ asunto: e.target.value })}
            placeholder="Agregar un asunto"
            aria-label="Asunto"
          />
          {guardadoA && <span className="widget-redactar-correo-guardado">Borrador guardado a las {horaDe(guardadoA)}</span>}
        </div>
        {(archivosPunto.length > 0 || externos.length > 0) && (
          <div className="widget-redactar-correo-adjuntos">
            {archivosPunto.map((id) => {
              const nombre = documentos.find((d) => d.id === id)?.nombre ?? 'Documento';
              const { icono, tono } = estiloArchivo(nombre);
              return <BadgeDinamico key={id} texto={nombre} icono={icono} tono={tono} onEliminar={() => setArchivosPunto((a) => a.filter((x) => x !== id))} />;
            })}
            {externos.map((f, i) => {
              const { icono, tono } = estiloArchivo(f.name);
              return <BadgeDinamico key={`${f.name}-${i}`} texto={f.name} icono={icono} tono={tono} onEliminar={() => setExternos((prev) => prev.filter((_, j) => j !== i))} />;
            })}
          </div>
        )}
        {error && <div className="widget-redactar-correo-error">{error}</div>}
      </div>
      <div className="widget-redactar-correo-cuerpo">
        <Scrollbar>
          <div className="widget-redactar-correo-editor">
            <EditorTexto
              value={form.cuerpoDoc}
              onChange={(doc) => cambiar({ cuerpoDoc: doc })}
              placeholder="Redacta el mensaje…"
              onFocusEditor={(ed) => { editorRef.current = ed; }}
              autoFocus={tokenEditor > 0}
              resetToken={tokenEditor}
              ariaLabel="Cuerpo del correo"
            />
          </div>
        </Scrollbar>
      </div>
    </div>
  );
}
