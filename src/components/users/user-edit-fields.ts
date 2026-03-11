import { useOrgStore } from "@/lib/store/org-store";

export const useUserEditFields = () => {
  const { orgs } = useOrgStore();
  return [
    {
      key: "name",
      label: "Full Name",
      type: "text" as const,
      required: true,
      placeholder: "Enter full name",
    },
    {
      key: "user_id",
      label: "Email",
      type: "readonly" as const,
      required: true,
      placeholder: "Enter email address",
    },
    {
      key: "it_dashboard_visibility",
      label: "IT Dashboard Visibility",
      type: "radio" as const,
      required: false,
      options: [
        { value: "true", label: "True" },
        { value: "false", label: "False" },
      ],
    },
    {
      key: "role",
      label: "Role",
      type: "role" as const,
      required: true,

      options: [
        { value: "USER", label: "User" },
        { value: "ADMIN", label: "Admin" },
        { value: "SUPER ADMIN", label: "Super Admin" },
      ],
    },
    {
      key: "user_status",
      label: "Status",
      type: "select" as const,
      required: true,

      options: [
        { value: "ACTIVE", label: "ACTIVE" },
        { value: "INACTIVE", label: "INACTIVE" },
      ],
    },
    {
      key: "org_name",
      label: "Organisation",
      type: "org" as const,
      required: true,

      options: orgs
        .filter((org) => org.org_name != null) // Filter out organizations with undefined/null names
        .map((org) => ({
          value: org.org_name as string,
          label: org.org_name as string,
        })),
    },
  ];
};
