import { useState, useEffect } from 'react'
import { genreService, directorService, castService } from '../../services/movieService'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import { FieldError, validate, check, rules, inputErr } from '../../utils/validation'
import toast from 'react-hot-toast'

const TABS=[['cast','🎭 Diễn Viên'],['director','🎬 Đạo Diễn'],['genre','🏷️ Thể Loại']]

function valPerson(f) {
  return validate({
    name:        check(f.name, rules.required('Tên'), rules.minLen(2,'Tên'), rules.maxLen(100,'Tên')),
    nationality: f.nationality ? check(f.nationality, rules.maxLen(50,'Quốc tịch')) : null,
    photoUrl:    f.photoUrl    ? check(f.photoUrl,    rules.url()) : null,
    birthDate:   f.birthDate && new Date(f.birthDate)>new Date() ? 'Ngày sinh không thể là tương lai' : null,
  })
}

function valGenre(f) {
  return validate({
    name: check(f.name, rules.required('Tên thể loại'), rules.minLen(2,'Tên'), rules.maxLen(50,'Tên')),
    slug: check(f.slug, rules.required('Slug'), rules.slug(), rules.minLen(2,'Slug'), rules.maxLen(50,'Slug')),
  })
}

export default function ManagePeople() {
  const [tab,setTab]=useState('cast')
  const [cast,setCast]=useState([])
  const [dirs,setDirs]=useState([])
  const [genres,setGenres]=useState([])
  const [loading,setLoading]=useState(true)
  const [modal,setModal]=useState(false)
  const [editing,setEditing]=useState(null)
  const [form,setForm]=useState({})
  const [errors,setErrors]=useState({})
  const [touched,setTouched]=useState({})
  const [saving,setSaving]=useState(false)
  const [search,setSearch]=useState('')

  const load=async()=>{
    setLoading(true)
    const[c,d,g]=await Promise.allSettled([castService.getAll(),directorService.getAll(),genreService.getAll()])
    setCast(c.status==='fulfilled'?(Array.isArray(c.value.data)?c.value.data:[]):[])
    setDirs(d.status==='fulfilled'?(Array.isArray(d.value.data)?d.value.data:[]):[])
    setGenres(g.status==='fulfilled'?(Array.isArray(g.value.data)?g.value.data:[]):[])
    setLoading(false)
  }
  useEffect(()=>{load()},[])

  const items=tab==='cast'?cast:tab==='director'?dirs:genres
  const filtered=items.filter(i=>i.name?.toLowerCase().includes(search.toLowerCase()))
  const tabLabel={cast:'diễn viên',director:'đạo diễn',genre:'thể loại'}[tab]
  const isPerson=tab!=='genre'

  const EMPTY_P={name:'',nationality:'',birthDate:'',photoUrl:'',bio:''}
  const EMPTY_G={name:'',slug:''}

  const set=(f)=>(e)=>{
    const v=e.target.value
    const update={[f]:v}
    if(tab==='genre'&&f==='name'&&!editing) update.slug=v.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[^a-z0-9\s-]/g,'').trim().replace(/\s+/g,'-')
    const nf={...form,...update}; setForm(nf); setTouched(p=>({...p,[f]:true}))
    const {errors:errs}=isPerson?valPerson(nf):valGenre(nf)
    setErrors(p=>({...p,...Object.fromEntries(Object.entries(errs))}))
  }

  const openCreate=()=>{setEditing(null);setForm(isPerson?EMPTY_P:EMPTY_G);setErrors({});setTouched({});setModal(true)}
  const openEdit=(item)=>{setEditing(item);setForm(isPerson?{...EMPTY_P,...item,birthDate:item.birthDate?.slice(0,10)||''}:{...EMPTY_G,...item});setErrors({});setTouched({});setModal(true)}

  const handleSave=async()=>{
    const {errors:errs,isValid}=isPerson?valPerson(form):valGenre(form)
    if(!isValid){setErrors(errs);setTouched(Object.fromEntries(Object.keys(form).map(k=>[k,true])));toast.error('Vui lòng kiểm tra lại');return}
    const svc=tab==='cast'?castService:tab==='director'?directorService:genreService
    setSaving(true)
    try{
      if(editing){await svc.update(editing.id,form);toast.success('Cập nhật thành công!')}
      else{await svc.create(form);toast.success('Tạo thành công!')}
      setModal(false);load()
    }catch(err){toast.error(err.response?.data?.message||'Tên hoặc slug đã tồn tại')}
    finally{setSaving(false)}
  }

  const handleDelete=async(item)=>{
    if(!confirm(`Xóa "${item.name}"?\nNếu đang dùng trong phim sẽ không xóa được.`))return
    const svc=tab==='cast'?castService:tab==='director'?directorService:genreService
    try{await svc.delete(item.id);toast.success('Đã xóa');load()}
    catch{toast.error('Không thể xóa — đang được dùng trong phim')}
  }

  const E=({f})=><FieldError msg={touched[f]?errors[f]:null}/>

  return (
    <div>
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24, flexWrap:'wrap', gap:12 }}>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:26 }}>Quản lý <span style={{ color:'var(--gold)' }}>Người & Thể Loại</span></h1>
        <div style={{ display:'flex', gap:10 }}>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder={`🔍 Tìm ${tabLabel}...`}
            style={{ background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'8px 14px', color:'var(--text-pri)', fontSize:13, outline:'none', fontFamily:"'DM Sans',sans-serif", width:200 }}
            onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
          <Button variant="primary" size="md" onClick={openCreate}>+ Thêm {tabLabel}</Button>
        </div>
      </div>
      <div style={{ display:'flex', borderBottom:'1px solid var(--border)', marginBottom:28 }}>
        {TABS.map(([v,l])=>(
          <button key={v} onClick={()=>{setTab(v);setSearch('')}} style={{ background:'none', border:'none', color:tab===v?'var(--gold)':'var(--text-sec)', fontSize:14, padding:'10px 24px', cursor:'pointer', fontFamily:"'DM Sans',sans-serif", borderBottom:`2px solid ${tab===v?'var(--gold)':'transparent'}`, marginBottom:-1 }}>
            {l} <span style={{ fontSize:12, background:'var(--bg-card2)', color:'var(--text-muted)', padding:'1px 7px', borderRadius:10, marginLeft:4 }}>
              {tab===v?filtered.length:(v==='cast'?cast:v==='director'?dirs:genres).length}
            </span>
          </button>
        ))}
      </div>
      {loading?<div style={{ display:'flex', justifyContent:'center', padding:80 }}><Spinner size="lg" /></div>:(
        <div style={{ background:'var(--bg-card)', border:'1px solid var(--border)', borderRadius:10, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse' }}>
            <thead><tr style={{ background:'var(--bg-card2)' }}>{(tab==='genre'?['Tên thể loại','Slug','']:['Tên','Quốc tịch','Ngày sinh','']).map(h=><th key={h} style={{ padding:'11px 16px', textAlign:'left', fontSize:11, color:'var(--text-muted)', letterSpacing:.5, fontWeight:500 }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map(item=>(
                <tr key={item.id} style={{ borderTop:'1px solid var(--border)' }} onMouseEnter={e=>e.currentTarget.style.background='var(--bg-card2)'} onMouseLeave={e=>e.currentTarget.style.background=''}>
                  <td style={{ padding:'11px 16px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      {item.photoUrl?<img src={item.photoUrl} alt="" style={{ width:36, height:36, borderRadius:'50%', objectFit:'cover', border:'1px solid var(--border)' }} onError={e=>e.target.style.display='none'}/>:<div style={{ width:36, height:36, borderRadius:'50%', background:'var(--bg-card2)', border:'1px solid var(--border)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0 }}>{tab==='genre'?'🏷️':item.name?.[0]?.toUpperCase()}</div>}
                      <div><div style={{ fontSize:14, fontWeight:500 }}>{item.name}</div>{item.bio&&<div style={{ fontSize:11, color:'var(--text-muted)', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{item.bio}</div>}</div>
                    </div>
                  </td>
                  {tab==='genre'?<td style={{ padding:'11px 16px', fontSize:13, color:'var(--text-muted)', fontFamily:'monospace' }}>{item.slug}</td>:<><td style={{ padding:'11px 16px', fontSize:13, color:'var(--text-sec)' }}>{item.nationality||'—'}</td><td style={{ padding:'11px 16px', fontSize:13, color:'var(--text-sec)' }}>{item.birthDate?new Date(item.birthDate).toLocaleDateString('vi-VN'):'—'}</td></>}
                  <td style={{ padding:'11px 16px' }}>
                    <div style={{ display:'flex', gap:6 }}>
                      <button onClick={()=>openEdit(item)} style={{ background:'none', border:'1px solid var(--border)', color:'var(--text-sec)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12, transition:'.15s' }} onMouseEnter={e=>{e.currentTarget.style.borderColor='var(--gold)';e.currentTarget.style.color='var(--gold)'}} onMouseLeave={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.color='var(--text-sec)'}}>✏️</button>
                      <button onClick={()=>handleDelete(item)} style={{ background:'none', border:'1px solid rgba(224,82,82,.3)', color:'var(--red)', borderRadius:4, padding:'3px 10px', cursor:'pointer', fontSize:12 }}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0&&<div style={{ textAlign:'center', padding:50, color:'var(--text-muted)' }}>{search?`Không tìm thấy ${tabLabel}`:`Chưa có ${tabLabel} nào`}</div>}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title={`${editing?'Sửa':'Thêm'} ${tabLabel}`} maxWidth={430}>
        <div style={{ display:'flex', flexDirection:'column', gap:13 }}>
          <div><Input label="Tên *" value={form.name||''} onChange={set('name')} placeholder={`Nhập tên ${tabLabel}`} style={inputErr(touched.name&&errors.name)}/><E f="name"/></div>
          {tab==='genre'?(
            <div>
              <Input label="Slug *" value={form.slug||''} onChange={set('slug')} placeholder="vd: hanh-dong" style={inputErr(touched.slug&&errors.slug)}/>
              <E f="slug"/>
              <span style={{ fontSize:11, color:'var(--text-muted)', display:'block', marginTop:2 }}>Chỉ chữ thường, số, gạch ngang. Tự điền khi nhập tên.</span>
            </div>
          ):(
            <>
              <div><Input label="Quốc tịch" value={form.nationality||''} onChange={set('nationality')} placeholder="Mỹ, Anh, Nhật..." style={inputErr(touched.nationality&&errors.nationality)}/><E f="nationality"/></div>
              <div><Input label="Ngày sinh" type="date" value={form.birthDate||''} onChange={set('birthDate')} style={inputErr(touched.birthDate&&errors.birthDate)}/><E f="birthDate"/></div>
              <div>
                <Input label="Ảnh (URL)" value={form.photoUrl||''} onChange={set('photoUrl')} placeholder="https://..." style={inputErr(touched.photoUrl&&errors.photoUrl)}/>
                <E f="photoUrl"/>
                {form.photoUrl&&!errors.photoUrl&&<img src={form.photoUrl} alt="" style={{ width:56, height:56, borderRadius:'50%', objectFit:'cover', border:'1px solid var(--border)', marginTop:6 }} onError={e=>e.target.style.display='none'}/>}
              </div>
              <div>
                <label style={{ fontSize:13, color:'var(--text-sec)', display:'block', marginBottom:6 }}>Tiểu sử</label>
                <textarea rows={3} value={form.bio||''} onChange={set('bio')} placeholder="Thông tin tiểu sử..." style={{ width:'100%', background:'var(--bg-card2)', border:'1px solid var(--border)', borderRadius:6, padding:'10px 12px', color:'var(--text-pri)', fontSize:14, fontFamily:"'DM Sans',sans-serif", outline:'none', resize:'vertical' }} onFocus={e=>e.target.style.borderColor='var(--gold)'} onBlur={e=>e.target.style.borderColor='var(--border)'}/>
              </div>
            </>
          )}
          {Object.values(errors).some(Boolean)&&Object.values(touched).some(Boolean)&&<div style={{ background:'rgba(224,82,82,.08)', border:'1px solid rgba(224,82,82,.3)', borderRadius:6, padding:'10px 14px', fontSize:12, color:'var(--red)' }}>⚠ Vui lòng sửa các lỗi phía trên</div>}
          <div style={{ display:'flex', gap:10, justifyContent:'flex-end', paddingTop:8, borderTop:'1px solid var(--border)' }}>
            <Button variant="ghost" size="md" onClick={()=>setModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleSave} loading={saving}>{editing?'Lưu':'Tạo'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
