// Logo khoa/viện: dùng logoUrl nếu BE có, ngược lại hiện chữ viết tắt trên nền màu theo mã khoa.
const COLORS = ['#00599c', '#1e7b34', '#a85a00', '#7b3fa0', '#b02a37', '#0e7c86', '#5b6b00']

const initialsOf = (name = '', id = '') => {
  const clean = name.replace(/^(khoa|viện|trung tâm)\s+/i, '').trim()
  const w = clean.split(/\s+/).filter(Boolean)
  const s = w.length >= 2 ? w.slice(0, 2).map((x) => x[0]).join('') : (w[0] || id || '?').slice(0, 2)
  return s.toUpperCase()
}

export default function DepartmentLogo({ department, size = 56 }) {
  const { logoUrl, name, departmentId } = department
  const hash = [...String(departmentId || name || '')].reduce((a, c) => a + c.charCodeAt(0), 0)
  const style = { width: size, height: size, fontSize: Math.round(size * 0.36) }
  if (logoUrl) return <img className="sty-logo sty-logo--img" style={style} src={logoUrl} alt={`Logo ${name}`} />
  return <span className="sty-logo" style={{ ...style, background: COLORS[hash % COLORS.length] }} aria-hidden="true">{initialsOf(name, departmentId)}</span>
}
