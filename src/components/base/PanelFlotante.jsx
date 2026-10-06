import { createPortal } from 'react-dom';
import { useScrollbarPersonalizada } from '../../hooks/useScrollbarPersonalizada.js';
import '../../styles/base/PanelFlotante.css';

export default function PanelFlotante({ abierto = false, izquierda = 0, arriba = 52, ancho = 650, children }) {
  const { contenedorRef, thumb, onScroll, onArrastrarThumb } = useScrollbarPersonalizada();
  if (!abierto) return null;
  return createPortal(
    <div className="base-panel-flotante" style={{ left: izquierda, top: arriba, width: ancho }}>
      <div className="base-panel-flotante-scroll" ref={contenedorRef} onScroll={onScroll}>
        <div className="base-panel-flotante-columna">{children}</div>
      </div>
      {thumb.visible && (
        <div
          className="base-panel-flotante-scrollbar-thumb"
          style={{ height: thumb.alto, top: thumb.top }}
          onMouseDown={onArrastrarThumb}
        />
      )}
    </div>,
    document.body,
  );
}
