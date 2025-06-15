import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { Navbar } from "@/components/Navbar";
import { Link, useNavigate } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import type { Product } from "@/types/product";
import { API_URL } from '@/config';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"

export default function Home() {
  const navigate = useNavigate();
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setError] = useState<string | null>(null);
  const [pageContent, setPageContent] = useState({
    heroTitle: '',
    heroSubtitle: '',
    heroImage: '',
    aboutTitle: '',
    aboutContent: ''
  });
  const plugin = useRef(
    Autoplay({ delay: 4000, stopOnInteraction: true })
  );

  const heroImages = [
    '/1.jpg',  // Changed paths to root directory
    '/2.jpg',
    '/3.jpg'
  ];

  useEffect(() => {
    const fetchPopularProducts = async () => {
      try {
        const response = await fetch(`${API_URL}/api/products`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch products');
        const data = await response.json();
        // Filter for popular products and take first 3
        const popular = data.filter((p: Product) => p.isPopular).slice(0, 3);
        setPopularProducts(popular);
      } catch (error) {
        console.error('Error fetching popular products:', error);
        setError('Failed to load products');
      } finally {
        setLoading(false);
      }
    };

    fetchPopularProducts();
  }, []);

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(`${API_URL}/api/content/home-content`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });
        if (!response.ok) throw new Error('Failed to fetch content');
        const data = await response.json();
        console.log('Home content received:', data);
        
        if (!data) throw new Error('No data received');
        
        setPageContent({
          heroTitle: data.heroTitle,
          heroSubtitle: data.heroSubtitle,
          heroImage: data.heroImage,
          aboutTitle: data.aboutTitle,
          aboutContent: data.aboutContent
        });
      } catch (error) {
        console.error('Error:', error);
        setError('Failed to load content');
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative h-[80vh] bg-muted">
          <Carousel
            opts={{
              loop: true,
            }}
            plugins={[plugin.current]}
            className="w-full h-full relative" // Added relative
          >
            <CarouselContent className="h-full">
              {heroImages.map((image, id) => (
                <CarouselItem key={id} className="h-full">
                  <div className="relative h-full"> {/* Added wrapper div */}
                    <img
                      src={image}
                      alt={`Hero slide ${id + 1}`}
                      className="absolute inset-0 w-full h-full object-cover"
                      onError={(e) => {
                        console.error(`Failed to load image: ${image}`);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/50" /> {/* Simplified overlay */}
                    <div className="relative h-full flex flex-col items-center justify-center text-center p-4"> {/* Changed to relative */}
                      <motion.h1 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-4xl md:text-6xl font-bold mb-4 text-white z-10"
                      >
                        {pageContent.heroTitle || 'Welcome to Our Shop'}
                      </motion.h1>
                      <motion.p 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="text-lg md:text-xl mb-8 text-white z-10 max-w-2xl"
                      >
                        {pageContent.heroSubtitle || 'Discover our delicious treats'}
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.4 }}
                        className="z-10"
                      >
                        <Button 
                          size="lg" 
                          onClick={() => navigate('/menu')}
                          className="bg-white text-foreground hover:bg-white/90"
                        >
                          Order Now
                        </Button>
                      </motion.div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="left-4 z-20" />
            <CarouselNext className="right-4 z-20" />
          </Carousel>
        </section>

        {/* Featured Products */}
        <section className="py-16 bg-background">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-4xl font-bold text-center mb-12 text-foreground"
            >
              Popular Picks
            </motion.h2>
            {loading ? (
              <div className="text-center text-muted-foreground">Loading popular items...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {popularProducts.map((product, index) => (
                  <motion.div
                    key={product._id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                  >
                    <Link to={`/menu/${product._id}`}>
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
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </section>

        {/* About Section */}
        <section className="py-16 bg-muted/50">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"
          >
            <div className="max-w-2xl mx-auto text-center">
              <motion.h2 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="text-4xl font-bold mb-6 text-foreground"
              >
                {pageContent.aboutTitle}
              </motion.h2>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lg text-muted-foreground"
              >
                {pageContent.aboutContent}
              </motion.p>
            </div>
          </motion.div>
        </section>
      </div>
    </>
  );
}
