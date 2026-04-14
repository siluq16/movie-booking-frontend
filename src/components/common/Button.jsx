export default function Button({
  children, onClick, type = 'button', variant = 'primary',
  size = 'md', disabled = false, loading = false, fullWidth = false, className = ''
}) {
  const base = `inline-flex items-center justify-center gap-2 font-sans font-medium transition-all duration-200 rounded cursor-pointer border select-none`

  const variants = {
    primary: 'bg-gold text-black border-gold hover:bg-gold-light active:scale-95',
    ghost:   'bg-transparent text-[var(--text-pri)] border-[rgba(255,255,255,0.2)] hover:border-gold hover:text-gold',
    outline: 'bg-transparent text-gold border-gold hover:bg-[rgba(201,168,76,0.1)]',
    danger:  'bg-[var(--red)] text-white border-[var(--red)] hover:opacity-90 active:scale-95',
    subtle:  'bg-[var(--bg-card2)] text-[var(--text-sec)] border-[var(--border)] hover:text-[var(--text-pri)] hover:border-[var(--border-gold)]',
  }

  const sizes = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-5 py-2.5',
    lg: 'text-base px-8 py-3.5',
  }

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        ${base} ${variants[variant]} ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}
        ${className}
      `}
    >
      {loading && (
        <span style={{
          width: 14, height: 14, borderRadius: '50%',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTopColor: 'currentColor',
          animation: 'spin .7s linear infinite',
          flexShrink: 0
        }} />
      )}
      {children}
    </button>
  )
}
