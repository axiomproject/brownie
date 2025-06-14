import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
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
  feedbackId: string; // Add this new field
  rating: number;
  comment: string;
  productName: string;
  variantName: string;
  image?: string; // Add image field
}

export default function FeedbackPage() {
  const navigate = useNavigate();
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
        
        // Create unique feedbackId for each variant
        setFeedback(data.items.map((item: any) => ({
          productId: item.productId._id,
          feedbackId: `${item.productId._id}-${item.variantName}`, // Unique identifier
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

  const handleRatingChange = (feedbackId: string, rating: number) => {
    setFeedback(current =>
      current.map(item =>
        item.feedbackId === feedbackId ? { ...item, rating } : item
      )
    );
  };

  const handleCommentChange = (feedbackId: string, comment: string) => {
    setFeedback(current =>
      current.map(item =>
        item.feedbackId === feedbackId ? { ...item, comment } : item
      )
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    setSubmitting(true);

    try {
      const feedbackData = {
        orderId: orderId,
        feedback: feedback.map(item => ({
          productId: item.productId,
          productName: item.productName,
          variantName: item.variantName,
          rating: item.rating,
          comment: item.comment // Ensure comment is included
        }))
      };

      console.log('Submitting feedback:', feedbackData); // Debug log

      const response = await fetch('http://localhost:5000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(feedbackData)
      });

      if (!response.ok) throw new Error('Failed to submit feedback');
      
      toast.success('Thank you for your feedback!');
      navigate('/');
    } catch (error) {
      console.error('Error submitting feedback:', error);
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
                <div key={item.feedbackId} className="space-y-4 pb-6 border-b last:border-0">
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
                            onClick={() => handleRatingChange(item.feedbackId, star)}
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
                    onChange={(e) => handleCommentChange(item.feedbackId, e.target.value)}
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
