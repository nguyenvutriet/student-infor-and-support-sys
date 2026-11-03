import { useCallback, useEffect, useState } from "react";
import api from "../../api/api";
import Card, { PageHead } from "../commom/Card";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { format } from "date-fns";

import {
    MonthlyActivityChart,
    RequestStatusChart,
    DepartmentChart,
    ForumChart
} from "./StatisticsCharts";

import "../../styles/statistics.css";

function StatCard({ title, value, description, icon, color }) {
    return (
        <div className={`st-card ${color}`}>
            <div className="st-card-top">
                <span>{title}</span>
                <span className="st-icon">{icon}</span>
            </div>

            <h2>
                {Number(value || 0).toLocaleString("vi-VN")}
            </h2>

            <p>{description}</p>
        </div>
    );
}

function ChartCard({ title, children }) {
    return (
        <div className="st-chart-card">
            <h3>{title}</h3>
            <div className="st-chart-content">
                {children}
            </div>
        </div>
    );
}

function StatisticsDashboard() {
    // =========================
    // STATES
    // =========================

    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    // Khoảng thời gian người dùng đang chọn
    const [from, setFrom] = useState("");
    const [to, setTo] = useState("");

    // Khoảng thời gian đang được áp dụng
    const [period, setPeriod] = useState("all");
    const [appliedFrom, setAppliedFrom] = useState("");
    const [appliedTo, setAppliedTo] = useState("");

    const [exporting, setExporting] = useState(false);


    // =========================
    // FORMAT DATE
    // =========================

    const toISODate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const day = String(date.getDate()).padStart(2, "0");

        return `${year}-${month}-${day}`;
    };

    const formatDateVN = (date) => {
        if (!date) return "";
        const [year, month, day] = date.split("-");
        return `${day}/${month}/${year}`;
    };


    // =========================
    // LOAD DASHBOARD
    // =========================

    const loadDashboard = useCallback(async (start = "", end = "") => {
        try {
            setLoading(true);
            setError("");

            const params = {};

            if (start && end) {
                params.from = start;
                params.to = end;
            }

            const response = await api.get(
                "/admin/statistics/dashboard",
                { params }
            );

            setDashboard(response.data);

        } catch (err) {
            console.error("Lỗi tải dashboard:", err);

            setError(
                err.response?.status === 401
                    ? "Phiên đăng nhập không hợp lệ."
                    : err.response?.status === 403
                        ? "Bạn không có quyền xem thống kê."
                        : "Không thể tải dữ liệu thống kê."
            );

        } finally {
            setLoading(false);
        }
    }, []);


    // Chỉ tải dữ liệu toàn thời gian khi mở trang lần đầu
    useEffect(() => {
        loadDashboard();
    }, [loadDashboard]);


    // =========================
    // APPLY PRESET PERIOD
    // =========================

    const applyPeriod = (type) => {
        const today = new Date();
        const end = toISODate(today);

        let start = "";

        switch (type) {
            case "7days": {
                const date = new Date(today);
                date.setDate(date.getDate() - 6);
                start = toISODate(date);
                break;
            }

            case "30days": {
                const date = new Date(today);
                date.setDate(date.getDate() - 29);
                start = toISODate(date);
                break;
            }

            case "month":
                start = toISODate(
                    new Date(today.getFullYear(), today.getMonth(), 1)
                );
                break;

            case "year":
                start = `${today.getFullYear()}-01-01`;
                break;

            case "all":
                start = "";
                break;

            default:
                return;
        }

        const selectedEnd = type === "all" ? "" : end;

        setPeriod(type);
        setFrom(start);
        setTo(selectedEnd);

        setAppliedFrom(start);
        setAppliedTo(selectedEnd);

        loadDashboard(start, selectedEnd);
    };


    // =========================
    // APPLY CUSTOM PERIOD
    // =========================

    const applyCustomPeriod = () => {
        if (!from || !to) {
            alert("Vui lòng chọn đầy đủ ngày bắt đầu và kết thúc.");
            return;
        }

        if (from > to) {
            alert("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
            return;
        }

        setPeriod("custom");
        setAppliedFrom(from);
        setAppliedTo(to);

        loadDashboard(from, to);
    };


    const handleExportPDF = async () => {
    // PDF hiện yêu cầu khoảng thời gian cụ thể
    if (appliedFrom && appliedTo && appliedFrom > appliedTo) {
        alert("Ngày bắt đầu không được lớn hơn ngày kết thúc.");
        return;
    }

    try {
        setExporting(true);

        const params = {};

    if (appliedFrom && appliedTo) {
        params.from = appliedFrom;
        params.to = appliedTo;
    }

    const response = await api.get(
        "/admin/statistics/export-pdf",
        {
            params,
            responseType: "blob"
        }
    );

        const url = window.URL.createObjectURL(
            new Blob([response.data], {
                type: "application/pdf"
            })
        );

        const link = document.createElement("a");
        link.href = url;
        link.download = appliedFrom && appliedTo
        ? `admin-statistics-${appliedFrom}-${appliedTo}.pdf`
        : "admin-statistics-all-time.pdf";

        document.body.appendChild(link);
        link.click();
        link.remove();

        window.URL.revokeObjectURL(url);

    } catch (err) {
        console.error("Lỗi xuất PDF:", err);

        if (err.response?.status === 401) {
            alert("Phiên đăng nhập không hợp lệ.");
        } else if (err.response?.status === 403) {
            alert("Bạn không có quyền xuất báo cáo.");
        } else {
            alert("Không thể xuất báo cáo PDF.");
        }

    } finally {
        setExporting(false);
    }
};

    if (loading && !dashboard) {
        return (
            <div className="st-loading">
                Đang tải dữ liệu thống kê...
            </div>
        );
    }

    if (error) {
        return (
            <div className="st-error">
                <p>{error}</p>
                <button onClick={() => loadDashboard(appliedFrom, appliedTo)}>
                    Thử lại
                </button>
            </div>
        );
    }

    if (!dashboard) return null;

    const { overview, requestStatuses, departments,
        monthlyActivities, forum, reports } = dashboard;

    return (
    <div className="st-dashboard">

        <PageHead
            title="Thống kê hệ thống"
            subtitle="Theo dõi tình hình hoạt động, quản lý người dùng và tổng hợp dữ liệu toàn hệ thống."
        />

        {/* Bộ lọc thời gian */}
        <Card title="Bộ lọc thời gian">
            <div className="st-period-filter">

                <div className="st-period-options">
                    <button
                        className={period === "all" ? "active" : ""}
                        onClick={() => applyPeriod("all")}
                    >
                        Toàn thời gian
                    </button>

                    <button
                        className={period === "7days" ? "active" : ""}
                        onClick={() => applyPeriod("7days")}
                    >
                        7 ngày
                    </button>

                    <button
                        className={period === "30days" ? "active" : ""}
                        onClick={() => applyPeriod("30days")}
                    >
                        30 ngày
                    </button>

                    <button
                        className={period === "month" ? "active" : ""}
                        onClick={() => applyPeriod("month")}
                    >
                        Tháng này
                    </button>

                    <button
                        className={period === "year" ? "active" : ""}
                        onClick={() => applyPeriod("year")}
                    >
                        Năm nay
                    </button>
                </div>

                <div className="st-custom-period">
                    <div className="st-date-field">
                        <label>Từ ngày</label>
                        <DatePicker
                            selected={from ? new Date(`${from}T00:00:00`) : null}
                            onChange={(date) => {
                                setFrom(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale={vi}
                            placeholderText="dd/mm/yyyy"
                            className="st-date-input"
                        />
                    </div>

                    <div className="st-date-field">
                        <label>Đến ngày</label>
                        <DatePicker
                            selected={to ? new Date(`${to}T00:00:00`) : null}
                            onChange={(date) => {
                                setTo(date ? format(date, "yyyy-MM-dd") : "");
                            }}
                            dateFormat="dd/MM/yyyy"
                            locale={vi}
                            placeholderText="dd/mm/yyyy"
                            className="st-date-input"
                        />
                    </div>

                    <button
                        className="st-apply-btn"
                        onClick={applyCustomPeriod}
                        disabled={loading}
                    >
                        Áp dụng
                    </button>
                </div>

                <div className="st-period-description">
                    {period === "all"
                        ? "Đang hiển thị toàn bộ dữ liệu."
                        : `Đang thống kê từ ${formatDateVN(appliedFrom)} đến ${formatDateVN(appliedTo)}.`}
                </div>

            </div>
        </Card>

        {/* Tổng quan hệ thống */}
        <Card
            title="Tổng quan hệ thống"
            action={
                <button
                    type="button"
                    className="ute-btn"
                    onClick={loadDashboard}
                    disabled={loading}
                >
                    ↻ Làm mới
                </button>
            }
        >
            <div className="st-grid st-grid-4">
                <StatCard
                    title="Người dùng"
                    value={overview.totalUsers}
                    description={`${overview.students} sinh viên`}
                    icon="👥"
                    color="blue"
                />

                <StatCard
                    title="Yêu cầu hỗ trợ"
                    value={overview.totalRequests}
                    description="Tổng yêu cầu toàn hệ thống"
                    icon="📋"
                    color="orange"
                />

                <StatCard
                    title="Bài viết"
                    value={overview.totalPosts}
                    description={`${overview.totalComments} bình luận`}
                    icon="💬"
                    color="green"
                />

                <StatCard
                    title="Báo cáo vi phạm"
                    value={overview.totalReports}
                    description={`${reports.pending} chưa xử lý`}
                    icon="🚩"
                    color="red"
                />
            </div>
        </Card>

            {/* Tài khoản */}
            <div className="st-section-title">
                THỐNG KÊ TÀI KHOẢN
            </div>

            <div className="st-grid st-grid-3">
                <StatCard
                    title="Sinh viên"
                    value={overview.students}
                    description="Tài khoản sinh viên"
                    icon="🎓"
                    color="blue"
                />

                <StatCard
                    title="Nhân viên"
                    value={overview.staffs}
                    description="Tài khoản nhân viên"
                    icon="👨‍💼"
                    color="green"
                />

                <StatCard
                    title="Quản trị viên"
                    value={overview.admins}
                    description="Tài khoản quản trị"
                    icon="🛡️"
                    color="orange"
                />

                <StatCard
                    title="Đang hoạt động"
                    value={overview.activeUsers}
                    description="Tài khoản ACTIVE"
                    icon="✅"
                    color="green"
                />

                <StatCard
                    title="Bị khóa"
                    value={overview.lockedUsers}
                    description="Tài khoản LOCKED"
                    icon="🔒"
                    color="red"
                />
            </div>

            {/* Hoạt động theo tháng */}
            <div className="st-section-title">
                HOẠT ĐỘNG THEO THỜI GIAN
            </div>

            <ChartCard title="Biến động hoạt động theo tháng">
                <MonthlyActivityChart data={monthlyActivities} />
            </ChartCard>

            {/* Yêu cầu hỗ trợ */}
            <div className="st-section-title">
                THỐNG KÊ YÊU CẦU HỖ TRỢ
            </div>

            <div className="st-grid st-grid-2">
                <ChartCard title="Phân bố trạng thái yêu cầu">
                    <RequestStatusChart data={requestStatuses} />
                </ChartCard>

                <ChartCard title="Số yêu cầu theo phòng ban">
                    <DepartmentChart data={departments} />
                </ChartCard>
            </div>

            {/* Diễn đàn */}
            <div className="st-section-title">
                THỐNG KÊ DIỄN ĐÀN
            </div>

            <div className="st-grid st-grid-2">
                <ChartCard title="Hoạt động diễn đàn">
                    <ForumChart forum={forum} />
                </ChartCard>

                <div className="st-chart-card">
                    <h3>Tình hình báo cáo vi phạm</h3>

                    <div className="st-report-summary">
                        <div>
                            <span>Báo cáo bài viết</span>
                            <strong>{reports.postReports}</strong>
                        </div>

                        <div>
                            <span>Báo cáo bình luận</span>
                            <strong>{reports.commentReports}</strong>
                        </div>

                        <div>
                            <span>Đã xử lý</span>
                            <strong className="success">
                                {reports.resolved}
                            </strong>
                        </div>

                        <div>
                            <span>Chưa xử lý</span>
                            <strong className="danger">
                                {reports.pending}
                            </strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* Xuất báo cáo */}
            <div className="st-export-card">
                <h3>Xuất báo cáo thống kê</h3>

                <div className="st-export-form">
                    <div className="st-export-range">
                        <span>Khoảng thời gian báo cáo</span>

                        <strong>
                            {appliedFrom && appliedTo
                                ? `${formatDateVN(appliedFrom)} đến ${formatDateVN(appliedTo)}`
                                : "Toàn bộ dữ liệu"}
                        </strong>
                    </div>

                    <button
                        type="button"
                        onClick={handleExportPDF}
                        disabled={exporting || loading}
                    >
                        {exporting
                            ? "Đang tạo PDF..."
                            : "↓ Xuất báo cáo PDF"}
                    </button>
                </div>

                <p>
                    Báo cáo PDF sử dụng cùng khoảng thời gian đã áp dụng
                    trên dashboard.
                </p>
            </div>
        </div>
    );

}

export default StatisticsDashboard;