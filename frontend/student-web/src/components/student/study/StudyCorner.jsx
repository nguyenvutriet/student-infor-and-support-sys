import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import Card, { PageHead, Tabs } from '../../commom/Card'
import StudyResourcesTab from './StudyResourcesTab'
import ScheduleTab from './ScheduleTab'
import { setStudyTab } from '../../../store/action/studentAction'
import '../../../styles/documents.css'
import '../../../styles/study.css'
import '../../../styles/student-study.css'

const TABS = [
  { key: 'resources', label: 'Tài liệu' },
  { key: 'schedule', label: 'Lịch biểu' },
]


export default function StudyCorner({ initialTab = 'resources' }) {
  const dispatch = useDispatch()
  const { activeTab, tabOwner } = useSelector((s) => s.study)
  const tab = tabOwner === initialTab ? activeTab : initialTab

  useEffect(() => { dispatch(setStudyTab(initialTab, initialTab)) }, [dispatch, initialTab])

  return (
    <>
      <PageHead title="Góc học tập" />
      <Card>
        <p className="sty-lead">Tìm tài liệu ôn tập và chuẩn bị cho các môn học kỳ tới, tự sắp xếp lịch học của bạn.</p>
        <Tabs tabs={TABS} active={tab} onChange={(key) => dispatch(setStudyTab(key, initialTab))} />
      </Card>
      {tab === 'schedule' ? <ScheduleTab /> : <StudyResourcesTab />}
    </>
  )
}
