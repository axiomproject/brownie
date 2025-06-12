import type { Product } from "@/types/product";

export const products: Product[] = [
  {
    id: 1,
    name: "Classic Fudge Brownie",
    description: "Rich, dense and perfectly fudgy",
    category: "classic",
    image: "https://images.unsplash.com/photo-1606313564200-e75d5e30476c",
    isPopular: true,
    variants: [
      { id: 1, name: "Box of 4", price: 149.99, quantity: 4 },
      { id: 2, name: "Box of 6", price: 219.99, quantity: 6 },
      { id: 3, name: "Box of 8", price: 289.99, quantity: 8 }
    ]
  },
  {
    id: 2,
    name: "Nutty Delight",
    description: "Loaded with premium walnuts and pecans",
    category: "nuts",
    image: "https://images.unsplash.com/photo-1636743715220-d8f8dd900b87",
    variants: [
      { id: 1, name: "Box of 4", price: 169.99, quantity: 4 },
      { id: 2, name: "Box of 6", price: 239.99, quantity: 6 },
      { id: 3, name: "Box of 8", price: 309.99, quantity: 8 }
    ]
  },
  {
    id: 3,
    name: "Triple Chocolate",
    description: "Three types of premium chocolate",
    category: "chocolate",
    image: "https://images.unsplash.com/photo-1604761483402-1e07d167c09b",
    isPopular: true,
    variants: [
      { id: 1, name: "Box of 4", price: 199.99, quantity: 4 },
      { id: 2, name: "Box of 6", price: 269.99, quantity: 6 },
      { id: 3, name: "Box of 8", price: 339.99, quantity: 8 }
    ]
  },
  {
    id: 4,
    name: "Caramel Swirl",
    description: "Swirled with homemade caramel",
    category: "special",
    image: "https://images.unsplash.com/photo-1657875861147-d1456a1eb65d",
    variants: [
      { id: 1, name: "Box of 4", price: 179.99, quantity: 4 },
      { id: 2, name: "Box of 6", price: 249.99, quantity: 6 },
      { id: 3, name: "Box of 8", price: 319.99, quantity: 8 }
    ]
  },
  {
    id: 5,
    name: "Mint Chocolate",
    description: "Cool mint with dark chocolate",
    category: "special",
    image: "https://images.unsplash.com/photo-1728842593708-8d7da2572ac8",
    variants: [
      { id: 1, name: "Box of 4", price: 179.99, quantity: 4 },
      { id: 2, name: "Box of 6", price: 249.99, quantity: 6 },
      { id: 3, name: "Box of 8", price: 319.99, quantity: 8 }
    ]
  },
  {
    id: 6,
    name: "Peanut Butter Cup",
    description: "Filled with creamy peanut butter",
    category: "nuts",
    image: "https://images.unsplash.com/photo-1612078960206-1709f1f0c969",
    isPopular: true,
    variants: [
      { id: 1, name: "Box of 4", price: 189.99, quantity: 4 },
    ]
  }
];
