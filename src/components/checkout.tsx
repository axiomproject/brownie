import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from '@/context/CartContext';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';
import type { PaymentMethodType } from '@/types/payment';

interface CheckoutProps {
  appliedCoupon?: {
    code: string;
    type: 'fixed' | 'product';
    value: number;
  } | null;
  finalTotal: number; // Add this prop
}

export function Checkout({ appliedCoupon, finalTotal }: CheckoutProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('gcash');
  const [processing, setProcessing] = useState(false);
  const { items } = useCart();

  const handleCheckout = async (paymentData: { totalPrice: number; paymentMethod: PaymentMethodType }) => {
    try {
      setProcessing(true);
      localStorage.setItem('paymentMethod', paymentData.paymentMethod);
      
      const source = await paymentService.createPaymentSource(
        paymentData.totalPrice, // Use the total price directly
        paymentData.paymentMethod
      );
      
      // Save coupon information for order creation
      if (appliedCoupon) {
        localStorage.setItem('appliedCoupon', JSON.stringify(appliedCoupon));
      }

      if (source.attributes.redirect.checkout_url) {
        window.location.href = source.attributes.redirect.checkout_url;
      } else {
        throw new Error('No checkout URL provided');
      }
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
    } finally {
      setProcessing(false);
    }
  };

  const handlePayment = async () => {
    try {
      await handleCheckout({
        totalPrice: finalTotal, // Use the final total directly
        paymentMethod
      });
    } catch (error) {
      console.error('Payment error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to process payment");
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold text-foreground">Payment Method</h2>
      
      <RadioGroup onValueChange={(value: PaymentMethodType) => setPaymentMethod(value)} value={paymentMethod}>
        {/* Remove card payment option since it's not supported */}
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="gcash" id="gcash" />
          <Label htmlFor="gcash" className="text-foreground">GCash</Label>
        </div>
        <div className="flex items-center space-x-2">
          <RadioGroupItem value="grab_pay" id="grab_pay" />
          <Label htmlFor="grab_pay" className="text-foreground">GrabPay</Label>
        </div>
      </RadioGroup>

      <div className="pt-4 border-t">
        <Button 
          className="w-full" 
          size="lg" 
          onClick={handlePayment}
          disabled={processing || items.length === 0}
        >
          {processing ? 'Processing...' : `Pay ₱${finalTotal.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}