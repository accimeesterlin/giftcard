"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
import { UserCircle, Search, Loader2, ShoppingBag, DollarSign, Plus, Edit, Trash2 } from "lucide-react";
import { format } from "date-fns";
import { CustomerFormDialog } from "@/components/customer-form-dialog";
import { CustomerDetailSidebar } from "@/components/customer-detail-sidebar";

interface Customer {
  id: string;
  email: string;
  name: string | null;
  phone: string | null;
  totalPurchases: number;
  totalSpent: number;
  lastPurchaseAt: Date | null;
  createdAt: Date;
}

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

export default function CustomersPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;

  const [company, setCompany] = useState<Company | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [companySlug]);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get customers
          const customersResponse = await fetch(
            `/api/v1/companies/${foundCompany.id}/customers`
          );
          if (customersResponse.ok) {
            const customersData = await customersResponse.json();
            setCustomers(customersData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch customers:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCustomerSuccess = () => {
    fetchCustomers();
    setEditingCustomer(null);
  };

  const handleEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer);
    setIsSidebarOpen(false);
    setIsDialogOpen(true);
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeletingCustomer(customer);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingCustomer || !company) return;

    setIsDeleting(true);
    try {
      const response = await fetch(
        `/api/v1/companies/${company.id}/customers/${deletingCustomer.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to delete customer");
      }

      fetchCustomers();
      setDeletingCustomer(null);
    } catch (error) {
      console.error("Failed to delete customer:", error);
      alert(error instanceof Error ? error.message : "Failed to delete customer");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteCustomer = () => {
    fetchCustomers();
  };

  const filteredCustomers = customers.filter((customer) => {
    const query = searchQuery.toLowerCase();
    return (
      customer.email.toLowerCase().includes(query) ||
      customer.name?.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
          <p className="text-muted-foreground">
            Manage and track your customer relationships
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Customer
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <UserCircle className="h-4 w-4" />
              Total Customers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <ShoppingBag className="h-4 w-4" />
              Total Purchases
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {customers.reduce((sum, c) => sum + c.totalPurchases, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Total Revenue
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${customers.reduce((sum, c) => sum + c.totalSpent, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Customers Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Customer List</CardTitle>
              <CardDescription>View and manage all your customers</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search customers..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <UserCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium mb-1">No customers yet</p>
              <p className="text-sm">Customers will appear here once they make a purchase</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Customer</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Purchases</TableHead>
                  <TableHead>Total Spent</TableHead>
                  <TableHead>Last Purchase</TableHead>
                  <TableHead>Member Since</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCustomers.map((customer) => (
                  <TableRow
                    key={customer.id}
                    className="cursor-pointer hover:bg-muted/50 group"
                    onClick={() => {
                      setSelectedCustomer(customer);
                      setIsSidebarOpen(true);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-8 w-8 text-muted-foreground" />
                        <span className="font-medium">
                          {customer.name || "Anonymous"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{customer.totalPurchases}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      ${customer.totalSpent.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {customer.lastPurchaseAt
                        ? format(new Date(customer.lastPurchaseAt), "MMM d, yyyy")
                        : "Never"}
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(customer.createdAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditCustomer(customer);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(customer);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Customer Form Dialog */}
      {company && (
        <CustomerFormDialog
          open={isDialogOpen}
          onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) {
              setEditingCustomer(null);
            }
          }}
          companyId={company.id}
          onSuccess={handleCustomerSuccess}
          customer={editingCustomer}
        />
      )}

      {/* Customer Detail Sidebar */}
      {company && (
        <CustomerDetailSidebar
          open={isSidebarOpen}
          onOpenChange={setIsSidebarOpen}
          customer={selectedCustomer}
          companyId={company.id}
          onEdit={handleEditCustomer}
          onDelete={handleDeleteCustomer}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={(open) => !open && setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Customer</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingCustomer?.name || deletingCustomer?.email}? This
              action cannot be undone. The customer's order history will be preserved,
              but the customer record will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
