export default function Spinner({ size = 'md', color = 'gold' }) {
  const s = { sm: 16, md: 24, lg: 40 }[size]
  const c = color === 'gold' ? 'var(--gold)' : color
  return (
    <div style={{
      width: s, height: s, borderRadius: '50%',
      border: `2px solid var(--border)`,
      borderTopColor: c,
      animation: 'spin .7s linear infinite',
    }} />
  )
}
