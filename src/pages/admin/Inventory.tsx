import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Loader2, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { API_URL } from '@/config';
import { Card, CardContent } from "@/components/ui/card";

interface Variant {
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
}

interface Product {
  _id: string;
  name: string;
  category: string;
  variants: Variant[];
}

interface InventoryLog {
  _id: string;
  productId: { _id: string; name: string };
  variantName: string;
  previousQuantity: number;
  newQuantity: number;
  changeType: 'increment' | 'decrement' | 'manual' | 'order';
  reason: string;
  updatedBy: { _id: string; name: string };
  createdAt: string;
}

type SortColumn = 'name' | 'category' | 'stockQuantity';
type SortDirection = 'asc' | 'desc';

// Add these types after the existing interfaces
type LogSortColumn = 'createdAt' | 'productId.name' | 'variantName' | 'newQuantity' | 'reason' | 'updatedBy.name';

const StockUpdateDialog = ({
  open,
  onOpenChange,
  selectedUpdate,
  onUpdate,
  onCancel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUpdate: {
    productId: string;
    variantName: string;
    currentQuantity: number;
    newQuantity: number;
  } | null;
  onUpdate: (reason: string) => void;
  onCancel: () => void;
}) => {
  const [reason, setReason] = useState("");

  const handleSubmit = () => {
    if (reason.trim()) {
      onUpdate(reason.trim());
      setReason("");
    }
  };

  // Reset reason when dialog opens
  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-foreground">Update Stock Quantity</DialogTitle>
          <DialogDescription>
            Enter a reason for updating the stock quantity.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reason" className="text-right text-foreground">
              Reason
            </Label>
            <Input
              id="reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="col-span-3 text-foreground"
              autoFocus
              placeholder="Enter reason for stock update"
            />
          </div>
          {selectedUpdate && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-foreground">Change</Label>
              <div className="col-span-3">
                <span className={`font-mono ${
                  selectedUpdate.newQuantity > selectedUpdate.currentQuantity
                    ? 'text-green-500'
                    : 'text-red-500'
                }`}>
                  {selectedUpdate.currentQuantity} → {selectedUpdate.newQuantity}
                </span>
              </div>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button
            className="text-foreground"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            onClick={handleSubmit}
            disabled={!reason.trim()}
          >
            Update Stock
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStock, setUpdatingStock] = useState<string>("");
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [logSortColumn, setLogSortColumn] = useState<LogSortColumn>('createdAt');
  const [logSortDirection, setLogSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [logsCurrentPage, setLogsCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const itemsPerPage = 10;

  const [updateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedUpdate, setSelectedUpdate] = useState<{
    productId: string;
    variantName: string;
    currentQuantity: number;
    newQuantity: number;
  } | null>(null);
  const [] = useState("");

  const fetchData = async () => {
    try {
      const [productsRes, logsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/products`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch(`${API_URL}/api/admin/inventory/logs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);
      
      if (!productsRes.ok || !logsRes.ok) throw new Error('Failed to fetch data');
      
      const [productsData, logsData] = await Promise.all([
        productsRes.json(),
        logsRes.json()
      ]);
      
      setProducts(productsData);
      setLogs(logsData);
    } catch (error) {
      toast.error("Failed to load inventory data");
    } finally {
      setLoading(false);
    }
  };

  const updateStock = async (productId: string, variantName: string, stockQuantity: number, reason: string) => {
    const stockId = `${productId}-${variantName}`;
    setUpdatingStock(stockId);
    
    try {
      const [updateResponse, logsResponse] = await Promise.all([
        fetch(`${API_URL}/api/admin/inventory/update`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            productId,
            variantName,
            stockQuantity,
            reason
          })
        }),
        // Fetch latest logs after update
        fetch(`${API_URL}/api/admin/inventory/logs`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        })
      ]);

      if (!updateResponse.ok || !logsResponse.ok) throw new Error('Failed to update stock');
      
      const [updatedProduct, newLogs] = await Promise.all([
        updateResponse.json(),
        logsResponse.json()
      ]);

      // Update both products and logs states
      setProducts(products.map(p => 
        p._id === productId ? updatedProduct : p
      ));
      setLogs(newLogs);
      
      toast.success("Stock updated successfully");
    } catch (error) {
      toast.error("Failed to update stock");
    } finally {
      setUpdatingStock("");
    }
  };

  const sortData = (data: Product[]): Product[] => {
    return [...data].sort((a, b) => {
      if (!a || !b) return 0; // Handle null values

      let aValue: any, bValue: any;

      if (sortColumn === 'stockQuantity') {
        // For stockQuantity, sum up all variants, handling null values
        aValue = a.variants?.reduce((sum, v) => sum + (v?.stockQuantity || 0), 0) || 0;
        bValue = b.variants?.reduce((sum, v) => sum + (v?.stockQuantity || 0), 0) || 0;
      } else {
        // For other columns, compare directly with null checks
        aValue = a[sortColumn]?.toString().toLowerCase() || '';
        bValue = b[sortColumn]?.toString().toLowerCase() || '';
      }

      // Numeric comparison for stockQuantity
      if (sortColumn === 'stockQuantity') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }

      // String comparison for other columns
      return sortDirection === 'asc'
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    });
  };

  const sortLogs = (data: InventoryLog[]): InventoryLog[] => {
    return [...data].sort((a, b) => {
      if (!a || !b || !a.productId || !b.productId || !a.updatedBy || !b.updatedBy) return 0;
      
      let aValue, bValue;

      // Handle nested properties
      if (logSortColumn === 'productId.name') {
        aValue = a.productId.name || '';
        bValue = b.productId.name || '';
      } else if (logSortColumn === 'updatedBy.name') {
        aValue = a.updatedBy.name || '';
        bValue = b.updatedBy.name || '';
      } else {
        aValue = a[logSortColumn as keyof InventoryLog] || '';
        bValue = b[logSortColumn as keyof InventoryLog] || '';
      }
      
      if (logSortDirection === 'asc') {
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

  const handleLogSort = (column: LogSortColumn) => {
    if (logSortColumn === column) {
      setLogSortDirection(current => current === 'asc' ? 'desc' : 'asc');
    } else {
      setLogSortColumn(column);
      setLogSortDirection('asc');
    }
  };

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null;
    return sortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const LogSortIcon = ({ column }: { column: LogSortColumn }) => {
    if (logSortColumn !== column) return null;
    return logSortDirection === 'asc' ? 
      <ChevronUp className="w-4 h-4 inline ml-1" /> : 
      <ChevronDown className="w-4 h-4 inline ml-1" />;
  };

  const filterProducts = (products: Product[]) => {
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase().trim();
    return products.filter(product => 
      product && // Check if product exists
      (product.name?.toLowerCase().includes(query) ||
      product.category?.toLowerCase().includes(query) ||
      product.variants?.some(variant => 
        variant && // Check if variant exists
        (variant.name?.toLowerCase().includes(query) ||
        variant.stockQuantity?.toString().includes(query))
      ))
    );
  };

  const filterLogs = (logs: InventoryLog[]) => {
    if (!searchQuery) return logs;
    
    const query = searchQuery.toLowerCase().trim();
    return logs.filter(log => {
      if (!log || !log.productId || !log.updatedBy) return false;
      
      return (
        log.productId.name?.toLowerCase().includes(query) ||
        log.variantName?.toLowerCase().includes(query) ||
        log.reason?.toLowerCase().includes(query) ||
        log.updatedBy.name?.toLowerCase().includes(query) ||
        log.previousQuantity?.toString().includes(query) ||
        log.newQuantity?.toString().includes(query)
      );
    });
  };

  const paginatedProducts = () => {
    // First filter out any null or invalid products
    const validProducts = products.filter(product => 
      product && product.name && Array.isArray(product.variants)
    );
    
    // Then apply filtering
    const filteredData = filterProducts(validProducts);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const paginatedLogs = () => {
    // Filter out invalid logs first
    const validLogs = logs.filter(log => 
      log && 
      log.productId && 
      log.productId.name && 
      log.updatedBy && 
      log.updatedBy.name
    );
    
    const filteredData = filterLogs(validLogs);
    const sortedData = sortLogs(filteredData);
    const startIndex = (logsCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filterProducts(products).length / itemsPerPage);
  const totalLogsPages = Math.ceil(filterLogs(logs).length / itemsPerPage);

  const renderPaginationItems = (currentPage: number, totalPages: number, setPage: (page: number) => void) => {
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
              onClick={() => setPage(i)}
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

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
    setLogsCurrentPage(1);
  }, [searchQuery, sortColumn, sortDirection, logSortColumn, logSortDirection]);

  const handleUpdateStock = (reason: string) => {
    if (selectedUpdate) {
      updateStock(
        selectedUpdate.productId,
        selectedUpdate.variantName,
        selectedUpdate.newQuantity,
        reason
      );
      setUpdateDialogOpen(false);
      setSelectedUpdate(null);
    }
  };

  const handleCancelUpdate = () => {
    setUpdateDialogOpen(false);
    setSelectedUpdate(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="w-full sm:w-auto sm:flex-1">
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-2 xs:left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search inventory..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 xs:pl-10 w-full text-sm xs:text-base bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>
        </div>
      </div>

      <Tabs defaultValue="stock" className="w-full">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock">
          <div className="flex flex-col gap-4">
            <Card>
              <CardContent className="p-0">
                <div className="border-0 overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-border">
                        <TableHead 
                          className="text-foreground cursor-pointer hover:bg-muted min-w-[120px] lg:min-w-[150px]"
                          onClick={() => handleSort('name')}
                        >
                          Product <SortIcon column="name" />
                        </TableHead>
                        <TableHead 
                          className="hidden md:table-cell text-foreground cursor-pointer hover:bg-muted"
                          onClick={() => handleSort('category')}
                        >
                          Category <SortIcon column="category" />
                        </TableHead>
                        <TableHead className="text-foreground min-w-[100px]">
                          Variant
                        </TableHead>
                        <TableHead className="text-foreground">
                          Stock
                        </TableHead>
                        <TableHead className="hidden md:table-cell text-foreground">
                          Status
                        </TableHead>
                        <TableHead className="text-foreground w-[120px] sm:w-[150px]">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paginatedProducts().flatMap((product) =>
                        product.variants.map((variant) => (
                          <TableRow key={`${product._id}-${variant.name}`} className="border-border">
                            <TableCell className="min-w-[120px] lg:min-w-[150px]">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-medium truncate text-xs xs:text-sm text-foreground">
                                  {product.name}
                                </span>
                                <span className="text-[10px] xs:text-xs text-muted-foreground md:hidden capitalize">
                                  {product.category}
                                </span>
                                <span className="text-[10px] xs:text-xs text-muted-foreground md:hidden">
                                  {variant.inStock ? 'In Stock' : 'Out of Stock'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="hidden md:table-cell capitalize text-foreground">
                              {product.category}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {variant.name}
                            </TableCell>
                            <TableCell className="text-foreground">
                              {variant.stockQuantity}
                            </TableCell>
                            <TableCell className="hidden md:table-cell">
                              <span className={`px-2 py-1 rounded-full text-xs ${
                                variant.inStock 
                                  ? 'bg-green-500/10 text-green-500' 
                                  : 'bg-red-500/10 text-red-500'
                              }`}>
                                {variant.inStock ? 'In Stock' : 'Out of Stock'}
                              </span>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  className="w-20 xs:w-24 text-xs xs:text-sm text-foreground"
                                  defaultValue={variant.stockQuantity}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const newQuantity = parseInt((e.target as HTMLInputElement).value);
                                      if (!isNaN(newQuantity) && newQuantity >= 0) {
                                        setSelectedUpdate({
                                          productId: product._id,
                                          variantName: variant.name,
                                          currentQuantity: variant.stockQuantity,
                                          newQuantity
                                        });
                                        setUpdateDialogOpen(true);
                                      }
                                    }
                                  }}
                                  onBlur={(e) => {
                                    const newQuantity = parseInt(e.target.value);
                                    if (!isNaN(newQuantity) && 
                                        newQuantity >= 0 && 
                                        newQuantity !== variant.stockQuantity) {
                                      setSelectedUpdate({
                                        productId: product._id,
                                        variantName: variant.name,
                                        currentQuantity: variant.stockQuantity,
                                        newQuantity
                                      });
                                      setUpdateDialogOpen(true);
                                    }
                                  }}
                                />
                                {updatingStock === `${product._id}-${variant.name}` && (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>

                {totalPages > 1 && (
                  <div className="border-t border-border">
                    <Pagination className="py-1 xs:py-2 sm:py-4">
                      <PaginationContent className="flex justify-center gap-0.5 xs:gap-1 sm:gap-2">
                        <PaginationPrevious 
                          onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                          className={`px-1 xs:px-2 sm:px-4 text-xs xs:text-sm ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                        />
                        {renderPaginationItems(currentPage, totalPages, setCurrentPage)}
                        <PaginationNext 
                          onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                          className={`px-1 xs:px-2 sm:px-4 text-xs xs:text-sm ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                        />
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardContent className="p-0">
              <div className="border-0 overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead 
                        className="text-foreground min-w-[120px] lg:min-w-[150px] cursor-pointer hover:bg-muted"
                        onClick={() => handleLogSort('productId.name')}
                      >
                        Product <LogSortIcon column="productId.name" />
                      </TableHead>
                      <TableHead 
                        className="hidden md:table-cell text-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleLogSort('createdAt')}
                      >
                        Date <LogSortIcon column="createdAt" />
                      </TableHead>
                      <TableHead 
                        className="text-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleLogSort('newQuantity')}
                      >
                        Change <LogSortIcon column="newQuantity" />
                      </TableHead>
                      <TableHead 
                        className="hidden lg:table-cell text-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleLogSort('reason')}
                      >
                        Reason <LogSortIcon column="reason" />
                      </TableHead>
                      <TableHead 
                        className="hidden md:table-cell text-foreground cursor-pointer hover:bg-muted"
                        onClick={() => handleLogSort('updatedBy.name')}
                      >
                        Updated By <LogSortIcon column="updatedBy.name" />
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedLogs().map((log) => (
                      <TableRow key={log._id}>
                        <TableCell className="min-w-[120px] lg:min-w-[150px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium truncate text-xs xs:text-sm text-foreground">
                              {log.productId.name}
                            </span>
                            <span className="text-[10px] xs:text-xs text-muted-foreground">
                              {log.variantName}
                            </span>
                            <span className="text-[10px] xs:text-xs text-muted-foreground md:hidden">
                              {new Date(log.createdAt).toLocaleString()}
                            </span>
                            <span className="text-[10px] xs:text-xs text-muted-foreground lg:hidden truncate">
                              {log.reason}
                            </span>
                            <span className="text-[10px] xs:text-xs text-muted-foreground md:hidden">
                              By: {log.updatedBy.name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          <span className={`${
                            log.newQuantity > log.previousQuantity 
                              ? 'text-green-500 dark:text-green-400' 
                              : 'text-red-500 dark:text-red-400'
                          }`}>
                            {log.previousQuantity} → {log.newQuantity}
                          </span>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-foreground">
                          <span className="truncate block max-w-[200px]">{log.reason}</span>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-foreground">
                          {log.updatedBy.name}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalLogsPages > 1 && (
                <div className="border-t border-border">
                  <Pagination className="py-1 xs:py-2 sm:py-4">
                    <PaginationContent className="flex justify-center gap-0.5 xs:gap-1 sm:gap-2">
                      <PaginationPrevious 
                        onClick={() => setLogsCurrentPage(p => Math.max(1, p - 1))}
                        className={`px-1 xs:px-2 sm:px-4 text-xs xs:text-sm ${logsCurrentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                      />
                      {renderPaginationItems(logsCurrentPage, totalLogsPages, setLogsCurrentPage)}
                      <PaginationNext 
                        onClick={() => setLogsCurrentPage(p => Math.min(totalLogsPages, p + 1))}
                        className={`px-1 xs:px-2 sm:px-4 text-xs xs:text-sm ${logsCurrentPage === totalLogsPages ? 'pointer-events-none opacity-50' : ''}`}
                      />
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      <StockUpdateDialog
        open={updateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        selectedUpdate={selectedUpdate}
        onUpdate={handleUpdateStock}
        onCancel={handleCancelUpdate}
      />
    </div>
  );
}
