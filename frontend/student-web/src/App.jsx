import { useState } from 'react'
import MainLayout from './components/commom/MainLayout'
import Card, { PageHead, Tabs, SearchField, DataTable } from './components/commom/Card'
import { MENUS } from './config/menus'

/**
 * App demo để xem giao diện. Khi ghép vào dự án thật:
 *  - bỏ thanh chọn module, lấy module theo role trong store/authReducer
 *  - thay state `activeKey` bằng react-router (dùng item.path trong onNavigate)
 */
const USERS = {
  student: { name: 'Võ Thị Mai Quỳnh', code: '23110147' },
  staff: { name: 'Trần Thị Bích', code: 'NV0123' },
  admin: { name: 'Quản trị hệ thống', code: 'AD0001' },
}

const ROWS = [
  { id: 1, title: 'Thông báo xét tốt nghiệp đại học chính quy đợt 5 năm 2026', sender: 'PDT_Bùi Thị Quỳnh', time: '27/10/2026 11:03' },
  { id: 2, title: 'Trung tâm Ngoại ngữ thông báo mở lớp Kỹ năng giao tiếp tiếng Anh cơ bản', sender: 'PDT_Vũ Văn Việt', time: '23/10/2026 10:46' },
  { id: 3, title: 'Thông báo về kế hoạch đăng ký học phần bổ sung qua mạng đợt 2 - Học kỳ 1 (2026-2027)', sender: 'PDT_Nguyễn Thị Bích Hồng', time: '16/10/2026 13:49' },
  { id: 4, title: 'Thông báo công bố lịch thi học kỳ 1 năm 2026 – 2027 đợt 1 cho sinh viên đại học chính quy', sender: 'PDT_Phạm Thị Thúy Hạnh', time: '30/09/2026 13:35' },
]

export default function App() {
  const [module, setModule] = useState('student')
  const [activeKey, setActiveKey] = useState('home')
  const [tab, setTab] = useState('all')
  const [q, setQ] = useState('')

  const firstKey = (m) => MENUS[m].find((i) => i.key).key
  const switchModule = (m) => {
    setModule(m)
    setActiveKey(firstKey(m))
  }
  const current = MENUS[module].find((i) => i.key === activeKey)
  const rows = ROWS.filter((r) => r.title.toLowerCase().includes(q.toLowerCase()))

  return (
    <MainLayout
      module={module}
      activeKey={activeKey}
      onNavigate={(item) => item.key && setActiveKey(item.key)}
      user={USERS[module]}
      badges={{ requests: 3, messages: 2 }}
      unreadNotifications={2}
      unreadMessages={2}
      onLogout={() => alert('Đăng xuất')}
    >
      <Card title="Xem thử giao diện theo module (chỉ có trong bản demo)">
        <div style={{ display: 'flex', gap: 8 }}>
          {['student', 'staff', 'admin'].map((m) => (
            <button key={m} type="button" className={`ute-btn ${m === module ? '' : 'ute-btn--light'}`} onClick={() => switchModule(m)}>
              {m}
            </button>
          ))}
        </div>
      </Card>

      <PageHead title={current?.label || 'Trang chủ'} />
      <Tabs
        tabs={[{ key: 'all', label: 'Thông báo chung' }, { key: 'me', label: 'Thông báo cá nhân' }]}
        active={tab}
        onChange={setTab}
      />

      <Card>
        <div style={{ marginBottom: 14 }}>
          <SearchField placeholder="Tìm kiếm thông báo" value={q} onChange={setQ} />
        </div>
        <DataTable
          rows={rows}
          columns={[
            { key: 'title', title: 'Tiêu đề', render: (r) => <a>{r.title}</a> },
            { key: 'sender', title: 'Người gửi' },
            { key: 'time', title: 'Thời gian gửi' },
          ]}
        />
      </Card>
    </MainLayout>
  )
}
