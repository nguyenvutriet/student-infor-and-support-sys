// Reducer của Thông báo cá nhân (dùng chung student / staff / admin).
// State: notification = { list, unreadCount, detail } – thao tác gọi API nằm ở store/action/action.js (mục THÔNG BÁO CÁ NHÂN).

const initialState = {
    list: {
        items: [],
        page: 0,
        totalPages: 0,
        totalElements: 0,
        keyword: "",
        loading: false,
        error: "",
        loaded: false,
    },
    unreadCount: null, // null = chưa biết (API đếm chưa có / chưa tải)
    detail: null,      // thông báo đang mở trong popup chi tiết
};

// Đổi cờ read của thông báo notiId ở mọi nơi đang giữ nó (danh sách + popup)
const setRead = (state, notiId, read) => {
    const item = state.list.items.find((n) => n.notiId === notiId);
    const was = item ? item.read : state.detail?.notiId === notiId ? state.detail.read : read;
    let unreadCount = state.unreadCount;
    if (typeof unreadCount === "number" && was !== read) {
        unreadCount = Math.max(0, unreadCount + (read ? -1 : 1));
    }
    return {
        ...state,
        unreadCount,
        list: { ...state.list, items: state.list.items.map((n) => (n.notiId === notiId ? { ...n, read } : n)) },
        detail: state.detail?.notiId === notiId ? { ...state.detail, read } : state.detail,
    };
};

export const notificationReducer = (state = initialState, action) => {
    switch (action.type) {
        case "NOTI_LIST_REQUEST":
            return { ...state, list: { ...state.list, loading: true, error: "", keyword: action.payload.keyword } };
        case "NOTI_LIST_SUCCESS": {
            const { items, page, totalPages, totalElements } = action.payload;
            return { ...state, list: { ...state.list, items, page, totalPages, totalElements, loading: false, error: "", loaded: true } };
        }
        case "NOTI_LIST_FAILURE":
            return { ...state, list: { ...state.list, loading: false, error: action.payload.message } };
        case "NOTI_UNREAD_COUNT":
            return { ...state, unreadCount: action.payload };
        case "NOTI_DETAIL_SET":
            return { ...state, detail: action.payload };
        case "NOTI_DETAIL_CLEAR":
            return { ...state, detail: null };
        case "NOTI_MARK_READ":
            return setRead(state, action.payload, true);
        case "NOTI_MARK_UNREAD": // hoàn lại khi gọi API đánh dấu đã đọc thất bại
            return setRead(state, action.payload, false);
        default:
            return state;
    }
};
