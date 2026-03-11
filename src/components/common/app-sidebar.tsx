import * as React from "react";
import { Link } from "react-router-dom";
import {
  BotIcon,
  LayoutDashboard,
  BarChart3,
  ClipboardList,
  Activity,
} from "lucide-react";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";
import { NavMain } from "../sidebar/nav-main";
import { useTheme } from "@/contexts/theme-provider";
import logoLight from "@/../public/logo.png";
import logoDark from "@/../public/logo_white.png";

// Mapping from menu titles to URLs
const adminMenuUrlMap: Record<string, string> = {
  "Manage Organizations": "/Organisation",
  "Manage Users": "/users",
  "Manage Dashboards Config": "/dashboard-config",
  "Manage BOT Master": "/bot-config",
  "Manage Forms Master": "/form-master",
  "Manage Task Master": "/task-master",
  "Manage Work Flow Master": "/manage-work-flow-config",
  "Manage Email Config": "/email-config"
};

interface SidebarMenuData {
  admin_menu_list?: string[];
  bot_menu_list?: Array<{
    bot_name: string;
    bot_category: string;
    bot_code: string;
  }>;
  dashboard_menu_list?: Array<{
    dashboard_name: string;
    dashboard_url?: string;
    dashboard_config_json: {
      url?: string;
      [key: string]: any;
    };
  }>;
  task_menu_list?: Array<{
    task_code: string;
    task_name: string;
    task_category: string;
  }>;
  form_menu_list?: Array<{
    form_code: string;
    form_name: string;
    form_category: string;
    form_url: string;
    sidebar_visibility?: boolean | null;
  }>;
  org_dashboard?: Array<{
    dashboard_name: string;
  }>;
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { state } = useSidebar();
  const { theme } = useTheme();
  const isCollapsed = state === "collapsed";

  const [isSystemDark, setIsSystemDark] = React.useState(
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );

  React.useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = (e: MediaQueryListEvent) => setIsSystemDark(e.matches);
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  const showDark = theme === "dark" || (theme === "system" && isSystemDark);

  // Get sidebar menu items from session storage
  const [sidebarMenuData, setSidebarMenuData] =
    React.useState<SidebarMenuData | null>(null);

  const loadSidebarData = React.useCallback(() => {
    const storedSidebarItems = sessionStorage.getItem("sidebarItems");
    if (storedSidebarItems) {
      try {
        const parsed = JSON.parse(storedSidebarItems);
        setSidebarMenuData(parsed);
      } catch (error) {
        console.error(
          "Error parsing sidebar items from session storage:",
          error
        );
      }
    }
  }, []);

  React.useEffect(() => {
    loadSidebarData();
  }, [loadSidebarData]);

  // Listen for organization changes to refresh sidebar
  React.useEffect(() => {
    const handleOrgChange = () => {
      loadSidebarData();
    };

    window.addEventListener("organizationChanged", handleOrgChange);
    return () => {
      window.removeEventListener("organizationChanged", handleOrgChange);
    };
  }, [loadSidebarData]);

  // Listen for sidebar items updates to refresh sidebar
  React.useEffect(() => {
    const handleSidebarUpdate = () => {
      loadSidebarData();
    };

    window.addEventListener("sidebarItemsUpdated", handleSidebarUpdate);
    return () => {
      window.removeEventListener("sidebarItemsUpdated", handleSidebarUpdate);
    };
  }, [loadSidebarData]);

  // Build admin menu items from session storage
  const buildAdminMenuItems = React.useMemo(() => {
    if (
      !sidebarMenuData?.admin_menu_list ||
      sidebarMenuData.admin_menu_list.length === 0
    ) {
      return [];
    }

    const menuItems = sidebarMenuData.admin_menu_list
      .map((title) => ({
        title,
        url:
          adminMenuUrlMap[title] ||
          `/${title.toLowerCase().replace(/\s+/g, "-")}`,
      }))
      .filter((item) => item.url); // Filter out items without valid URLs

    return [
      {
        title: "Admin",
        url: "#",
        icon: LayoutDashboard,
        isActive: true,
        items: [...menuItems],
      },
    ];
  }, [sidebarMenuData?.admin_menu_list]);

  // Build bot menu items from session storage, grouped by category
  const buildBotMenuItems = React.useMemo(() => {
    if (
      !sidebarMenuData?.bot_menu_list ||
      sidebarMenuData.bot_menu_list.length === 0
    ) {
      return [];
    }

    // Group bots by category
    const botsByCategory = sidebarMenuData.bot_menu_list.reduce((acc, bot) => {
      console.log(bot, "bot");
      const category = bot.bot_category || "Other";
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(bot);
      return acc;
    }, {} as Record<string, typeof sidebarMenuData.bot_menu_list>);

    // Convert to menu structure
    return Object.entries(botsByCategory).map(([category, bots]) => ({
      title: category,
      url: "#",
      icon: BotIcon,
      isActive: true,
      items: bots.map((bot) => ({
        title: bot.bot_name,
        // Navigate to dashboard first when clicking bot (changed from /bot to /bot-dashboard)
        url: `/bot-dashboard?bot_code=${encodeURIComponent(
          bot.bot_code
        )}&bot_name=${encodeURIComponent(
          bot.bot_name
        )}&bot_category=${encodeURIComponent(bot.bot_category)}`,
      })),
    }));
  }, [sidebarMenuData?.bot_menu_list]);

