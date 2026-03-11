

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getdashboardconfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getdashboardconfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to fetch dashboard configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createdashboardconfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createdashboardconfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create dashboard configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updatedashboardconfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updatedashboardconfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update dashboard configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getdashboardconfig, createdashboardconfig,updatedashboardconfig}