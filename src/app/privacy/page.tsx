import { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft } from "lucide-react";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "Privacy Policy for Seller Gift - Learn how we collect, use, and protect your personal information on our digital gift card marketplace platform.",
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
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
                  Seller Gift ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our digital gift card marketplace platform and services (the "Services").
                </p>
                <p>
                  By using our Services, you agree to the collection and use of information in accordance with this Privacy Policy. If you do not agree with this policy, please do not use our Services.
                </p>
              </div>
            </section>

            {/* Information We Collect */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <div className="space-y-4 text-muted-foreground">
                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">2.1 Information You Provide</h3>
                  <p className="mb-2">We collect information you provide directly to us, including:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Account Information:</strong> Name, email address, password, phone number</li>
                    <li><strong>Business Information (Sellers):</strong> Company name, business address, tax ID, banking details</li>
                    <li><strong>Payment Information:</strong> Credit card details, billing address (processed by third-party payment processors)</li>
                    <li><strong>Profile Information:</strong> Company logo, description, preferences</li>
                    <li><strong>Communications:</strong> Messages, support tickets, feedback, reviews</li>
                    <li><strong>Transaction Data:</strong> Purchase history, gift card details, order information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">2.2 Information Collected Automatically</h3>
                  <p className="mb-2">When you use our Services, we automatically collect:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li><strong>Device Information:</strong> IP address, browser type, device type, operating system</li>
                    <li><strong>Usage Data:</strong> Pages visited, time spent, click data, search queries</li>
                    <li><strong>Location Data:</strong> Approximate location based on IP address</li>
                    <li><strong>Cookies and Similar Technologies:</strong> Session data, preferences, analytics</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">2.3 Information from Third Parties</h3>
                  <p className="mb-2">We may receive information from:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Payment processors (transaction confirmations, fraud prevention)</li>
                    <li>Identity verification services (KYB/KYC data)</li>
                    <li>Social media platforms (if you connect accounts)</li>
                    <li>Marketing and analytics providers</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>We use the collected information for the following purposes:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Provide Services:</strong> Process transactions, deliver gift cards, manage accounts</li>
                  <li><strong>Communicate:</strong> Send confirmations, updates, notifications, and support messages</li>
                  <li><strong>Improve Services:</strong> Analyze usage, develop new features, enhance user experience</li>
                  <li><strong>Security:</strong> Prevent fraud, detect abuse, ensure platform security</li>
                  <li><strong>Compliance:</strong> Comply with legal obligations, enforce our terms</li>
                  <li><strong>Marketing:</strong> Send promotional materials (with your consent)</li>
                  <li><strong>Personalization:</strong> Customize content and recommendations</li>
                  <li><strong>Analytics:</strong> Understand user behavior and platform performance</li>
                </ul>
              </div>
            </section>

            {/* How We Share Your Information */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">4. How We Share Your Information</h2>
              <div className="space-y-4 text-muted-foreground">
                <p>We may share your information with:</p>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.1 Service Providers</h3>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>Payment processors (Stripe, PayPal, etc.)</li>
                    <li>Cloud hosting providers</li>
                    <li>Email service providers</li>
                    <li>Analytics and monitoring services</li>
                    <li>Customer support tools</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.2 Business Transfers</h3>
                  <p>
                    In the event of a merger, acquisition, or sale of assets, your information may be transferred to the acquiring entity.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.3 Legal Requirements</h3>
                  <p>
                    We may disclose information to comply with laws, regulations, legal processes, or governmental requests.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.4 Between Users</h3>
                  <p>
                    Certain information (seller name, product listings, reviews) is visible to other users as part of the marketplace functionality.
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">4.5 With Your Consent</h3>
                  <p>
                    We may share information with third parties when you explicitly consent.
                  </p>
                </div>
              </div>
            </section>

            {/* Cookies and Tracking */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Cookies and Tracking Technologies</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We use cookies, web beacons, and similar technologies to collect information and improve our Services:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality</li>
                  <li><strong>Analytics Cookies:</strong> Help us understand usage patterns</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings</li>
                  <li><strong>Marketing Cookies:</strong> Track advertising effectiveness</li>
                </ul>
                <p>
                  You can control cookies through your browser settings, but disabling certain cookies may affect functionality.
                </p>
              </div>
            </section>

            {/* Data Security */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Security</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption in transit (TLS/SSL) and at rest</li>
                  <li>Secure data centers with physical security</li>
                  <li>Access controls and authentication</li>
                  <li>Regular security audits and penetration testing</li>
                  <li>Employee training on data protection</li>
                  <li>Incident response procedures</li>
                </ul>
                <p>
                  However, no system is completely secure. We cannot guarantee absolute security of your information.
                </p>
              </div>
            </section>

            {/* Data Retention */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Data Retention</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We retain your information for as long as necessary to:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide our Services</li>
                  <li>Comply with legal obligations</li>
                  <li>Resolve disputes and enforce agreements</li>
                  <li>Prevent fraud and abuse</li>
                </ul>
                <p>
                  Account information is retained for 7 years after account closure for compliance purposes. Transaction records are kept for 10 years as required by financial regulations.
                </p>
              </div>
            </section>

            {/* Your Rights and Choices */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Your Rights and Choices</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>Depending on your location, you may have the following rights:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of your personal information</li>
                  <li><strong>Correction:</strong> Update inaccurate or incomplete information</li>
                  <li><strong>Deletion:</strong> Request deletion of your information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Receive your data in a machine-readable format</li>
                  <li><strong>Objection:</strong> Object to certain processing activities</li>
                  <li><strong>Restriction:</strong> Restrict how we process your information</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Withdraw Consent:</strong> Withdraw previously given consent</li>
                </ul>
                <p>
                  To exercise these rights, contact us at privacy@sellergift.com. We will respond within 30 days.
                </p>
              </div>
            </section>

            {/* International Data Transfers */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">9. International Data Transfers</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Your information may be transferred to and processed in countries other than your own. We ensure appropriate safeguards are in place, including:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Standard Contractual Clauses approved by the European Commission</li>
                  <li>Privacy Shield Framework (where applicable)</li>
                  <li>Data Processing Agreements with service providers</li>
                </ul>
              </div>
            </section>

            {/* Children's Privacy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Our Services are not intended for children under 18. We do not knowingly collect personal information from children. If we learn that we have collected information from a child, we will delete it promptly.
                </p>
                <p>
                  If you believe a child has provided us with personal information, please contact us immediately.
                </p>
              </div>
            </section>

            {/* Third-Party Links */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Third-Party Links and Services</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  Our Services may contain links to third-party websites and services. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.
                </p>
              </div>
            </section>

            {/* California Privacy Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">12. California Privacy Rights (CCPA)</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  California residents have additional rights under the California Consumer Privacy Act:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Right to know what personal information is collected</li>
                  <li>Right to know if personal information is sold or disclosed</li>
                  <li>Right to opt-out of the sale of personal information</li>
                  <li>Right to deletion of personal information</li>
                  <li>Right to non-discrimination for exercising CCPA rights</li>
                </ul>
                <p>
                  We do not sell your personal information. To exercise your CCPA rights, contact us at privacy@sellergift.com.
                </p>
              </div>
            </section>

            {/* GDPR Rights */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">13. European Privacy Rights (GDPR)</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you are in the European Economic Area (EEA), you have rights under the General Data Protection Regulation:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Legal basis for processing (consent, contract, legitimate interest)</li>
                  <li>Right to lodge a complaint with a supervisory authority</li>
                  <li>Right to withdraw consent at any time</li>
                  <li>Data Protection Officer contact: dpo@sellergift.com</li>
                </ul>
              </div>
            </section>

            {/* Changes to Privacy Policy */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Changes to This Privacy Policy</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  We may update this Privacy Policy from time to time. We will notify you of material changes by:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Posting the updated policy on our website</li>
                  <li>Updating the "Last Updated" date</li>
                  <li>Sending an email notification (for significant changes)</li>
                </ul>
                <p>
                  Your continued use of our Services after changes take effect constitutes acceptance of the updated Privacy Policy.
                </p>
              </div>
            </section>

            {/* Contact Us */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Us</h2>
              <div className="space-y-3 text-muted-foreground">
                <p>
                  If you have questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <p><strong>Seller Gift Privacy Team</strong></p>
                  <p>Email: privacy@sellergift.com</p>
                  <p>Data Protection Officer: dpo@sellergift.com</p>
                  <p>Address: 123 Market Street, Suite 100, San Francisco, CA 94105</p>
                  <p>Phone: +1 (415) 555-0123</p>
                </div>
              </div>
            </section>

            {/* Data We Collect Table */}
            <section>
              <h2 className="text-2xl font-semibold mb-4">16. Summary: Data Collection</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-3 text-left">Data Category</th>
                      <th className="p-3 text-left">Purpose</th>
                      <th className="p-3 text-left">Retention</th>
                    </tr>
                  </thead>
                  <tbody className="text-muted-foreground">
                    <tr className="border-b">
                      <td className="p-3">Account Information</td>
                      <td className="p-3">Service provision, authentication</td>
                      <td className="p-3">7 years after closure</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Payment Information</td>
                      <td className="p-3">Transaction processing</td>
                      <td className="p-3">10 years (regulatory)</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Usage Data</td>
                      <td className="p-3">Analytics, improvement</td>
                      <td className="p-3">2 years</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-3">Communications</td>
                      <td className="p-3">Support, service delivery</td>
                      <td className="p-3">3 years</td>
                    </tr>
                    <tr>
                      <td className="p-3">Marketing Data</td>
                      <td className="p-3">Marketing (with consent)</td>
                      <td className="p-3">Until withdrawal</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>
          </CardContent>
        </Card>

        {/* Footer Navigation */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <Link href="/terms" className="text-primary hover:underline">
            Terms of Service
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
