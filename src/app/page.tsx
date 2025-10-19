import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { StructuredData } from "@/components/structured-data";
import {
  Building2,
  Lock,
  TrendingUp,
  Users,
  Zap,
  Globe,
  CreditCard,
  BarChart3,
  CheckCircle,
  ArrowRight,
  ShoppingCart,
  Percent,
  Shield,
  Headphones,
} from "lucide-react";

export default async function Home() {
  const session = await auth();

  // If authenticated, redirect to dashboard
  if (session) {
    redirect("/dashboard");
  }

  return (
    <>
      <StructuredData />
      <div className="min-h-screen flex flex-col">
        {/* Navigation Header */}
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-3 sm:px-4">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="font-bold text-lg sm:text-xl">Seller Gift</span>
          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <Button asChild variant="ghost" size="sm" className="text-xs sm:text-sm">
              <Link href="/auth/signin">Sign In</Link>
            </Button>
            <Button asChild size="sm" className="text-xs sm:text-sm">
              <Link href="/auth/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-12 sm:py-20 lg:py-28 px-3 sm:px-4 text-center bg-gradient-to-b from-background via-muted/30 to-background relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 -z-10 opacity-10">
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary rounded-full blur-3xl"></div>
          </div>

          <div className="container max-w-5xl mx-auto space-y-6 sm:space-y-8">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              The Modern Gift Card Platform
            </Badge>

            <h1 className="text-3xl sm:text-5xl lg:text-7xl font-bold tracking-tight">
              Sell Gift Cards
              <span className="block text-primary mt-2">Globally, Effortlessly</span>
            </h1>

            <p className="text-base sm:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              The all-in-one platform for businesses to create, manage, and sell digital gift cards.
              Multi-tenant architecture, flexible payments, and enterprise-grade security built in.
            </p>

            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center mt-6 sm:mt-8">
              <Button asChild size="lg" className="text-sm sm:text-base h-11 sm:h-12">
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                size="lg"
                className="text-sm sm:text-base h-11 sm:h-12 border-2 font-semibold hover:bg-accent"
              >
                <Link href="/auth/signin">View Demo</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-2xl mx-auto pt-8 sm:pt-12">
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-primary">99.9%</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Uptime</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-primary">24/7</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Support</div>
              </div>
              <div>
                <div className="text-2xl sm:text-4xl font-bold text-primary">150+</div>
                <div className="text-xs sm:text-sm text-muted-foreground mt-1">Countries</div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-12 sm:py-20 px-3 sm:px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <Badge variant="outline" className="mb-4">
                Features
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                Everything You Need to Succeed
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Powerful features designed to help you sell more gift cards and grow your business
              </p>
            </div>

            <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Building2 className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Multi-Tenant Architecture</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Manage multiple brands and companies from one account. Complete data isolation
                    and customization per tenant.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <CreditCard className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Multiple Payment Gateways</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Accept payments via Stripe, PayPal, PGPay, and crypto. Switch providers
                    instantly without code changes.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Lock className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Enterprise Security</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Bank-level encryption, KYB/KYC verification, fraud detection, and comprehensive
                    audit logging.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Users className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Team Collaboration</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Invite team members with role-based permissions. Owner, admin, manager, agent,
                    and viewer roles.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <BarChart3 className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Analytics & Insights</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Real-time sales tracking, revenue reports, customer analytics, and inventory
                    management dashboards.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card className="border-2 hover:border-primary transition-colors">
                <CardHeader className="p-4 sm:p-6">
                  <Globe className="h-10 w-10 sm:h-12 sm:w-12 mb-3 sm:mb-4 text-primary" />
                  <CardTitle className="text-lg sm:text-xl">Global Reach</CardTitle>
                  <CardDescription className="text-xs sm:text-sm">
                    Sell in 150+ countries with multi-currency support, localization, and
                    region-specific payment methods.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-12 sm:py-20 px-3 sm:px-4">
          <div className="container max-w-6xl mx-auto">
            <div className="text-center mb-10 sm:mb-16">
              <Badge variant="outline" className="mb-4">
                How It Works
              </Badge>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 sm:mb-4">
                Get Started in Minutes
              </h2>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Launch your gift card business in three simple steps
              </p>
            </div>

            <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold">
                    1
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Create Your Account</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Sign up in seconds. Set up your company profile and customize your marketplace
                    branding.
                  </p>
                </div>
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold">
                    2
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Add Gift Cards</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Upload your gift card inventory, set denominations, discounts, and configure
                    payment providers.
                  </p>
                </div>
                <div className="hidden md:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-primary to-transparent"></div>
              </div>

              <div className="relative">
                <div className="flex flex-col items-center text-center space-y-3 sm:space-y-4">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xl sm:text-2xl font-bold">
                    3
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold">Start Selling</h3>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    Share your marketplace link and start accepting orders. We handle payments,
                    delivery, and support.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-12 sm:py-20 px-3 sm:px-4 bg-muted/30">
          <div className="container max-w-6xl mx-auto">
            <div className="grid gap-8 sm:gap-12 lg:grid-cols-2 items-center">
              <div>
                <Badge variant="outline" className="mb-4">
                  Why Choose Us
                </Badge>
                <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">
                  Built for Modern Businesses
                </h2>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">
                        Instant Digital Delivery
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Automated delivery system sends gift cards to customers immediately after
                        payment
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">Flexible Pricing</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Set custom discounts, seller fees, and denominations for each gift card
                        listing
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">
                        White-Label Marketplace
                      </h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Fully customizable storefront with your branding, logo, and domain
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600 mt-0.5 flex-shrink-0" />
                    <div>
                      <h3 className="font-semibold text-sm sm:text-base mb-1">API Access</h3>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        Full REST API for integrations with your existing systems and workflows
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 sm:gap-4">
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Percent className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                      <div>
                        <CardTitle className="text-base sm:text-lg">Low Transaction Fees</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Starting at just 2.9% + $0.30
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Shield className="h-8 w-8 sm:h-10 sm:w-10 text-green-600" />
                      <div>
                        <CardTitle className="text-base sm:text-lg">Fraud Protection</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          AI-powered fraud detection included
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="flex items-center gap-3">
                      <Headphones className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600" />
                      <div>
                        <CardTitle className="text-base sm:text-lg">24/7 Support</CardTitle>
                        <CardDescription className="text-xs sm:text-sm">
                          Live chat, email, and phone support
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-20 lg:py-28 px-3 sm:px-4 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="container max-w-4xl mx-auto text-center space-y-6 sm:space-y-8">
            <h2 className="text-2xl sm:text-3xl lg:text-5xl font-bold">
              Ready to Transform Your Gift Card Business?
            </h2>
            <p className="text-sm sm:text-lg lg:text-xl opacity-90 max-w-2xl mx-auto">
              Join hundreds of businesses already selling gift cards globally with our platform. No
              credit card required to start.
            </p>
            <div className="flex flex-wrap gap-3 sm:gap-4 justify-center">
              <Button
                asChild
                size="lg"
                variant="secondary"
                className="text-sm sm:text-base h-11 sm:h-12"
              >
                <Link href="/auth/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="text-sm sm:text-base h-11 sm:h-12 border-2 border-primary-foreground text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                <Link href="/auth/signin">View Demo</Link>
              </Button>
            </div>

            <div className="pt-6 sm:pt-8 flex flex-wrap justify-center gap-6 sm:gap-8 text-xs sm:text-sm opacity-80">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>14-day free trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8 sm:py-12 bg-muted/30">
        <div className="container px-3 sm:px-4 max-w-6xl mx-auto">
          <div className="grid gap-8 sm:gap-12 md:grid-cols-2 lg:grid-cols-4 mb-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <ShoppingCart className="h-5 w-5 text-primary" />
                <span className="font-bold text-lg">Seller Gift</span>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                The modern platform for selling digital gift cards globally.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Product</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Features
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Pricing
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Documentation
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    API
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Company</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    About
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Blog
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Careers
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Contact
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-sm sm:text-base mb-3 sm:mb-4">Legal</h3>
              <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                <li>
                  <Link href="/privacy" className="hover:text-primary">
                    Privacy Policy
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-primary">
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Security
                  </Link>
                </li>
                <li>
                  <Link href="/dashboard" className="hover:text-primary">
                    Compliance
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="border-t pt-6 sm:pt-8 text-center text-xs sm:text-sm text-muted-foreground">
            © {new Date().getFullYear()} Seller Giftplace. All rights reserved.
          </div>
        </div>
      </footer>
      </div>
    </>
  );
}
