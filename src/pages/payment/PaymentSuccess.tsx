import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, Loader2 } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { toast } from 'sonner';

export default function PaymentSuccess() {
  const { items, clearCart, totalPrice } = useCart();
  const navigate = useNavigate();
  const [isCreatingOrder, setIsCreatingOrder] = useState(true);

  useEffect(() => {
    const createOrder = async () => {
      const token = localStorage.getItem('token');
      try {
        const paymentMethod = localStorage.getItem('paymentMethod') || 'gcash';
        
        const endpoint = token 
          ? 'http://localhost:5000/api/orders'
          : 'http://localhost:5000/api/orders/guest';

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
            totalAmount: totalPrice,
            paymentStatus: 'paid',
            paymentMethod
          })
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.message || 'Failed to create order');
        }
        
        localStorage.removeItem('paymentMethod'); // Clean up
        clearCart();
      } catch (error) {
        console.error('Error creating order:', error);
        toast.error("Failed to create order record");
      } finally {
        setIsCreatingOrder(false);
      }
    };

    if (items && items.length > 0) {
      createOrder();
    } else {
      setIsCreatingOrder(false);
    }
  }, [items, clearCart, totalPrice]);

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
            Thank you for your order. You will receive a confirmation email shortly.
          </p>
          <div className="space-y-4">
            <Button 
              className="w-full" 
              size="lg"
              onClick={handleContinueShopping}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
