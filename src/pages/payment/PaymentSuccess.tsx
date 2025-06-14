import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom'; // Add useSearchParams
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { API_URL } from '@/config';

export default function PaymentSuccess() {
  const { items, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams(); // Add this
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [showGuestDialog, setShowGuestDialog] = useState(false);

  useEffect(() => {
    const createOrder = async () => {
      const token = localStorage.getItem('token');
      try {
        const paymentMethod = localStorage.getItem('paymentMethod') || 'gcash';
        const email = localStorage.getItem('guestEmail');
        // Get applied coupon from localStorage
        const appliedCoupon = localStorage.getItem('appliedCoupon') 
          ? JSON.parse(localStorage.getItem('appliedCoupon')!)
          : null;

        // Calculate final amount with coupon
        const finalAmount = appliedCoupon?.type === 'fixed'
          ? totalPrice - appliedCoupon.value
          : totalPrice;

        const endpoint = token 
          ? '${API_URL}/api/orders'
          : '${API_URL}/api/orders/guest';

        const headers = {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` })
        };

        const response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify({
            items: items.map(item => ({
              productId: item._id,
              name: item.name,
              price: item.variant.price,
              quantity: item.quantity,
              variantName: item.variant.name
            })),
            totalAmount: finalAmount,
            paymentStatus: 'paid',
            paymentMethod,
            email,
            // Include coupon information
            coupon: appliedCoupon ? {
              code: appliedCoupon.code,
              type: appliedCoupon.type,
              value: appliedCoupon.value
            } : null
          })
        });

        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.message || 'Failed to create order');
        }

        // Store order ID in URL params
        setOrderId(data._id);
        setSearchParams({ orderId: data._id });
        
        // Show dialog for guest users
        if (!token && email) {
          setShowGuestDialog(true);
        }
        
        localStorage.removeItem('paymentMethod');
        localStorage.removeItem('guestEmail');
        localStorage.removeItem('appliedCoupon'); // Remove coupon data
        clearCart();
      } catch (error) {
        console.error('Error creating order:', error);
        toast.error("Failed to create order record");
      } finally {
        setIsCreatingOrder(false);
      }
    };

    // Check URL params for existing order ID
    const urlOrderId = searchParams.get('orderId');
    if (urlOrderId) {
      setOrderId(urlOrderId);
      setIsCreatingOrder(false);
    } else if (items && items.length > 0) {
      createOrder();
    } else {
      setIsCreatingOrder(false);
    }
  }, [items, clearCart, totalPrice, setSearchParams, searchParams]);

  if (isCreatingOrder) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-md mx-auto text-center space-y-6 px-4">
            <Loader2 className="h-20 w-20 animate-spin mx-auto text-primary" />
            <h1 className="text-3xl font-bold text-foreground">Processing Order...</h1>
          </div>
        </div>
      </>
    );
  }

  const handleContinueShopping = () => {
    clearCart(); // Clear cart again just to be safe
    navigate('/menu');
    window.location.reload(); // Force refresh to ensure clean state
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 bg-background">
        <div className="max-w-md mx-auto text-center space-y-6 px-4">
          <CheckCircle className="h-20 w-20 text-green-500 mx-auto" />
          <h1 className="text-3xl font-bold text-foreground">Payment Successful!</h1>
          <p className="text-muted-foreground">
            Thank you for your order. {orderId && "We've sent you a confirmation email."}
          </p>
          <div className="space-y-4">
            {orderId && (
              <Button 
                variant="outline"
                className="w-full text-foreground" 
                onClick={() => navigate(`/track-order/${orderId}`)}
              >
                Track Order
              </Button>
            )}
            <Button 
              className="w-full" 
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={showGuestDialog} onOpenChange={setShowGuestDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Track Your Order</DialogTitle>
            <DialogDescription>
              Since you ordered as a guest, make sure to save your order tracking link:
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm bg-muted p-2 rounded break-all">
              http://${API_URL}/track-order/{orderId}
            </p>
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(`${API_URL}/track-order/${orderId}`);
                  toast.success('Tracking link copied to clipboard');
                }}
              >
                Copy Link
              </Button>
              <Button
                onClick={() => {
                  setShowGuestDialog(false);
                  navigate(`/track-order/${orderId}`);
                }}
              >
                Track Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
