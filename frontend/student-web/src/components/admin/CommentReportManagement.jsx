
import { useEffect, useMemo, useState } from 'react'
import Card, { PageHead, SearchField } from '../commom/Card'
import { adminCommentReportApi } from '../../api/adminCommentReportApi'
import '../../styles/comment-reports.css'

const PAGE_SIZE = 8

function normalizeReport(item) {
    return {
        reportId: item.reportId ?? item.id,
        commentId: item.commentId ?? '',
        commentContent: item.commentContent ?? '',
        commenterId: item.commenterId ?? '',
        commenterName: item.commenterName ?? 'Không xác định',
        postTitle: item.postTitle ?? '',
        reporterId: item.reporterId ?? '',
        reporterName: item.reporterName ?? 'Không xác định',
        reason: item.reason ?? 'Không có lý do',
        commentActive: item.commentActive ?? true,
        resolved: item.resolved ?? false,
        adminNote: item.adminNote ?? '',
        handledBy: item.handledBy ?? '',
        createAt: item.createAt ?? null,
        handleAt: item.handleAt ?? null,
    }
}

function formatDate(value) {
    if (!value) return 'Chưa có dữ liệu'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) return 'Chưa có dữ liệu'

    return date.toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

function getErrorMessage(error, fallback) {
    return (
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        fallback
    )
}

