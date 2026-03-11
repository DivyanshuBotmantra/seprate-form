import { createOrganisation, getOrganizations } from "@/services/organisation";
import { create } from "zustand";

interface Organization {
  id: string;
  name: string;
  icon?: string;
  org_name?: string;
}

interface OrgState {
  orgs: Organization[];
  selectedOrg: Organization | null;
  loading: boolean;
  fetchOrgs: () => Promise<void>;
  setSelectedOrg: (org: Organization) => Promise<void>;
  clearOrg: () => void;
}

export const useOrgStore = create<OrgState>((set, get) => {
  const savedOrg = sessionStorage.getItem("SelectedOrg");
  const initialSelectedOrg = savedOrg ? JSON.parse(savedOrg) : null;

  return {
    selectedOrg: initialSelectedOrg,
    loading: false,
    orgs: [],
    setSelectedOrg: async (org) => {
      sessionStorage.setItem("SelectedOrg", JSON.stringify(org));
      set({ selectedOrg: org });
    },

    fetchOrgs: async () => {
      set({ loading: true });
      try {
        const { data } = await getOrganizations();
        if (data) {
          set({ orgs: data.response_body });
        }
      } catch (error) {
        console.error("Failed to fetch organizations:", error);
      } finally {
        set({ loading: false });
      }
    },

    createOrg: async (data: any) => {
      try {
        const result = await createOrganisation(data);
        if (!result.error) {
          await get().fetchOrgs();
        }
        return result;
      } catch (error) {
        console.error("Error in createOrg:", error);
        return { data: null, error: "Failed to create organisation" };
      }
    },
    clearOrg: () => {
      sessionStorage.removeItem("SelectedOrg");
      set({ selectedOrg: null, orgs: [] });
    },
  };
});
