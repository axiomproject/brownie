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
        return 'Users';
      case '/admin/products':
        return 'Products';
      case '/admin/orders':
        return 'Orders';
        case '/admin/inventory':
        return 'Inventory';
        case '/admin/coupons':
        return 'Coupon';
        case '/admin/feedbacks':
        return 'Feedback';
        case '/admin/contacts':
        return 'Contact';
        case '/admin/content':
          return 'Content';
          case '/admin/settings':
            return 'Settings';
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
              <DropdownMenuContent 
                align="end" 
                className="w-[calc(100vw-2rem)] sm:w-[450px] max-w-[450px]"
              >
                {notifications.length === 0 ? (
                  <div className="py-3 px-4 text-sm text-muted-foreground text-center">
                    No notifications
                  </div>
                ) : (
                  <Tabs defaultValue="all" className="w-full">
                    <div className="flex justify-between items-center px-2 py-1 border-b overflow-x-auto">
                      <TabsList className="w-full flex-nowrap overflow-x-auto">
                        <TabsTrigger value="all" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4">
                          All ({notifications.length})
                        </TabsTrigger>
                        <TabsTrigger value="orders" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4">
                          Orders ({groupedNotifications.orders.length})
                        </TabsTrigger>
                        <TabsTrigger value="users" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4">
                          Users ({groupedNotifications.users.length})
                        </TabsTrigger>
                        <TabsTrigger value="feedback" className="flex-shrink-0 text-xs sm:text-sm px-2 sm:px-4">
                          Reviews ({groupedNotifications.feedback.length})
                        </TabsTrigger>
                      </TabsList>
                      <button
                        onClick={clearAll}
                        className="px-2 py-1 text-xs sm:text-sm text-destructive hover:text-destructive/90 whitespace-nowrap ml-2"
                      >
                        Clear All
                      </button>
                    </div>
                    
                    {/* Make the content area scrollable with a max height */}
                    <div className="max-h-[60vh] overflow-y-auto">
                      <TabsContent value="all">
                        {notifications.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onClick={() => markAsRead(notification._id)}
                            onNavigate={() => setIsDropdownOpen(false)}
                          />
                        ))}
                      </TabsContent>
                      <TabsContent value="orders">
                        {groupedNotifications.orders.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onClick={() => markAsRead(notification._id)}
                            onNavigate={() => setIsDropdownOpen(false)}
                          />
                        ))}
                      </TabsContent>
                      <TabsContent value="users">
                        {groupedNotifications.users.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onClick={() => markAsRead(notification._id)}
                            onNavigate={() => setIsDropdownOpen(false)}
                          />
                        ))}
                      </TabsContent>
                      <TabsContent value="feedback">
                        {groupedNotifications.feedback.map((notification) => (
                          <NotificationItem
                            key={notification._id}
                            notification={notification}
                            onClick={() => markAsRead(notification._id)}
                            onNavigate={() => setIsDropdownOpen(false)}
                          />
                        ))}
                      </TabsContent>
                    </div>

                    {hasMore && (
                      <div className="p-2 text-center border-t">
                        <button
                          onClick={loadMore}
                          className="text-xs sm:text-sm text-primary hover:underline"
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
