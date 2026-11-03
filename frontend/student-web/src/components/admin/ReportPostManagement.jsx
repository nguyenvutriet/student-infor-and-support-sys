import { useEffect, useMemo, useState } from "react";
import axios from "axios";

import Card, {
    PageHead,
    SearchField,
} from "../commom/Card";

import "../../styles/comment-reports.css";
import "../../styles/report-posts.css";

const API_URL = `${import.meta.env.VITE_BACK_END_URL}/api`;

const PAGE_SIZE = 8;

export default function ReportPostManagement() {
    const [reports, setReports] = useState([]);
    const [statistics, setStatistics] = useState({
        total: 0,
        pending: 0,
        resolved: 0,
    });

    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [selectedReport, setSelectedReport] = useState(null);
    const [violation, setViolation] = useState(true);
    const [adminNote, setAdminNote] = useState("");

    // Lấy danh sách báo cáo bài viết
    const fetchReports = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await axios.get(
                `${API_URL}/admin/post-reports`,
                {
                    withCredentials: true,
                }
            );

            setReports(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            console.error("Lỗi lấy danh sách báo cáo:", err);
            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách báo cáo bài viết."
            );
        } finally {
            setLoading(false);
        }
    };

    // Lấy thống kê
    const fetchStatistics = async () => {
        try {
            const response = await axios.get(
                `${API_URL}/admin/post-reports/statistics`,
                {
                    withCredentials: true,
                }
            );

            setStatistics({
                total: response.data.total ?? 0,
                pending: response.data.pending ?? 0,
                resolved: response.data.resolved ?? 0,
            });
        } catch (err) {
            console.error("Lỗi lấy thống kê:", err);
        }
    };

    const fetchData = () => {
        fetchReports();
        fetchStatistics();
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Lọc dữ liệu
    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return reports.filter((report) => {
            const matchesSearch =
                !keyword ||
                String(report.reportId ?? "").includes(keyword) ||
                String(report.postTitle ?? "").toLowerCase().includes(keyword) ||
                String(report.reporterName ?? "").toLowerCase().includes(keyword) ||
                String(report.authorName ?? "").toLowerCase().includes(keyword) ||
                String(report.reason ?? "").toLowerCase().includes(keyword);

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "PENDING" && !report.resolved) ||
                (statusFilter === "RESOLVED" && report.resolved);

            return matchesSearch && matchesStatus;
        });
    }, [reports, search, statusFilter]);

    // Phân trang
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReports.length / PAGE_SIZE)
    );

    const paginatedReports = filteredReports.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter]);

    // Định dạng ngày
    const formatDate = (date) => {
        if (!date) return "Chưa có";

        return new Date(date).toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    const openDetail = (report) => {
        setSelectedReport(report);
        setViolation(true);
        setAdminNote(report.adminNote || "");
        setError("");
    };

    const closeDetail = () => {
        setSelectedReport(null);
        setAdminNote("");
        setViolation(true);
    };

    return (
        <div className="comment-report-page post-report-page">

            {/* Tiêu đề trang */}
            <PageHead
                title="Quản lý bài viết vi phạm"
                subtitle="Theo dõi, kiểm duyệt và xử lý các bài viết bị báo cáo trên diễn đàn."
            />

            {/* Thống kê */}
            <section className="cr-stats">
                <div className="cr-stat">
                    <div className="cr-stat__top">
                        <span>Tổng báo cáo</span>
                        <span className="cr-stat__symbol">01</span>
                    </div>
                    <strong>{statistics.total}</strong>
                    <small>Tất cả báo cáo bài viết</small>
                </div>

                <div className="cr-stat cr-stat--pending">
                    <div className="cr-stat__top">
                        <span>Chờ xử lý</span>
                        <span className="cr-stat__symbol">02</span>
                    </div>
                    <strong>{statistics.pending}</strong>
                    <small>Đang chờ ADMIN kiểm duyệt</small>
                </div>

                <div className="cr-stat cr-stat--resolved">
                    <div className="cr-stat__top">
                        <span>Đã xử lý</span>
                        <span className="cr-stat__symbol">03</span>
                    </div>
                    <strong>{statistics.resolved}</strong>
                    <small>Đã có kết quả xử lý</small>
                </div>
            </section>

            {/* Danh sách báo cáo */}
            <Card
                title="Danh sách báo cáo bài viết"
                action={
                    <button
                        type="button"
                        className="ute-btn"
                        onClick={fetchData}
                        disabled={loading}
                    >
                        ↻ Làm mới
                    </button>
                }
            >

                {/* Thanh tìm kiếm và bộ lọc */}
                <div className="cr-toolbar">

                    <SearchField
                        value={search}
                        onChange={(value) => setSearch(value)}
                        placeholder="Tìm theo tiêu đề, người báo cáo, tác giả..."
                    />

                    <select
                        className="cr-filter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="ALL">Tất cả trạng thái</option>
                        <option value="PENDING">Chưa xử lý</option>
                        <option value="RESOLVED">Đã xử lý</option>
                    </select>

                </div>

                {/* Thông báo lỗi */}
                {error && (
                    <div className="cr-message cr-message--error">
                        {error}
                    </div>
                )}

                {/* Bảng dữ liệu */}
                <div className="ute-tablewrap cr-table-wrapper">

                    <table className="ute-table cr-table">
                        <thead>
                            <tr>
                                <th>Mã báo cáo</th>
                                <th>Bài viết</th>
                                <th>Tác giả</th>
                                <th>Người báo cáo</th>
                                <th>Lý do</th>
                                <th>Ngày báo cáo</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>

                        <tbody>
                            {paginatedReports.map((report) => (
                                <tr key={report.reportId}>
                                    <td>
                                        <strong className="cr-report-id">
                                            #{report.reportId}
                                        </strong>
                                    </td>

                                    <td>
                                        <span
                                            className="cr-comment-content"
                                            title={report.postTitle}
                                        >
                                            {report.postTitle || "Không có tiêu đề"}
                                        </span>
                                        <small className="cr-muted">
                                            Mã bài viết: #{report.postId}
                                        </small>
                                    </td>

                                    <td>
                                        <strong className="cr-commenter-name">
                                            {report.authorName || "Không xác định"}
                                        </strong>
                                    </td>

                                    <td>
                                        <strong className="cr-commenter-name">
                                            {report.reporterName || "Không xác định"}
                                        </strong>
                                    </td>

                                    <td>
                                        <span className="cr-reason" title={report.reason}>
                                            {report.reason || "Không có lý do"}
                                        </span>
                                    </td>

                                    <td>{formatDate(report.createAt)}</td>

                                    <td>
                                        <span
                                            className={`cr-status ${
                                                report.resolved
                                                    ? "cr-status--resolved"
                                                    : "cr-status--pending"
                                            }`}
                                        >
                                            <span className="cr-status__dot" />
                                            {report.resolved ? "Đã xử lý" : "Chờ xử lý"}
                                        </span>
                                    </td>

                                    <td>
                                        <div className="cr-actions">
                                            <button
                                                type="button"
                                                className="cr-link"
                                                onClick={() => openDetail(report)}
                                            >
                                                Xem chi tiết
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}

                            {paginatedReports.length === 0 && (
                                <tr>
                                    <td colSpan="8" className="cr-empty">
                                        <strong>Không tìm thấy báo cáo bài viết</strong>
                                        <span>
                                            Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.
                                        </span>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                </div>

                {/* Phân trang */}
                {!loading && filteredReports.length > 0 && (
                    <div className="cr-pagination">
                        <span>
                            Hiển thị{" "}
                            {filteredReports.length
                                ? (currentPage - 1) * PAGE_SIZE + 1
                                : 0}
                            {" - "}
                            {Math.min(
                                currentPage * PAGE_SIZE,
                                filteredReports.length
                            )}
                            {" / "}
                            {filteredReports.length} báo cáo
                        </span>

                        <div className="cr-pagination__controls">
                            <button
                                type="button"
                                disabled={currentPage <= 1}
                                onClick={() =>
                                    setCurrentPage((page) => Math.max(1, page - 1))
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
                                    setCurrentPage((page) =>
                                        Math.min(totalPages, page + 1)
                                    )
                                }
                            >
                                Sau
                            </button>
                        </div>
                    </div>
                )}

                        </Card>

                {/* Modal chi tiết báo cáo bài viết */}
                {selectedReport && (
                    <div
                        className="cr-modal-backdrop"
                        onMouseDown={(e) => {
                            if (e.target === e.currentTarget) {
                                closeDetail();
                            }
                        }}
                    >
                        <div className="cr-modal">
                            <div className="cr-modal-head">
                                <div>
                                    <span className="cr-modal-eyebrow">
                                        KIỂM DUYỆT DIỄN ĐÀN
                                    </span>

                                    <h2>
                                        Chi tiết báo cáo #{selectedReport.reportId}
                                    </h2>

                                    <p>
                                        Xem xét nội dung bài viết và đưa ra kết quả kiểm duyệt.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    className="cr-modal-close"
                                    onClick={closeDetail}
                                >
                                    ×
                                </button>
                            </div>

                            <div className="cr-detail">
                                <div className="cr-detail-item">
                                    <label>Người đăng bài</label>
                                    <p>{selectedReport.authorName || "Không xác định"}</p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Người báo cáo</label>
                                    <p>{selectedReport.reporterName || "Không xác định"}</p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Tiêu đề bài viết</label>
                                    <p>{selectedReport.postTitle || "Không có tiêu đề"}</p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Nội dung bài viết</label>
                                    <p className="cr-detail-content">
                                        {selectedReport.postContent || "Chưa có nội dung bài viết"}
                                    </p>
                                </div>

                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>Lý do báo cáo</label>
                                    <p>{selectedReport.reason || "Không có lý do"}</p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Ngày báo cáo</label>
                                    <p>{formatDate(selectedReport.createAt)}</p>
                                </div>

                                <div className="cr-detail-item">
                                    <label>Mã bài viết</label>
                                    <p>#{selectedReport.postId}</p>
                                </div>
                            </div>

                            {/* Xem bài viết */}
                            <div className="cr-review">
                                <button
                                    type="button"
                                    className="ute-btn"
                                    disabled
                                    title="Chức năng sẽ được kết nối khi diễn đàn hoàn thành"
                                >
                                    Xem bài viết
                                </button>
                            </div>

                            {/* Kết quả kiểm duyệt */}
                            {selectedReport.resolved ? (
                                <div className="cr-resolved-info">
                                    <h3>Thông tin xử lý</h3>

                                    <p>
                                        <strong>Ghi chú ADMIN:</strong>{" "}
                                        {selectedReport.adminNote || "Không có ghi chú"}
                                    </p>

                                    <p>
                                        <strong>Người xử lý:</strong>{" "}
                                        {selectedReport.handledBy || "Không xác định"}
                                    </p>

                                    <p>
                                        <strong>Thời gian xử lý:</strong>{" "}
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
                                                name="postViolation"
                                                checked={violation}
                                                onChange={() => setViolation(true)}
                                            />

                                            <span>
                                                <strong>Xác nhận vi phạm</strong>
                                                <small>
                                                    Ẩn bài viết khỏi diễn đàn.
                                                </small>
                                            </span>
                                        </label>

                                        <label className="cr-radio-option">
                                            <input
                                                type="radio"
                                                name="postViolation"
                                                checked={!violation}
                                                onChange={() => setViolation(false)}
                                            />

                                            <span>
                                                <strong>Không vi phạm</strong>
                                                <small>
                                                    Giữ nguyên bài viết trên diễn đàn.
                                                </small>
                                            </span>
                                        </label>
                                    </div>

                                    <div className="cr-detail-item">
                                        <label htmlFor="post-admin-note">
                                            Ghi chú xử lý
                                            <b className="cr-required">*</b>
                                        </label>

                                        <textarea
                                            id="post-admin-note"
                                            maxLength={1000}
                                            value={adminNote}
                                            onChange={(e) => setAdminNote(e.target.value)}
                                            placeholder="Nhập lý do và nội dung xử lý báo cáo..."
                                        />

                                        <small className="cr-char-count">
                                            {adminNote.length}/1000 ký tự
                                        </small>
                                    </div>
                                </>
                            )}

                            <div className="cr-modal-actions">
                                <button
                                    type="button"
                                    className="ute-btn ute-btn--light"
                                    onClick={closeDetail}
                                >
                                    Đóng
                                </button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        );
    }