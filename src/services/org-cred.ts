import { AxiosError } from "axios";
import { api, endpoints } from "./api";

// -------------------------------
// GET ORG CREDENTIALS
// -------------------------------
export const getOrgCred = async (payload: {
    org_name: string;
    cred_type: string;
    cred_sub_type: string;
    cred_type_status?: "ACTIVE" | "INACTIVE";
}) => {
    try {
        const response = await api.post(endpoints.getOrgCred, payload);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage =
            "Something went wrong while fetching organisation credentials.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
};



// -------------------------------
// CREATE ORG CREDENTIAL
// -------------------------------
export const createOrgCred = async (payload: {
    org_name: string;
    cred_type: string;
    cred_sub_type: string;
    cred_json: any;
}) => {
    try {
        const response = await api.post(endpoints.createOrgCred, payload);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage =
            "Something went wrong while creating organisation credentials.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
};



// -------------------------------
// UPDATE ORG CREDENTIAL
// -------------------------------
export const updateOrgCred = async (payload: {
    search_fields: {
        org_name: string;
        cred_type: string;
        cred_sub_type: string;
    };
    update_fields: {
        cred_json?: any;
        cred_type_status?: "ACTIVE" | "INACTIVE";
    };
}) => {
    try {
        const response = await api.put(endpoints.updateOrgCred, payload);
        return { data: response.data, error: null };
    } catch (err) {
        let errorMessage =
            "Something went wrong while updating organisation credentials.";

        if (err instanceof AxiosError) {
            errorMessage = err.response?.data?.error_message || err.message;
        }

        return { data: null, error: errorMessage };
    }
};
