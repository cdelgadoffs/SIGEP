import '../../styles/base/CampoTexto.css';

export default function CampoTexto({ value, onChange, onEnter, placeholder, type = 'text', disabled, ariaLabel }) {
  return (
    <input
      type={type}
      className="base-campo-texto"
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onEnter ? (e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } } : undefined}
    />
  );
}
