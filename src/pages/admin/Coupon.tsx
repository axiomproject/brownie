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
import { Loader2, Plus, Pencil, X } from "lucide-react";
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

  useEffect(() => {
    fetchCoupons();
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
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-foreground">Coupons</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
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

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-foreground">Code</TableHead>
              <TableHead className="text-foreground">Type</TableHead>
              <TableHead className="text-foreground">Value</TableHead>
              <TableHead className="text-foreground">New Users</TableHead>
              <TableHead className="text-foreground">Usage</TableHead>
              <TableHead className="text-foreground">Expiry</TableHead>
              <TableHead className="text-foreground">Status</TableHead>
              <TableHead className="text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.map((coupon) => (
              <TableRow key={coupon._id} className="border-border">
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
    </div>
  );
}
