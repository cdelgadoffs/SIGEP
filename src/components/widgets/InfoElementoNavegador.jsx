import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { carpetasDeSesion } from '../../utils/arbolArchivos.js';
import { formatoTamano } from '../../utils/correos.js';
import { encabezadoSesion } from '../../utils/sesiones.js';
import { tituloPunto } from '../../utils/puntos.js';
import HistorialPunto from './HistorialPunto.jsx';
import '../../styles/widgets/InfoElementoNavegador.css';

const ESTADOS = { celebrada: 'Celebrada', proxima: 'Próxima', pendiente: 'Pendiente', 'no-celebrada': 'No celebrada' };

function fechaLarga(iso) {
  return iso ? new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
}

function Dato({ etiqueta, valor }) {
  if (valor === null || valor === undefined || valor === '') return null;
  return (
    <div className="widget-info-navegador-dato">
      <span className="widget-info-navegador-etiqueta">{etiqueta}</span>
      <span className="widget-info-navegador-valor">{valor}</span>
    </div>
  );
}

export default function InfoElementoNavegador() {
  const { sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO, PUNTOS, REMITENTES } = useProyecto();
  const { elementoNavegador } = useUI();
  const seleccion = elementoNavegador && elementoNavegador.sesionId === (sesionSeleccionada?.id ?? null) ? elementoNavegador : null;

  if (!sesionSeleccionada) return <div className="widget-info-navegador"><p className="widget-info-navegador-vacio">Selecciona una sesión.</p></div>;

  if (!seleccion) {
    const carpetas = carpetasDeSesion(PUNTOS, sesionSeleccionada, FECHAS_SESIONES, SECCIONES_DOCUMENTO);
    const archivos = carpetas.reduce((n, c) => n + c.archivos.length, 0);
    const encabezado = encabezadoSesion(sesionSeleccionada);
    return (
      <div className="widget-info-navegador">
        <div className="widget-info-navegador-nombre">{encabezado.titulo}</div>
        <Dato etiqueta="Fecha" valor={encabezado.subtitulo} />
        <Dato etiqueta="Estado" valor={ESTADOS[sesionSeleccionada.estado] ?? sesionSeleccionada.estado} />
        <Dato etiqueta="Carpetas" valor={carpetas.length} />
        <Dato etiqueta="Archivos" valor={archivos} />
        <p className="widget-info-navegador-ayuda">Selecciona una carpeta o un archivo para ver sus detalles.</p>
      </div>
    );
  }

  const punto = PUNTOS.find((p) => p.id === seleccion.puntoId);
  const remitente = punto ? (REMITENTES.find((r) => r.id === punto.remitente)?.nombre ?? punto.remitente) : null;
  const seccion = punto ? SECCIONES_DOCUMENTO.find((s) => s.id === punto.seccion)?.nombre : null;
  const esCarpeta = seleccion.tipo === 'carpeta';

  return (
    <div className="widget-info-navegador">
      <div className="widget-info-navegador-cabecera">
        <i className={`${seleccion.icono} widget-info-navegador-icono widget-info-navegador-icono-${seleccion.tono}`}></i>
        <div className="widget-info-navegador-nombre">{seleccion.nombre}</div>
      </div>
      <Dato etiqueta="Tipo" valor={esCarpeta ? 'Carpeta' : seleccion.extension ? `Archivo ${seleccion.extension.slice(1).toUpperCase()}` : 'Archivo'} />
      {esCarpeta
        ? <Dato etiqueta="Contiene" valor={`${seleccion.cantidad} ${seleccion.cantidad === 1 ? 'elemento' : 'elementos'}`} />
        : <Dato etiqueta="Tamaño" valor={seleccion.tamano ? formatoTamano(seleccion.tamano) : null} />}
      {!esCarpeta && <Dato etiqueta="Fecha" valor={fechaLarga(seleccion.fecha)} />}
      <Dato etiqueta="Ubicación" valor={seleccion.ubicacion} />
      {punto && !punto.fijo && <Dato etiqueta="Punto" valor={tituloPunto(punto.numero)} />}
      <Dato etiqueta="Sección" valor={seccion} />
      <Dato etiqueta="Remitente" valor={punto && !punto.fijo ? remitente : null} />
      {punto && !punto.fijo && (
        <>
          <hr className="widget-info-navegador-separador" />
          <HistorialPunto puntoId={punto.id} />
        </>
      )}
    </div>
  );
}
