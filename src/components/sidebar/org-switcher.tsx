import { useEffect, useState } from "react";
import {
  Building,
  ChevronDown,
  FileChartColumnIncreasing,
  Plus,
  Search,
} from "lucide-react";
import { useOrganizationSwitcher } from "@/contexts/OrganizationContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useOrgStore } from "@/lib/store/org-store";
import { getUserDetails, isSuperAdmin } from "@/lib/auth";
import { updateSidebarItems } from "@/lib/sidebar-utils";

interface Organization {
  id?: string;
  org_name: string;
  org_status: string;
  name?: string;
  icon?: React.ReactNode;
}

export function OrganizationSwitcher({
  onOrganizationChange,
}: {
  onOrganizationChange?: (orgId: string) => void;
}) {
  const { isOrgSwitcherOpen, closeOrgSwitcher } = useOrganizationSwitcher();
  const selectedOrg = useOrgStore((s) => s.selectedOrg);
  const setSelectedOrg = useOrgStore((s) => s.setSelectedOrg);
  const orgs = useOrgStore((s) => s.orgs);
  const fetchOrgs = useOrgStore((s) => s.fetchOrgs);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [visibleCount, setVisibleCount] = useState(3);
  const user = getUserDetails();
  const isSuper = isSuperAdmin();
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await fetchOrgs();
      setIsLoading(false);
    };
    load();
  }, [fetchOrgs]);

  // Normalize org_status early — so UI doesn't compare "Active" vs "ACTIVE"
  const normalizedOrgs = orgs.map((o) => ({
    ...o,
    org_status: o.org_status.toLowerCase(),
  }));

  const userAllowed = (orgName: string) => {
    if (isSuper) return true;
    if (!user?.org_name) return false;
    return Array.isArray(user.org_name)
      ? user.org_name.includes(orgName)
      : user.org_name === orgName;
  };

  const filtered = normalizedOrgs.filter((o) => {
    const active = o.org_status === "active";
    const searchMatch = o.org_name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return active && searchMatch && userAllowed(o.org_name);
  });

  // Default selection logic
  useEffect(() => {
    if (normalizedOrgs.length === 0 || selectedOrg) return;

    const stored = sessionStorage.getItem("SelectedOrg");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const found = normalizedOrgs.find(
          (o) => o.org_name === parsed.org_name
        );
        if (found && userAllowed(found.org_name)) {
          setSelectedOrg(found);
          // Update sidebar items when restoring from session storage
          updateSidebarItems(found.org_name).catch((error) => {
            console.error("Failed to update sidebar items:", error);
          });
          return;
        }
      } catch {}
      sessionStorage.removeItem("SelectedOrg");
    }

    // SUPER ADMIN: prefer "Botmantra" if active
    let fallback;
    if (isSuper) {
      fallback = normalizedOrgs.find(
        (o) => o.org_name === "Botmantra" && o.org_status === "active"
      );
      if (!fallback)
        fallback = normalizedOrgs.find((o) => o.org_status === "active");
    } else {
      fallback = normalizedOrgs.find(
        (o) => o.org_status === "active" && userAllowed(o.org_name)
      );
    }

    if (fallback) {
      const orgObj = {
        ...fallback,
        id: fallback.id || fallback.org_name,
        name: fallback.org_name,
      };
      setSelectedOrg(orgObj);
      sessionStorage.setItem("SelectedOrg", JSON.stringify(orgObj));

      // Update sidebar items when organization is auto-selected
      updateSidebarItems(orgObj.org_name).catch((error) => {
        console.error("Failed to update sidebar items:", error);
      });

      onOrganizationChange?.(orgObj.id);

      window.dispatchEvent(
        new CustomEvent("organizationChanged", {
          detail: { organization: orgObj, orgName: orgObj.org_name },
        })
      );
    }
  }, [
    normalizedOrgs,
    selectedOrg,
    setSelectedOrg,
    user,
    isSuper,
    onOrganizationChange,
  ]);

  const visible = filtered.slice(0, visibleCount);

  const handleChange = async (org: Organization) => {
    const formatted = {
      ...org,
      id: org.id || org.org_name,
      name: org.org_name,
    };

    setSelectedOrg(formatted);
    sessionStorage.setItem("SelectedOrg", JSON.stringify(formatted));
    setIsOpen(false);

    // Update sidebar items when organization changes
    await updateSidebarItems(formatted.org_name);

    onOrganizationChange?.(formatted.id);

    window.dispatchEvent(
      new CustomEvent("organizationChanged", {
        detail: { organization: formatted, orgName: formatted.org_name },
      })
    );
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem className="flex justify-center items-center p-2 max-w-[210px]">
        <DropdownMenu
          open={isOpen || isOrgSwitcherOpen}
          onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) {
              setVisibleCount(3);
              setSearchQuery("");
              closeOrgSwitcher();
            }
          }}
        >
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="bg-muted dark:bg-muted/60 p-2.5 h-9 border shadow-sm hover:shadow-md">
              <Building className="w-3 h-3" />
              <div className="flex-1 text-left text-sm truncate">
                {selectedOrg?.org_name || "Select Organization"}
              </div>
              <ChevronDown className="w-4 h-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>

          <DropdownMenuContent className="min-w-56 rounded-lg" sideOffset={4}>
            <div className="relative px-2 py-1">
              <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setVisibleCount(3);
                }}
                className="h-8 text-sm pl-8"
              />
            </div>

            <DropdownMenuSeparator />

            {isLoading ? (
              <DropdownMenuItem disabled>Loading...</DropdownMenuItem>
            ) : visible.length > 0 ? (
              <>
                {visible.map((org, i) => (
                  <DropdownMenuItem
                    key={i}
                    className="gap-2 p-2"
                    onClick={() => handleChange(org)}
                  >
                    <div className="flex size-6 items-center justify-center rounded-md border">
                      <FileChartColumnIncreasing className="size-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium">{org.org_name}</span>
                      <span className="text-xs text-green-600">
                        {org.org_status}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))}

                {visibleCount < filtered.length && (
                  <div
                    onClick={() => setVisibleCount((c) => c + 3)}
                    className="flex items-center justify-center text-xs mt-2 p-2 cursor-pointer hover:bg-accent rounded-sm"
                  >
                    <Plus className="size-4" />
                    Show more ({filtered.length - visibleCount} remaining)
                  </div>
                )}

                {/* {isSuper && (
                  <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem className="gap-2 p-2">
                      <Plus className="size-4" />
                      <a href="/organisation">Manage organization</a>
                    </DropdownMenuItem>
                  </>
                )} */}
              </>
            ) : (
              <DropdownMenuItem disabled>
                No active organizations found
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
