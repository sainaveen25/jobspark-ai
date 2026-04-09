import { ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Separator } from "@/components/ui/separator";

const pageTitles: Record<string, string> = {
  "/": "Dashboard",
  "/jobs": "Jobs",
  "/applications": "Applications",
  "/resume": "Resume Studio",
  "/settings": "Profile",
};

export function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const pageTitle = pageTitles[location.pathname] ?? "";

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center gap-3 border-b border-border/40 bg-background/95 backdrop-blur-sm px-4 sticky top-0 z-10">
            <SidebarTrigger className="shrink-0" />
            <Separator orientation="vertical" className="h-4" />
            <span className="text-sm font-medium text-muted-foreground">{pageTitle}</span>
          </header>
          <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
