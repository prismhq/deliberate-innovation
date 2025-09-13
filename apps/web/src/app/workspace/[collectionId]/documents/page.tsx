"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import { useCollection } from "../collection-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { CreateDocumentDialog } from "~/components/workspace/create-document-dialog";
import { api } from "~/trpc/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prism/ui/components/table";

export default function DocumentsPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();

  // Get all documents for this collection
  const { data: documents } = api.document.getByCollectionId.useQuery(
    { collectionId },
    { enabled: !!collectionId }
  );

  const utils = api.useUtils();

  const deleteDocumentMutation = api.document.delete.useMutation({
    onSuccess: () => {
      // Invalidate both collections and documents queries to refresh data
      utils.collections.getById.invalidate({ collectionId });
      utils.document.getByCollectionId.invalidate({ collectionId });
    },
    onError: (error) => {
      console.error("Failed to delete document:", error);
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    if (
      window.confirm(
        "Are you sure you want to delete this document? This action cannot be undone."
      )
    ) {
      deleteDocumentMutation.mutate({ id: documentId });
    }
  };

  if (isLoading) {
    return (
      <div className="prism-loading-state">
        <div className="prism-loading-text">Loading documents...</div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="space-y-[var(--spacing-xl)]">
        <Card>
          <CardHeader>
            <CardTitle>Collection Not Found</CardTitle>
            <CardDescription>
              The requested collection could not be found
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--spacing-xl)]">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="prism-text-l-semibold">
              Documented Primary Interactions
            </CardTitle>
            <CreateDocumentDialog
              collectionId={collectionId}
              trigger={
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-[var(--spacing-s)]" />
                  Add Document
                </Button>
              }
            />
          </div>
        </CardHeader>
        <CardContent>
          {!documents ? (
            <div className="py-8 text-center">
              <div className="text-muted-foreground">Loading documents...</div>
            </div>
          ) : documents.length === 0 ? (
            <div className="bg-muted rounded-md p-m border border-[var(--color-border-secondary)]">
              <p className="prism-text-s text-muted-foreground italic">
                No documents configured for this collection.
              </p>
            </div>
          ) : (
            <div className="border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Text</TableHead>
                    <TableHead className="text-right"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((document) => (
                    <TableRow key={document.id}>
                      <TableCell className="font-mono">
                        {document.text || (
                          <span className="text-muted-foreground italic">
                            Not set.
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <CreateDocumentDialog
                            collectionId={collectionId}
                            editDocument={{
                              id: document.id,
                              text: document.text,
                            }}
                            trigger={
                              <Button variant="ghost" size="sm">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            }
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                            onClick={() => handleDeleteDocument(document.id)}
                            disabled={deleteDocumentMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
