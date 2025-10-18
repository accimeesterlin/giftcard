"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Loader2, UserPlus, MoreHorizontal, Mail, Trash2, Shield, RefreshCw, X, Clock } from "lucide-react";
import { format } from "date-fns";

const inviteSchema = z.object({
  email: z.string().email("Invalid email address"),
  role: z.enum(["admin", "manager", "agent", "viewer"]),
});

type InviteFormData = z.infer<typeof inviteSchema>;

interface Member {
  id: string;
  userId: string;
  role: string;
  status: string;
  user?: {
    name: string;
    email: string;
  };
  invitedAt: Date;
  invitationEmail: string | null;
  invitationExpiresAt: Date | null;
  acceptedAt: Date | null;
}

export default function TeamManagementPage() {
  const params = useParams();
  const companySlug = params.companySlug as string;
  const [company, setCompany] = useState<any>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [isRemoveDialogOpen, setIsRemoveDialogOpen] = useState(false);
  const [memberToRemove, setMemberToRemove] = useState<string | null>(null);
  const [isRevokeDialogOpen, setIsRevokeDialogOpen] = useState(false);
  const [memberToRevoke, setMemberToRevoke] = useState<Member | null>(null);
  const [isResending, setIsResending] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      role: "viewer",
    },
  });

  const selectedRole = watch("role");

  useEffect(() => {
    fetchCompanyAndMembers();
  }, [companySlug]);

  const fetchCompanyAndMembers = async () => {
    try {
      // Get company
      const companiesResponse = await fetch("/api/v1/companies");
      if (companiesResponse.ok) {
        const companiesData = await companiesResponse.json();
        const foundCompany = companiesData.data.find((c: any) => c.slug === companySlug);

        if (foundCompany) {
          setCompany(foundCompany);

          // Get members
          const membersResponse = await fetch(`/api/v1/companies/${foundCompany.id}/members`);
          if (membersResponse.ok) {
            const membersData = await membersResponse.json();
            setMembers(membersData.data);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const onInvite = async (data: InviteFormData) => {
    if (!company) return;

    setIsSending(true);
    setMessage(null);

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to send invitation");
      }

      setMessage({ type: "success", text: "Invitation sent successfully!" });
      setIsDialogOpen(false);
      reset();
      fetchCompanyAndMembers(); // Refresh list
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "An error occurred",
      });
    } finally {
      setIsSending(false);
    }
  };

  const openRemoveDialog = (memberId: string) => {
    setMemberToRemove(memberId);
    setIsRemoveDialogOpen(true);
  };

  const handleRemoveMember = async () => {
    if (!company || !memberToRemove) return;

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/members/${memberToRemove}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Member removed successfully" });
        fetchCompanyAndMembers();
      }
    } catch (error) {
      setMessage({ type: "error", text: "Failed to remove member" });
    } finally {
      setIsRemoveDialogOpen(false);
      setMemberToRemove(null);
    }
  };

  const handleResendInvitation = async (memberId: string) => {
    if (!company) return;

    setIsResending(memberId);
    try {
      const response = await fetch(`/api/v1/companies/${company.id}/members/${memberId}/resend`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Invitation resent successfully" });
      } else {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to resend invitation");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to resend invitation",
      });
    } finally {
      setIsResending(null);
    }
  };

  const openRevokeDialog = (member: Member) => {
    setMemberToRevoke(member);
    setIsRevokeDialogOpen(true);
  };

  const handleRevokeInvitation = async () => {
    if (!company || !memberToRevoke) return;

    try {
      const response = await fetch(`/api/v1/companies/${company.id}/members/${memberToRevoke.id}/revoke`, {
        method: "POST",
      });

      if (response.ok) {
        setMessage({ type: "success", text: "Invitation revoked successfully" });
        fetchCompanyAndMembers();
      } else {
        const result = await response.json();
        throw new Error(result.error?.message || "Failed to revoke invitation");
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Failed to revoke invitation",
      });
    } finally {
      setIsRevokeDialogOpen(false);
      setMemberToRevoke(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors: Record<string, string> = {
      owner: "bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400",
      admin: "bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400",
      manager: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400",
      agent: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400",
      viewer: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400",
    };
    return colors[role] || colors.viewer;
  };

  const getStatusBadge = (status: string) => {
    if (status === "active") {
      return <Badge variant="outline" className="text-green-700 border-green-700">Active</Badge>;
    }
    if (status === "pending") {
      return <Badge variant="outline" className="text-yellow-700 border-yellow-700">Pending</Badge>;
    }
    return <Badge variant="outline">{status}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Company not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="text-muted-foreground mt-2">
            Manage team members and their roles for {company.displayName}
          </p>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join {company.displayName}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onInvite)}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="colleague@example.com"
                    {...register("email")}
                    disabled={isSending}
                  />
                  {errors.email && (
                    <p className="text-sm text-destructive">{errors.email.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={selectedRole}
                    onValueChange={(value) => setValue("role", value as any)}
                    disabled={isSending}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Full management access</SelectItem>
                      <SelectItem value="manager">Manager - Manage listings & orders</SelectItem>
                      <SelectItem value="agent">Agent - Fulfill orders & support</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.role && (
                    <p className="text-sm text-destructive">{errors.role.message}</p>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={isSending}>
                  {isSending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Mail className="mr-2 h-4 w-4" />
                      Send Invitation
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {message && (
        <div
          className={`p-3 rounded-md text-sm ${
            message.type === "success"
              ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
              : "bg-destructive/15 text-destructive"
          }`}
        >
          {message.text}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Team Members ({members.length})</CardTitle>
          <CardDescription>
            People who have access to this company
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No team members yet. Invite someone to get started!
                  </TableCell>
                </TableRow>
              ) : (
                members.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {member.user?.name || "Pending User"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {member.user?.email || member.invitationEmail || "Invitation sent"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleBadgeColor(member.role)}>
                        {member.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {getStatusBadge(member.status)}
                        {member.status === "pending" && member.invitationExpiresAt && (
                          <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            Expires {format(new Date(member.invitationExpiresAt), "MMM d")}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {member.acceptedAt
                        ? format(new Date(member.acceptedAt), "MMM d, yyyy")
                        : format(new Date(member.invitedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell>
                      {member.role !== "owner" && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            {member.status === "pending" ? (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleResendInvitation(member.id)}
                                  disabled={isResending === member.id}
                                >
                                  {isResending === member.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Resending...
                                    </>
                                  ) : (
                                    <>
                                      <RefreshCw className="mr-2 h-4 w-4" />
                                      Resend Invitation
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => openRevokeDialog(member)}
                                  className="text-destructive"
                                >
                                  <X className="mr-2 h-4 w-4" />
                                  Revoke Invitation
                                </DropdownMenuItem>
                              </>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => openRemoveDialog(member.userId)}
                                className="text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove Member
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Remove Member Confirmation Dialog */}
      <AlertDialog open={isRemoveDialogOpen} onOpenChange={setIsRemoveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Team Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this member? They will lose access to the company and
              all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRemoveMember}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove Member
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Revoke Invitation Confirmation Dialog */}
      <AlertDialog open={isRevokeDialogOpen} onOpenChange={setIsRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke Invitation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to revoke the invitation to{" "}
              <span className="font-medium">{memberToRevoke?.invitationEmail}</span>? They will
              no longer be able to accept this invitation.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeInvitation}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Invitation
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
