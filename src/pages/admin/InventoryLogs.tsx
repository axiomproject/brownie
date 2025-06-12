import { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from 'sonner';
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

type SortColumn = 'createdAt' | 'previousQuantity' | 'newQuantity' | 'changeType';
type SortDirection = 'asc' | 'desc';

export default function InventoryLogs() {
  const [logs, setLogs] = useState<InventoryLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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

  const sortData = (data: InventoryLog[]): InventoryLog[] => {
    return [...data].sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
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

  const paginatedLogs = () => {
    const sortedData = sortData(logs);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(logs.length / itemsPerPage);

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
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('createdAt')}
              >
                Date <SortIcon column="createdAt" />
              </TableHead>
              <TableHead className="text-foreground">Product</TableHead>
              <TableHead className="text-foreground">Variant</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('changeType')}
              >
                Change Type <SortIcon column="changeType" />
              </TableHead>
              <TableHead className="text-foreground">Reason</TableHead>
              <TableHead className="text-foreground">Updated By</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedLogs().map((log) => (
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
