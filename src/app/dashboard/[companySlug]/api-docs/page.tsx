"use client";

import { useState, useEffect } from "react";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Code, Book, Zap, Shield, TrendingUp, CheckCircle } from "lucide-react";
import "swagger-ui-react/swagger-ui.css";

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false });

export default function ApiDocsPage() {
  const [spec, setSpec] = useState<any>(null);

  useEffect(() => {
    // Load the OpenAPI spec
    fetch("/api-docs/openapi.json")
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error("Failed to load API spec:", err));
  }, []);

  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">API Documentation</h1>
        <p className="text-muted-foreground mt-2">
          Complete reference for integrating with the Gift Card Marketplace API
        </p>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quickstart">Quick Start</TabsTrigger>
          <TabsTrigger value="reference">API Reference</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Welcome to the Gift Card Marketplace API</CardTitle>
              <CardDescription>
                Build powerful integrations with our RESTful API
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Shield className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Secure Authentication</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    API keys with granular scope-based permissions and automatic rate limiting
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Real-time Webhooks</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Receive instant notifications for orders, inventory changes, and more
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">Rate Limiting</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Configurable rate limits with clear headers to manage your API usage
                  </p>
                </div>

                <div className="border rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold">RESTful Design</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Intuitive endpoints following REST best practices with JSON responses
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Base URLs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="default">Production</Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    https://api.giftcardmarketplace.com/api/public/v1
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-20">
                  Use with live API keys (gck_live_...)
                </p>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Badge variant="secondary">Development</Badge>
                  <code className="text-sm bg-muted px-2 py-1 rounded">
                    http://localhost:3000/api/public/v1
                  </code>
                </div>
                <p className="text-sm text-muted-foreground ml-[88px]">
                  Use with test API keys (gck_test_...)
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Available Scopes</CardTitle>
              <CardDescription>
                Control what your API keys can access with granular permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {[
                  { scope: "orders:read", desc: "Read orders" },
                  { scope: "orders:write", desc: "Create orders" },
                  { scope: "orders:fulfill", desc: "Fulfill orders" },
                  { scope: "orders:refund", desc: "Refund orders" },
                  { scope: "inventory:read", desc: "Read inventory" },
                  { scope: "inventory:write", desc: "Add inventory" },
                  { scope: "listings:read", desc: "Read listings" },
                  { scope: "listings:write", desc: "Create and update listings" },
                  { scope: "webhooks:read", desc: "Read webhook configurations" },
                  { scope: "webhooks:write", desc: "Manage webhooks" },
                  { scope: "*", desc: "Full API access (use with caution)" },
                ].map((item) => (
                  <div key={item.scope} className="flex items-start gap-2">
                    <code className="text-xs bg-muted px-2 py-1 rounded font-mono">
                      {item.scope}
                    </code>
                    <span className="text-sm text-muted-foreground">{item.desc}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quickstart" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Getting Started
              </CardTitle>
              <CardDescription>Follow these steps to make your first API request</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    1
                  </span>
                  Create an API Key
                </h3>
                <p className="text-sm text-muted-foreground mb-3 ml-8">
                  Navigate to Settings → API Keys and create a new API key with the required scopes.
                </p>
                <Alert className="ml-8">
                  <AlertDescription>
                    💡 <strong>Tip:</strong> Start with a test environment API key (gck_test_...) for
                    development
                  </AlertDescription>
                </Alert>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    2
                  </span>
                  Make Your First Request
                </h3>
                <p className="text-sm text-muted-foreground mb-3 ml-8">
                  Use your API key to fetch orders. Include the key in the Authorization header:
                </p>
                <div className="ml-8 bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`curl https://api.giftcardmarketplace.com/api/public/v1/orders?companyId=YOUR_COMPANY_ID \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json"`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    3
                  </span>
                  Handle Rate Limiting
                </h3>
                <p className="text-sm text-muted-foreground mb-3 ml-8">
                  Monitor rate limit headers in the response:
                </p>
                <div className="ml-8 bg-muted p-4 rounded-lg overflow-x-auto">
                  <pre className="text-sm">
                    <code>{`X-RateLimit-Limit: 60
X-RateLimit-Remaining: 59
X-RateLimit-Reset: 2025-01-15T10:31:00Z`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2 flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm">
                    4
                  </span>
                  Set Up Webhooks (Optional)
                </h3>
                <p className="text-sm text-muted-foreground mb-3 ml-8">
                  Configure webhooks to receive real-time notifications for events:
                </p>
                <div className="ml-8 space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">order.created</Badge>
                    <Badge variant="outline">order.paid</Badge>
                    <Badge variant="outline">order.fulfilled</Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">inventory.low</Badge>
                    <Badge variant="outline">inventory.out</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Code className="h-5 w-5" />
                Example Response
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-lg overflow-x-auto">
                <pre className="text-sm">
                  <code>{`{
  "data": [
    {
      "id": "order_abc123",
      "companyId": "comp_abc123",
      "listingId": "listing_abc123",
      "buyerEmail": "buyer@example.com",
      "quantity": 1,
      "unitPrice": 50.00,
      "totalAmount": 50.00,
      "currency": "USD",
      "status": "fulfilled",
      "paymentMethod": "stripe",
      "giftCards": [
        {
          "code": "XXXX-XXXX-XXXX",
          "pin": "1234",
          "value": 50.00
        }
      ],
      "createdAt": "2025-01-15T10:00:00Z",
      "paidAt": "2025-01-15T10:01:00Z",
      "fulfilledAt": "2025-01-15T10:02:00Z"
    }
  ],
  "meta": {
    "limit": 20,
    "offset": 0
  }
}`}</code>
                </pre>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reference">
          <Card>
            <CardHeader>
              <CardTitle>API Reference</CardTitle>
              <CardDescription>
                Interactive API documentation with request/response examples
              </CardDescription>
            </CardHeader>
            <CardContent>
              {spec ? (
                <div className="swagger-wrapper">
                  <SwaggerUI spec={spec} />
                </div>
              ) : (
                <div className="flex items-center justify-center p-8">
                  <p className="text-muted-foreground">Loading API documentation...</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <style jsx global>{`
        .swagger-wrapper .swagger-ui {
          font-family: inherit;
        }
        .swagger-wrapper .swagger-ui .opblock-tag {
          font-size: 1.2rem;
        }
        .swagger-wrapper .swagger-ui .opblock {
          border-radius: 0.5rem;
          margin-bottom: 1rem;
        }
      `}</style>
    </div>
  );
}
