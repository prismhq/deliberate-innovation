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

const documentSchema = z.object({
  text: z.string().optional(),
});

type DocumentFormValues = z.infer<typeof documentSchema>;

interface CreateDocumentDialogProps {
  collectionId: string;
  onSuccess?: () => void;
  trigger: React.ReactNode;
  editDocument?: {
    id: string;
    text?: string | null;
  };
}

export function CreateDocumentDialog({
  collectionId,
  onSuccess,
  trigger,
  editDocument,
}: CreateDocumentDialogProps) {
  const [open, setOpen] = useState(false);
  const utils = api.useUtils();
  const isEditing = !!editDocument;

  const form = useForm<DocumentFormValues>({
    resolver: zodResolver(documentSchema),
    defaultValues: {
      text: editDocument?.text || "",
    },
  });

  const createDocumentMutation = api.document.create.useMutation({
    onSuccess: () => {
      toast.success("Document created successfully");
      // Invalidate both collections and documents queries
      utils.collections.getById.invalidate({ collectionId });
      utils.document.getByCollectionId.invalidate({ collectionId });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create document");
    },
  });

  const updateDocumentMutation = api.document.update.useMutation({
    onSuccess: () => {
      toast.success("Document updated successfully");
      // Invalidate both collections and documents queries
      utils.collections.getById.invalidate({ collectionId });
      utils.document.getByCollectionId.invalidate({ collectionId });
      setOpen(false);
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update document");
    },
  });

  const onSubmit = (data: DocumentFormValues) => {
    if (isEditing && editDocument) {
      // Update existing document
      const updateData = {
        id: editDocument.id,
        text: data.text || "",
      };
      updateDocumentMutation.mutate(updateData);
    } else {
      // Create new document
      const filteredData = {
        collectionId,
        text: data.text || "",
      };
      createDocumentMutation.mutate(filteredData);
    }
  };

  const isLoading =
    createDocumentMutation.isPending || updateDocumentMutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Document" : "Create Document"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the document information for this collection."
              : "Add documents for this collection."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="text">Text</Label>
            <Input
              id="text"
              type="text"
              placeholder="Enter text (optional)"
              {...form.register("text")}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? isEditing
                  ? "Updating..."
                  : "Creating..."
                : isEditing
                  ? "Update Document"
                  : "Create Document"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
