import Scrollbar from '../../base/Scrollbar.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import EditorTexto from '../EditorTexto.jsx';
import { useUI } from '../../../context/UIContext.jsx';
import { useCorreo } from '../../../context/CorreoContext.jsx';
import { estiloArchivo } from '../../../utils/archivos.js';
import { formatoFechaCompleta, formatoTamano } from '../../../utils/correos.js';
import { esDocVacio } from '../../../utils/documento.js';
import '../../../styles/widgets/panelcontrol/LecturaCorreo.css';

const sinCambios = () => {};

export default function LecturaCorreo() {
  const { CORREOS_ENVIADOS } = useCorreo();
  const { correoSeleccionadoId } = useUI();
  const correo = CORREOS_ENVIADOS.find((c) => c.id === correoSeleccionadoId);

  if (!correo) {
    return (
      <div className="widget-lectura-correo widget-lectura-correo-vacio">
        <i className="ri-mail-open-line"></i>
        <span>Selecciona un correo para leerlo</span>
      </div>
    );
  }

  const filas = [
    { etiqueta: 'Para', valores: correo.para },
    { etiqueta: 'CC', valores: correo.cc },
    { etiqueta: 'CCO', valores: correo.cco },
  ].filter((f) => f.valores.length > 0);

  return (
    <div className="widget-lectura-correo">
      <Scrollbar>
        <div className="widget-lectura-correo-contenido">
          <h2 className="widget-lectura-correo-asunto">{correo.asunto}</h2>
          <div className="widget-lectura-correo-meta">
            <span className="widget-lectura-correo-de">{correo.enviadoPor.nombre}</span>
            <span className="widget-lectura-correo-fecha">{formatoFechaCompleta(correo.enviadoEn)}</span>
          </div>
          <div className="widget-lectura-correo-destinos">
            {filas.map((f) => (
              <div key={f.etiqueta} className="widget-lectura-correo-destino">
                <span className="widget-lectura-correo-etiqueta">{f.etiqueta}</span>
                <span>{f.valores.join('; ')}</span>
              </div>
            ))}
          </div>
          {correo.adjuntos.length > 0 && (
            <div className="widget-lectura-correo-adjuntos">
              {correo.adjuntos.map((a, i) => {
                const { icono, tono } = estiloArchivo(a.nombre);
                return <BadgeDinamico key={`${a.nombre}-${i}`} texto={`${a.nombre} (${formatoTamano(a.tamano)})`} icono={icono} tono={tono} />;
              })}
            </div>
          )}
          <div className="widget-lectura-correo-cuerpo">
            {esDocVacio(correo.cuerpoDoc)
              ? 'Sin contenido'
              : <EditorTexto key={correo.id} value={correo.cuerpoDoc} onChange={sinCambios} soloLectura />}
          </div>
        </div>
      </Scrollbar>
    </div>
  );
}
