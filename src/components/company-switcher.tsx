"use client";

import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Check, ChevronsUpDown, Building2, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CompanyFormDialog } from "@/components/company-form-dialog";

interface Company {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  displayName: string;
}

interface CompanySwitcherProps {
  currentCompany?: Company;
}

export function CompanySwitcher({ currentCompany }: CompanySwitcherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(currentCompany);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/v1/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data || []);

        // Extract company slug from current pathname (e.g., /dashboard/pgecom/listings -> pgecom)
        const pathParts = pathname.split('/');
        const companySlugFromPath = pathParts[2]; // /dashboard/[companySlug]/...

        // Try to find the company from the URL first
        let companyToSelect: Company | undefined;

        if (companySlugFromPath && companySlugFromPath !== 'dashboard') {
          companyToSelect = data.data.find((c: Company) => c.slug === companySlugFromPath);
        }

        // If not in URL, try localStorage
        if (!companyToSelect && data.data?.length > 0) {
          const savedCompanyId = localStorage.getItem("selectedCompanyId");
          companyToSelect = data.data.find((c: Company) => c.id === savedCompanyId) || data.data[0];
        }

        if (companyToSelect) {
          setSelectedCompany(companyToSelect);
          localStorage.setItem("selectedCompanyId", companyToSelect.id);

          // Only redirect if we're on the base /dashboard page (not on a specific company page)
          if (pathname === '/dashboard') {
            router.push(`/dashboard/${companyToSelect.slug}`);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch companies:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectCompany = (company: Company) => {
    setSelectedCompany(company);
    localStorage.setItem("selectedCompanyId", company.id);
    // Redirect to company dashboard
    router.push(`/dashboard/${company.slug}`);
  };

  const handleCreateCompany = () => {
    setIsCreateDialogOpen(true);
  };

  const handleCompanyCreated = async (companySlug: string) => {
    // Refresh companies list
    await fetchCompanies();
    // Navigate to the new company's dashboard
    router.push(`/dashboard/${companySlug}`);
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-full sm:w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Loading...</span>
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <Button variant="outline" onClick={handleCreateCompany} className="w-full sm:w-[200px]">
        <PlusCircle className="mr-2 h-4 w-4" />
        <span className="hidden sm:inline">Create Company</span>
        <span className="sm:hidden">Create</span>
      </Button>
    );
  }

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className="w-full sm:w-[200px] justify-between"
          >
            {selectedCompany ? (
              <div className="flex items-center gap-2 min-w-0">
                <Avatar className="h-5 w-5 flex-shrink-0">
                  <AvatarImage src={selectedCompany.logo || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(selectedCompany.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedCompany.displayName}</span>
              </div>
            ) : (
              <span>Select company...</span>
            )}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[var(--radix-dropdown-menu-trigger-width)] min-w-[200px]" align="start">
          <DropdownMenuLabel>Your Companies</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {companies.map((company) => (
            <DropdownMenuItem
              key={company.id}
              onSelect={() => handleSelectCompany(company)}
              className="cursor-pointer"
            >
              <div className="flex items-center gap-2 w-full">
                <Avatar className="h-5 w-5">
                  <AvatarImage src={company.logo || undefined} />
                  <AvatarFallback className="text-xs">
                    {getInitials(company.displayName)}
                  </AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate">{company.displayName}</span>
                {selectedCompany?.id === company.id && (
                  <Check className="h-4 w-4" />
                )}
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={handleCreateCompany} className="cursor-pointer">
            <PlusCircle className="mr-2 h-4 w-4" />
            Create Company
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <CompanyFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSuccess={handleCompanyCreated}
      />
    </>
  );
}
