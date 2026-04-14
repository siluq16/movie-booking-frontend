import { useState, useEffect } from 'react'
import { cinemaService, roomService, seatService } from '../../services/movieService'
import api from '../../services/api'
import Modal from '../../components/common/Modal'
import Input from '../../components/common/Input'
import Button from '../../components/common/Button'
import Spinner from '../../components/common/Spinner'
import toast from 'react-hot-toast'

const TYPE_COLOR={IMAX:'#4a9fd0','4DX':'#c070c0','3D':'#52c97c','2D':'#9e9a8e',Dolby:'#e07a42',ScreenX:'#a07ad0'}
const SEAT_TYPES=['standard','vip','couple','recliner','sweetbox']
const SEAT_STYLE={
  standard:{bg:'var(--bg-card2)',          border:'rgba(120,120,120,.5)',  color:'var(--text-sec)', label:'Thường',   price:'70.000đ'},
  vip:     {bg:'rgba(201,168,76,.14)',      border:'rgba(201,168,76,.55)', color:'#c9a84c',          label:'VIP',      price:'90.000đ'},
  couple:  {bg:'rgba(130,100,200,.14)',     border:'rgba(130,100,200,.55)',color:'#a07ad0',          label:'Couple',   price:'150.000đ'},
  recliner:{bg:'rgba(30,180,120,.14)',      border:'rgba(30,180,120,.55)', color:'#52c97c',          label:'Recliner', price:'120.000đ'},
  sweetbox:{bg:'rgba(200,60,120,.14)',      border:'rgba(200,60,120,.55)', color:'#e06090',          label:'Sweetbox', price:'200.000đ'},
}

function SeatMap({seats,editMode,editType,selectedSeats,onToggle,onRowToggle}){
  const[hovered,setHovered]=useState(null)
  if(!seats?.length)return(<div style={{textAlign:'center',padding:48,color:'var(--text-muted)'}}><div style={{fontSize:40,marginBottom:12}}>🪑</div><div style={{color:'var(--text-sec)',marginBottom:8}}>Chưa có sơ đồ ghế</div><div style={{fontSize:13}}>Nhấn "Tạo lại sơ đồ ghế" để khởi tạo</div></div>)
  const rows=[...new Set(seats.map(s=>s.rowLabel))].sort()
  return(
    <div>
      <div style={{textAlign:'center',marginBottom:24}}>
        <div style={{height:4,background:'linear-gradient(to right,transparent,var(--gold),transparent)',borderRadius:2,marginBottom:6,boxShadow:'0 0 16px rgba(201,168,76,.2)'}}/>
        <span style={{fontSize:10,color:'var(--text-muted)',letterSpacing:3}}>MÀN HÌNH</span>
      </div>
      <div style={{overflowX:'auto',paddingBottom:8}}>
        <div style={{display:'flex',flexDirection:'column',gap:6,alignItems:'center',minWidth:'fit-content',margin:'0 auto'}}>
          {rows.map(row=>(
            <div key={row} style={{display:'flex',gap:4,alignItems:'center'}}>
              <span onClick={()=>editMode&&onRowToggle(row)} style={{width:22,fontSize:11,color:editMode?'var(--gold)':'var(--text-muted)',textAlign:'right',flexShrink:0,cursor:editMode?'pointer':'default',fontWeight:editMode?600:400,userSelect:'none',title:'Click để chọn cả hàng'}}>{row}</span>
              {seats.filter(s=>s.rowLabel===row).sort((a,b)=>a.seatNumber-b.seatNumber).map(seat=>{
                const isCouple=seat.seatType==='couple'
                const isSel=selectedSeats.includes(seat.id)
                const sStyle=SEAT_STYLE[seat.seatType]||SEAT_STYLE.standard
                let bg=seat.isActive?sStyle.bg:'var(--bg-deep)'
                let border=seat.isActive?sStyle.border:'var(--border)'
                if(editMode&&isSel){const eStyle=SEAT_STYLE[editType];bg=eStyle.bg;border=eStyle.color}
                else if(!editMode&&hovered===seat.id&&seat.isActive){bg='var(--gold)';border='var(--gold-light)'}
                return(
                  <div key={seat.id} onClick={()=>editMode&&seat.isActive&&onToggle(seat.id)}
                    onMouseEnter={()=>setHovered(seat.id)} onMouseLeave={()=>setHovered(null)}
                    title={`${seat.rowLabel}${seat.seatNumber} · ${SEAT_STYLE[seat.seatType]?.label||seat.seatType}${!seat.isActive?' · Vô hiệu':''}`}
                    style={{width:isCouple?56:28,height:24,borderRadius:'4px 4px 2px 2px',background:bg,border:`1px solid ${border}`,cursor:editMode&&seat.isActive?'pointer':'default',transition:'.1s',opacity:!seat.isActive?.4:1,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9,color:isSel?SEAT_STYLE[editType]?.color:'transparent',fontWeight:700,userSelect:'none'}}
                  >{isSel&&'✓'}</div>
                )
              })}
              <span style={{width:22,fontSize:11,color:'var(--text-muted)',flexShrink:0}}>{row}</span>
            </div>
          ))}
        </div>
      </div>
      <div style={{display:'flex',flexWrap:'wrap',gap:14,justifyContent:'center',marginTop:20}}>
        {Object.entries(SEAT_STYLE).map(([type,s])=>(<div key={type} style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-sec)'}}><div style={{width:22,height:18,borderRadius:'2px 2px 1px 1px',background:s.bg,border:`1px solid ${s.border}`}}/><span>{s.label}</span><span style={{color:'var(--text-muted)',fontSize:11}}>{s.price}</span></div>))}
        <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'var(--text-sec)'}}><div style={{width:22,height:18,borderRadius:'2px 2px 1px 1px',background:'var(--bg-deep)',border:'1px solid var(--border)',opacity:.4}}/><span>Vô hiệu</span></div>
      </div>
      {hovered&&!editMode&&(()=>{const seat=seats.find(s=>s.id===hovered);if(!seat)return null;const sStyle=SEAT_STYLE[seat.seatType]||SEAT_STYLE.standard;return(<div style={{textAlign:'center',marginTop:10,fontSize:12,color:'var(--text-sec)'}}>Ghế <span style={{color:sStyle.color,fontWeight:600}}>{seat.rowLabel}{seat.seatNumber}</span> · {sStyle.label} · <span style={{color:'var(--gold)'}}>{sStyle.price}</span></div>)})()}
    </div>
  )
}

