const wrapStyle = {
  background: 'var(--color-surface)',
  border: '2px dashed var(--color-border)',
  borderRadius: 'var(--radius-lg)',
  padding: '60px 24px',
  textAlign: 'center',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '12px',
};

const iconStyle = {
  width: 56,
  height: 56,
  borderRadius: '50%',
  background: 'var(--color-bg-alt)',
  display: 'grid',
  placeItems: 'center',
  color: 'var(--color-text-light)',
};

export default function EmptyState({ titulo = 'Sin resultados', mensaje, icono }) {
  return (
    <div style={wrapStyle}>
      <div style={iconStyle}>
        {icono || (
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        )}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--color-text)' }}>
        {titulo}
      </h3>
      {mensaje && (
        <p style={{ fontSize: 14, color: 'var(--color-text-muted)', maxWidth: 360 }}>
          {mensaje}
        </p>
      )}
    </div>
  );
}