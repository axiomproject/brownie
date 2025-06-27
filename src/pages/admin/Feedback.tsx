import React, { useEffect, useState } from "react";  // Fix React import
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination"
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Star, Search, ChevronUp, ChevronDown, Loader2 } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { API_URL } from '@/config';
import { Card, CardContent } from "@/components/ui/card";

interface ProductFeedback {
  productId: string;
  rating: number;
  comment: string;
  productName: string;
  variantName: string;
  isDisplayed?: boolean;
}

interface FeedbackEntry {
  _id: string;
  orderId: string;
  productFeedback: ProductFeedback[];
  createdAt: string;
  order: {
    user?: {
      name: string;
      email: string;
    };
    email?: string; 
  };
}

type SortColumn = 'createdAt' | 'productName' | 'rating' | 'isDisplayed';
type SortDirection = 'asc' | 'desc';

// Add type for pagination item
type PaginationItemType = React.ReactElement<{
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
}>;

export default function Feedback() {
  const [feedbacks, setFeedbacks] = useState<FeedbackEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedFeedbacks, setSelectedFeedbacks] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/feedbacks`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        }
      });
      if (!response.ok) throw new Error('Failed to fetch feedbacks');
      const data = await response.json();
      setFeedbacks(data);
    } catch (error) {
      toast.error('Failed to load feedbacks');
    } finally {
      setLoading(false);
    }
  };

  const toggleFeedbackDisplay = async (feedbackId: string, productId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/feedbacks/${feedbackId}/display`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ productId })
      });

      if (!response.ok) throw new Error('Failed to update feedback display status');
      
      // Update local state
      setFeedbacks(current =>
        current.map(feedback => {
          if (feedback._id === feedbackId) {
            return {
              ...feedback,
              productFeedback: feedback.productFeedback.map(pf =>
                pf.productId === productId
                  ? { ...pf, isDisplayed: !pf.isDisplayed }
                  : pf
              )
            };
          }
          return feedback;
        })
      );

      toast.success('Feedback display status updated');
    } catch (error) {
      toast.error('Failed to update feedback display status');
    }
  };

  const filterFeedbacks = (feedbacks: FeedbackEntry[]) => {
    if (!searchQuery) return feedbacks;
    
    const query = searchQuery.toLowerCase();
    return feedbacks.filter(feedback => 
      feedback.order.user?.name?.toLowerCase().includes(query) ||
      feedback.order.user?.email?.toLowerCase().includes(query) ||
      feedback.order.email?.toLowerCase().includes(query) ||
      feedback.productFeedback.some(pf => 
        pf.productName.toLowerCase().includes(query) ||
        pf.variantName.toLowerCase().includes(query)
      )
    );
  };

  const sortData = (data: FeedbackEntry[]): FeedbackEntry[] => {
    return [...data].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortColumn) {
        case 'createdAt':
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
          break;
        case 'rating':
          aValue = Math.max(...a.productFeedback.map(pf => pf.rating));
          bValue = Math.max(...b.productFeedback.map(pf => pf.rating));
          break;
        case 'isDisplayed':
          aValue = a.productFeedback.some(pf => pf.isDisplayed);
          bValue = b.productFeedback.some(pf => pf.isDisplayed);
          break;
        default:
          aValue = a.productFeedback[0]?.productName.toLowerCase();
          bValue = b.productFeedback[0]?.productName.toLowerCase();
      }
      
      return sortDirection === 'asc'
        ? aValue < bValue ? -1 : aValue > bValue ? 1 : 0
        : bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
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

  const paginatedFeedbacks = () => {
    const filteredData = filterFeedbacks(feedbacks);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filterFeedbacks(feedbacks).length / itemsPerPage);

  const renderPaginationItems = (): PaginationItemType[] => {
    const items: PaginationItemType[] = [];
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

    for (const feedbackId of selectedFeedbacks) {
      try {
        const response = await fetch(`${API_URL}/api/admin/feedbacks/${feedbackId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete feedback');
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setFeedbacks(feedbacks.filter(feedback => !selectedFeedbacks.includes(feedback._id)));
      toast.success(`Successfully deleted ${successCount} feedbacks`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} feedbacks`);
    }
    setSelectedFeedbacks([]);
    setShowDeleteDialog(false);
  };

  const toggleFeedback = (feedbackId: string) => {
    setSelectedFeedbacks(current =>
      current.includes(feedbackId)
        ? current.filter(id => id !== feedbackId)
        : [...current, feedbackId]
    );
  };

  const toggleAll = () => {
    const pageFeedbackIds = paginatedFeedbacks().map(feedback => feedback._id);
    setSelectedFeedbacks(current =>
      current.length === pageFeedbackIds.length ? [] : pageFeedbackIds
    );
  };

  const StarRating = ({ rating }: { rating: number }) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`w-4 h-4 ${
            star <= rating
              ? 'fill-yellow-400 text-yellow-400'
              : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search feedbacks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full bg-background text-foreground placeholder:text-muted-foreground border-border"
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Card>
          <CardContent className="p-0">
            {selectedFeedbacks.length > 0 && (
              <div className="flex items-center justify-between bg-muted px-2 sm:px-4 py-2 border-y border-border">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedFeedbacks.length} selected
                </span>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={confirmBulkDelete}
                  className="text-xs sm:text-sm px-2 sm:px-4"
                >
                  Delete Selected
                </Button>
              </div>
            )}

            <div className="border-0 overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead className="w-[40px] sm:w-[50px]">
                      <Checkbox
                        checked={
                          paginatedFeedbacks().length > 0 &&
                          paginatedFeedbacks().every(feedback => selectedFeedbacks.includes(feedback._id))
                        }
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted min-w-[120px] lg:min-w-[150px]"
                      onClick={() => handleSort('productName')}
                    >
                      Product <SortIcon column="productName" />
                    </TableHead>
                    <TableHead 
                      className="hidden lg:table-cell cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date <SortIcon column="createdAt" />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Customer</TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted w-[100px]"
                      onClick={() => handleSort('rating')}
                    >
                      Rating <SortIcon column="rating" />
                    </TableHead>
                    <TableHead className="hidden md:table-cell">Comment</TableHead>
                    <TableHead className="w-[80px] text-center">Display</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedFeedbacks().map((feedback) => (
                    feedback.productFeedback.map((product) => (
                      <TableRow key={`${feedback._id}-${product.productId}`}>
                        <TableCell className="p-2 sm:py-2">
                          <Checkbox
                            checked={selectedFeedbacks.includes(feedback._id)}
                            onCheckedChange={() => toggleFeedback(feedback._id)}
                          />
                        </TableCell>
                        <TableCell className="p-2 sm:py-2 min-w-[120px] lg:min-w-[150px]">
                          <div className="flex flex-col gap-0.5">
                            <span className="font-medium truncate">{product.productName}</span>
                            <span className="text-xs text-muted-foreground truncate">
                              {product.variantName}
                            </span>
                            <span className="text-xs text-muted-foreground lg:hidden">
                              {new Date(feedback.createdAt).toLocaleDateString()}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden truncate">
                              {feedback.order?.user?.name || feedback.order?.email || 'Guest'}
                            </span>
                            <span className="text-xs text-muted-foreground md:hidden">
                              {product.comment}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell p-2 sm:py-2">
                          {new Date(feedback.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 sm:py-2">
                          <div className="truncate max-w-[200px]">
                            {feedback.order?.user?.name || 'Guest Order'}
                          </div>
                          <div className="text-xs text-muted-foreground truncate">
                            {feedback.order?.user?.email || feedback.order?.email || ''}
                          </div>
                        </TableCell>
                        <TableCell className="p-2 sm:py-2">
                          <StarRating rating={product.rating} />
                        </TableCell>
                        <TableCell className="hidden md:table-cell p-2 sm:py-2">
                          <span className="truncate block max-w-[300px]">{product.comment}</span>
                        </TableCell>
                        <TableCell className="p-2 sm:py-2 text-center">
                          <Switch
                            checked={product.isDisplayed}
                            onCheckedChange={() => toggleFeedbackDisplay(feedback._id, product.productId)}
                          />
                        </TableCell>
                      </TableRow>
                    ))
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="border-t border-border">
                <Pagination className="py-2 sm:py-4">
                  <PaginationContent className="flex justify-center gap-1 sm:gap-2">
                    <PaginationPrevious 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      className={`px-2 sm:px-4 ${currentPage === 1 ? 'pointer-events-none opacity-50' : ''}`}
                    />
                    {renderPaginationItems()}
                    <PaginationNext 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      className={`px-2 sm:px-4 ${currentPage === totalPages ? 'pointer-events-none opacity-50' : ''}`}
                    />
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedFeedbacks.length} selected feedback and remove their data from the system.
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
    </div>
  );
}
