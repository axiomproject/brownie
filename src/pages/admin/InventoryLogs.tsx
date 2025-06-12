import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2 } from "lucide-react";
import { toast } from 'sonner';

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

export default function InventoryLogs() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/admin/inventory/logs', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          }
        });
        
        if (!response.ok) throw new Error('Failed to fetch logs');
        const data = await response.json();
        setLogs(data);
      } catch (error) {
        toast.error("Failed to load inventory logs");
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
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
      <h2 className="text-xl font-semibold text-foreground">Inventory Logs</h2>
      
      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Variant</TableHead>
              <TableHead>Change</TableHead>
              <TableHead>Reason</TableHead>
              <TableHead>Updated By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {logs.map((log) => (
              <TableRow key={log._id}>
                <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                <TableCell>{log.productId.name}</TableCell>
                <TableCell>{log.variantName}</TableCell>
                <TableCell>
                  <span className={log.newQuantity > log.previousQuantity ? 'text-green-500' : 'text-red-500'}>
                    {log.previousQuantity} → {log.newQuantity}
                  </span>
                </TableCell>
                <TableCell>{log.reason}</TableCell>
                <TableCell>{log.updatedBy.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
