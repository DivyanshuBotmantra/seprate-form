import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


export const getwfformuser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getwfformuser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve workflow form users.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const createwfformuser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createwfformuser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to assign user to workflow form.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const deletewfformuser = async (payload: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.delete(endpoints.deletewfformuser, {
            data: payload 
        });

        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to remove user from workflow form.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

