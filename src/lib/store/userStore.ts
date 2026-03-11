import { create } from "zustand";
import { getUsers, updateUser } from "@/services/user";
import type { User } from "@/constants/data";

interface UpdateUserResponse {
  data?: unknown;
  error?: string;
}

interface UserState {
  users: User[];
  loading: boolean;
  updating: boolean;
  fetchUsers: (orgName?: string) => Promise<void>;
  updateUserAndRefresh: (payload: Partial<User>) => Promise<UpdateUserResponse>;
}

export const useUserStore = create<UserState>((set, get) => ({
  users: [],
  loading: false,
  updating: false,

  fetchUsers: async (orgName?: string) => {
    set({ loading: true });

    const getOrgNameFromSession = () => {
      try {
        const userDetails = JSON.parse(sessionStorage.getItem("userDetail") || "{}");
        const selectedOrg = JSON.parse(sessionStorage.getItem("SelectedOrg") || "{}");

        return (
          orgName ||
          userDetails?.org_name ||
          selectedOrg?.org_name ||
          ""
        );
      } catch {
        return "";
      }
    };

    const org_name = getOrgNameFromSession();

    const payload = {
      user_id: "",
      role: "",
      name: "",
      org_name,      // <-- Correct for your backend!
      status: "ACTIVE",
    };

    const res = await getUsers(payload);

    const list =
      res?.data?.response_body ||
      res?.response_body ||
      [];

    set({
      users: Array.isArray(list) ? list : [],
      loading: false,
    });
  },

  updateUserAndRefresh: async (payload) => {
    set({ updating: true });

    try {
      if (!payload.user_id) {
        return { error: "User ID is required for update" };
      }

      const { data, error } = await updateUser(
        payload as { user_id: string; [key: string]: unknown }
      );

      if (data) {
        await get().fetchUsers();
        return { data };
      }

      if (error) return { error };

      return {};
    } finally {
      set({ updating: false });
    }
  },
}));
