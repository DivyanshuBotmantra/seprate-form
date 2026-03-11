
import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };

const createBotExecution = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createBotExecution, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to Create Bot Execution data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

const getBotExecutionLog = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getBotExecutionLog, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve Bot Execution Log data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

const getBotCategoryExecutionLog = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getBotCategoryExecutionLog, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve Bot Execution Log data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default { createBotExecution, getBotExecutionLog, getBotCategoryExecutionLog };
