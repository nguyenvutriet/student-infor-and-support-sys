import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useParams } from 'react-router-dom'
import { FiMail, FiMapPin, FiPhone } from 'react-icons/fi'
import Card, { PageHead, Tabs } from '../../commom/Card'
import DepartmentLogo from './DepartmentLogo'
import ResourceCard from './ResourceCard'
import ResourceBrowser from './ResourceBrowser'
import { mergeDepartment } from '../../../utils/studyUtils'
import { fetchStudyDepartment, fetchStudyDepartments, setDepartmentTab } from '../../../store/action/studentAction'
import '../../../styles/documents.css'
import '../../../styles/study.css'
import '../../../styles/student-study.css'

const TABS = [
  { key: 'overview', label: 'Tổng quan' },
  { key: 'exams', label: 'Đề thi' },
  { key: 'documents', label: 'Tài liệu' },
]

export default function DepartmentPage() {
  const { departmentId } = useParams()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const departments = useSelector((s) => s.study.departments)
  const { id, tab, data, loading, error, notFound } = useSelector((s) => s.study.department)

  useEffect(() => {
    dispatch(fetchStudyDepartment(departmentId))
    dispatch(fetchStudyDepartments()) 
  }, [dispatch, departmentId])
  useEffect(() => { window.scrollTo(0, 0) }, [departmentId])

  const back = <button type="button" className="ute-btn ute-btn--light" onClick={() => navigate('/student/study')}>← Quay lại Góc học tập</button>
  const ready = id === departmentId && !loading
  const base = departments.items.find((x) => x.departmentId === departmentId)
  const d = ready && data ? mergeDepartment(base, data) : null

  if (!ready) return <><PageHead title="Khoa / Viện" /><Card><div className="doc-state">Đang tải...</div></Card></>
  if (!d) {
    return (
      <>
        <PageHead title="Khoa / Viện" />
        <Card>
          <div className="doc-state">
            <strong>{notFound ? 'Khoa/viện không tồn tại' : error}</strong>
            {back}
          </div>
        </Card>
      </>
    )
  }

  const dept = { ...d, departmentId, name: d.name || departmentId }

  return (
    <>
      <PageHead title="Khoa / Viện" />
      <Card>
        <div className="sty-dhead">
          <DepartmentLogo department={dept} size={72} />
          <div className="sty-dhead__info">
            <h2>{dept.name}</h2>
            <ul className="sty-contact">
              <li><FiMapPin size={15} />{dept.location || 'Chưa cập nhật vị trí'}</li>
              {dept.email && <li><FiMail size={15} />{dept.email}</li>}
              {dept.phone && <li><FiPhone size={15} />{dept.phone}</li>}
            </ul>
          </div>
          {back}
        </div>
        <Tabs tabs={TABS} active={tab} onChange={(k) => dispatch(setDepartmentTab(k))} />
      </Card>

      {tab === 'overview' && (
        <>
          <Card title="Giới thiệu">
            <p className="study-desc">{dept.description || 'Khoa/viện chưa cập nhật phần giới thiệu.'}</p>
          </Card>
          <Card title="Đăng tải gần đây">
            {dept.recentResources.length === 0
              ? <div className="doc-state"><strong>Chưa có đề thi hay tài liệu nào được đăng lên</strong></div>
              : <div className="sty-grid sty-grid--res">{dept.recentResources.map((r, i) => <ResourceCard key={r.resourceId ?? i} resource={r} showDepartment={false} />)}</div>}
          </Card>
        </>
      )}
      {tab === 'exams' && <ResourceBrowser key="EXAM" departmentId={departmentId} type="EXAM" />}
      {tab === 'documents' && <ResourceBrowser key="DOCUMENT" departmentId={departmentId} type="DOCUMENT" />}
    </>
  )
}
