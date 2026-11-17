import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Card, { DataTable } from '../../commom/Card'
import ValidityBadge from '../../staff/documents/ValidityBadge'
import {
  fmtDate, listDocumentDepartments, listVisibleDocuments, VALIDITY_LABEL,
} from '../../../api/studentDocumentApi'

const PAGE_SIZE = 10

export default function StudentDocumentList() {
  const navigate = useNavigate()
  const [departments, setDepartments] = useState([])
  const [departmentId, setDepartmentId] = useState('')
  const [keyword, setKeyword] = useState('')
  const [validity, setValidity] = useState('ALL')
  const [page, setPage] = useState(1)
  const [state, setState] = useState({ status: 'loading', docs: [] })
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    listDocumentDepartments().then(setDepartments).catch(() => setDepartments([]))
  }, [])

  useEffect(() => {
    let alive = true
    const t = setTimeout(() => {
      setState((s) => ({ ...s, status: 'loading' }))
      listVisibleDocuments(departmentId)
        .then((docs) => alive && setState({ status: 'ok', docs }))
        .catch(() => alive && setState({ status: 'error', docs: [] }))
    }, 0)
    return () => { alive = false; clearTimeout(t) }
  }, [departmentId, reloadKey])

  const filtered = useMemo(() => {
    const q = keyword.trim().toLowerCase()
    return state.docs.filter((d) => {
      const okKeyword = !q || d.docNumber?.toLowerCase().includes(q) || d.title?.toLowerCase().includes(q)
      const okValidity = validity === 'ALL' || d.validity === validity
      return okKeyword && okValidity
    })
  }, [state.docs, keyword, validity])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  const reset = () => { setKeyword(''); setValidity('ALL'); setDepartmentId(''); setPage(1) }

  const columns = [
    { key: 'docNumber', title: 'Số hiệu' },
    {
      key: 'title', title: 'Tiêu đề',
      render: (d) => (
        <button type="button" className="doc-link" onClick={() => navigate(`/student/documents/${d.id}`)}>{d.title}</button>
      ),
    },
    { key: 'department', title: 'Đơn vị' },
    { key: 'createAt', title: 'Ngày đăng', render: (d) => fmtDate(d.createAt) },
    { key: 'validity', title: 'Hiệu lực', render: (d) => <ValidityBadge validity={d.validity} /> },
  ]

  return (
    <Card title="Văn bản">
      <div className="doc-filter">
        <div className="doc-filter__search">
          <input
            type="text" className="doc-input" placeholder="Tìm theo số hiệu hoặc tiêu đề văn bản..."
            value={keyword} onChange={(e) => { setKeyword(e.target.value); setPage(1) }}
          />
        </div>
        <div className="doc-filter__status">
          <select className="doc-input" value={departmentId} onChange={(e) => { setDepartmentId(e.target.value); setPage(1) }} aria-label="Lọc theo đơn vị">
            <option value="">Tất cả đơn vị</option>
            {departments.map((d) => <option key={d.departmentId} value={d.departmentId}>{d.name}</option>)}
          </select>
        </div>
        <div className="doc-filter__status">
          <select className="doc-input" value={validity} onChange={(e) => { setValidity(e.target.value); setPage(1) }} aria-label="Lọc theo hiệu lực">
            <option value="ALL">Tất cả hiệu lực</option>
            {Object.entries(VALIDITY_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
          </select>
        </div>
        <button type="button" className="ute-btn ute-btn--light" onClick={reset}>Đặt lại</button>
      </div>

      {state.status === 'loading' && <div className="doc-state">Đang tải...</div>}

      {state.status === 'error' && (
        <div className="doc-state">
          <strong>Không thể tải danh sách văn bản</strong>
          <button type="button" className="ute-btn" onClick={() => setReloadKey((k) => k + 1)}>Thử lại</button>
        </div>
      )}

      {state.status === 'ok' && state.docs.length === 0 && (
        <div className="doc-state"><strong>Chưa có văn bản nào</strong></div>
      )}

      {state.status === 'ok' && state.docs.length > 0 && filtered.length === 0 && (
        <div className="doc-state">
          <strong>Không tìm thấy văn bản phù hợp</strong>
          <p>Thử thay đổi từ khóa hoặc bộ lọc.</p>
        </div>
      )}

      {state.status === 'ok' && rows.length > 0 && (
        <>
          <DataTable columns={columns} rows={rows} />
          {pages > 1 && (
            <div className="sdoc-pager">
              <button type="button" className="ute-btn ute-btn--light" disabled={current === 1} onClick={() => setPage(current - 1)}>‹ Trước</button>
              <span>Trang {current} / {pages} · {filtered.length} văn bản</span>
              <button type="button" className="ute-btn ute-btn--light" disabled={current === pages} onClick={() => setPage(current + 1)}>Sau ›</button>
            </div>
          )}
        </>
      )}
    </Card>
  )
}
