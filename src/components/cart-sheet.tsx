import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ShoppingCart, Minus, Plus, Trash2, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkout } from "@/components/checkout";
import { toast } from "sonner"; 

interface CouponResponse {
  code: string;
  type: 'fixed' | 'product';
  value: number;
  isActive: boolean;
}

export function CartSheet() {
  const { items, totalItems, totalPrice, updateQuantity, removeItem, clearCart } = useCart();
  const { user } = useAuth();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<CouponResponse | null>(null);
  const [couponError, setCouponError] = useState('');

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

  const handleApplyCoupon = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          code: couponCode,
          userId: user?._id // Send user ID for new user validation
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid coupon');
      }

      const coupon = await response.json();

      // Double-check max usage here as well
      if (coupon.maxUses && coupon.usedCount >= coupon.maxUses) {
        throw new Error('This coupon has reached its usage limit');
      }

      setAppliedCoupon(coupon);
      setCouponError('');
      toast.success('Coupon applied successfully!');
    } catch (error) {
      setAppliedCoupon(null);
      setCouponCode('');
      setCouponError(error instanceof Error ? error.message : 'Failed to apply coupon');
      toast.error(error instanceof Error ? error.message : 'Failed to apply coupon');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateDiscount = () => {
    if (!appliedCoupon) return 0;
    return appliedCoupon.type === 'fixed' ? appliedCoupon.value : 0;
  };

  const finalTotal = totalPrice - calculateDiscount();

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
              {/* Add coupon input section */}
              <div className="space-y-2">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter coupon code"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="bg-background text-foreground placeholder:text-muted-foreground"
                  />
                  <Button 
                    onClick={handleApplyCoupon}
                    disabled={!couponCode || appliedCoupon !== null}
                  >
                    Apply
                  </Button>
                </div>
                {couponError && (
                  <p className="text-sm text-destructive">{couponError}</p>
                )}
                {appliedCoupon && (
                  <div className="flex items-center justify-between bg-muted p-2 rounded">
                    <span className="text-sm text-foreground">
                      {appliedCoupon.type === 'fixed' 
                        ? `₱${appliedCoupon.value} OFF`
                        : `${appliedCoupon.value}x Free Item`
                      }
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={removeCoupon}
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Price breakdown */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal:</span>
                  <span className="text-foreground">₱{totalPrice.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Discount:</span>
                    <span className="text-foreground">-₱{calculateDiscount().toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-foreground">Total:</span>
                  <span className="text-foreground">₱{finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <Checkout 
                appliedCoupon={appliedCoupon} 
                finalTotal={finalTotal}  // Pass the calculated final total
              />
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
