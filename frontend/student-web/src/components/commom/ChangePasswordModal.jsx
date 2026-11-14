import { useEffect, useRef, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import Icon from './Icon'
import '../../styles/change-password.css'
import { changePassword, clearChangePasswordError, closeChangePassword } from '../../store/action/action'
import { PASSWORD_REQUIREMENTS } from '../../utils/passwordRules'

const EMPTY = { currentPassword: '', newPassword: '', confirmPassword: '' }

const FIELDS = [
  { name: 'currentPassword', label: 'Mật khẩu hiện tại', autoComplete: 'current-password' },
  { name: 'newPassword', label: 'Mật khẩu mới', autoComplete: 'new-password' },
  { name: 'confirmPassword', label: 'Xác nhận mật khẩu mới', autoComplete: 'new-password' },
]


export default function ChangePasswordModal() {
  const { open, submitting, fieldErrors, formError } = useSelector((s) => s.changePassword)
  if (!open) return null
  return <ChangePasswordForm submitting={submitting} fieldErrors={fieldErrors} formError={formError} />
}

function ChangePasswordForm({ submitting, fieldErrors, formError }) {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [form, setForm] = useState(EMPTY)
  const [visible, setVisible] = useState({})
  const firstInput = useRef(null)
  const openedAt = useRef(pathname)

  const close = () => !submitting && dispatch(closeChangePassword())

  useEffect(() => { firstInput.current?.focus() }, [])

  useEffect(() => {
    if (pathname !== openedAt.current) dispatch(closeChangePassword())
  }, [pathname, dispatch])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && !submitting && dispatch(closeChangePassword())
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [submitting, dispatch])

  const onChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) dispatch(clearChangePasswordError(name))
    if (name === 'newPassword' && fieldErrors.confirmPassword) dispatch(clearChangePasswordError('confirmPassword'))
  }

  const onSubmit = (e) => {
    e.preventDefault()
    if (submitting) return
    dispatch(changePassword(form, toast, navigate))
  }

  const toggle = (name) => setVisible((v) => ({ ...v, [name]: !v[name] }))

  return (
    <div className="cp-overlay">
      <section className="cp-card" role="dialog" aria-modal="true" aria-labelledby="cp-title">
        <header className="cp-head">
          <span className="cp-head__icon"><Icon name="lock" size={22} /></span>
          <div>
            <h2 id="cp-title">Đổi mật khẩu</h2>
            <p>Nhập mật khẩu hiện tại và đặt mật khẩu mới cho tài khoản của bạn.</p>
          </div>
          <button type="button" className="cp-close" onClick={close} aria-label="Đóng" disabled={submitting}>
            <Icon name="x" size={20} />
          </button>
        </header>

        <form onSubmit={onSubmit} noValidate>
          <div className="cp-body">
            {formError && <div className="cp-alert" role="alert">{formError}</div>}

            {FIELDS.map((f, i) => {
              const error = fieldErrors[f.name]
              const shown = !!visible[f.name]
              return (
                <div key={f.name} className={`cp-field ${error ? 'has-error' : ''}`}>
                  <label htmlFor={`cp-${f.name}`}>{f.label}</label>
                  <div className="cp-input">
                    <input
                      id={`cp-${f.name}`}
                      ref={i === 0 ? firstInput : undefined}
                      name={f.name}
                      type={shown ? 'text' : 'password'}
                      autoComplete={f.autoComplete}
                      value={form[f.name]}
                      onChange={onChange}
                      disabled={submitting}
                      aria-invalid={!!error}
                      aria-describedby={error ? `cp-${f.name}-error` : undefined}
                    />
                    <button
                      type="button"
                      className="cp-eye"
                      onClick={() => toggle(f.name)}
                      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                      tabIndex={-1}
                    >
                      <Icon name={shown ? 'eye-off' : 'eye'} size={18} />
                    </button>
                  </div>
                  {error && <span id={`cp-${f.name}-error`} className="cp-error" role="alert">{error}</span>}

                  {f.name === 'newPassword' && (
                    <ul className="cp-rules" aria-label="Yêu cầu mật khẩu">
                      {PASSWORD_REQUIREMENTS.map((r) => {
                        const ok = r.test(form.newPassword)
                        return (
                          <li key={r.key} className={ok ? 'ok' : ''}>
                            <Icon name={ok ? 'check' : 'circle'} size={14} />
                            {r.label}
                          </li>
                        )
                      })}
                    </ul>
                  )}
                </div>
              )
            })}
          </div>

          <footer className="cp-foot">
            <button type="button" className="ute-btn ute-btn--light" onClick={close} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="ute-btn" disabled={submitting}>
              {submitting ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </button>
          </footer>
        </form>
      </section>
    </div>
  )
}
