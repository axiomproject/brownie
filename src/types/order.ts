export interface OrderItem {
  _id: string;
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  variantName: string; // Add this
  variant: {
    name: string;
    price: number;
  };
  // ...other fields...
}

export interface Order {
  _id: string;
  user?: string;
  email?: string;
  items: OrderItem[];
  // ...existing code...
}

// ...existing code...
