import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react"; // Add useEffect
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { Product } from "@/types/product";
import { motion } from "framer-motion";

export default function Menu() {
  const [category, setCategory] = useState("all");
  const [products, setProducts] = useState<Product[]>([]); // Add products state
  const [loading, setLoading] = useState(true); // Add loading state
  const { addItem, items } = useCart(); // Add items
  const [pageContent, setPageContent] = useState({
    menuPageHero: {
      title: 'Our Menu',
      subtitle: 'Discover our selection of handcrafted brownies'
    }
  });

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/products');
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        toast.error("Failed to load products");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/content/home-content');
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        if (data && data.menuPageHero) {
          setPageContent({
            menuPageHero: data.menuPageHero
          });
        }
      } catch (error) {
        console.error('Error fetching page content:', error);
      }
    };
    fetchContent();
  }, []);

  const filteredProducts = category === "all" 
    ? products 
    : products.filter(product => product.category === category);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    if (product.variants && product.variants.length === 1) {
      const variant = product.variants[0];
      if (!variant.inStock || variant.stockQuantity === 0) {
        toast.error('This item is currently out of stock');
        return;
      }
      
      // Check current cart quantity
      const cartItem = items.find(item => 
        item._id === product._id && item.variant.name === variant.name
      );
      
      if (cartItem && cartItem.quantity >= variant.stockQuantity) {
        toast.error('Cannot add more - insufficient stock');
        return;
      }
      
      addItem(product, variant);
      toast.success('Added to cart!');
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-16 bg-background">
          <section className="py-20 bg-muted">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-3xl mx-auto text-center">
                <h1 className="text-5xl font-bold mb-6 text-foreground">Our Menu</h1>
                <p className="text-lg text-muted-foreground">Loading products...</p>
              </div>
            </div>
          </section>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-16 bg-background">
        {/* Hero Section */}
        <section className="py-20 bg-muted">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div 
              initial={{ y: 20 }}
              animate={{ y: 0 }}
              transition={{ duration: 0.4 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-5xl font-bold mb-6 text-foreground">
                {pageContent.menuPageHero.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                {pageContent.menuPageHero.subtitle}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Menu Section */}
        <section className="py-16 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Filter */}
            <div className="flex justify-end mb-8">
              <Select onValueChange={setCategory} defaultValue="all">
                <SelectTrigger className="w-[180px] text-foreground">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-foreground">All Brownies</SelectItem>
                  <SelectItem value="classic" className="text-foreground">Classic</SelectItem>
                  <SelectItem value="nuts" className="text-foreground">Nuts</SelectItem>
                  <SelectItem value="chocolate" className="text-foreground">Chocolate</SelectItem>
                  <SelectItem value="special" className="text-foreground">Special</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                >
                  <Link to={`/menu/${product._id}`}>
                    <Card className="overflow-hidden bg-card hover:bg-accent transition-colors">
                      <CardContent className="p-0">
                        <div className="aspect-[4/3] bg-muted relative">
                          <img 
                            src={`${product.image}?auto=format&fit=crop&w=800`}
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                          {product.isPopular && (
                            <span className="absolute top-2 right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                              Popular
                            </span>
                          )}
                        </div>
                        <div className="p-6">
                          <h3 className="text-xl font-semibold mb-2 text-foreground">{product.name}</h3>
                          <p className="text-muted-foreground mb-4">{product.description}</p>
                          <p className="text-lg font-semibold text-foreground">
                            From ₱{Math.min(...(product.variants?.map(v => v.price) ?? [0]))}
                          </p>
                        </div>
                      </CardContent>
                      <CardFooter className="p-6 pt-0">
                        {product.variants && product.variants.length === 1 ? (
                          <Button 
                            className="w-full"
                            onClick={(e) => handleAddToCart(e, product)}
                          >
                            Add to Cart
                          </Button>
                        ) : (
                          <Button className="w-full">
                            Choose Options
                          </Button>
                        )}
                      </CardFooter>
                    </Card>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
