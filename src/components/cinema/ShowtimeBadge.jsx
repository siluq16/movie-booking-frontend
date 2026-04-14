import { formatTime } from '../../utils/formatters'

const FORMAT_COLOR = {
  IMAX_2D: '#1a6bb5', IMAX_3D: '#1a6bb5',
  '4DX': '#8B3A8B', '3D': '#2a7a4f', '2D': '#5a5850',
  Dolby: '#b54a1a',
}

export default function ShowtimeBadge({ showtime, selected, onClick }) {
  const isFull = showtime.seatsTaken >= showtime.totalSeats
  const fmtColor = FORMAT_COLOR[showtime.screenFormat] || '#5a5850'
  const avail = showtime.totalSeats - showtime.seatsTaken

  return (
    <button
      onClick={() => !isFull && onClick(showtime)}
      disabled={isFull}
      style={{
        position: 'relative', minWidth: 140,
        background: selected ? 'rgba(201,168,76,.12)' : 'var(--bg-card2)',
        border: `1px solid ${selected ? 'var(--gold)' : isFull ? 'var(--border)' : 'var(--border)'}`,
        borderRadius: 6, padding: '12px 16px', cursor: isFull ? 'not-allowed' : 'pointer',
        textAlign: 'center', transition: 'all .2s', opacity: isFull ? .5 : 1,
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => { if (!isFull && !selected) e.currentTarget.style.borderColor = 'var(--border-gold)' }}
      onMouseLeave={e => { if (!selected) e.currentTarget.style.borderColor = 'var(--border)' }}
    >
      {isFull && (
        <span style={{
          position: 'absolute', top: 0, right: 0,
          background: 'var(--red)', color: '#fff',
          fontSize: 9, padding: '2px 6px', borderRadius: '0 5px 0 4px', letterSpacing: .5
        }}>HẾT VÉ</span>
      )}
      <span style={{ display: 'block', fontSize: 18, fontWeight: 500, color: 'var(--text-pri)', marginBottom: 4 }}>
        {formatTime(showtime.startTime)}
      </span>
      <span style={{
        display: 'inline-block', fontSize: 10, letterSpacing: .8, fontWeight: 600,
        background: `${fmtColor}22`, color: fmtColor,
        border: `1px solid ${fmtColor}55`, padding: '2px 8px', borderRadius: 2, marginBottom: 6
      }}>
        {showtime.screenFormat}
      </span>
      <span style={{ display: 'block', fontSize: 11, color: isFull ? 'var(--red)' : avail <= 10 ? '#e07a42' : 'var(--text-muted)' }}>
        {isFull ? 'Hết vé' : `Còn ${avail} ghế`}
      </span>
    </button>
  )
}
