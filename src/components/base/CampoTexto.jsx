import '../../styles/base/CampoTexto.css';

export default function CampoTexto({ value, onChange, onEnter, placeholder, type = 'text', variant = 'oscuro', disabled, ariaLabel }) {
  return (
    <input
      type={type}
      className={'base-campo-texto' + (variant === 'claro' ? ' base-campo-texto-claro' : '')}
      value={value}
      placeholder={placeholder}
      disabled={disabled}
      aria-label={ariaLabel}
      onChange={(e) => onChange(e.target.value)}
      onKeyDown={onEnter ? (e) => { if (e.key === 'Enter') { e.preventDefault(); onEnter(); } } : undefined}
    />
  );
}
