import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { useCart } from '@/context/CartContext';
import { paymentService } from '@/services/paymentService';
import { toast } from 'sonner';
import type { PaymentMethodType } from '@/types/payment';

export function Checkout() {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodType>('gcash');
  const [processing, setProcessing] = useState(false);
  const { items, totalPrice,  } = useCart();

  const handleCheckout = async () => {
    try {
      setProcessing(true);
      
      // Store payment method for order creation
      localStorage.setItem('paymentMethod', paymentMethod);
      
      // Create a payment source
      const source = await paymentService.createPaymentSource(
        totalPrice,
        paymentMethod
      );
      
      // Redirect to payment provider's checkout page
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
          onClick={handleCheckout}
          disabled={processing || items.length === 0}
        >
          {processing ? 'Processing...' : `Pay ₱${totalPrice.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}