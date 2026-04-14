// Kiểm tra an toàn: Đã có 'Z' hoặc đã có múi giờ (+07:00, -05:00) thì không nối thêm 'Z'
export const parseLocal = (datetime) => {
  if (typeof datetime !== 'string' || !datetime) return datetime;
  return datetime.replace(' ', 'T');
};
// Hàm helper để chặn lỗi "Invalid Date" hiển thị lên UI
const getSafeDate = (datetime) => {
  if (!datetime) return null;
  const date = new Date(parseLocal(datetime));
  return isNaN(date.getTime()) ? null : date;
};

export const formatCurrency = (amount) => {
  if (amount == null || isNaN(amount)) return '0đ';
  // Cách chuẩn xác hơn để format tiền tệ (tự động có dấu chấm/phẩy tùy môi trường)
  return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export const formatTime = (datetime) => {
  const date = getSafeDate(datetime);
  if (!date) return '—';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
};

export const formatDate = (datetime) => {
  const date = getSafeDate(datetime);
  if (!date) return '—';
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const weekday = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  return `${weekday}, ${day}/${month}`;
};

export const formatDateFull = (datetime) => {
  const date = getSafeDate(datetime);
  return date ? date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—';
};

export const formatDuration = (minutes) => {
  if (!minutes || minutes <= 0) return '0p';
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return h > 0 ? `${h}h${m > 0 ? m + 'p' : ''}` : `${m}p`;
};

export const formatRating = (rating) => {
  // Chỉ in '—' khi rating thật sự là null hoặc undefined, cho phép rating = 0
  if (rating == null || rating === '') return '—';
  return Number(rating).toFixed(1);
};