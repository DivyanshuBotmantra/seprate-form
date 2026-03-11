type UserData = {
  user_id: string;
  role: string;
  user_status: string;
  user_name: string;
  org_name_list: string[];
};
import { AxiosError } from "axios";
import { api, endpoints } from "../api";
const getUsers = async (userData: UserData) => {
  try {
    const response = await api.post(endpoints.getUsers, userData);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Failed to retrieve user details.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};

export { getUsers };

interface APIResponse<T> {
  data: T | null;
  error: string | null;
}
interface UpdateUserPayload {
  user_id: string;
  [key: string]: any;
}

export const updateUser = async (
  payload: UpdateUserPayload
): Promise<APIResponse<UpdateUserPayload>> => {
  const { user_id, ...update_fields } = payload;

  try {
    const response = await api.put(endpoints.updateUser, {
      search_fields: { user_id },
      update_fields,
    });

    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Failed to update user details.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};
interface CreateUserPayload {
  name: string;
  org_name: string[];
  password: string;
  role: string;
  user_id: string;
  user_status: string;
}
export const createUser = async (
  payload: CreateUserPayload
): Promise<APIResponse<CreateUserPayload>> => {
  try {
    const response = await api.post<CreateUserPayload>(
      endpoints.createUser,
      payload
    );

    // Wrap in your own APIResponse type
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Failed to create new user.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};
