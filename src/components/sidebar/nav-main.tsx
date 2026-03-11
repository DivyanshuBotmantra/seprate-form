import { ChevronRight, type LucideIcon } from "lucide-react";
import { useLocation, Link } from "react-router-dom";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/ui/sidebar";

export function NavMain({
  items,
  label = "Platform",
}: {
  items: {
    title: string;
    url: string;
    icon?: LucideIcon;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
      icon?: LucideIcon;
      isActive?: boolean;
    }[];
  }[];
  label?: string;
}) {
  const location = useLocation();

  // Helper function to check if a URL matches the current location
  const isUrlActive = (url: string) => {
    const currentPath = location.pathname;
    const currentSearch = location.search;

    // If URL contains query params, parse and compare
    if (url.includes("?")) {
      const [urlPath, urlSearch] = url.split("?");

      // First check if pathname matches
      if (currentPath !== urlPath) {
        return false;
      }

      // If both have query params, compare them
      if (currentSearch && urlSearch) {
        // Parse query params into objects for comparison
        const currentParams = new URLSearchParams(currentSearch);
        const urlParams = new URLSearchParams(urlSearch);

        // Check if all params in urlParams exist in currentParams with same values
        for (const [key, value] of urlParams.entries()) {
          if (currentParams.get(key) !== value) {
            return false;
          }
        }
        return true;
      }

      // If only one has query params, they don't match
      return false;
    }

    // No query params, just compare pathname
    return currentPath === url;
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item, index) => {
          // Check if any sub-item is active
          const hasActiveSubItem = item.items?.some((subItem) =>
            isUrlActive(subItem.url)
          );

          return (
            <Collapsible
              key={index}
              asChild
              defaultOpen={item.isActive || hasActiveSubItem}
              className="group/collapsible"
            >
              <SidebarMenuItem>
                <CollapsibleTrigger asChild>
                  <SidebarMenuButton tooltip={item.title}>
                    {item.icon && <item.icon />}

                    {/* For Bots section, make category clickable */}
                    {label === "Bots" ? (
                      <Link
                        to={`/dashboard-category?category=${encodeURIComponent(item.title)}`}
                        className="truncate max-w-[200px] flex-1"
                        onClick={(e) => {
                          // Stop propagation to prevent collapsible toggle when clicking category name
                          e.stopPropagation();
                        }}
                      >
                        {item.title}
                      </Link>
                    ) : (
                      <span className="truncate max-w-[200px]">{item.title}</span>
                    )}

                    <ChevronRight className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                  </SidebarMenuButton>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items?.map((subItem, index) => {
                      const isActive = isUrlActive(subItem.url);
                      return (
                        <SidebarMenuSubItem key={index}>
                          <SidebarMenuSubButton asChild isActive={isActive}>
                            <Link to={subItem.url}>
                              <span>{subItem.title}</span>
                            </Link>
                          </SidebarMenuSubButton>
                        </SidebarMenuSubItem>
                      );
                    })}
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
