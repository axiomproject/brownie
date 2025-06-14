import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface OrderItem {
  productId: string;
  name: string;
  variantName: string;
  quantity: number;
  image?: string; // Add image field
}

interface Order {
  _id: string;
  items: OrderItem[];
}

interface ProductFeedback {
  productId: string;
  rating: number;
  comment: string;
  productName: string;
  variantName: string;
  image?: string; // Add image field
}

export default function FeedbackPage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<ProductFeedback[]>([]);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/track/${orderId}`);
        if (!response.ok) throw new Error('Failed to fetch order');
        const data = await response.json();
        setOrder(data);
        
        // Initialize feedback state with product images directly from the order data
        setFeedback(data.items.map((item: any) => ({
          productId: item.productId._id, // Use the actual product ID
          rating: 0,
          comment: '',
          productName: item.name,
          variantName: item.variantName,
          image: item.image || item.productId?.images?.[0] // Use either transformed image or direct product image
        })));
      } catch (error) {
        toast.error('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const handleRatingChange = (productId: string, rating: number) => {
    setFeedback(current =>
      current.map(item =>
        item.productId === productId ? { ...item, rating } : item
      )
    );
  };

  const handleCommentChange = (productId: string, comment: string) => {
    setFeedback(current =>
      current.map(item =>
        item.productId === productId ? { ...item, comment } : item
      )
    );
  };

  const handleSubmit = async () => {
    // Validate that all products have ratings
    if (feedback.some(f => f.rating === 0)) {
      toast.error('Please rate all products');
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderId,
          feedback
        }),
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      
      toast.success('Thank you for your feedback!');
      // Optionally redirect to home page or order confirmation
    } catch (error) {
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading...</p>
          </div>
        </div>
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-destructive">Order not found</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Feedback</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {feedback.map((item) => (
                <div key={item.productId} className="space-y-4 pb-6 border-b last:border-0">
                  <div className="flex gap-4 items-start">
                    {item.image && (
                      <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                        <img
                          src={item.image}
                          alt={item.productName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-grow">
                      <h3 className="font-semibold">
                        {item.productName} ({item.variantName})
                      </h3>
                      
                      <div className="flex gap-1 mt-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            onClick={() => handleRatingChange(item.productId, star)}
                            className="focus:outline-none"
                          >
                            <Star
                              className={`w-8 h-8 ${
                                star <= item.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <Textarea
                    placeholder="Share your thoughts about this product..."
                    value={item.comment}
                    onChange={(e) => handleCommentChange(item.productId, e.target.value)}
                    className="w-full"
                  />
                </div>
              ))}

              <Button 
                onClick={handleSubmit} 
                className="w-full"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Feedback'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
