
import { useEffect, useMemo, useState } from "react";
import Card, { PageHead, SearchField } from "../commom/Card";
import { adminReportApi } from "../../api/adminReportApi";
import "../../styles/reports.css";

const PAGE_SIZE = 8;

export default function ReportPostManagement() {
    const [reports, setReports] = useState([]);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const [typeFilter, setTypeFilter] = useState("ALL");
    const [currentPage, setCurrentPage] = useState(1);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");

    const [selectedReport, setSelectedReport] = useState(null);
    const [violation, setViolation] = useState(true);
    const [adminNote, setAdminNote] = useState("");

    // Chuẩn hóa dữ liệu báo cáo
    const normalizeReport = (item) => ({
        ...item,
        reportId: item.reportId,
        reportType: item.reportType,
        targetId: item.targetId,
        targetTitle: item.targetTitle || "",
        targetContent: item.targetContent || "",
        authorName: item.authorName || "Không xác định",
        reporterName: item.reporterName || "Không xác định",
        reason: item.reason || "Không có lý do",
        resolved: item.resolved ?? false,
        targetStatus: item.targetStatus ?? null,
        adminNote: item.adminNote || "",
        handledBy: item.handledBy || "",
    });

    // Lấy danh sách báo cáo tổng hợp
    const fetchData = async () => {
        try {
            setLoading(true);
            setError("");

            const data = await adminReportApi.listAll();

            setReports(
                Array.isArray(data)
                    ? data.map(normalizeReport)
                    : []
            );
        } catch (err) {
            console.error("Lỗi tải báo cáo:", err);

            setError(
                err.response?.data?.message ||
                "Không thể tải danh sách báo cáo."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    // Thống kê tự động từ danh sách tổng hợp
    const statistics = useMemo(() => ({
        total: reports.length,
        pending: reports.filter((r) => !r.resolved).length,
        resolved: reports.filter((r) => r.resolved).length,
    }), [reports]);

    // Lọc dữ liệu
    const filteredReports = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return reports.filter((report) => {
            const isViolation =
        report.reportType === "POST"
            ? report.targetStatus === "HIDDEN"
            : report.targetStatus === false;
            
            const matchesSearch =
                !keyword ||
                [
                    report.reportId,
                    report.targetId,
                    report.targetTitle,
                    report.targetContent,
                    report.authorName,
                    report.reporterName,
                    report.reason,
                ].some((value) =>
                    String(value ?? "").toLowerCase().includes(keyword)
                );

            const matchesStatus =
                statusFilter === "ALL" ||
                (statusFilter === "PENDING" && !report.resolved) ||
                (statusFilter === "RESOLVED" && report.resolved) ||
                (statusFilter === "VIOLATION" && report.resolved && isViolation) ||
                (statusFilter === "REJECTED" && report.resolved && !isViolation);

            const matchesType =
                typeFilter === "ALL" ||
                report.reportType === typeFilter;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [reports, search, statusFilter, typeFilter]);

    // Phân trang
    const totalPages = Math.max(
        1,
        Math.ceil(filteredReports.length / PAGE_SIZE)
    );

    const currentPageSafe = Math.min(currentPage, totalPages);

    const paginatedReports = filteredReports.slice(
        (currentPageSafe - 1) * PAGE_SIZE,
        currentPageSafe * PAGE_SIZE
    );

    useEffect(() => {
        setCurrentPage(1);
    }, [search, statusFilter, typeFilter]);

    // Định dạng ngày
    const formatDate = (value) => {
        if (!value) return "Chưa có";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "Chưa có";

        return date.toLocaleString("vi-VN", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Mở chi tiết
    const openDetail = (report) => {
        setSelectedReport(report);
        setViolation(true);
        setAdminNote(report.adminNote || "");
        setError("");
        setNotice("");
    };

    // Đóng modal
    const closeDetail = () => {
        if (saving) return;

        setSelectedReport(null);
        setViolation(true);
        setAdminNote("");
    };

    // Xử lý báo cáo
    const handleResolve = async (event) => {
        event.preventDefault();

        if (!selectedReport) return;

        if (!adminNote.trim()) {
            setError("Vui lòng nhập ghi chú xử lý.");
            return;
        }

        const confirmed = window.confirm(
            violation
                ? "Xác nhận nội dung này vi phạm?"
                : "Xác nhận nội dung này không vi phạm?"
        );

        if (!confirmed) return;

        try {
            setSaving(true);
            setError("");

            await adminReportApi.resolveAll(
                selectedReport.reportId,
                {
                    violation,
                    adminNote: adminNote.trim(),
                }
            );

            setSelectedReport(null);
            setAdminNote("");
            setViolation(true);

            setNotice("Đã xử lý báo cáo thành công.");

            await fetchData();
        } catch (err) {
            console.error("Lỗi xử lý báo cáo:", err);

            setError(
                err.response?.data?.message ||
                "Không thể xử lý báo cáo."
            );
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="comment-report-page">
            <PageHead
                title="Quản lý báo cáo vi phạm"
                subtitle="Theo dõi, kiểm duyệt và xử lý các báo cáo bài viết và bình luận trên diễn đàn."
            />

            {/* Thống kê */}
            <section className="cr-stats">
                <div className="cr-stat">
                    <div className="cr-stat__top">
                        <span>Tổng báo cáo</span>
                        <span className="cr-stat__symbol">01</span>
                    </div>
                    <strong>{statistics.total}</strong>
                    <small>Tất cả báo cáo</small>
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

            <Card
                title="Danh sách báo cáo"
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
                {/* Tìm kiếm và bộ lọc */}
                <div className="cr-toolbar">
                    <SearchField
                        value={search}
                        onChange={setSearch}
                        placeholder="Tìm mã báo cáo, nội dung, tác giả, người báo cáo..."
                    />

                    <div className="cr-toolbar__filters">
                        <select
                            className="cr-filter"
                            value={typeFilter}
                            onChange={(e) => setTypeFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả loại báo cáo</option>
                            <option value="POST">Bài viết</option>
                            <option value="COMMENT">Bình luận</option>
                        </select>

                        <select
                            className="cr-filter"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                        >
                            <option value="ALL">Tất cả trạng thái</option>
                            <option value="PENDING">Chờ xử lý</option>
                            <option value="RESOLVED">Đã xử lý</option>
                            <option value="VIOLATION">Vi phạm</option>
                            <option value="REJECTED">Không vi phạm</option>
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
                        Đang tải danh sách báo cáo...
                    </div>
                ) : (
                    <>
                        <div className="ute-tablewrap cr-table-wrapper">
                            <table className="ute-table cr-table">
                                <colgroup>
                                    <col style={{ width: "7%" }} />
                                    <col style={{ width: "7%" }} />
                                    <col style={{ width: "20%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "12%" }} />
                                    <col style={{ width: "13%" }} />
                                    <col style={{ width: "10%" }} />
                                    <col style={{ width: "11%" }} />
                                </colgroup>
                                <thead>
                                    <tr>
                                        <th>Mã báo cáo</th>
                                        <th>Loại</th>
                                        <th>Nội dung bị báo cáo</th>
                                        <th>Người đăng</th>
                                        <th>Người báo cáo</th>
                                        <th>Lý do</th>
                                        <th>Ngày báo cáo</th>
                                        <th>Trạng thái</th>
                                        <th>Thao tác</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {paginatedReports.map((report) => {
                                        const isViolation =
                                            report.reportType === "POST"
                                                ? report.targetStatus === "HIDDEN"
                                                : report.targetStatus === false;

                                        return (
                                            <tr key={report.reportId}>
                                            <td>
                                                <strong className="cr-report-id">
                                                    #{report.reportId}
                                                </strong>
                                            </td>

                                            <td>
                                                <span className="cr-reason">
                                                    {report.reportType === "POST"
                                                        ? "Bài viết"
                                                        : "Bình luận"}
                                                </span>
                                            </td>

                                            <td>
                                        <div
                                            className="cr-comment-content"
                                            title={report.targetContent}
                                        >
                                            <div className="report-content">
                                                {report.reportType === "POST"
                                                    ? report.targetTitle || report.targetContent || "Không có nội dung"
                                                    : report.targetContent || "Không có nội dung"}
                                            </div>

                                            {report.reportType === "COMMENT" && report.targetTitle && (
                                                <small className="text-muted">
                                                    Bài viết: {report.targetTitle}
                                                </small>
                                            )}
                                        </div>

                                        <small className="cr-muted">
                                            Mã nội dung: #{report.targetId}
                                        </small>
                                    </td>

                                            <td>
                                                <strong>
                                                    {report.authorName}
                                                </strong>
                                            </td>

                                            <td>
                                                <strong>
                                                    {report.reporterName}
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
                                                        !report.resolved
                                                            ? "cr-status--pending"
                                                            : isViolation
                                                                ? "cr-status--violation"
                                                                : "cr-status--rejected"
                                                    }`}
                                                >
                                                    <span className="cr-status__dot" />

                                                    {!report.resolved
                                                        ? "Chờ xử lý"
                                                        : isViolation
                                                            ? "Vi phạm"
                                                            : "Không vi phạm"}
                                                </span>
                                            </td>

                                            <td>
                                                <button
                                                    type="button"
                                                    className="cr-link"
                                                    onClick={() => openDetail(report)}
                                                >
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                                                        );
                                    })}

                                    {paginatedReports.length === 0 && (
                                        <tr>
                                            <td colSpan="9" className="cr-empty">
                                                <strong>
                                                    Không tìm thấy báo cáo
                                                </strong>
                                                <span>
                                                    Thử thay đổi từ khóa hoặc bộ lọc.
                                                </span>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Phân trang */}
                        {filteredReports.length > 0 && (
                            <div className="cr-pagination">
                                <span>
                                    Hiển thị{" "}
                                    {(currentPageSafe - 1) * PAGE_SIZE + 1}
                                    {" - "}
                                    {Math.min(
                                        currentPageSafe * PAGE_SIZE,
                                        filteredReports.length
                                    )}
                                    {" / "}
                                    {filteredReports.length} báo cáo
                                </span>

                                <div className="cr-pagination__controls">
                                    <button
                                        type="button"
                                        disabled={currentPageSafe <= 1}
                                        onClick={() =>
                                            setCurrentPage((p) => Math.max(1, p - 1))
                                        }
                                    >
                                        Trước
                                    </button>

                                    <strong>
                                        {currentPageSafe} / {totalPages}
                                    </strong>

                                    <button
                                        type="button"
                                        disabled={currentPageSafe >= totalPages}
                                        onClick={() =>
                                            setCurrentPage((p) =>
                                                Math.min(totalPages, p + 1)
                                            )
                                        }
                                    >
                                        Sau
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Card>

            {/* Modal chi tiết */}
            {selectedReport && (
                <div
                    className="cr-modal-backdrop"
                    onMouseDown={(e) => {
                        if (e.target === e.currentTarget) closeDetail();
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
                                    {selectedReport.reportType === "POST"
                                        ? "Báo cáo bài viết"
                                        : "Báo cáo bình luận"}
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
                                <label>Loại báo cáo</label>
                                <p>
                                    {selectedReport.reportType === "POST"
                                        ? "Bài viết"
                                        : "Bình luận"}
                                </p>
                            </div>

                            <div className="cr-detail-item">
                                <label>Mã nội dung</label>
                                <p>#{selectedReport.targetId}</p>
                            </div>

                            <div className="cr-detail-item">
                                <label>Người đăng nội dung</label>
                                <p>{selectedReport.authorName}</p>
                            </div>

                            <div className="cr-detail-item">
                                <label>Người báo cáo</label>
                                <p>{selectedReport.reporterName}</p>
                            </div>

                            {selectedReport.targetTitle && (
                                <div className="cr-detail-item cr-detail-item--full">
                                    <label>
                                        {selectedReport.reportType === "POST"
                                            ? "Tiêu đề bài viết"
                                            : "Bài viết chứa bình luận"}
                                    </label>
                                    <p>{selectedReport.targetTitle}</p>
                                </div>
                            )}

                            <div className="cr-detail-item cr-detail-item--full">
                                <label>
                                    {selectedReport.reportType === "POST"
                                        ? "Nội dung bài viết"
                                        : "Nội dung bình luận"}
                                </label>

                                <p className="cr-detail-content">
                                    {selectedReport.targetContent || "Không có nội dung"}
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
                        </div>

                        <div className="cr-detail-item cr-detail-item--full">
                            <label>
                                {selectedReport.reportType === "POST"
                                    ? "Nguồn bài viết"
                                    : "Nguồn bình luận"}
                            </label>

                        <div className="cr-source-box">
                                <button
                                    type="button"
                                    className="cr-source-button"
                                    disabled
                                >
                                    {selectedReport.reportType === "POST"
                                        ? "Xem bài viết"
                                        : "Xem bình luận"}
                                </button>
                            </div>
                        </div>

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

                                <span
                                    className={`cr-status ${
                                        selectedReport.reportType === "POST"
                                            ? selectedReport.targetStatus === "HIDDEN"
                                                ? "cr-status--violation"
                                                : "cr-status--rejected"
                                            : selectedReport.targetStatus === false
                                                ? "cr-status--violation"
                                                : "cr-status--rejected"
                                    }`}
                                >
                                    <span className="cr-status__dot" />

                                    {(
                                        selectedReport.reportType === "POST"
                                            ? selectedReport.targetStatus === "HIDDEN"
                                            : selectedReport.targetStatus === false
                                    )
                                        ? "Vi phạm"
                                        : "Không vi phạm"}
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
                                            name="reportViolation"
                                            checked={violation}
                                            onChange={() => setViolation(true)}
                                        />

                                        <span>
                                            <strong>Xác nhận vi phạm</strong>
                                            <small>
                                                {selectedReport.reportType === "POST"
                                                    ? "Ẩn bài viết khỏi diễn đàn."
                                                    : "Ẩn bình luận khỏi diễn đàn."}
                                            </small>
                                        </span>
                                    </label>

                                    <label className="cr-radio-option">
                                        <input
                                            type="radio"
                                            name="reportViolation"
                                            checked={!violation}
                                            onChange={() => setViolation(false)}
                                        />

                                        <span>
                                            <strong>Không vi phạm</strong>
                                            <small>
                                                Giữ nguyên nội dung trên diễn đàn.
                                            </small>
                                        </span>
                                    </label>
                                </div>

                                <div className="cr-detail-item">
                                    <label htmlFor="admin-note">
                                        Ghi chú xử lý
                                        <b className="cr-required">*</b>
                                    </label>

                                    <textarea
                                        id="admin-note"
                                        maxLength={1000}
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        placeholder="Nhập nội dung xử lý báo cáo..."
                                    />

                                    <small className="cr-char-count">
                                        {adminNote.length}/1000 ký tự
                                    </small>
                                </div>
                            </>
                        )}

                        {error && (
                            <div className="cr-message cr-message--error">
                                {error}
                            </div>
                        )}

                        <div className="cr-modal-actions">
                            <button
                                type="button"
                                className="ute-btn ute-btn--light"
                                onClick={closeDetail}
                                disabled={saving}
                            >
                                Đóng
                            </button>

                            {!selectedReport.resolved && (
                                <button
                                    type="button"
                                    className="ute-btn"
                                    onClick={handleResolve}
                                    disabled={saving}
                                >
                                    {saving ? "Đang xử lý..." : "Xác nhận xử lý"}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
