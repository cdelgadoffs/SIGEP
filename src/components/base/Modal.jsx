import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import '../../styles/base/Modal.css';

export default function Modal({ abierto, titulo, onCerrar, tamano = 'normal', acciones, children }) {
  useEffect(() => {
    if (!abierto) return;
    const alPulsar = (e) => {
      if (e.key === 'Escape') onCerrar();
    };
    document.addEventListener('keydown', alPulsar);
    return () => document.removeEventListener('keydown', alPulsar);
  }, [abierto, onCerrar]);

  if (!abierto) return null;

  return createPortal(
    <div
      className="base-modal-fondo"
      onClick={(e) => {
        e.stopPropagation();
        onCerrar();
      }}
    >
      <div
        className={'base-modal' + (tamano === 'completo' ? ' base-modal-completo' : '') + (tamano === 'documento' ? ' base-modal-documento' : '')}
        role="dialog"
        aria-modal="true"
        aria-label={titulo}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="base-modal-header">
          <div className="base-modal-titulo">{titulo}</div>
          <div className="base-modal-acciones">
            {acciones}
            <button type="button" className="base-modal-cerrar" aria-label="Cerrar" onClick={onCerrar}>✕</button>
          </div>
        </div>
        <div className="base-modal-cuerpo">{children}</div>
      </div>
    </div>,
    document.body
  );
}
