import { useState, useEffect } from 'react'
import { showtimeService, movieService, roomService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { validate } from '../../utils/validation'
import { formatTime, formatDate } from '../../utils/formatters'
import toast from 'react-hot-toast'

const FORMATS = ['2D', '3D', 'IMAX', '4DX', 'Dolby', 'ScreenX']
const LANGS = [{ val: 'vi', label: 'Tiếng Việt' }, { val: 'en', label: 'Tiếng Anh' }, { val: 'ko', label: 'Tiếng Hàn' }, { val: 'ja', label: 'Tiếng Nhật' }]
const SUBS = [{ val: 'none', label: 'Không phụ đề' }, { val: 'vi', label: 'Phụ đề Việt' }, { val: 'en', label: 'Phụ đề Anh' }, { val: 'vi_en', label: 'Việt + Anh' }]
const FMT_COLOR = { IMAX: '#1a6bb5', '4DX': '#8B3A8B', '3D': '#2a7a4f', '2D': '#5a5850', Dolby: '#b54a1a', ScreenX: '#6c5ce7' }

const EMPTY = { movieId: '', cinemaId: '', roomId: '', startTime: '', language: '-', subtitleType: 'none', screenFormat: '-', notes: '' }
const ssBase = { width: '100%', background: 'var(--bg-card2)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', transition: 'border-color .2s' }

const ss = (err) => ({ ...ssBase, border: `1px solid ${err ? 'var(--red)' : 'var(--border)'}` })
const errStyle = { fontSize: 12, color: 'var(--red)', marginTop: 4, display: 'block' }

function valShowtime(f) {
  return validate({
    movieId: !f.movieId ? 'Vui lòng chọn phim' : null,
    cinemaId: !f.cinemaId ? 'Vui lòng chọn rạp chiếu' : null,
    roomId: !f.roomId ? 'Vui lòng chọn phòng chiếu' : null,
    startTime: !f.startTime ? 'Vui lòng chọn giờ chiếu'
      : new Date(f.startTime) <= new Date() ? 'Giờ chiếu phải là thời điểm trong tương lai' : null,
  })
}

const getMinDateTime = () => {
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  return now.toISOString().slice(0, 16);
};

export default function ManageShowtimes() {
  const [showtimes, setShowtimes] = useState([])
  const [movies, setMovies] = useState([])
  const [allRooms, setAllRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [cancelling, setCanc] = useState(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('active')
  const [page, setPage] = useState(1)
  const PAGE = 10

  const [filterCinema, setFilterCinema] = useState('')
  const [filterRoom, setFilterRoom] = useState('')
  const [filterDate, setFilterDate] = useState('')

  useEffect(() => {
    setFilterRoom('')
    setPage(1)
  }, [filterCinema])

  const activeRooms = allRooms.filter(r => r.isActive !== false);
  const uniqueCinemas = Array.from(new Map(activeRooms.map(r => [r.cinemaId, { id: r.cinemaId, name: r.cinemaName || `Rạp #${r.cinemaId}` }])).values());
  const filterRoomsList = filterCinema ? activeRooms.filter(r => String(r.cinemaId) === String(filterCinema)) : [];

  const load = () => { setLoading(true); Promise.allSettled([showtimeService.getAll(), movieService.getAll(), roomService.getAll()]).then(([st, mv, rm]) => { setShowtimes(st.status === 'fulfilled' ? (st.value.data || []) : []); setMovies(mv.status === 'fulfilled' ? (mv.value.data || []) : []); setAllRooms(rm.status === 'fulfilled' ? (rm.value.data || []) : []) }).finally(() => setLoading(false)) }
  useEffect(load, [])

  const setF = (f) => (e) => {
    const v = e.target.value;
    let nf = { ...form, [f]: v };

    if (f === 'cinemaId') {
      nf.roomId = '';
      nf.screenFormat = '-';
    }

    if (f === 'roomId' && v) {
      const selectedRoom = allRooms.find(r => String(r.id) === String(v));
      if (selectedRoom) {
        const matchedFormat = FORMATS.find(fmt => fmt === selectedRoom.roomType);
        if (matchedFormat) {
          nf.screenFormat = matchedFormat;
        } else if (selectedRoom.roomType === 'IMAX_2D' || selectedRoom.roomType === 'IMAX_3D') {
          nf.screenFormat = 'IMAX'; // Fallback an toàn nếu lỡ dính dữ liệu cũ
        }
      }
    }

    if (f === 'movieId' && v) {
      const selectedMovie = movies.find(m => String(m.id) === String(v));
      if (selectedMovie && selectedMovie.language) {
        const matchedLang = LANGS.find(l => l.val === selectedMovie.language);
        if (matchedLang) nf.language = matchedLang.val;
      }
    }

    setForm(nf);
    setErrors(p => ({ ...p, [f]: undefined })); // Tự xóa lỗi khi bắt đầu chọn lại
  };

  const handleBlur = (field) => () => {
    const { errors: currentErrors } = valShowtime(form);
    if (currentErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: currentErrors[field] }));
    }
  };

  const openModal = () => { setForm(EMPTY); setErrors({}); setModal(true) }

  const handleCreate = async () => {
    const { errors: errs, isValid } = valShowtime(form)

    if (!isValid) {
      setErrors(errs);
      toast.error('Vui lòng kiểm tra lại thông tin bị đỏ');
      return
    }

    setSaving(true)
    try {
      await showtimeService.create({
        movieId: form.movieId,
        roomId: parseInt(form.roomId),
        startTime: form.startTime,
        language: form.language,
        subtitleType: form.subtitleType,
        screenFormat: form.screenFormat,
        notes: form.notes || null
      });
      toast.success('Tạo suất chiếu thành công!');
      setModal(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Phòng đã có lịch trùng giờ')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = async (id) => { if (!confirm('Hủy suất chiếu này?')) return; setCanc(id); try { await showtimeService.cancel(id); toast.success('Đã hủy'); load() } catch { toast.error('Không thể hủy') } finally { setCanc(null) } }

  const filtered = showtimes.filter(st => {
    // Lọc trạng thái & Text search
    const ms = statusFilter === 'all' ? true : statusFilter === 'active' ? !st.isCancelled : st.isCancelled;
    const mq = !search || [st.title, st.movieTitle, st.cinemaName, st.roomName].some(f => f?.toLowerCase().includes(search.toLowerCase()));

    // Lọc theo Rạp (So sánh tên rạp)
    const selectedCine = uniqueCinemas.find(c => String(c.id) === String(filterCinema));
    const mc = !filterCinema || st.cinemaName === selectedCine?.name;

    // Lọc theo Phòng (So sánh tên phòng)
    const selectedRoomObj = allRooms.find(r => String(r.id) === String(filterRoom));
    const mr = !filterRoom || st.roomName === selectedRoomObj?.name;

    // Lọc theo Ngày (So khớp chuỗi YYYY-MM-DD ở đầu startTime)
    const md = !filterDate || st.startTime.startsWith(filterDate);

    return ms && mq && mc && mr && md;
  })
  const paginated = filtered.slice((page - 1) * PAGE, page * PAGE)
  const totalPages = Math.ceil(filtered.length / PAGE)

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26 }}>Quản lý <span style={{ color: 'var(--gold)' }}>Suất Chiếu</span></h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} placeholder="🔍 Tìm tên phim, rạp..."
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', color: 'var(--text-pri)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif", width: 210 }}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <Button variant="primary" size="md" onClick={openModal}>+ Thêm suất chiếu</Button>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[['active', 'Đang hoạt động'], ['cancelled', 'Đã hủy'], ['all', 'Tất cả']].map(([v, l]) => (
          <button key={v} onClick={() => { setStatus(v); setPage(1) }} style={{ padding: '7px 16px', borderRadius: 16, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1px solid ${statusFilter === v ? 'var(--gold)' : 'var(--border)'}`, background: statusFilter === v ? 'rgba(201,168,76,.1)' : 'transparent', color: statusFilter === v ? 'var(--gold)' : 'var(--text-sec)', transition: '.15s' }}>
            {l} <span style={{ opacity: .6 }}>({showtimes.filter(st => v === 'all' ? true : v === 'active' ? !st.isCancelled : st.isCancelled).length})</span>
          </button>
        ))}
      </div>
      {/* KHỐI BỘ LỌC NÂNG CAO */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 16, flexWrap: 'wrap', background: 'var(--bg-card2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Rạp:</span>
          <select value={filterCinema} onChange={e => { setFilterCinema(e.target.value); setPage(1) }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-pri)', padding: '6px 10px', borderRadius: 4, fontSize: 13, outline: 'none', cursor: 'pointer' }}>
            <option value="">Tất cả rạp</option>
            {uniqueCinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Phòng:</span>
          <select value={filterRoom} onChange={e => { setFilterRoom(e.target.value); setPage(1) }} disabled={!filterCinema} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-pri)', padding: '6px 10px', borderRadius: 4, fontSize: 13, outline: 'none', opacity: !filterCinema ? 0.4 : 1, cursor: !filterCinema ? 'not-allowed' : 'pointer' }}>
            <option value="">{filterCinema ? 'Tất cả phòng' : 'Chọn rạp trước'}</option>
            {filterRoomsList.map(r => <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>)}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 13, color: 'var(--text-sec)' }}>Ngày chiếu:</span>
          <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
            <input type="date" value={filterDate} onChange={e => { setFilterDate(e.target.value); setPage(1) }} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-pri)', padding: '5px 10px', borderRadius: 4, fontSize: 13, outline: 'none', cursor: 'pointer' }} />
            {filterDate && (
              <button onClick={() => { setFilterDate(''); setPage(1) }} style={{ position: 'absolute', right: -24, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>×</button>
            )}
          </div>
        </div>
      </div>

      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div> : (
        <>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: 'var(--bg-card2)' }}>{['Phim', 'Thời gian', 'Rạp / Phòng', 'Định dạng', 'Trạng thái', ''].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, fontWeight: 500 }}>{h}</th>)}</tr></thead>
              <tbody>
                {paginated.map(st => {
                  const fc = FMT_COLOR[st.screenFormat] || '#5a5850'; return (
                    <tr key={st.id} style={{ borderTop: '1px solid var(--border)', opacity: st.isCancelled ? .7 : 1 }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <td style={{ padding: '11px 14px' }}><div style={{ fontSize: 13, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{st.title || st.movieTitle || '—'}</div></td>
                      <td style={{ padding: '11px 14px' }}>
                        <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--gold)' }}>
                          {formatTime(st.startTime)} {st.endTime ? `- ${formatTime(st.endTime)}` : ''}
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          {formatDate(st.startTime)}
                        </div>
                      </td>
                      <td style={{ padding: '11px 14px' }}><div style={{ fontSize: 13 }}>{st.cinemaName || '—'}</div><div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{st.roomName || '—'}</div></td>
                      <td style={{ padding: '11px 14px' }}><span style={{ fontSize: 11, fontWeight: 600, background: `${fc}22`, color: fc, border: `1px solid ${fc}55`, padding: '2px 8px', borderRadius: 2 }}>{st.screenFormat}</span></td>
                      <td style={{ padding: '11px 14px' }}>{st.isCancelled ? <span style={{ fontSize: 11, background: 'rgba(224,82,82,.12)', color: 'var(--red)', padding: '3px 8px', borderRadius: 2 }}>Đã hủy</span> : <span style={{ fontSize: 11, background: 'rgba(82,201,124,.12)', color: 'var(--green)', padding: '3px 8px', borderRadius: 2 }}>Hoạt động</span>}</td>
                      <td style={{ padding: '11px 14px' }}>{!st.isCancelled && <Button variant="danger" size="sm" loading={cancelling === st.id} onClick={() => handleCancel(st.id)}>Hủy chiếu</Button>}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {paginated.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{search ? 'Không tìm thấy' : 'Chưa có suất chiếu'}</div>}
          </div>
          {totalPages > 1 && <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>{['←', ...Array.from({ length: Math.min(7, totalPages) }, (_, i) => i + 1), '→'].map((pg, i) => { const isNav = pg === '←' || pg === '→'; const tgt = pg === '←' ? Math.max(1, page - 1) : pg === '→' ? Math.min(totalPages, page + 1) : pg; return (<button key={i} onClick={() => setPage(tgt)} disabled={isNav && ((pg === '←' && page === 1) || (pg === '→' && page === totalPages))} style={{ padding: '6px 12px', borderRadius: 4, border: `1px solid ${!isNav && page === pg ? 'var(--gold)' : 'var(--border)'}`, background: !isNav && page === pg ? 'var(--gold)' : 'var(--bg-card)', color: !isNav && page === pg ? '#000' : 'var(--text-sec)', cursor: 'pointer', fontSize: 13, fontFamily: "'DM Sans',sans-serif" }}>{pg}</button>) })}</div>}
        </>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Thêm suất chiếu mới" maxWidth={540}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          <div>
            <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Phim đang chiếu *</label>
            <select value={form.movieId} onChange={setF('movieId')} onBlur={handleBlur('movieId')} style={ss(errors.movieId)}>
              <option value="">-- Chọn phim --</option>
              {movies.filter(m => m.status === 'now_showing').map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            {errors.movieId && <span style={errStyle}>{errors.movieId}</span>}
            {movies.filter(m => m.status === 'now_showing').length === 0 && <span style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginTop: 3 }}>⚠ Chưa có phim "Đang chiếu" — đổi trạng thái trong Quản lý Phim</span>}
          </div>

          {/* Khối chọn Rạp & Phòng chiếu */}
          {(() => {
            const activeRooms = allRooms.filter(r => r.isActive !== false);
            // Lọc ra danh sách rạp duy nhất từ các phòng chiếu
            const uniqueCinemas = Array.from(new Map(activeRooms.map(r => [r.cinemaId, { id: r.cinemaId, name: r.cinemaName || `Rạp #${r.cinemaId}` }])).values());
            const filteredRooms = activeRooms.filter(r => String(r.cinemaId) === String(form.cinemaId));

            return (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Rạp chiếu *</label>
                  <select value={form.cinemaId} onChange={setF('cinemaId')} onBlur={handleBlur('cinemaId')} style={ss(errors.cinemaId)}>
                    <option value="">-- Chọn rạp --</option>
                    {uniqueCinemas.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  {errors.cinemaId && <span style={errStyle}>{errors.cinemaId}</span>}
                </div>

                <div>
                  <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Phòng chiếu *</label>
                  <select
                    value={form.roomId}
                    onChange={setF('roomId')}
                    onBlur={handleBlur('roomId')}
                    disabled={!form.cinemaId}
                    style={{ ...ss(errors.roomId), opacity: !form.cinemaId ? 0.6 : 1, cursor: !form.cinemaId ? 'not-allowed' : 'pointer' }}
                  >
                    <option value="">{form.cinemaId ? '-- Chọn phòng --' : '-- Chọn rạp trước --'}</option>
                    {filteredRooms.map(r => <option key={r.id} value={r.id}>{r.name} ({r.roomType})</option>)}
                  </select>
                  {errors.roomId && <span style={errStyle}>{errors.roomId}</span>}
                </div>
              </div>
            )
          })()}

          <div>
            <Input
              label="Thời gian bắt đầu *"
              type="datetime-local"
              value={form.startTime}
              onChange={setF('startTime')}
              onBlur={handleBlur('startTime')}
              error={errors.startTime}
              min={getMinDateTime()} /* Khóa không cho chọn giờ trong quá khứ trên lịch */
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Định dạng chiếu</label><select value={form.screenFormat} onChange={setF('screenFormat')} disabled style={{ ...ssBase, border: '1px solid var(--border)' }}>{FORMATS.map(f => <option key={f}>{f}</option>)}</select></div>
            <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Ngôn ngữ</label><select value={form.language} onChange={setF('language')} disabled style={{ ...ssBase, border: '1px solid var(--border)' }}>{LANGS.map(l => <option key={l.val} value={l.val}>{l.label}</option>)}</select></div>
          </div>

          <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Phụ đề</label><select value={form.subtitleType} onChange={setF('subtitleType')} style={{ ...ssBase, border: '1px solid var(--border)' }}>{SUBS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}</select></div>

          <Input label="Ghi chú (tuỳ chọn)" value={form.notes} onChange={setF('notes')} placeholder="Suất chiếu đặc biệt ra mắt phim..." />

          <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid var(--border-gold)', borderRadius: 6, padding: 12, fontSize: 12, color: 'var(--text-sec)' }}>💡 Giờ kết thúc tự tính từ thời lượng phim. Backend trả lỗi nếu phòng trùng lịch.</div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={() => setModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleCreate} loading={saving}>Tạo suất chiếu</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}