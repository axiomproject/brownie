import { useState, useEffect } from 'react';
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
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, Eye, Trash, Search, ChevronUp, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { API_URL } from '@/config';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Contact {
  _id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
}

type SortColumn = 'name' | 'email' | 'subject' | 'createdAt';
type SortDirection = 'asc' | 'desc';

export default function Contacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [sortColumn, setSortColumn] = useState<SortColumn>('createdAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSingleDeleteDialog, setShowSingleDeleteDialog] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<string | null>(null);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchContacts();
  }, []);

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/contacts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch contacts');
      const data = await response.json();
      setContacts(data);
    } catch (error) {
      toast.error('Failed to load contacts');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setContactToDelete(id);
    setShowSingleDeleteDialog(true);
  };

  const executeSingleDelete = async () => {
    if (!contactToDelete) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/contacts/${contactToDelete}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) throw new Error('Failed to delete contact');
      
      setContacts(contacts.filter(contact => contact._id !== contactToDelete));
      toast.success('Message deleted successfully');
    } catch (error) {
      toast.error('Failed to delete message');
    } finally {
      setShowSingleDeleteDialog(false);
      setContactToDelete(null);
    }
  };

  const confirmBulkDelete = () => {
    setShowDeleteDialog(true);
  };

  const executeBulkDelete = async () => {
    let successCount = 0;
    let failCount = 0;

    for (const contactId of selectedContacts) {
      try {
        const response = await fetch(`${API_URL}/api/admin/contacts/${contactId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        
        if (!response.ok) throw new Error('Failed to delete contact');
        successCount++;
      } catch (error) {
        failCount++;
      }
    }

    if (successCount > 0) {
      setContacts(contacts.filter(contact => !selectedContacts.includes(contact._id)));
      toast.success(`Successfully deleted ${successCount} messages`);
    }
    if (failCount > 0) {
      toast.error(`Failed to delete ${failCount} messages`);
    }
    setSelectedContacts([]);
    setShowDeleteDialog(false);
  };

  const sortData = (data: Contact[]): Contact[] => {
    return [...data].sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;
      
      if (sortColumn === 'createdAt') {
        aValue = new Date(a.createdAt).getTime();
        bValue = new Date(b.createdAt).getTime();
      } else {
        aValue = a[sortColumn].toString().toLowerCase();
        bValue = b[sortColumn].toString().toLowerCase();
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

  const filterContacts = (contacts: Contact[]) => {
    if (!searchQuery) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(query) ||
      contact.email.toLowerCase().includes(query) ||
      contact.subject.toLowerCase().includes(query)
    );
  };

  const paginatedContacts = () => {
    const filteredData = filterContacts(contacts);
    const sortedData = sortData(filteredData);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return sortedData.slice(startIndex, endIndex);
  };

  const totalPages = Math.ceil(filterContacts(contacts).length / itemsPerPage);

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

  const toggleContact = (contactId: string) => {
    setSelectedContacts(current =>
      current.includes(contactId)
        ? current.filter(id => id !== contactId)
        : [...current, contactId]
    );
  };

  const toggleAll = () => {
    const pageContactIds = paginatedContacts().map(contact => contact._id);
    setSelectedContacts(current =>
      current.length === pageContactIds.length ? [] : pageContactIds
    );
  };

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <Card>
          <CardHeader className="flex flex-col space-y-4 p-4 sm:p-6">
            <div className="space-y-2">
              <CardTitle className="text-xl sm:text-2xl font-bold tracking-tight">Messages</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage contact form submissions
              </p>
            </div>
            <div className="w-full">
              <div className="relative w-full">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search messages..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 w-full"
                />
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            {selectedContacts.length > 0 && (
              <div className="flex items-center justify-between bg-muted px-2 sm:px-4 py-2 border-y border-border">
                <span className="text-xs sm:text-sm text-muted-foreground">
                  {selectedContacts.length} selected
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
                  <TableRow>
                    <TableHead className="w-[40px] sm:w-[50px]">
                      <Checkbox
                        checked={paginatedContacts().length > 0 && 
                          paginatedContacts().every(contact => 
                            selectedContacts.includes(contact._id)
                          )}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer hover:bg-muted min-w-[120px]"
                      onClick={() => handleSort('name')}
                    >
                      Name <SortIcon column="name" />
                    </TableHead>
                    <TableHead 
                      className="hidden md:table-cell cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('email')}
                    >
                      Email <SortIcon column="email" />
                    </TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:bg-muted"
                      onClick={() => handleSort('subject')}
                    >
                      Subject <SortIcon column="subject" />
                    </TableHead>
                    <TableHead 
                      className="hidden sm:table-cell cursor-pointer hover:bg-muted whitespace-nowrap"
                      onClick={() => handleSort('createdAt')}
                    >
                      Date <SortIcon column="createdAt" />
                    </TableHead>
                    <TableHead className="w-[68px] sm:w-[80px] text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedContacts().map((contact) => (
                    <TableRow key={contact._id}>
                      <TableCell className="p-2 sm:py-2">
                        <Checkbox
                          checked={selectedContacts.includes(contact._id)}
                          onCheckedChange={() => toggleContact(contact._id)}
                        />
                      </TableCell>
                      <TableCell className="p-2 sm:py-2 min-w-[120px]">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-medium truncate">{contact.name}</span>
                          <span className="text-xs text-muted-foreground md:hidden truncate">
                            {contact.email}
                          </span>
                          <span className="text-xs text-muted-foreground sm:hidden">
                            {formatDate(contact.createdAt)}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell p-2 sm:py-2">
                        <span className="truncate block">{contact.email}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2 sm:py-2">
                        <span className="truncate block max-w-[180px]">{contact.subject}</span>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell p-2 sm:py-2 whitespace-nowrap">
                        {formatDate(contact.createdAt)}
                      </TableCell>
                      <TableCell className="p-2 sm:py-2 text-right">
                        <div className="flex justify-end gap-1 sm:gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedContact(contact)}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(contact._id)}
                            className="h-7 w-7 sm:h-8 sm:w-8"
                          >
                            <Trash className="h-3 w-3 sm:h-4 sm:w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
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

      <Dialog open={!!selectedContact} onOpenChange={() => setSelectedContact(null)}>
        <DialogContent className="sm:max-w-[425px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">Message Details</DialogTitle>
          </DialogHeader>
          {selectedContact && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="font-semibold text-foreground">Name:</label>
                  <p className="text-foreground break-words">{selectedContact.name}</p>
                </div>
                <div>
                  <label className="font-semibold text-foreground">Email:</label>
                  <p className="text-foreground break-words">{selectedContact.email}</p>
                </div>
              </div>
              <div>
                <label className="font-semibold text-foreground">Subject:</label>
                <p className="text-foreground break-words">{selectedContact.subject}</p>
              </div>
              <div>
                <label className="font-semibold text-foreground">Message:</label>
                <p className="whitespace-pre-wrap text-foreground break-words">{selectedContact.message}</p>
              </div>
              <div>
                <label className="font-semibold text-foreground">Date:</label>
                <p className="text-foreground">{formatDate(selectedContact.createdAt)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete {selectedContacts.length} selected messages.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showSingleDeleteDialog} onOpenChange={setShowSingleDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground">
              This will permanently delete this message.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-foreground">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={executeSingleDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
