import { useState, useCallback, useRef } from "react";
import {
  getFormUserMaster,
  getFormDetails,
  getOrgFormDetails,
  type FormUserMasterPayload,
  type FormDetailsPayload,
  type OrgFormDetailsPayload,
} from "@/services/form";
import { toast } from "sonner";
import type { Form } from "@/types/form";

interface UserSessionData {
  user_id: string;
  org_name: string;
  userRole: string;
}

interface FormDetailsData {
  form_name: string;
  form_description: string;
  form_status: string;
}

// Inline implementation of getUserDetailsFromSession
const getUserDetailsFromSession = (): UserSessionData => {
  try {
    const userDetails = JSON.parse(
      sessionStorage.getItem("userDetail") || "{}"
    );
    const selectedOrg = JSON.parse(
      sessionStorage.getItem("SelectedOrg") || "{}"
    );

    // Get user_id and role
    let userId = userDetails?.user_id || "";
    const userRole = userDetails?.role || "";

    // Get org_name based on user role
    let orgName = "";

    if (userRole === "USER") {
      // For USER role: get org_name from userDetails and auto-set SelectedOrg
      if (userDetails?.org_name) {
        // Handle both array and string formats for org_name
        orgName = Array.isArray(userDetails.org_name)
          ? userDetails.org_name[0]
          : userDetails.org_name;

        // Auto-set SelectedOrg for USER role (no dropdown needed)
        if (!selectedOrg?.org_name || selectedOrg.org_name !== orgName) {
          const userSelectedOrg = {
            org_name: orgName,
            org_status: "Active",
            org_customization_json: {},
            name: orgName,
            id: orgName,
          };

          try {
            sessionStorage.setItem(
              "SelectedOrg",
              JSON.stringify(userSelectedOrg)
            );
            console.log(
              "✅ USER role - Auto-set SelectedOrg from userDetails:",
              orgName
            );
          } catch (error) {
            console.warn("Failed to set SelectedOrg for USER:", error);
          }
        }
      } else {
        console.warn("⚠️ USER role - No org_name found in userDetails");
      }
      console.log("USER role - orgName from userDetails:", orgName);
    } else if (userRole === "ADMIN") {
      // For ADMIN: get org_name from SelectedOrg with fallback to orgselect
      if (selectedOrg?.org_name) {
        orgName = selectedOrg.org_name;
      } else {
        // Fallback to orgselect from session storage
        const orgselect = sessionStorage.getItem("orgselect");
        if (orgselect) {
          orgName = orgselect;
        }
      }
      console.log("ADMIN role - orgName from SelectedOrg/orgselect:", orgName);
    } else if (userRole === "SUPER ADMIN") {
      // For SUPER ADMIN: get org_name from SelectedOrg with fallback to orgselect
      if (selectedOrg?.org_name) {
        orgName = selectedOrg.org_name;
      } else {
        // Fallback to orgselect from session storage
        const orgselect = sessionStorage.getItem("orgselect");
        if (orgselect) {
          orgName = orgselect;
        }
      }
      userId = ""; // SUPER ADMIN doesn't need user_id
    } else {
      console.warn("Unknown user role:", userRole);
    }

    return {
      user_id: userId,
      org_name: orgName,
      userRole,
    };
  } catch (error) {
    console.error("❌ Error getting user details from session:", error);
    return {
      user_id: "",
      org_name: "",
      userRole: "",
    };
  }
};

// No validation needed - organization is auto-handled for all roles:
// - ADMIN & SUPER ADMIN: Organization is auto-handled by org-switcher dropdown
// - USER: Only has access to one organization from their account

