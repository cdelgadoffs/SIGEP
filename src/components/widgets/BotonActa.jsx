import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import '../../styles/widgets/BotonActa.css';

export default function BotonActa({ arriba }) {
  const { cambiarAjuste } = useAjustesVisuales();
  return (
    <button
      type="button"
      className="widget-boton-acta"
      style={{ top: arriba, height: `calc(100vh - ${arriba}px)` }}
      onClick={() => cambiarAjuste('actaPlegada', false)}
      aria-label="Mostrar el acta"
    >
      <i className="ri-arrow-left-s-line"></i>
      <span>Acta</span>
    </button>
  );
}
