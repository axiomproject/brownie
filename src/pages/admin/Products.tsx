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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MoreHorizontal, Loader2, Plus, ChevronUp, ChevronDown, Search } from "lucide-react";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";
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
import { API_URL } from '@/config';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

interface Variant {
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity: number;
}

interface Product {
  _id: string;
  name: string;
  description: string;
  image: string;
  category: string;
  variants: Variant[];
  isPopular: boolean;
  createdAt: string;
}

interface ProductFormData {
  name: string;
  description: string;
  image: string;
  category: 'classic' | 'nuts' | 'chocolate' | 'special';
  variants: Variant[];
  isPopular: boolean;
}

const initialFormData: ProductFormData = {
  name: '',
  description: '',
  image: '',
  category: 'classic',
  variants: [{ name: 'Regular', price: 0, inStock: true, stockQuantity: 0 }], // Add stockQuantity
  isPopular: false,
};

// Add sort types
type SortColumn = 'name' | 'category' | 'isPopular' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch(`${API_URL}/api/admin/products`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch products');
      }

      const data = await response.json();
      console.log('Fetched products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `${API_URL}/api/admin/products/${editingId}`
        : `${API_URL}/api/admin/products`;

      const method = editingId ? 'PATCH' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) throw new Error('Failed to save product');

      const savedProduct = await response.json();
      
      if (editingId) {
        setProducts(products.map(p => p._id === editingId ? savedProduct : p));
        toast.success("Product updated successfully");
      } else {
        setProducts([...products, savedProduct]);
        toast.success("Product created successfully");
      }

      setIsDialogOpen(false);
      setFormData(initialFormData);
      setEditingId(null);
    } catch (error) {
      toast.error(editingId ? "Failed to update product" : "Failed to create product");
    }
  };

  const handleEdit = (product: Product) => {
    setFormData({
      name: product.name,
      description: product.description,
      image: product.image,
      category: product.category as ProductFormData['category'],
      variants: product.variants,
      isPopular: product.isPopular,
    });
    setEditingId(product._id);
    setIsDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    setProductToDelete(productId);
    setShowSingleDeleteDialog(true);
  };
  
  const executeSingleDelete = async () => {
    if (!productToDelete) return;
    
    try {
      const response = await fetch(`${API_URL}/api/admin/products/${productToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      
      setProducts(products.filter(product => product._id !== productToDelete));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    } finally {
      setShowSingleDeleteDialog(false);
      setProductToDelete(null);
    }
  };

  const sortData = (data: Product[]): Product[] => {
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

  const filterProducts = (products: Product[]) => {
    if (!searchQuery) return products;
    
    const query = searchQuery.toLowerCase();
    return products.filter(product => 
      product.name.toLowerCase().includes(query) ||
      product.category.toLowerCase().includes(query) ||
      product.variants.some(v => v.name.toLowerCase().includes(query))
    );
  };

  const paginatedProducts = () => {
    const filteredData = filterProducts(products);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(products.length / itemsPerPage);

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


  const toggleProduct = (productId: string) => {
    setSelectedProducts(current =>
      current.includes(productId)
        ? current.filter(id => id !== productId)
        : [...current, productId]
    );
  };

  const toggleAll = () => {
    const pageProductIds = paginatedProducts().map(product => product._id);
    setSelectedProducts(current =>
      current.length === pageProductIds.length ? [] : pageProductIds
    );
  };

  useEffect(() => {
    fetchProducts();
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
          <h2 className="text-xl font-semibold text-foreground mb-4">Products List</h2>
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => {
              setFormData(initialFormData);
              setEditingId(null);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-background">
            <DialogHeader>
              <DialogTitle className="text-foreground">{editingId ? 'Edit Product' : 'Add New Product'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="bg-background text-foreground">Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={e => setFormData({...formData, name: e.target.value})}
                   className="bg-background text-foreground"
                       placeholder="Enter product name here..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="bg-background text-foreground">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="bg-background text-foreground"
                  placeholder="Enter product description here..."
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category" className="bg-background text-foreground">Category</Label>
                <select
                  id="category"
                  className="w-full p-2 border rounded bg-background text-foreground"
                  value={formData.category}
                  onChange={e => setFormData({...formData, category: e.target.value as ProductFormData['category']})}
                  required
                >
                  <option value="classic">Classic</option>
                  <option value="nuts">Nuts</option>
                  <option value="chocolate">Chocolate</option>
                  <option value="special">Special</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label className="bg-background text-foreground">Variants</Label>
                {formData.variants.map((variant, index) => (
                  <div key={index} className="grid grid-cols-4 gap-2 items-center"> {/* Change to grid-cols-4 */}
                    <div>
                      <Label htmlFor={`variant-name-${index}`} className="text-xs text-muted-foreground">Name</Label>
                      <Input
                        id={`variant-name-${index}`}
                        placeholder="Name"
                        value={variant.name}
                        onChange={e => {
                          const newVariants = [...formData.variants];
                          newVariants[index].name = e.target.value;
                          setFormData({...formData, variants: newVariants});
                        }}
                        className="bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-price-${index}`} className="text-xs text-muted-foreground">Price</Label>
                      <Input
                        id={`variant-price-${index}`}
                        type="number"
                        placeholder="Price"
                        value={variant.price}
                        onChange={e => {
                          const newVariants = [...formData.variants];
                          newVariants[index].price = Number(e.target.value);
                          setFormData({...formData, variants: newVariants});
                        }}
                        className="bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label htmlFor={`variant-stock-${index}`} className="text-xs text-muted-foreground">Stock</Label>
                      <Input
                        id={`variant-stock-${index}`}
                        type="number"
                        placeholder="Stock"
                        value={variant.stockQuantity}
                        onChange={e => {
                          const newVariants = [...formData.variants];
                          newVariants[index].stockQuantity = Number(e.target.value);
                          newVariants[index].inStock = Number(e.target.value) > 0;
                          setFormData({...formData, variants: newVariants});
                        }}
                        className="bg-background text-foreground"
                      />
                    </div>
                    <div>
                      <Label className="text-xs text-muted-foreground">Status</Label>
                      <div className="flex items-center space-x-2 mt-2">
                        <Checkbox 
                          id={`inStock-${index}`}
                          checked={variant.inStock}
                          onCheckedChange={(checked) => {
                            const newVariants = [...formData.variants];
                            newVariants[index].inStock = checked as boolean;
                            setFormData({...formData, variants: newVariants});
                          }}
                        />
                        <Label htmlFor={`inStock-${index}`} className="text-sm text-muted-foreground">
                          In Stock
                        </Label>
                      </div>
                    </div>
                  </div>
                ))}
                <Button 
                  type="button"
                  variant="outline"
                  onClick={() => setFormData({
                    ...formData,
                    variants: [...formData.variants, { name: '', price: 0, inStock: true, stockQuantity: 0 }] // Add stockQuantity
                  })}
                   className="bg-background text-foreground"
                >
                  Add Variant
                </Button>
              </div>
              <div className="space-y-2">
                <Label htmlFor="image" className="text-foreground">Image URL</Label>
                <Input
                  id="image"
                  value={formData.image}
                  onChange={e => setFormData({...formData, image: e.target.value})}
                   className="bg-background text-foreground"
                       placeholder="Enter image url here..."
                  required
                />
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="isPopular"
                  checked={formData.isPopular}
                  onCheckedChange={(checked) => 
                    setFormData({...formData, isPopular: checked as boolean})
                  }
                />
                <Label htmlFor="isPopular" className="text-muted-foreground">
                  Popular Item
                </Label>
              </div>
              <Button type="submit" className="w-full">
                {editingId ? 'Update Product' : 'Create Product'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {selectedProducts.length > 0 && (
        <div className="flex items-center justify-between bg-muted p-2 rounded-md">
          <span className="text-sm text-foreground">
            {selectedProducts.length} products selected
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

<AlertDialog open={showSingleDeleteDialog} onOpenChange={setShowSingleDeleteDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
      <AlertDialogDescription className="text-muted-foreground">
        This will permanently delete this product and remove its data from the system.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
      <AlertDialogAction onClick={executeSingleDelete}>
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
                    paginatedProducts().length > 0 &&
                    paginatedProducts().every(product => selectedProducts.includes(product._id))
                  }
                  onCheckedChange={toggleAll}
                />
              </TableHead>
              <TableHead>Image</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('name')}
              >
                Name <SortIcon column="name" />
              </TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('category')}
              >
                Category <SortIcon column="category" />
              </TableHead>
              <TableHead className="text-foreground">Variants</TableHead>
              <TableHead 
                className="text-foreground cursor-pointer hover:bg-muted"
                onClick={() => handleSort('isPopular')}
              >
                Popular <SortIcon column="isPopular" />
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts().map((product) => (
              <TableRow 
                key={product._id} 
                className="border-border"
                data-selected={selectedProducts.includes(product._id)}
              >
                <TableCell>
                  <Checkbox
                    checked={selectedProducts.includes(product._id)}
                    onCheckedChange={() => toggleProduct(product._id)}
                  />
                </TableCell>
                <TableCell>
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                  />
                </TableCell>
                <TableCell className="text-foreground">{product.name}</TableCell>
                <TableCell className="capitalize text-foreground">{product.category}</TableCell>
                <TableCell>
                  {product.variants.map(v => (
                    <div key={v.name} className="text-sm text-muted-foreground">
                      {v.name}: ₱{v.price} ({v.stockQuantity} in stock - 
                      <span className={v.inStock ? 'text-green-500' : 'text-red-500'}>
                        {v.inStock ? 'In Stock' : 'Out of Stock'}
                      </span>
                      )
                    </div>
                  ))}
                </TableCell>
                <TableCell>
                  <span className={`px-2 py-1 rounded-full text-sm ${
                    product.isPopular 
                      ? 'bg-green-500/10 text-green-500 dark:bg-green-500/20 dark:text-green-400' 
                      : 'bg-gray-500/10 text-gray-500 dark:bg-gray-500/20 dark:text-gray-400'
                  }`}>
                    {product.isPopular ? 'Popular' : 'Regular'}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4 text-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEdit(product)}>
                        <span className="text-foreground">Edit</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDelete(product._id)}
                        className="text-destructive focus:text-destructive"
                      >
                        Delete
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