export default function CommentReportManagement() {
    const [reports, setReports] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [notice, setNotice] = useState('')

    const [search, setSearch] = useState('')
    const [status, setStatus] = useState('ALL')
    const [page, setPage] = useState(1)

    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
    })

    const [selectedReport, setSelectedReport] = useState(null)
    const [loadingDetail, setLoadingDetail] = useState(false)

    const [violation, setViolation] = useState(true)
    const [adminNote, setAdminNote] = useState('')
    const [saving, setSaving] = useState(false)

    async function loadData() {
        setLoading(true)
        setError('')

        try {
            const [reportData, statisticData] = await Promise.all([
                adminCommentReportApi.list(),
                adminCommentReportApi.statistics(),
            ])

            const rows = Array.isArray(reportData)
                ? reportData
                : reportData?.content ?? reportData?.data ?? []

            setReports(rows.map(normalizeReport))

            setStats({
                total: statisticData?.total ?? 0,
                pending: statisticData?.pending ?? 0,
                resolved: statisticData?.resolved ?? 0,
            })
        } catch (e) {
            setError(
                getErrorMessage(
                    e,
                    'Không thể tải danh sách báo cáo bình luận.'
                )
            )
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [])

    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase()

        return reports.filter((report) => {
            const matchText =
                !keyword ||
                [
                    report.reportId,
                    report.commentId,
                    report.commentContent,
                    report.commenterName,
                    report.commenterId,
                    report.reporterName,
                    report.reporterId,
                    report.reason,
                    report.postTitle,
                ].some((value) =>
                    String(value ?? '').toLowerCase().includes(keyword)
                )

            const matchStatus =
                status === 'ALL' ||
                (status === 'PENDING' && !report.resolved) ||
                (status === 'RESOLVED' && report.resolved)

            return matchText && matchStatus
        })
    }, [reports, search, status])

    const totalPages = Math.max(
        1,
        Math.ceil(filteredReports.length / PAGE_SIZE)
    )

    const currentPage = Math.min(page, totalPages)

    const visibleReports = filteredReports.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    )

    function handleSearch(value) {
        setSearch(value)
        setPage(1)
    }

    function handleStatusChange(value) {
        setStatus(value)
        setPage(1)
    }

    async function openDetail(report) {
        setSelectedReport(null)
        setLoadingDetail(true)
        setError('')
        setAdminNote('')
        setViolation(true)

        try {
            const data = await adminCommentReportApi.detail(report.reportId)
            const detail = normalizeReport(data)

            setSelectedReport(detail)
            setAdminNote(detail.adminNote || '')
        } catch (e) {
            setError(
                getErrorMessage(e, 'Không thể tải chi tiết báo cáo.')
            )
        } finally {
            setLoadingDetail(false)
        }
    }

    function closeDetail() {
        if (saving) return

        setSelectedReport(null)
        setAdminNote('')
        setViolation(true)
    }

    async function handleResolve(event) {
        event.preventDefault()

        if (!selectedReport) return

        if (!adminNote.trim()) {
            setError('Vui lòng nhập ghi chú xử lý.')
            return
        }

        const confirmed = window.confirm(
            violation
                ? 'Bạn xác nhận bình luận này vi phạm và muốn xử lý?'
                : 'Bạn xác nhận bình luận này không vi phạm?'
        )

        if (!confirmed) return

        setSaving(true)
        setError('')
        setNotice('')

        try {
            await adminCommentReportApi.resolve(
                selectedReport.reportId,
                {
                    violation,
                    adminNote: adminNote.trim(),
                }
            )

            setSelectedReport(null)
            setAdminNote('')
            setViolation(true)

            setNotice('Đã xử lý báo cáo bình luận thành công.')

            await loadData()
        } catch (e) {
            setError(
                getErrorMessage(e, 'Không thể xử lý báo cáo bình luận.')
            )
        } finally {
            setSaving(false)
        }
    }

    return (
        <div className="comment-report-page">
            <PageHead
                title="Quản lý bình luận vi phạm"
                subtitle="Theo dõi, kiểm duyệt và xử lý các bình luận bị báo cáo trên diễn đàn."
            />

            {/* Thống kê */}
            <section className="cr-stats">
                <div className="cr-stat">
                    <div className="cr-stat__top">
                        <span>Tổng báo cáo</span>
                        <span className="cr-stat__symbol">01</span>
                    </div>
                    <strong>{stats.total}</strong>
                    <small>Tất cả báo cáo bình luận</small>
                </div>

                <div className="cr-stat cr-stat--pending">
                    <div className="cr-stat__top">
                        <span>Chờ xử lý</span>
                        <span className="cr-stat__symbol">02</span>
                    </div>
                    <strong>{stats.pending}</strong>
                    <small>Đang chờ ADMIN kiểm duyệt</small>
                </div>

                <div className="cr-stat cr-stat--resolved">
                    <div className="cr-stat__top">
                        <span>Đã xử lý</span>
                        <span className="cr-stat__symbol">03</span>
                    </div>
                    <strong>{stats.resolved}</strong>
                    <small>Đã có kết quả xử lý</small>
                </div>
            </section>

            {/* Danh sách báo cáo */}
            <Card
                title="Danh sách báo cáo bình luận"
                action={
                    <button
                        type="button"
                        className="ute-btn"
                        onClick={loadData}
                        disabled={loading}
                    >
                        ↻ Làm mới
                    </button>
                }
            >
                <div className="cr-toolbar">
                    <div className="cr-toolbar__search">
                        <SearchField
                            placeholder="Tìm nội dung, người bình luận, người báo cáo..."
                            value={search}
                            onChange={handleSearch}
                        />
                    </div>

                    <div className="cr-toolbar__filters">
                        <select
                            className="cr-filter"
                            value={status}
                            onChange={(e) =>
                                handleStatusChange(e.target.value)
                            }
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="RESOLVED">Đã xử lý</option>
                        </select>
                    </div>
                </div>

                {notice && (
                    <div className="cr-message cr-message--success">
                        {notice}
                    </div>
                )}

                {error && (
                    <div className="cr-message cr-message--error">
                        {error}
                    </div>
                )}

                {loading ? (
                    <div className="cr-loading">
                        <span className="account-loading__spinner" />
                        Đang tải danh sách báo cáo...
                    </div>
                ) : (
                    <>
                        <div className="ute-tablewrap cr-table-wrapper">
                            <table className="ute-table cr-table">
                                <thead>
                                    <tr>
                                        <th>Mã báo cáo</th>
                                        <th>Nội dung bình luận</th>
                                        <th>Người bình luận</th>
                                        <th>Lý do</th>
                                        <th>Ngày báo cáo</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {visibleReports.map((report) => (
                                        <tr key={report.reportId}>
                                            <td>
                                                <strong className="cr-report-id">
                                                    #{report.reportId}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className="cr-comment-content"
                                                    title={report.commentContent}
                                                >
                                                    {report.commentContent ||
                                                        'Không có nội dung'}
                                                </span>
                                            </td>

                                            <td>
                                                <strong>
                                                    {report.commenterName}
                                                </strong>
                                            </td>

                                            <td>
                                                <span
                                                    className="cr-reason"
                                                    title={report.reason}
                                                >
                                                    {report.reason}
                                                </span>
                                            </td>

                                            <td>
                                                {formatDate(report.createAt)}
                                            </td>

                                            <td>
                                                <span
                                                    className={`cr-status ${
                                                        report.resolved
                                                            ? 'cr-status--resolved'
                                                            : 'cr-status--pending'
                                                    }`}
                                                >
                                                    <span className="cr-status__dot" />
                                                    {report.resolved
                                                        ? 'Đã xử lý'
                                                        : 'Chờ xử lý'}
                                                </span>
                                            </td>

                                            <td>
                                                <div className="cr-actions">
                                                    <button
                                                        type="button"
                                                        className="cr-link"
                                                        onClick={() =>
                                                            openDetail(report)
                                                        }
                                                    >
                                                        Xem chi tiết
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}

                                    {!visibleReports.length && (
                                        <tr>
                                            <td
                                                colSpan="7"
                                                className="cr-empty"
                                            >
                                                <strong>
                                                    Không tìm thấy báo cáo bình luận
                                                </strong>
                                                <span>
                                                    Thử thay đổi từ khóa tìm kiếm
                                                    hoặc bộ lọc.
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Phân trang */}
                        <div className="cr-pagination">
                            <span>
                                Hiển thị{' '}
                                {filteredReports.length
                                    ? (currentPage - 1) * PAGE_SIZE + 1
                                    : 0}
                                {' - '}
                                {Math.min(
                                    currentPage * PAGE_SIZE,
                                    filteredReports.length
                                )}
                                {' / '}
                                {filteredReports.length} báo cáo
                            </span>

                            <div className="cr-pagination__controls">
                                <button
                                    type="button"
                                    disabled={currentPage <= 1}
                                    onClick={() =>
                                        setPage((p) => Math.max(1, p - 1))
                                    }
                                >
                                    Trước
                                </button>

                                <strong>
                                    {currentPage} / {totalPages}
                                </strong>

                                <button
                                    type="button"
                                    disabled={currentPage >= totalPages}
                                    onClick={() =>
                                        setPage((p) =>
                                            Math.min(totalPages, p + 1)
                                        )
                                    }
                                >
                                    Sau
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </Card>

            {/* Modal chi tiết và xử lý báo cáo */}
            {(selectedReport || loadingDetail) && (
                <div
                    className="cr-modal-backdrop"
                    onMouseDown={(e) => {
                        if (
                            e.target === e.currentTarget &&
                            !saving &&
                            !loadingDetail
                        ) {
                            closeDetail()
                        }
                    }}
                >
                    {loadingDetail ? (
                        <div className="cr-modal">
                            <div className="cr-loading">
                                Đang tải chi tiết báo cáo...
                            </div>
                        </div>
                    ) : selectedReport ? (
                        <form
                            className="cr-modal"
                            onSubmit={handleResolve}
                        >
                            <div className="cr-modal-head">
                                <div>
                                    <span className="cr-modal-eyebrow">
                                        KIỂM DUYỆT DIỄN ĐÀN
                                    </span>

                                    <h2>
                                        Chi tiết báo cáo #{selectedReport.reportId}
                                    </h2>

                                    <p>
                                        Xem xét nội dung và đưa ra kết quả kiểm duyệt.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="cr-modal-close"
                                    disabled={saving}
                                    onClick={closeDetail}
                                    aria-label="Đóng"
                                >
                                    ×
                                </button>
                            </div>

                            <div className="cr-detail">
                                <div className="cr-detail-item">
                                    <label>Người bình luận</label>
                                    <p>
                                        {selectedReport.commenterName}    
                                    </p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Người báo cáo</label>
                                    <p>
                                        {selectedReport.reporterName}
                                    </p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Bài viết diễn đàn</label>
                                    <p>
                                        {selectedReport.postTitle ||
                                            'Không xác định'}
                                    </p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Nội dung bình luận</label>
                                    <p className="cr-detail-content">
                                        {selectedReport.commentContent ||
                                            'Không có nội dung'}
                                    </p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Lý do báo cáo</label>
                                    <p>{selectedReport.reason}</p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Ngày báo cáo</label>
                                    <p>{formatDate(selectedReport.createAt)}</p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Trạng thái bình luận</label>
                                    <p>
                                        {selectedReport.commentActive
                                            ? 'Đang hiển thị'
                                            : 'Đã ẩn'}
                                    </p>
                                </div>
                            </div>

                            {selectedReport.resolved ? (
                                <div className="cr-resolved-info">
                                    <h3>Thông tin xử lý</h3>

                                    <p>
                                        <strong>Ghi chú ADMIN:</strong>{' '}
                                        {selectedReport.adminNote ||
                                            'Không có ghi chú'}
                                    </p>

                                    <p>
                                        <strong>Người xử lý:</strong>{' '}
                                        {selectedReport.handledBy ||
                                            'Không xác định'}
                                    </p>

                                    <p>
                                        <strong>Thời gian xử lý:</strong>{' '}
                                        {formatDate(selectedReport.handleAt)}
                                    </p>

                                    <span className="cr-status cr-status--resolved">
                                        <span className="cr-status__dot" />
                                        Đã xử lý
                                    </span>
                                </div>
                            ) : (
                                <>
                                    <div className="cr-review">
                                        <label className="cr-section-label">
                                            Kết quả kiểm duyệt
                                        </label>

                                        <label className="cr-radio-option">
                                            <input
                                                type="radio"
                                                name="violation"
                                                checked={violation === true}
                                                onChange={() =>
                                                    setViolation(true)
                                                }
                                            />
                                            <span>
                                                <strong>
                                                    Xác nhận vi phạm
                                                </strong>
                                                <small>
                                                    Ẩn bình luận khỏi diễn đàn.
                                                </small>
                                            </span>
                                        </label>

                                        <label className="cr-radio-option">
                                            <input
                                                type="radio"
                                                name="violation"
                                                checked={violation === false}
                                                onChange={() =>
                                                    setViolation(false)
                                                }
                                            />
                                            <span>
                                                <strong>
                                                    Không vi phạm
                                                </strong>
                                                <small>
                                                    Giữ nguyên bình luận trên diễn đàn.
                                                </small>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="cr-detail-item">
                                        <label htmlFor="cr-admin-note">
                                            Ghi chú xử lý <b className="cr-required">*</b>
                                        </label>

                                        <textarea
                                            id="cr-admin-note"
                                            required
                                            maxLength={1000}
                                            value={adminNote}
                                            onChange={(e) =>
                                                setAdminNote(e.target.value)
                                            }
                                            placeholder="Nhập lý do và nội dung xử lý báo cáo..."
                                        />

                                        <small className="cr-char-count">
                                            {adminNote.length}/1000 ký tự
                                        </small>
                                    </div>

                                    {error && (
                                        <div className="cr-message cr-message--error">
                                            {error}
                                        </div>
                                    )}

                                    <div className="cr-modal-actions">
                                        <button
                                            type="button"
                                            className="ute-btn ute-btn--light"
                                            disabled={saving}
                                            onClick={closeDetail}
                                        >
                                            Hủy bỏ
                                        </button>

                                        <button
                                            type="submit"
                                            className="ute-btn"
                                            disabled={saving}
                                        >
                                            {saving
                                                ? 'Đang xử lý...'
                                                : 'Xác nhận xử lý'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </form>
                    ) : null}
                </div>
            )}
        </div>
    )
}
