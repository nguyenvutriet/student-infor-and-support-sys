/**
 * Hàm thuần (không phụ thuộc React/Redux) cho Lịch biểu cá nhân (UC17-20).
 * Ngày được lưu dạng khóa 'YYYY-MM-DD' (giờ địa phương) để tránh lệch múi giờ. Tuần bắt đầu từ Thứ hai.
 */
export const pad = (n) => String(n).padStart(2, '0')

export const toDateKey = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDateKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const todayKey = () => toDateKey(new Date())

export const addDays = (key, n) => { const d = parseDateKey(key); d.setDate(d.getDate() + n); return toDateKey(d) }
export const mondayOf = (key) => {
  const d = parseDateKey(key)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return toDateKey(d)
}

/** LocalDateTime của BE có thể là chuỗi ISO hoặc mảng [y,M,d,h,m,s] → luôn trả 'YYYY-MM-DDTHH:mm:ss'. */
export const toIsoLocal = (v) => {
  if (Array.isArray(v)) {
    const [y, M, d, h = 0, m = 0, s = 0] = v
    return `${y}-${pad(M)}-${pad(d)}T${pad(h)}:${pad(m)}:${pad(s)}`
  }
  return String(v ?? '').slice(0, 19)
}
export const dateKeyOf = (iso) => String(iso).slice(0, 10)
export const timeOf = (iso) => String(iso).slice(11, 16)

export const DAY_LABELS = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']
const WEEKDAY_LONG = ['Chủ nhật', 'Thứ hai', 'Thứ ba', 'Thứ tư', 'Thứ năm', 'Thứ sáu', 'Thứ bảy']

export const fmtDM = (key) => { const [, m, d] = key.split('-'); return `${d}/${m}` }
export const fmtDMY = (key) => { const [y, m, d] = key.split('-'); return `${d}/${m}/${y}` }
export const weekLabel = (weekStart) => `Tuần ${fmtDM(weekStart)} - ${fmtDMY(addDays(weekStart, 6))}`

/** "Thứ năm 22/10/2026, 14:00 - 16:00" */
export const formatWhen = (ev) => {
  const key = dateKeyOf(ev.startTime)
  return `${WEEKDAY_LONG[parseDateKey(key).getDay()]} ${fmtDMY(key)}, ${timeOf(ev.startTime)} - ${timeOf(ev.endTime)}`
}

/** Ngày đang được chọn trên lịch: ngày của lịch đang chọn → ngày bấm trên đầu cột (nếu trong tuần) → Thứ hai. */
export const getActiveDay = ({ weekStart, items, selectedId, pickedDay }) => {
  const selected = items.find((s) => s.scheduleId === selectedId)
  if (selected) return dateKeyOf(selected.startTime)
  const inWeek = pickedDay >= weekStart && pickedDay <= addDays(weekStart, 6)
  return inWeek ? pickedDay : weekStart
}

/* ---------- Form lịch biểu (UC18, UC19) ---------- */
export const REQUIRED_MSG = 'Vui lòng điền đầy đủ thông tin'
export const END_BEFORE_START_MSG = 'Giờ kết thúc phải sau giờ bắt đầu.'
export const MAX_TITLE = 255
export const MAX_SUBJECT = 255
export const MAX_NOTE = 1000

export const emptyScheduleForm = (date = '') => ({ title: '', subject: '', date, start: '', end: '', note: '' })

export const scheduleFormFromEvent = (ev) => ({
  title: ev.title ?? '',
  subject: ev.subject ?? '',
  date: dateKeyOf(ev.startTime),
  start: timeOf(ev.startTime),
  end: timeOf(ev.endTime),
  note: ev.note ?? '',
})

/** Trả về { field: message } – rỗng nghĩa là hợp lệ. */
export const validateScheduleForm = (v) => {
  const er = {}
  if (!v.title.trim()) er.title = REQUIRED_MSG
  if (!v.date) er.date = REQUIRED_MSG
  if (!v.start) er.start = REQUIRED_MSG
  if (!v.end) er.end = REQUIRED_MSG
  if (v.title.length > MAX_TITLE) er.title = `Tiêu đề tối đa ${MAX_TITLE} ký tự`
  if (v.start && v.end && v.end <= v.start) er.end = END_BEFORE_START_MSG
  return er
}

/** Body gửi BE (ScheduleEventRequest). */
export const buildSchedulePayload = (v) => ({
  title: v.title.trim(),
  subject: v.subject.trim(),
  startTime: `${v.date}T${v.start}:00`,
  endTime: `${v.date}T${v.end}:00`,
  note: v.note.trim(),
})
