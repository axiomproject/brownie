import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Truck, Phone } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { 
  ScrollText, // For order received
  ChefHat,   // For baking
  PartyPopper, // For delivered 
  RefreshCcw // Add this for refunded status
} from 'lucide-react';

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  variantName: string;
}

interface DeliveryDetails {
  riderName: string;
  riderContact: string;
  trackingLink: string;
}

interface Order {
  _id: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'received' | 'baking' | 'out for delivery' | 'delivered' | 'refunded'; // Add refunded
  paymentMethod: string;
  createdAt: string;
  coupon?: {
    code: string;
    type: 'fixed' | 'product';
    value: number;
  };
  deliveryDetails?: DeliveryDetails;
}

export default function TrackOrder() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        // Check if orderId is a valid MongoDB ObjectId (24 hex characters)
        const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(orderId || '');
        
        if (!isValidObjectId) {
          setError('Invalid order ID format');
          setLoading(false);
          return;
        }

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
      delivered: 'bg-green-500',
      refunded: 'bg-red-500'
    };
    return colors[status];
  };

  const getStatusIcon = (status: string, isActive: boolean) => {
    const icons = {
      received: ScrollText,
      baking: ChefHat,
      'out for delivery': Truck,
      delivered: PartyPopper,
      refunded: RefreshCcw
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

  const DeliveryInfo = ({ details }: { details: DeliveryDetails }) => (
    <div className="bg-primary/10 rounded-lg p-4 mt-4 border border-primary/20">
      <h4 className="font-semibold text-primary mb-3">Delivery Information</h4>
      <div className="space-y-2">
        <div>
          <span className="text-muted-foreground">Rider Name:</span>
          <span className="ml-2 text-foreground">{details.riderName}</span>
        </div>
        <div className="flex items-center">
          <span className="text-muted-foreground">Contact:</span>
          <div className="ml-2 flex items-center gap-2">
            <Phone className="h-4 w-4 text-primary" />
            <a 
              href={`tel:${details.riderContact}`}
              className="text-primary hover:underline"
            >
              {details.riderContact}
            </a>
          </div>
        </div>
        {details.trackingLink && (
          <div>
            <span className="text-muted-foreground">Track:</span>
            <a 
              href={details.trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 text-primary hover:underline"
            >
              View Live Location
            </a>
          </div>
        )}
      </div>
    </div>
  );

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
                    {order.coupon && (
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary">Coupon Applied</Badge>
                        <span className="text-primary font-medium">
                          {order.coupon.code} ({order.coupon.type === 'fixed' 
                            ? `₱${order.coupon.value} OFF`
                            : `${order.coupon.value}x Free Item`
                          })
                        </span>
                      </div>
                    )}
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
                      {order.status === 'refunded' ? (
                        // Show only refunded status when order is refunded
                        <div className="col-span-4 text-center">
                          <div className="relative flex flex-col items-center gap-2">
                            <div className="z-10 bg-muted rounded-full p-2">
                              {getStatusIcon('refunded', true)}
                            </div>
                            <span className="text-sm font-medium text-primary">
                              Order Refunded
                            </span>
                            <p className="text-muted-foreground text-sm mt-2">
                              This order has been refunded. If you have any questions, please contact our support.
                            </p>
                          </div>
                        </div>
                      ) : (
                        // Show normal timeline for other statuses
                        ['received', 'baking', 'out for delivery', 'delivered'].map((statusStep, index) => {
                          const isActive = ['received', 'baking', 'out for delivery', 'delivered']
                            .indexOf(order.status) >= index;
                          
                          return (
                            <div key={statusStep} className="relative text-center">
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
                                  {getStatusIcon(statusStep, isActive)}
                                </div>
                                <span className={`text-sm font-medium capitalize ${
                                  isActive ? 'text-primary' : 'text-muted-foreground'
                                }`}>
                                  {statusStep}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  {/* Add the delivery info here */}
                  {order.status === 'out for delivery' && order.deliveryDetails && (
                    <DeliveryInfo details={order.deliveryDetails} />
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}