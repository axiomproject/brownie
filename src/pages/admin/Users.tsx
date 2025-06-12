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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Loader2, Plus, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface User {
  _id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
}

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: 'admin' | 'customer';
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'customer'
};

type SortColumn = 'name' | 'email' | 'role' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Users() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/users', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch users');
      }

      const data = await response.json();
      console.log('Fetched users:', data); // Debug log
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error(error instanceof Error ? error.message : "Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ role: newRole })
      });
      
      if (!response.ok) throw new Error('Failed to update role');
      
      setUsers(users.map(user => 
        user._id === userId ? { ...user, role: newRole } : user
      ));
      
      toast.success("User role updated successfully");
    } catch (error) {
        toast.error("Failed to update user role");
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete user');
      
      setUsers(users.filter(user => user._id !== userId));
      toast.success("User deleted successfully");
    } catch (error) {
        toast.error("Failed to delete user");
    }
  };

  const handleEdit = (user: User) => {
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Leave blank for editing
      role: user.role as UserFormData['role']
    });
    setEditingId(user._id);
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `http://localhost:5000/api/admin/users/${editingId}`
        : 'http://localhost:5000/api/admin/users';

      const method = editingId ? 'PATCH' : 'POST';
      
      const submitData = editingId && !formData.password 
        ? { name: formData.name, email: formData.email, role: formData.role }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(submitData)
      });

      if (!response.ok) throw new Error('Failed to save user');

      const savedUser = await response.json();
      
      if (editingId) {
        setUsers(users.map(u => u._id === editingId ? savedUser : u));
        toast.success("User updated successfully");
      } else {
        setUsers([...users, savedUser]);
        toast.success("User created successfully");
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      toast.error(editingId ? "Failed to update user" : "Failed to create user");
    }
  };

  const sortData = (data: User[]): User[] => {
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

  const paginatedUsers = () => {
    const sortedData = sortData(users);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(users.length / itemsPerPage);

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

    for (const userId of selectedUsers) {
      try {
        const response = await fetch(`http://localhost:5000/api/admin/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete user');
        
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setUsers(users.filter(user => !selectedUsers.includes(user._id)));
      toast.success(`Successfully deleted ${successCount} users`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} users`);
    }
    setSelectedUsers([]);
    setShowDeleteDialog(false);
  };

  const toggleUser = (userId: string) => {
    setSelectedUsers(current =>
      current.includes(userId)
        ? current.filter(id => id !== userId)
        : [...current, userId]
    );
  };

  const toggleAll = () => {
    const pageUserIds = paginatedUsers().map(user => user._id);
    setSelectedUsers(current =>
      current.length === pageUserIds.length ? [] : pageUserIds
    );
  };

  useEffect(() => {
    fetchUsers();
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
        <h2 className="text-xl font-semibold text-foreground">Users List</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setFormData(initialFormData); setEditingId(null); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">
                {editingId ? 'Edit User' : 'Add New User'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-foreground">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                  className="bg-background text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-foreground">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({...formData, email: e.target.value})}
                  className="bg-background text-foreground"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-foreground">
                  Password {editingId && '(Leave blank to keep current)'}
                </Label>
                <Input
                  id="password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  className="bg-background text-foreground"
                  required={!editingId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role" className="text-foreground">Role</Label>
                <select
                  id="role"
                  className="w-full p-2 border rounded bg-background text-foreground"
                  value={formData.role}
                  onChange={e => setFormData({...formData, role: e.target.value as UserFormData['role']})}
                  required
                >
                  <option value="customer">Customer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Update User' : 'Create User'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedUsers.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-foreground">
            {selectedUsers.length} users selected
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

      {/* Add AlertDialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedUsers.length} selected users and remove their data from the system.
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
                    paginatedUsers().length > 0 &&
                    paginatedUsers().every(user => selectedUsers.includes(user._id))
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('name')}
              >
                Name <SortIcon column="name" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('email')}
              >
                Email <SortIcon column="email" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('role')}
              >
                Role <SortIcon column="role" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('createdAt')}
              >
                Joined <SortIcon column="createdAt" />
              </TableHead>
              <TableHead className="text-right text-foreground">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedUsers().map((user) => (
              <TableRow 
                key={user._id} 
                className="border-border"
                data-selected={selectedUsers.includes(user._id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedUsers.includes(user._id)}
                    onCheckedChange={() => toggleUser(user._id)}
                  />
                </TableCell>
                <TableCell className="text-foreground">{user.name}</TableCell>
                <TableCell className="text-foreground">{user.email}</TableCell>
                <TableCell className="capitalize text-foreground">{user.role}</TableCell>
                <TableCell className="text-foreground">{new Date(user.createdAt).toLocaleDateString()}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(user)}>
                        <span className="text-foreground">Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleRoleChange(user._id, user.role === 'admin' ? 'customer' : 'admin')}>
                        <span className="text-foreground">Make {user.role === 'admin' ? 'Customer' : 'Admin'}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteUser(user._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete User
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Add pagination UI after the table */}
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
