import { formatCurrency } from '../../utils/formatters'

const SEAT_STYLES = {
  standard: { bg: 'var(--bg-card2)', border: 'var(--border)', color: 'var(--text-muted)' },
  vip:      { bg: 'rgba(201,168,76,.08)', border: 'rgba(201,168,76,.35)', color: 'var(--gold)' },
  couple:   { bg: 'rgba(130,100,200,.08)', border: 'rgba(130,100,200,.35)', color: '#a07ad0' },
  recliner: { bg: 'rgba(30,120,180,.08)', border: 'rgba(30,120,180,.35)', color: '#4a9fd0' },
  sweetbox: { bg: 'rgba(200,60,120,.08)', border: 'rgba(200,60,120,.35)', color: '#d06090' },
}

export default function Seat({ seat, selected, onClick }) {
  const style = SEAT_STYLES[seat.seatType] || SEAT_STYLES.standard
  const isCouple = seat.seatType === 'couple'

  if (seat.isBooked) {
    return (
      <div title="Đã đặt" style={{
        width: isCouple ? 76 : 34, height: 30, borderRadius: '4px 4px 2px 2px',
        background: '#1e1212', border: '1px solid #3a2222',
        cursor: 'not-allowed', opacity: .5
      }} />
    )
  }

  return (
    <div
      onClick={() => onClick(seat)}
      title={`${seat.rowLabel}${seat.seatNumber} · ${seat.seatType} · ${formatCurrency(seat.price)}`}
      style={{
        width: isCouple ? 76 : 34, height: 30,
        borderRadius: '4px 4px 2px 2px',
        background: selected ? 'var(--gold)' : style.bg,
        border: `1px solid ${selected ? 'var(--gold-light)' : style.border}`,
        cursor: 'pointer', transition: 'all .12s',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 9, color: selected ? '#000' : style.color,
        fontWeight: selected ? 600 : 400,
      }}
      onMouseEnter={e => { if (!selected) { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' } }}
      onMouseLeave={e => { if (!selected) { e.currentTarget.style.borderColor = style.border; e.currentTarget.style.color = style.color } }}
    >
      {isCouple ? `${seat.rowLabel}${seat.seatNumber - 1}-${seat.seatNumber}` : ''}
    </div>
  )
}
