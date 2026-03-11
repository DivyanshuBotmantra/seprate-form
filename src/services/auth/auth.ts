// userService.ts
import { AxiosError } from "axios";
import { api, endpoints, loginApi } from "../api";
type APIResponse<T> = { data: T | null; error: string | null };

const validateUser = async (data: any): Promise<APIResponse<any>> => {
  try {
    const response = await loginApi.post(endpoints.validateUser, data);
    const expiryTime = Date.now() + 1000 * 60 * 60;

    if (response.data) {
      sessionStorage.setItem("token_expiry", expiryTime.toString());
      sessionStorage.setItem(
        "token",
        response.data.response_body.authorize_token
      );
    }

    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Something went wrong during login.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};
const getUserDetail = async (data: any): Promise<APIResponse<any>> => {
  try {
    const response = await api.post(endpoints.getUserDetail, data);
    return { data: response.data, error: null };
  } catch (err) {
    let errorMessage = "Something went wrong while fetching user details.";
    if (err instanceof AxiosError) {
      errorMessage = err.response?.data?.error_message || err.message;
    }
    return { data: null, error: errorMessage };
  }
};

const renewToken = async (): Promise<{
  success: boolean;
  expiry?: number;
  error?: string;
}> => {
  const currentToken = sessionStorage.getItem("token");
  if (!currentToken) {
    return { success: false, error: "No token available for renewal." };
  }

  try {
    const response = await loginApi.post(endpoints.regenerateToken, {
      authorize_token: currentToken,
    });

    const expiryTime = Date.now() + 60 * 60 * 1000; // 1 hr from now
    const newToken = response.data?.response_body?.authorize_token;

    sessionStorage.setItem("token", newToken);
    sessionStorage.setItem("token_expiry", expiryTime.toString());

    return { success: true, expiry: expiryTime };
  } catch (error) {
    let errorMessage = "Something went wrong while renewing token.";
    if (error instanceof AxiosError) {
      errorMessage = error.response?.data?.error_message || error.message;
    }
    return { success: false, error: errorMessage };
  }
};

export { validateUser, getUserDetail, renewToken };
