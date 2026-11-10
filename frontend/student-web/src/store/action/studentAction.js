
import api from "../../api/api";
import {
    apiError, normalizeDepartment, normalizeResource, normalizeSchedule,
} from "../../utils/studyUtils";
import {
    addDays, buildSchedulePayload, dateKeyOf, emptyScheduleForm, getActiveDay, mondayOf,
    scheduleFormFromEvent, todayKey, validateScheduleForm,
} from "../../utils/scheduleUtils";

const LATEST_LIMIT = 6;
const deptUrl = (id) => `/student/study/departments/${encodeURIComponent(id)}`;

export const setStudyTab = (tab, owner = tab) => ({ type: "STUDY_TAB_SET", payload: { tab, owner } });

export const fetchStudyDepartments = () => async (dispatch) => {
    dispatch({ type: "STUDY_DEPARTMENTS_REQUEST" });
    try {
        const { data } = await api.get("/student/study/departments");
        dispatch({ type: "STUDY_DEPARTMENTS_SUCCESS", payload: (data || []).map(normalizeDepartment) });
    } catch (error) {
        console.error("Study departments error:", error);
        dispatch({ type: "STUDY_DEPARTMENTS_FAILURE", payload: "Không thể tải danh sách khoa/viện" });
    }
};

export const fetchLatestStudyResources = () => async (dispatch) => {
    dispatch({ type: "STUDY_LATEST_REQUEST" });
    try {
        const { data } = await api.get("/student/study/resources/latest", { params: { limit: LATEST_LIMIT } });
        dispatch({ type: "STUDY_LATEST_SUCCESS", payload: (data || []).map(normalizeResource) });
    } catch (error) {
        console.error("Study latest error:", error);
        dispatch({ type: "STUDY_LATEST_FAILURE", payload: "Không thể tải đề thi, tài liệu mới đăng tải" });
    }
};

export const setDepartmentTab = (tab) => ({ type: "STUDY_DEPARTMENT_TAB_SET", payload: tab });

export const fetchStudyDepartment = (departmentId) => async (dispatch) => {
    dispatch({ type: "STUDY_DEPARTMENT_REQUEST", payload: { departmentId } });
    try {
        const { data } = await api.get(deptUrl(departmentId));
        dispatch({ type: "STUDY_DEPARTMENT_SUCCESS", payload: normalizeDepartment(data) });
    } catch (error) {
        const err = apiError(error, "Không thể tải thông tin khoa/viện");
        dispatch({ type: "STUDY_DEPARTMENT_FAILURE", payload: { message: err.message, notFound: err.code === "NOT_FOUND" } });
    }
};

export const searchStudyResources = (departmentId, type) => async (dispatch, getState) => {
    const { keyword, year } = getState().study.search.filters;
    const key = JSON.stringify([departmentId, type, keyword, year]);
    dispatch({ type: "STUDY_SEARCH_REQUEST", payload: { key } });
    try {
        const params = { type };
        if (keyword) params.keyword = keyword;
        if (year) params.year = year;
        const { data } = await api.get(`${deptUrl(departmentId)}/resources`, { params });
        dispatch({
            type: "STUDY_SEARCH_SUCCESS",
            payload: { key, items: (data?.items || []).map(normalizeResource), availableYears: data?.availableYears || [] },
        });
    } catch (error) {
        console.error("Study search error:", error);
        dispatch({ type: "STUDY_SEARCH_FAILURE", payload: { key, message: "Không thể tải danh sách, vui lòng thử lại" } });
    }
};

export const openStudyBrowser = (departmentId, type) => (dispatch) => {
    dispatch({ type: "STUDY_FILTERS_RESET" });
    return dispatch(searchStudyResources(departmentId, type));
};
export const setStudyKeywordInput = (text) => ({ type: "STUDY_KEYWORD_INPUT", payload: text });

export const applyStudyKeyword = (departmentId, type) => (dispatch, getState) => {
    dispatch({ type: "STUDY_FILTERS_SET", payload: { keyword: getState().study.search.keywordInput.trim() } });
    return dispatch(searchStudyResources(departmentId, type));
};
export const clearStudyKeyword = (departmentId, type) => (dispatch) => {
    dispatch({ type: "STUDY_FILTERS_SET", payload: { keyword: "" } });
    return dispatch(searchStudyResources(departmentId, type));
};
export const setStudyYear = (departmentId, type, year) => (dispatch) => {
    dispatch({ type: "STUDY_FILTERS_SET", payload: { year } });
    return dispatch(searchStudyResources(departmentId, type));
};
export const resetStudyFilters = (departmentId, type) => (dispatch) => {
    dispatch({ type: "STUDY_FILTERS_SET", payload: { keyword: "", year: "" } });
    return dispatch(searchStudyResources(departmentId, type));
};

export const fetchStudyResourceDetail = (resourceId) => async (dispatch) => {
    dispatch({ type: "STUDY_DETAIL_REQUEST" });
    try {
        const { data } = await api.get(`/student/study/resources/${resourceId}`);
        dispatch({ type: "STUDY_DETAIL_SUCCESS", payload: normalizeResource(data) });
    } catch (error) {
        const err = apiError(error, "Không thể tải thông tin chi tiết");
        dispatch({ type: "STUDY_DETAIL_FAILURE", payload: { message: err.message, notFound: err.code === "NOT_FOUND" } });
    }
};

