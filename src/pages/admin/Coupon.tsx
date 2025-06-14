import { useState, useEffect } from "react";
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
import { Loader2, Plus, Pencil, X, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

interface Coupon {
  _id: string;
  code: string;
  type: 'fixed' | 'product';
  value: number;
  productId?: string;
  maxUses: number;
  usedCount: number;
  expiryDate: string | null;
  isActive: boolean;
  createdAt: string;
  newUsersOnly: boolean;
}

type SortColumn = 'code' | 'type' | 'value' | 'maxUses' | 'usedCount' | 'isActive' | 'expiryDate' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Coupon() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'fixed',
    value: 0,
    maxUses: -1,
    expiryDate: '',
    newUsersOnly: false
  });
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedCoupons, setSelectedCoupons] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCoupons = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/coupons', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch coupons');
      const data = await response.json();
      setCoupons(data);
    } catch (error) {
      toast.error("Failed to load coupons");
    } finally {
      setLoading(false);
    }
  };

  const createCoupon = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          ...newCoupon,
          expiryDate: newCoupon.expiryDate || null,
          maxUses: newCoupon.maxUses === -1 ? null : newCoupon.maxUses
        })
      });

      if (!response.ok) throw new Error('Failed to create coupon');
      
      const createdCoupon = await response.json();
      setCoupons([...coupons, createdCoupon]);
      setIsDialogOpen(false);
      toast.success("Coupon created successfully");
    } catch (error) {
      toast.error("Failed to create coupon");
    }
  };

  const toggleCouponStatus = async (couponId: string, isActive: boolean) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/coupons/${couponId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ isActive })
      });

      if (!response.ok) throw new Error('Failed to update coupon');
      
      setCoupons(coupons.map(coupon => 
        coupon._id === couponId ? { ...coupon, isActive } : coupon
      ));
      toast.success("Coupon status updated");
    } catch (error) {
      toast.error("Failed to update coupon status");
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setIsEditDialogOpen(true);
  };

  const updateCoupon = async () => {
    if (!editingCoupon) return;

    try {
      const response = await fetch(`http://localhost:5000/api/admin/coupons/${editingCoupon._id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          code: editingCoupon.code,
          type: editingCoupon.type,
          value: editingCoupon.value,
          maxUses: editingCoupon.maxUses === -1 ? null : editingCoupon.maxUses,
          expiryDate: editingCoupon.expiryDate,
          newUsersOnly: editingCoupon.newUsersOnly
        })
      });

      if (!response.ok) throw new Error('Failed to update coupon');
      
      const updatedCoupon = await response.json();
      setCoupons(coupons.map(c => 
        c._id === updatedCoupon._id ? updatedCoupon : c
      ));
      setIsEditDialogOpen(false);
      toast.success("Coupon updated successfully");
    } catch (error) {
      toast.error("Failed to update coupon");
    }
  };

  const sortData = (data: Coupon[]): Coupon[] => {
    return [...data].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortColumn) {
        case 'value':
        case 'maxUses':
        case 'usedCount':
          // Numeric sorting
          aValue = Number(a[sortColumn]);
          bValue = Number(b[sortColumn]);
          break;
        case 'expiryDate':
          // Handle null dates
          aValue = a.expiryDate ? new Date(a.expiryDate).getTime() : Infinity;
          bValue = b.expiryDate ? new Date(b.expiryDate).getTime() : Infinity;
          break;
        default:
          // String sorting
          aValue = String(a[sortColumn]).toLowerCase();
          bValue = String(b[sortColumn]).toLowerCase();
      }

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

  const filterCoupons = (coupons: Coupon[]) => {
    if (!searchQuery) return coupons;
    
    const query = searchQuery.toLowerCase();
    return coupons.filter(coupon => 
      coupon.code.toLowerCase().includes(query) ||
      coupon.type.toLowerCase().includes(query) ||
      (coupon.isActive ? 'active' : 'inactive').includes(query)
    );
  };

  const paginatedCoupons = () => {
    const filteredData = filterCoupons(coupons);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(coupons.length / itemsPerPage);

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

    for (const couponId of selectedCoupons) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/coupons/${couponId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete coupon');
        
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setCoupons(coupons.filter(coupon => !selectedCoupons.includes(coupon._id)));
      toast.success(`Successfully deleted ${successCount} coupons`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} coupons`);
    }
    setSelectedCoupons([]);
    setShowDeleteDialog(false);
  };

  const toggleCoupon = (couponId: string) => {
    setSelectedCoupons(current =>
      current.includes(couponId)
        ? current.filter(id => id !== couponId)
        : [...current, couponId]
    );
  };

  const toggleAll = () => {
    const pageCouponIds = paginatedCoupons().map(coupon => coupon._id);
    setSelectedCoupons(current =>
      current.length === pageCouponIds.length ? [] : pageCouponIds
    );
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center gap-4">
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-foreground mb-4">Coupons</h2>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search coupons..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="mt-8">
              <Plus className="h-4 w-4 mr-2" />
              Create Coupon
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Coupon</DialogTitle>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-4 text-foreground hover:text-foreground/80"
                onClick={() => setIsDialogOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code" className="text-foreground">Coupon Code</Label>
                <Input
                  id="code"
                  value={newCoupon.code}
                  onChange={(e) => setNewCoupon({...newCoupon, code: e.target.value})}
                  placeholder="WELCOME50"
                  className="bg-background text-foreground border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="type" className="text-foreground">Discount Type</Label>
                <Select
                  value={newCoupon.type}
                  onValueChange={(value) => setNewCoupon({...newCoupon, type: value as 'fixed' | 'product'})}
                >
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="fixed" className="text-foreground hover:bg-accent">Fixed Amount</SelectItem>
                    <SelectItem value="product" className="text-foreground hover:bg-accent">Free Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="value" className="text-foreground">
                  {newCoupon.type === 'fixed' ? 'Discount Amount (₱)' : 'Number of Free Items'}
                </Label>
                <Input
                  id="value"
                  type="number"
                  value={newCoupon.value}
                  onChange={(e) => setNewCoupon({...newCoupon, value: Number(e.target.value)})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxUses" className="text-foreground">Maximum Uses (-1 for unlimited)</Label>
                <Input
                  id="maxUses"
                  type="number"
                  value={newCoupon.maxUses}
                  onChange={(e) => setNewCoupon({...newCoupon, maxUses: Number(e.target.value)})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="expiryDate" className="text-foreground">Expiry Date (optional)</Label>
                <Input
                  id="expiryDate"
                  type="datetime-local"
                  value={newCoupon.expiryDate}
                  onChange={(e) => setNewCoupon({...newCoupon, expiryDate: e.target.value})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="newUsersOnly"
                  checked={newCoupon.newUsersOnly}
                  onCheckedChange={(checked) => setNewCoupon({...newCoupon, newUsersOnly: checked})}
                />
                <Label htmlFor="newUsersOnly" className="text-foreground">New Users Only</Label>
              </div>

              <Button onClick={createCoupon} className="w-full">
                Create Coupon
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="bg-background border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Edit Coupon</DialogTitle>
            <Button
              variant="ghost"
              size="icon"
              className="absolute right-4 top-4 text-foreground hover:text-foreground/80"
              onClick={() => setIsEditDialogOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>
          {editingCoupon && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code" className="text-foreground">Coupon Code</Label>
                <Input
                  id="edit-code"
                  value={editingCoupon.code}
                  onChange={(e) => setEditingCoupon({...editingCoupon, code: e.target.value})}
                  className="bg-background text-foreground border-border"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="edit-type" className="text-foreground">Discount Type</Label>
                <Select
                  value={editingCoupon.type}
                  onValueChange={(value) => setEditingCoupon({...editingCoupon, type: value as 'fixed' | 'product'})}
                >
                  <SelectTrigger className="bg-background text-foreground border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-background border-border">
                    <SelectItem value="fixed" className="text-foreground hover:bg-accent">Fixed Amount</SelectItem>
                    <SelectItem value="product" className="text-foreground hover:bg-accent">Free Product</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-value" className="text-foreground">
                  {editingCoupon.type === 'fixed' ? 'Discount Amount (₱)' : 'Number of Free Items'}
                </Label>
                <Input
                  id="edit-value"
                  type="number"
                  value={editingCoupon.value}
                  onChange={(e) => setEditingCoupon({...editingCoupon, value: Number(e.target.value)})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-maxUses" className="text-foreground">Maximum Uses (-1 for unlimited)</Label>
                <Input
                  id="edit-maxUses"
                  type="number"
                  value={editingCoupon.maxUses}
                  onChange={(e) => setEditingCoupon({...editingCoupon, maxUses: Number(e.target.value)})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-expiryDate" className="text-foreground">Expiry Date (optional)</Label>
                <Input
                  id="edit-expiryDate"
                  type="datetime-local"
                  value={editingCoupon.expiryDate || ''}
                  onChange={(e) => setEditingCoupon({...editingCoupon, expiryDate: e.target.value})}
                  className="bg-background text-foreground border-border"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="edit-newUsersOnly"
                  checked={editingCoupon.newUsersOnly}
                  onCheckedChange={(checked) => setEditingCoupon({...editingCoupon, newUsersOnly: checked})}
                />
                <Label htmlFor="edit-newUsersOnly" className="text-foreground">New Users Only</Label>
              </div>

              <Button onClick={updateCoupon} className="w-full">
                Update Coupon
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {selectedCoupons.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-foreground">
            {selectedCoupons.length} coupons selected
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
              This will permanently delete {selectedCoupons.length} selected coupons and remove their data from the system.
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

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="w-[50px]">
                <Checkbox
                  checked={
                    paginatedCoupons().length > 0 &&
                    paginatedCoupons().every(coupon => selectedCoupons.includes(coupon._id))
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('code')}
              >
                Code <SortIcon column="code" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('type')}
              >
                Type <SortIcon column="type" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('value')}
              >
                Value <SortIcon column="value" />
              </TableHead>
              <TableHead className="text-foreground">
                New Users
              </TableHead>
              <TableHead
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('maxUses')}
              >
                Usage <SortIcon column="maxUses" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('expiryDate')}
              >
                Expiry <SortIcon column="expiryDate" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('isActive')}
              >
                Status <SortIcon column="isActive" />
              </TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedCoupons().map((coupon) => (
              <TableRow 
                key={coupon._id} 
                className="border-border"
                data-selected={selectedCoupons.includes(coupon._id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedCoupons.includes(coupon._id)}
                    onCheckedChange={() => toggleCoupon(coupon._id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-foreground">{coupon.code}</TableCell>
                <TableCell className="text-foreground">
                  {coupon.type}
                </TableCell>
                <TableCell className="text-foreground capitalize">
                  {coupon.type === 'fixed' ? `₱${coupon.value} OFF` : `${coupon.value}x Free Item`}
                </TableCell>
                <TableCell className="text-foreground">
                  {coupon.newUsersOnly ? 'Yes' : 'No'}
                </TableCell>
                <TableCell className="text-foreground">
                  {coupon.maxUses === -1 ? 
                    `${coupon.usedCount} uses` : 
                    `${coupon.usedCount}/${coupon.maxUses} uses`
                  }
                </TableCell>
                <TableCell className="text-foreground">
                  {coupon.expiryDate ? 
                    new Date(coupon.expiryDate).toLocaleDateString() : 
                    'No expiry'
                  }
                </TableCell>
                <TableCell>
                  <Switch
                    checked={coupon.isActive}
                    onCheckedChange={(checked) => toggleCouponStatus(coupon._id, checked)}
                  />
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEdit(coupon)}
                      className="text-foreground hover:text-foreground/80"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </div>
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
