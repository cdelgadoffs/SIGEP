import { useEffect, useState } from 'react';
import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import Checkbox from '../base/Checkbox.jsx';
import Scrollbar from '../base/Scrollbar.jsx';
import BotonIcono from '../base/BotonIcono.jsx';
import VistaPreviaFlotante from './VistaPreviaFlotante.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI, ALTO_TOPBAR } from '../../context/UIContext.jsx';
import { puntosOrdenados, puntoActivo, tituloPunto } from '../../utils/puntos.js';
import { formDePunto } from '../../utils/plantillasActa.js';
import '../../styles/widgets/ListaPuntosSesion.css';

export default function ListaPuntosSesion() {
  const {
    PUNTOS, SECCIONES_DOCUMENTO, REMITENTES, PLANTILLAS_ACTA, TIPOS_BLOQUE_ACTA, TEXTOS_ACTA,
    sesionSeleccionada, sesionFinalizada, marcarPunto, cargando, error,
  } = useProyecto();
  const { puntoSesionSeleccionadoId, setPuntoSesionSeleccionadoId, vistaPreviaAbierta, setVistaPreviaAbierta } = useUI();
  const [errorAccion, setErrorAccion] = useState(null);
  const [guardandoId, setGuardandoId] = useState(null);

  const sesionComenzada = !!sesionSeleccionada?.horaInicio;

  function esPuntoConHoja(punto) {
    return !punto.fijo && !!SECCIONES_DOCUMENTO.find((s) => s.id === punto.seccion)?.requiereAcuerdo;
  }

  const items = puntosOrdenados(PUNTOS, SECCIONES_DOCUMENTO);
  const activo = puntoActivo(items, puntoSesionSeleccionadoId)?.punto;
  const activoId = activo?.id;
  const puntoVistaPrevia = vistaPreviaAbierta && !sesionComenzada && activo?.tratado && esPuntoConHoja(activo) ? activo : null;

  useEffect(() => {
    if (vistaPreviaAbierta && !puntoVistaPrevia) setVistaPreviaAbierta(false);
  }, [vistaPreviaAbierta, puntoVistaPrevia, setVistaPreviaAbierta]);

  useEffect(() => () => setVistaPreviaAbierta(false), [setVistaPreviaAbierta]);

  function alternarVistaPrevia(id) {
    if (vistaPreviaAbierta && activoId === id) {
      setVistaPreviaAbierta(false);
      return;
    }
    setPuntoSesionSeleccionadoId(id);
    setVistaPreviaAbierta(true);
  }

  async function marcar(id, tratado) {
    setPuntoSesionSeleccionadoId(id);
    setErrorAccion(null);
    setGuardandoId(id);
    try {
      await marcarPunto(id, tratado);
    } catch (e) {
      setErrorAccion(e.mensaje || 'No se pudo guardar la marca del punto.');
    } finally {
      setGuardandoId(null);
    }
  }

  const aviso = error ? `No se pudo cargar la información: ${error.mensaje}` : errorAccion;
  const vacio = items.length === 0
    ? (cargando ? 'Cargando…' : error ? null : 'Esta sesión no tiene puntos.')
    : null;

  return (
    <div className="widget-lista-puntos-sesion">
      <Scrollbar>
        <div className="widget-lista-puntos-sesion-contenido">
          {aviso && <div className="widget-lista-puntos-sesion-error">{aviso}</div>}
          {vacio && <div className="widget-lista-puntos-sesion-vacio">{vacio}</div>}
          {items.map(({ punto, titulo }) => (
            <BotonSeleccionableMenu
              key={punto.id}
              activo={punto.id === activoId}
              completado={!!punto.tratado}
              onClick={() => setPuntoSesionSeleccionadoId(punto.id)}
              accion={
                <span className="widget-lista-puntos-sesion-accion" onClick={(e) => e.stopPropagation()}>
                  <Checkbox
                    checked={!!punto.tratado}
                    disabled={sesionFinalizada || guardandoId === punto.id}
                    onChange={(valor) => marcar(punto.id, valor)}
                  />
                  {!sesionComenzada && !punto.fijo && (punto.tratado ? esPuntoConHoja(punto) : true) && (
                    <span className={'widget-lista-puntos-sesion-boton' + (vistaPreviaAbierta && punto.id === activoId ? ' widget-lista-puntos-sesion-boton-visible' : '')}>
                      {punto.tratado ? (
                        <BotonIcono
                          icono="ri-eye-line"
                          ariaLabel="Ver vista previa (solo lectura)"
                          onClick={() => alternarVistaPrevia(punto.id)}
                        />
                      ) : (
                        <BotonIcono icono="ri-close-line" ariaLabel="Retirar de la lista (próximamente)" disabled />
                      )}
                    </span>
                  )}
                </span>
              }
            >
              {titulo}
            </BotonSeleccionableMenu>
          ))}
        </div>
      </Scrollbar>
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
          engrose={puntoVistaPrevia.engrose}
          remitente={REMITENTES.find((r) => r.id === puntoVistaPrevia.remitente)?.nombre ?? puntoVistaPrevia.remitente}
          fecha={sesionSeleccionada?.id ?? ''}
          onCerrar={() => setVistaPreviaAbierta(false)}
        />
      )}
    </div>
  );
}
