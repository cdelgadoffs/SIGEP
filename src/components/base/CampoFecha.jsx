import '../../styles/base/CampoFecha.css';

export default function CampoFecha({ value, onChange, min, max, disabled, ariaLabel }) {
  return (
    <input
      type="date"
      className="base-campo-fecha"
      value={value}
      min={min}
      max={max}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}
