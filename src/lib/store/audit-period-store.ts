import { create } from "zustand";

export const auditPeriods = [
  { value: "1st Jan 25 - 31st Dec 25", label: "1st Jan 25 - 31st Dec 25" },
  { value: "1st Jan 24 - 31st Dec 24", label: "1st Jan 24 - 31st Dec 24" },
  { value: "1st Jan 23 - 31st Dec 23", label: "1st Jan 23 - 31st Dec 23" },
  { value: "1st Jan 22 - 31st Dec 22", label: "1st Jan 22 - 31st Dec 22" },
];

interface AuditPeriodState {
  selectedPeriod: string;
  setSelectedPeriod: (period: string) => void;
}

export const useAuditPeriodStore = create<AuditPeriodState>((set) => ({
  selectedPeriod: "1st Jan 25 - 31st Dec 25",
  setSelectedPeriod: (period: string) => set({ selectedPeriod: period }),
}));
