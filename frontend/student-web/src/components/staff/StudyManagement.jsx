import { useCallback, useEffect, useState } from 'react'
import { PageHead } from '../commom/Card'
import StudyList from './study/StudyList.jsx'
import StudyDetail from './study/StudyDetail'
import StudyForm from './study/StudyForm'
import '../../styles/documents.css'
import '../../styles/study.css'

export default function StudyManagement() {
  const [view, setView] = useState({ name: 'list' })
  const [toast, setToast] = useState(null)

  const notify = useCallback((text, type = 'success') => setToast({ text, type, key: Date.now() }), [])
  useEffect(() => {
    if (!toast) return undefined
    const t = setTimeout(() => setToast(null), 3500)
    return () => clearTimeout(t)
  }, [toast])
  useEffect(() => { window.scrollTo(0, 0) }, [view])

  const toList = () => setView({ name: 'list' })
  const toDetail = (id) => setView({ name: 'detail', id })
  const toForm = (mode, id, from) => setView({ name: 'form', mode, id, from })

  const title = view.name === 'list' ? 'Quản lý góc học tập'
    : view.name === 'detail' ? 'Chi tiết tài liệu'
    : view.mode === 'edit' ? 'Cập nhật tài liệu' : 'Đăng tải tài liệu'

  return (
    <>
      <PageHead title={title} />

      {view.name === 'list' && (
        <StudyList onOpen={toDetail} onCreate={() => toForm('create')} onEdit={(id) => toForm('edit', id, 'list')} />
      )}

      {view.name === 'detail' && (
        <StudyDetail
          key={view.id}
          id={view.id}
          notify={notify}
          onBack={toList}
          onEdit={(id) => toForm('edit', id, 'detail')}
        />
      )}

      {view.name === 'form' && (
        <StudyForm
          key={`${view.mode}-${view.id ?? 'new'}`}
          mode={view.mode}
          id={view.id}
          onMissing={() => { notify('Tài liệu không tồn tại', 'error'); toList() }}
          onCancel={() => (view.from === 'detail' ? toDetail(view.id) : toList())}
          onDone={(id) => {
            if (view.mode === 'edit') {
              notify('Cập nhật tài liệu thành công')
              view.from === 'detail' ? toDetail(id) : toList()
            } else {
              notify('Đăng tải tài liệu thành công')
              toList()
            }
          }}
        />
      )}

      {toast && <div key={toast.key} className={`doc-toast doc-toast--${toast.type}`} role="status">{toast.text}</div>}
    </>
  )
}