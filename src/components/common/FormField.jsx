// FormField: wrapper hiển thị label + error inline bên dưới
export default function FormField({ label, error, required, children, hint }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 4 }}>
          {label}
          {required && <span style={{ color: 'var(--red)', fontSize: 14, lineHeight: 1 }}>*</span>}
        </label>
      )}
      {children}
      {error  && <span style={{ fontSize: 11, color: 'var(--red)', display: 'flex', alignItems: 'center', gap: 4 }}>⚠ {error}</span>}
      {!error && hint && <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  )
}
