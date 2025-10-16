import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Building2, Lock, TrendingUp, Users } from "lucide-react";

export default async function Home() {
  const session = await auth();

  // If authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center justify-between px-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-xl">GiftCard Market</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button asChild variant="ghost">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild>
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-20 px-4 text-center bg-gradient-to-b from-background to-muted/50">
          <div className="container max-w-3xl mx-auto space-y-6">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight">
              Multi-Tenant Gift Card
              <span className="block text-primary mt-2">Marketplace</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Create and manage multiple companies, sell gift cards with flexible payment options,
              and scale your business with enterprise-grade multi-tenancy.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
              <Button asChild size="lg">
                <Link href="/auth/signup">Create Account</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/auth/signin">Sign In</Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 px-4">
          <div className="container max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12">Why Choose Us?</h2>
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader>
                  <Building2 className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multi-Tenant</CardTitle>
                  <CardDescription>
                    Manage multiple companies from one account with complete isolation
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Lock className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Enterprise Security</CardTitle>
                  <CardDescription>
                    Bank-level security with KYB/KYC verification and audit logging
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <TrendingUp className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Multiple Payment Methods</CardTitle>
                  <CardDescription>
                    Accept Stripe, PayPal, Crypto, and PGPay - all in one platform
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 mb-2 text-primary" />
                  <CardTitle>Team Collaboration</CardTitle>
                  <CardDescription>
                    Role-based access control with owner, admin, manager, and viewer roles
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 px-4 bg-muted/50">
          <div className="container max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold">Ready to get started?</h2>
            <p className="text-muted-foreground">
              Join thousands of sellers already using our platform to sell gift cards globally.
            </p>
            <Button asChild size="lg">
              <Link href="/auth/signup">Create Your Account</Link>
            </Button>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-6">
        <div className="container px-4 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} GiftCard Marketplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
