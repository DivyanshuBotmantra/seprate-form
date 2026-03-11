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

    const org_name_value = getOrgNameFromSession();

    const payload = {
      user_id: "",
      role: "", 
      name: "",
      org_name: org_name_value
        ? Array.isArray(org_name_value)
          ? org_name_value        // already array → keep it
          : [org_name_value]      // convert string → array
        : "",                     // empty → send empty string
      user_status: "",
    };

    const res = await getUsers(payload);

    const list =
      res?.data?.response_body ||
      res?.response_body ||
      [];

    set({
      users: Array.isArray(list)
        ? list.map((u) => ({
            ...u,
            user_id: u.user_id || u.email || "",  // <-- FIX
            user_status: u.user_status || u.status || "",
            org_name: u.org_name || [],
          }))
        : [],
      loading: false,
    });

  },

  updateUserAndRefresh: async (payload) => {
  set({ updating: true });

  try {
    const userId =
      (payload as any).user_id ||
      (payload as any).search_fields?.user_id;

    if (!userId) {
      return { error: "User ID is required for update" };
    }

    const { data, error } = await updateUser({
      search_fields: payload.search_fields,
      update_fields: payload.update_fields,
    });

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
