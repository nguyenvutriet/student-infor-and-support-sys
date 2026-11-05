import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducer/authReducer";
import { loadUser } from "../utils/authStorage";
import { forumReducer } from "./reducer/forumReducer";

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
        forum: forumReducer
    },
    preloadedState: initialState
});

export default store;