export const useFormFetching = () => {
  const [forms, setForms] = useState<Form[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>("");
  const isFetchingRef = useRef(false);

  const createFormDetailsPayload = useCallback(
    (orgName: string, formName: string): FormDetailsPayload => ({
      org_name: orgName,
      form_name: formName,
      form_template: "",
      storage_type: "",
      credentials: "",
      mail_server: "",
      mail_credentials: "",
      form_status: "",
      form_description: "",
    }),
    []
  );

  const deduplicateForms = useCallback((forms: Form[]): Form[] => {
    return forms.filter(
      (form, index, self) =>
        index === self.findIndex((f) => f.form_name === form.form_name)
    );
  }, []);

  const fetchForms = useCallback(async () => {
    // Prevent multiple simultaneous calls
    if (isFetchingRef.current) {
      // console.log("🔄 API call already in progress, skipping duplicate call");
      return;
    }

    try {
      isFetchingRef.current = true;
      setLoading(true);

      // Get user details and organization from session storage
      const userData = getUserDetailsFromSession();

      // Set user role for display purposes
      setUserRole(userData.userRole);

      // Validate organization before making API calls
      if (!userData.org_name) {
        console.warn(
          "⚠️ No organization found, skipping API call to prevent errors"
        );
        setForms([]);
        setLoading(false);
        return;
      }

      let activeForms: FormDetailsData[] = [];
      const errors: string[] = [];

      // Role-based API selection
      if (userData.userRole === "SUPER ADMIN") {
        // Super Admin: Call getOrgFormDetails to get all forms in the system
        // console.log("SUPER ADMIN: Fetching all forms in the system");

        const orgFormDetailsPayload: OrgFormDetailsPayload = {
          user_id: userData.user_id,
          org_name: userData.org_name,
        };

        const { data: allFormsData, error: allFormsError } =
          await getOrgFormDetails(orgFormDetailsPayload);

        if (allFormsError) {
          setForms([]);
          setLoading(false);
          return;
        }

        if (!allFormsData || allFormsData.length === 0) {
          toast.info("No forms found in the system.");
          setForms([]);
          setLoading(false);
          return;
        }

        // Filter for active forms only
        activeForms = allFormsData.filter(
          (form) => form.form_status === "Active"
        );
      } else if (
        userData.userRole === "ADMIN" ||
        userData.userRole === "USER"
      ) {
        // Admin and User: Call getFormUserMaster to get assigned forms
        console.log(`${userData.userRole}: Fetching assigned forms`);

        const userFormsPayload: FormUserMasterPayload = {
          org_name: userData.org_name,
          form_name: "", // Empty to get all assigned forms
          user_id: userData.user_id,
        };

        const { data: userForms, error: userFormsError } =
          await getFormUserMaster(userFormsPayload);

        if (userFormsError) {
          // toast.error(`Failed to fetch assigned forms: ${userFormsError}`);
          setForms([]);
          setLoading(false);
          return;
        }

        if (!userForms || userForms.length === 0) {
          console.log(`📋 No forms assigned to ${userData.userRole} role`);
          toast.info(
            `No forms assigned to your ${userData.userRole.toLowerCase()} role.`
          );
          setForms([]);
          setLoading(false);
          return;
        }

        console.log(`📋 User forms assigned:`, userForms);

        // Extract unique form names from assigned forms
        const formNames = [...new Set(userForms.map((form) => form.form_name))];
        console.log(`📋 Unique form names extracted:`, formNames);

        // Fetch details for each assigned form
        console.log(
          "📡 useFormFetching - Fetching form details for forms:",
          formNames
        );
        const formDetailsPromises = formNames.map(async (formName) => {
          const formDetailsPayload = createFormDetailsPayload(
            userData.org_name,
            formName
          );
          console.log(
            "📡 useFormFetching - Calling getFormDetails for:",
            formName
          );
          return await getFormDetails(formDetailsPayload);
        });

        // Wait for all form details to be fetched
        const formDetailsResults = await Promise.all(formDetailsPromises);

        // Process results and filter for active forms
        formDetailsResults.forEach((result, index) => {
          const formName = formNames[index];

          if (result.error) {
            console.error(
              `❌ Failed to fetch form details for ${formName}:`,
              result.error
            );
            errors.push(`Failed to fetch ${formName}: ${result.error}`);
          } else if (result.data && result.data.length > 0) {
            const form = result.data[0]; // getFormDetails returns array, take first item

            console.log(`🔍 Form details for ${formName}:`, {
              form_name: form.form_name,
              form_status: form.form_status,
              org_name: form.org_name,
              isActive: form.form_status === "Active",
            });

            if (form.form_status === "Active") {
              activeForms.push(form);
              console.log(`✅ Added active form: ${formName}`);
            } else {
              console.warn(
                `⚠️ Form ${formName} is not active (status: ${form.form_status})`
              );
            }
          } else {
            console.warn(`⚠️ No form details returned for ${formName}`);
          }
        });

        if (errors.length > 0) {
          toast.warning(`Some forms failed to load: ${errors.join(", ")}`);
        }
      } else {
        toast.error("Invalid user role. Please contact administrator.");
        setForms([]);
        setLoading(false);
        return;
      }

      // Map to Form interface and deduplicate by form_name
      const mappedForms: Form[] = activeForms.map((item) => ({
        form_name: item.form_name,
        form_description: item.form_description,
        form_status: item.form_status,
      }));

      // Add static Vendor Onboarding form for Rustom Jee organization
      if (userData.org_name === "Rustomjee") {
        const vendorOnboardingForm: Form = {
          form_name: "Vendor Onboarding",
          form_description:
            "Static vendor onboarding form for Rustom Jee organization",
          form_status: "Active",
        };

        // Check if Vendor Onboarding already exists to avoid duplicates
        const existingVendorForm = mappedForms.find(
          (form) => form.form_name === "Vendor Onboarding"
        );
        if (!existingVendorForm) {
          mappedForms.push(vendorOnboardingForm);
          console.log(
            "✅ Added static Vendor Onboarding form for Rustom Jee organization"
          );
        }
      }

      // Deduplicate forms by form_name to prevent duplicates
      const uniqueForms = deduplicateForms(mappedForms);

      // console.log(`📋 Final forms to display:`, {
      //   activeFormsCount: activeForms.length,
      //   mappedFormsCount: mappedForms.length,
      //   uniqueFormsCount: uniqueForms.length,
      //   uniqueForms: uniqueForms.map((f) => ({
      //     name: f.form_name,
      //     status: f.form_status,
      //   })),
      // });

      setForms(uniqueForms);

      if (uniqueForms.length === 0) {
        const roleMessage =
          userData.userRole === "SUPER ADMIN"
            ? "No active forms found in the system."
            : `No active forms assigned to your ${userData.userRole.toLowerCase()} role.`;
        console.warn(`⚠️ ${roleMessage}`);
        toast.info(roleMessage);
      }
    } catch (error) {
      console.error("Error fetching forms:", error);
      toast.error("Failed to fetch forms. Please try again.");
      setForms([]);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [createFormDetailsPayload, deduplicateForms]);

  return {
    forms,
    loading,
    userRole,
    fetchForms,
  };
};
