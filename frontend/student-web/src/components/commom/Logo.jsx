import { useState } from 'react'

/**
 * CHỖ ĐẶT LOGO HCM-UTE (nhỏ, nằm cùng hàng với tên trường trên thanh trên)
 * Chép file vào: public/hcmute-logo.png  (nền trong suốt, cao ~100px để nét)
 * Chưa có file thì hiện tạm huy hiệu "UTE".
 */
export const LOGO_SRC = '/hcmute-logo.png'
export const SCHOOL_NAME = 'Trường Đại học Công nghệ Kỹ thuật TP.HCM'

export default function Logo({ onClick }) {
  const [failed, setFailed] = useState(false)

  return (
    <a
      className="ute-logo"
      href="/"
      title={SCHOOL_NAME}
      onClick={(e) => {
        if (onClick) {
          e.preventDefault()
          onClick()
        }
      }}
    >
      {failed ? (
        <span className="ute-logo__fallback">UTE</span>
      ) : (
        <img className="ute-logo__img" src={LOGO_SRC} alt="HCM-UTE" onError={() => setFailed(true)} />
      )}
      <span className="ute-school">{SCHOOL_NAME}</span>
    </a>
  )
}
