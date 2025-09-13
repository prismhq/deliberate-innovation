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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {documents.map((document) => (
                <div key={document.id} className="space-y-3">
                  {/* Card with text preview */}
                  <div className="relative h-48 bg-gray-50 dark:bg-gray-900 border rounded-lg overflow-hidden">
                    <div className="absolute inset-0 p-0 overflow-hidden">
                      <div className="font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {document.text || (
                          <span className="text-muted-foreground italic p-4 block">
                            No content available
                          </span>
                        )}
                      </div>
                    </div>
                    {/* Blurred edges overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-gray-50 dark:from-gray-900 via-gray-50/80 dark:via-gray-900/80 to-transparent"></div>
                      <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-gray-50 dark:from-gray-900 via-gray-50/90 dark:via-gray-900/90 to-transparent"></div>
                      <div className="absolute top-0 bottom-0 left-0 w-8 bg-gradient-to-r from-gray-50 dark:from-gray-900 via-gray-50/80 dark:via-gray-900/80 to-transparent"></div>
                      <div className="absolute top-0 bottom-0 right-0 w-8 bg-gradient-to-l from-gray-50 dark:from-gray-900 via-gray-50/80 dark:via-gray-900/80 to-transparent"></div>
                    </div>

                    {/* Action buttons overlay */}
                    <div className="absolute top-2 right-2 flex space-x-2 opacity-0 hover:opacity-100 transition-opacity">
                      <CreateDocumentDialog
                        collectionId={collectionId}
                        editDocument={{
                          id: document.id,
                          text: document.text,
                        }}
                        trigger={
                          <Button variant="secondary" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        }
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                        onClick={() => handleDeleteDocument(document.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Title underneath */}
                  <div className="text-center">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 truncate">
                      {document.title || "Untitled Document"}
                    </h3>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
