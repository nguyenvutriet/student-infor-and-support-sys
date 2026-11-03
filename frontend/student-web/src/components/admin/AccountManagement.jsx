
import { useEffect, useMemo, useState } from 'react'
import Card, { PageHead, SearchField } from '../commom/Card'
import { adminAccountApi } from '../../api/adminAccountApi'
import '../../styles/accounts.css'

const EMPTY_FORM = {
  userId: '',
  fullName: '',
  email: '',
  role: 'STUDENT',
  status: 'ACTIVE',
  password: '',
}

const ROLE_LABEL = {
  STUDENT: 'Sinh viên',
  STAFF: 'Nhân viên',
  ADMIN: 'Quản trị viên',
}

const STATUS_LABEL = {
  ACTIVE: 'Hoạt động',
  LOCKED: 'Đã khóa',
}

function normalizeAccount(item) {
  return {
    id: item.userId ?? item.id,
    userId: item.userId ?? item.id,
    fullName: item.fullName ?? '',
    email: item.email ?? '',
    role: item.role ?? 'STUDENT',
    status: item.status ?? 'ACTIVE',
    major: item.major ?? '',
    departmentName: item.departmentName ?? '',
  }
}

export default function AccountManagement() {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [role, setRole] = useState('ALL')
  const [status, setStatus] = useState('ALL')
  const [page, setPage] = useState(1)
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')

  const pageSize = 8

  async function loadAccounts() {
    setLoading(true)
    setError('')

    try {
      const data = await adminAccountApi.list()
      const rows = Array.isArray(data)
        ? data
        : data?.content ?? data?.data ?? []

      setAccounts(rows.map(normalizeAccount))
    } catch (e) {
      setError(e.message || 'Không thể tải danh sách tài khoản.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAccounts()
  }, [])

  const filtered = useMemo(() => {
    const keyword = search.trim().toLowerCase()

    return accounts.filter((account) => {
      const matchText =
        !keyword ||
        [account.userId, account.fullName, account.email].some((value) =>
          String(value || '').toLowerCase().includes(keyword)
        )

      const matchRole = role === 'ALL' || account.role === role
      const matchStatus = status === 'ALL' || account.status === status

      return matchText && matchRole && matchStatus
    })
  }, [accounts, search, role, status])

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize))
  const currentPage = Math.min(page, totalPages)

  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  )

  const stats = {
    total: accounts.length,
    active: accounts.filter((a) => a.status === 'ACTIVE').length,
    locked: accounts.filter((a) => a.status === 'LOCKED').length,
    staff: accounts.filter((a) => a.role === 'STAFF').length,
  }

  function openCreate() {
    setForm(EMPTY_FORM)
    setModal({ type: 'create' })
    setError('')
  }

  function openEdit(account) {
    setForm({
      ...EMPTY_FORM,
      ...account,
      password: '',
    })
    setModal({ type: 'edit', id: account.userId })
    setError('')
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setError('')
    setNotice('')

    try {
      const payload = {
        userId: form.userId.trim(),
        fullName: form.fullName.trim(),
        email: form.email.trim(),
        role: form.role,
        status: form.status,
        ...(form.password ? { password: form.password } : {}),
      }

      if (modal.type === 'create') {
        await adminAccountApi.create(payload)
      } else {
        await adminAccountApi.update(modal.id, payload)
      }

      setModal(null)
      setNotice(
        modal.type === 'create'
          ? 'Đã tạo tài khoản thành công.'
          : 'Đã cập nhật tài khoản thành công.'
      )

      await loadAccounts()
    } catch (e) {
      setError(e.message || 'Không thể lưu tài khoản.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleStatus(account) {
    const next = account.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE'
    const action = next === 'LOCKED' ? 'Khóa' : 'Mở khóa'

    if (!window.confirm(`${action} tài khoản ${account.userId}?`)) return

    setError('')
    setNotice('')

    try {
      await adminAccountApi.changeStatus(account.userId, next)

      setNotice(
        `Đã ${next === 'LOCKED' ? 'khóa' : 'mở khóa'} tài khoản ${account.userId}.`
      )

      await loadAccounts()
    } catch (e) {
      setError(e.message || 'Không thể cập nhật trạng thái.')
    }
  }

  function updateForm(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  return (
    <div className="account-page">
      <PageHead
        title="Quản lý tài khoản"
        subtitle="Quản lý thông tin và trạng thái tài khoản trong hệ thống."
      />

      {/* Thống kê */}
      <section className="account-stats">
        <div className="account-stat">
          <div className="account-stat__top">
            <span>Tổng tài khoản</span>
            <span className="account-stat__symbol">01</span>
          </div>
          <strong>{stats.total}</strong>
          <small>Tất cả tài khoản trong hệ thống</small>
        </div>

        <div className="account-stat account-stat--active">
          <div className="account-stat__top">
            <span>Đang hoạt động</span>
            <span className="account-stat__symbol">02</span>
          </div>
          <strong>{stats.active}</strong>
          <small>Tài khoản đang được sử dụng</small>
        </div>

        <div className="account-stat account-stat--locked">
          <div className="account-stat__top">
            <span>Đã khóa</span>
            <span className="account-stat__symbol">03</span>
          </div>
          <strong>{stats.locked}</strong>
          <small>Tài khoản đã bị khóa</small>
        </div>

        <div className="account-stat account-stat--staff">
          <div className="account-stat__top">
            <span>Nhân viên</span>
            <span className="account-stat__symbol">04</span>
          </div>
          <strong>{stats.staff}</strong>
          <small>Tài khoản thuộc vai trò nhân viên</small>
        </div>
      </section>

      {/* Danh sách tài khoản */}
      <Card
        title="Danh sách tài khoản"
        action={
          <button type="button" className="ute-btn" onClick={openCreate}>
            <span>＋</span> Thêm tài khoản
          </button>
        }
      >
        <div className="account-toolbar">
          <div className="account-toolbar__search">
            <SearchField
              placeholder="Tìm mã, họ tên hoặc email..."
              value={search}
              onChange={(value) => {
                setSearch(value)
                setPage(1)
              }}
            />
          </div>

          <div className="account-toolbar__filters">
            <select
              className="account-filter"
              value={role}
              onChange={(e) => {
                setRole(e.target.value)
                setPage(1)
              }}
            >
              <option value="ALL">Tất cả vai trò</option>
              <option value="STUDENT">Sinh viên</option>
              <option value="STAFF">Nhân viên</option>
              <option value="ADMIN">Quản trị viên</option>
            </select>

            <select
              className="account-filter"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value)
                setPage(1)
              }}
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="ACTIVE">Hoạt động</option>
              <option value="LOCKED">Đã khóa</option>
            </select>
          </div>
        </div>

        {notice && (
          <div className="account-message account-message--success">
            {notice}
          </div>
        )}

        {error && (
          <div className="account-message account-message--error">
            {error}
          </div>
        )}

        {loading ? (
          <div className="account-loading">
            <span className="account-loading__spinner" />
            Đang tải danh sách tài khoản...
          </div>
        ) : (
          <>
            <div className="ute-tablewrap account-table-wrapper">
              <table className="ute-table account-table">
                <thead>
                  <tr>
                    <th>Mã tài khoản</th>
                    <th>Họ và tên</th>
                    <th>Email</th>
                    <th>Vai trò</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>

                <tbody>
                  {visible.map((account) => (
                    <tr key={account.userId}>
                      <td>
                        <strong className="account-id">
                          {account.userId}
                        </strong>
                      </td>

                      <td>
                        <span className="account-name">
                          {account.fullName}
                        </span>
                      </td>

                      <td>{account.email}</td>

                      <td>
                        <span className="account-role">
                          {ROLE_LABEL[account.role] || account.role}
                        </span>
                      </td>

                      <td>
                        <span
                          className={`account-status ${
                            account.status === 'ACTIVE'
                              ? 'account-status--active'
                              : 'account-status--locked'
                          }`}
                        >
                          <span className="account-status__dot" />
                          {STATUS_LABEL[account.status] || account.status}
                        </span>
                      </td>

                      <td>
                        <div className="account-actions">
                          <button
                            type="button"
                            className="account-link"
                            onClick={() => openEdit(account)}
                          >
                            Chỉnh sửa
                          </button>

                          <button
                            type="button"
                            className={`account-link ${
                              account.status === 'ACTIVE'
                                ? 'account-link--danger'
                                : 'account-link--success'
                            }`}
                            onClick={() => toggleStatus(account)}
                          >
                            {account.status === 'ACTIVE' ? 'Khóa' : 'Mở khóa'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}

                  {!visible.length && (
                    <tr>
                      <td colSpan="6" className="account-empty">
                        <strong>Không tìm thấy tài khoản</strong>
                        <span>
                          Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                        </span>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="account-pagination">
              <span>
                Hiển thị{' '}
                {filtered.length ? (currentPage - 1) * pageSize + 1 : 0}
                {' - '}
                {Math.min(currentPage * pageSize, filtered.length)}
                {' / '}
                {filtered.length} tài khoản
              </span>

              <div className="account-pagination__controls">
                <button
                  type="button"
                  disabled={currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  Trước
                </button>

                <strong>
                  {currentPage} / {totalPages}
                </strong>

                <button
                  type="button"
                  disabled={currentPage >= totalPages}
                  onClick={() =>
                    setPage((p) => Math.min(totalPages, p + 1))
                  }
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </Card>

      {/* Modal thêm / chỉnh sửa */}
      {modal && (
        <div
          className="account-modal-backdrop"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !saving) {
              setModal(null)
            }
          }}
        >
          <form className="account-modal" onSubmit={submitForm}>
            <div className="account-modal-head">
              <div>
                <span className="account-modal-eyebrow">
                  QUẢN LÝ NGƯỜI DÙNG
                </span>
                <h2>
                  {modal.type === 'create'
                    ? 'Thêm tài khoản mới'
                    : 'Cập nhật tài khoản'}
                </h2>
                <p>
                  {modal.type === 'create'
                    ? 'Nhập thông tin để tạo tài khoản trong hệ thống.'
                    : 'Chỉnh sửa thông tin tài khoản đã chọn.'}
                </p>
              </div>

              <button
                type="button"
                className="account-modal-close"
                disabled={saving}
                onClick={() => setModal(null)}
                aria-label="Đóng"
              >
                ×
              </button>
            </div>

            <div className="account-form-grid">
              <label className="account-form-field">
                <span>Mã tài khoản <b>*</b></span>
                <input
                  required
                  disabled={modal.type === 'edit'}
                  value={form.userId}
                  onChange={(e) => updateForm('userId', e.target.value)}
                  placeholder="Ví dụ: STU001"
                />
              </label>

              <label className="account-form-field">
                <span>Họ và tên <b>*</b></span>
                <input
                  required
                  maxLength="150"
                  value={form.fullName}
                  onChange={(e) => updateForm('fullName', e.target.value)}
                  placeholder="Nhập họ và tên"
                />
              </label>

              <label className="account-form-field account-form-field--full">
                <span>Email <b>*</b></span>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateForm('email', e.target.value)}
                  placeholder="example@domain.com"
                />
              </label>

              <label className="account-form-field">
                <span>Vai trò <b>*</b></span>
                <select
                  value={form.role}
                  disabled={modal.type === 'edit'}
                  onChange={(e) => updateForm('role', e.target.value)}
                >
                  <option value="STUDENT">Sinh viên</option>
                  <option value="STAFF">Nhân viên</option>
                  <option value="ADMIN">Quản trị viên</option>
                </select>
              </label>

              <label className="account-form-field">
                <span>
                  {modal.type === 'create'
                    ? 'Mật khẩu khởi tạo'
                    : 'Mật khẩu mới'}
                  {modal.type === 'create' && <b> *</b>}
                </span>
                <input
                  type="password"
                  minLength="8"
                  required={modal.type === 'create'}
                  value={form.password}
                  onChange={(e) => updateForm('password', e.target.value)}
                  placeholder={
                    modal.type === 'create'
                      ? 'Tối thiểu 8 ký tự'
                      : 'Để trống nếu không đổi'
                  }
                />
              </label>

              {modal.type === 'edit' && (
                <label className="account-form-field account-form-field--full">
                  <span>Trạng thái tài khoản</span>
                  <select
                    value={form.status}
                    onChange={(e) => updateForm('status', e.target.value)}
                  >
                    <option value="ACTIVE">Hoạt động</option>
                    <option value="LOCKED">Đã khóa</option>
                  </select>
                </label>
              )}
            </div>

            <div className="account-modal-actions">
              <button
                type="button"
                className="ute-btn ute-btn--light"
                disabled={saving}
                onClick={() => setModal(null)}
              >
                Hủy bỏ
              </button>

              <button type="submit" className="ute-btn" disabled={saving}>
                {saving ? 'Đang lưu...' : 'Lưu thông tin'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
