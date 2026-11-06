import api from "../../api/api";
import { getUserRole, ROLE_HOME } from "../../utils/roles";
import { clearUser, saveUser } from "../../utils/authStorage";
import { FORUM_FEATURES, normalizeComment, normalizePost, normalizePostPage } from "../../components/commom/forum/forumUtils";


export const authUser = (sendData, toast, navigate, setLoader, onLocked) => async (dispatch) => {

    try{
        setLoader(true);
        const {data} = await api.post("/auth/login", sendData);
        const user = {...data};
        delete user.jwtToken;
        const role = getUserRole(user);
        if (!role) {
            toast.error("Tài khoản chưa được phân quyền hợp lệ, vui lòng liên hệ quản trị viên");
            return;
        }


        saveUser(user);

        dispatch({
            type: "LOGIN_USER",
            payload: data
        });
        navigate(ROLE_HOME[role], { replace: true });
    } catch (error) {
        let message = "Không thể kết nối đến máy chủ";

        if (error.response) {
            const { status, data } = error.response;

            if (status === 429) {
                
                const retryAfter = Number(
                    data?.retryAfterSeconds ?? error.response.headers?.["retry-after"]
                );
                message = data?.message || "Bạn đã nhập sai quá nhiều lần, vui lòng thử lại sau";
                if (onLocked && Number.isFinite(retryAfter) && retryAfter > 0) {
                    onLocked(retryAfter, message);
                }
            } else if (status === 401) {
                message = "Tên đăng nhập hoặc mật khẩu không đúng";
            } else {
                message = data?.message || "Đăng nhập thất bại, vui lòng thử lại";
            }
        }
        toast.error(message);
    }finally{
        setLoader(false);
    }

}

export const logoutUser = (navigate) => async (dispatch) => {
    try{
        await api.post("/auth/logout");
    } catch (error) {
        console.error("Logout error:", error);
    }
    clearUser();
    dispatch({
        type: "LOGOUT_USER"
    });
    navigate("/login", { replace: true });
}

export const loadOAuthUser = (toast, navigate) => async (dispatch) => {
    try {
        const { data } = await api.get("/auth/user");
        const user = { ...data };
        delete user.jwtToken;

        const role = getUserRole(user);
        if (!role) {
            clearUser();
            toast.error("Tài khoản chưa được phân quyền hợp lệ, vui lòng liên hệ quản trị viên");
            navigate("/login", { replace: true });
            return;
        }

        saveUser(user);
        dispatch({
            type: "LOGIN_USER",
            payload: user
        });
        navigate(ROLE_HOME[role], { replace: true });
    } catch (error) {
        console.error("OAuth2 login error:", error);
        clearUser();
        toast.error("Không thể hoàn tất đăng nhập bằng Google, vui lòng thử lại");
        navigate("/login", { replace: true });
    }
}

/* =====================================================================
 *  DIỄN ĐÀN – dùng chung cho student / staff / admin
 *  State nằm ở store/reducer/forumReducer.js (state.forum).
 *  Thunk nào cần báo kết quả cho UI thì trả về { ok, missing?, message? }.
 *  Chi tiết API: xem file "Ghi_chu_dac_ta_va_API_Dien_dan.docx".
 * ===================================================================== */
const FORUM_PAGE_SIZE = 10;
const apiMessage = (error, fallback) => error?.response?.data?.message || fallback;
// BE hiện ném RuntimeException("Bài viết không tồn tại hoặc đã bị xóa") nên có thể về 404 hoặc 500 kèm message → nhận cả hai
const isNotFound = (error) =>
    error?.response?.status === 404 || /không tồn tại|đã bị xóa/i.test(error?.response?.data?.message || "");
const currentUserId = (getState) => getState().auth?.user?.userId;

