"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/trpc/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@prism/ui/components/dialog";
import { Button } from "@prism/ui/components/button";
import { Input } from "@prism/ui/components/input";
import { Label } from "@prism/ui/components/label";
import { toast } from "sonner";
import { Copy, Eye, EyeOff } from "lucide-react";

const apiKeySchema = z.object({
  name: z.string().min(1, "API key name is required").max(50, "Name too long"),
  description: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

interface CreateApiKeyDialogProps {
  organizationId: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
}

export function CreateApiKeyDialog({
  organizationId,
  onSuccess,
  trigger,
}: CreateApiKeyDialogProps) {
  const [open, setOpen] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<string | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const utils = api.useUtils();

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      name: "",
      description: "",
    },
  });

  const createApiKeyMutation = api.organization.createApiKey.useMutation({
    onSuccess: (data) => {
      toast.success("API key created successfully");
      setCreatedApiKey(data.apiKey);
      setShowApiKey(true);
      utils.organization.getApiKeys.invalidate({ organizationId });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create API key");
    },
  });

  const onSubmit = (data: ApiKeyFormValues) => {
    createApiKeyMutation.mutate({
      organizationId,
      name: data.name,
      description: data.description || undefined,
    });
  };

  const copyToClipboard = async () => {
    if (createdApiKey) {
      await navigator.clipboard.writeText(createdApiKey);
      toast.success("API key copied to clipboard");
    }
  };

  const handleClose = () => {
    setOpen(false);
    setCreatedApiKey(null);
    setShowApiKey(false);
    form.reset();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setOpen(true);
    } else {
      handleClose();
    }
  };

  const isLoading = createApiKeyMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {createdApiKey ? "API Key Created" : "Create API Key"}
          </DialogTitle>
          <DialogDescription>
            {createdApiKey
              ? "Your API key has been created. Copy it now as it won't be shown again."
              : "Create a new API key for your organization. Give it a descriptive name to help identify its purpose."}
          </DialogDescription>
        </DialogHeader>

        {createdApiKey ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="generatedApiKey">API Key</Label>
              <div className="flex items-center space-x-2">
                <Input
                  id="generatedApiKey"
                  type={showApiKey ? "text" : "password"}
                  value={createdApiKey}
                  readOnly
                  className="font-mono text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowApiKey(!showApiKey)}
                >
                  {showApiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={copyToClipboard}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <div className="rounded-lg bg-yellow-50 p-4 text-sm text-yellow-800">
              <strong>Important:</strong> This is the only time you&apos;ll be
              able to see this API key. Make sure to copy and store it securely.
            </div>
          </div>
        ) : (
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Production API, Development Key"
                {...form.register("name")}
                disabled={isLoading}
              />
              {form.formState.errors.name && (
                <p className="text-sm text-red-600">
                  {form.formState.errors.name.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description (Optional)</Label>
              <Input
                id="description"
                placeholder="Brief description of what this key is used for"
                {...form.register("description")}
                disabled={isLoading}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create API Key"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {createdApiKey && (
          <DialogFooter>
            <Button onClick={handleClose}>Done</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
