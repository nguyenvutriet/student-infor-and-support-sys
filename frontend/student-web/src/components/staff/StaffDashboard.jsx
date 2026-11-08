import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js'
import { FiInbox, FiMessageSquare, FiCheckCircle, FiFileText, FiBookOpen, FiRefreshCw, FiChevronRight } from 'react-icons/fi'
import { getStaffDashboard } from '../../api/staffDashboardApi'
import useChatSocket from '../../hooks/useChatSocket'
import Avatar from '../chat/Avatar'
import { timeLabel } from '../chat/chatUtils'
import '../../styles/staff-dashboard.css'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip)

export default function StaffDashboard() {
  const navigate = useNavigate()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const timer = useRef(null)

  const load = useCallback(async () => {
    try {
      setData(await getStaffDashboard())
      setError('')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const t = setTimeout(load, 0)
    return () => clearTimeout(t)
  }, [load])

  // Có yêu cầu / tin nhắn mới → số liệu tự cập nhật (WebSocket), không cần tải lại trang
  useChatSocket(useCallback(() => {
    clearTimeout(timer.current)
    timer.current = setTimeout(load, 600)
  }, [load]))
  useEffect(() => () => clearTimeout(timer.current), [])

  if (loading) return <div className="sd-state">Đang tải…</div>
  if (error && !data) {
    return (
      <div className="sd-state">
        <p>{error}</p>
        <button type="button" className="sd-btn" onClick={load}>Thử lại</button>
      </div>
    )
  }

  const c = data.counts
  const cards = [
    { label: 'Chờ tiếp nhận', value: c.pending, tone: 'amber', icon: <FiInbox />, to: '/staff/requests',
      sub: c.invitedPending ? `Gồm ${c.invitedPending} lời mời hỗ trợ` : 'Yêu cầu cần xử lý' },
    { label: 'Đang xử lý', value: c.processing, tone: 'blue', icon: <FiMessageSquare />, to: '/staff/messages',
      sub: c.supporting ? `+${c.supporting} đang hỗ trợ đơn vị khác` : 'Đang trao đổi với sinh viên' },
    { label: 'Đã xử lý', value: c.closed, tone: 'green', icon: <FiCheckCircle />, to: '/staff/messages',
      sub: 'Đã đóng trao đổi' },
    { label: 'Văn bản của đơn vị', value: c.documents, tone: 'violet', icon: <FiFileText />, to: '/staff/documents',
      sub: 'Quản lý văn bản' },
    { label: 'Góc học tập của tôi', value: c.studyResources, tone: 'teal', icon: <FiBookOpen />, to: '/staff/study',
      sub: 'Tài liệu đã đăng' },
  ]

  const chart = {
    labels: data.weekly.map((d) => d.date),
    datasets: [{
      label: 'Yêu cầu mới',
      data: data.weekly.map((d) => d.count),
      backgroundColor: '#4f86c6',
      borderRadius: 6,
      maxBarThickness: 36,
    }],
  }
  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false } } },
  }

  return (
    <div className="sd">
      <header className="sd-head">
        <div>
          <h1>{data.departmentName}</h1>
        </div>
        <button type="button" className="sd-btn sd-btn--light" onClick={load}><FiRefreshCw /> Làm mới</button>
      </header>

      <section className="sd-cards">
        {cards.map((k) => (
          <button key={k.label} type="button" className={`sd-card sd-card--${k.tone}`} onClick={() => navigate(k.to)}>
            <span className="sd-card__icon">{k.icon}</span>
            <span className="sd-card__value">{k.value}</span>
            <span className="sd-card__label">{k.label}</span>
            <span className="sd-card__sub">{k.sub}</span>
          </button>
        ))}
      </section>

      <div className="sd-grid">
        <section className="sd-panel">
          <h2>Yêu cầu gửi tới đơn vị · 7 ngày gần nhất</h2>
          <div className="sd-chart"><Bar data={chart} options={options} /></div>
        </section>

        <section className="sd-panel">
          <div className="sd-panel__head">
            <h2>Chờ tiếp nhận mới nhất</h2>
            <button type="button" className="sd-link" onClick={() => navigate('/staff/requests')}>Xem tất cả <FiChevronRight /></button>
          </div>
          {data.recentPending.length === 0 && <p className="sd-empty">Không có yêu cầu nào đang chờ</p>}
          <ul className="sd-list">
            {data.recentPending.map((r) => (
              <li key={r.requestId}>
                <button type="button" onClick={() => navigate('/staff/requests')}>
                  <Avatar name={r.studentName} size={40} />
                  <span className="sd-list__main">
                    <strong>{r.studentName}</strong>
                    <span>{r.subject}</span>
                  </span>
                  <span className="sd-list__meta">
                    {r.invited && <em>Lời mời hỗ trợ</em>}
                    <time>{timeLabel(r.createdAt)}</time>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}