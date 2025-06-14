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
import { Loader2, ChevronUp, ChevronDown, FileDown, Search } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import React from "react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { API_URL } from '@/config';

interface OrderItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  variantName: string;
}

interface DeliveryDetails {
  riderName: string;
  riderContact: string;
  trackingLink: string;
}

interface Order {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  email?: string;  // Optional email for guest orders
  items: OrderItem[];
  totalAmount: number;
  status: 'received' | 'baking' | 'out for delivery' | 'delivered' | 'refunded';
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
  };
  createdAt: string;
  paymentMethod: 'gcash' | 'grab_pay';
  coupon?: {
    code: string;
    type: 'fixed' | 'product';
    value: number;
  };
  deliveryDetails?: DeliveryDetails;
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
  delivered: 'bg-green-500/10 text-green-500',
  refunded: 'bg-red-500/10 text-red-500'
};

type SortColumn = 'createdAt' | 'totalAmount' | 'status' | 'paymentMethod';
type SortDirection = 'asc' | 'desc';

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCustomer, setSelectedCustomer] = useState<{ id: string; name: string } | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails | null>(null);
  const [isDetailsDialogOpen, setIsDetailsDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default to newest first
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDeliveryDialog, setShowDeliveryDialog] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [deliveryDetails, setDeliveryDetails] = useState<DeliveryDetails>({
    riderName: '',
    riderContact: '',
    trackingLink: ''
  });

  const fetchOrders = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/orders`, {
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
      const response = await fetch(`${API_URL}/api/admin/users/${userId}/orders`, {
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
    if (newStatus === 'out for delivery') {
      setSelectedOrderId(orderId);
      setShowDeliveryDialog(true);
      return;
    }
  
    try {
      const response = await fetch(`${API_URL}/api/admin/orders/${orderId}/status`, {
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
  
      if (newStatus === 'refunded') {
        const emailResponse = await fetch(`${API_URL}/api/admin/orders/${orderId}/refund-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!emailResponse.ok) {
          throw new Error('Failed to send refund email');
        }
      }
  
      toast.success(`Order status updated to ${newStatus}`);
    } catch (error) {
      toast.error("Failed to update order status");
    }
  };

  const handleDeliverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (!selectedOrderId) {
        throw new Error('No order selected');
      }
  
      const response = await fetch(`${API_URL}/api/orders/${selectedOrderId}/delivery`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          status: 'out for delivery',
          deliveryDetails
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update delivery details');
      }
  
      const updatedOrder = await response.json();
      
      // Find the existing order to preserve user data
      const existingOrder = orders.find(order => order._id === selectedOrderId);
      
      // Merge the updated order with existing user data
      const mergedOrder = {
        ...updatedOrder,
        user: existingOrder?.user || null
      };
  
      // Update orders state with merged data
      setOrders(orders.map(order => 
        order._id === selectedOrderId ? mergedOrder : order
      ));
  
      setShowDeliveryDialog(false);
      setDeliveryDetails({
        riderName: '',
        riderContact: '',
        trackingLink: ''
      });
      toast.success('Order status updated and delivery details added');
    } catch (error) {
      console.error('Delivery update error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to update delivery details");
    }
  };

  const exportOrders = () => {
    // Convert orders to CSV format
    const headers = ['Order ID', 'Date', 'Customer', 'Items', 'Amount', 'Payment Method', 'Status'];
    const csvData = orders.map(order => [
      order._id.slice(-6),
      new Date(order.createdAt).toLocaleDateString(),
      order.user ? order.user.name : 'Guest Order',
      order.items.map(item => `${item.quantity}x ${item.name} (${item.variantName})`).join('; '),
      order.totalAmount.toFixed(2), // Removed peso sign
      order.paymentMethod,
      order.status
    ]);

    // Create CSV content
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `orders_${new Date().toISOString().slice(0,10)}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const sortData = (data: Order[]): Order[] => {
    return [...data].sort((a, b) => {
      const aValue = sortColumn === 'totalAmount' ? a[sortColumn] : a[sortColumn]?.toString().toLowerCase();
      const bValue = sortColumn === 'totalAmount' ? b[sortColumn] : b[sortColumn]?.toString().toLowerCase();
      
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
  };

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const filterOrders = (orders: Order[]) => {
    if (!searchQuery) return orders;
    
    const query = searchQuery.toLowerCase();
    return orders.filter(order => 
      order._id.toLowerCase().includes(query) ||
      (order.user?.name?.toLowerCase().includes(query) || false) ||
      (order.user?.email?.toLowerCase().includes(query) || false) ||
      order.paymentMethod.toLowerCase().includes(query)
    );
  };

  const paginatedOrders = () => {
    const filteredData = filterOrders(orders);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(orders.length / itemsPerPage);

  const renderPaginationItems = () => {
    const items = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= currentPage - 1 && i <= currentPage + 1)
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => setCurrentPage(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      } else if (i === currentPage - 2 || i === currentPage + 2) {
        items.push(
          <PaginationItem key={i}>
            <PaginationEllipsis />
          </PaginationItem>
        );
      }
    }
    return items;
  };

  const confirmBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const executeBulkDelete = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const orderId of selectedOrders) {
      try {
        const response = await fetch(`${API_URL}/api/admin/orders/${orderId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete order');
        
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setOrders(orders.filter(order => !selectedOrders.includes(order._id)));
      toast.success(`Successfully deleted ${successCount} orders`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} orders`);
    }
    setSelectedOrders([]);
    setShowDeleteDialog(false);
  };

  const toggleOrder = (orderId: string) => {
    setSelectedOrders(current =>
      current.includes(orderId)
        ? current.filter(id => id !== orderId)
        : [...current, orderId]
    );
  };

  const toggleAll = () => {
    const pageOrderIds = paginatedOrders().map(order => order._id);
    setSelectedOrders(current =>
      current.length === pageOrderIds.length ? [] : pageOrderIds
    );
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground mb-4">Orders List</h2>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search orders..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>
        </div>
        <Button onClick={exportOrders} variant="secondary" className="mt-8">
          <FileDown className="h-4 w-4 mr-2" />
          Export Orders
        </Button>
      </div>

      {selectedOrders.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-foreground">
            {selectedOrders.length} orders selected
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={confirmBulkDelete}
          >
            Delete Selected
          </Button>
        </div>
      )}

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedOrders.length} selected orders and remove their data from the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkDelete}>
              Continue
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Dialog open={showDeliveryDialog} onOpenChange={setShowDeliveryDialog}>
        <DialogContent className="sm:max-w-[425px] bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Enter Delivery Details</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleDeliverySubmit} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="riderName" className="text-sm font-medium text-foreground">
                  Rider Name
                </label>
                <Input
                  id="riderName"
                  className="text-foreground"
                  value={deliveryDetails.riderName}
                  onChange={(e) => setDeliveryDetails(prev => ({
                    ...prev,
                    riderName: e.target.value
                  }))}
                  placeholder="Enter rider's name"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="riderContact" className="text-sm font-medium text-foreground">
                  Contact Number
                </label>
                <Input
                  id="riderContact"
                  className="text-foreground"
                  value={deliveryDetails.riderContact}
                  onChange={(e) => setDeliveryDetails(prev => ({
                    ...prev,
                    riderContact: e.target.value
                  }))}
                  placeholder="Enter contact number"
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="trackingLink" className="text-sm font-medium text-foreground">
                  Tracking Link
                </label>
                <Input
                  id="trackingLink"
                  className="text-foreground"
                  value={deliveryDetails.trackingLink}
                  onChange={(e) => setDeliveryDetails(prev => ({
                    ...prev,
                    trackingLink: e.target.value
                  }))}
                  placeholder="Enter tracking link (optional)"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button
                type="button"
                className="text-foreground"
                variant="ghost"
                onClick={() => setShowDeliveryDialog(false)}
              >
                Cancel
              </Button>
              <Button type="submit">
                Confirm Delivery
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    paginatedOrders().length > 0 &&
                    paginatedOrders().every(order => selectedOrders.includes(order._id))
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead className="text-foreground">Order ID</TableHead>
              <TableHead className="text-foreground">Customer</TableHead>
              <TableHead className="text-foreground">
                Items & Discounts
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('totalAmount')}
              >
                Total <SortIcon column="totalAmount" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('paymentMethod')}
              >
                Payment <SortIcon column="paymentMethod" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('status')}
              >
                Status <SortIcon column="status" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('createdAt')}
              >
                Date <SortIcon column="createdAt" />
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders().map((order) => (
              <TableRow 
                key={order._id} 
                className="border-border"
                data-selected={selectedOrders.includes(order._id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedOrders.includes(order._id)}
                    onCheckedChange={() => toggleOrder(order._id)}
                  />
                </TableCell>
                <TableCell className="text-foreground font-mono">
                  {order._id.slice(-6)}
                </TableCell>
                <TableCell>
                  <Dialog 
                    open={isDetailsDialogOpen} 
                    onOpenChange={setIsDetailsDialogOpen}
                  >
                    <DialogTrigger  asChild>
                      {order.user ? (
                        <button 
                          onClick={() => order.user && handleCustomerClick(order.user._id, order.user.name)}
                          className="text-left hover:underline decoration-foreground/50 hover:text-foreground"
                        >
                          <div className="text-foreground">{order.user.name}</div>
                          <div className="text-sm text-muted-foreground">{order.user.email}</div>
                        </button>
                      ) : (
                        <div className="text-muted-foreground">Guest Order</div>
                      )}
                    </DialogTrigger>
                    {selectedCustomer && customerDetails && order.user && (
                      <DialogContent className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/95">
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
                              <p className="text-foreground">{new Date(customerDetails.firstOrder).toLocaleDateString()}</p>
                            </div>
                          </div>
                          
                          <div className="mt-4">
                            <h3 className="text-lg font-semibold mb-2 text-foreground">Order History</h3>
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
                  {order.coupon && (
                    <div className="mt-1 text-sm text-primary-foreground">
                      <span className="bg-primary px-2 py-0.5 rounded-full text-xs">
                        Coupon: {order.coupon.code} 
                        ({order.coupon.type === 'fixed' 
                          ? `₱${order.coupon.value} OFF`
                          : `${order.coupon.value}x Free Item`
                        })
                      </span>
                    </div>
                  )}
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
                      <SelectItem value="refunded">Refunded</SelectItem>
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

      {totalPages > 1 && (
        <Pagination className="mt-4 select-none">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} text-foreground hover:bg-muted hover:text-foreground`}
              />
            </PaginationItem>
            
            {renderPaginationItems().map((item, index) => (
              <PaginationItem key={index} className="text-foreground">
                {React.cloneElement(item, {
                  className: `${item.props.className || ''} text-foreground hover:bg-muted hover:text-foreground select-none`
                })}
              </PaginationItem>
            ))}
            
            <PaginationItem>
              <PaginationNext 
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                className={`${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} text-foreground hover:bg-muted hover:text-foreground`}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
