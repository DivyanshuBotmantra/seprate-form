

import { AxiosError } from "axios";
import { api, endpoints } from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };

export const directFileUpload = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await api.post(endpoints.directFileUpload, data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve bot user details.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default { directFileUpload }