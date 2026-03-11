// userService.ts
import { AxiosError } from "axios";
import { api, endpoints } from "./api";
type APIResponse<T> = { data: T | null; error: string | null };

const getSidebarConfig = async (data: any): Promise<APIResponse<any>> => {
  try {
    const response = await api.post(endpoints.getSidebarConfig, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Something went wrong while getting sidebar config.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};

export { getSidebarConfig };
