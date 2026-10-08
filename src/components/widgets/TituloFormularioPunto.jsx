import { useProyecto } from '../../context/ProyectoContext.jsx';
import { useUI } from '../../context/UIContext.jsx';
import { numeroSiguientePunto, tituloPunto } from '../../utils/puntos.js';
import '../../styles/widgets/TituloFormularioPunto.css';

export default function TituloFormularioPunto() {
  const { PUNTOS, SECCIONES_DOCUMENTO } = useProyecto();
  const { puntoEnEdicionId, seccionNuevoPunto, seccionFormulario } = useUI();
  const punto = puntoEnEdicionId ? PUNTOS.find((p) => p.id === puntoEnEdicionId) : null;
  const seccionId = seccionFormulario ?? punto?.seccion ?? seccionNuevoPunto;
  const seccion = SECCIONES_DOCUMENTO.find((s) => s.id === seccionId);
  const codigo = punto ? tituloPunto(punto.numero) : tituloPunto(numeroSiguientePunto(PUNTOS, SECCIONES_DOCUMENTO, seccionId));

  return (
    <span className="widget-titulo-formulario-punto">
      {punto ? 'Editar punto' : 'Nuevo punto'}
      {(codigo || seccion) && (
        <strong className="widget-titulo-formulario-punto-detalle">
          {[codigo, seccion?.nombre].filter(Boolean).join(' · ')}
        </strong>
      )}
    </span>
  );
}
