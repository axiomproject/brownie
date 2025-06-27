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
} from "@/components/ui/carousel"
import Autoplay from "embla-carousel-autoplay"
import { LoadingDialog } from "@/components/LoadingDialog";

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

  const [showLoadingDialog, setShowLoadingDialog] = useState(true);
  const [hasSeenDialog, setHasSeenDialog] = useState(() => {
    return localStorage.getItem('hasSeenLoadingDialog') === 'true'
  });

  useEffect(() => {
    if (!hasSeenDialog) {
      setShowLoadingDialog(true);
      localStorage.setItem('hasSeenLoadingDialog', 'true');
    }
  }, [hasSeenDialog]);

  const handleApiResponse = () => {
    setShowLoadingDialog(false);
  };

  const heroImages = [
    '/1.jpg',  
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
        
        handleApiResponse();

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
    <div className="flex flex-col min-h-screen bg-background"> {/* Added bg-background */}
      <LoadingDialog 
        open={showLoadingDialog} 
        onOpenChange={setShowLoadingDialog}
      />
      <div className="fixed top-0 left-0 right=0"> {/* Add fixed navbar wrapper with highest z-index */}
        <div className="relative z-50 bg-background">
          <Navbar />
        </div>
      </div>
      <main className="flex-1 mt-16"> {/* Add margin-top to account for fixed navbar */}
        {/* Hero Section */}
        <section className="relative h-[calc(100vh-4rem)] bg-background"> {/* Added bg-background */}
          <div className="relative w-full h-full z-0"> {/* Changed to relative and full height with lower z-index */}
            <Carousel
              opts={{
                loop: true,
                skipSnaps: false,
                align: 'start',
              }}
              plugins={[plugin.current]}
              className="w-full h-full"
            >
              <CarouselContent className="-ml-0">
                {heroImages.map((image, id) => (
                  <CarouselItem key={id} className="pl-0">
                    <div className="relative w-full h-[calc(100vh-4rem)]"> {/* Updated height calculation */}
                      <img
                        src={image}
                        alt={`Hero slide ${id + 1}`}
                        className="absolute inset-0 w-full h-full object-cover"
                        onError={() => {
                          console.error(`Failed to load image: ${image}`);
                        }}
                      />
                      <div className="absolute inset-0 bg-black/50" />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>

          {/* Fixed content overlay - Stays in place during slides */}
          <div className="absolute inset-0 z-[1] flex flex-col items-center justify-center text-center p-4"> {/* Content overlay with medium z-index */}
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold mb-4 text-white"
            >
              {pageContent.heroTitle || 'Heavenly Brownies'}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl mb-8 text-white/90 max-w-2xl"
            >
              {pageContent.heroSubtitle || 'Indulge in our handcrafted, gourmet brownies'}
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            >
              <Button 
                size="lg" 
                onClick={() => navigate('/menu')}
                className="bg-white text-foreground hover:bg-white/90 dark:bg-white dark:text-background dark:hover:bg-white/90"
              >
                Order Now
              </Button>
            </motion.div>
          </div>
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
                className="text-lg text-foreground"
              >
                {pageContent.aboutContent}
              </motion.p>
            </div>
          </motion.div>
        </section>
      </main>
    </div>
  );
}
