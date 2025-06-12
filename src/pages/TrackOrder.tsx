import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Truck, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, // For order received
  ChefHat,   // For baking
  PartyPopper // For delivered
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantName: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'received' | 'baking' | 'out for delivery' | 'delivered';
  paymentMethod: string;
  createdAt: string;
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/orders/track/${orderId}`);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || 'Failed to fetch order');
        }

        setOrder(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto" />
            <p className="mt-2 text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </>
    );
  }

  if (error || !order) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-24 bg-background">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-destructive">{error || 'Order not found'}</p>
          </div>
        </div>
      </>
    );
  }

  const getStatusColor = (status: Order['status']) => {
    const colors = {
      received: 'bg-blue-500',
      baking: 'bg-yellow-500',
      'out for delivery': 'bg-purple-500',
      delivered: 'bg-green-500'
    };
    return colors[status];
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    const icons = {
      received: ScrollText,
      baking: ChefHat,
      'out for delivery': Truck,
      delivered: PartyPopper
    };
    const Icon = icons[status as keyof typeof icons];
    
    return (
      <div className="relative flex items-center justify-center w-12 h-12">
        {isActive && (
          <>
            <span className="absolute inset-0 rounded-full bg-primary/20" />
            <span className="absolute inset-0 rounded-full animate-ping-slow bg-primary/40" />
          </>
        )}
        <Icon 
          className={`w-8 h-8 relative z-10 ${
            isActive ? 'text-primary' : 'text-muted-foreground'
          }`}
          strokeWidth={1.5}
        />
      </div>
    );
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen pt-24 bg-background">
        <div className="max-w-3xl mx-auto p-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Order #{order._id.slice(-8)}</CardTitle>
                <Badge className={getStatusColor(order.status)}>
                  {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold mb-2">Order Details</h3>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    <p>Date: {new Date(order.createdAt).toLocaleString()}</p>
                    <p>Payment Method: {order.paymentMethod.toUpperCase()}</p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Items</h3>
                  <div className="bg-muted rounded-lg p-4 space-y-2">
                    {order.items.map((item, index) => (
                      <div key={index} className="flex justify-between items-center">
                        <span>
                          {item.name} ({item.variantName}) x{item.quantity}
                        </span>
                        <span>₱{(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center font-semibold">
                        <span>Total</span>
                        <span>₱{order.totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-4">Order Timeline</h3>
                  <div className="bg-muted rounded-lg p-6">
                    <div className="grid grid-cols-4 gap-4">
                      {['received', 'baking', 'out for delivery', 'delivered'].map((status, index) => {
                        const isActive = ['received', 'baking', 'out for delivery', 'delivered']
                          .indexOf(order.status) >= index;
                        
                        return (
                          <div key={status} className="relative text-center">
                            {/* Progress line */}
                            {index < 3 && (
                              <div 
                                className={`absolute top-4 left-1/2 w-full h-0.5 ${
                                  isActive ? 'bg-primary' : 'bg-muted-foreground'
                                }`}
                              />
                            )}
                            
                            {/* Icon and label */}
                            <div className="relative flex flex-col items-center gap-2">
                              <div className="z-10 bg-muted rounded-full p-2">
                                {getStatusIcon(status, isActive)}
                              </div>
                              <span className={`text-sm font-medium capitalize ${
                                isActive ? 'text-primary' : 'text-muted-foreground'
                              }`}>
                                {status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}