  // Build dashboard menu items from session storage
  const buildDashboardMenuItems = React.useMemo(() => {
    if (
      !sidebarMenuData?.dashboard_menu_list ||
      sidebarMenuData.dashboard_menu_list.length === 0
    ) {
      return [];
    }

    const menuItems = sidebarMenuData.dashboard_menu_list
      .map((dashboard) => {
        // Extract URL from dashboard_config_json
        const url =
          dashboard.dashboard_url ||
          `/dashboard?query=${encodeURIComponent(dashboard.dashboard_name)}`;

        return {
          title: dashboard.dashboard_name,
          url,
        };
      })
      .filter((item) => item.url); // Filter out items without valid URLs

    return [
      {
        title: "Dashboard",
        url: "#",
        icon: BarChart3,
        isActive: true,
        items: [...menuItems],
      },
    ];
  }, [sidebarMenuData]);

  // Build task menu items from session storage, grouped by category
  const buildTaskMenuItems = React.useMemo(() => {
    if (
      !sidebarMenuData?.task_menu_list ||
      sidebarMenuData.task_menu_list.length === 0
    ) {
      return [];
    }

    // Group tasks by category
    const tasksByCategory = sidebarMenuData.task_menu_list.reduce(
      (acc, task) => {
        const category = task.task_category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(task);
        return acc;
      },
      {} as Record<string, typeof sidebarMenuData.task_menu_list>
    );

    // Convert to menu structure
    return Object.entries(tasksByCategory).map(([category, tasks]) => ({
      title: category,
      url: "#",
      icon: ClipboardList,
      isActive: true,
      items: tasks.map((task) => ({
        title: task.task_name,
        url: `/task?task_code=${task.task_code}&task_name=${encodeURIComponent(
          task.task_name
        )}&task_category=${encodeURIComponent(task.task_category)}`,
      })),
    }));
  }, [sidebarMenuData?.task_menu_list]);

  // Build form menu items from session storage, grouped by category
  // Only display forms where sidebar_visibility is true
  const buildFormMenuItems = React.useMemo(() => {
    if (
      !sidebarMenuData?.form_menu_list ||
      sidebarMenuData.form_menu_list.length === 0
    ) {
      return [];
    }

    // Filter: only show forms with sidebar_visibility === true
    const visibleForms = sidebarMenuData.form_menu_list.filter(
      (form) => form.sidebar_visibility === true
    );

    if (visibleForms.length === 0) return [];

    // Group forms by category
    const formsByCategory = visibleForms.reduce(
      (acc, form) => {
        const category = form.form_category || "Other";
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(form);
        return acc;
      },
      {} as Record<string, typeof visibleForms>
    );

    // Convert to menu structure
    return Object.entries(formsByCategory).map(([category, forms]) => ({
      title: category,
      url: "#",
      icon: ClipboardList,
      isActive: true,
      items: forms.map((form) => ({
        title: form.form_name,
        url: `/form-log?form_code=${encodeURIComponent(
          form.form_code
        )}&form_name=${encodeURIComponent(
          form.form_name
        )}&form_category=${encodeURIComponent(form.form_category)}`,
      })),
    }));
  }, [sidebarMenuData?.form_menu_list]);

  // Build org dashboard menu items from session storage
  const buildOrgDashboardMenuItems = React.useMemo(() => {
    return (sidebarMenuData?.org_dashboard || []).map((db) => ({
      title: db.dashboard_name,
      url: db.dashboard_name === "BOT Dashboard" ? "/it-dashboard" : "/dashboard",
      icon: Activity,
    }));
  }, [sidebarMenuData?.org_dashboard]);


  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <div
          className={`flex items-center gap-4 pt-4 px-4 transition-all duration-200 ${isCollapsed ? "flex-col justify-center" : "justify-start"
            }`}
        >
          <div className={`relative transition-all duration-300 flex items-center shrink-0 ${isCollapsed ? "w-8 h-8" : "h-10 w-[120px]"}`}>
            {/* Light Logo */}
            <img
              src={logoLight}
              alt="logo light"
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain transition-all duration-300 ${isCollapsed ? "w-8 h-8" : ""
                } ${showDark ? "opacity-0 invisible" : "opacity-100 visible"}`}
            />
            {/* Dark Logo */}
            <img
              src={logoDark}
              alt="logo dark"
              className={`absolute left-0 top-1/2 -translate-y-1/2 h-full w-auto object-contain transition-all duration-300 ${isCollapsed ? "w-8 h-8" : "scale-[1.25] origin-left"
                } ${showDark ? "opacity-100 visible" : "opacity-0 invisible"}`}
            />
          </div>

          <SidebarTrigger
            className={`transition-all duration-200 shrink-0 ${isCollapsed ? "mt-2" : "ml-auto"
              }`}
          />
        </div>
      </SidebarHeader>

      <SidebarContent>
        {buildAdminMenuItems.length > 0 && (
          <NavMain items={buildAdminMenuItems} label="Platform" />
        )}
        {buildOrgDashboardMenuItems.length > 0 && (
          <SidebarGroup>
            {/* <SidebarGroupLabel>IT Dashboard</SidebarGroupLabel> */}
            <SidebarMenu>
              {buildOrgDashboardMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <Link to={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        )}
        {buildDashboardMenuItems.length > 0 && (
          <NavMain items={buildDashboardMenuItems} label="Dashboards" />
        )}
        {buildBotMenuItems.length > 0 && (
          <NavMain items={buildBotMenuItems} label="Bots" />
        )}
        {buildTaskMenuItems.length > 0 && (
          <NavMain items={buildTaskMenuItems} label="Tasks" />
        )}
        {buildFormMenuItems.length > 0 && (
          <NavMain items={buildFormMenuItems} label="Forms" />
        )}

      </SidebarContent>
      <SidebarFooter />
      <SidebarRail />
    </Sidebar>
  );
}
