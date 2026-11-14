import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducer/authReducer";
import { forumReducer } from "./reducer/forumReducer";
import { notificationReducer } from "./reducer/notificationReducer";
import { studyReducer } from "./reducer/studyReducer";
import { scheduleReducer } from "./reducer/scheduleReducer";
import { forgotPasswordReducer } from "./reducer/forgotPasswordReducer";
import { changePasswordReducer } from "./reducer/changePasswordReducer";


export const store = configureStore({
    reducer: {
        auth: authReducer,
        forum: forumReducer,
        notification: notificationReducer,
        study: studyReducer,
        schedule: scheduleReducer,
        forgotPassword: forgotPasswordReducer,
        changePassword: changePasswordReducer
    },
});

export default store;