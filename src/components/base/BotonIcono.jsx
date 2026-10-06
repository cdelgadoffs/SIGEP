import '../../styles/base/BotonIcono.css';

export default function BotonIcono({ icono, onClick, ariaLabel, disabled, sinRobarFoco, children }) {
  return (
    <button
      type="button"
      className="base-boton-icono"
      onClick={onClick}
      onMouseDown={sinRobarFoco ? (e) => e.preventDefault() : undefined}
      aria-label={ariaLabel}
      title={ariaLabel}
      disabled={disabled}
    >
      {children ?? <i className={icono}></i>}
    </button>
  );
}
