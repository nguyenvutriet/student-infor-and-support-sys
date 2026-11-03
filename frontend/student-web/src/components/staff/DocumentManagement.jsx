import { useCallback, useEffect, useState } from 'react'
import { PageHead } from '../commom/Card'
import DocumentList from './documents/DocumentList'
import DocumentDetail from './documents/DocumentDetail'
import DocumentForm from './documents/DocumentForm'
import { DEFAULT_DEPT } from '../../api/staffDocumentApi.js'
import '../../styles/documents.css'

/**
 * Trang QUẢN LÝ VĂN BẢN (module Nhân viên) – gồm 4 chức năng:
 *   Quản lý văn bản (danh sách) → Xem chi tiết → Đăng tải / Cập nhật
 * Đặt trong <MainLayout module="staff" activeKey="documents">.
 * `department` = đơn vị của nhân viên đăng nhập (lấy từ store).
 */
export default function DocumentManagement({ department = DEFAULT_DEPT }) {
  const [view, setView] = useState({ name: 'list' })
  const [history, setHistory] = useState([])
  const [toast, setToast] = useState(null)

  const notify = useCallback((text, type = 'success') => setToast({ text, type, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => { window.scrollTo(0, 0) }, [view])

  const toList = () => {
    setHistory([])
    setView({ name: 'list' })
  }

  const toDetail = (id) => {
    setHistory((prev) => [...prev, view])
    setView({ name: 'detail', id })
  }

  const toForm = (mode, id, from) => {
    setHistory((prev) => [...prev, view])
    setView({ name: 'form', mode, id, from })
  }

  const handleBack = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1]
      setHistory((h) => h.slice(0, -1))
      setView(prev)
    } else {
      setView({ name: 'list' })
    }
  }

  const title = view.name === 'list' ? 'Quản lý văn bản'
    : view.name === 'detail' ? 'Chi tiết văn bản'
    : view.mode === 'edit' ? 'Cập nhật văn bản' : 'Đăng tải văn bản'

  return (
    <>
      <PageHead title={title} />

      {view.name === 'list' && (
        <DocumentList onOpen={toDetail} onCreate={() => toForm('create')} onEdit={(id) => toForm('edit', id, 'list')} />
      )}

      {view.name === 'detail' && (
        <DocumentDetail
            key={view.id}
            id={view.id}
            department={department}
            notify={notify}
            onBack={handleBack}
            onOpen={toDetail}
            onEdit={(id) => toForm('edit', id, 'detail')}
        />
      )}

      {view.name === 'form' && (
        <DocumentForm
          key={`${view.mode}-${view.id ?? 'new'}`}
          mode={view.mode}
          id={view.id}
          onMissing={() => { notify('Văn bản không tồn tại', 'error'); toList() }}
          onBack={handleBack}
          onCancel={handleBack}
          onDone={(id) => {
            if (view.mode === 'edit') {
              notify('Cập nhật văn bản thành công')
              view.from === 'detail' ? toDetail(id) : toList()
            } else {
              notify('Đăng tải văn bản thành công')
              toList()
            }
          }}
        />
      )}

      {toast && <div key={toast.key} className={`doc-toast doc-toast--${toast.type}`} role="status">{toast.text}</div>}
    </>
  )
}
