import { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Minus, Plus, Trash2 } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkout } from "@/components/checkout";

export function CartSheet() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();

  // Modified to only clear when switching between different authenticated users
  useEffect(() => {
    const prevUserId = localStorage.getItem('prevUserId');
    const currentUserId = user?._id;

    if (prevUserId && currentUserId && prevUserId !== currentUserId) {
      // Clear previous user's cart
      localStorage.removeItem(`cart_${prevUserId}`);
      clearCart();
    }
    
    if (currentUserId) {
      localStorage.setItem('prevUserId', currentUserId);
    }
  }, [user?._id, clearCart]);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="text-foreground relative">
          <ShoppingCart className="h-5 w-5" />
          {totalItems > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground w-4 h-4 text-xs rounded-full flex items-center justify-center">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-lg pr-8 bg-background border-l text-foreground">
        <SheetHeader className="px-6">
          <SheetTitle className="text-foreground">Shopping Cart ({totalItems})</SheetTitle>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-8rem)] mt-4 px-6">
          <div className="space-y-6">
            {items?.map((item) => {
              if (!item?.variant) return null; // Skip if variant is undefined
              
              const itemId = `${item._id}-${item.variant.name}`;
              return (
                <div key={itemId} className="flex gap-4 py-4 border-b border-border">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-20 h-20 object-cover rounded-lg"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{item.name}</h3>
                    <p className="text-sm text-muted-foreground">{item.variant.name}</p>
                    <p className="text-sm font-semibold mt-1 text-foreground">
                      ₱{(item.variant.price || 0).toFixed(2)}
                    </p>
                    <div className="flex items-center gap-2 mt-3">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-background hover:bg-accent text-foreground"
                        onClick={() => updateQuantity(itemId, item.quantity - 1)}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center text-foreground">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 bg-background hover:bg-accent text-foreground"
                        onClick={() => updateQuantity(itemId, item.quantity + 1)}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 ml-auto text-destructive"
                        onClick={() => removeItem(itemId)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>

        <div className="border-t border-border mt-auto p-6">
          {items.length > 0 ? (
            <div className="space-y-4">
              <div className="flex justify-between text-lg font-semibold text-foreground">
                <span>Total:</span>
                <span>₱{totalPrice.toFixed(2)}</span>
              </div>
              <Checkout />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Your cart is empty</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
