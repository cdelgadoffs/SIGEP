import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import Modal from '../base/Modal.jsx';
import ExploradorArchivos from './ExploradorArchivos.jsx';
import NavegadorPapelera from './NavegadorPapelera.jsx';
import { carpetasDeSesion } from '../../utils/arbolArchivos.js';
import { encabezadoSesion, listaNoPublicada, hayActaVisible, infoNavegadorAbierta, TEXTO_LISTA_NO_PUBLICADA } from '../../utils/sesiones.js';
import { puntoCoincide } from '../../utils/puntos.js';
import '../../styles/widgets/VistaNavegador.css';

export default function VistaNavegador() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO, PUNTOS, PAPELERA, cargando, error, renombrarArchivo, renombrarCarpeta } = useProyecto();
  const { abrirVistaArchivo, terminoBusqueda, elementoNavegador, setElementoNavegador, irAPunto } = useUI();
  const { infoNavegadorPorSesion, cambiarInfoNavegador } = useAjustesVisuales();
  const [papeleraAbierta, setPapeleraAbierta] = useState(false);

  const sesionId = sesionSeleccionada?.id ?? null;
  const carpetas = carpetasDeSesion(PUNTOS, sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO);
  const terminoGlobal = terminoBusqueda.trim();
  const puntoDeCarpeta = (c) => PUNTOS.find((p) => p.id === c.puntoRef);
  const puedeRenombrar = puedeEscribir && !!sesionSeleccionada && sesionSeleccionada.estado !== 'celebrada' && sesionSeleccionada.estado !== 'no-celebrada';
  const hayActa = hayActaVisible(sesionSeleccionada, puedeEscribir);
  const infoAbierta = infoNavegadorAbierta(infoNavegadorPorSesion, sesionId, hayActa);
  const hayVistaProyecto = sesionSeleccionada?.estado === 'proxima' || sesionSeleccionada?.estado === 'pendiente';
  const claveSeleccionada = elementoNavegador && elementoNavegador.sesionId === sesionId ? elementoNavegador.clave : null;

  const aviso = !sesionSeleccionada
    ? 'Selecciona una sesión para ver sus archivos.'
    : cargando && PUNTOS.length === 0
    ? 'Cargando…'
    : error && PUNTOS.length === 0
    ? 'No se pudieron cargar los archivos.'
    : null;

  function textoVacio({ buscando, busqueda, enCarpeta }) {
    if (listaNoPublicada(sesionSeleccionada, puedeEscribir)) return TEXTO_LISTA_NO_PUBLICADA;
    if (buscando) return `Sin resultados para «${busqueda}».`;
    if (enCarpeta) return 'Esta carpeta está vacía.';
    if (terminoGlobal) return `Ningún punto coincide con «${terminoGlobal}».`;
    return 'Esta sesión aún no tiene archivos.';
  }

  function accionFila(puntoId) {
    const punto = puntoId ? PUNTOS.find((p) => p.id === puntoId) : null;
    if (!hayVistaProyecto || !punto) return null;
    return (
      <button
        type="button"
        className="widget-explorador-archivos-ir"
        onClick={(e) => { e.stopPropagation(); irAPunto(puntoId, punto.seccion); }}
        onDoubleClick={(e) => e.stopPropagation()}
      >
        Ir al punto
      </button>
    );
  }

  return (
    <>
      <ExploradorArchivos
        clave={sesionId}
        carpetas={carpetas}
        filtroRaiz={terminoGlobal ? (c) => { const p = puntoDeCarpeta(c); return !!p && puntoCoincide(p, terminoGlobal); } : undefined}
        tituloRaiz={encabezadoSesion(sesionSeleccionada).titulo}
        placeholderBusqueda="Buscar en la sesión"
        busquedaDeshabilitada={!sesionSeleccionada}
        aviso={aviso}
        textoVacio={textoVacio}
        claveSeleccionada={claveSeleccionada}
        onSeleccionar={(el) => setElementoNavegador(el ? { ...el, sesionId } : null)}
        onAbrirArchivo={abrirVistaArchivo}
        puedeRenombrar={puedeRenombrar}
        onRenombrarCarpeta={(c, rutaSub, nuevo) => renombrarCarpeta(c.puntoId, rutaSub, nuevo)}
        onRenombrarArchivo={renombrarArchivo}
        accionFila={accionFila}
        herramientas={(
          <>
            {puedeEscribir && (
              <BotonIcono
                icono="ri-delete-bin-line"
                ariaLabel={`Papelería de reciclaje (${PAPELERA.length})`}
                onClick={() => setPapeleraAbierta(true)}
              />
            )}
            <BotonIcono
              icono={infoAbierta ? 'ri-information-fill' : 'ri-information-line'}
              ariaLabel="Información"
              onClick={() => cambiarInfoNavegador(sesionId, !infoAbierta)}
            />
          </>
        )}
      />
      <Modal abierto={papeleraAbierta && puedeEscribir} titulo="Papelería de reciclaje" tamano="completo" onCerrar={() => setPapeleraAbierta(false)}>
        <div className="widget-vista-navegador-papelera">
          <NavegadorPapelera />
        </div>
      </Modal>
    </>
  );
}
