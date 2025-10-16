"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Loader2, ShoppingCart, Package, DollarSign, TrendingUp, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface Company {
  id: string;
  slug: string;
  displayName: string;
}

interface Order {
  id: string;
  customerEmail: string;
  total: number;
  currency: string;
  paymentStatus: string;
  createdAt: string;
}

interface Listing {
  id: string;
  title: string;
  totalStock: number;
}

export default function DashboardOverview() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<Company | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [listings, setListings] = useState<Listing[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [companySlug]);

  const fetchData = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: Company) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get recent orders
          const ordersResponse = await fetch(`/api/v1/companies/${foundCompany.id}/orders`);
          if (ordersResponse.ok) {
            const ordersData = await ordersResponse.json();
            setOrders(ordersData.data.slice(0, 5)); // Only show 5 most recent
          }

          // Get listings
          const listingsResponse = await fetch(`/api/v1/companies/${foundCompany.id}/listings`);
          if (listingsResponse.ok) {
            const listingsData = await listingsResponse.json();
            setListings(listingsData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const totalRevenue = orders
    .filter((o) => o.paymentStatus === "completed")
    .reduce((sum, order) => sum + order.total, 0);

  const totalOrders = orders.length;
  const totalInventory = listings.reduce((sum, listing) => sum + listing.totalStock, 0);
  const lowStockCount = listings.filter((l) => l.totalStock > 0 && l.totalStock < 10).length;

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      pending: "outline",
      processing: "outline",
      completed: "default",
      failed: "destructive",
      refunded: "secondary",
      disputed: "destructive",
    };

    return (
      <Badge variant={variants[status] || "outline"}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Welcome back to {company.displayName}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              From {totalOrders} orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Lifetime orders
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Inventory</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalInventory}</div>
            <p className="text-xs text-muted-foreground">
              Available gift cards
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Products need restocking
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Orders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Your latest transactions</CardDescription>
              </div>
              <Link href={`/dashboard/${companySlug}/orders`}>
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <ShoppingCart className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-sm">No orders yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => (
                  <div key={order.id} className="flex items-center justify-between border-b pb-4 last:border-0">
                    <div className="flex-1">
                      <p className="text-sm font-medium">{order.customerEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(order.createdAt), "MMM d, yyyy 'at' h:mm a")}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium">
                        ${order.total.toFixed(2)}
                      </span>
                      {getStatusBadge(order.paymentStatus)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href={`/dashboard/${companySlug}/listings`}>
              <Button variant="outline" className="w-full justify-start">
                <Package className="mr-2 h-4 w-4" />
                Create New Listing
              </Button>
            </Link>
            <Link href={`/dashboard/${companySlug}/inventory`}>
              <Button variant="outline" className="w-full justify-start">
                <TrendingUp className="mr-2 h-4 w-4" />
                View Inventory Levels
              </Button>
            </Link>
            <Link href={`/dashboard/${companySlug}/orders`}>
              <Button variant="outline" className="w-full justify-start">
                <ShoppingCart className="mr-2 h-4 w-4" />
                Manage Orders
              </Button>
            </Link>
            <Link href={`/dashboard/${companySlug}/api-docs`}>
              <Button variant="outline" className="w-full justify-start">
                <DollarSign className="mr-2 h-4 w-4" />
                View API Documentation
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Alerts */}
      {lowStockCount > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <CardTitle>Low Stock Alerts</CardTitle>
            </div>
            <CardDescription>
              These products need restocking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {listings
                .filter((l) => l.totalStock > 0 && l.totalStock < 10)
                .map((listing) => (
                  <div key={listing.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <span className="font-medium">{listing.title}</span>
                    <div className="flex items-center gap-3">
                      <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400">
                        {listing.totalStock} remaining
                      </Badge>
                      <Link href={`/dashboard/${companySlug}/listings`}>
                        <Button variant="outline" size="sm">
                          Add Stock
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
