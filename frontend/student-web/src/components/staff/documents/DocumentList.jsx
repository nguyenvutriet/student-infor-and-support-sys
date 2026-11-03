import { useCallback, useEffect, useMemo, useState } from 'react'
import Card, { DataTable } from '../../commom/Card'
import ValidityBadge from './ValidityBadge'
import { listDocuments, STATUS_LABEL, VALIDITY_LABEL, fmtDate } from '../../../api/staffDocumentApi.js'

export default function DocumentList({ onOpen, onCreate, onEdit }) {
  const [keyword, setKeyword] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [validityFilter, setValidityFilter] = useState('ALL')
  const [state, setState] = useState({ status: 'loading', docs: [] })

  const fetchDocuments = useCallback(() => {
    return listDocuments()
  }, [])

  const load = () => {
    setState((s) => ({ ...s, status: 'loading' }))

    fetchDocuments()
        .then((docs) => setState({ status: 'ok', docs }))
        .catch(() => setState({ status: 'error', docs: [] }))
  }

  useEffect(() => {
    let active = true

    fetchDocuments()
        .then((docs) => {
          if (active) setState({ status: 'ok', docs })
        })
        .catch(() => {
          if (active) setState({ status: 'error', docs: [] })
        })

    return () => {
      active = false
    }
  }, [fetchDocuments])

  const filteredDocs = useMemo(() => {
    const search = keyword.trim().toLowerCase()

    return state.docs.filter((doc) => {
      const matchesKeyword =
          !search ||
          doc.docNumber?.toLowerCase().includes(search) ||
          doc.title?.toLowerCase().includes(search)

      const matchesStatus =
          statusFilter === 'ALL' || doc.status === statusFilter

      const matchesValidity =
          validityFilter === 'ALL' || (doc.validity || 'IN_EFFECT') === validityFilter

      return matchesKeyword && matchesStatus && matchesValidity
    })
  }, [state.docs, keyword, statusFilter, validityFilter])

  const columns = [
    { key: 'docNumber', title: 'Số hiệu' },
    { key: 'title', title: 'Tiêu đề', render: (d) => <button type="button" className="doc-link" onClick={() => onOpen(d.id)}>{d.title}</button> },
    { key: 'createAt', title: 'Ngày đăng', render: (d) => fmtDate(d.createAt) },
    { key: 'validity', title: 'Hiệu lực', render: (d) => <ValidityBadge validity={d.validity} /> },
    { key: 'status', title: 'Trạng thái', render: (d) => <span className={`doc-badge doc-badge--${d.status.toLowerCase()}`}>{STATUS_LABEL[d.status]}</span> },
    { key: 'actions', title: 'Thao tác', render: (d) => <button type="button" className="ute-btn ute-btn--light" onClick={() => onEdit(d.id)}>Cập nhật</button> },
  ]

  return (
      <Card title="Danh sách văn bản của đơn vị" action={<button type="button" className="ute-btn" onClick={onCreate}>+ Đăng tải văn bản</button>}>
        {state.status === 'loading' && <div className="doc-state">Đang tải...</div>}
        {state.status === 'ok' && (
            <div className="doc-filter">
              <div className="doc-filter__search">
                <input
                    type="text"
                    className="doc-input"
                    placeholder="Tìm theo số hiệu hoặc tiêu đề văn bản..."
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
              </div>

              <div className="doc-filter__status">
                <select
                    className="doc-input"
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="VISIBLE">Hiển thị</option>
                  <option value="HIDDEN">Ẩn</option>
                </select>
              </div>

              <div className="doc-filter__status">
                <select
                    className="doc-input"
                    value={validityFilter}
                    onChange={(e) => setValidityFilter(e.target.value)}
                >
                  <option value="ALL">Tất cả hiệu lực</option>
                  {Object.entries(VALIDITY_LABEL).map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                </select>
              </div>

              <button
                  type="button"
                  className="ute-btn ute-btn--light"
                  onClick={() => {
                    setKeyword('')
                    setStatusFilter('ALL')
                    setValidityFilter('ALL')
                  }}
              >
                Đặt lại
              </button>
            </div>
        )}

        {state.status === 'error' && (
            <div className="doc-state">
              <strong>Không thể tải danh sách văn bản</strong>
              <button type="button" className="ute-btn" onClick={load}>Thử lại</button>
            </div>
        )}

        {state.status === 'ok' && state.docs.length === 0 && (
            <div className="doc-state"><strong>Chưa có văn bản nào được đăng tải</strong></div>
        )}

        {state.status === 'ok' && filteredDocs.length > 0 && (
            <DataTable columns={columns} rows={filteredDocs} />
        )}

        {state.status === 'ok' &&
            state.docs.length > 0 &&
            filteredDocs.length === 0 && (
                <div className="doc-state">
                  <strong>Không tìm thấy văn bản phù hợp</strong>
                  <p>Thử thay đổi từ khóa hoặc trạng thái lọc.</p>
                </div>
            )}
      </Card>
  )
}