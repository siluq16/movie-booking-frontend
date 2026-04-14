import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { cinemaService } from '../../services/movieService'
import Spinner from '../../components/common/Spinner'

const MOCK = [
  { id: 1, name: 'CineMax Landmark', address: 'Tầng 5, 72 Tôn Thất Thuyết', city: 'Hà Nội', district: 'Cầu Giấy', phone: '19001234', email: 'landmark@cinemax.vn', openTime: '09:00', closeTime: '23:30', isActive: true, totalRooms: 6, totalSeats: 850 },
  { id: 2, name: 'CineMax Royal City', address: 'Tầng B2, Royal City, 72A Nguyễn Trãi', city: 'Hà Nội', district: 'Thanh Xuân', phone: '19001235', email: 'royal@cinemax.vn', openTime: '09:00', closeTime: '23:00', isActive: true, totalRooms: 8, totalSeats: 1100 },
  { id: 3, name: 'CineMax Times City', address: 'Tầng 3, Times City, 458 Minh Khai', city: 'Hà Nội', district: 'Hai Bà Trưng', phone: '19001236', email: 'timescity@cinemax.vn', openTime: '09:30', closeTime: '23:30', isActive: true, totalRooms: 5, totalSeats: 700 },
  { id: 4, name: 'CineMax Vincom Bà Triệu', address: 'Tầng 4, Vincom Bà Triệu, 191 Bà Triệu', city: 'Hà Nội', district: 'Hai Bà Trưng', phone: '19001237', email: 'batrieur@cinemax.vn', openTime: '09:00', closeTime: '22:30', isActive: false, totalRooms: 4, totalSeats: 500 },
]

const ROOMS_MOCK = {
  1: [
    { id: 1, name: 'IMAX Hall',  roomType: 'IMAX', totalSeats: 200, isActive: true },
    { id: 2, name: 'Phòng 4DX',  roomType: '4DX',  totalSeats: 60,  isActive: true },
    { id: 3, name: 'Phòng 3D-1', roomType: '3D',   totalSeats: 120, isActive: true },
    { id: 4, name: 'Phòng 3D-2', roomType: '3D',   totalSeats: 120, isActive: true },
    { id: 5, name: 'Phòng 2D-1', roomType: '2D',   totalSeats: 150, isActive: true },
    { id: 6, name: 'Phòng 2D-2', roomType: '2D',   totalSeats: 200, isActive: false },
  ]
}

const TYPE_STYLE = {
  IMAX: { bg: 'rgba(26,107,181,.15)', color: '#4a9fd0', border: 'rgba(26,107,181,.3)' },
  '4DX': { bg: 'rgba(139,58,139,.15)', color: '#c070c0', border: 'rgba(139,58,139,.3)' },
  '3D':  { bg: 'rgba(42,122,79,.15)', color: '#52c97c', border: 'rgba(42,122,79,.3)' },
  '2D':  { bg: 'rgba(90,88,80,.15)',  color: '#9e9a8e', border: 'rgba(90,88,80,.3)' },
  Dolby: { bg: 'rgba(181,74,26,.15)', color: '#e07a42', border: 'rgba(181,74,26,.3)' },
}

