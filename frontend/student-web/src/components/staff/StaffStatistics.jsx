import { useEffect, useMemo, useState } from 'react'
import { format, startOfMonth, subDays } from 'date-fns'
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement,
    Tooltip, Legend, Filler,
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { getStaffStatistics, STAT_GROUPS } from '../../api/staffStatisticsApi'
import { fullDate } from '../chat/chatUtils'
import '../../styles/staff-statistics.css'


ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

const iso = (d) => format(d, 'yyyy-MM-dd')
const PRESETS = [
    { key: '7d', label: '7 ngày' },
    { key: 'month', label: 'Tháng này' },
    { key: 'custom', label: 'Tùy chọn' },
]
const EMPTY_TEXT = 'Chưa có dữ liệu thống kê trong khoảng thời gian này'

const axisOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { y: { beginAtZero: true, ticks: { precision: 0 } }, x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } } },
}

function formatDuration(min) {
    if (min == null) return '—'
    if (min < 60) return `${min} phút`
    const d = Math.floor(min / 1440), h = Math.floor((min % 1440) / 60), m = min % 60
    if (d > 0) return `${d} ngày ${h} giờ`
    return m ? `${h} giờ ${m} phút` : `${h} giờ`
}

const Card = ({ label, value, sub, tone = 'blue' }) => (
    <div className={`ss-card ss-card--${tone}`}>
        <span className="ss-card__label">{label}</span>
        <strong className="ss-card__value">{value}</strong>
        {sub && <span className="ss-card__sub">{sub}</span>}
    </div>
)

const Panel = ({ title, children, wide }) => (
    <section className={`ss-panel ${wide ? 'ss-panel--wide' : ''}`}>
        <h2>{title}</h2>
        {children}
    </section>
)

const Empty = () => <p className="ss-empty">{EMPTY_TEXT}</p>

const dayBar = (daily, label, color) => ({
    labels: daily.map((d) => d.date),
    datasets: [{ label, data: daily.map((d) => d.count), backgroundColor: color, borderRadius: 5, maxBarThickness: 28 }],
})

function MessagesView({ s }) {
    const pie = {
        labels: ['Chờ tiếp nhận', 'Đang xử lý', 'Đã xử lý', 'Từ chối tiếp nhận'],
        datasets: [{ data: [s.pending, s.processing, s.closed, s.rejected], backgroundColor: ['#f2b84b', '#4f86c6', '#4caf7d', '#e06666'], borderWidth: 0 }],
    }
    const line = {
        labels: s.daily.map((d) => d.date),
        datasets: [{ label: 'Yêu cầu mới', data: s.daily.map((d) => d.count), borderColor: '#2f6db5', backgroundColor: 'rgba(79,134,198,.15)', fill: true, tension: 0.3, pointRadius: 3 }],
    }
    const statusTotal = s.pending + s.processing + s.closed + s.rejected
    return (
        <>
            <div className="ss-cards">
                <Card label="Yêu cầu gửi đến đơn vị" value={s.total} sub="Kể cả được chuyển tiếp đến" />
                <Card label="Chờ tiếp nhận" value={s.pending} tone="amber" />
                <Card label="Đang xử lý" value={s.processing} />
                <Card label="Đã xử lý" value={s.closed} tone="green" />
                <Card label="Từ chối tiếp nhận" value={s.rejected} tone="red" />
                <Card label="Đã chuyển tiếp đi" value={s.forwardedOut} tone="violet" sub="Số lần trong kỳ" />
                <Card label="Được mời hỗ trợ" value={s.invited} tone="teal" sub="Số lần trong kỳ" />
                <Card label="Thời gian xử lý TB" value={formatDuration(s.avgProcessMinutes)} tone="slate"
                      sub={s.closedSamples ? `Từ ${s.closedSamples} yêu cầu đã đóng` : 'Chưa có yêu cầu nào đóng trong kỳ'} />
            </div>
            {s.empty ? <Empty /> : (
                <div className="ss-grid">
                    <Panel title="Yêu cầu theo trạng thái">
                        {statusTotal === 0 ? <p className="ss-empty">Không có yêu cầu nào đang thuộc đơn vị</p> : (
                            <div className="ss-chart ss-chart--pie"><Doughnut data={pie} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>
                        )}
                    </Panel>
                    <Panel title="Yêu cầu mới theo ngày" wide>
                        <div className="ss-chart"><Line data={line} options={axisOptions} /></div>
                    </Panel>
                </div>
            )}
        </>
    )
}

