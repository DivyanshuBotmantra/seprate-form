import { AxiosError } from "axios";
import { api, endpoints } from "./api";

const data = { org_name: "", status: "" };

const getOrganizations = async () => {
  try {
    const response = await api.post(endpoints.getOrganizations, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage =
      "Failed to retrieve organization details.";

    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }

    return { data: null, error: errorMessage };
  }
};

const updateOrganisation = async (data: any) => {
  try {
    const response = await api.put(endpoints.updateOrganisation, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage =
      "Failed to update organization.";

    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }

    return { data: null, error: errorMessage };
  }
};

const createOrganisation = async (data: any) => {
  try {
    const response = await api.post(endpoints.createOrganisation, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Failed to create organization.";

    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }

    return { data: null, error: errorMessage };
  }
};

export { getOrganizations, updateOrganisation, createOrganisation };
