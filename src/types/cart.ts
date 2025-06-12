import type { Product, ProductVariant } from './product';

export interface CartItem {
  _id: string;
  name: string;
  image: string;
  variant: ProductVariant;
  quantity: number;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, variant: ProductVariant) => void;
  removeItem: (itemId: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}
