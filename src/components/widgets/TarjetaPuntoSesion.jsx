import { useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import Card from '../base/Card.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import SelectorVotacion from './SelectorVotacion.jsx';
import SelectorInforme from './SelectorInforme.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useOrgano } from '../../context/OrganoContext.jsx';
import '../../styles/widgets/TarjetaPuntoSesion.css';

export default function TarjetaPuntoSesion({ item, navegacion }) {
  const { REMITENTES, sesionFinalizada, listaCerrada, registrarVotacion, TIPOS_VOTO, TIPOS_VOTACION, ESTADOS_VOTO, TIPOS_CONOCIMIENTO } = useProyecto();
  const { puedeEscribir } = useAuth();
  const soloLectura = sesionFinalizada || !puedeEscribir;
  const { INTEGRANTES } = useOrgano();
  const [errorAccion, setErrorAccion] = useState(null);
  const [votacionLocal, setVotacionLocal] = useState(null);
  const temporizador = useRef(null);

  const { punto, seccion, titulo } = item;

  function cambiarVotacion(valor) {
    setVotacionLocal(valor);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(async () => {
      setErrorAccion(null);
      try {
        await registrarVotacion(punto.id, valor);
      } catch (e) {
        setErrorAccion(e.mensaje || 'No se pudo guardar la votación.');
      }
      setVotacionLocal((l) => (l === valor ? null : l));
    }, 400);
  }

  const esInforme = !seccion.requiereAcuerdo;
  const lineas = punto.acuerdoLineas ?? [];
  const mostrarAcuerdo = !esInforme && !punto.fijo && lineas.length > 0 && (lineas.length > 1 || !punto.tratado);
  const valorVotacion = (votacionLocal ?? punto.votacion) ?? {};
  const nombreRemitente = REMITENTES.find((r) => r.id === punto.remitente)?.nombre ?? punto.remitente;

  return (
    <div className={'widget-tarjeta-punto-sesion' + (punto.tratado ? ' widget-tarjeta-punto-sesion-tratado' : '')}>
      {errorAccion && <div className="widget-tarjeta-punto-sesion-error">{errorAccion}</div>}
      <Card>
        <div className="widget-tarjeta-punto-sesion-header">
          <span className={'widget-tarjeta-punto-sesion-titulo' + (punto.confidencial ? ' widget-tarjeta-punto-sesion-titulo-confidencial' : '')}>
            {titulo}
          </span>
          <span className="widget-tarjeta-punto-sesion-dependencia">{nombreRemitente}</span>
        </div>
        <div className="widget-tarjeta-punto-sesion-principal">
          <span className="widget-tarjeta-punto-sesion-label">{esInforme ? 'Informe' : 'Punto de acuerdo'}</span>
          <div className="widget-tarjeta-punto-sesion-contenido">{punto.contenido || 'Sin contenido'}</div>
        </div>
        {!punto.encabezado && (
          <div className="widget-tarjeta-punto-sesion-seccion">
            <span className="widget-tarjeta-punto-sesion-label">Votación</span>
            {!punto.fijo && !punto.tratado && (
              <div className="widget-tarjeta-punto-sesion-aviso">Disponible solo si el punto está marcado como tratado.</div>
            )}
            {!punto.fijo && punto.tratado && (esInforme ? (
              <SelectorInforme
                value={valorVotacion}
                onChange={(valor) => cambiarVotacion(valor)}
                tiposConocimiento={TIPOS_CONOCIMIENTO}
                disabled={soloLectura}
              />
            ) : (
              <SelectorVotacion
                value={valorVotacion}
                onChange={(valor) => cambiarVotacion(valor)}
                tiposVoto={TIPOS_VOTO}
                tiposVotacion={TIPOS_VOTACION}
                estadosVoto={ESTADOS_VOTO}
                integrantes={INTEGRANTES}
                disabled={soloLectura}
              />
            ))}
            {punto.fijo || punto.tratado ? (
              <div
                key={punto.id + ':' + punto.textoVotacion}
                className="widget-tarjeta-punto-sesion-resultado"
                contentEditable={!punto.fijo && !soloLectura}
                suppressContentEditableWarning
                onBlur={(e) => {
                  const texto = e.currentTarget.textContent;
                  if (!punto.fijo && texto !== punto.textoVotacion) cambiarVotacion({ ...valorVotacion, textoManual: texto });
                }}
              >
                {punto.textoVotacion}
              </div>
            ) : (
              <div className="widget-tarjeta-punto-sesion-resultado widget-tarjeta-punto-sesion-resultado-vacio">
                El punto debe estar marcado como tratado para contar con votación.
              </div>
            )}
          </div>
        )}
        {mostrarAcuerdo && (
          <div className="widget-tarjeta-punto-sesion-seccion">
            <span className="widget-tarjeta-punto-sesion-label">Acuerdo</span>
            <div className="widget-tarjeta-punto-sesion-acuerdo">
              {lineas.map((l, i) => (
                <div key={i}>
                  {i > 0 && <hr className="widget-tarjeta-punto-sesion-separador" />}
                  <strong>{l.prefijo}.</strong> {l.texto}
                </div>
              ))}
            </div>
          </div>
        )}
        <div className="widget-tarjeta-punto-sesion-navegacion">
          {navegacion && (
            <OpcionesNavegacion
              onAnterior={navegacion.onAnterior}
              onSiguiente={navegacion.onSiguiente}
              anteriorDeshabilitado={navegacion.anteriorDeshabilitado}
              siguienteDeshabilitado={navegacion.siguienteDeshabilitado}
              etiquetaAnterior="Punto anterior"
              etiquetaSiguiente="Punto siguiente"
            />
          )}
          {puedeEscribir && !sesionFinalizada && !listaCerrada && !punto.fijo && <OpcionesAUD punto={punto} ocultar={['adjuntar', 'editar']} />}
        </div>
      </Card>
    </div>
  );
}