export default function ManageCinemasDetail() {
  const[cinemas,setCinemas]       =useState([])
  const[cityFilter,setCityFilter] =useState('all')
  const[selectedCinema,setSelC]   =useState(null)
  const[rooms,setRooms]           =useState([])
  const[selectedRoom,setSelR]     =useState(null)
  const[seats,setSeats]           =useState([])
  const[loading,setLoading]       =useState(true)
  const[seatsLoading,setSeatsL]   =useState(false)
  const[editMode,setEditMode]     =useState(false)
  const[editType,setEditType]     =useState('vip')
  const[selectedSeats,setSelSeats]=useState([])
  const[savingType,setSavingType] =useState(false)
  const[roomModal,setRoomModal]   =useState(false)
  const[genModal,setGenModal]     =useState(false)
  const[roomForm,setRoomForm]     =useState({name:'',roomType:'2D',totalSeats:100})
  const[genForm,setGenForm]       =useState({rowCount:8,seatsPerRow:10})
  const[saving,setSaving]         =useState(false)

  useEffect(()=>{
    cinemaService.getAll().then(r=>{const list=Array.isArray(r.data)?r.data:[];setCinemas(list)}).catch(()=>setCinemas([])).finally(()=>setLoading(false))
  },[])

  useEffect(()=>{
    if(!selectedCinema)return
    roomService.getByCinema(selectedCinema.id).then(r=>{setRooms(Array.isArray(r.data)?r.data:[]);setSelR(null);setSeats([])}).catch(()=>{setRooms([]);setSelR(null);setSeats([])})
  },[selectedCinema])

  const loadSeats=()=>{
    if(!selectedRoom)return
    setSeatsL(true)
    seatService.getByRoom(selectedRoom.id).then(r=>setSeats(Array.isArray(r.data)?r.data:[])).catch(()=>setSeats([])).finally(()=>setSeatsL(false))
  }
  useEffect(loadSeats,[selectedRoom])

  // City filter
  const cities=['all',...new Set(cinemas.map(c=>c.city).filter(Boolean))]
  const filteredCinemas=cityFilter==='all'?cinemas:cinemas.filter(c=>c.city===cityFilter)

  const toggleSeat=(id)=>setSelSeats(prev=>prev.includes(id)?prev.filter(s=>s!==id):[...prev,id])
  const toggleRow=(row)=>{
    const rowIds=seats.filter(s=>s.rowLabel===row&&s.isActive).map(s=>s.id)
    const allSel=rowIds.every(id=>selectedSeats.includes(id))
    setSelSeats(prev=>allSel?prev.filter(id=>!rowIds.includes(id)):[...new Set([...prev,...rowIds])])
  }
  const selectAll=()=>{const activeIds=seats.filter(s=>s.isActive).map(s=>s.id);const allSel=activeIds.every(id=>selectedSeats.includes(id));setSelSeats(allSel?[]:activeIds)}
  const cancelEdit=()=>{setEditMode(false);setSelSeats([])}

  const applyType=async()=>{
    if(selectedSeats.length===0){toast.error('Vui lòng chọn ít nhất một ghế');return}
    setSavingType(true)
    try{
      await seatService.update([
        {
          seatIds:selectedSeats,
          seatType:editType
        }
      ])
      toast.success(`Đã đổi ${selectedSeats.length} ghế sang "${SEAT_STYLE[editType]?.label}"`)
      setSelSeats([]);loadSeats()
    }catch{
      toast.error('Endpoint chưa được thêm vào backend (xem BACKEND_API_ADDITIONS.cs)',{duration:4000})
    }finally{setSavingType(false)}
  }

  const handleAddRoom=async()=>{
    if(!roomForm.name?.trim()){toast.error('Vui lòng nhập tên phòng');return}
    setSaving(true)
    try{await roomService.create({...roomForm,cinemaId:selectedCinema.id,totalSeats:parseInt(roomForm.totalSeats)});toast.success('Tạo phòng chiếu thành công!');setRoomModal(false);roomService.getByCinema(selectedCinema.id).then(r=>setRooms(Array.isArray(r.data)?r.data:[])).catch(()=>{})}
    catch(err){toast.error(err.response?.data?.message||'Không thể tạo phòng')}
    finally{setSaving(false)}
  }

  const handleGenSeats=async()=>{
    if(!selectedRoom)return
    setSaving(true)
    try{await seatService.generate({roomId:selectedRoom.id,rowCount:parseInt(genForm.rowCount),seatsPerRow:parseInt(genForm.seatsPerRow)});toast.success(`Đã tạo ${genForm.rowCount*genForm.seatsPerRow} ghế!`);setGenModal(false);loadSeats()}
    catch(err){toast.error(err.response?.data?.message||'Không thể tạo sơ đồ ghế')}
    finally{setSaving(false)}
  }

  const ssb={width:'100%',background:'var(--bg-card2)',border:'1px solid var(--border)',borderRadius:6,padding:'10px 12px',color:'var(--text-pri)',fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none'}
  const seatStats=seats.reduce((acc,s)=>{if(!s.isActive){acc.inactive++;return acc};acc[s.seatType]=(acc[s.seatType]||0)+1;acc.total++;return acc},{total:0,inactive:0})

  return (
    <div>
      <h1 style={{fontFamily:"'Playfair Display',serif",fontSize:26,marginBottom:28}}>Chi Tiết Rạp & <span style={{color:'var(--gold)'}}>Sơ Đồ Ghế</span></h1>

      <div style={{display:'grid',gridTemplateColumns:'260px 1fr',gap:24,alignItems:'start'}}>
        {/* Left */}
        <div>
          {/* City filter */}
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)',letterSpacing:.5,marginBottom:10}}>LỌC THEO THÀNH PHỐ</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {cities.map(city=>(
                <button key={city} onClick={()=>{setCityFilter(city);setSelC(null);setRooms([]);setSelR(null);setSeats([])}}
                  style={{padding:'5px 12px',borderRadius:16,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:`1px solid ${cityFilter===city?'var(--gold)':'var(--border)'}`,background:cityFilter===city?'rgba(201,168,76,.12)':'transparent',color:cityFilter===city?'var(--gold)':'var(--text-sec)',transition:'.15s',whiteSpace:'nowrap'}}>
                  {city==='all'?`🌐 Tất cả (${cinemas.length})`:city}
                  {city!=='all'&&<span style={{opacity:.6,marginLeft:4}}>({cinemas.filter(c=>c.city===city).length})</span>}
                </button>
              ))}
            </div>
          </div>

          {/* Cinema list */}
          <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:16,marginBottom:12}}>
            <div style={{fontSize:11,color:'var(--text-muted)',letterSpacing:.5,marginBottom:12}}>CHỌN RẠP ({filteredCinemas.length})</div>
            {loading?<div style={{display:'flex',justifyContent:'center',padding:16}}><Spinner/></div>
              :filteredCinemas.length===0?<div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:16}}>Không có rạp nào tại thành phố này</div>
              :filteredCinemas.map(c=>(
              <button key={c.id} onClick={()=>setSelC(c)}
                style={{width:'100%',padding:'9px 12px',borderRadius:6,marginBottom:4,border:`1px solid ${selectedCinema?.id===c.id?'var(--gold)':'transparent'}`,background:selectedCinema?.id===c.id?'rgba(201,168,76,.08)':'none',cursor:'pointer',textAlign:'left',color:selectedCinema?.id===c.id?'var(--gold)':'var(--text-sec)',fontSize:13,fontFamily:"'DM Sans',sans-serif",transition:'.15s'}}>
                🏛️ {c.name}
                <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>📍 {c.city}{c.district?`, ${c.district}`:''}</div>
              </button>
            ))}
          </div>

          {/* Room list */}
          {selectedCinema&&(
            <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:16}}>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
                <div style={{fontSize:11,color:'var(--text-muted)',letterSpacing:.5}}>PHÒNG CHIẾU ({rooms.length})</div>
                <button onClick={()=>setRoomModal(true)} style={{background:'var(--gold)',border:'none',color:'#000',fontSize:11,padding:'3px 9px',borderRadius:3,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",fontWeight:600}}>+ Thêm</button>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {rooms.map(r=>{const tc=TYPE_COLOR[r.roomType]||'#9e9a8e';return(
                  <button key={r.id} onClick={()=>setSelR(selectedRoom?.id===r.id?null:r)}
                    style={{width:'100%',padding:'10px 12px',borderRadius:6,border:`1px solid ${selectedRoom?.id===r.id?'var(--gold)':'var(--border)'}`,background:selectedRoom?.id===r.id?'rgba(201,168,76,.06)':'var(--bg-card2)',cursor:'pointer',textAlign:'left',fontFamily:"'DM Sans',sans-serif",transition:'.15s'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:13,color:selectedRoom?.id===r.id?'var(--gold)':'var(--text-pri)',fontWeight:selectedRoom?.id===r.id?500:400}}>{r.name}</span>
                      <span style={{fontSize:10,color:tc,background:`${tc}22`,border:`1px solid ${tc}44`,padding:'1px 6px',borderRadius:2,fontWeight:600}}>{r.roomType}</span>
                    </div>
                    <div style={{fontSize:11,color:'var(--text-muted)',marginTop:3}}>{r.totalSeats} ghế · {r.isActive?'✓ Hoạt động':'✗ Tạm đóng'}</div>
                  </button>
                )})}
                {rooms.length===0&&<div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',padding:16}}>Chưa có phòng chiếu</div>}
              </div>
            </div>
          )}
        </div>

        {/* Right: seat map */}
        <div style={{background:'var(--bg-card)',border:'1px solid var(--border)',borderRadius:10,padding:28}}>
          {selectedRoom?(
            <>
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:20,flexWrap:'wrap',gap:12}}>
                <div>
                  <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:4}}>{selectedRoom.name}</h3>
                  <div style={{fontSize:13,color:'var(--text-sec)'}}>{selectedRoom.roomType} · {selectedRoom.totalSeats} ghế · {selectedRoom.isActive?'✓ Hoạt động':'✗ Tạm đóng'}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  {!editMode?<button onClick={()=>setEditMode(true)} style={{background:'rgba(201,168,76,.1)',border:'1px solid var(--border-gold)',color:'var(--gold)',borderRadius:4,padding:'6px 14px',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>✏️ Chỉnh loại ghế</button>:null}
                  <Button variant="outline" size="sm" onClick={()=>setGenModal(true)}>🔄 Tạo lại sơ đồ</Button>
                </div>
              </div>

              {/* Edit toolbar */}
              {editMode&&(
                <div style={{background:'var(--bg-card2)',border:'1px solid var(--border-gold)',borderRadius:8,padding:'14px 16px',marginBottom:20,display:'flex',alignItems:'center',gap:14,flexWrap:'wrap'}}>
                  <div style={{fontSize:13,color:'var(--text-sec)',whiteSpace:'nowrap'}}>Đã chọn: <span style={{color:'var(--gold)',fontWeight:500}}>{selectedSeats.length}</span> ghế → Đổi sang:</div>
                  <div style={{display:'flex',gap:7,flex:1,flexWrap:'wrap'}}>
                    {SEAT_TYPES.map(type=>{const s=SEAT_STYLE[type];return(
                      <button key={type} type="button" onClick={()=>setEditType(type)} style={{padding:'5px 14px',borderRadius:4,fontSize:12,cursor:'pointer',fontFamily:"'DM Sans',sans-serif",border:`1px solid ${editType===type?s.color:'var(--border)'}`,background:editType===type?s.bg:'transparent',color:editType===type?s.color:'var(--text-sec)',fontWeight:editType===type?600:400,transition:'.15s'}}>{s.label}</button>
                    )})}
                  </div>
                  <div style={{display:'flex',gap:8}}>
                    <button onClick={selectAll} style={{background:'var(--bg-card)',border:'1px solid var(--border)',color:'var(--text-sec)',borderRadius:4,padding:'5px 12px',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Chọn tất cả</button>
                    <Button variant="primary" size="sm" onClick={applyType} loading={savingType}>Áp dụng</Button>
                    <button onClick={cancelEdit} style={{background:'none',border:'1px solid var(--border)',color:'var(--text-sec)',borderRadius:4,padding:'5px 12px',cursor:'pointer',fontSize:12,fontFamily:"'DM Sans',sans-serif"}}>Hủy</button>
                  </div>
                </div>
              )}

              {/* Seat type stats */}
              {seats.length>0&&(
                <div style={{display:'flex',gap:10,flexWrap:'wrap',marginBottom:20}}>
                  {Object.entries(seatStats).filter(([k])=>SEAT_TYPES.includes(k)).map(([type,count])=>{const s=SEAT_STYLE[type];return(<div key={type} style={{background:s.bg,border:`1px solid ${s.border}`,borderRadius:6,padding:'5px 12px',fontSize:12,color:s.color}}>{s.label}: <strong>{count}</strong></div>)})}
                  {seatStats.inactive>0&&<div style={{background:'rgba(90,88,80,.15)',border:'1px solid var(--border)',borderRadius:6,padding:'5px 12px',fontSize:12,color:'var(--text-muted)'}}>Vô hiệu: <strong>{seatStats.inactive}</strong></div>}
                </div>
              )}

              {seatsLoading?<div style={{display:'flex',justifyContent:'center',padding:48}}><Spinner/></div>:(
                <SeatMap seats={seats} editMode={editMode} editType={editType} selectedSeats={selectedSeats} onToggle={toggleSeat} onRowToggle={toggleRow}/>
              )}

              {seats.length>0&&(
                <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:12,marginTop:24}}>
                  {[['Tổng ghế',seats.length,'var(--text-pri)'],['Đang dùng',seats.filter(s=>s.isActive).length,'var(--green)'],['Vô hiệu',seats.filter(s=>!s.isActive).length,'var(--text-muted)']].map(([l,v,c])=>(
                    <div key={l} style={{background:'var(--bg-card2)',borderRadius:8,padding:'12px 16px',textAlign:'center'}}>
                      <div style={{fontSize:22,fontWeight:500,color:c}}>{v}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)'}}>{l}</div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ):(
            <div style={{textAlign:'center',padding:'60px 20px',color:'var(--text-muted)'}}>
              <div style={{fontSize:48,marginBottom:16}}>🗺️</div>
              <div style={{fontSize:15,color:'var(--text-sec)',marginBottom:8}}>{selectedCinema?`Rạp: ${selectedCinema.name}`:'Chọn thành phố → Chọn rạp → Chọn phòng chiếu'}</div>
              <div style={{fontSize:13}}>để xem và chỉnh sửa sơ đồ ghế</div>
            </div>
          )}
        </div>
      </div>

      {/* Add Room Modal */}
      <Modal open={roomModal} onClose={()=>setRoomModal(false)} title="Thêm phòng chiếu" maxWidth={420}>
        <div style={{display:'flex',flexDirection:'column',gap:14}}>
          <Input label="Tên phòng *" value={roomForm.name} onChange={e=>setRoomForm(f=>({...f,name:e.target.value}))} placeholder="VD: Phòng IMAX 1"/>
          <div><label style={{fontSize:13,color:'var(--text-sec)',display:'block',marginBottom:6}}>Loại phòng</label><select value={roomForm.roomType} onChange={e=>setRoomForm(f=>({...f,roomType:e.target.value}))} style={{...ssb}}>{ ['2D','3D','IMAX','4DX','Dolby','ScreenX'].map(t=><option key={t}>{t}</option>)}</select></div>
          <Input label="Tổng số ghế (dự kiến)" type="number" value={roomForm.totalSeats} onChange={e=>setRoomForm(f=>({...f,totalSeats:e.target.value}))}/>
          <div style={{fontSize:12,color:'var(--text-muted)',background:'var(--bg-card2)',padding:10,borderRadius:6}}>💡 Sau khi tạo phòng, dùng "Tạo lại sơ đồ ghế" để sinh ghế tự động.</div>
          <div style={{display:'flex',gap:10,justifyContent:'flex-end'}}>
            <Button variant="ghost" size="md" onClick={()=>setRoomModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleAddRoom} loading={saving}>Tạo phòng</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Seats Modal */}
      <Modal open={genModal} onClose={() => setGenModal(false)} title={`Tạo sơ đồ ghế — ${selectedRoom?.name}`} maxWidth={450}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          
          {/* ĐÃ SỬA: Cập nhật câu thông báo cho Admin biết hệ thống tự chia ghế */}
          <div style={{ background: 'rgba(201,168,76,.06)', border: '1px solid var(--border-gold)', borderRadius: 6, padding: 12, fontSize: 13, color: 'var(--text-sec)' }}>
            ⚠️ Hành động này <strong>xóa toàn bộ sơ đồ ghế hiện tại</strong> và tạo lại từ đầu. <br/>
            💡 Hệ thống sẽ tự động phân bổ vùng ghế (VIP, Sweetbox, Recliner...) chuẩn hóa theo định dạng phòng <strong>{selectedRoom?.roomType}</strong>.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input label="Số hàng (A→P, tối đa 16)" type="number" value={genForm.rowCount} onChange={e => setGenForm(f => ({ ...f, rowCount: Math.min(16, Math.max(1, parseInt(e.target.value) || 1)) }))} />
            <Input label="Ghế mỗi hàng (tối đa 20)" type="number" value={genForm.seatsPerRow} onChange={e => setGenForm(f => ({ ...f, seatsPerRow: Math.min(20, Math.max(1, parseInt(e.target.value) || 1)) }))} />
          </div>
          
          <div style={{ textAlign: 'center', background: 'var(--bg-card2)', borderRadius: 6, padding: 12 }}>
            <span style={{ fontSize: 24, fontFamily: "'Playfair Display',serif", color: 'var(--gold)' }}>{genForm.rowCount * genForm.seatsPerRow}</span>
            <span style={{ fontSize: 14, color: 'var(--text-sec)', marginLeft: 8 }}>ghế sẽ được tạo</span>
          </div>
          
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Hàng: {Array.from({ length: Math.min(genForm.rowCount, 16) }, (_, i) => String.fromCharCode(65 + i)).join(', ')}</div>
          
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" size="md" onClick={() => setGenModal(false)}>Hủy</Button>
            <Button variant="primary" size="md" onClick={handleGenSeats} loading={saving}>Tạo sơ đồ ghế</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
