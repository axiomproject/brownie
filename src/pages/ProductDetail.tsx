import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { Product } from "@/types/product";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();
  
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/products/${id}`);
        if (!response.ok) throw new Error('Failed to fetch product');
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        toast.error("Failed to load product");
        navigate('/menu');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  // Initialize selectedVariant with the only variant's name if there's just one variant
  const [selectedVariant, setSelectedVariant] = useState<string>(() => {
    if (product?.variants?.length === 1) {
      return product.variants[0].name;
    }
    return "";
  });

  // Preload image
  useEffect(() => {
    if (product) {
      const img = new Image();
      img.src = product.image;
      img.onload = () => setImageLoading(false);
    }
  }, [product]);

  if (loading || !product) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/menu')}
              className="mb-8"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Menu
            </Button>
            <div className="text-center text-foreground">
              Loading product...
            </div>
          </div>
        </div>
      </>
    );
  }

  const selectedVariantDetails = product.variants?.find(
    v => v.name === selectedVariant
  );

  const handleAddToCart = () => {
    if (!selectedVariant || !selectedVariantDetails || !product) return;
    
    if (!selectedVariantDetails.inStock || selectedVariantDetails.stockQuantity === 0) {
      toast.error('This item is currently out of stock');
      return;
    }

    // Check current cart quantity
    const cartItem = items.find(item => 
      item._id === product._id && item.variant.name === selectedVariantDetails.name
    );
    
    if (cartItem && cartItem.quantity >= selectedVariantDetails.stockQuantity) {
      toast.error('Cannot add more - insufficient stock');
      return;
    }

    addItem(product, selectedVariantDetails);
    toast.success('Added to cart!');
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 bg-background">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/menu')}
            className="mb-8"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Menu
          </Button>

          <div className="grid md:grid-cols-2 gap-12">
            {/* Product Image */}
            <div className="aspect-square bg-muted rounded-lg overflow-hidden relative">
              {imageLoading && (
                <Skeleton className="w-full h-full absolute inset-0" />
              )}
              <img 
                src={product.image}
                alt={product.name}
                className={`w-full h-full object-cover transition-opacity duration-300 ${
                  imageLoading ? 'opacity-0' : 'opacity-100'
                }`}
                loading="eager"
                onLoad={() => setImageLoading(false)}
              />
              {product.isPopular && !imageLoading && (
                <div className="absolute top-4 right-4">
                  <span className="bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm">
                    Popular
                  </span>
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="space-y-6">
              <div>
                <h1 className="text-4xl font-bold text-foreground">{product.name}</h1>
                <p className="text-muted-foreground mt-2">{product.category}</p>
              </div>
              
              <p className="text-lg text-muted-foreground">{product.description}</p>
              
              {product.variants && (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <h3 className="text-lg font-semibold text-foreground">
                      {product.variants.length > 1 ? "Select Package" : "Package Size"}
                    </h3>
                    {selectedVariantDetails && (
                      <span className="text-2xl font-bold text-foreground">
                        ₱{selectedVariantDetails.price}
                      </span>
                    )}
                  </div>

                  {product.variants.length > 1 ? (
                    <Select onValueChange={setSelectedVariant} value={selectedVariant}>
                      <SelectTrigger className="w-full text-foreground">
                        <SelectValue placeholder="Choose package size" />
                      </SelectTrigger>
                      <SelectContent>
                        {product.variants.map((variant) => (
                          <SelectItem 
                            key={variant.name} 
                            value={variant.name}
                            className="text-foreground"
                            disabled={!variant.inStock || variant.stockQuantity === 0}
                          >
                            {variant.name} ({variant.stockQuantity} pieces)
                            {(!variant.inStock || variant.stockQuantity === 0) && ' - Out of Stock'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-2 border rounded-md bg-muted/10">
                      <p className="text-foreground">
                        {product.variants[0].name} ({product.variants[0].stockQuantity} pieces)
                      </p>
                    </div>
                  )}
                  
                  <Button 
                    className="w-full"
                    size="lg" 
                    disabled={
                      product.variants.length > 1 && !selectedVariant ||
                      (selectedVariantDetails && (!selectedVariantDetails.inStock || selectedVariantDetails.stockQuantity === 0))
                    }
                    onClick={handleAddToCart}
                  >
                    {product.variants.length > 1 && !selectedVariant ? 'Select a Package' : 
                    selectedVariantDetails && (!selectedVariantDetails.inStock || selectedVariantDetails.stockQuantity === 0) ? 
                    'Out of Stock' : 'Add to Cart'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
