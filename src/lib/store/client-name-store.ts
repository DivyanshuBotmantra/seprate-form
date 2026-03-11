import { create } from "zustand";

export const clientNames = [{ value: "ABC Pvt Ltd", label: "ABC Pvt Ltd" }];

interface ClientNameState {
  selectedClient: string;
  setSelectedClient: (client: string) => void;
}

export const useClientNameStore = create<ClientNameState>((set) => ({
  selectedClient: "ABC Pvt Ltd",
  setSelectedClient: (client: string) => set({ selectedClient: client }),
}));
