import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Star } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import type { Product } from "@/types/product";

interface FeedbackItem {
  rating: number;
  comment: string;
  productName: string;
  variantName: string;
  customerName: string;  // Add this field
}

interface ProductFeedbackDocument {
  productFeedback: Array<{
    isDisplayed: boolean;
    productId: string;
    productName: string;
    variantName: string;
    rating: number;
    comment: string;
  }>;
  createdAt: string;
}

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imageLoading, setImageLoading] = useState(true);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();
  const [feedbacks, setFeedbacks] = useState<FeedbackItem[]>([]);
  
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

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        if (!product) return; // Make sure we have the product data first

        console.log('Fetching feedbacks for:', product.name);
        const response = await fetch(`http://localhost:5000/api/feedback/product/${id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch feedbacks');
        }
        
        const data = await response.json();
        console.log('Received feedback data:', data);
        
        if (Array.isArray(data) && data.length > 0) {
          setFeedbacks(data);
        } else {
          console.log('No feedbacks found or empty array received');
        }
      } catch (error) {
        console.error('Error fetching feedbacks:', error);
      }
    };

    if (id && product) {
      fetchFeedbacks();
    }
  }, [id, product]); // Add product as a dependency

  const [selectedVariant, setSelectedVariant] = useState<string>("");

  // Update selectedVariant when product loads and has only one variant
  useEffect(() => {
    if (product?.variants?.length === 1) {
      setSelectedVariant(product.variants[0].name);
    }
  }, [product]);

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

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

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

          {feedbacks && feedbacks.length > 0 && (
            <div className="mt-12 border-t pt-8 pb-8">
              <h2 className="text-2xl font-bold text-foreground mb-6">
                Customer Reviews ({feedbacks.length})
              </h2>
              <div className="space-y-6">
                {feedbacks.map((feedback, index) => (
                  <div key={index} className="bg-muted p-4 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {feedback.customerName}
                        </p>
                        <StarRating rating={feedback.rating} />
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {feedback.variantName}
                      </span>
                    </div>
                    {feedback.comment && (
                      <p className="text-foreground mt-2">{feedback.comment}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