// UC6 – bảng tin (có tìm kiếm theo tiêu đề). page = 0: tải mới; page > 0: tải thêm (cuộn vô hạn)
// BE (ForumController #1): GET /forum/posts?keyword&pageNumber&pageSize&sortBy → PostResponse
export const fetchForumPosts = (keyword = "", page = 0) => async (dispatch, getState) => {
    dispatch({ type: "FORUM_FEED_REQUEST", payload: { keyword, page } });
    try {
        const params = { pageNumber: page, pageSize: FORUM_PAGE_SIZE, sortBy: "desc" }; // desc = mới nhất trước
        if (keyword) params.keyword = keyword;
        const { data } = await api.get("/forum/posts", { params });
        dispatch({ type: "FORUM_FEED_SUCCESS", payload: { ...normalizePostPage(data, currentUserId(getState)), keyword, page } });
    } catch (error) {
        console.error("Forum feed error:", error);
        dispatch({ type: "FORUM_FEED_FAILURE", payload: { keyword, message: "Không thể tải bài viết" } });
    }
};

// UC9 – kho lưu trữ (bài đã lưu của tôi)
// API #10 (chưa có ở BE) – dùng cùng kiểu PostResponse và tham số pageNumber/pageSize như API #1
export const fetchSavedForumPosts = (page = 0) => async (dispatch, getState) => {
    dispatch({ type: "FORUM_SAVED_REQUEST", payload: { page } });
    try {
        const { data } = await api.get("/forum/saved", { params: { pageNumber: page, pageSize: FORUM_PAGE_SIZE } });
        dispatch({ type: "FORUM_SAVED_SUCCESS", payload: { ...normalizePostPage(data, currentUserId(getState)), page } });
    } catch (error) {
        console.error("Forum saved error:", error);
        dispatch({ type: "FORUM_SAVED_FAILURE", payload: { message: "Không thể tải danh sách bài viết đã lưu" } });
    }
};

// UC7 – đăng bài. BE (#3) hiện nhận JSON @RequestBody PostDTO { title, content } và chưa trả bài vừa tạo (return null).
//  - Có BE trả PostDTO → đưa bài lên đầu bảng tin; BE trả rỗng → tải lại bảng tin trang đầu.
//  - FORUM_FEATURES.UPLOAD_ATTACHMENTS = true (khi BE đã hỗ trợ multipart) → gửi kèm files[].
export const createForumPost = ({ title, content, files = [], onProgress }, toast) => async (dispatch, getState) => {
    try {
        let body = { title, content };
        let config = {};
        if (FORUM_FEATURES.UPLOAD_ATTACHMENTS && files.length) {
            body = new FormData();
            body.append("title", title);
            body.append("content", content);
            files.forEach((f) => body.append("files", f));
            config = {
                timeout: 0, // tải video có thể lâu hơn timeout mặc định của axios
                onUploadProgress: (e) => e.total && onProgress?.(Math.round((e.loaded * 100) / e.total)),
            };
        }
        const { data } = await api.post("/forum/posts", body, config);
        // đang tìm kiếm thì để trang tự tải lại; còn lại đưa bài mới lên đầu bảng tin
        if (!getState().forum.feed.keyword) {
            if (data && data.postId) dispatch({ type: "FORUM_POST_PREPEND", payload: normalizePost(data, currentUserId(getState)) });
            else dispatch(fetchForumPosts("", 0));
        }
        toast.success("Đăng bài thành công");
        return { ok: true };
    } catch (error) {
        return { ok: false, message: apiMessage(error, "Đăng bài không thành công, vui lòng thử lại") };
    }
};

// UC8 – mở popup chi tiết: đặt bài đang xem + làm mới dữ liệu từ BE (404 → bài đã bị xóa/ẩn)
export const openForumDetail = (post) => ({ type: "FORUM_DETAIL_SET", payload: post });
export const closeForumDetail = () => ({ type: "FORUM_DETAIL_CLEAR" });
export const removeForumPost = (postId) => ({ type: "FORUM_POST_REMOVE", payload: postId });

export const fetchForumPostDetail = (postId, toast) => async (dispatch, getState) => {
    try {
        const { data } = await api.get(`/forum/posts/${postId}`);
        dispatch({ type: "FORUM_POST_PATCH", payload: { postId, patch: normalizePost(data, currentUserId(getState)) } });
        return { ok: true };
    } catch (error) {
        if (isNotFound(error)) {
            toast.error("Bài viết không tồn tại hoặc đã bị xóa");
            dispatch(removeForumPost(postId));
            return { ok: false, missing: true };
        }
        return { ok: false, message: apiMessage(error, "Không thể tải bài viết") };
    }
};

