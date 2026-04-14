import { useNavigate } from 'react-router-dom'
import { formatDuration, formatRating } from '../../utils/formatters'

const STATUS_LABEL = { now_showing: 'ĐANG CHIẾU', coming_soon: 'SẮP CHIẾU', ended: 'ĐÃ KẾT THÚC' }
const STATUS_STYLE = {
  now_showing: { background: 'rgba(82,201,124,.15)', color: 'var(--green)', border: '1px solid rgba(82,201,124,.3)' },
  coming_soon: { background: 'rgba(201,168,76,.1)',  color: 'var(--gold)',  border: '1px solid var(--border-gold)' },
  ended:       { background: 'rgba(90,88,80,.2)',    color: 'var(--text-muted)', border: '1px solid var(--border)' },
}

export default function MovieCard({ movie, showBookBtn = true }) {
  const navigate = useNavigate()
  if (!movie) return null

  return (
    <div
      onClick={() => navigate(`/movies/${movie.id}`)}
      style={{
        cursor: 'pointer', borderRadius: 8, overflow: 'hidden',
        background: 'var(--bg-card)', border: '1px solid var(--border)',
        transition: 'transform .25s, border-color .25s', position: 'relative',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.transform = 'translateY(-5px)'
        e.currentTarget.style.borderColor = 'var(--border-gold)'
        e.currentTarget.querySelector('.movie-card-overlay').style.opacity = '1'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.querySelector('.movie-card-overlay').style.opacity = '0'
      }}
    >
      {/* Poster */}
      <div style={{ position: 'relative', aspectRatio: '2/3', background: 'var(--bg-card2)', overflow: 'hidden' }}>
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
            onError={e => { e.target.style.display = 'none' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 56 }}>🎬</div>
        )}

        {/* Age badge */}
        {movie.ageRating > 0 && (
          <div style={{
            position: 'absolute', top: 10, left: 10,
            background: 'rgba(224,82,82,.9)', color: '#fff',
            fontSize: 11, fontWeight: 600, padding: '2px 7px', borderRadius: 3
          }}>
            T{movie.ageRating}+
          </div>
        )}

        {/* Overlay */}
        <div className="movie-card-overlay" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to top, rgba(10,10,12,.98) 40%, transparent)',
          opacity: 0, transition: 'opacity .25s',
          display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', padding: 14
        }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
            {movie.genres?.slice(0, 2).map(g => (
              <span key={g} style={{
                background: 'rgba(201,168,76,.15)', border: '1px solid var(--border-gold)',
                color: 'var(--gold)', fontSize: 10, padding: '2px 8px', borderRadius: 2
              }}>{g}</span>
            ))}
          </div>
          {showBookBtn && movie.status === 'now_showing' && (
            <button
              onClick={e => { e.stopPropagation(); navigate(`/movies/${movie.id}`) }}
              style={{
                background: 'var(--gold)', color: '#000', border: 'none',
                padding: '9px 0', borderRadius: 4, fontSize: 13, fontWeight: 500,
                cursor: 'pointer', width: '100%', fontFamily: "'DM Sans', sans-serif"
              }}
            >
              Mua Vé
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div style={{ padding: '12px 14px' }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-pri)', marginBottom: 5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {movie.title}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--text-sec)' }}>{formatDuration(movie.durationMinutes)}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {movie.avgRating > 0 && (
              <span style={{ fontSize: 12, color: 'var(--gold)' }}>★ {formatRating(movie.avgRating)}</span>
            )}
            <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 2, ...STATUS_STYLE[movie.status] }}>
              {STATUS_LABEL[movie.status]}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
