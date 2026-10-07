import { useState } from 'react';
import '../../styles/base/CampoHora.css';

export default function CampoHora({ value, onChange, tono = 'verde', ariaLabel, disabled = false }) {
  const [editando, setEditando] = useState(false);
  const [texto, setTexto] = useState('');

  function iniciar() {
    setTexto('');
    setEditando(true);
  }

  function confirmar() {
    const digitos = texto.replace(/\D/g, '');
    if (digitos.length === 3 || digitos.length === 4) {
      const relleno = digitos.padStart(4, '0');
      const horas = relleno.slice(0, 2);
      const minutos = relleno.slice(2, 4);
      if (Number(horas) <= 23 && Number(minutos) <= 59) onChange(`${horas}:${minutos}`);
    }
    setEditando(false);
  }

  return (
    <input
      type="text"
      className={'base-campo-hora base-campo-hora-' + tono}
      value={editando ? texto : value}
      placeholder="hhmm"
      aria-label={ariaLabel}
      disabled={disabled}
      onFocus={iniciar}
      onChange={(e) => setTexto(e.target.value.replace(/\D/g, '').slice(0, 4))}
      onBlur={confirmar}
      onKeyDown={(e) => { if (e.key === 'Enter') e.target.blur(); }}
    />
  );
}
