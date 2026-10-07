import { useState } from 'react';
import CampoTexto from '../../base/CampoTexto.jsx';
import BotonIcono from '../../base/BotonIcono.jsx';
import BadgeDinamico from '../../base/BadgeDinamico.jsx';
import { esCorreoValido } from '../../../utils/correos.js';
import '../../../styles/widgets/panelcontrol/CampoCorreos.css';

export default function CampoCorreos({ etiqueta, valores, onAgregar, onQuitar, vacio = 'Ninguno agregado' }) {
  const [texto, setTexto] = useState('');
  const [error, setError] = useState(null);

  function agregar() {
    const correo = texto.trim();
    if (!correo) return;
    if (!esCorreoValido(correo)) {
      setError('Escribe un correo válido.');
      return;
    }
    setError(null);
    if (!valores.some((v) => v.toLowerCase() === correo.toLowerCase())) onAgregar(correo);
    setTexto('');
  }

  return (
    <div className="widget-campo-correos">
      {etiqueta && <span className="widget-campo-correos-etiqueta">{etiqueta}</span>}
      <div className="widget-campo-correos-entrada">
        <CampoTexto
          variant="claro"
          type="email"
          value={texto}
          onChange={(v) => { setTexto(v); setError(null); }}
          onEnter={agregar}
          placeholder="correo@ejemplo.com"
          ariaLabel={etiqueta ?? 'Correo'}
        />
        <BotonIcono icono="ri-add-line" ariaLabel="Agregar correo" onClick={agregar} />
      </div>
      {error && <span className="widget-campo-correos-error">{error}</span>}
      <div className="widget-campo-correos-chips">
        {valores.length === 0
          ? <span className="widget-campo-correos-vacio">{vacio}</span>
          : valores.map((v) => <BadgeDinamico key={v} texto={v} tono="azul" onEliminar={() => onQuitar(v)} />)}
      </div>
    </div>
  );
}
