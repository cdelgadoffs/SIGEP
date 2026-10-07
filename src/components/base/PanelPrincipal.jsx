import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/PanelPrincipal.css';

export default function PanelPrincipal({ izquierda = 0, derecha = 0, arriba = 52, children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  return (
    <div className="base-panel-principal-wrap" style={{ left: izquierda, right: derecha, top: arriba, height: `calc(100vh - ${arriba}px)` }}>
      <main className="base-panel-principal" ref={contenedorRef} onScroll={onScroll}>
        {children}
      </main>
      {thumb.visible && (
        <div
          className="base-scrollbar-thumb"
          style={{ height: thumb.alto, top: thumb.top }}
          onMouseDown={onArrastrarThumb}
        />
      )}
    </div>
  );
}
