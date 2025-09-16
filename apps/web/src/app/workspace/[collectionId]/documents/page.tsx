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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@prism/ui/components/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@prism/ui/components/alert-dialog";
import { Textarea } from "@prism/ui/components/textarea";
import { CreateDocumentDialog } from "~/components/workspace/create-document-dialog";
import { api } from "~/trpc/react";

export default function DocumentsPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();

  const [editingDocument, setEditingDocument] = useState<{
    id: string;
    title: string;
    text: string;
  } | null>(null);
  const [editText, setEditText] = useState("");
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Get document with notNots when editing
  const { data: documentWithNotNots } = api.document.getByIdWithNotNots.useQuery(
    { documentId: editingDocument?.id ?? "" },
    { enabled: !!editingDocument?.id && isEditDialogOpen }
  );

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

  const updateDocumentMutation = api.document.update.useMutation({
    onSuccess: () => {
      utils.document.getByCollectionId.invalidate({ collectionId });
      setIsEditDialogOpen(false);
      setEditingDocument(null);
    },
    onError: (error) => {
      console.error("Failed to update document:", error);
    },
  });

  const handleDeleteDocument = (documentId: string) => {
    deleteDocumentMutation.mutate({ id: documentId });
  };

  const handleEditDocument = (document: {
    id: string;
    title: string;
    text: string;
  }) => {
    setEditingDocument(document);
    setEditText(document.text);
    setIsEditDialogOpen(true);
  };

  const handleSaveEdit = () => {
    if (editingDocument) {
      updateDocumentMutation.mutate({
        id: editingDocument.id,
        text: editText,
      });
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
                <div key={document.id} className="group space-y-3">
                  {/* Card with text preview */}
                  <div className="relative h-48 bg-gray-50 dark:bg-gray-900 border rounded-lg overflow-hidden cursor-pointer">
                    {/* Note count in top right */}
                    {document._count?.notNots > 0 && (
                      <div className="absolute top-2 right-2 z-10 bg-blue-600 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
                        {document._count.notNots}
                      </div>
                    )}
                    <div className="absolute inset-0 p-2 overflow-hidden">
                      <div className="font-mono text-sm leading-relaxed text-gray-700 dark:text-gray-300">
                        {document.text || (
                          <span className="text-muted-foreground italic">
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

                    {/* Action buttons - show on hover in center with subtle overlay */}
                    <div className="absolute inset-0 bg-white/30 dark:bg-black/30 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="flex space-x-3">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditDocument({
                              id: document.id,
                              title: document.title,
                              text: document.text,
                            });
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="secondary"
                              size="sm"
                              className="hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                              onClick={(e) => {
                                e.stopPropagation();
                              }}
                              disabled={deleteDocumentMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Document
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {document.title || "this document"}&quot;? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-white dark:hover:bg-red-800"
                                onClick={() =>
                                  handleDeleteDocument(document.id)
                                }
                              >
                                Delete Document
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
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

      {/* Edit Document Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-7xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Edit Document</DialogTitle>
            <DialogDescription>
              {editingDocument?.title || "Untitled Document"}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 min-h-0 flex gap-4">
            <div className="flex-1">
              <Textarea
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                className="min-h-[500px] font-mono text-sm resize-none"
                placeholder="Enter document content..."
              />
            </div>
            <div className="w-80 flex-shrink-0">
              <h3 className="font-semibold mb-3 text-sm">Generated Notes</h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {documentWithNotNots?.notNots && documentWithNotNots.notNots.length > 0 ? (
                  documentWithNotNots.notNots.map((notNot) => (
                    <div
                      key={notNot.id}
                      className="p-3 border rounded-lg bg-gray-50 dark:bg-gray-900"
                    >
                      <h4 className="font-medium text-sm mb-1">{notNot.title}</h4>
                      {notNot.description && (
                        <p className="text-xs text-muted-foreground">{notNot.description}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-sm text-muted-foreground italic">
                    No notes generated for this document yet.
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              disabled={updateDocumentMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={updateDocumentMutation.isPending}
            >
              {updateDocumentMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
