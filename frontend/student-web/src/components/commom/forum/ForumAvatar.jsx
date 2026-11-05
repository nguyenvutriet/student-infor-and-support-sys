import { initials } from './forumUtils'

export default function ForumAvatar({ name, src, size = 40 }) {
  return (
    <span className="ute-avatar" style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {src ? <img src={src} alt="" /> : initials(name)}
    </span>
  )
}
