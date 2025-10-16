"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle2, XCircle, Building2, Shield } from "lucide-react";

interface InvitationDetails {
  companyName: string;
  companySlug: string;
  role: string;
  inviterName: string;
  expiresAt: string;
}

export default function AcceptInvitationPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const token = searchParams.get("token");

  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAccepting, setIsAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;

    if (!token) {
      setError("No invitation token provided");
      setIsLoading(false);
      return;
    }

    if (status === "unauthenticated") {
      // Redirect to sign in with return URL
      router.push(`/auth/signin?callbackUrl=${encodeURIComponent(`/invitations/accept?token=${token}`)}`);
      return;
    }

    if (status === "authenticated") {
      fetchInvitationDetails();
    }
  }, [token, status]);

  const fetchInvitationDetails = async () => {
    if (!token) return;

    try {
      const response = await fetch(`/api/v1/invitations/${token}`);

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to fetch invitation details");
      }

      const result = await response.json();
      setInvitation(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load invitation");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    if (!token) return;

    setIsAccepting(true);
    setError(null);

    try {
      const response = await fetch("/api/v1/invitations/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to accept invitation");
      }

      setSuccess(true);

      // Redirect to company dashboard after 2 seconds
      setTimeout(() => {
        router.push(`/dashboard/${invitation?.companySlug}`);
      }, 2000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to accept invitation");
    } finally {
      setIsAccepting(false);
    }
  };

  const handleDecline = () => {
    router.push("/dashboard");
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      manager: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      agent: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[role] || colors.viewer;
  };

  const getRoleDescription = (role: string) => {
    const descriptions: Record<string, string> = {
      admin: "Full management access including team, settings, and billing",
      manager: "Manage listings, inventory, and orders",
      agent: "Fulfill orders and provide customer support",
      viewer: "Read-only access to company data",
    };
    return descriptions[role] || "Team member access";
  };

  if (isLoading || status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Loading invitation...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invitation Accepted!</h2>
            <p className="text-muted-foreground text-center">
              You are now a member of {invitation?.companyName}. Redirecting to your dashboard...
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center justify-center p-12">
            <XCircle className="h-16 w-16 text-destructive mb-4" />
            <h2 className="text-2xl font-bold mb-2">Invalid Invitation</h2>
            <p className="text-muted-foreground text-center mb-6">
              {error || "This invitation link is invalid or has expired."}
            </p>
            <Button onClick={() => router.push("/dashboard")}>Go to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <div className="p-4 rounded-full bg-primary/10">
              <Building2 className="h-12 w-12 text-primary" />
            </div>
          </div>
          <CardTitle className="text-3xl">Team Invitation</CardTitle>
          <CardDescription className="text-base">
            You've been invited to join a team
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="bg-muted/50 rounded-lg p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-xl font-semibold">{invitation.companyName}</p>
              </div>
              <Badge className={getRoleBadgeColor(invitation.role)}>
                <Shield className="mr-1 h-3 w-3" />
                {invitation.role}
              </Badge>
            </div>

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Role & Permissions</p>
              <p className="text-sm">{getRoleDescription(invitation.role)}</p>
            </div>

            {invitation.inviterName && (
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Invited by</p>
                <p className="text-sm font-medium">{invitation.inviterName}</p>
              </div>
            )}

            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Expires</p>
              <p className="text-sm">
                {new Date(invitation.expiresAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>

          {session && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-900 dark:text-blue-300">
                Signed in as <span className="font-medium">{session.user?.email}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse sm:flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleDecline}
              disabled={isAccepting}
            >
              Decline
            </Button>
            <Button
              className="flex-1"
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Accepting...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Accept Invitation
                </>
              )}
            </Button>
          </div>

          {error && (
            <div className="bg-destructive/15 text-destructive rounded-md p-3 text-sm">
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
