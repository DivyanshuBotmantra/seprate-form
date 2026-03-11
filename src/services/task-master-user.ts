import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


export const getTaskMasterUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getTaskMasterUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve task users.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const createTaskMasterUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createTaskMasterUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to assign user to task.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const deletetaskMasterUser = async (payload: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.delete(endpoints.deletetaskMasterUser, {
            data: payload
        });

        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to remove user from task.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

