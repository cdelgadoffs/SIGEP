import BotonSeleccionableMenu from '../base/BotonSeleccionableMenu.jsx';
import BotonAgregar from '../base/BotonAgregar.jsx';
import '../../styles/widgets/SubMenuDD.css';

export default function SubMenuDD({ items, activoId, onSeleccionar, onAgregar, iconoAgregar, subtitulo }) {
  return (
    <div className="widget-submenu-dd">
      {items.map((item) => (
        <BotonSeleccionableMenu
          key={item.id}
          variante="submenu"
          activo={item.id === activoId}
          badge={item.badge}
          accion={onAgregar && !item.sinAgregar && (
            <BotonAgregar onClick={() => onAgregar(item.id)}>{iconoAgregar}</BotonAgregar>
          )}
          onClick={() => onSeleccionar && onSeleccionar(item.id)}
        >
          {item.nombre}
        </BotonSeleccionableMenu>
      ))}
      {subtitulo && <div className="widget-submenu-dd-subtitulo">{subtitulo}</div>}
    </div>
  );
}
