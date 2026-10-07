import { useEffect, useState } from 'react';
import BotonS from '../base/BotonS.jsx';
import Checkbox from '../base/Checkbox.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import Modal from '../base/Modal.jsx';
import VistaPreviaFlotante from './VistaPreviaFlotante.jsx';
import BotonDescargarEngroses from './BotonDescargarEngroses.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI, ALTO_TOPBAR } from '../../context/UIContext.jsx';
import { puntosOrdenados, tituloPunto } from '../../utils/puntos.js';
import { formDePunto } from '../../utils/plantillasActa.js';
import '../../styles/widgets/ListaEngroses.css';

const OPCIONES_ESTADO = [
  { id: 'todos', label: 'Todos' },
  { id: 'enviados', label: 'Enviados' },
  { id: 'pendientes', label: 'Pendientes' },
];

export default function ListaEngroses() {
  const {
    PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, PLANTILLAS_ACTA, TIPOS_BLOQUE_ACTA, TEXTOS_ACTA,
    sesionSeleccionada, enviarEngrose, cargando, error,
  } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId, vistaPreviaAbierta, setVistaPreviaAbierta } = useUI();
  const [filtroRemitente, setFiltroRemitente] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [desmarcados, setDesmarcados] = useState(() => new Set());
  const [enviandoId, setEnviandoId] = useState(null);
  const [enviandoTodos, setEnviandoTodos] = useState(false);
  const [aviso, setAviso] = useState(null);

  const nombreRemitente = (id) => REMITENTES.find((r) => r.id === id)?.nombre ?? id;
  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO).filter((i) => i.punto.engrose);
  const enviados = items.filter((i) => i.punto.engroseEnviado).length;
  const pendientesMarcados = items.filter((i) => !i.punto.engroseEnviado && !desmarcados.has(i.punto.id));
  const puntoVistaPrevia = vistaPreviaAbierta ? items.find((i) => i.punto.id === puntoSesionSeleccionadoId)?.punto ?? null : null;

  const opcionesRemitente = [
    { id: 'todos', label: 'Todos los remitentes' },
    ...[...new Set(items.map((i) => i.punto.remitente))]
      .map((id) => ({ id, label: nombreRemitente(id) }))
      .sort((a, b) => a.label.localeCompare(b.label)),
  ];
  const visibles = items.filter(({ punto }) => {
    if (filtroRemitente !== 'todos' && punto.remitente !== filtroRemitente) return false;
    if (filtroEstado === 'enviados' && !punto.engroseEnviado) return false;
    if (filtroEstado === 'pendientes' && punto.engroseEnviado) return false;
    return true;
  });

  useEffect(() => {
    if (vistaPreviaAbierta && !puntoVistaPrevia) setVistaPreviaAbierta(false);
  }, [vistaPreviaAbierta, puntoVistaPrevia, setVistaPreviaAbierta]);

  useEffect(() => () => setVistaPreviaAbierta(false), [setVistaPreviaAbierta]);

  function alternarSeleccion(id) {
    setDesmarcados((previos) => {
      const siguientes = new Set(previos);
      if (siguientes.has(id)) siguientes.delete(id);
      else siguientes.add(id);
      return siguientes;
    });
  }

  function alternarVistaPrevia(id) {
    if (vistaPreviaAbierta && puntoSesionSeleccionadoId === id) {
      setVistaPreviaAbierta(false);
      return;
    }
    setPuntoSesionSeleccionadoId(id);
    setVistaPreviaAbierta(true);
  }

  async function enviarUno(id) {
    setEnviandoId(id);
    try {
      await enviarEngrose(id);
    } catch (e) {
      setAviso(e.mensaje || 'No se pudo enviar el engrose.');
    } finally {
      setEnviandoId(null);
    }
  }

  async function enviarSeleccionados() {
    setEnviandoTodos(true);
    try {
      for (const { punto } of pendientesMarcados) {
        await enviarEngrose(punto.id);
      }
    } catch (e) {
      setAviso(e.mensaje || 'No se pudieron enviar todos los engroses.');
    } finally {
      setEnviandoTodos(false);
    }
  }

  if (items.length === 0) {
    const mensaje = error
      ? `No se pudo cargar la información: ${error.mensaje}`
      : cargando ? 'Cargando…' : 'No hay puntos para engrosar.';
    return <div className="widget-lista-engroses"><div className="widget-lista-engroses-vacio">{mensaje}</div></div>;
  }

  return (
    <div className="widget-lista-engroses">
      <div className="widget-lista-engroses-encabezado">
        <div className="widget-lista-engroses-titulo">Engroses de la sesión</div>
        <div className="widget-lista-engroses-subtitulo">{enviados} de {items.length} enviados</div>
      </div>
      <div className="widget-lista-engroses-barra">
        <div className="widget-lista-engroses-barra-izq">
          <BotonS variant="claro" onClick={enviarSeleccionados} disabled={enviandoTodos || enviandoId !== null || pendientesMarcados.length === 0}>
            {enviandoTodos ? 'Enviando...' : `Enviar engroses seleccionados (${pendientesMarcados.length})`}
          </BotonS>
          <ListaExpandible
            valorActual={filtroRemitente}
            etiquetaActual={opcionesRemitente.find((o) => o.id === filtroRemitente)?.label ?? 'Todos los remitentes'}
            opciones={opcionesRemitente}
            onSeleccionar={setFiltroRemitente}
          />
          <ListaExpandible
            valorActual={filtroEstado}
            etiquetaActual={OPCIONES_ESTADO.find((o) => o.id === filtroEstado)?.label ?? 'Todos'}
            opciones={OPCIONES_ESTADO}
            onSeleccionar={setFiltroEstado}
          />
        </div>
        <BotonDescargarEngroses />
      </div>
      <div className="widget-lista-engroses-lista">
        {visibles.length === 0 && <div className="widget-lista-engroses-vacio">Ningún engrose coincide con los filtros.</div>}
        {visibles.map(({ punto, titulo }) => (
          <div
            key={punto.id}
            className={
              'widget-lista-engroses-item'
              + (punto.engroseEnviado ? ' widget-lista-engroses-item-enviado' : '')
              + (vistaPreviaAbierta && punto.id === puntoSesionSeleccionadoId ? ' widget-lista-engroses-item-seleccionado' : '')
            }
            onClick={() => alternarVistaPrevia(punto.id)}
          >
            {!punto.engroseEnviado && (
              <span className="widget-lista-engroses-casilla" onClick={(e) => e.stopPropagation()}>
                <Checkbox checked={!desmarcados.has(punto.id)} onChange={() => alternarSeleccion(punto.id)} />
              </span>
            )}
            <div className="widget-lista-engroses-info">
              <div className="widget-lista-engroses-linea">
                <span className="widget-lista-engroses-codigo">{titulo}</span>
                <BadgeDinamico texto={nombreRemitente(punto.remitente)} tono="azul" />
                <BadgeDinamico texto={punto.engroseEnviado ? 'Enviado' : 'Pendiente'} tono={punto.engroseEnviado ? 'verde' : 'naranja'} />
              </div>
              <div className="widget-lista-engroses-resumen">{punto.contenido || 'Sin contenido'}</div>
            </div>
            <span onClick={(e) => e.stopPropagation()}>
              <BotonS variant="claro" onClick={() => enviarUno(punto.id)} disabled={enviandoTodos || enviandoId !== null}>
                {enviandoId === punto.id ? 'Enviando...' : (punto.engroseEnviado ? 'Reenviar' : 'Enviar engrose')}
              </BotonS>
            </span>
          </div>
        ))}
      </div>
      {puntoVistaPrevia && (
        <VistaPreviaFlotante
          key={puntoVistaPrevia.id}
          abierto
          soloLectura
          derecha={0}
          arriba={ALTO_TOPBAR}
          form={formDePunto(puntoVistaPrevia, PLANTILLAS_ACTA, TEXTOS_ACTA)}
          plantillas={PLANTILLAS_ACTA}
          tiposBloque={TIPOS_BLOQUE_ACTA}
          codigo={tituloPunto(puntoVistaPrevia.numero)}
          remitente={nombreRemitente(puntoVistaPrevia.remitente)}
          engrose={puntoVistaPrevia.engrose}
          fecha={sesionSeleccionada?.id ?? ''}
          onCerrar={() => setVistaPreviaAbierta(false)}
        />
      )}
      <Modal abierto={!!aviso} titulo="Engroses" onCerrar={() => setAviso(null)}>
        <p className="widget-lista-engroses-mensaje">{aviso}</p>
      </Modal>
    </div>
  );
}
