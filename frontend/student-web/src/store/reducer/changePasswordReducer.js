const initialState = {
    open: false,
    submitting: false,
    fieldErrors: {},   
    formError: "",  
}

export const changePasswordReducer = (state = initialState, action) => {
    switch (action.type) {
        case "CHANGE_PASSWORD_OPEN":
            return { ...initialState, open: true }

        case "CHANGE_PASSWORD_CLOSE":
        case "CHANGE_PASSWORD_SUCCESS":
        case "LOGOUT_USER":
            return initialState

        case "CHANGE_PASSWORD_REQUEST":
            return { ...state, submitting: true, fieldErrors: {}, formError: "" }

        case "CHANGE_PASSWORD_FAILURE":
            return {
                ...state,
                submitting: false,
                fieldErrors: action.payload?.fieldErrors || {},
                formError: action.payload?.formError || ""
            }

        case "CHANGE_PASSWORD_SET_ERRORS":
            return { ...state, fieldErrors: action.payload || {}, formError: "" }

        case "CHANGE_PASSWORD_CLEAR_ERROR": {
            const rest = { ...state.fieldErrors }
            delete rest[action.payload]
            return { ...state, fieldErrors: rest, formError: "" }
        }

        default:
            return state
    }
}
