const STEPS = ['Chọn ghế', 'Đồ ăn', 'Thanh toán']

export default function StepBar({ current }) {
  return (
    <div style={{
      position: 'sticky', top: 68, zIndex: 50,
      background: 'var(--bg-card)', borderBottom: '1px solid var(--border)',
      padding: '16px 5%'
    }}>
      <div style={{ maxWidth: 600, margin: '0 auto', display: 'flex', alignItems: 'center' }}>
        {STEPS.map((label, i) => {
          const isDone   = i < current
          const isActive = i === current
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flex: i < STEPS.length - 1 ? 1 : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 500,
                  background: isDone ? 'var(--green)' : isActive ? 'var(--gold)' : 'transparent',
                  border: `2px solid ${isDone ? 'var(--green)' : isActive ? 'var(--gold)' : 'var(--border)'}`,
                  color: isDone || isActive ? '#000' : 'var(--text-muted)',
                }}>
                  {isDone ? '✓' : i + 1}
                </div>
                <span style={{ fontSize: 13, color: isActive ? 'var(--gold)' : isDone ? 'var(--text-sec)' : 'var(--text-muted)' }}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div style={{ flex: 1, height: 1, background: isDone ? 'var(--green)' : 'var(--border)', margin: '0 12px' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