function DocumentsView({ s }) {
    return (
        <>
            <div className="ss-cards">
                <Card label="Tổng số văn bản" value={s.total} sub="Của đơn vị" />
                <Card label="Đang hiển thị" value={s.visible} tone="green" />
                <Card label="Đang ẩn" value={s.hidden} tone="slate" />
                <Card label="Đăng mới trong kỳ" value={s.newInPeriod} tone="violet" />
            </div>
            {s.empty ? <Empty /> : (
                <div className="ss-grid ss-grid--one">
                    <Panel title="Văn bản đăng mới theo ngày">
                        <div className="ss-chart"><Bar data={dayBar(s.daily, 'Văn bản', '#7c5cc4')} options={axisOptions} /></div>
                    </Panel>
                    <Panel title="Văn bản đăng trong kỳ">
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead><tr><th>Số hiệu</th><th>Tên văn bản</th><th>Ngày đăng</th><th>Hiển thị</th></tr></thead>
                                <tbody>
                                {s.items.map((d) => (
                                    <tr key={d.docId}>
                                        <td>{d.docNumber || '—'}</td>
                                        <td>{d.title}</td>
                                        <td>{fullDate(d.createAt)}</td>
                                        <td><span className={`ss-tag ${d.status === 'VISIBLE' ? 'ss-tag--on' : ''}`}>{d.status === 'VISIBLE' ? 'Đang hiển thị' : 'Đang ẩn'}</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            )}
        </>
    )
}

function StudyView({ s }) {
    return (
        <>
            <div className="ss-cards">
                <Card label="Tổng số đề thi" value={s.totalExams} sub={`${s.examsVisible} hiển thị · ${s.examsHidden} ẩn`} />
                <Card label="Tổng số tài liệu" value={s.totalDocuments} tone="teal" sub={`${s.docsVisible} hiển thị · ${s.docsHidden} ẩn`} />
                <Card label="Đăng mới trong kỳ" value={s.newInPeriod} tone="violet" sub="Đề thi và tài liệu" />
            </div>
            {s.empty ? <Empty /> : (
                <div className="ss-grid ss-grid--one">
                    <Panel title="Đề thi / tài liệu đăng mới theo ngày">
                        <div className="ss-chart"><Bar data={dayBar(s.daily, 'Đề thi / tài liệu', '#0f766e')} options={axisOptions} /></div>
                    </Panel>
                    <Panel title="Đề thi / tài liệu đăng trong kỳ">
                        <div className="ss-table-wrap">
                            <table className="ss-table">
                                <thead><tr><th>Tên</th><th>Loại</th><th>Ngày đăng</th><th>Hiển thị</th></tr></thead>
                                <tbody>
                                {s.items.map((r) => (
                                    <tr key={r.resourceId}>
                                        <td>{r.title}</td>
                                        <td>{r.type === 'EXAM' ? 'Đề thi' : 'Tài liệu'}</td>
                                        <td>{fullDate(r.createAt)}</td>
                                        <td><span className={`ss-tag ${r.status === 'VISIBLE' ? 'ss-tag--on' : ''}`}>{r.status === 'VISIBLE' ? 'Đang hiển thị' : 'Đang ẩn'}</span></td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </Panel>
                </div>
            )}
        </>
    )
}

function ForumView({ s }) {
    return (
        <>
            <div className="ss-cards">
                <Card label="Bài viết đăng trong kỳ" value={s.posts} sub="Do nhân viên của đơn vị đăng" />
                <Card label="Bình luận nhận được" value={s.comments} tone="teal" sub="Trên các bài viết đó" />
                <Card label="Lượt thả icon" value={s.reactions} tone="amber" sub="Trên các bài viết đó" />
                <Card label="Bài bị báo cáo vi phạm" value={s.reportedPosts} tone="red" sub="Báo cáo phát sinh trong kỳ" />
            </div>
            {s.empty ? <Empty /> : (
                <div className="ss-grid ss-grid--one">
                    <Panel title="Bài viết đăng theo ngày">
                        <div className="ss-chart"><Bar data={dayBar(s.daily, 'Bài viết', '#2f6db5')} options={axisOptions} /></div>
                    </Panel>
                    <Panel title="Top 5 bài viết nhiều tương tác nhất">
                        {s.top.length === 0 ? <p className="ss-empty">Chưa có bài viết nào trong kỳ</p> : (
                            <div className="ss-table-wrap">
                                <table className="ss-table">
                                    <thead><tr><th>#</th><th>Tiêu đề</th><th>Ngày đăng</th><th>Bình luận</th><th>Icon</th><th>Tương tác</th></tr></thead>
                                    <tbody>
                                    {s.top.map((t, i) => (
                                        <tr key={t.postId}>
                                            <td>{i + 1}</td><td>{t.title}</td><td>{fullDate(t.createAt)}</td>
                                            <td>{t.comments}</td><td>{t.reactions}</td><td><b>{t.interactions}</b></td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Panel>
                </div>
            )}
        </>
    )
}

const VIEWS = { messages: MessagesView, documents: DocumentsView, study: StudyView, forum: ForumView }

/** UC 54 – Thống kê của nhân viên: chọn khoảng thời gian + nhóm, xem thẻ số liệu / biểu đồ / bảng. */
export default function StaffStatistics() {
    const today = useMemo(() => new Date(), [])
    const [group, setGroup] = useState('messages')
    const [preset, setPreset] = useState('month')
    const [custom, setCustom] = useState({ from: iso(startOfMonth(today)), to: iso(today) })
    const [result, setResult] = useState(null)       // { group, from, to, stats }
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [reloadKey, setReloadKey] = useState(0)

    const range = useMemo(() => {
        if (preset === '7d') return { from: iso(subDays(today, 6)), to: iso(today) }
        if (preset === 'month') return { from: iso(startOfMonth(today)), to: iso(today) }
        return custom
    }, [preset, custom, today])

    const invalid = !range.from || !range.to || range.from > range.to

    useEffect(() => {
        if (invalid) return undefined
        let alive = true
        const t = setTimeout(async () => {
            setLoading(true)
            setError('')
            try {
                const stats = await getStaffStatistics(group, range.from, range.to)
                if (alive) setResult({ group, ...range, stats })
            } catch (e) {
                if (alive) setError(e.message)
            } finally {
                if (alive) setLoading(false)
            }
        }, 0)
        return () => { alive = false; clearTimeout(t) }
    }, [group, range, invalid, reloadKey])

    const View = VIEWS[group]
    const current = result && result.group === group ? result : null

    return (
        <div className="ss">
            <header className="ss-head">
                <div>
                    <h1>Thống kê</h1>
                    <p>Số liệu hoạt động thuộc phạm vi đơn vị của bạn</p>
                </div>
                <div className="ss-range">
                    <div className="ss-seg" role="group" aria-label="Khoảng thời gian">
                        {PRESETS.map((p) => (
                            <button key={p.key} type="button" className={preset === p.key ? 'is-active' : ''} onClick={() => setPreset(p.key)}>{p.label}</button>
                        ))}
                    </div>
                    {preset === 'custom' && (
                        <div className="ss-dates">
                            <input type="date" value={custom.from} max={iso(today)} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} aria-label="Từ ngày" />
                            <span>→</span>
                            <input type="date" value={custom.to} max={iso(today)} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} aria-label="Đến ngày" />
                        </div>
                    )}
                </div>
            </header>

            <nav className="ss-tabs" aria-label="Nhóm thống kê">
                {STAT_GROUPS.map((g) => (
                    <button key={g.key} type="button" className={group === g.key ? 'is-active' : ''} onClick={() => setGroup(g.key)}>{g.label}</button>
                ))}
            </nav>

            {invalid ? (
                <div className="ss-notice ss-notice--err">Khoảng thời gian không hợp lệ, vui lòng chọn lại</div>
            ) : error ? (
                <div className="ss-notice ss-notice--err">
                    {error}
                    <button type="button" className="ss-retry" onClick={() => setReloadKey((k) => k + 1)}>Thử lại</button>
                </div>
            ) : !current ? (
                <div className="ss-notice">Đang tải…</div>
            ) : (
                <div className={loading ? 'ss-body is-loading' : 'ss-body'}>
                    <View s={current.stats} />
                </div>
            )}
        </div>
    )
}

