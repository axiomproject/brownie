const PAYMONGO_API_URL = 'https://api.paymongo.com/v1';
const PAYMONGO_PUBLIC_KEY = import.meta.env.VITE_PAYMONGO_PUBLIC_KEY;

export const paymentService = {
  createPaymentSource: async (amount: number, paymentMethod: string) => {
    try {
      const response = await fetch(`${PAYMONGO_API_URL}/sources`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${btoa(PAYMONGO_PUBLIC_KEY + ':')}`
        },
        body: JSON.stringify({
          data: {
            attributes: {
              amount: Math.round(amount * 100), // Convert to cents and ensure whole number
              currency: 'PHP',
              type: paymentMethod,
              redirect: {
                success: `${window.location.origin}/payment/success`,
                failed: `${window.location.origin}/payment/failed`
              }
            }
          }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.errors?.[0]?.detail || 'Failed to create payment source');
      }

      const data = await response.json();
      return data.data;
    } catch (error) {
      console.error('Payment error:', error);
      throw error;
    }
  }
};
