import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


export const getBotUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getBotUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve bot user details.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const createBotUser = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createBotUser, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to assign user to bot.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


export const deleteBotUser = async (payload: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.delete(endpoints.deleteBotUser, {
            data: payload 
        });

        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to remove user from bot.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

