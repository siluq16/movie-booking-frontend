import { useState, useEffect } from 'react'
import { cinemaService, roomService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { FieldError, validate, check, rules, inputErr } from '../../utils/validation'
import toast from 'react-hot-toast'

const EMPTY = { name:'', address:'', city:'', district:'', phone:'', email:'', openTime:'09:00', closeTime:'23:30', isActive:true }
const TYPE_COLOR = { IMAX:'#4a9fd0', '4DX':'#c070c0', '3D':'#52c97c', '2D':'#9e9a8e', Dolby:'#e07a42', ScreenX:'#a07ad0' }

function validateCinema(f) {
  return validate({
    name:      check(f.name,    rules.required('Tên rạp'), rules.minLen(3, 'Tên rạp'), rules.maxLen(150, 'Tên rạp')),
    address:   check(f.address, rules.required('Địa chỉ')),
    city:      check(f.city,    rules.required('Thành phố'), rules.maxLen(50, 'Thành phố')),
    district:  f.district ? check(f.district, rules.maxLen(50, 'Quận/huyện')) : null,
    phone:     f.phone    ? check(f.phone,    rules.phone())  : null,
    email:     f.email    ? check(f.email,    rules.email()) : null,
    openTime:  !f.openTime ? 'Giờ mở cửa không được để trống' : null,
    closeTime: !f.closeTime ? 'Giờ đóng cửa không được để trống'
               : f.openTime >= f.closeTime ? 'Giờ đóng cửa phải sau giờ mở cửa' : null,
  })
}

export default function ManageCinemas() {
  const [cinemas, setCinemas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExp]    = useState(null)
  const [rooms, setRooms]     = useState({})
  const [modal, setModal]     = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [errors, setErrors]   = useState({})
  const [touched, setTouched] = useState({})
  const [saving, setSaving]   = useState(false)
  const [search, setSearch]   = useState('')

  const load = () => {
    setLoading(true)
    cinemaService.getAll().then(r => setCinemas(Array.isArray(r.data)?r.data:[])).catch(()=>setCinemas([])).finally(()=>setLoading(false))
  }
  useEffect(load, [])

  const handleExpand = async (id) => {
    if (expanded === id) { setExp(null); return }
    setExp(id)
    if (!rooms[id]) {
      try { const r = await roomService.getByCinema(id); setRooms(p=>({...p,[id]:Array.isArray(r.data)?r.data:[]})) }
      catch { setRooms(p=>({...p,[id]:[]})) }
    }
  }

  const touch = (f) => (e) => {
    const v = e.target.value
    setForm(p => ({ ...p, [f]: v }))
    setTouched(p => ({ ...p, [f]: true }))
    const { errors: ne } = validateCinema({ ...form, [f]: v })
    setErrors(p => ({ ...p, [f]: ne[f] }))
  }

  const openCreate = () => { setEditing(null); setForm(EMPTY); setErrors({}); setTouched({}); setModal(true) }
  const openEdit   = (c) => { setEditing(c); setForm({ ...EMPTY, ...c, openTime:c.openTime?.slice(0,5)||'09:00', closeTime:c.closeTime?.slice(0,5)||'23:30' }); setErrors({}); setTouched({}); setModal(true) }

  const handleSave = async () => {
    const { errors:errs, isValid } = validateCinema(form)
    if (!isValid) { setErrors(errs); setTouched(Object.fromEntries(Object.keys(form).map(k=>[k,true]))); toast.error('Vui lòng kiểm tra lại thông tin'); return }
    setSaving(true)
    try {
      const payload = {
          ...form,
          openTime: form.openTime?.length === 5 ? `${form.openTime}:00` : form.openTime,
          closeTime: form.closeTime?.length === 5 ? `${form.closeTime}:00` : form.closeTime
      };
      if (editing) { await cinemaService.update(editing.id, payload); toast.success('Cập nhật thành công!') }
      else         { await cinemaService.create(payload);             toast.success('Tạo rạp thành công!') }
      setModal(false); load()
    } catch (err) { toast.error(err.response?.data?.message || 'Có lỗi xảy ra') }
    finally { setSaving(false) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Xóa rạp này? Tất cả phòng chiếu và lịch chiếu liên quan cũng bị xóa.')) return
    try { await cinemaService.delete(id); toast.success('Đã xóa'); load() }
    catch { toast.error('Không thể xóa — rạp đang có lịch chiếu hoặc đơn hàng') }
  }

  const filtered = cinemas.filter(c => !search || [c.name,c.city,c.district,c.address].some(f=>f?.toLowerCase().includes(search.toLowerCase())))
  const E = ({ f }) => <FieldError msg={touched[f] ? errors[f] : null} />

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>Quản lý <span style={{ color:'var(--gold)' }}>Rạp Chiếu</span></h1>
        <div style={{ display:'flex', gap:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Tìm tên rạp, thành phố..."
            style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", width:230 }}
            onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          <Button variant="primary" size="md" onClick={openCreate}>+ Thêm rạp</Button>
        </div>
      </div>

      {loading ? <div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div>
        : filtered.length === 0 ? (
        <div style={{ textAlign:'center', padding:80, color:'var(--text-muted)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>🏛️</div>
          <div style={{ fontSize:16, color:'var(--text-sec)', marginBottom:16 }}>{search?'Không tìm thấy':'Chưa có rạp nào'}</div>
          {!search && <Button variant="primary" size="md" onClick={openCreate}>Thêm rạp đầu tiên</Button>}
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
          {filtered.map(c => (
            <div key={c.id} style={{ background:'var(--bg-card)', border:`1px solid ${expanded===c.id?'var(--border-gold)':'var(--border)'}`, borderRadius:12, overflow:'hidden', transition:'border-color .2s' }}>
              <div style={{ padding:'18px 22px', display:'flex', alignItems:'center', gap:18, cursor:'pointer', flexWrap:'wrap' }} onClick={()=>handleExpand(c.id)}>
                <div style={{ width:46, height:46, borderRadius:10, background:'rgba(201,168,76,.1)', border:'1px solid var(--border-gold)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏛️</div>
                <div style={{ flex:1, minWidth:200 }}>
                  <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' }}>
                    <span style={{ fontSize:15, fontWeight:500 }}>{c.name}</span>
                    <span style={{ fontSize:10, padding:'2px 8px', borderRadius:2, ...(c.isActive?{background:'rgba(82,201,124,.15)',color:'var(--green)'}:{background:'rgba(90,88,80,.15)',color:'var(--text-muted)'}) }}>{c.isActive?'Hoạt động':'Tạm đóng'}</span>
                  </div>
                  <div style={{ fontSize:13, color:'var(--text-sec)' }}>📍 {c.address}{c.district?`, ${c.district}`:''}, {c.city}</div>
                </div>
                <div style={{ display:'flex', gap:20, flexWrap:'wrap', fontSize:13, color:'var(--text-sec)', flexShrink:0 }}>
                  {c.phone&&<span>📞 {c.phone}</span>}
                  {c.openTime&&<span>🕐 {c.openTime?.slice(0,5)} – {c.closeTime?.slice(0,5)}</span>}
                </div>
                <div style={{ display:'flex', gap:8, flexShrink:0 }}>
                  <button onClick={e=>{e.stopPropagation();openEdit(c)}} style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:6, padding:'6px 14px', cursor:'pointer', fontSize:12, fontFamily:"'DM Sans',sans-serif", transition:'.15s' }}
                    onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}}
                    onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-sec)'}}>✏️ Sửa</button>
                  <button onClick={e=>{e.stopPropagation();handleDelete(c.id)}} style={{ background:'none', border:'1px solid rgba(224,82,82,.3)', color:'var(--red)', borderRadius:6, padding:'6px 12px', cursor:'pointer', fontSize:12 }}>🗑️</button>
                  <div style={{ width:28, height:28, borderRadius:4, border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', color:'var(--text-muted)', fontSize:10, transform:expanded===c.id?'rotate(180deg)':'none', transition:'.2s', userSelect:'none' }}>▼</div>
                </div>
              </div>
              {expanded===c.id&&(
                <div style={{ borderTop:'1px solid var(--border)', padding:'16px 22px', animation:'fadeIn .2s' }}>
                  <div style={{ fontSize:11, color:'var(--text-muted)', letterSpacing:.5, marginBottom:12 }}>PHÒNG CHIẾU ({rooms[c.id]?.length??'...'})</div>
                  {rooms[c.id]===undefined?<div style={{ display:'flex', justifyContent:'center', padding:16 }}><Spinner /></div>
                    :rooms[c.id].length===0?<div style={{ fontSize:13, color:'var(--text-muted)' }}>Chưa có phòng chiếu. Vào <strong style={{ color:'var(--gold)' }}>Sơ đồ ghế</strong> để thêm.</div>
                    :(
                    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:8 }}>
                      {rooms[c.id].map(r=>{const tc=TYPE_COLOR[r.roomType]||'#9e9a8e';return(
                        <div key={r.id} style={{ background:'var(--bg-card2)', border:`1px solid ${tc}33`, borderRadius:8, padding:'10px 14px', display:'flex', alignItems:'center', gap:10, opacity:r.isActive?1:.6 }}>
                          <div style={{ width:32, height:32, borderRadius:6, background:`${tc}22`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🎬</div>
                          <div><div style={{ fontSize:13, fontWeight:500 }}>{r.name}</div><div style={{ display:'flex', gap:5, marginTop:2 }}><span style={{ fontSize:10, color:tc, background:`${tc}22`, padding:'1px 6px', borderRadius:2, fontWeight:600 }}>{r.roomType}</span><span style={{ fontSize:11, color:'var(--text-muted)' }}>{r.totalSeats} ghế</span></div></div>
                        </div>
                      )})}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title={editing?'Chỉnh sửa rạp':'Thêm rạp chiếu mới'} maxWidth={520}>
        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div><Input label="Tên rạp *" value={form.name} onChange={touch('name')} placeholder="VD: CineMax Landmark 81" style={inputErr(touched.name&&errors.name)} /><E f="name" /></div>
          <div><Input label="Địa chỉ *" value={form.address} onChange={touch('address')} placeholder="Số nhà, tên đường..." style={inputErr(touched.address&&errors.address)} /><E f="address" /></div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><Input label="Thành phố *" value={form.city} onChange={touch('city')} placeholder="Hà Nội" style={inputErr(touched.city&&errors.city)} /><E f="city" /></div>
            <div><Input label="Quận / Huyện" value={form.district} onChange={touch('district')} placeholder="Cầu Giấy" style={inputErr(touched.district&&errors.district)} /><E f="district" /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><Input label="Điện thoại" type="tel" value={form.phone} onChange={touch('phone')} placeholder="0901234567" style={inputErr(touched.phone&&errors.phone)} /><E f="phone" /></div>
            <div><Input label="Email" type="email" value={form.email} onChange={touch('email')} placeholder="cinema@email.com" style={inputErr(touched.email&&errors.email)} /><E f="email" /></div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div><Input label="Giờ mở cửa *" type="time" value={form.openTime} onChange={touch('openTime')} style={inputErr(touched.openTime&&errors.openTime)} /><E f="openTime" /></div>
            <div><Input label="Giờ đóng cửa *" type="time" value={form.closeTime} onChange={touch('closeTime')} style={inputErr(touched.closeTime&&errors.closeTime)} /><E f="closeTime" /></div>
          </div>
          {Object.values(errors).some(Boolean) && (
            <div style={{ background:'rgba(224,82,82,.08)', border:'1px solid rgba(224,82,82,.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'var(--red)' }}>⚠ Vui lòng sửa các lỗi phía trên trước khi lưu</div>
          )}
          <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', fontSize:14, color:'var(--text-sec)' }}>
            <input type="checkbox" checked={!!form.isActive} onChange={e=>setForm(f=>({...f,isActive:e.target.checked}))} />Đang hoạt động
          </label>
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={()=>setModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleSave} loading={saving}>{editing?'Lưu':'Tạo rạp'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
