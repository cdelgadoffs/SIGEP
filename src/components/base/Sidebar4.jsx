import '../../styles/base/Sidebar4.css';

export default function Sidebar4({ abierto = false, onCerrar, mostrarCerrar = true, titulo = 'Esquema', arriba, encabezado, children }) {
  return (
    <aside
      className={'base-sidebar4' + (abierto ? ' base-sidebar4-open' : '')}
      style={arriba === undefined ? undefined : { top: arriba, height: `calc(100vh - ${arriba}px)` }}
    >
      <div className="base-sidebar4-header">
        <div className="base-sidebar4-header-top">
          <div className="base-sidebar4-title">{titulo}</div>
          {mostrarCerrar && (
            <button type="button" className="base-sidebar4-cerrar" aria-label="Cerrar panel" onClick={onCerrar}>✕</button>
          )}
        </div>
        {encabezado}
      </div>
      {children}
    </aside>
  );
}
