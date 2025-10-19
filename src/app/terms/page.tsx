import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Terms of Service",
  description: "Terms of Service for Seller Gift - Digital gift card marketplace platform. Read our terms and conditions for using our services.",
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-5xl mx-auto px-4 py-4">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-4xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground">
            Last Updated: January 15, 2025
          </p>
        </div>

        <Card>
          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* Introduction */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Welcome to Seller Gift ("we," "our," or "us"). These Terms of Service ("Terms") govern your access to and use of our digital gift card marketplace platform and services (collectively, the "Services").
                </p>
                <p>
                  By accessing or using our Services, you agree to be bound by these Terms. If you do not agree to these Terms, do not use our Services.
                </p>
              </div>
            </section>

            {/* Definitions */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Definitions</h2>
              <div className="space-y-3 text-muted-foreground">
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>"Platform"</strong> refers to the Seller Gift website, applications, and related services.</li>
                  <li><strong>"Seller"</strong> refers to businesses that list and sell gift cards through our Platform.</li>
                  <li><strong>"Buyer"</strong> refers to individuals or entities that purchase gift cards through our Platform.</li>
                  <li><strong>"Gift Card"</strong> refers to digital or physical prepaid cards offered for sale on our Platform.</li>
                  <li><strong>"Marketplace"</strong> refers to the seller-specific storefronts hosted on our Platform.</li>
                </ul>
              </div>
            </section>

            {/* Eligibility */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. Eligibility</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  To use our Services, you must:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Be at least 18 years old or the age of legal majority in your jurisdiction</li>
                  <li>Have the legal capacity to enter into binding contracts</li>
                  <li>Not be prohibited from using our Services under applicable laws</li>
                  <li>Provide accurate and complete registration information</li>
                </ul>
              </div>
            </section>

            {/* Seller Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Seller Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.1 Account Registration</h3>
                  <p>
                    Sellers must create an account and complete our verification process, including KYB/KYC requirements, before listing gift cards on the Platform.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.2 Listing Requirements</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>All gift card listings must be accurate and not misleading</li>
                    <li>Gift cards must be valid and redeemable as described</li>
                    <li>Sellers must maintain adequate inventory for listed items</li>
                    <li>Prohibited items and fraudulent listings are strictly forbidden</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.3 Fees and Payment</h3>
                  <p>
                    Sellers agree to pay applicable platform fees, transaction fees, and payment processing fees as outlined in your seller agreement. Fees are subject to change with 30 days' notice.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.4 Fulfillment</h3>
                  <p>
                    Sellers are responsible for fulfilling orders promptly and delivering gift cards as promised. Digital gift cards must be delivered within 24 hours of payment confirmation.
                  </p>
                </div>
              </div>
            </section>

            {/* Buyer Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Buyer Terms</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">5.1 Purchases</h3>
                  <p>
                    By purchasing a gift card, you agree to pay the listed price plus any applicable fees. All sales are final unless otherwise stated by the seller or required by law.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">5.2 Gift Card Usage</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Gift cards are subject to the terms and conditions of the issuing brand</li>
                    <li>Seller Gift is not responsible for restrictions imposed by gift card issuers</li>
                    <li>Lost or stolen gift cards cannot be replaced unless stated otherwise</li>
                    <li>Gift cards may have expiration dates or usage restrictions</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">5.3 Refunds and Returns</h3>
                  <p>
                    Refund policies are set by individual sellers. Digital gift cards are generally non-refundable once delivered. Contact the seller directly for refund requests.
                  </p>
                </div>
              </div>
            </section>

            {/* Payment Processing */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Payment Processing</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We use third-party payment processors (Stripe, PayPal, etc.) to handle transactions. By using our Services, you agree to the terms of these payment processors. We do not store complete payment card information on our servers.
                </p>
                <p>
                  You authorize us to charge your selected payment method for all purchases. You are responsible for maintaining accurate payment information.
                </p>
              </div>
            </section>

            {/* Intellectual Property */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Intellectual Property</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  The Platform and its content (excluding user-generated content) are owned by Seller Gift and protected by copyright, trademark, and other intellectual property laws.
                </p>
                <p>
                  Sellers retain ownership of their brand names, logos, and listing content but grant us a license to display and promote this content on the Platform.
                </p>
              </div>
            </section>

            {/* Prohibited Activities */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Prohibited Activities</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>You agree not to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Engage in fraudulent activities or money laundering</li>
                  <li>List or purchase stolen or counterfeit gift cards</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Interfere with the Platform's operation or security</li>
                  <li>Impersonate others or provide false information</li>
                  <li>Scrape, crawl, or use automated tools without permission</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Circumvent our fees or payment systems</li>
                </ul>
              </div>
            </section>

            {/* Privacy and Data */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Privacy and Data Protection</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Your use of our Services is subject to our Privacy Policy, which explains how we collect, use, and protect your personal information. By using our Services, you consent to our data practices as described in the Privacy Policy.
                </p>
              </div>
            </section>

            {/* Disclaimers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Disclaimers</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  THE SERVICES ARE PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT WARRANT THAT THE SERVICES WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
                </p>
                <p>
                  We are a marketplace platform and not a party to transactions between buyers and sellers. We do not guarantee the quality, safety, or legality of gift cards listed on the Platform.
                </p>
              </div>
            </section>

            {/* Limitation of Liability */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Limitation of Liability</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, SELLER GIFT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES.
                </p>
                <p>
                  Our total liability to you for any claims arising from your use of the Services shall not exceed the greater of (a) $100 or (b) the amount you paid us in the 12 months before the claim arose.
                </p>
              </div>
            </section>

            {/* Indemnification */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Indemnification</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  You agree to indemnify and hold harmless Seller Gift and its affiliates from any claims, damages, losses, and expenses (including legal fees) arising from your use of the Services, violation of these Terms, or infringement of any rights of others.
                </p>
              </div>
            </section>

            {/* Termination */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Termination</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may suspend or terminate your account at any time for any reason, including violation of these Terms. You may terminate your account by contacting us. Termination does not relieve you of obligations incurred before termination.
                </p>
              </div>
            </section>

            {/* Dispute Resolution */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Dispute Resolution</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Any disputes arising from these Terms or your use of the Services shall be resolved through binding arbitration in accordance with the rules of the American Arbitration Association, except where prohibited by law.
                </p>
                <p>
                  You agree to waive your right to participate in class action lawsuits or class-wide arbitration.
                </p>
              </div>
            </section>

            {/* Changes to Terms */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Changes to These Terms</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may update these Terms from time to time. We will notify you of material changes by email or through the Platform. Your continued use of the Services after changes take effect constitutes acceptance of the updated Terms.
                </p>
              </div>
            </section>

            {/* Governing Law */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">16. Governing Law</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the State of Delaware, United States, without regard to its conflict of law provisions.
                </p>
              </div>
            </section>

            {/* Contact Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">17. Contact Us</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you have questions about these Terms, please contact us at:
                </p>
                <div className="bg-muted p-4 rounded-lg">
                  <p><strong>Seller Gift Legal Team</strong></p>
                  <p>Email: legal@sellergift.com</p>
                  <p>Address: 123 Market Street, Suite 100, San Francisco, CA 94105</p>
                </div>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/dashboard" className="text-primary hover:underline">
            Dashboard
          </Link>
          <span className="text-muted-foreground">•</span>
          <Link href="/" className="text-primary hover:underline">
            Home
          </Link>
        </div>
      </main>
    </div>
  );
}
