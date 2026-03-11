

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getWorkFlow = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getWorkFlow, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve workflow details.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createWorkFlow = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createWorkFlow, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create workflow.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updateWorkFlow = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updateWorkFlow, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update workflow.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getWorkFlow, createWorkFlow,updateWorkFlow}