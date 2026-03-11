// userService.ts
import { AxiosError } from "axios";
import { api, endpoints } from "../api";
type APIResponse<T> = { data: T | null; error: string | null };

const uploadFile = async (data: any): Promise<APIResponse<any>> => {
  try {
    const response = await api.post(endpoints.uploadFile, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Something went wrong while creating UUID folder.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};

export { uploadFile };
