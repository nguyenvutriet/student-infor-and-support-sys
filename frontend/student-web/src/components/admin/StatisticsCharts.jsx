import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from "chart.js";

import {
    Line,
    Bar,
    Doughnut
} from "react-chartjs-2";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: "bottom"
        }
    }
};

export function MonthlyActivityChart({ data }) {
    const chartData = {
        labels: data.map(item => item.month),
        datasets: [
            {
                label: "Yêu cầu hỗ trợ",
                data: data.map(item => item.requests),
                borderColor: "#2563eb",
                backgroundColor: "rgba(37,99,235,0.1)",
                tension: 0.35,
                fill: true
            },
            {
                label: "Bài viết",
                data: data.map(item => item.posts),
                borderColor: "#16a34a",
                backgroundColor: "rgba(22,163,74,0.1)",
                tension: 0.35,
                fill: true
            },
            {
                label: "Bình luận",
                data: data.map(item => item.comments),
                borderColor: "#d97706",
                backgroundColor: "rgba(217,119,6,0.1)",
                tension: 0.35,
                fill: true
            }
        ]
    };

    return <Line data={chartData} options={chartOptions} />;
}

export function RequestStatusChart({ data }) {
    const chartData = {
        labels: data.map(item => item.status),
        datasets: [{
            data: data.map(item => item.count),
            backgroundColor: [
                "#2563eb",
                "#16a34a",
                "#d97706",
                "#dc2626",
                "#9333ea",
                "#0891b2"
            ],
            borderWidth: 1
        }]
    };

    return <Doughnut data={chartData} options={chartOptions} />;
}

export function DepartmentChart({ data }) {
    const chartData = {
        labels: data.map(item => item.department),
        datasets: [{
            label: "Số yêu cầu",
            data: data.map(item => item.count),
            backgroundColor: "#1673b8",
            borderRadius: 5
        }]
    };

    return <Bar data={chartData} options={{
        ...chartOptions,
        indexAxis: "y"
    }} />;
}

export function ForumChart({ forum }) {
    const chartData = {
        labels: [
            "Bài viết hiển thị",
            "Bài viết bị ẩn",
            "Bình luận hoạt động"
        ],
        datasets: [{
            label: "Số lượng",
            data: [
                forum.visiblePosts,
                forum.hiddenPosts,
                forum.activeComments
            ],
            backgroundColor: [
                "#16a34a",
                "#dc2626",
                "#2563eb"
            ],
            borderRadius: 5
        }]
    };

    return <Bar data={chartData} options={chartOptions} />;
}