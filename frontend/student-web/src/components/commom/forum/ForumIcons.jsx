// Bộ icon riêng của Diễn đàn (SVG tự chứa, không phụ thuộc Icon.jsx), kiểu Facebook:
//  - icon màu (Ảnh/Video, GIF, Tệp) cho thanh "Thêm vào bài viết của bạn"
//  - icon nét (Thích, Bình luận, Lưu, Báo cáo, ...) lấy màu theo chữ (currentColor)

const svgProps = (size) => ({ width: size, height: size, viewBox: '0 0 24 24', 'aria-hidden': true, focusable: false })
const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }

/** Ảnh / Video – xanh lá */
export function PhotoVideoIcon({ size = 26 }) {
  return (
    <svg {...svgProps(size)}>
      <rect x="2" y="4" width="20" height="16" rx="3.5" fill="#45bd62" />
      <circle cx="8.3" cy="9.3" r="2" fill="#fff" />
      <path d="M3.5 18.2l5.2-5.6 3.6 3.9 3.1-3.3 5.1 5z" fill="#fff" opacity=".95" />
    </svg>
  )
}

/** Ảnh GIF – xanh ngọc */
export function GifIcon({ size = 26 }) {
  return (
    <svg {...svgProps(size)}>
      <rect x="2" y="5" width="20" height="14" rx="4" fill="#1fb6c1" />
      <text x="12" y="15.4" textAnchor="middle" fontSize="8.6" fontWeight="800" fill="#fff" fontFamily="Arial, Helvetica, sans-serif">GIF</text>
    </svg>
  )
}

/** Tệp đính kèm – vàng cam */
export function FileAttachIcon({ size = 26 }) {
  return (
    <svg {...svgProps(size)}>
      <path d="M6 2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z" fill="#f7b928" />
      <path d="M14 2l6 6h-4a2 2 0 0 1-2-2z" fill="#fff" opacity=".6" />
      <path d="M8 13h8M8 17h5.5" stroke="#fff" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  )
}

/** Thích (ngón cái) */
export function LikeIcon({ size = 20, filled = false }) {
  return (
    <svg {...svgProps(size)} {...stroke} fill={filled ? 'currentColor' : 'none'}>
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3z" />
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
    </svg>
  )
}

/** Bình luận (bong bóng tròn) */
export function CommentIcon({ size = 20 }) {
  return (
    <svg {...svgProps(size)} {...stroke}>
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  )
}

/** Lưu bài viết (dấu trang) */
export function BookmarkIcon({ size = 20, filled = false }) {
  return (
    <svg {...svgProps(size)} {...stroke} fill={filled ? 'currentColor' : 'none'}>
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  )
}

/** Báo cáo (bong bóng có dấu chấm than) */
export function ReportIcon({ size = 20 }) {
  return (
    <svg {...svgProps(size)} {...stroke}>
      <path d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-6l-4 4v-4H5a2 2 0 0 1-2-2z" />
      <path d="M12 7.5v4M12 14.2h.01" />
    </svg>
  )
}

/** Nút "..." (ba chấm ngang) */
export function MoreIcon({ size = 22 }) {
  return (
    <svg {...svgProps(size)} fill="currentColor">
      <circle cx="5" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="19" cy="12" r="2" />
    </svg>
  )
}

/** Tải xuống */
export function DownloadIcon({ size = 20 }) {
  return (
    <svg {...svgProps(size)} {...stroke}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <path d="M7 10l5 5 5-5" />
      <path d="M12 15V3" />
    </svg>
  )
}

/** Đóng (X) */
export function CloseIcon({ size = 22 }) {
  return (
    <svg {...svgProps(size)} {...stroke}>
      <path d="M18 6L6 18M6 6l12 12" />
    </svg>
  )
}

/** Mũi tên trái / phải */
export function ChevronIcon({ dir = 'right', size = 24 }) {
  return (
    <svg {...svgProps(size)} {...stroke}>
      <path d={dir === 'left' ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
    </svg>
  )
}

/** Tải lại / Thử lại (hai mũi tên xoay vòng). spinning = true → icon quay (đang tải) */
export function RefreshIcon({ size = 18, spinning = false }) {
  return (
    <svg {...svgProps(size)} {...stroke} className={spinning ? 'fm-spin' : undefined}>
      <path d="M23 4v6h-6" />
      <path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
