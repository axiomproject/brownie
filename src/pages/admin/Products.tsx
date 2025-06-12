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
import { MoreHorizontal, Loader2, Plus } from "lucide-react";
import { toast } from 'sonner';
import { Checkbox } from "@/components/ui/checkbox";

interface Variant {
  name: string;
  price: number;
  inStock: boolean;
  stockQuantity: number; // Add this line
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

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState<ProductFormData>(initialFormData);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      console.log('Fetching products...');
      const response = await fetch('http://localhost:5000/api/admin/products', {
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
        ? `http://localhost:5000/api/admin/products/${editingId}`
        : 'http://localhost:5000/api/admin/products';

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
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const response = await fetch(`http://localhost:5000/api/admin/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to delete product');
      
      setProducts(products.filter(product => product._id !== productId));
      toast.success("Product deleted successfully");
    } catch (error) {
      toast.error("Failed to delete product");
    }
  };

  useEffect(() => {
    fetchProducts();
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
        <h2 className="text-xl font-semibold text-foreground">Products List</h2>
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
                    <Input
                      placeholder="Name"
                      value={variant.name}
                      onChange={e => {
                        const newVariants = [...formData.variants];
                        newVariants[index].name = e.target.value;
                        setFormData({...formData, variants: newVariants});
                      }}
                       className="bg-background text-foreground"
                    />
                    <Input
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
                    <Input
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
                    <div className="flex items-center space-x-2">
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

      <div className="rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead>Image</TableHead>
              <TableHead className="text-foreground">Name</TableHead>
              <TableHead className="text-foreground">Category</TableHead>
              <TableHead className="text-foreground">Variants</TableHead>
              <TableHead className="text-foreground">Popular</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {products.map((product) => (
              <TableRow key={product._id} className="border-border">
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
    </div>
  );
}
