"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(currentCompany);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch("/api/v1/companies");
      if (response.ok) {
        const data = await response.json();
        setCompanies(data.data || []);

        // Set first company as selected if no current company
        if (!selectedCompany && data.data?.length > 0) {
          const firstCompany = data.data[0];
          setSelectedCompany(firstCompany);
          // Store in localStorage
          localStorage.setItem("selectedCompanyId", firstCompany.id);
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
    router.push("/dashboard/companies/new");
  };

  if (isLoading) {
    return (
      <Button variant="outline" disabled className="w-[200px]">
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    );
  }

  if (companies.length === 0) {
    return (
      <Button variant="outline" onClick={handleCreateCompany} className="w-[200px]">
        <PlusCircle className="mr-2 h-4 w-4" />
        Create Company
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
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          className="w-[200px] justify-between"
        >
          {selectedCompany ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-5 w-5">
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
      <DropdownMenuContent className="w-[200px]" align="start">
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
  );
}
