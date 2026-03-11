import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { useLocation } from "react-router-dom";
import React from "react";
import { AppSidebar } from "../app-sidebar";
import { AdminHeader } from "./admin-header";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const location = useLocation();
  const isWorkflowRoute = location.pathname.startsWith("/test-workflow");
  const [sidebarOpen, setSidebarOpen] = React.useState(!isWorkflowRoute);

  React.useEffect(() => {
    setSidebarOpen(!isWorkflowRoute);
  }, [isWorkflowRoute]);

  return (
    <div>
      <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
        <div className="flex flex-col h-screen w-full ">
          <div className="flex flex-1 overflow-hidden gap- p-2">
            <AppSidebar className="" />
            <SidebarInset className="">
              <AdminHeader />
              {children}
            </SidebarInset>
          </div>
        </div>
      </SidebarProvider>
    </div>
  );
}
