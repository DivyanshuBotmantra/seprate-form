

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };



const getdashboardData = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getdashboardData, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve bot level  Dashboard data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

const getOrgDashboardData = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.getOrgDashboardData, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve organization level Dashboard data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default { getdashboardData, getOrgDashboardData };