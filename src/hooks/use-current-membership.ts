/**
 * Hook to get the current user's membership and role for a company
 */

import { useState, useEffect } from "react";

interface Membership {
  id: string;
  userId: string;
  companyId: string;
  role: "owner" | "admin" | "manager" | "agent" | "viewer";
  status: string;
}

/**
 * Check if a role has minimum required permissions
 * Role hierarchy: owner > admin > manager > agent > viewer
 */
export function hasMinimumRole(
  userRole: string,
  requiredRole: "owner" | "admin" | "manager" | "agent" | "viewer"
): boolean {
  const roleHierarchy: Record<string, number> = {
    owner: 5,
    admin: 4,
    manager: 3,
    agent: 2,
    viewer: 1,
  };

  const userLevel = roleHierarchy[userRole] || 0;
  const requiredLevel = roleHierarchy[requiredRole] || 0;

  return userLevel >= requiredLevel;
}

export function useCurrentMembership(companyId: string | null) {
  const [membership, setMembership] = useState<Membership | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!companyId) {
      setIsLoading(false);
      return;
    }

    const fetchMembership = async () => {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/v1/companies/${companyId}/members/me`);

        if (!response.ok) {
          throw new Error("Failed to fetch membership");
        }

        const result = await response.json();
        setMembership(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setMembership(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembership();
  }, [companyId]);

  return {
    membership,
    isLoading,
    error,
    role: membership?.role || null,
    hasRole: (requiredRole: "owner" | "admin" | "manager" | "agent" | "viewer") =>
      membership ? hasMinimumRole(membership.role, requiredRole) : false,
  };
}
