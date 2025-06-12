import { AdminSidebar } from "./AdminSidebar";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from '@/context/SidebarContext';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/admin':
        return 'Dashboard';
      case '/admin/users':
        return 'Users Management';
      case '/admin/products':
        return 'Products Management';
      case '/admin/orders':
        return 'Orders Management';
        case '/admin/inventory':
        return 'Inventory Management';
      default:
        return 'Admin Panel';
    }
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className={cn(
        "flex-1 bg-background transition-[margin] duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6">
          <h1 className="text-3xl font-bold text-foreground mb-8">{getPageTitle()}</h1>
          {children}
        </div>
      </main>
    </div>
  );
}
