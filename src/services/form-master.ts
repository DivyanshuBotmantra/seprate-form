import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getformaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getformaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to fetch form master details.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const createFormMaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.createFormMaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create form master.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};


const updateFormMaster = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.put(endpoints.updateFormMaster, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to update form master.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getformaster, createFormMaster,updateFormMaster}