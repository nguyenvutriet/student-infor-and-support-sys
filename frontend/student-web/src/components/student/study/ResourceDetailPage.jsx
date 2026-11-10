import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import Card, { PageHead } from '../../commom/Card'
import FileList from '../../commom/FileList'
import { TYPE_LABEL, deptPath, fmtDate } from '../../../utils/studyUtils'
import { fetchStudyResourceDetail } from '../../../store/action/studentAction'
import { safeDownload } from './studyHelpers'
import '../../../styles/documents.css'
import '../../../styles/study.css'
import '../../../styles/student-study.css'

export default function ResourceDetailPage() {
  const { resourceId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const { data: r, loading, error, notFound } = useSelector((s) => s.study.detail)

  useEffect(() => { dispatch(fetchStudyResourceDetail(resourceId)) }, [dispatch, resourceId])
  useEffect(() => { window.scrollTo(0, 0) }, [resourceId])

  const goBack = () => (location.key !== 'default' ? navigate(-1) : navigate('/student/study'))
  const title = r?.resourceType === 'EXAM' ? 'Chi tiết đề thi' : r?.resourceType === 'DOCUMENT' ? 'Chi tiết tài liệu' : 'Chi tiết đề thi / tài liệu'

  if (loading || (!r && !error)) return <><PageHead title={title} /><Card><div className="doc-state">Đang tải...</div></Card></>
  if (!r) {
    return (
      <>
        <PageHead title={title} />
        <Card>
          <div className="doc-state">
            <strong>{notFound ? 'Tài liệu không tồn tại hoặc đã bị ẩn' : error}</strong>
            <button type="button" className="ute-btn ute-btn--light" onClick={goBack}>← Quay lại</button>
          </div>
        </Card>
      </>
    )
  }

  return (
    <>
      <PageHead title={title} />
      <Card>
        <h2 className="sty-detail__title">{r.title}</h2>
        <dl className="doc-meta">
          {r.resourceType && (
            <div><dt>Loại</dt><dd><span className={`doc-badge study-type--${r.resourceType.toLowerCase()}`}>{TYPE_LABEL[r.resourceType] ?? r.resourceType}</span></dd></div>
          )}
          <div>
            <dt>Khoa/Viện</dt>
            <dd>
              {r.departmentId
                ? <button type="button" className="doc-link" onClick={() => navigate(deptPath(r.departmentId))}>{r.departmentName || r.departmentId}</button>
                : (r.departmentName || '—')}
            </dd>
          </div>
          <div><dt>Người đăng</dt><dd>{r.staffName || '—'}</dd></div>
          <div><dt>Ngày đăng</dt><dd>{fmtDate(r.createAt)}</dd></div>
        </dl>

        {r.description && <p className="study-desc">{r.description}</p>}

        <section className="doc-section">
          <h3>Tập tin ({r.files.length})</h3>
          <FileList
            files={r.files}
            downloadable={false}
            renderActions={(f) => (
              <button type="button" className="ute-btn ute-btn--outline" onClick={() => safeDownload(f)}>Tải xuống</button>
            )}
          />
        </section>

        <div className="doc-actions">
          <button type="button" className="ute-btn ute-btn--light" onClick={goBack}>← Quay lại</button>
        </div>
      </Card>
    </>
  )
}
