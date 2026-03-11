import { AxiosError } from "axios";
import { formApi} from "@/services/api";
type APIResponse<T> = { data: T | null; error: string | null };


const getFormDataApi  = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await formApi.post("https://botiq-form-uat-drgpftbwbnbjd2fb.centralindia-01.azurewebsites.net/api/get_form_data_api", data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to retrieve form data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};



const createFormDataApi  = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await formApi.post("", data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create Form data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};
const updateFormDataApi  = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await formApi.post("", data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create Form data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

const deleteFormData = async (data: any): Promise<APIResponse<any>> => {
    try {
        const response = await formApi.post("", data);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage = "Failed to create Form data.";
        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }
        return { data: null, error: errorMessage };
    }
};

export default {getFormDataApi, createFormDataApi, updateFormDataApi, deleteFormData}

