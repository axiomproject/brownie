export interface ProductVariant {
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
}

export interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  variants: ProductVariant[];
  isPopular: boolean;
  createdAt: string;
}
