"use client";

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState } from "react";
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  Warehouse,
  CreditCard,
  Webhook,
  Key,
  FileText,
  Settings,
  Users,
  UserCircle,
  ScrollText,
  Code,
  ChevronDown,
  ChevronRight,
} from "lucide-react";

interface NavItem {
  title: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
}

interface NavSection {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  items: NavItem[];
}

export function DashboardSidebar() {
  const params = useParams();
  const pathname = usePathname();
  const companySlug = params.companySlug as string;
  const [isDeveloperOpen, setIsDeveloperOpen] = useState(false);

  const mainNavigation: NavItem[] = [
    {
      title: "Overview",
      href: `/dashboard/${companySlug}`,
      icon: LayoutDashboard,
    },
    {
      title: "Listings",
      href: `/dashboard/${companySlug}/listings`,
      icon: Package,
    },
    {
      title: "Inventory",
      href: `/dashboard/${companySlug}/inventory`,
      icon: Warehouse,
    },
    {
      title: "Orders",
      href: `/dashboard/${companySlug}/orders`,
      icon: ShoppingCart,
    },
    {
      title: "Customers",
      href: `/dashboard/${companySlug}/customers`,
      icon: UserCircle,
    },
    {
      title: "Payments",
      href: `/dashboard/${companySlug}/payments`,
      icon: CreditCard,
    },
    {
      title: "Team",
      href: `/dashboard/${companySlug}/team`,
      icon: Users,
    },
  ];

  const developerSection: NavSection = {
    title: "Developer",
    icon: Code,
    items: [
      {
        title: "Webhooks",
        href: `/dashboard/${companySlug}/webhooks`,
        icon: Webhook,
      },
      {
        title: "API Keys",
        href: `/dashboard/${companySlug}/api-keys`,
        icon: Key,
      },
      {
        title: "API Docs",
        href: `/dashboard/${companySlug}/api-docs`,
        icon: FileText,
      },
    ],
  };

  const bottomNavigation: NavItem[] = [
    {
      title: "Audit Logs",
      href: `/dashboard/${companySlug}/audit-logs`,
      icon: ScrollText,
    },
    {
      title: "Settings",
      href: `/dashboard/${companySlug}/settings`,
      icon: Settings,
    },
  ];

  // Check if any developer item is active
  const isDeveloperSectionActive = developerSection.items.some(
    (item) => pathname === item.href || pathname?.startsWith(item.href + "/")
  );

  const renderNavItem = (item: NavItem, isNested = false) => {
    const Icon = item.icon;

    // Special handling for Overview - only active on exact match
    const isOverview = item.href === `/dashboard/${companySlug}`;
    const isActiveLink = isOverview
      ? pathname === item.href  // Overview only active on exact match
      : pathname === item.href || pathname?.startsWith(item.href + "/");

    return (
      <Link
        key={item.href}
        href={item.href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
          "hover:bg-accent hover:text-accent-foreground",
          isNested && "pl-9",
          isActiveLink
            ? "bg-accent text-accent-foreground font-medium"
            : "text-muted-foreground"
        )}
      >
        <Icon className="h-4 w-4" />
        <span>{item.title}</span>
        {item.badge && (
          <span className="ml-auto text-xs bg-primary text-primary-foreground rounded-full px-2 py-0.5">
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="w-64 border-r bg-muted/40 min-h-[calc(100vh-3.5rem)]">
      <nav className="flex flex-col gap-1 p-4">
        {/* Main Navigation */}
        {mainNavigation.map((item) => renderNavItem(item))}

        {/* Developer Section */}
        <div className="mt-2">
          <button
            onClick={() => setIsDeveloperOpen(!isDeveloperOpen)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors w-full",
              "hover:bg-accent hover:text-accent-foreground",
              isDeveloperSectionActive
                ? "text-accent-foreground font-medium"
                : "text-muted-foreground"
            )}
          >
            <Code className="h-4 w-4" />
            <span>Developer</span>
            {isDeveloperOpen ? (
              <ChevronDown className="h-4 w-4 ml-auto" />
            ) : (
              <ChevronRight className="h-4 w-4 ml-auto" />
            )}
          </button>

          {isDeveloperOpen && (
            <div className="mt-1 space-y-1">
              {developerSection.items.map((item) => renderNavItem(item, true))}
            </div>
          )}
        </div>

        {/* Bottom Navigation */}
        <div className="mt-2">
          {bottomNavigation.map((item) => renderNavItem(item))}
        </div>
      </nav>
    </aside>
  );
}