export const selectSchedule = (id) => ({ type: "SCHEDULE_SELECT", payload: id });
export const pickScheduleDay = (day) => ({ type: "SCHEDULE_DAY_PICK", payload: day });

export const fetchWeekSchedules = (weekStart) => async (dispatch) => {
    dispatch({ type: "SCHEDULE_LIST_REQUEST" });
    try {
        const { data } = await api.get("/student/schedules", { params: { from: weekStart, to: addDays(weekStart, 6) } });
        dispatch({ type: "SCHEDULE_LIST_SUCCESS", payload: { weekStart, items: (data || []).map(normalizeSchedule) } });
    } catch (error) {
        console.error("Schedule list error:", error);
        dispatch({ type: "SCHEDULE_LIST_FAILURE", payload: { weekStart, message: "Không thể tải lịch biểu" } });
    }
};

export const initScheduleTab = () => (dispatch, getState) => dispatch(fetchWeekSchedules(getState().schedule.weekStart));

export const changeScheduleWeek = (weekStart) => (dispatch) => {
    dispatch({ type: "SCHEDULE_WEEK_SET", payload: weekStart });
    return dispatch(fetchWeekSchedules(weekStart));
};
export const shiftScheduleWeek = (delta) => (dispatch, getState) =>
    dispatch(changeScheduleWeek(addDays(getState().schedule.weekStart, delta * 7)));
export const goToScheduleToday = () => (dispatch) => {
    const today = todayKey();
    dispatch(changeScheduleWeek(mondayOf(today)));
    dispatch(pickScheduleDay(today));
};

export const openCreateSchedule = () => (dispatch, getState) =>
    dispatch({ type: "SCHEDULE_FORM_OPEN", payload: { mode: "create", values: emptyScheduleForm(getActiveDay(getState().schedule)) } });

export const openEditSchedule = () => (dispatch, getState) => {
    const { items, selectedId } = getState().schedule;
    const selected = items.find((s) => s.scheduleId === selectedId);
    if (selected) dispatch({ type: "SCHEDULE_FORM_OPEN", payload: { mode: "edit", editingId: selected.scheduleId, values: scheduleFormFromEvent(selected) } });
};

export const changeScheduleForm = (field, value) => ({ type: "SCHEDULE_FORM_CHANGE", payload: { field, value } });
export const closeScheduleForm = () => ({ type: "SCHEDULE_FORM_CLOSE" });
export const submitScheduleForm = (toast) => async (dispatch, getState) => {
    const { form, weekStart } = getState().schedule;
    const errors = validateScheduleForm(form.values);
    if (Object.keys(errors).length) {
        dispatch({ type: "SCHEDULE_FORM_ERRORS", payload: { errors } });
        return { ok: false };
    }

    dispatch({ type: "SCHEDULE_FORM_SAVING" });
    const editing = form.mode === "edit";
    try {
        const body = buildSchedulePayload(form.values);
        const { data } = editing
            ? await api.put(`/student/schedules/${form.editingId}`, body)
            : await api.post("/student/schedules", body);
        const schedule = normalizeSchedule(data);

        dispatch({ type: "SCHEDULE_UPSERT", payload: schedule });
        dispatch({ type: "SCHEDULE_FORM_CLOSE" });
        toast.success(editing ? "Cập nhật lịch biểu thành công" : "Lưu lịch biểu thành công");

        const day = dateKeyOf(schedule.startTime);
        if (day < weekStart || day > addDays(weekStart, 6)) {
            dispatch(changeScheduleWeek(mondayOf(day)));
            dispatch(pickScheduleDay(day));
        }
        return { ok: true };
    } catch (error) {
        const err = apiError(error, editing ? "Không thể cập nhật lịch biểu, vui lòng thử lại" : "Không thể lưu lịch biểu, vui lòng thử lại");
        if (editing && err.code === "NOT_FOUND") {
            dispatch({ type: "SCHEDULE_REMOVE", payload: form.editingId });
            dispatch({ type: "SCHEDULE_FORM_CLOSE" });
            toast.error("Lịch biểu không còn tồn tại");
            return { ok: false };
        }
        dispatch({ type: "SCHEDULE_FORM_ERRORS", payload: { errors: {}, serverError: err.message } });
        return { ok: false };
    }
};

export const requestDeleteSchedule = () => ({ type: "SCHEDULE_CONFIRM_DELETE", payload: true });
export const cancelDeleteSchedule = () => ({ type: "SCHEDULE_CONFIRM_DELETE", payload: false });

export const confirmDeleteSchedule = (toast) => async (dispatch, getState) => {
    const id = getState().schedule.selectedId;
    if (id == null) return;
    dispatch({ type: "SCHEDULE_DELETING" });
    try {
        await api.delete(`/student/schedules/${id}`);
        dispatch({ type: "SCHEDULE_REMOVE", payload: id });
        dispatch({ type: "SCHEDULE_CONFIRM_DELETE", payload: false });
        toast.success("Xóa lịch biểu thành công");
    } catch (error) {
        const err = apiError(error, "Không thể xóa lịch biểu, vui lòng thử lại");
        if (err.code === "NOT_FOUND") {           
            dispatch({ type: "SCHEDULE_REMOVE", payload: id });
            dispatch({ type: "SCHEDULE_CONFIRM_DELETE", payload: false });
            return;
        }
        dispatch({ type: "SCHEDULE_CONFIRM_DELETE", payload: true });
        toast.error(err.message);
    }
};
