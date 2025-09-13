"use client";

import { useState, useEffect } from "react";
import { useSession, authClient } from "~/auth/client";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import {
  FolderOpen,
  Plus,
  Mail,
  Send,
  Building2,
  ChevronDown,
} from "lucide-react";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@prism/ui/components/avatar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@prism/ui/components/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@prism/ui/components/dropdown-menu";
import { Textarea } from "@prism/ui/components/textarea";
import { Label } from "@prism/ui/components/label";
import { Input } from "@prism/ui/components/input";
import { WorkspaceNavbar } from "~/components/workspace/workspace-navbar";
import { api } from "~/trpc/react";

export default function WorkspacePage() {
  const { data: session, isPending } = useSession();
  const router = useRouter();

  const [inviteEmails, setInviteEmails] = useState("");
  const [isSendingInvites, setIsSendingInvites] = useState(false);
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [organizationName, setOrganizationName] = useState("");
  const [isCreatingOrganization, setIsCreatingOrganization] = useState(false);
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [collectionName, setCollectionName] = useState("");
  const [collectionDescription, setCollectionDescription] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCreateCollectionDialogOpen, setIsCreateCollectionDialogOpen] =
    useState(false);
  const [deleteApiKeyId, setDeleteApiKeyId] = useState<string | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [switchingToOrgId, setSwitchingToOrgId] = useState<string | null>(null);

  const {
    data: activeOrganization,
    isPending: isActiveOrganizationPending,
    error: orgError,
  } = api.organization.getActiveOrganization.useQuery(undefined, {
    enabled: session?.user != null,
  });

  const { data: userOrganizations } =
    api.organization.getUserOrganizations.useQuery(undefined, {
      enabled: session?.user != null,
    });

  const setActiveOrganizationMutation =
    api.organization.setActiveOrganization.useMutation({
      onSuccess: () => {
        // Don't reset the loading state - keep it until page reload completes
        // Refresh the active organization and related data
        window.location.reload();
      },
      onError: (error) => {
        console.error("Failed to switch organization:", error);
        setSwitchingToOrgId(null); // Only reset loading state on error
      },
    });

  const { data: collections } = api.organization.getCollections.useQuery(
    { organizationId: activeOrganization?.id ?? "" },
    { enabled: activeOrganization != null && activeOrganization.id != null }
  );
  const { data: members } = api.organization.getMembers.useQuery(
    { organizationId: activeOrganization?.id ?? "" },
    { enabled: activeOrganization != null && activeOrganization.id != null }
  );

  const createOrganizationMutation = api.organization.create.useMutation({
    onSuccess: () => {
      setOrganizationName("");
      setIsCreateOrgDialogOpen(false);
      // Refresh the active organization
      window.location.reload();
    },
    onError: (error) => {
      console.error("Failed to create organization:", error);
    },
  });

  const createCollectionMutation = api.collections.create.useMutation({
    onSuccess: (newCollection) => {
      setCollectionName("");
      setCollectionDescription("");
      setIsCreateCollectionDialogOpen(false);
      // Navigate to the new collection
      router.push(`/workspace/${newCollection.id}`);
    },
    onError: (error) => {
      console.error("Failed to create collection:", error);
    },
  });

  const utils = api.useUtils();

  const deleteApiKeyMutation = api.organization.deleteApiKey.useMutation({
    onSuccess: () => {
      setIsDeleteDialogOpen(false);
      setDeleteApiKeyId(null);
      // Refresh API keys list without page reload
      if (activeOrganization?.id) {
        utils.organization.getApiKeys.invalidate({
          organizationId: activeOrganization.id,
        });
      }
    },
    onError: (error) => {
      console.error("Failed to delete API key:", error);
    },
  });

  useEffect(() => {
    // Don't redirect while session is still loading
    if (isPending) return;

    if (!session?.user) {
      router.push("/login");
      return;
    }
  }, [session, router, isPending]);

  const handleCreateCollection = async () => {
    if (!collectionName.trim() || !activeOrganization?.id) return;

    setIsCreatingCollection(true);
    try {
      await createCollectionMutation.mutateAsync({
        name: collectionName.trim(),
        description: collectionDescription.trim() || undefined,
        organizationId: activeOrganization.id,
      });
    } catch (error) {
      console.error("Failed to create collection:", error);
    } finally {
      setIsCreatingCollection(false);
    }
  };

  const handleCreateOrganization = async () => {
    if (!organizationName.trim()) return;

    setIsCreatingOrganization(true);
    try {
      await createOrganizationMutation.mutateAsync({
        name: organizationName.trim(),
      });
    } catch (error) {
      console.error("Failed to create organization:", error);
    } finally {
      setIsCreatingOrganization(false);
    }
  };

  const handleSendInvites = async () => {
    if (!activeOrganization?.id || !inviteEmails.trim() || !session?.user)
      return;

    setIsSendingInvites(true);
    try {
      // Parse email addresses
      const emails = inviteEmails
        .split(/[,\n]/)
        .map((email) => email.trim())
        .filter((email) => email.length > 0 && email.includes("@"));

      if (emails.length === 0) {
        console.error(
          "Invalid email addresses - please enter valid email addresses separated by commas or new lines"
        );
        return;
      }

      let inviteCount = 0;
      const failedEmails: string[] = [];

      for (const email of emails) {
        try {
          await authClient.organization.inviteMember({
            organizationId: activeOrganization.id,
            email,
            role: "member",
          });
          inviteCount++;
        } catch (error) {
          console.error(`Failed to invite ${email}:`, error);
          failedEmails.push(email);
          // Continue with other invitations even if one fails
        }
      }

      if (inviteCount > 0) {
        setInviteEmails("");
        setIsInviteDialogOpen(false);
        console.log(
          `Invitations sent successfully - sent ${inviteCount} invitation${inviteCount > 1 ? "s" : ""} to team members`
        );

        if (failedEmails.length > 0) {
          console.log(
            `Some invitations failed - failed to send invitations to: ${failedEmails.join(", ")}`
          );
        }
      } else {
        console.log(
          "Failed to send invitations - please check the email addresses and try again"
        );
      }
    } catch (error) {
      console.error("Failed to send invites:", error);
      console.log(
        "Failed to send invitations - an unexpected error occurred, please try again later"
      );
    } finally {
      setIsSendingInvites(false);
    }
  };

  const confirmDeleteApiKey = () => {
    if (!activeOrganization?.id || !deleteApiKeyId) return;

    deleteApiKeyMutation.mutate({
      organizationId: activeOrganization.id,
      apiKeyId: deleteApiKeyId,
    });
  };

  if (isPending || isActiveOrganizationPending) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </div>
    );
  }

  if (orgError) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="text-red-600 font-medium">{orgError.message}</div>
      </div>
    );
  }

  return (
    <>
      <WorkspaceNavbar />
      <div>
        {/* Main Content */}
        <main className="mx-auto max-w-content px-4 py-8">
          {!activeOrganization ? (
            /* No Organization - Create Organization UI */
            <div className="flex min-h-[60vh] items-center justify-center">
              <Card className="w-full max-w-form">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Building2 className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle>Create Your Organization</CardTitle>
                  <CardDescription>
                    Get started by creating your first organization to manage
                    your collections and team members.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Dialog
                    open={isCreateOrgDialogOpen}
                    onOpenChange={setIsCreateOrgDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button className="w-full text-primary-foreground">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Organization
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                        <DialogDescription>
                          Enter a name for your organization. You can always
                          change this later.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="organizationName">
                            Organization Name
                          </Label>
                          <Input
                            id="organizationName"
                            placeholder="Enter organization name"
                            value={organizationName}
                            onChange={(e) =>
                              setOrganizationName(e.target.value)
                            }
                            className="mt-2"
                            onKeyDown={(e) => {
                              if (
                                e.key === "Enter" &&
                                organizationName.trim()
                              ) {
                                handleCreateOrganization();
                              }
                            }}
                          />
                        </div>
                        <div className="flex justify-end space-x-2">
                          <Button
                            variant="outline"
                            onClick={() => setIsCreateOrgDialogOpen(false)}
                            disabled={isCreatingOrganization}
                          >
                            Cancel
                          </Button>
                          <Button
                            onClick={handleCreateOrganization}
                            disabled={
                              !organizationName.trim() || isCreatingOrganization
                            }
                          >
                            {isCreatingOrganization
                              ? "Creating..."
                              : "Create Organization"}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Organization Header */}
              <div className="flex items-center justify-between">
                {userOrganizations && userOrganizations.length > 1 ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        className="flex items-center gap-2 text-3xl font-bold hover:opacity-80 transition-opacity disabled:opacity-50"
                        disabled={switchingToOrgId !== null}
                      >
                        {switchingToOrgId ? (
                          <>
                            {userOrganizations.find(
                              (org) => org.id === switchingToOrgId
                            )?.name || "Switching..."}
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                          </>
                        ) : (
                          <>
                            {activeOrganization.name}
                            <ChevronDown className="h-6 w-6" />
                          </>
                        )}
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start">
                      {userOrganizations.map((org) => (
                        <DropdownMenuItem
                          key={org.id}
                          onClick={() => {
                            if (
                              org.id !== activeOrganization.id &&
                              switchingToOrgId === null
                            ) {
                              setSwitchingToOrgId(org.id);
                              setActiveOrganizationMutation.mutate({
                                organizationId: org.id,
                              });
                            }
                          }}
                          disabled={switchingToOrgId !== null}
                          className={`cursor-pointer ${
                            org.id === activeOrganization.id
                              ? "bg-primary/10 font-medium"
                              : ""
                          } ${switchingToOrgId === org.id ? "opacity-50" : ""}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            {org.name}
                            {switchingToOrgId === org.id && (
                              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent ml-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <h1 className="text-3xl font-bold">
                    {switchingToOrgId ? (
                      <div className="flex items-center gap-2">
                        Switching...
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                      </div>
                    ) : (
                      activeOrganization.name
                    )}
                  </h1>
                )}
              </div>

              {/* Collections Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Collections</CardTitle>
                    <Dialog
                      open={isCreateCollectionDialogOpen}
                      onOpenChange={setIsCreateCollectionDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button disabled={!activeOrganization}>
                          <Plus className="mr-2 h-4 w-4" />
                          New Collection
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Create New Collection</DialogTitle>
                          <DialogDescription>
                            Create a new collection to organize your work and
                            collaborate with your team.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="collectionName">
                              Collection Name
                            </Label>
                            <Input
                              id="collectionName"
                              placeholder="Enter collection name"
                              value={collectionName}
                              onChange={(e) =>
                                setCollectionName(e.target.value)
                              }
                              className="mt-2"
                              onKeyDown={(e) => {
                                if (
                                  e.key === "Enter" &&
                                  collectionName.trim()
                                ) {
                                  handleCreateCollection();
                                }
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor="collectionDescription">
                              Description (Optional)
                            </Label>
                            <Textarea
                              id="collectionDescription"
                              placeholder="Enter a brief description of this collection"
                              value={collectionDescription}
                              onChange={(e) =>
                                setCollectionDescription(e.target.value)
                              }
                              className="mt-2"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() =>
                                setIsCreateCollectionDialogOpen(false)
                              }
                              disabled={isCreatingCollection}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleCreateCollection}
                              disabled={
                                !collectionName.trim() || isCreatingCollection
                              }
                            >
                              {isCreatingCollection
                                ? "Creating..."
                                : "Create Collection"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  {!collections ? (
                    <div className="py-8 text-center">
                      <div className="text-muted-foreground">
                        Loading collections...
                      </div>
                    </div>
                  ) : collections.length === 0 ? (
                    <div className="py-12 text-center">
                      <FolderOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">
                        No collections yet
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {collections.map((collection) => (
                        <Card
                          key={collection.id}
                          className="cursor-pointer transition-shadow hover:shadow-md"
                          onClick={() =>
                            router.push(`/workspace/${collection.id}`)
                          }
                        >
                          <CardContent className="p-6">
                            <div className="mb-2">
                              <h3 className="text-lg font-semibold">
                                {collection.name}
                              </h3>
                            </div>
                            {collection.description && (
                              <p className="text-sm text-muted-foreground">
                                {collection.description}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Team Members Section */}
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Team Members</CardTitle>
                    <Dialog
                      open={isInviteDialogOpen}
                      onOpenChange={setIsInviteDialogOpen}
                    >
                      <DialogTrigger asChild>
                        <Button disabled={!collections}>
                          <Mail className="mr-2 h-4 w-4" />
                          Invite Members
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Members</DialogTitle>
                          <DialogDescription>
                            Send invitations to team members to join your
                            organization.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="inviteEmails">
                              Email Addresses
                            </Label>
                            <Textarea
                              id="inviteEmails"
                              placeholder="Enter email addresses separated by commas or new lines&#10;example@company.com, another@company.com"
                              value={inviteEmails}
                              onChange={(e) => setInviteEmails(e.target.value)}
                              className="min-h-[100px] mt-2"
                            />
                          </div>
                          <div className="flex justify-end space-x-2">
                            <Button
                              variant="outline"
                              onClick={() => setIsInviteDialogOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button
                              onClick={handleSendInvites}
                              disabled={
                                !inviteEmails.trim() ||
                                isSendingInvites ||
                                !activeOrganization?.id
                              }
                            >
                              <Send className="mr-2 h-4 w-4" />
                              {isSendingInvites
                                ? "Sending..."
                                : "Send Invitations"}
                            </Button>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {members?.map((member) => {
                      const memberInitial = (
                        member?.name?.charAt(0) ||
                        member?.email?.charAt(0) ||
                        "U"
                      ).toUpperCase();
                      return (
                        <Card key={member.id}>
                          <CardContent className="flex items-center justify-between p-6">
                            <div className="flex items-center space-x-3">
                              <Avatar className="h-10 w-10">
                                <AvatarImage
                                  src={member?.image ?? undefined}
                                  alt={member?.name ?? member?.email ?? "User"}
                                  referrerPolicy="no-referrer"
                                />
                                <AvatarFallback className="bg-blue-600 text-white">
                                  {memberInitial}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {member?.name || member?.email || "Member"}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member?.email}
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </main>
      </div>

      {/* Delete API Key Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete API Key</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this API key? This action cannot
              be undone. Any applications using this key will no longer be able
              to access your organization&apos;s resources.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={deleteApiKeyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDeleteApiKey}
              disabled={deleteApiKeyMutation.isPending}
            >
              {deleteApiKeyMutation.isPending
                ? "Deleting..."
                : "Delete API Key"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
