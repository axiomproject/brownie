export interface PaymentIntent {
  id: string;
  amount: number;
  status: 'pending' | 'succeeded' | 'failed';
  client_key?: string;
  payment_method_allowed: string[];
}

export interface PaymentMethod {
  id: string;
  type: 'gcash' | 'grab_pay';
  details: any;
}

export type PaymentMethodType = 'gcash' | 'grab_pay';  
