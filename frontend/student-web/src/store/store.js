import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducer/authReducer";
import { loadUser } from "../utils/authStorage";
import { forumReducer } from "./reducer/forumReducer";
import { notificationReducer } from "./reducer/notificationReducer";
import { studyReducer } from "./reducer/studyReducer";
import { scheduleReducer } from "./reducer/scheduleReducer";

const savedUser = loadUser();

const initialState = {
    auth: {
        user: savedUser,
        isAuthenticated: !!savedUser
    }
};

export const store = configureStore({
    reducer: {
        auth: authReducer,
        forum: forumReducer,
        notification: notificationReducer,
        study: studyReducer,
        schedule: scheduleReducer
    },
    preloadedState: initialState
});

export default store;