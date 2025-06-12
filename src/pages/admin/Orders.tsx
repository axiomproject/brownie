import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variantName: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  items: OrderItem[];
  totalAmount: number;
  status: 'received' | 'baking' | 'out for delivery' | 'delivered';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  paymentMethod: 'gcash' | 'grab_pay';
}

interface CustomerDetails {
  orders: Order[];
  totalSpent: number;
  orderCount: number;
  firstOrder: string;
}

const statusColors = {
  received: 'bg-blue-500/10 text-blue-500',
  baking: 'bg-yellow-500/10 text-yellow-500',
  'out for delivery': 'bg-purple-500/10 text-purple-500',
  delivered: 'bg-green-500/10 text-green-500'
};

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);

  const fetchOrders = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch orders');
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerDetails = async (userId: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/orders`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to fetch customer details');
      const data = await response.json();
      setCustomerDetails(data);
    } catch (error) {
      toast.error("Failed to load customer details");
    }
  };

  const handleCustomerClick = (userId: string, name: string) => {
    setSelectedCustomer({ id: userId, name });
    fetchCustomerDetails(userId);
    setIsDetailsDialogOpen(true);
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update order status');

      const updatedOrder = await response.json();
      setOrders(orders.map(order => 
        order._id === orderId ? updatedOrder : order
      ));
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Order ID</TableHead>
              <TableHead className="text-foreground">Customer</TableHead>
              <TableHead className="text-foreground">Items</TableHead>
              <TableHead className="text-foreground">Total</TableHead>
              <TableHead className="text-foreground">Payment</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order._id} className="border-border">
                <TableCell className="text-foreground font-mono">
                  {order._id.slice(-6)}
                </TableCell>
                <TableCell>
                  <Dialog open={isDetailsDialogOpen} onOpenChange={setIsDetailsDialogOpen}>
                    <DialogTrigger asChild>
                      {order.user ? (
                        <button 
                          onClick={() => order.user && handleCustomerClick(order.user._id, order.user.name)}
                          className="text-left hover:underline"
                        >
                          <div className="text-foreground">{order.user.name}</div>
                          <div className="text-sm text-muted-foreground">{order.user.email}</div>
                        </button>
                      ) : (
                        <div className="text-muted-foreground">Guest Order</div>
                      )}
                    </DialogTrigger>
                    {selectedCustomer && customerDetails && order.user && (
                      <DialogContent className="bg-background">
                        <DialogHeader>
                          <DialogTitle className="text-foreground">
                            Customer Details: {selectedCustomer.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Total Orders</p>
                              <p className="text-foreground text-lg">{customerDetails.orderCount}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Total Spent</p>
                              <p className="text-foreground text-lg">₱{customerDetails.totalSpent.toFixed(2)}</p>
                            </div>
                              <p className="text-muted-foreground">Customer Since</p>
                              <p className="text-muted-foreground">Customer Since</p>
                              <p className="text-foreground">{new Date(customerDetails.firstOrder).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2">Order History</h3>
                            <div className="space-y-2 max-h-[300px] overflow-y-auto">
                              {customerDetails.orders.map((order) => (
                              <div key={order._id} className="border p-3 rounded-lg">
                                <div className="flex justify-between">
                                  <span className="text-foreground">#{order._id.slice(-6)}</span>
                                  <span className="text-muted-foreground">
                                    {new Date(order.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {order.items.map((item, i) => (
                                    <div key={i}>{item.quantity}x {item.name}</div>
                                  ))}
                                </div>
                                <div className="flex justify-between mt-2">
                                  <span className={statusColors[order.status]}>{order.status}</span>
                                  <span className="text-foreground">₱{order.totalAmount.toFixed(2)}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </DialogContent>
                    )}
                  </Dialog>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {order.items.map((item, index) => (
                    <div key={index} className="text-sm">
                      {item.quantity}x {item.name} ({item.variantName})
                    </div>
                  ))}
                </TableCell>
                <TableCell className="text-foreground">
                  ₱{order.totalAmount.toFixed(2)}
                </TableCell>
                <TableCell className="text-foreground capitalize">
                  {order.paymentMethod}
                </TableCell>
                <TableCell>
                  <Select
                    defaultValue={order.status}
                    onValueChange={(value) => updateOrderStatus(order._id, value)}
                  >
                    <SelectTrigger className={`w-[140px] ${statusColors[order.status]}`}>
                      <SelectValue>{order.status}</SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="received">Received</SelectItem>
                      <SelectItem value="baking">Baking</SelectItem>
                      <SelectItem value="out for delivery">Out for Delivery</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell className="text-foreground">
                  {new Date(order.createdAt).toLocaleString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
