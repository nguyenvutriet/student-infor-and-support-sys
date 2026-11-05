// Reducer của Diễn đàn (dùng chung student / staff / admin).
// State: forum = { feed, saved, detailPost, comments } – thao tác gọi API nằm ở store/action/action.js (mục DIỄN ĐÀN).

const emptyList = { items: [], page: 0, hasMore: false, loading: false, error: "", loaded: false };

const initialState = {
    feed: { ...emptyList, keyword: "" },      // bảng tin (UC6)
    saved: { ...emptyList },                  // kho lưu trữ (UC9)
    detailPost: null,                         // bài đang mở trong popup chi tiết (UC8)
    comments: { postId: null, items: [], loading: false, error: "" },
};

// Tính lại số liệu cảm xúc khi người dùng thả / đổi / bỏ cảm xúc (type = null → bỏ)
const applyReaction = (post, type) => {
    const summary = { ...(post.reactionSummary || {}) };
    if (post.myReaction) summary[post.myReaction] = Math.max(0, (summary[post.myReaction] || 0) - 1);
    if (type) summary[type] = (summary[type] || 0) + 1;
    return {
        ...post,
        myReaction: type,
        reactionSummary: summary,
        reactionCount: Object.values(summary).reduce((a, b) => a + b, 0),
    };
};

// Áp hàm fn lên bài có postId ở MỌI nơi đang giữ bài đó (bảng tin, đã lưu, popup chi tiết)
const mapPost = (state, postId, fn) => {
    const map = (list) => list.map((p) => (p.postId === postId ? fn(p) : p));
    return {
        ...state,
        feed: { ...state.feed, items: map(state.feed.items) },
        saved: { ...state.saved, items: map(state.saved.items) },
        detailPost: state.detailPost?.postId === postId ? fn(state.detailPost) : state.detailPost,
    };
};

const listReducer = (list, action, prefix) => {
    switch (action.type) {
        case `${prefix}_REQUEST`: {
            if (action.payload.page !== 0) return { ...list, loading: true, error: "" };
            const fresh = { ...emptyList, loading: true };
            if ("keyword" in list) fresh.keyword = action.payload.keyword ?? list.keyword;
            return fresh;
        }
        case `${prefix}_SUCCESS`: {
            const { page, content, hasMore } = action.payload;
            return {
                ...list,
                items: page === 0 ? content : [...list.items, ...content],
                page, hasMore: !!hasMore, loading: false, error: "", loaded: true,
            };
        }
        case `${prefix}_FAILURE`:
            return { ...list, loading: false, error: action.payload.message };
        default:
            return list;
    }
};

export const forumReducer = (state = initialState, action) => {
    switch (action.type) {
        case "FORUM_FEED_REQUEST":
        case "FORUM_FEED_SUCCESS":
        case "FORUM_FEED_FAILURE":
            // bỏ qua kết quả của lần tìm kiếm cũ (từ khóa đã đổi)
            if (action.type !== "FORUM_FEED_REQUEST" && action.payload.keyword !== state.feed.keyword) return state;
            return { ...state, feed: listReducer(state.feed, action, "FORUM_FEED") };

        case "FORUM_SAVED_REQUEST":
        case "FORUM_SAVED_SUCCESS":
        case "FORUM_SAVED_FAILURE":
            return { ...state, saved: listReducer(state.saved, action, "FORUM_SAVED") };

        case "FORUM_POST_PREPEND":
            return { ...state, feed: { ...state.feed, items: [action.payload, ...state.feed.items], loaded: true } };

        case "FORUM_POST_PATCH": {
            const { postId, patch } = action.payload;
            const next = mapPost(state, postId, (p) => ({ ...p, ...patch }));
            // bỏ lưu → gỡ khỏi Kho lưu trữ
            return patch.saved === false
                ? { ...next, saved: { ...next.saved, items: next.saved.items.filter((p) => p.postId !== postId) } }
                : next;
        }

        case "FORUM_POST_REACT":
            return mapPost(state, action.payload.postId, (p) => applyReaction(p, action.payload.type));

        case "FORUM_POST_REMOVE": {
            const id = action.payload;
            return {
                ...state,
                feed: { ...state.feed, items: state.feed.items.filter((p) => p.postId !== id) },
                saved: { ...state.saved, items: state.saved.items.filter((p) => p.postId !== id) },
                // popup chi tiết đang mở bài này → đánh dấu để UI tự đóng
                detailPost: state.detailPost?.postId === id ? { ...state.detailPost, removed: true } : state.detailPost,
            };
        }

        case "FORUM_DETAIL_SET":
            return { ...state, detailPost: action.payload };
        case "FORUM_DETAIL_CLEAR":
            return { ...state, detailPost: null, comments: initialState.comments };

        case "FORUM_COMMENTS_REQUEST":
            return { ...state, comments: { postId: action.payload, items: [], loading: true, error: "" } };
        case "FORUM_COMMENTS_SUCCESS":
            if (action.payload.postId !== state.comments.postId) return state;
            return { ...state, comments: { ...state.comments, items: action.payload.items, loading: false, error: "" } };
        case "FORUM_COMMENTS_FAILURE":
            if (action.payload.postId !== state.comments.postId) return state;
            return { ...state, comments: { ...state.comments, loading: false, error: action.payload.message } };

        case "FORUM_COMMENT_ADD": {
            const { postId, comment } = action.payload;
            const withCount = mapPost(state, postId, (p) => ({ ...p, commentCount: (p.commentCount || 0) + 1 }));
            if (withCount.comments.postId !== postId) return withCount;
            const items = comment.parentId
                ? withCount.comments.items.map((c) =>
                    c.commentId === comment.parentId ? { ...c, replies: [...(c.replies || []), comment] } : c)
                : [...withCount.comments.items, { ...comment, replies: [] }];
            return { ...withCount, comments: { ...withCount.comments, items } };
        }

        default:
            return state;
    }
};
