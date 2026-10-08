import ListaExpandible from '../base/ListaExpandible.jsx';
import { useAjustesVisuales } from '../../context/AjustesVisualesContext.jsx';
import '../../styles/widgets/FiltroReciclaje.css';

const OPCIONES = [
  { id: 'todos', label: 'Todos los puntos' },
  { id: 'pendiente', label: 'Puntos pendientes' },
  { id: 'eliminado', label: 'Puntos eliminados' },
];

export default function FiltroReciclaje() {
  const { filtroReciclaje, cambiarAjuste } = useAjustesVisuales();
  const actual = OPCIONES.find((o) => o.id === filtroReciclaje) ?? OPCIONES[0];
  return (
    <div className="widget-filtro-reciclaje">
      <ListaExpandible
        valorActual={actual.id}
        etiquetaActual={actual.label}
        opciones={OPCIONES}
        onSeleccionar={(id) => cambiarAjuste('filtroReciclaje', id)}
      />
    </div>
  );
}
