// src/services/password.ts
import { AxiosError } from "axios";
import { api, endpoints } from "./api";


export const changePassword = async (data: {}) => {
    try {
        const response = await api.post(endpoints.changePassword, data);

        const body = response.data;

        // Backend always returns 200 HTTP, but status_code inside tells real status.
        if (body.status_code !== 200) {
            return { data: null, error: body.error_message || "Password update failed" };
        }

        return { data: body, error: null };

    } catch (err) {
        let errorMessage = "Something went wrong while updating password.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
};

const resetPassword = async (data: {}) => {
    try {
        const response = await api.post(endpoints.resetPassword, data);

        const body = response.data;

        // Backend always returns 200 HTTP, but status_code inside tells real status.
        if (body.status_code !== 200) {
            return { data: null, error: body.error_message || "Password update failed" };
        }

        return { data: body, error: null };

    } catch (err) {
        let errorMessage = "Something went wrong while updating password.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
}; 

const forgetPassword = async (data: {}) => {
    try {
        const response = await api.post(endpoints.forgetPassword, data);

        const body = response.data;

        // Backend always returns 200 HTTP, but status_code inside tells real status.
        if (body.status_code !== 200) {
            return { data: null, error: body.error_message || "Password update failed" };
        }

        return { data: body, error: null };

    } catch (err) {
        let errorMessage = "Something went wrong while updating password.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
};

export default { changePassword, resetPassword, forgetPassword } 