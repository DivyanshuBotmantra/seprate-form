import { getSidebarConfig } from "@/services/siebar";
import { toast } from "sonner";

/**
 * Updates sidebar items in session storage and dispatches an event to refresh the sidebar UI
 * @param orgName - The organization name to fetch sidebar config for
 * @returns Promise that resolves when sidebar items are updated
 */
export const updateSidebarItems = async (orgName: string): Promise<void> => {
  if (!orgName) {
    console.warn("updateSidebarItems: orgName is required");
    return;
  }

  try {
    const { data: sidebarConfig, error: sidebarError } = await getSidebarConfig(
      {
        org_name: orgName,
      }
    );

    if (sidebarError) {
      toast.error(sidebarError, { duration: 2000 });
      return;
    }

    if (sidebarConfig?.response_body) {
      sessionStorage.setItem(
        "sidebarItems",
        JSON.stringify(sidebarConfig.response_body)
      );

      // Dispatch event to update sidebar UI
      window.dispatchEvent(
        new CustomEvent("sidebarItemsUpdated", {
          detail: { sidebarItems: sidebarConfig.response_body },
        })
      );
    }
  } catch (error) {
    console.error("Failed to update sidebar items:", error);
    toast.error("Failed to update sidebar items", { duration: 2000 });
  }
};
