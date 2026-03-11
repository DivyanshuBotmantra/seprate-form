import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


export const getDashboardBotUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getDashboardBotUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve dashboard users.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const createDashboardBotUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createDashboardBotUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to assign user to dashboard.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const deleteDashboardBotUser = async (payload: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.delete(endpoints.deleteDashboardBotUser, {
            data: payload
        });

        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to remove user from dashboard.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

