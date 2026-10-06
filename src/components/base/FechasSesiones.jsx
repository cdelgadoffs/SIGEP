import '../../styles/base/FechasSesiones.css';

export default function FechasSesiones({ fechas = [], activaId, onSeleccionar, textoVacio }) {
  return (
    <div className="base-fechas-sesiones">
      {fechas.length === 0 && (
        <span className="base-fechas-sesiones-vacio">{textoVacio}</span>
      )}
      {fechas.map((f) => (
        <span
          key={f.id}
          className={
            'base-badge-fecha' +
            (f.estado ? ' base-badge-fecha-' + f.estado : '') +
            (f.pildora ? ' base-badge-fecha-pildora' : '') +
            (f.id === activaId ? ' base-badge-fecha-activa' : '')
          }
          onClick={() => onSeleccionar && onSeleccionar(f.id)}
        >
          {f.label}
        </span>
      ))}
    </div>
  );
}
