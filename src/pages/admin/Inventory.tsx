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
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
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
  const itemsPerPage = 10;

  const fetchData = async () => {
    try {
      const [productsRes, logsRes] = await Promise.all([
        fetch('http://localhost:5000/api/admin/products', {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        }),
        fetch('http://localhost:5000/api/admin/inventory/logs', {
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
      const response = await fetch('http://localhost:5000/api/admin/inventory/update', {
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
      });

      if (!response.ok) throw new Error('Failed to update stock');
      
      const updatedProduct = await response.json();
      setProducts(products.map(p => 
        p._id === productId ? updatedProduct : p
      ));
      
      toast.success("Stock updated successfully");
    } catch (error) {
      toast.error("Failed to update stock");
    } finally {
      setUpdatingStock("");
    }
  };

  const sortData = (data: Product[]): Product[] => {
    return [...data].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortColumn) {
        case 'stockQuantity':
          // Convert to numbers for proper numeric sorting
          aValue = a.variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0);
          bValue = b.variants.reduce((sum, v) => sum + Number(v.stockQuantity || 0), 0);
          break;
        default:
          aValue = String(a[sortColumn]).toLowerCase();
          bValue = String(b[sortColumn]).toLowerCase();
      }
      
      if (sortColumn === 'stockQuantity') {
        // Use numeric comparison for stockQuantity
        return sortDirection === 'asc' 
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      }

      // Use string comparison for other columns
      if (sortDirection === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
      }
    });
  };

  const sortLogs = (data: InventoryLog[]): InventoryLog[] => {
    return [...data].sort((a, b) => {
      let aValue, bValue;

      // Handle nested properties
      if (logSortColumn === 'productId.name') {
        aValue = a.productId.name;
        bValue = b.productId.name;
      } else if (logSortColumn === 'updatedBy.name') {
        aValue = a.updatedBy.name;
        bValue = b.updatedBy.name;
      } else {
        aValue = a[logSortColumn as keyof InventoryLog];
        bValue = b[logSortColumn as keyof InventoryLog];
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

  const paginatedProducts = () => {
    const sortedData = sortData(products);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const paginatedLogs = () => {
    const sortedData = sortLogs(logs);
    const startIndex = (logsCurrentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);
  const totalLogsPages = Math.ceil(logs.length / itemsPerPage);

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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">Inventory List</h2>
      
      <Tabs defaultValue="stock" className="w-full">
        <TabsList>
          <TabsTrigger value="stock">Stock Levels</TabsTrigger>
          <TabsTrigger value="logs">Activity Logs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="stock">
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('name')}
                  >
                    Product <SortIcon column="name" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('category')}
                  >
                    Category <SortIcon column="category" />
                  </TableHead>
                  <TableHead className="text-foreground">Variant</TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleSort('stockQuantity')}
                  >
                    Stock Quantity <SortIcon column="stockQuantity" />
                  </TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedProducts().flatMap((product) =>
                  product.variants.map((variant) => (
                    <TableRow key={`${product._id}-${variant.name}`} className="border-border">
                      <TableCell className="text-foreground">{product.name}</TableCell>
                      <TableCell className="capitalize text-foreground">{product.category}</TableCell>
                      <TableCell className="text-foreground">{variant.name}</TableCell>
                      <TableCell className="text-foreground">{variant.stockQuantity}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-sm ${
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
                            className="w-20 text-foreground"
                            defaultValue={variant.stockQuantity}
                            onChange={(e) => {
                              const newQuantity = parseInt(e.target.value);
                              if (newQuantity >= 0) {
                                const reason = prompt('Reason for stock update:');
                                if (reason) {
                                  updateStock(product._id, variant.name, newQuantity, reason);
                                }
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
            <Pagination className="mt-4 select-none">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    className={`${currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} text-foreground hover:bg-muted hover:text-foreground`}
                  />
                </PaginationItem>
                
                {renderPaginationItems(currentPage, totalPages, setCurrentPage).map((item, index) => (
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
        </TabsContent>

        <TabsContent value="logs">
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('createdAt')}
                  >
                    Date <LogSortIcon column="createdAt" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('productId.name')}
                  >
                    Product <LogSortIcon column="productId.name" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('variantName')}
                  >
                    Variant <LogSortIcon column="variantName" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('newQuantity')}
                  >
                    Change <LogSortIcon column="newQuantity" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('reason')}
                  >
                    Reason <LogSortIcon column="reason" />
                  </TableHead>
                  <TableHead 
                    className="text-foreground cursor-pointer hover:bg-muted"
                    onClick={() => handleLogSort('updatedBy.name')}
                  >
                    Updated By <LogSortIcon column="updatedBy.name" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedLogs().map((log) => (
                  <TableRow key={log._id}>
                    <TableCell className="text-foreground">{new Date(log.createdAt).toLocaleString()}</TableCell>
                    <TableCell className="text-foreground">{log.productId.name}</TableCell>
                    <TableCell className="text-foreground">{log.variantName}</TableCell>
                    <TableCell>
                      <span className={`${
                        log.newQuantity > log.previousQuantity 
                          ? 'text-green-500 dark:text-green-400' 
                          : 'text-red-500 dark:text-red-400'
                      }`}>
                        {log.previousQuantity} → {log.newQuantity}
                      </span>
                    </TableCell>
                    <TableCell className="text-foreground">{log.reason}</TableCell>
                    <TableCell className="text-foreground">{log.updatedBy.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {totalLogsPages > 1 && (
            <Pagination className="mt-4 select-none">
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setLogsCurrentPage(p => Math.max(1, p - 1))}
                    className={`${logsCurrentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} text-foreground hover:bg-muted hover:text-foreground`}
                  />
                </PaginationItem>
                
                {renderPaginationItems(logsCurrentPage, totalLogsPages, setLogsCurrentPage).map((item, index) => (
                  <PaginationItem key={index} className="text-foreground">
                    {React.cloneElement(item, {
                      className: `${item.props.className || ''} text-foreground hover:bg-muted hover:text-foreground select-none`
                    })}
                  </PaginationItem>
                ))}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setLogsCurrentPage(p => Math.min(totalLogsPages, p + 1))}
                    className={`${logsCurrentPage === totalLogsPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} text-foreground hover:bg-muted hover:text-foreground`}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
