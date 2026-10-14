import { useState } from 'react';
import BotonIcono from '../base/BotonIcono.jsx';
import BotonS from '../base/BotonS.jsx';
import ListaExpandible from '../base/ListaExpandible.jsx';
import Modal from '../base/Modal.jsx';
import BotonDescargarActa from './BotonDescargarActa.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { bloquesDeSesion } from '../../utils/actaSesion.js';
import { encabezadoSesion, hayActaVisible } from '../../utils/sesiones.js';
import '../../styles/widgets/EncabezadoActa.css';

const TODO_EL_ACTA = 'todo';

export default function EncabezadoActa() {
  const { puedeEscribir } = useAuth();
  const { sesionSeleccionada, PUNTOS, SECCIONES_DOCUMENTO, REMITENTES } = useProyecto();
  const { actaEditandoDe, setActaEditandoDe, actaEstadoGuardado, actaPuntoFiltrado, setActaPuntoFiltrado } = useUI();
  const [confirmando, setConfirmando] = useState(false);

  if (!hayActaVisible(sesionSeleccionada, puedeEscribir)) return null;

  const sesionId = sesionSeleccionada.id;
  const editando = actaEditandoDe === sesionId;
  const encabezado = encabezadoSesion(sesionSeleccionada);
  const editados = sesionSeleccionada.actaBloques ?? {};
  const bloques = bloquesDeSesion({ sesion: sesionSeleccionada, puntos: PUNTOS, secciones: SECCIONES_DOCUMENTO });
  const totalEditados = bloques.filter((b) => editados[b.clave]).length;
  const opcionesPunto = bloques
    .filter((b) => b.identificador)
    .map((b) => {
      const codigo = b.identificador.replace(/\.-\s*$/, '');
      const remitenteId = PUNTOS.find((p) => p.id === b.puntoId)?.remitente;
      const remitente = REMITENTES.find((r) => r.id === remitenteId)?.nombre ?? remitenteId;
      return {
        id: b.puntoId,
        codigo,
        label: <><strong>{codigo}</strong> · {b.texto.replace(/\s+/g, ' ').trim()}</>,
        title: remitente ? `Remitente: ${remitente}` : undefined,
      };
    });

  const filtrado = opcionesPunto.find((o) => o.id === actaPuntoFiltrado);
  const opciones = [{ id: TODO_EL_ACTA, label: 'Acta completa' }, ...opcionesPunto];

  return (
    <div className="widget-encabezado-acta">
      <div className="widget-encabezado-acta-titulos">
        <span className="widget-encabezado-acta-subtitulo">{encabezado.titulo} · {encabezado.subtitulo}</span>
        <span className={'widget-encabezado-acta-estado' + (totalEditados > 0 ? ' widget-encabezado-acta-estado-editada' : '')}>
          {totalEditados === 0 ? 'Generada automáticamente' : `Editada · ${totalEditados} ${totalEditados === 1 ? 'bloque' : 'bloques'}`}
          {filtrado && ' · Solo un punto'}
          {editando && actaEstadoGuardado === 'guardando' && ' · Guardando…'}
          {editando && actaEstadoGuardado === 'guardado' && ' · Guardado'}
        </span>
      </div>
      <div className="widget-encabezado-acta-acciones">
        {editando
          ? <BotonIcono icono="ri-check-line" ariaLabel="Terminar edición" onClick={() => setActaEditandoDe(null)} />
          : <BotonIcono icono="ri-pencil-line" ariaLabel="Editar el acta" onClick={() => setConfirmando(true)} disabled={bloques.length === 0} />}
        {opcionesPunto.length > 0 && (
          <ListaExpandible
            valorActual={filtrado ? filtrado.id : TODO_EL_ACTA}
            etiquetaActual={filtrado ? filtrado.codigo : 'Ir a punto'}
            opciones={opciones}
            unaLinea
            alinearDerecha
            onSeleccionar={(id) => setActaPuntoFiltrado(id === TODO_EL_ACTA ? null : id)}
          />
        )}
        <BotonDescargarActa />
      </div>
      <Modal abierto={confirmando} titulo="Editar el acta" onCerrar={() => setConfirmando(false)}>
        <p className="widget-encabezado-acta-mensaje">Los cambios se guardan de inmediato y esa será la versión que se descargue, en los bloques que edites. Los demás bloques se siguen generando solos.</p>
        <div className="widget-encabezado-acta-modal-acciones">
          <BotonS variant="claro" onClick={() => setConfirmando(false)}>Cancelar</BotonS>
          <BotonS variant="claro" onClick={() => { setConfirmando(false); setActaEditandoDe(sesionId); }}>Editar</BotonS>
        </div>
      </Modal>
    </div>
  );
}
