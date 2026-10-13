import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import '../../styles/widgets/AtenuadorPantalla.css';

export default function AtenuadorPantalla() {
  const { brilloPantalla } = useAjustesVisuales();
  if (brilloPantalla === 0) return null;
  return <div className="widget-atenuador-pantalla" style={{ background: `rgba(0, 0, 0, ${brilloPantalla / 100})` }} aria-hidden="true" />;
}
