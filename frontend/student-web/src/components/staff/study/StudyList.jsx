import { useEffect, useMemo, useState } from 'react'
import Card, { DataTable } from '../../commom/Card'
import { listStudyResources, STATUS_LABEL, TYPE_LABEL, fmtDate } from '../../../api/staffStudyApi.js'

export default function StudyList({ onOpen, onCreate, onEdit }) {
  const [keyword, setKeyword] = useState('')
  const [typeFilter, setTypeFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [state, setState] = useState({ status: 'loading', items: [] })

  const load = () => {
    setState((s) => ({ ...s, status: 'loading' }))
    listStudyResources()
      .then((items) => setState({ status: 'ok', items }))
      .catch(() => setState({ status: 'error', items: [] }))
  }

  useEffect(() => {
    let alive = true
    listStudyResources()
      .then((items) => alive && setState({ status: 'ok', items }))
      .catch(() => alive && setState({ status: 'error', items: [] }))
    return () => { alive = false }
  }, [])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return state.items.filter((r) =>
      (!q || r.title?.toLowerCase().includes(q) || r.description?.toLowerCase().includes(q)) &&
      (typeFilter === 'ALL' || r.resourceType === typeFilter) &&
      (statusFilter === 'ALL' || r.status === statusFilter))
  }, [state.items, keyword, typeFilter, statusFilter])

  const columns = [
    { key: 'title', title: 'Tiêu đề', render: (r) => <button type="button" className="doc-link" onClick={() => onOpen(r.id)}>{r.title}</button> },
    { key: 'resourceType', title: 'Loại', render: (r) => <span className={`doc-badge study-type--${(r.resourceType || '').toLowerCase()}`}>{TYPE_LABEL[r.resourceType] ?? r.resourceType}</span> },
    { key: 'files', title: 'Tập tin', render: (r) => r.files.length },
    { key: 'createAt', title: 'Ngày đăng', render: (r) => fmtDate(r.createAt) },
    { key: 'status', title: 'Trạng thái', render: (r) => <span className={`doc-badge doc-badge--${r.status.toLowerCase()}`}>{STATUS_LABEL[r.status]}</span> },
    { key: 'actions', title: 'Thao tác', render: (r) => <button type="button" className="ute-btn ute-btn--light" onClick={() => onEdit(r.id)}>Cập nhật</button> },
  ]

  return (
    <Card title="Tài liệu góc học tập" action={<button type="button" className="ute-btn" onClick={onCreate}>+ Đăng tải tài liệu</button>}>
      {state.status === 'loading' && <div className="doc-state">Đang tải...</div>}

      {state.status === 'ok' && (
        <div className="doc-filter">
          <div className="doc-filter__search">
            <input type="text" className="doc-input" placeholder="Tìm theo tiêu đề hoặc mô tả..." value={keyword} onChange={(e) => setKeyword(e.target.value)} />
          </div>
          <div className="doc-filter__status">
            <select className="doc-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
              <option value="ALL">Tất cả loại</option>
              {Object.entries(TYPE_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </div>
          <div className="doc-filter__status">
            <select className="doc-input" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="ALL">Tất cả trạng thái</option>
              <option value="VISIBLE">Hiển thị</option>
              <option value="HIDDEN">Ẩn</option>
            </select>
          </div>
          <button type="button" className="ute-btn ute-btn--light" onClick={() => { setKeyword(''); setTypeFilter('ALL'); setStatusFilter('ALL') }}>Đặt lại</button>
        </div>
      )}

      {state.status === 'error' && (
        <div className="doc-state">
          <strong>Không thể tải danh sách tài liệu</strong>
          <button type="button" className="ute-btn" onClick={load}>Thử lại</button>
        </div>
      )}

      {state.status === 'ok' && state.items.length === 0 && (
        <div className="doc-state"><strong>Chưa có tài liệu nào được đăng tải</strong></div>
      )}

      {state.status === 'ok' && filtered.length > 0 && <DataTable columns={columns} rows={filtered} />}

      {state.status === 'ok' && state.items.length > 0 && filtered.length === 0 && (
        <div className="doc-state">
          <strong>Không tìm thấy tài liệu phù hợp</strong>
          <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
        </div>
      )}
    </Card>
  )
}