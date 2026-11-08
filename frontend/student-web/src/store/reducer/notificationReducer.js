
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
    recent: { items: [], loading: false, error: "", loaded: false },
    unreadCount: null, 
    detail: null,
};

const setRead = (state, notiId, read) => {
    const found =
        state.list.items.find((n) => n.notiId === notiId) ||
        state.recent.items.find((n) => n.notiId === notiId) ||
        (state.detail?.notiId === notiId ? state.detail : null);
    const was = found ? found.read : read;
    let unreadCount = state.unreadCount;
    if (typeof unreadCount === "number" && was !== read) {
        unreadCount = Math.max(0, unreadCount + (read ? -1 : 1));
    }
    const map = (items) => items.map((n) => (n.notiId === notiId ? { ...n, read } : n));
    return {
        ...state,
        unreadCount,
        list: { ...state.list, items: map(state.list.items) },
        recent: { ...state.recent, items: map(state.recent.items) },
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

        case "NOTI_RECENT_REQUEST":
            return { ...state, recent: { ...state.recent, loading: true, error: "" } };
        case "NOTI_RECENT_SUCCESS":
            return { ...state, recent: { items: action.payload.items, loading: false, error: "", loaded: true } };
        case "NOTI_RECENT_FAILURE":
            return { ...state, recent: { ...state.recent, loading: false, error: action.payload.message } };

        case "NOTI_UNREAD_COUNT":
            return { ...state, unreadCount: action.payload };
        case "NOTI_DETAIL_SET":
            return { ...state, detail: action.payload };
        case "NOTI_DETAIL_CLEAR":
            return { ...state, detail: null };
        case "NOTI_MARK_READ":
            return setRead(state, action.payload, true);
        case "NOTI_MARK_UNREAD": 
            return setRead(state, action.payload, false);
        default:
            return state;
    }
};
