

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getBotConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getBotConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve bot configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createBotConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createBotConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create bot configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updateBotConfig = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updateBotConfig, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update bot configuration.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getBotConfig, createBotConfig,updateBotConfig}