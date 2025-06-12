import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { products } from "@/data/products";
import { useState, useEffect } from "react";

export default function Home() {
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        // Filter for popular products and take first 3
        const popular = data.filter((p: Product) => p.isPopular).slice(0, 3);
        setPopularProducts(popular);
      } catch (error) {
        console.error('Error fetching popular products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (product.variants && product.variants.length === 1) {
      addItem(product, product.variants[0]);
      toast.success('Added to cart!');
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[80vh] bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center h-full text-center">
            <h1 className="text-6xl font-bold mb-4 text-foreground">Heavenly Brownies</h1>
            <p className="text-xl mb-8 text-muted-foreground">Indulge in our handcrafted, gourmet brownies</p>
            <Button size="lg" onClick={() => navigate('/menu')}>
              Order Now
            </Button>
          </div>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-12 text-foreground">Popular Picks</h2>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading popular items...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {popularProducts.map((product) => (
                  <Link to={`/menu/${product._id}`} key={product._id}>
                    <Card>
                      <CardContent className="p-6">
                        <div className="aspect-square bg-muted mb-4 rounded-lg overflow-hidden">
                          <img 
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <h3 className="text-xl font-semibold text-card-foreground">{product.name}</h3>
                        <p className="text-muted-foreground">
                          From ₱{Math.min(...(product.variants?.map(v => v.price) ?? [0]))}
                        </p>
                        {product.variants && product.variants.length === 1 && (
                          <Button 
                            className="w-full mt-4"
                            onClick={(e) => handleAddToCart(e, product)}
                            disabled={!product.variants[0].inStock || product.variants[0].stockQuantity === 0}
                          >
                            {!product.variants[0].inStock || product.variants[0].stockQuantity === 0 
                              ? 'Out of Stock' 
                              : 'Add to Cart'}
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-muted/50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mx-auto text-center">
              <h2 className="text-4xl font-bold mb-6 text-foreground">Our Story</h2>
              <p className="text-lg text-muted-foreground">
                Crafting perfect brownies since 2010, we believe in using only the finest ingredients
                to create moments of pure chocolate bliss. Each brownie is baked with love and
                attention to detail.
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
