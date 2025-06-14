import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { CartContextType, CartItem } from '@/types/cart';
import type { Product, ProductVariant } from '@/types/product';
import { toast } from 'sonner';

const CartContext = createContext<CartContextType | undefined>(undefined);

interface CartProviderProps {
  children: React.ReactNode;
  userId?: string | null;
}

export function CartProvider({ children, userId }: CartProviderProps) {
  const [items, setItems] = useState<CartItem[]>([]);

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(`cart_${userId || 'guest'}`);
    if (savedCart) {
      setItems(JSON.parse(savedCart));
    }
  }, [userId]);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    if (items.length > 0) {
      localStorage.setItem(`cart_${userId || 'guest'}`, JSON.stringify(items));
    } else {
      localStorage.removeItem(`cart_${userId || 'guest'}`);
    }
  }, [items, userId]);

  const addItem = (product: Product, variant: ProductVariant) => {
    
    if (!variant.inStock || variant.stockQuantity === 0) {
      toast.error('This item is out of stock');
      return;
    }

    setItems(currentItems => {
      const existingItem = currentItems.find(item => 
        item._id === product._id && item.variant.name === variant.name
      );
      
      if (existingItem) {
        if (existingItem.quantity >= variant.stockQuantity) {
          toast.error('Cannot add more - insufficient stock');
          return currentItems;
        }
        
        return currentItems.map(item =>
          item._id === product._id && item.variant.name === variant.name
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }

      return [...currentItems, {
        _id: product._id,
        name: product.name,
        image: product.image,
        variant,
        quantity: 1
      }];
    });
  };

  const removeItem = (itemId: string) => {
    const [productId, variantName] = itemId.split('-');
    setItems(currentItems => currentItems.filter(item => 
      !(item._id === productId && item.variant.name === variantName)
    ));
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    
    const [productId, variantName] = itemId.split('-');
    
    setItems(currentItems => {
      const item = currentItems.find(item => 
        item._id === productId && item.variant.name === variantName
      );
      
      if (item && quantity > item.variant.stockQuantity) {
        toast.error('Cannot add more - insufficient stock');
        return currentItems;
      }
      
      return currentItems.map(item =>
        item._id === productId && item.variant.name === variantName
          ? { ...item, quantity }
          : item
      );
    });
  };

  const clearCart = useCallback(() => {
    setItems([]);
    localStorage.removeItem(`cart_${userId || 'guest'}`);
  }, [userId]);

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => {
    // Safely access price with optional chaining and fallback
    const price = item?.variant?.price ?? 0;
    return sum + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      items,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      totalItems,
      totalPrice
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
