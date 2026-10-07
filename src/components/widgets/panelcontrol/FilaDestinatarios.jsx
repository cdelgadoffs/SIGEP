import { useState } from 'react';
import ListaExpandible from '../../base/ListaExpandible.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import { esCorreoValido } from '../../../utils/correos.js';
import '../../../styles/widgets/panelcontrol/FilaDestinatarios.css';

export default function FilaDestinatarios({ etiqueta, opciones, onElegir, valores, onAgregar, onQuitar, children }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState(null);

  function confirmar() {
    const correo = texto.trim().replace(/[;,]$/, '');
    if (!correo) return;
    if (!esCorreoValido(correo)) {
      setError(`"${correo}" no es un correo válido.`);
      return;
    }
    setError(null);
    onAgregar(correo);
    setTexto('');
  }

  function teclear(e) {
    if (e.key === 'Enter' || e.key === ';' || e.key === ',') {
      e.preventDefault();
      confirmar();
    } else if (e.key === 'Backspace' && texto === '' && valores.length > 0) {
      onQuitar(valores[valores.length - 1]);
    }
  }

  return (
    <div className="widget-fila-destinatarios">
      <div className="widget-fila-destinatarios-selector">
        <ListaExpandible valorActual="" etiquetaActual={etiqueta} opciones={opciones} onSeleccionar={onElegir} />
      </div>
      <div className="widget-fila-destinatarios-campo">
        {valores.map((v) => <BadgeDinamico key={v} texto={v} tono="azul" onEliminar={() => onQuitar(v)} />)}
        <input
          type="text"
          className="widget-fila-destinatarios-entrada"
          value={texto}
          onChange={(e) => { setTexto(e.target.value); setError(null); }}
          onKeyDown={teclear}
          onBlur={() => { if (texto.trim()) confirmar(); }}
          aria-label={etiqueta}
        />
      </div>
      {children}
      {error && <span className="widget-fila-destinatarios-error">{error}</span>}
    </div>
  );
}
