

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getTaskmaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getTaskmaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to fetch task configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createTaskmaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createTaskmaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create task configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updateTaskmaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updateTaskmaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update task configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getTaskmaster, createTaskmaster,updateTaskmaster}