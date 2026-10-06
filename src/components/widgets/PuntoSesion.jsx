import { useRef, useState } from 'react';
import Card from '../base/Card.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import SelectorVotacion from './SelectorVotacion.jsx';
import SelectorInforme from './SelectorInforme.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { puntosOrdenados, puntoActivo } from '../../utils/puntos.js';
import '../../styles/widgets/PuntoSesion.css';

export default function PuntoSesion() {
  const { PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, sesionFinalizada, listaCerrada, registrarVotacion, TIPOS_VOTO, TIPOS_VOTACION, ESTADOS_VOTO, INTEGRANTES, TIPOS_CONOCIMIENTO, cargando, error } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId } = useUI();
  const [errorAccion, setErrorAccion] = useState(null);
  const [votacionLocal, setVotacionLocal] = useState(null);
  const temporizador = useRef(null);

  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO);
  const activo = puntoActivo(items, puntoSesionSeleccionadoId);

  function cambiarVotacion(puntoId, valor) {
    setVotacionLocal({ puntoId, valor });
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setErrorAccion(null);
      try {
        await registrarVotacion(puntoId, valor);
      } catch (e) {
        setErrorAccion(e.mensaje || 'No se pudo guardar la votación.');
      }
      setVotacionLocal((l) => (l && l.valor === valor ? null : l));
    }, 400);
  }

  if (!activo) {
    const mensaje = error
      ? `No se pudo cargar la información: ${error.mensaje}`
      : cargando ? 'Cargando…' : 'Esta sesión no tiene puntos.';
    return <div className="widget-punto-sesion"><div className="widget-punto-sesion-vacio">{mensaje}</div></div>;
  }

  const { punto, seccion, titulo } = activo;
  const indice = items.indexOf(activo);
  const irA = (delta) => setPuntoSesionSeleccionadoId(items[indice + delta].punto.id);
  const esInforme = !seccion.requiereAcuerdo;
  const lineas = punto.acuerdoLineas ?? [];
  const mostrarAcuerdo = !esInforme && !punto.fijo && lineas.length > 0 && (lineas.length > 1 || !punto.tratado);
  const valorVotacion = (votacionLocal?.puntoId === punto.id ? votacionLocal.valor : punto.votacion) ?? {};
  const nombreRemitente = REMITENTES.find((r) => r.id === punto.remitente)?.nombre ?? punto.remitente;

  return (
    <div className={'widget-punto-sesion' + (punto.tratado ? ' widget-punto-sesion-tratado' : '')}>
      {errorAccion && <div className="widget-punto-sesion-error">{errorAccion}</div>}
      <Card>
        <div className="widget-punto-sesion-header">
          <span className={'widget-punto-sesion-titulo' + (punto.confidencial ? ' widget-punto-sesion-titulo-confidencial' : '')}>
            {titulo}
          </span>
          <span className="widget-punto-sesion-dependencia">{nombreRemitente}</span>
        </div>
        <div className="widget-punto-sesion-principal">
          <span className="widget-punto-sesion-label">{esInforme ? 'Informe' : 'Punto de acuerdo'}</span>
          <div className="widget-punto-sesion-contenido">{punto.contenido || 'Sin contenido'}</div>
        </div>
        {!punto.encabezado && (
          <div className="widget-punto-sesion-seccion">
            <span className="widget-punto-sesion-label">Votación</span>
            {!punto.fijo && !punto.tratado && (
              <div className="widget-punto-sesion-aviso">Disponible solo si el punto está marcado como tratado.</div>
            )}
            {!punto.fijo && punto.tratado && (esInforme ? (
              <SelectorInforme
                value={valorVotacion}
                onChange={(valor) => cambiarVotacion(punto.id, valor)}
                tiposConocimiento={TIPOS_CONOCIMIENTO}
                disabled={sesionFinalizada}
              />
            ) : (
              <SelectorVotacion
                value={valorVotacion}
                onChange={(valor) => cambiarVotacion(punto.id, valor)}
                tiposVoto={TIPOS_VOTO}
                tiposVotacion={TIPOS_VOTACION}
                estadosVoto={ESTADOS_VOTO}
                integrantes={INTEGRANTES}
                disabled={sesionFinalizada}
              />
            ))}
            {punto.fijo || punto.tratado ? (
              <div
                key={punto.id + ':' + punto.textoVotacion}
                className="widget-punto-sesion-resultado"
                contentEditable={!punto.fijo && !sesionFinalizada}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const texto = e.currentTarget.textContent;
                  if (!punto.fijo && texto !== punto.textoVotacion) cambiarVotacion(punto.id, { ...valorVotacion, textoManual: texto });
                }}
              >
                {punto.textoVotacion}
              </div>
            ) : (
              <div className="widget-punto-sesion-resultado widget-punto-sesion-resultado-vacio">
                El punto debe estar marcado como tratado para contar con votación.
              </div>
            )}
          </div>
        )}
        {mostrarAcuerdo && (
          <div className="widget-punto-sesion-seccion">
            <span className="widget-punto-sesion-label">Acuerdo</span>
            <div className="widget-punto-sesion-acuerdo">
              {lineas.map((l, i) => (
                <div key={i}>
                  {i > 0 && <hr className="widget-punto-sesion-separador" />}
                  <strong>{l.prefijo}.</strong> {l.texto}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="widget-punto-sesion-navegacion">
          <OpcionesNavegacion
            onAnterior={() => irA(-1)}
            onSiguiente={() => irA(1)}
            anteriorDeshabilitado={indice === 0}
            siguienteDeshabilitado={indice === items.length - 1}
            etiquetaAnterior="Punto anterior"
            etiquetaSiguiente="Punto siguiente"
          />
          {!sesionFinalizada && !listaCerrada && !punto.fijo && <OpcionesAUD punto={punto} ocultar={['adjuntar', 'editar']} />}
        </div>
      </Card>
    </div>
  );
}
