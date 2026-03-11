

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getemailConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getemailConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to fetch email configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createEmailConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createEmailConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create email configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updateEmailConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updateEmailConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update email configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getemailConfig, createEmailConfig,updateEmailConfig}