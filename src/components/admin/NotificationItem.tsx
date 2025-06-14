import { useState } from 'react';
import { cn, formatCurrency } from "@/lib/utils";
import { ChevronDown, ChevronUp, UserPlus, AlertCircle, ShoppingCart, MessageSquare, Package } from 'lucide-react';
import type { Notification } from '@/types/notification';
import { useNavigate } from 'react-router-dom';

interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onNavigate?: () => void; // Add this prop to close dropdown when navigating
}

const getNotificationContent = (notification: Notification) => {
  switch (notification.type) {
    case 'ORDER':
      const amount = formatCurrency(notification.data?.totalAmount || 0);
      return {
        message: notification.message,
        details: `Order Total: ${amount}`,
        icon: <ShoppingCart className="h-5 w-5 text-green-500" />
      };
    case 'NEW_USER':
      return {
        message: notification.message,
        details: notification.data?.source === 'google' ? 'Via Google Sign-in' : 'Via Registration',
        icon: <UserPlus className="h-5 w-5 text-blue-500" />
      };
    case 'FEEDBACK':
      const avgRating = notification.data?.ratings?.reduce((a: number, b: number) => a + b, 0) / 
                       notification.data?.ratings?.length || 0;
      return {
        message: notification.message,
        details: `${notification.data?.itemCount} items reviewed • Average rating: ${avgRating.toFixed(1)}⭐`,
        icon: <MessageSquare className="h-5 w-5 text-purple-500" />
      };
    case 'INVENTORY':
      return {
        message: notification.message,
        details: `Current stock: ${notification.data?.stockQuantity} units`,
        icon: <Package className="h-5 w-5 text-red-500" />
      };
    default:
      return {
        message: notification.message,
        details: '',
        icon: <AlertCircle className="h-5 w-5 text-orange-500" />
      };
  }
};

export function NotificationItem({ notification, onClick, onNavigate }: NotificationItemProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLongMessage = notification.message.length > 100;
  const content = getNotificationContent(notification);
  const navigate = useNavigate();

  const handleClick = () => {
    onClick();

    // Handle navigation based on notification type
    switch (notification.type) {
      case 'NEW_USER':
        navigate('/admin/users');
        onNavigate?.(); // Close dropdown
        break;
      case 'ORDER':
        navigate('/admin/orders');
        onNavigate?.();
        break;
      case 'FEEDBACK':
        navigate('/admin/products');
        onNavigate?.();
        break;
      case 'INVENTORY':
        navigate('/admin/inventory');
        onNavigate?.();
        break;
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        "flex items-start gap-3 p-3 hover:bg-accent/50 transition-colors cursor-pointer",
        notification.read ? "bg-background" : "bg-accent/20"
      )}
    >
      {content.icon}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div 
            className={cn(
              "flex-1",
              !isExpanded && "line-clamp-2"
            )}
          >
            <div>{content.message}</div>
            {content.details && (
              <div className="text-sm text-muted-foreground mt-1">
                {content.details}
              </div>
            )}
          </div>
          {isLongMessage && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex-shrink-0 p-1 hover:bg-muted rounded mt-1"
            >
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
          )}
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-muted-foreground">
            {new Date(notification.createdAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </span>
          <button
            onClick={onClick}
            className="text-sm text-primary hover:underline"
          >
            Mark as read
          </button>
        </div>
      </div>
    </div>
  );
}
