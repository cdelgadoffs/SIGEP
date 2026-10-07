import { useEffect, useRef, useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useCorreo } from '../../context/CorreoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { tituloPunto } from '../../utils/puntos.js';
import '../../styles/widgets/AvisoEdicionCorreo.css';

function truncar(texto, max = 140) {
  return texto.length > max ? `${texto.slice(0, max)}…` : texto;
}

function resumenDe(diff) {
  if (!diff || !diff.fragmento) return 'Se modificó el punto';
  if (diff.tipo === 'agregado') return `Se añadió: "${truncar(diff.fragmento)}"`;
  if (diff.tipo === 'eliminado') return `Se eliminó: "${truncar(diff.fragmento)}"`;
  return `Se cambió "${truncar(diff.fragmentoAnterior)}" por "${truncar(diff.fragmento)}"`;
}

export default function AvisoEdicionCorreo() {
  const { AVISOS_EDICION, REMITENTES, enviarAvisoEdicion, descartarAvisoEdicion } = useProyecto();
  const { CORREOS_REMITENTES } = useCorreo();
  const { avisosEdicionExpandido: expandido, setAvisosEdicionExpandido: setExpandido } = useUI();
  const [enviandoId, setEnviandoId] = useState(null);
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [errores, setErrores] = useState({});
  const [estado, setEstado] = useState(null);
  const clavesPreviasRef = useRef(new Set());

  useEffect(() => {
    const claves = new Set(AVISOS_EDICION.map((a) => `${a.id}:${a.creadoEn}`));
    const hayNuevo = [...claves].some((c) => !clavesPreviasRef.current.has(c));
    if (hayNuevo && AVISOS_EDICION.length >= 2) setExpandido(false);
    clavesPreviasRef.current = claves;
  }, [AVISOS_EDICION, setExpandido]);

  if (AVISOS_EDICION.length === 0) return null;

  const correoDe = (aviso) => CORREOS_REMITENTES.find((c) => c.remitenteId === aviso.remitenteId)?.correo;
  const nombreDe = (aviso) => REMITENTES.find((r) => r.id === aviso.remitenteId)?.nombre ?? aviso.remitenteId;
  const marcarError = (id, mensaje) => setErrores((e) => ({ ...e, [id]: mensaje }));

  async function enviar(aviso) {
    setEnviandoId(aviso.id);
    marcarError(aviso.id, null);
    try {
      await enviarAvisoEdicion(aviso.id);
    } catch (e) {
      marcarError(aviso.id, e.mensaje || 'No se pudo enviar el aviso.');
    } finally {
      setEnviandoId(null);
    }
  }

  async function descartar(aviso) {
    marcarError(aviso.id, null);
    try {
      await descartarAvisoEdicion(aviso.id);
    } catch (e) {
      marcarError(aviso.id, e.mensaje || 'No se pudo descartar el aviso.');
    }
  }

  async function notificarTodos() {
    const conCorreo = AVISOS_EDICION.filter(correoDe);
    if (conCorreo.length === 0) {
      setEstado('Ninguna de las dependencias pendientes tiene un correo vinculado.');
      return;
    }
    setEnviandoTodos(true);
    setEstado(null);
    let enviados = 0;
    for (const aviso of conCorreo) {
      try {
        await enviarAvisoEdicion(aviso.id);
        enviados += 1;
      } catch (e) {
        marcarError(aviso.id, e.mensaje || 'No se pudo enviar el aviso.');
      }
    }
    setEnviandoTodos(false);
    setEstado(`Se enviaron ${enviados} de ${AVISOS_EDICION.length} avisos.`);
  }

  function pintarAviso(aviso) {
    const codigo = tituloPunto(aviso.numero);
    const correo = correoDe(aviso);
    return (
      <div key={aviso.id} className="widget-aviso-edicion-item">
        <div className="widget-aviso-edicion-item-encabezado">
          <span className="widget-aviso-edicion-titulo">Cambio en {codigo}</span>
          <button type="button" className="widget-aviso-edicion-cerrar" aria-label="Descartar aviso" onClick={() => descartar(aviso)}>✕</button>
        </div>
        <p>Se editó el punto {codigo} de <strong>{nombreDe(aviso)}</strong></p>
        <p className="widget-aviso-edicion-resumen">{resumenDe(aviso.diff)}</p>
        {correo
          ? <p className="widget-aviso-edicion-destinatario">{correo}</p>
          : <p className="widget-aviso-edicion-sin-correo">Esta dependencia no tiene un correo vinculado. Configúralo en Email → Correo de remitentes.</p>}
        {errores[aviso.id] && <p className="widget-aviso-edicion-error">{errores[aviso.id]}</p>}
        <div className="widget-aviso-edicion-acciones">
          <BotonS onClick={() => descartar(aviso)}>Descartar</BotonS>
          <BotonS variant="claro" disabled={!correo || enviandoId === aviso.id} onClick={() => enviar(aviso)}>
            {enviandoId === aviso.id ? 'Enviando...' : 'Enviar aviso'}
          </BotonS>
        </div>
      </div>
    );
  }

  if (AVISOS_EDICION.length === 1) {
    return <div className="widget-aviso-edicion-flotante">{pintarAviso(AVISOS_EDICION[0])}</div>;
  }

  if (!expandido) {
    return (
      <button type="button" className="widget-aviso-edicion-burbuja" key={AVISOS_EDICION.length} onClick={() => setExpandido(true)}>
        <span className="widget-aviso-edicion-icono">✉</span>
        {AVISOS_EDICION.length} avisos pendientes
      </button>
    );
  }

  return (
    <div className="widget-aviso-edicion-bandeja">
      <div className="widget-aviso-edicion-encabezado">
        <span className="widget-aviso-edicion-icono">✉</span>
        <span className="widget-aviso-edicion-titulo">Avisos pendientes ({AVISOS_EDICION.length})</span>
        <button type="button" className="widget-aviso-edicion-cerrar" title="Minimizar" aria-label="Minimizar" onClick={() => setExpandido(false)}>﹣</button>
      </div>
      <div className="widget-aviso-edicion-notificar-todos">
        <BotonS variant="claro" disabled={enviandoTodos} onClick={notificarTodos}>
          {enviandoTodos ? 'Enviando...' : 'Notificar todos'}
        </BotonS>
        {estado && <p className="widget-aviso-edicion-estado">{estado}</p>}
      </div>
      <div className="widget-aviso-edicion-lista">
        {AVISOS_EDICION.map(pintarAviso)}
      </div>
    </div>
  );
}
