import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import Card from '../../commom/Card'
import DepartmentCard from './DepartmentCard'
import ResourceCard from './ResourceCard'
import { deptPath } from '../../../utils/studyUtils'
import { fetchLatestStudyResources, fetchStudyDepartments } from '../../../store/action/studentAction'

export default function StudyResourcesTab() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { departments, latest } = useSelector((s) => s.study)

  useEffect(() => {
    dispatch(fetchStudyDepartments())
    dispatch(fetchLatestStudyResources())
  }, [dispatch])

  return (
    <>
      <Card title="Khoa / Viện">
        {departments.loading && !departments.loaded && <div className="doc-state">Đang tải...</div>}
        {departments.error && (
          <div className="doc-state">
            <strong>{departments.error}</strong>
            <button type="button" className="ute-btn" onClick={() => dispatch(fetchStudyDepartments())}>Thử lại</button>
          </div>
        )}
        {departments.loaded && !departments.error && departments.items.length === 0 && (
          <div className="doc-state"><strong>Chưa có khoa/viện nào</strong></div>
        )}
        {departments.items.length > 0 && (
          <div className="sty-grid sty-grid--dept">
            {departments.items.map((d) => (
              <DepartmentCard key={d.departmentId} department={d} onOpen={() => navigate(deptPath(d.departmentId))} />
            ))}
          </div>
        )}
      </Card>

      <Card title="Đề thi, tài liệu mới đăng tải">
        {latest.loading && !latest.loaded && <div className="doc-state">Đang tải...</div>}
        {latest.error && (
          <div className="doc-state">
            <strong>{latest.error}</strong>
            <button type="button" className="ute-btn" onClick={() => dispatch(fetchLatestStudyResources())}>Thử lại</button>
          </div>
        )}
        {latest.loaded && !latest.error && latest.items.length === 0 && (
          <div className="doc-state"><strong>Đề thi và tài liệu chưa được đăng tải</strong></div>
        )}
        {latest.items.length > 0 && (
          <div className="sty-grid sty-grid--res">
            {latest.items.map((r, i) => <ResourceCard key={r.resourceId ?? i} resource={r} showNew />)}
          </div>
        )}
      </Card>
    </>
  )
}
