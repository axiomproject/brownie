import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  Package, 
  ShoppingCart,
  LogOut,
  ChevronLeft,
  Boxes,  // Change from Box to Boxes
  Ticket, 
  MessageSquare,
  MessageCircle, // Add this import
  Settings as SettingsIcon,
  ExternalLink, // Change from Home to ExternalLink
  Home, // Add this import
} from "lucide-react";
import { useAuth } from '@/context/AuthContext';
import { ModeToggle } from "@/components/mode-toggle";
import { useSidebar } from '@/context/SidebarContext';

export function AdminSidebar() {
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const location = useLocation();
  const { logout, user } = useAuth();  // Add user from useAuth
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/admin', external: false },
    { icon: Users, label: 'Users', path: '/admin/users', external: false },
    { icon: Package, label: 'Products', path: '/admin/products', external: false },
    { icon: ShoppingCart, label: 'Orders', path: '/admin/orders', external: false },
    { icon: Boxes, label: 'Inventory', path: '/admin/inventory', external: false },  
    { icon: Ticket, label: 'Coupons', path: '/admin/coupons', external: false }, 
    { icon: MessageSquare, label: 'Feedbacks', path: '/admin/feedbacks', external: false }, 
    { icon: MessageCircle, label: 'Contacts', path: '/admin/contacts', external: false },
    { icon: Home, label: 'Content', path: '/admin/content', external: false },
    { icon: SettingsIcon, label: 'Settings', path: '/admin/settings', external: false },
 
  ];

  return (
    <div className={cn(
      "min-h-screen bg-muted border-r flex flex-col fixed transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className={cn(
        "p-6 flex items-center",
        isCollapsed ? "justify-center" : "justify-between"
      )}>
        {!isCollapsed && (
          <h1 className="text-2xl font-bold text-foreground truncate">
            {user?.name || 'Admin'}
          </h1>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={cn(
            "h-8 w-8 p-0 text-foreground",
            isCollapsed && "rotate-180"
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      </div>
      <nav className="flex-1 px-2">
        {menuItems.map((item) => (
          <Link 
            key={item.path} 
            to={item.path} 
            className="block mb-2"
            target={item.external ? "_blank" : undefined} // Add this line
            rel={item.external ? "noopener noreferrer" : undefined} // Add this line
          >
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-foreground text-lg h-12",
                !isCollapsed && "space-x-3",
                (location.pathname === item.path || 
                 (item.path === '/admin' && location.pathname === '/admin/')) && 
                !item.external && // Add this condition
                "bg-accent/90 hover:bg-accent"
              )}
            >
              <item.icon className="h-6 w-6" />
              {!isCollapsed && <span>{item.label}</span>}
            </Button>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        {isCollapsed ? (
          <div className="flex flex-col gap-2">
            <Button 
              variant="ghost" 
              className="w-full justify-center text-foreground hover:text-foreground/80"
              onClick={() => window.open('/', '_blank')}
            >
              <ExternalLink className="h-5 w-5" />
            </Button>
            <ModeToggle />
            <Button 
              variant="ghost" 
              className="w-full justify-start text-red-500 hover:text-red-600"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start space-x-2 text-foreground hover:text-foreground/80"
              onClick={() => window.open('/', '_blank')}
            >
              <ExternalLink className="h-5 w-5" />
              <span>View Shop</span>
            </Button>
            <div className="flex items-center justify-between">
              <Button 
                variant="ghost" 
                className="flex-1 justify-start space-x-2 text-red-500 hover:text-red-600 mr-2"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span>Logout</span>
              </Button>
              <ModeToggle />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
