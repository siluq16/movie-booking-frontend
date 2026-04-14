import { useState, useEffect } from 'react'
import { movieService, genreService, directorService, castService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { FieldError, validate, check, rules, inputErr } from '../../utils/validation'
import { formatDuration } from '../../utils/formatters'
import toast from 'react-hot-toast'

const STATUS_OPTS = [{ val: 'coming_soon', label: 'Sắp chiếu' }, { val: 'now_showing', label: 'Đang chiếu' }, { val: 'ended', label: 'Đã kết thúc' }, { val: 'cancelled', label: 'Đã hủy' }]
const LANG_OPTS = [{ val: 'vi', label: 'Tiếng Việt' }, { val: 'en', label: 'Tiếng Anh' }, { val: 'ko', label: 'Tiếng Hàn' }, { val: 'ja', label: 'Tiếng Nhật' }, { val: 'zh', label: 'Tiếng Trung' }]
const CAST_ROLES = ['Diễn viên chính', 'Diễn viên phụ', 'Diễn viên khách mời', 'Diễn viên lồng tiếng']
const DIR_ROLES = ['Đạo diễn', 'Đạo diễn phụ', 'Đồng đạo diễn', 'Đạo diễn hành động']
const STATUS_STYLE = { now_showing: { bg: 'rgba(82,201,124,.15)', color: 'var(--green)' }, coming_soon: { bg: 'rgba(201,168,76,.1)', color: 'var(--gold)' }, ended: { bg: 'rgba(90,88,80,.2)', color: 'var(--text-muted)' }, cancelled: { bg: 'rgba(224,82,82,.12)', color: 'var(--red)' } }
const STATUS_LABEL = { now_showing: 'Đang chiếu', coming_soon: 'Sắp chiếu', ended: 'Đã kết thúc', cancelled: 'Đã hủy' }
const STEPS = ['Thông tin', 'Hình ảnh', 'Thể loại', 'Diễn viên']
const EMPTY_FORM = { title: '', originalTitle: '', description: '', durationMinutes: 90, releaseDate: '', endDate: '', language: 'vi', country: '', ageRating: 0, status: 'coming_soon', posterUrl: '', bannerUrl: '', trailerUrl: '', isFeatured: false, genreIds: [], crews: [] }
const EMPTY_CREW = { type: 'cast', personId: '', roleLabel: 'Diễn viên chính', characterName: '', displayOrder: 0 }
const ss = { width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none' }
const errStyle = { fontSize: 11, color: 'var(--red)', marginTop: 3, display: 'block' }

// --- HÀM VALIDATE TÁCH RỜI ---
function valStep0(f) {
  const dRelease = f.releaseDate ? new Date(f.releaseDate) : null;
  const dEnd = f.endDate ? new Date(f.endDate) : null;
  return validate({
    title: check(f.title, rules.required('Tên phim'), rules.minLen(1, 'Tên phim'), rules.maxLen(255, 'Tên phim')),

    durationMinutes: !f.durationMinutes || parseInt(f.durationMinutes) < 1 ? 'Thời lượng phải > 0 phút' : parseInt(f.durationMinutes) > 600 ? 'Thời lượng không hợp lệ' : null,

    releaseDate: !f.releaseDate
      ? 'Vui lòng chọn ngày khởi chiếu'
      : (dRelease.getFullYear() < 2000 || dRelease.getFullYear() > 2100)
        ? 'Năm khởi chiếu không hợp lệ (2000 - 2100)'
        : null,

    endDate: (f.endDate && !f.releaseDate)
      ? 'Vui lòng chọn ngày khởi chiếu trước'
      : (f.releaseDate && f.endDate && dEnd < dRelease)
        ? 'Ngày kết thúc không được trước ngày khởi chiếu'
        : null,
  })
}

function valStep1(f) {
  const urlRegex = /^(http|https):\/\/[^ "]+$/;
  const checkUrl = (url, name) => url && !urlRegex.test(url) ? `Định dạng URL ${name} không hợp lệ` : null;
  return validate({
    posterUrl: checkUrl(f.posterUrl, 'Poster'),
    bannerUrl: checkUrl(f.bannerUrl, 'Banner'),
    trailerUrl: checkUrl(f.trailerUrl, 'Trailer')
  })
}
// -----------------------------

function StepBar({ step }) { return (<div style={{ display: 'flex', marginBottom: 28 }}>{STEPS.map((label, i) => (<div key={i} style={{ flex: 1, display: 'flex', alignItems: 'center' }}><div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}><div style={{ width: 28, height: 28, borderRadius: '50%', fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4, background: i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--bg-card2)', border: `2px solid ${i < step ? 'var(--green)' : i === step ? 'var(--gold)' : 'var(--border)'}`, color: i <= step ? '#000' : 'var(--text-muted)' }}>{i < step ? '✓' : i + 1}</div><div style={{ fontSize: 10, color: i === step ? 'var(--gold)' : 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3, maxWidth: 72 }}>{label}</div></div>{i < STEPS.length - 1 && <div style={{ height: 1, width: 14, background: i < step ? 'var(--green)' : 'var(--border)', flexShrink: 0, marginBottom: 18 }} />}</div>))}</div>) }

function ImgPreview({ url, label, ratio = '2/3' }) { const [ok, setOk] = useState(false); useEffect(() => setOk(false), [url]); return (<div style={{ aspectRatio: ratio, background: 'var(--bg-card2)', border: '1px dashed var(--border)', borderRadius: 6, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 4, color: 'var(--text-muted)', fontSize: 11, position: 'relative' }}>{url ? (<><img src={url} alt="" onLoad={() => setOk(true)} onError={() => setOk(false)} style={{ width: '100%', height: '100%', objectFit: 'cover', display: ok ? 'block' : 'none' }} />{!ok && <span style={{ position: 'absolute' }}>Đang tải...</span>}</>) : (<><span style={{ fontSize: 24 }}>🖼️</span><span>{label}</span></>)}</div>) }

function CrewRow({ row, idx, allRows, directors, castMembers, onChange, onRemove }) {
  const isCast = row.type === 'cast'
  const roles = isCast ? CAST_ROLES : DIR_ROLES
  const usedIds = allRows.filter((r, i) => i !== idx && r.type === row.type && r.personId).map(r => r.personId)
  const available = (isCast ? castMembers : directors).filter(p => !usedIds.includes(p.id))
  const ch = (f) => (e) => onChange(idx, { ...row, [f]: e.target.value })
  const switchType = (t) => onChange(idx, { ...row, type: t, personId: '', characterName: '', roleLabel: (t === 'cast' ? CAST_ROLES : DIR_ROLES)[0], _touched: false })
  const hasErr = !row.personId && row._touched
  return (
    <div style={{ background: 'var(--bg-card2)', border: `1px solid ${hasErr ? 'rgba(224,82,82,.4)' : 'var(--border)'}`, borderRadius: 8, padding: '14px 16px', position: 'relative' }}>
      <button onClick={onRemove} style={{ position: 'absolute', top: 10, right: 12, background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 20, lineHeight: 1, padding: 0 }}>×</button>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[['cast', '🎭 Diễn viên'], ['director', '🎬 Đạo diễn']].map(([t, l]) => (<button key={t} type="button" onClick={() => switchType(t)} style={{ padding: '5px 16px', borderRadius: 4, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", border: `1px solid ${row.type === t ? 'var(--gold)' : 'var(--border)'}`, background: row.type === t ? 'rgba(201,168,76,.12)' : 'transparent', color: row.type === t ? 'var(--gold)' : 'var(--text-sec)', fontWeight: row.type === t ? 600 : 400, transition: '.15s' }}>{l}</button>))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>{isCast ? 'Diễn viên *' : 'Đạo diễn *'}</label>
          <select value={row.personId || ''} onChange={e => onChange(idx, { ...row, personId: e.target.value, _touched: true })} style={{ ...ss, fontSize: 13, padding: '7px 10px', border: `1px solid ${hasErr ? 'rgba(224,82,82,.5)' : 'var(--border)'}` }}>
            <option value="">-- Chọn {isCast ? 'diễn viên' : 'đạo diễn'} --</option>
            {(isCast ? castMembers : directors).length === 0 && <option disabled>Chưa có — thêm trong "Người & Thể loại"</option>}
            {available.map(p => <option key={p.id} value={p.id}>{p.name}{p.nationality ? ` (${p.nationality})` : ''}</option>)}
            {available.length === 0 && (isCast ? castMembers : directors).length > 0 && <option disabled>Tất cả đã được chọn</option>}
          </select>
          {hasErr && <span style={errStyle}>Vui lòng chọn người</span>}
        </div>
        <div>
          <label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Vai trò</label>
          <select value={row.roleLabel || roles[0]} onChange={ch('roleLabel')} style={{ ...ss, fontSize: 13, padding: '7px 10px' }}>{roles.map(r => <option key={r} value={r}>{r}</option>)}</select>
        </div>
        {isCast && <div><label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Tên nhân vật (tuỳ chọn)</label><input value={row.characterName || ''} onChange={ch('characterName')} placeholder="VD: Tony Stark" style={{ ...ss, fontSize: 13, padding: '7px 10px' }} /></div>}
        <div><label style={{ fontSize: 11, color: 'var(--text-muted)', display: 'block', marginBottom: 4 }}>Thứ tự</label><input type="number" min={0} value={row.displayOrder ?? 0} onChange={ch('displayOrder')} style={{ ...ss, fontSize: 13, padding: '7px 10px' }} /></div>
      </div>
    </div>
  )
}

export default function ManageMovies() {
  const [movies, setMovies] = useState([])
  const [genres, setGenres] = useState([])
  const [directors, setDirectors] = useState([])
  const [castMembers, setCast] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [modal, setModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [step, setStep] = useState(0)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)

  const load = () => { setLoading(true); Promise.allSettled([movieService.getAll(), genreService.getAll(), directorService.getAll(), castService.getAll()]).then(([mv, gn, di, ca]) => { setMovies(mv.status === 'fulfilled' ? (mv.value.data || []) : []); setGenres(gn.status === 'fulfilled' ? (gn.value.data || []) : []); setDirectors(di.status === 'fulfilled' ? (di.value.data || []) : []); setCast(ca.status === 'fulfilled' ? (ca.value.data || []) : []) }).finally(() => setLoading(false)) }
  useEffect(load, [])

  const DIR_ROLE_VALUES = ['Đạo diễn', 'Đạo diễn phụ', 'Đồng đạo diễn', 'Đạo diễn hành động']
  const isDirectorCrew = (c) => c.directorId || (c.roleLabel && DIR_ROLE_VALUES.includes(c.roleLabel))
  const crewToRows = (crews = []) => crews.map(c => {
    const isDir = isDirectorCrew(c)
    return {
      type: isDir ? 'director' : 'cast',
      personId: c.directorId || c.castMemberId || '',
      roleLabel: c.roleLabel || (isDir ? DIR_ROLES[0] : CAST_ROLES[0]),
      characterName: c.characterName || '',
      displayOrder: c.displayOrder || 0,
      _touched: false,
      _name: c.name || '',
    }
  })
  const rowsToCrew = (rows) => rows.filter(r => r.personId).map(r => ({ directorId: r.type === 'director' ? r.personId : null, castMemberId: r.type === 'cast' ? r.personId : null, roleLabel: r.roleLabel || null, characterName: r.characterName || null, displayOrder: parseInt(r.displayOrder) || 0 }))

  const openCreate = () => { setEditing(null); setForm({ ...EMPTY_FORM }); setErrors({}); setStep(0); setModal(true) }

  const resolveCrewIds = (crews = []) => crews.map(c => {
    const isDir = isDirectorCrew(c)
    let personId = c.directorId || c.castMemberId || ''
    if (!personId && c.name) {
      const found = isDir
        ? directors.find(d => d.name === c.name)
        : castMembers.find(cm => cm.name === c.name)
      if (found) personId = found.id
    }
    return {
      type: isDir ? 'director' : 'cast',
      personId,
      roleLabel: c.roleLabel || (isDir ? DIR_ROLES[0] : CAST_ROLES[0]),
      characterName: c.characterName || '',
      displayOrder: c.displayOrder || 0,
      _touched: false,
      _name: c.name || '',
    }
  })

  const openEdit = async (m) => {
    setEditing(m); setErrors({}); setStep(0); setModal(true)
    const quickGenreIds = (m.genres || []).map(gName => genres.find(g => g.name === gName)?.id).filter(Boolean)
    setForm({ ...EMPTY_FORM, ...m, releaseDate: m.releaseDate?.slice(0, 10) || '', endDate: m.endDate?.slice(0, 10) || '', genreIds: quickGenreIds, crews: resolveCrewIds(m.crews || []) })
    try {
      const res = await movieService.getById(m.id)
      const full = res.data
      const genreIds = (full.genres || []).map(gName => genres.find(g => g.name === gName)?.id).filter(Boolean)
      setForm({ ...EMPTY_FORM, ...full, releaseDate: full.releaseDate?.slice(0, 10) || '', endDate: full.endDate?.slice(0, 10) || '', genreIds, crews: resolveCrewIds(full.crews || []) })
    } catch {/* keep data */ }
  }

  // --- XỬ LÝ NHẬP LIỆU & ONBLUR ---
  const setF = (f) => (e) => {
    setForm(p => ({ ...p, [f]: e.target.value }))
    setErrors(p => ({ ...p, [f]: undefined })) // Tự xóa lỗi khi gõ lại
  }

  const handleBlur = (field) => () => {
    let currentErrors = {};
    if (step === 0) currentErrors = valStep0(form).errors;
    if (step === 1) currentErrors = valStep1(form).errors;

    if (currentErrors[field]) {
      setErrors(prev => ({ ...prev, [field]: currentErrors[field] }));
    }
  };
  // --- TỰ ĐỘNG CẬP NHẬT TRẠNG THÁI THEO NGÀY ---
  useEffect(() => {
    if (form.status === 'cancelled') {
      if (form.isFeatured) {
        setForm(p => ({ ...p, isFeatured: false }));
      }
      return;
    }

    if (!form.releaseDate) {
      if (form.status !== 'coming_soon') setForm(p => ({ ...p, status: 'coming_soon' }));
      return;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const release = new Date(form.releaseDate);
    release.setHours(0, 0, 0, 0);

    let autoStatus = 'coming_soon';
    if (today >= release) autoStatus = 'now_showing';

    if (form.endDate) {
      const end = new Date(form.endDate);
      end.setHours(23, 59, 59, 999);
      if (today > end) autoStatus = 'ended';
    }

    let newIsFeatured = form.isFeatured;
    if (autoStatus === 'ended') {
      newIsFeatured = false;
    }

    if (form.status !== autoStatus || form.isFeatured !== newIsFeatured) {
      setForm(p => ({
        ...p,
        status: autoStatus,
        isFeatured: newIsFeatured
      }));
    }
  }, [form.releaseDate, form.endDate, form.status, form.isFeatured]);
  // --------------------------------

  const setB = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.checked }))
  const toggleGenre = (id) => setForm(p => ({ ...p, genreIds: p.genreIds.includes(id) ? p.genreIds.filter(g => g !== id) : [...p.genreIds, id] }))
  const addCrew = () => setForm(p => ({ ...p, crews: [...p.crews, { ...EMPTY_CREW, displayOrder: p.crews.length }] }))
  const updateCrew = (idx, val) => setForm(p => ({ ...p, crews: p.crews.map((c, i) => i === idx ? val : c) }))
  const removeCrew = (idx) => setForm(p => ({ ...p, crews: p.crews.filter((_, i) => i !== idx) }))

  const goNext = () => {
    let stepErrors = {};
    let isStepValid = true;

    if (step === 0) {
      const { errors, isValid } = valStep0(form);
      stepErrors = errors;
      isStepValid = isValid;
    } else if (step === 1) {
      const { errors, isValid } = valStep1(form);
      stepErrors = errors;
      isStepValid = isValid;
    } else if (step === 2) {
      if (form.genreIds.length === 0) {
        toast.error('Vui lòng chọn ít nhất 1 thể loại');
        return;
      }
    }

    if (!isStepValid) {
      setErrors(stepErrors);
      return;
    }

    setErrors({});
    setStep(s => s + 1);
  }

  const handleSave = async () => {
    const v0 = valStep0(form)
    const v1 = valStep1(form)

    if (!v0.isValid || !v1.isValid) {
      setErrors({ ...v0.errors, ...v1.errors })
      setStep(!v0.isValid ? 0 : 1) // Chuyển về đúng tab đang lỗi
      toast.error('Vui lòng kiểm tra lại thông tin bị đỏ')
      return
    }

    if (form.genreIds.length === 0) { toast.error('Vui lòng chọn ít nhất 1 thể loại'); setStep(2); return }
    if (form.crews.some(r => !r.personId)) { toast.error('Một số thành viên chưa chọn người'); setStep(3); return }

    setSaving(true)
    try {
      const payload = { title: form.title.trim(), originalTitle: form.originalTitle?.trim() || null, description: form.description?.trim() || null, durationMinutes: parseInt(form.durationMinutes), releaseDate: form.releaseDate || null, endDate: form.endDate || null, posterUrl: form.posterUrl || null, bannerUrl: form.bannerUrl || null, trailerUrl: form.trailerUrl || null, language: form.language, country: form.country?.trim() || null, ageRating: parseInt(form.ageRating) || 0, status: form.status, isFeatured: !!form.isFeatured, genreIds: form.genreIds, crews: rowsToCrew(form.crews) }
      if (editing) { await movieService.update(editing.id, payload); toast.success('Cập nhật phim thành công!') }
      else { await movieService.create(payload); toast.success('Tạo phim thành công!') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => { if (!confirm('Xóa phim này?')) return; try { await movieService.delete(id); toast.success('Đã xóa'); load() } catch { toast.error('Không thể xóa — phim đang có lịch chiếu') } }

  const filtered = movies.filter(m => { const ok1 = statusFilter === 'all' || m.status === statusFilter; const ok2 = !search || [m.title, m.originalTitle].some(t => t?.toLowerCase().includes(search.toLowerCase())); return ok1 && ok2 })
  const counts = { all: movies.length, now_showing: 0, coming_soon: 0, ended: 0 }
  movies.forEach(m => { if (m.status in counts) counts[m.status]++ })

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: 26 }}>Quản lý <span style={{ color: 'var(--gold)' }}>Phim</span></h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="🔍 Tìm tên phim..."
            style={{ background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '8px 14px', color: 'var(--text-pri)', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif", width: 220 }}
            onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} />
          <Button variant="primary" size="md" onClick={openCreate}>+ Thêm phim mới</Button>
        </div>
      </div>
      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: 24 }}>
        {[['all', 'Tất cả'], ['now_showing', 'Đang chiếu'], ['coming_soon', 'Sắp chiếu'], ['ended', 'Đã kết thúc']].map(([v, l]) => (
          <button key={v} onClick={() => setStatus(v)} style={{ background: 'none', border: 'none', color: statusFilter === v ? 'var(--gold)' : 'var(--text-sec)', fontSize: 13, padding: '9px 18px', cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", borderBottom: `2px solid ${statusFilter === v ? 'var(--gold)' : 'transparent'}`, marginBottom: -1 }}>
            {l} <span style={{ fontSize: 11, opacity: .6 }}>({counts[v] ?? 0})</span>
          </button>
        ))}
      </div>
      {loading ? <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}><Spinner size="lg" /></div> : (
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead><tr style={{ background: 'var(--bg-card2)' }}>{['Phim', 'Thể loại', 'TL / Năm', 'Đánh giá', 'Trạng thái', '⭐', ''].map(h => <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontSize: 11, color: 'var(--text-muted)', letterSpacing: .5, fontWeight: 500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(m => (
                <tr key={m.id} style={{ borderTop: '1px solid var(--border)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-card2)'} onMouseLeave={e => e.currentTarget.style.background = ''}>
                  <td style={{ padding: '10px 14px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div style={{ width: 36, height: 54, borderRadius: 4, overflow: 'hidden', background: 'var(--bg-card2)', border: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>{m.posterUrl ? <img src={m.posterUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display = 'none'} /> : '🎬'}</div><div><div style={{ fontSize: 13, fontWeight: 500, maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.title}</div>{m.originalTitle && m.originalTitle !== m.title && <div style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.originalTitle}</div>}</div></div></td>
                  <td style={{ padding: '10px 14px' }}><div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', maxWidth: 140 }}>{m.genres?.slice(0, 2).map(g => <span key={g} style={{ fontSize: 10, background: 'rgba(201,168,76,.08)', color: 'var(--gold)', border: '1px solid var(--border-gold)', padding: '1px 6px', borderRadius: 2 }}>{g}</span>)}</div></td>
                  <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-sec)', whiteSpace: 'nowrap' }}>{formatDuration(m.durationMinutes)}<br /><span style={{ color: 'var(--text-muted)' }}>{m.releaseDate ? new Date(m.releaseDate).getFullYear() : '—'}</span></td>
                  <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--gold)' }}>{m.avgRating > 0 ? `★ ${m.avgRating}` : '—'}{m.reviewCount > 0 && <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{m.reviewCount} đánh giá</div>}</td>
                  <td style={{ padding: '10px 14px' }}><span style={{ fontSize: 10, padding: '3px 8px', borderRadius: 2, fontWeight: 500, ...(STATUS_STYLE[m.status] || {}) }}>{STATUS_LABEL[m.status] || m.status}</span></td>
                  <td style={{ padding: '10px 14px', fontSize: 16 }}>{m.isFeatured ? '⭐' : ''}</td>
                  <td style={{ padding: '10px 14px' }}><div style={{ display: 'flex', gap: 6 }}><button onClick={() => openEdit(m)} style={{ background: 'none', border: '1px solid var(--border)', color: 'var(--text-sec)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }} onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--gold)'; e.currentTarget.style.color = 'var(--gold)' }} onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-sec)' }}>✏️</button><button onClick={() => handleDelete(m.id)} style={{ background: 'none', border: '1px solid rgba(224,82,82,.3)', color: 'var(--red)', borderRadius: 4, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>🗑️</button></div></td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div style={{ textAlign: 'center', padding: 60, color: 'var(--text-muted)' }}>{search ? 'Không tìm thấy phim' : 'Chưa có phim nào'}</div>}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title={editing ? `Sửa: ${editing.title}` : 'Thêm phim mới'} maxWidth={660}>
        <StepBar step={step} />

        {step === 0 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Tích hợp error trực tiếp vào Input */}
          <Input label="Tên phim *" value={form.title || ''} onChange={setF('title')} onBlur={handleBlur('title')} error={errors.title} />
          <Input label="Tên gốc (original title)" value={form.originalTitle || ''} onChange={setF('originalTitle')} placeholder="Tuỳ chọn" />

          <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Mô tả / Tóm tắt</label><textarea rows={4} value={form.description || ''} onChange={setF('description')} placeholder="Tóm tắt nội dung phim..." style={{ width: '100%', background: 'var(--bg-card2)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 12px', color: 'var(--text-pri)', fontSize: 14, fontFamily: "'DM Sans',sans-serif", outline: 'none', resize: 'vertical' }} onFocus={e => e.target.style.borderColor = 'var(--gold)'} onBlur={e => e.target.style.borderColor = 'var(--border)'} /></div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <Input label="Thời lượng (phút) *" type="number" value={form.durationMinutes} onChange={setF('durationMinutes')} onBlur={handleBlur('durationMinutes')} error={errors.durationMinutes} />
            <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Ngôn ngữ</label><select value={form.language} onChange={setF('language')} style={ss}>{LANG_OPTS.map(l => <option key={l.val} value={l.val}>{l.label}</option>)}</select></div>
            <div><label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>Giới hạn tuổi</label><select value={form.ageRating} onChange={setF('ageRating')} style={ss}><option value={0}>Mọi lứa tuổi (P)</option><option value={13}>T13+</option><option value={16}>T16+</option><option value={18}>T18+</option></select></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ fontSize: 13, color: 'var(--text-sec)', display: 'block', marginBottom: 6 }}>
                Trạng thái {form.status !== 'cancelled' && <span style={{ color: 'var(--gold)', fontSize: 11 }}>(Tự động)</span>}
              </label>
              <select
                value={form.status}
                onChange={(e) => {
                  setF('status')(e);
                }}
                style={{ ...ss, background: form.status !== 'cancelled' ? 'var(--bg-deep)' : 'var(--bg-card2)' }}
              >
                {STATUS_OPTS.map(s => <option key={s.val} value={s.val}>{s.label}</option>)}
              </select>
            </div>
            <Input label="Quốc gia" value={form.country || ''} onChange={setF('country')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Ngày khởi chiếu" type="date" value={form.releaseDate} onChange={setF('releaseDate')} onBlur={handleBlur('releaseDate')} error={errors.releaseDate} min="2000-01-01" max="2100-12-31" />
            <Input label="Ngày kết thúc" type="date" value={form.endDate} onChange={setF('endDate')} onBlur={handleBlur('endDate')} error={errors.endDate} min={form.releaseDate || "2000-01-01"} max="2100-12-31" />
          </div>

          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            cursor: form.status === 'ended' ? 'not-allowed' : 'pointer',
            fontSize: 14,
            color: 'var(--text-sec)',
            padding: '8px 12px',
            background: 'var(--bg-card2)',
            borderRadius: 6,
            border: `1px solid ${form.isFeatured ? 'var(--border-gold)' : 'var(--border)'}`,
            opacity: form.status === 'ended' ? 0.6 : 1 
          }}>
            <input
              type="checkbox"
              checked={!!form.isFeatured}
              onChange={setB('isFeatured')}
              disabled={form.status === 'ended' || form.status === 'cancelled'} // Disable input
            />
            <span>⭐ Phim <strong style={{ color: form.isFeatured ? 'var(--gold)' : 'inherit' }}>nổi bật</strong> — hiển thị Hero trang chủ</span>
          </label>
        </div>)}

        {step === 1 && (<div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 16, alignItems: 'start' }}>
            <div><div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>XEM TRƯỚC POSTER</div><ImgPreview url={form.posterUrl} label="Poster 2:3" ratio="2/3" /></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Input label="URL Poster (tỉ lệ 2:3)" value={form.posterUrl || ''} onChange={setF('posterUrl')} onBlur={handleBlur('posterUrl')} error={errors.posterUrl} placeholder="https://..." icon="🖼️" />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', background: 'var(--bg-card2)', borderRadius: 6, padding: '8px 10px' }}>💡 400×600px — nguồn tốt: TMDB</div>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>XEM TRƯỚC BANNER</div>
            <ImgPreview url={form.bannerUrl} label="Banner 16:5" ratio="16/5" />
            <div style={{ marginTop: 8 }}>
              <Input label="URL Banner (16:5 hoặc 16:9)" value={form.bannerUrl || ''} onChange={setF('bannerUrl')} onBlur={handleBlur('bannerUrl')} error={errors.bannerUrl} placeholder="https://..." icon="🏞️" />
            </div>
          </div>
          <Input label="URL Trailer (YouTube, Vimeo...)" value={form.trailerUrl || ''} onChange={setF('trailerUrl')} onBlur={handleBlur('trailerUrl')} error={errors.trailerUrl} placeholder="https://youtube.com/watch?v=..." icon="▶️" />
        </div>)}

        {step === 2 && (<div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>Đã chọn: <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{form.genreIds.length} thể loại</span></div>
            {form.genreIds.length === 0 && <span style={{ fontSize: 12, color: 'var(--red)' }}>⚠ Cần ít nhất 1</span>}
          </div>
          {genres.length === 0 ? <div style={{ textAlign: 'center', padding: 40, border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)' }}><div style={{ fontSize: 32, marginBottom: 10 }}>🏷️</div>Chưa có thể loại. Thêm trong <strong style={{ color: 'var(--gold)' }}>Người & Thể loại</strong></div> : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
              {genres.map(g => { const on = form.genreIds.includes(g.id); return (<button key={g.id} type="button" onClick={() => toggleGenre(g.id)} style={{ padding: '8px 20px', borderRadius: 20, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans',sans-serif", background: on ? 'var(--gold)' : 'var(--bg-card2)', border: `1px solid ${on ? 'var(--gold)' : 'var(--border)'}`, color: on ? '#000' : 'var(--text-sec)', fontWeight: on ? 500 : 400, transition: '.15s' }}>{on && '✓ '}{g.name}</button>) })}
            </div>
          )}
        </div>)}

        {step === 3 && (<div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 14, color: 'var(--text-sec)' }}>Đã thêm: <span style={{ color: 'var(--gold)', fontWeight: 500 }}>{form.crews.filter(r => r.personId).length}/{form.crews.length}</span></div>
            <Button variant="outline" size="sm" onClick={addCrew}>+ Thêm thành viên</Button>
          </div>
          {(directors.length === 0 || castMembers.length === 0) && <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid var(--border-gold)', borderRadius: 6, padding: 10, fontSize: 12, color: 'var(--text-sec)', marginBottom: 12 }}>💡 {directors.length === 0 && '⚠ Chưa có đạo diễn. '}{castMembers.length === 0 && '⚠ Chưa có diễn viên. '}Thêm trong <strong style={{ color: 'var(--gold)' }}>Người & Thể loại</strong>.</div>}
          {form.crews.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 36, border: '1px dashed var(--border)', borderRadius: 8, color: 'var(--text-muted)' }}><div style={{ fontSize: 36, marginBottom: 10 }}>🎭</div><div style={{ marginBottom: 14 }}>Thêm diễn viên và đạo diễn cho phim</div><Button variant="outline" size="sm" onClick={addCrew}>+ Thêm thành viên đầu tiên</Button></div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 400, overflowY: 'auto', paddingRight: 4 }}>
              {form.crews.map((row, idx) => (<CrewRow key={idx} row={row} idx={idx} allRows={form.crews} directors={directors} castMembers={castMembers} onChange={updateCrew} onRemove={() => removeCrew(idx)} />))}
            </div>
          )}
        </div>)}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
          <Button variant="ghost" size="md" onClick={step === 0 ? () => setModal(false) : () => setStep(s => s - 1)}>{step === 0 ? 'Hủy' : '← Quay lại'}</Button>
          {step < STEPS.length - 1 ? <Button variant="primary" size="md" onClick={goNext}>Tiếp theo →</Button> : <Button variant="primary" size="md" onClick={handleSave} loading={saving}>{editing ? '💾 Lưu' : '🎬 Tạo phim'}</Button>}
        </div>
      </Modal>
    </div>
  )
}