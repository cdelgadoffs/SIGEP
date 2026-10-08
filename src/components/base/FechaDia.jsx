import { useState } from 'react';
import '../../styles/base/FechaDia.css';

export default function FechaDia() {
  const [fechaTexto] = useState(() => {
    const opciones = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    return new Date().toLocaleDateString('es-ES', opciones);
  });

  return <span className="base-fecha-dia">{fechaTexto}</span>;
}
