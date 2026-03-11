import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


export const getFormMasterUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getFormMasterUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve form users.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const createFormMasterUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createFormMasterUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to assign user to form.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const deleteFormMasterUser = async (payload: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.delete(endpoints.deleteFormMasterUser, {
            data: payload
        });

        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to remove user from form.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