// UC8 – thả / đổi / bỏ cảm xúc (type = null → bỏ). Cập nhật ngay, lỗi thì hoàn lại
export const reactForumPost = (post, type, toast) => async (dispatch) => {
    const prev = { myReaction: post.myReaction, reactionSummary: post.reactionSummary, reactionCount: post.reactionCount };
    dispatch({ type: "FORUM_POST_REACT", payload: { postId: post.postId, type } });
    try {
        // BE (#4): PUT /forum/posts/{id}/reaction?reactionType=LIKE (query param, không phải JSON body)
        if (type) await api.put(`/forum/posts/${post.postId}/reaction`, null, { params: { reactionType: type } });
        else await api.delete(`/forum/posts/${post.postId}/reaction`);
    } catch (error) {
        dispatch({ type: "FORUM_POST_PATCH", payload: { postId: post.postId, patch: prev } });
        if (isNotFound(error)) {
            toast.error("Bài viết không tồn tại hoặc đã bị xóa");
            dispatch(removeForumPost(post.postId));
        } else {
            toast.error(apiMessage(error, "Không thể cập nhật cảm xúc"));
        }
    }
};

// UC8/UC9 – lưu / bỏ lưu bài viết (chỉ student, staff)
export const toggleSaveForumPost = (post, toast) => async (dispatch) => {
    const willSave = !post.saved;
    dispatch({ type: "FORUM_POST_PATCH", payload: { postId: post.postId, patch: { saved: willSave } } });
    try {
        if (willSave) await api.post(`/forum/posts/${post.postId}/save`);
        else await api.delete(`/forum/posts/${post.postId}/save`);
        toast.success(willSave ? "Đã lưu bài viết" : "Đã bỏ lưu bài viết");
    } catch (error) {
        dispatch({ type: "FORUM_POST_PATCH", payload: { postId: post.postId, patch: { saved: !willSave } } });
        if (!willSave) dispatch(fetchSavedForumPosts(0)); // bỏ lưu thất bại → khôi phục lại danh sách đã lưu
        if (isNotFound(error)) {
            toast.error("Bài viết không tồn tại hoặc đã bị xóa");
            dispatch(removeForumPost(post.postId));
        } else {
            toast.error(apiMessage(error, "Không thể lưu bài viết"));
        }
    }
};

// UC8 – bình luận của bài viết
export const fetchForumComments = (postId, toast) => async (dispatch) => {
    dispatch({ type: "FORUM_COMMENTS_REQUEST", payload: postId });
    try {
        const { data } = await api.get(`/forum/posts/${postId}/comments`);
        dispatch({ type: "FORUM_COMMENTS_SUCCESS", payload: { postId, items: (data || []).map((c) => normalizeComment(c)) } });
    } catch (error) {
        if (isNotFound(error)) {
            toast.error("Bài viết không tồn tại hoặc đã bị xóa");
            dispatch(removeForumPost(postId));
            return;
        }
        dispatch({ type: "FORUM_COMMENTS_FAILURE", payload: { postId, message: "Không thể tải bình luận." } });
    }
};

// UC8 – gửi bình luận / phản hồi (parentId = null nếu là bình luận gốc). Trả { ok, missing?, message? }
export const addForumComment = (postId, { content, parentId = null }, toast) => async (dispatch) => {
    try {
        const { data } = await api.post(`/forum/posts/${postId}/comments`, { content, parentId });
        dispatch({ type: "FORUM_COMMENT_ADD", payload: { postId, comment: normalizeComment(data, parentId) } });
        return { ok: true };
    } catch (error) {
        if (isNotFound(error)) {
            toast.error("Bài viết không tồn tại hoặc đã bị xóa");
            dispatch(removeForumPost(postId));
            return { ok: false, missing: true };
        }
        toast.error(apiMessage(error, "Không thể gửi bình luận"));
        return { ok: false };
    }
};

// UC10 – báo cáo vi phạm (targetType: 'POST' | 'COMMENT'). Trả { ok, message }
export const reportForumContent = (payload, toast) => async () => {
    try {
        await api.post("/forum/reports", payload);
        toast.success("Gửi báo cáo thành công");
        return { ok: true };
    } catch (error) {
        return { ok: false, message: apiMessage(error, "Không thể gửi báo cáo, vui lòng thử lại") };
    }
};