function RoomCard({ room }) {
  const s = TYPE_STYLE[room.roomType] || TYPE_STYLE['2D']
  return (
    <div style={{ background: 'var(--bg-card2)', border: `1px solid ${s.border}`, borderRadius: 8, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 6, background: s.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>🎬</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-pri)', marginBottom: 3 }}>{room.name}</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, padding: '1px 7px', borderRadius: 2, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontWeight: 600, letterSpacing: .5 }}>{room.roomType}</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{room.totalSeats} ghế</span>
        </div>
      </div>
      {!room.isActive && <span style={{ fontSize: 10, color: 'var(--text-muted)', background: 'var(--bg-card)', border: '1px solid var(--border)', padding: '2px 8px', borderRadius: 2 }}>Tạm đóng</span>}
    </div>
  )
}

export default function CinemasPage() {
  const navigate = useNavigate()
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [cityFilter, setCityFilter] = useState('all')

  useEffect(() => {
    cinemaService.getAll()
      .then(r => setCinemas(r.data))
      .catch(() => setCinemas(MOCK))
      .finally(() => setLoading(false))
  }, [])

  const cities = ['all', ...new Set(cinemas.map(c => c.city))]
  const filtered = cinemas.filter(c => cityFilter === 'all' || c.city === cityFilter)

  return (
    <>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, var(--bg-card) 0%, var(--bg-deep) 100%)', borderBottom: '1px solid var(--border)', padding: '60px 5% 48px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ fontSize: 11, color: 'var(--gold)', letterSpacing: 3, marginBottom: 12 }}>HỆ THỐNG RẠP</div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(28px,4vw,44px)', marginBottom: 12 }}>
            Tìm Rạp <span style={{ color: 'var(--gold)' }}>Gần Bạn</span>
          </h1>
          <p style={{ color: 'var(--text-sec)', fontSize: 15, maxWidth: 500 }}>
            Hệ thống {cinemas.length} rạp chiếu phim hiện đại trải dài toàn quốc với công nghệ âm thanh và hình ảnh đỉnh cao.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 5% 80px' }}>
        {/* City filter */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 36, flexWrap: 'wrap' }}>
          {cities.map(city => (
            <button key={city} onClick={() => setCityFilter(city)} style={{ background: cityFilter === city ? 'var(--gold)' : 'var(--bg-card)', border: `1px solid ${cityFilter === city ? 'var(--gold)' : 'var(--border)'}`, color: cityFilter === city ? '#000' : 'var(--text-sec)', padding: '8px 20px', borderRadius: 20, cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans', sans-serif", fontWeight: cityFilter === city ? 500 : 400, transition: '.2s' }}>
              {city === 'all' ? 'Tất cả' : city}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {filtered.map(cinema => (
              <div key={cinema.id} style={{ background: 'var(--bg-card)', border: `1px solid ${expanded === cinema.id ? 'var(--border-gold)' : 'var(--border)'}`, borderRadius: 12, overflow: 'hidden', transition: 'border-color .2s' }}>
                {/* Cinema header */}
                <div style={{ padding: '24px 28px', display: 'flex', alignItems: 'center', gap: 20, cursor: 'pointer', flexWrap: 'wrap' }}
                  onClick={() => setExpanded(expanded === cinema.id ? null : cinema.id)}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: 'rgba(201,168,76,.1)', border: '1px solid var(--border-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏛️</div>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                      <span style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-pri)' }}>{cinema.name}</span>
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 2, ...(cinema.isActive ? { background: 'rgba(82,201,124,.15)', color: 'var(--green)' } : { background: 'rgba(90,88,80,.15)', color: 'var(--text-muted)' }) }}>
                        {cinema.isActive ? 'Đang hoạt động' : 'Tạm đóng'}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-sec)' }}>📍 {cinema.address}, {cinema.district && cinema.district + ', '}{cinema.city}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 24, flexShrink: 0, flexWrap: 'wrap' }}>
                    {[['📞', cinema.phone], ['🕐', `${cinema.openTime || '09:00'} – ${cinema.closeTime || '23:30'}`]].filter(([, v]) => v).map(([icon, val]) => (
                      <div key={icon} style={{ fontSize: 13, color: 'var(--text-sec)', display: 'flex', alignItems: 'center', gap: 6 }}>
                        {icon} {val}
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 10 }}>
                      {cinema.isActive && (
                        <button onClick={e => { e.stopPropagation(); navigate('/') }} style={{ background: 'var(--gold)', color: '#000', border: 'none', padding: '8px 18px', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: "'DM Sans', sans-serif" }}>
                          Đặt vé
                        </button>
                      )}
                      <div style={{ width: 32, height: 32, borderRadius: 4, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: 12, transition: '.2s', transform: expanded === cinema.id ? 'rotate(180deg)' : 'none' }}>▼</div>
                    </div>
                  </div>
                </div>

                {/* Expanded: room list */}
                {expanded === cinema.id && (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '20px 28px', animation: 'fadeIn .2s ease' }}>
                    <div style={{ fontSize: 13, color: 'var(--text-sec)', marginBottom: 14, letterSpacing: .5 }}>PHÒNG CHIẾU</div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                      {(ROOMS_MOCK[cinema.id] || [
                        { id: 99, name: 'Phòng 2D-1', roomType: '2D', totalSeats: 120, isActive: true },
                        { id: 100, name: 'Phòng 3D-1', roomType: '3D', totalSeats: 100, isActive: true },
                      ]).map(room => <RoomCard key={room.id} room={room} />)}
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginTop: 16, flexWrap: 'wrap' }}>
                      {cinema.email && <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>✉️ {cinema.email}</span>}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
