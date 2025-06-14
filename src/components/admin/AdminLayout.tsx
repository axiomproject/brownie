import { AdminSidebar } from "./AdminSidebar";
import { useLocation } from "react-router-dom";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useSidebar } from '@/context/SidebarContext';
import { Bell } from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { NotificationItem } from './NotificationItem';
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useState } from 'react';

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { isCollapsed } = useSidebar();
  const location = useLocation();
  const { notifications, unreadCount, markAsRead, loadMore, hasMore, clearAll } = useNotifications();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

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


  const groupedNotifications = {
    all: notifications,
    orders: notifications.filter(n => n.type === 'ORDER'),
    users: notifications.filter(n => n.type === 'NEW_USER'),
    feedback: notifications.filter(n => n.type === 'FEEDBACK')
  };

  return (
    <div className="flex min-h-screen">
      <AdminSidebar />
      <main className={cn(
        "flex-1 bg-background transition-[margin] duration-300",
        isCollapsed ? "ml-16" : "ml-64"
      )}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-foreground">{getPageTitle()}</h1>
            <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
              <DropdownMenuTrigger className="relative">
                <Bell className="h-6 w-6 text-muted-foreground hover:text-foreground transition-colors" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                    {unreadCount}
                  </span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-[450px]">
                {notifications.length === 0 ? (
                  <div className="py-3 px-4 text-sm text-muted-foreground text-center">
                    No notifications
                  </div>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <div className="flex justify-between items-center px-2 py-1 border-b">
                      <TabsList className="w-full">
                        <TabsTrigger value="all" className="flex-1">
                          All ({notifications.length})
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex-1">
                          Orders ({groupedNotifications.orders.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex-1">
                          Users ({groupedNotifications.users.length})
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="flex-1">
                          Reviews ({groupedNotifications.feedback.length})
                        </TabsTrigger>
                      </TabsList>
                      <button
                        onClick={clearAll}
                        className="px-2 py-1 text-sm text-destructive hover:text-destructive/90"
                      >
                        Clear All
                      </button>
                    </div>
                    <TabsContent value="all" className="max-h-[60vh] overflow-y-auto">
                      {notifications.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onClick={() => markAsRead(notification._id)}
                          onNavigate={() => setIsDropdownOpen(false)}
                        />
                      ))}
                    </TabsContent>
                    <TabsContent value="orders" className="max-h-[60vh] overflow-y-auto">
                      {groupedNotifications.orders.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onClick={() => markAsRead(notification._id)}
                          onNavigate={() => setIsDropdownOpen(false)}
                        />
                      ))}
                    </TabsContent>
                    <TabsContent value="users" className="max-h-[60vh] overflow-y-auto">
                      {groupedNotifications.users.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onClick={() => markAsRead(notification._id)}
                          onNavigate={() => setIsDropdownOpen(false)}
                        />
                      ))}
                    </TabsContent>
                    <TabsContent value="feedback" className="max-h-[60vh] overflow-y-auto">
                      {groupedNotifications.feedback.map((notification) => (
                        <NotificationItem
                          key={notification._id}
                          notification={notification}
                          onClick={() => markAsRead(notification._id)}
                          onNavigate={() => setIsDropdownOpen(false)}
                        />
                      ))}
                    </TabsContent>
                    {hasMore && (
                      <div className="p-2 text-center border-t">
                        <button
                          onClick={loadMore}
                          className="text-sm text-primary hover:underline"
                        >
                          Load More
                        </button>
                      </div>
                    )}
                  </Tabs>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
