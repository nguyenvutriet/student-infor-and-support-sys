import { configureStore } from "@reduxjs/toolkit";
import { authReducer } from "./reducer/authReducer";
import { loadUser } from "../utils/authStorage";

const savedUser = loadUser();

const initialState = {
    auth: {
        user: savedUser,
        isAuthenticated: !!savedUser
    }
};

export const store = configureStore({
    reducer: {
        auth: authReducer
    },
    preloadedState: initialState
});

export default store;