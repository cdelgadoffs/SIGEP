import { useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../base/Card.jsx';
import IndicadorSync from '../base/IndicadorSync.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import TrasladarPunto from './TrasladarPunto.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import ListaArchivosAdjuntos from './ListaArchivosAdjuntos.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import { tituloPunto } from '../../utils/puntos.js';
import '../../styles/widgets/ListaPuntosProyecto.css';

function seleccionarSiNoEsControl(e, seleccionar) {
  if (e.target.closest('button, a, input, label')) return;
  seleccionar();
}

function TarjetaPunto({ punto, titulo, requiereAcuerdo, nombreRemitente, opciones, onAbrir, seleccionada, onSeleccionar }) {
  const esInforme = !requiereAcuerdo;
  return (
    <div id={`punto-${punto.id}`} className={'widget-lista-puntos-item' + (seleccionada ? ' widget-lista-puntos-item-seleccionado' : '')}>
      <Card onClick={(e) => seleccionarSiNoEsControl(e, onSeleccionar)}>
        <div className="widget-lista-puntos-header">
          <span className={'widget-lista-puntos-titulo' + (punto.confidencial ? ' widget-lista-puntos-titulo-confidencial' : '')}>
            {titulo}
          </span>
          <div className="widget-lista-puntos-header-derecha">
            <IndicadorSync estado={punto.sincronizacion} />
            <span className="widget-lista-puntos-dependencia">{nombreRemitente}</span>
            {opciones && (
              <div className="widget-lista-puntos-opciones">
                <div className="widget-lista-puntos-opciones-interior">{opciones}</div>
              </div>
            )}
          </div>
        </div>
        <div className="widget-lista-puntos-columnas">
          <div className="widget-lista-puntos-columna widget-lista-puntos-principal">
            <span className="widget-lista-puntos-label">{esInforme ? 'Informe' : 'Punto de acuerdo'}</span>
            <div className="widget-lista-puntos-contenido">{punto.contenido || 'Sin contenido'}</div>
            {!esInforme && !punto.fijo && (
              <div className="widget-lista-puntos-bloque-acuerdo">
                <span className="widget-lista-puntos-label">Acuerdo</span>
                <div className="widget-lista-puntos-acuerdo">
                  {punto.acuerdoLineas?.length > 0 ? punto.acuerdoLineas.map((l, i) => (
                    <div key={i}>
                      {i > 0 && <hr className="widget-lista-puntos-separador" />}
                      <strong>{l.prefijo}.</strong> {l.texto}
                    </div>
                  )) : 'Sin acuerdo'}
                </div>
              </div>
            )}
          </div>
          {punto.archivos.some((a) => !a.informativo) && (
            <div className="widget-lista-puntos-columna widget-lista-puntos-archivos">
              <div className="widget-lista-puntos-archivos-scroll">
                <Scrollbar>
                  <div className="widget-lista-puntos-archivos-contenido">
                    <ListaArchivosAdjuntos
                      alineacion="fin"
                      agrupar={false}
                      archivos={punto.archivos.filter((a) => !a.informativo).map((a, i) => ({
                        clave: a.id ?? i,
                        nombre: a.nombre,
                        ruta: a.ruta,
                        onClick: a.id && onAbrir ? () => onAbrir(a) : undefined,
                      }))}
                    />
                  </div>
                </Scrollbar>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}

function BadgeOrigenAG({ punto, nombreSeccion, nombreRemitente, onIr }) {
  return (
    <div className="widget-lista-puntos-badge-ag" role="button" tabIndex={0} onClick={onIr} onKeyDown={(e) => { if (e.key === 'Enter') onIr(); }} title={`Ir a ${nombreSeccion}`}>
      <span className="widget-lista-puntos-badge-ag-codigo">{tituloPunto(punto.numero)}</span>
      <span className="widget-lista-puntos-badge-ag-seccion">{nombreSeccion}<i className="ri-arrow-right-line"></i></span>
      <span className="widget-lista-puntos-badge-ag-remitente">{nombreRemitente}</span>
    </div>
  );
}

function listaDeSeccion(puntos, seccion, remitentes, estadoCarga, renderOpciones, onAbrir, seleccionadoId, seleccionar, secciones) {
  const deLaSeccion = puntos.filter((p) => p.seccion === seccion.id);
  const registradosAqui = seccion.permiteCambiarSeccion ? puntos.filter((p) => p.origenAG && p.seccion !== seccion.id) : [];
  const hayPuntos = deLaSeccion.some((p) => !p.encabezado) || registradosAqui.length > 0;
  let aviso = null;
  if (!hayPuntos && estadoCarga !== 'error') {
    aviso = estadoCarga === 'cargando'
      ? <div className="widget-lista-puntos-vacio">Cargando…</div>
      : <div className="widget-lista-puntos-vacio">Sin puntos en {seccion.nombre}.</div>;
  }
  return (
    <>
      {deLaSeccion.map((p) => (p.encabezado ? (
        <div key={p.id} className="widget-lista-puntos-encabezado">
          <span className="widget-lista-puntos-encabezado-codigo">{tituloPunto(p.numero)}</span>
          <span>{p.contenido}</span>
        </div>
      ) : (
        <TarjetaPunto
          key={p.id}
          punto={p}
          titulo={tituloPunto(p.numero)}
          requiereAcuerdo={seccion.requiereAcuerdo}
          nombreRemitente={remitentes.find((r) => r.id === p.remitente)?.nombre ?? p.remitente}
          opciones={renderOpciones(p, deLaSeccion, seccion.id)}
          onAbrir={onAbrir}
          seleccionada={seleccionadoId === p.id}
          onSeleccionar={() => seleccionar(p.id, seccion.id)}
        />
      )))}
      {secciones.map((destino) => {
        const grupo = registradosAqui.filter((p) => p.seccion === destino.id);
        if (grupo.length === 0) return null;
        return (
          <div key={destino.id} className="widget-lista-puntos-grupo-ag">
            <div className="widget-lista-puntos-grupo-ag-titulo">{destino.nombre}</div>
            {grupo.map((p) => (
              <BadgeOrigenAG
                key={p.id}
                punto={p}
                nombreSeccion={destino.nombre}
                nombreRemitente={remitentes.find((r) => r.id === p.remitente)?.nombre ?? p.remitente}
                onIr={() => seleccionar(p.id, destino.id, true)}
              />
            ))}
          </div>
        );
      })}
      {aviso}
    </>
  );
}

export default function ListaPuntosProyecto({ opcionesOcultas = [], opcionesExtra }) {
  const { puedeEscribir } = useAuth();
  const { PUNTOS: puntos, SECCIONES_DOCUMENTO, REMITENTES, sesionFinalizada, listaCerrada, reordenarPuntos, cargando, error } = useProyecto();
  const [errorAccion, setErrorAccion] = useState(null);
  const [moviendo, setMoviendo] = useState(false);
  const [seleccionadoId, setSeleccionadoId] = useState(null);
  const { seccionActivaProyecto, setSeccionActivaProyecto, abrirVistaArchivo } = useUI();
  const { vistaCompletaProyecto } = useAjustesVisuales();
  const seleccionar = (id, seccionId, desplazar = false) => {
    setSeccionActivaProyecto(seccionId);
    setSeleccionadoId(id);
    if (desplazar) {
      requestAnimationFrame(() => document.getElementById(`punto-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
  };
  const estadoCarga = error ? 'error' : cargando ? 'cargando' : 'listo';
  const avisoError = (error || errorAccion) && (
    <div className="widget-lista-puntos-error">
      {error ? `No se pudo cargar la información: ${error.mensaje}` : errorAccion}
    </div>
  );
  async function mover(seccionId, deLaSeccion, indice, delta) {
    if (moviendo) return;
    const ids = deLaSeccion.map((p) => p.id);
    [ids[indice], ids[indice + delta]] = [ids[indice + delta], ids[indice]];
    setMoviendo(true);
    setErrorAccion(null);
    try {
      await reordenarPuntos(seccionId, ids);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo mover el punto.');
    } finally {
      setMoviendo(false);
    }
  }
  const renderOpciones = (punto, deLaSeccion, seccionId) => {
    if (sesionFinalizada || punto.fijo || !puedeEscribir) return null;
    const ocultas = listaCerrada ? [...opcionesOcultas, 'mover', 'editar', 'eliminar', 'trasladar'] : opcionesOcultas;
    const delUsuario = deLaSeccion.filter((p) => !p.fijo);
    const indice = delUsuario.findIndex((p) => p.id === punto.id);
    return (
      <>
        {delUsuario.length > 1 && !ocultas.includes('mover') && (
          <OpcionesNavegacion
            orientacion="vertical"
            onAnterior={() => mover(seccionId, delUsuario, indice, -1)}
            onSiguiente={() => mover(seccionId, delUsuario, indice, 1)}
            anteriorDeshabilitado={moviendo || indice === 0}
            siguienteDeshabilitado={moviendo || indice === delUsuario.length - 1}
            etiquetaAnterior="Subir punto"
            etiquetaSiguiente="Bajar punto"
          />
        )}
        <OpcionesAUD punto={punto} ocultar={ocultas}>
          {opcionesExtra && opcionesExtra(punto)}
        </OpcionesAUD>
        {!ocultas.includes('trasladar') && <TrasladarPunto punto={punto} />}
      </>
    );
  };

  if (vistaCompletaProyecto) {
    return (
      <div className="widget-lista-puntos-proyecto">
        {avisoError}
        {SECCIONES_DOCUMENTO.map((s) => (
          <div key={s.id} className="widget-lista-puntos-grupo">
            <div className="widget-lista-puntos-separador">{s.nombre}</div>
            {listaDeSeccion(puntos, s, REMITENTES, estadoCarga, renderOpciones, abrirVistaArchivo, seleccionadoId, seleccionar, SECCIONES_DOCUMENTO)}
          </div>
        ))}
      </div>
    );
  }

  const seccionId = seccionActivaProyecto ?? SECCIONES_DOCUMENTO[0]?.id;
  const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === seccionId);

  return (
    <div className="widget-lista-puntos-proyecto">
      {avisoError}
      {seccion ? listaDeSeccion(puntos, seccion, REMITENTES, estadoCarga, renderOpciones, abrirVistaArchivo, seleccionadoId, seleccionar, SECCIONES_DOCUMENTO) : (
        estadoCarga === 'listo' && <div className="widget-lista-puntos-vacio">Sin secciones definidas.</div>
      )}
      {!seccion && estadoCarga === 'cargando' && <div className="widget-lista-puntos-vacio">Cargando…</div>}
    </div>
  );
}
