import { initials } from './chatUtils'

const COLORS = ['#cfe3f3', '#fde7c7', '#d9f0dc', '#eadcf8', '#fcdcdc', '#d6f0f2']

export default function Avatar({ name = '', size = 40 }) {
  const color = COLORS[[...name].reduce((s, c) => s + c.charCodeAt(0), 0) % COLORS.length]
  return (
    <span className="cx-avatar" style={{ width: size, height: size, background: color, fontSize: size * 0.38 }}>
      {initials(name)}
    </span>
  )
}
