import React from 'react'

export default function Input({
  label, id, error, icon, type = 'text',
  className = '', style: styleProp = {}, onBlur, ...props
}) {
  const baseStyle = {
    width: '100%',
    background: 'var(--bg-card2)',
    border: `1px solid ${error ? 'var(--red)' : 'var(--border)'}`,
    borderRadius: 6,
    color: 'var(--text-pri)',
    padding: icon ? '10px 14px 10px 38px' : '10px 14px',
    fontSize: 14,
    fontFamily: "'DM Sans', sans-serif",
    outline: 'none',
    transition: 'border-color .2s',
    // Merge caller's style overrides (e.g. inputErr for validation highlight)
    ...styleProp,
  }

  return (
    <div className={className} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && (
        <label htmlFor={id} style={{ fontSize: 13, color: 'var(--text-sec)', letterSpacing: '.3px' }}>
          {label}
        </label>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
            color: 'var(--text-muted)', fontSize: 16, pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        <input
          id={id}
          type={type}
          style={baseStyle}
          onFocus={e => {
            if (!error) e.target.style.borderColor = 'var(--gold)'
          }}
          onBlur={e => {
            if (!error) e.target.style.borderColor = styleProp?.borderColor || 'var(--border)'
            if (onBlur) onBlur(e)
          }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: 12, color: 'var(--red)' }}>{error}</span>}
    </div>
  )
}
