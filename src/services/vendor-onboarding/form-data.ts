import axios, { AxiosError } from "axios";
import { formApi } from "@/services/api";

type APIResponse<T> = { data: T | null; error: string | null };

const BASE_URL = "https://botiq-form-uat-drgpftbwbnbjd2fb.centralindia-01.azurewebsites.net/api";

const COMMON_HEADERS = {
    "Content-Type": "application/json",
    "request_type": "application/json",
};

/**
 * Fetches the specific JWT token for the form data environment.
 */
const getFormAuthToken = async (): Promise<string | null> => {
    try {
        const payload = {
            "user_id": "divyanshu.srivastava@botmantra.com",
            "password": "Welcome@123"
        };
        const response = await axios.post(`${BASE_URL}/validate_user_admin_api`, payload, {
            headers: COMMON_HEADERS
        });
        
        const token = response.data?.response_body?.authorize_token || response.data?.token;
        
        if (token) {
            sessionStorage.setItem("form_token", token);
            return token;
        }
    } catch (err) {
        console.error("Failed to authenticate with form data API:", err);
    }
    return null;
};

/**
 * Helper to make authenticated POST requests specifically for form data endpoints.
 * Handles token injection and 401 retries.
 */
const callFormApi = async (endpoint: string, data: any): Promise<APIResponse<any>> => {
    const makeRequest = async () => {
        let token = sessionStorage.getItem("form_token");
        if (!token) {
            token = await getFormAuthToken();
        }
        return await formApi.post(`${BASE_URL}${endpoint}`, data, {
            headers: { 
                ...COMMON_HEADERS,
                "authorize_token": token || "",
            }
        });
    };

    try {
        const response = await makeRequest();
        return { data: response.data, error: null };
    } catch (err) {
        if (err instanceof AxiosError && err.response?.status === 401) {
            // Token is likely invalid or expired, try to refresh once
            sessionStorage.removeItem("form_token");
            try {
                const response = await makeRequest();
                return { data: response.data, error: null };
            } catch (retryErr) {
                let retryMessage = "Authentication failed for form data.";
                if (retryErr instanceof AxiosError) {
                    retryMessage = retryErr.response?.data?.error_message || retryErr.message;
                }
                return { data: null, error: retryMessage };
            }
        }
        
        let errorMessage = "Failed to process form data request.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export const getFormData = async (data: any): Promise<APIResponse<any>> => {
    return callFormApi("/get_form_data_api", data);
};

export const createFormData = async (data: any): Promise<APIResponse<any>> => {
    return callFormApi("/create_form_data_api", data);
};

export const updateFormData = async (data: any): Promise<APIResponse<any>> => {
    return callFormApi("/update_form_data_api", data);
};

export const deleteFormData = async (data: any): Promise<APIResponse<any>> => {
    return callFormApi("/delete_form_data_api", data);
};

export const getFormLovs = async (data: { form_name: string; org_name: string }): Promise<APIResponse<any>> => {
    return callFormApi("/get_lov_form_admin_api", data);
};

