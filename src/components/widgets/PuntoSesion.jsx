import { useState } from 'react';
import Card from '../base/Card.jsx';
import BadgeDinamico from '../base/BadgeDinamico.jsx';
import OpcionesNavegacion from './OpcionesNavegacion.jsx';
import OpcionesAUD from './OpcionesAUD.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { puntosOrdenados, puntoActivo } from '../../utils/puntos.js';
import { estiloArchivo, guardarEnDisco } from '../../utils/archivos.js';
import '../../styles/widgets/PuntoSesion.css';

export default function PuntoSesion() {
  const { PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, sesionFinalizada, listaCerrada, descargarArchivo, cargando, error } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId } = useUI();
  const [errorAccion, setErrorAccion] = useState(null);

  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO);
  const activo = puntoActivo(items, puntoSesionSeleccionadoId);

  async function descargar(archivo) {
    setErrorAccion(null);
    try {
      const { nombre, blob } = await descargarArchivo(archivo.id);
      guardarEnDisco(nombre, blob);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo descargar el archivo.');
    }
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
        <div className="widget-punto-sesion-columnas">
          <div className="widget-punto-sesion-columna widget-punto-sesion-principal">
            <span className="widget-punto-sesion-label">{esInforme ? 'Informe' : 'Punto de acuerdo'}</span>
            <div className="widget-punto-sesion-contenido">{punto.contenido || 'Sin contenido'}</div>
            {!esInforme && !punto.fijo && (
              <div className="widget-punto-sesion-bloque-acuerdo">
                <span className="widget-punto-sesion-label">Acuerdo</span>
                <div className="widget-punto-sesion-acuerdo">{punto.acuerdo || 'Sin acuerdo'}</div>
              </div>
            )}
          </div>
          {punto.archivos.length > 0 && (
            <div className="widget-punto-sesion-columna widget-punto-sesion-archivos">
              {punto.archivos.map((a, i) => {
                const { icono, tono } = estiloArchivo(a.nombre);
                return (
                  <BadgeDinamico
                    key={a.id ?? i}
                    texto={a.nombre}
                    icono={icono}
                    tono={tono}
                    onClick={a.id ? () => descargar(a) : undefined}
                  />
                );
              })}
            </div>
          )}
        </div>
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
