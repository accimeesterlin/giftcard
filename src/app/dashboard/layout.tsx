import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { CompanySwitcher } from "@/components/company-switcher";
import Link from "next/link";
import { UserMenu } from "@/components/user-menu";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (!session || !session.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-2 sm:px-4">
          <div className="mr-2 sm:mr-4 flex">
            <Link href="/dashboard" className="mr-2 sm:mr-6 flex items-center space-x-2">
              <span className="font-bold text-base sm:text-xl">Seller Gift</span>
            </Link>
          </div>

          <div className="flex-1 flex items-center justify-end">
            <div className="flex items-center space-x-2 sm:space-x-4">
              <CompanySwitcher />
              <UserMenu user={session.user} />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer */}
      <footer className="border-t py-4">
        <div className="container px-2 sm:px-4 text-center text-xs sm:text-sm text-muted-foreground">
          © {new Date().getFullYear()} Seller Giftplace. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
