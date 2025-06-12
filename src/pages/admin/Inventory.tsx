import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

export default function Inventory() {
  const [products, setProducts] = useState<Product[]>([]);
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingStock, setUpdatingStock] = useState<string>("");

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
                  <TableHead className="text-foreground">Product</TableHead>
                  <TableHead className="text-foreground">Category</TableHead>
                  <TableHead className="text-foreground">Variant</TableHead>
                  <TableHead className="text-foreground">Stock Quantity</TableHead>
                  <TableHead className="text-foreground">Status</TableHead>
                  <TableHead className="text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.flatMap((product) =>
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
        </TabsContent>

        <TabsContent value="logs">
          <div className="rounded-md border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-foreground">Date</TableHead>
                  <TableHead className="text-foreground">Product</TableHead>
                  <TableHead className="text-foreground">Variant</TableHead>
                  <TableHead className="text-foreground">Change</TableHead>
                  <TableHead className="text-foreground">Reason</TableHead>
                  <TableHead className="text-foreground">Updated By</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
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
        </TabsContent>
      </Tabs>
    </div>
  );
}
