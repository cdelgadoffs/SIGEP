import ListaExpandible from '../base/ListaExpandible.jsx';
import { useUI } from '../../context/UIContext.jsx';
import '../../styles/widgets/FiltroReciclaje.css';

const OPCIONES = [{ id: 'todos', label: 'Todos los puntos' }];

export default function FiltroReciclaje() {
  const { filtroReciclaje, setFiltroReciclaje } = useUI();
  const actual = OPCIONES.find((o) => o.id === filtroReciclaje) ?? OPCIONES[0];
  return (
    <div className="widget-filtro-reciclaje">
      <ListaExpandible
        valorActual={actual.id}
        etiquetaActual={actual.label}
        opciones={OPCIONES}
        onSeleccionar={setFiltroReciclaje}
      />
    </div>
  );
}
