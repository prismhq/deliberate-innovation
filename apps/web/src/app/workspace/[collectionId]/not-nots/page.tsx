"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import { useCollection } from "../collection-context";
import { api } from "~/trpc/react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@prism/ui/components/table";
import { Button } from "@prism/ui/components/button";
import {
  RefreshCw,
  Lightbulb,
  FileText,
  Calendar,
  Info,
  Trash2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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

export default function NotNotsPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();
  const [isGenerating, setIsGenerating] = useState(false);

  // Get not-nots for this collection
  const {
    data: notNots,
    isLoading: notNotsLoading,
    refetch: refetchNotNots,
  } = api.notNot.getByCollectionId.useQuery(
    { collectionId },
    { enabled: !!collectionId }
  );

  // Get generation status
  const { data: generationStatus, refetch: refetchStatus } =
    api.notNot.getGenerationStatus.useQuery(
      { collectionId },
      { enabled: !!collectionId }
    );

  // Manual generation mutation
  const generateNotNotsMutation = api.notNot.generateForCollection.useMutation({
    onSuccess: (result) => {
      console.log(`Generated ${result.generated} not-nots`);
      refetchNotNots();
      refetchStatus();
      setIsGenerating(false);
    },
    onError: (error) => {
      console.error("Failed to generate not-nots:", error);
      setIsGenerating(false);
    },
  });

  // Delete mutation
  const deleteNotNotMutation = api.notNot.delete.useMutation({
    onSuccess: () => {
      refetchNotNots();
      refetchStatus();
    },
    onError: (error) => {
      console.error("Failed to delete not-not:", error);
    },
  });

  const handleGenerateNotNots = async () => {
    if (!generationStatus?.eligibleForGeneration) {
      return;
    }

    setIsGenerating(true);
    generateNotNotsMutation.mutate({ collectionId });
  };

  const handleDeleteNotNot = (notNotId: string) => {
    deleteNotNotMutation.mutate({ notNotId });
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
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
            <div>
              <CardTitle className="flex items-center gap-2">
                Not-Nots
              </CardTitle>
              <CardDescription>
                Authentic demand patterns discovered through document clustering
                analysis
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {generationStatus?.eligibleForGeneration && (
                <Button
                  onClick={handleGenerateNotNots}
                  disabled={isGenerating || generateNotNotsMutation.isPending}
                  size="sm"
                  variant={
                    generationStatus.generationNeeded ? "default" : "outline"
                  }
                >
                  {isGenerating || generateNotNotsMutation.isPending ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Lightbulb className="h-4 w-4 mr-2" />
                  )}
                  {generationStatus.generationNeeded
                    ? "Generate"
                    : "Regenerate"}{" "}
                  Not-Nots
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {notNotsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="ml-2 text-sm text-muted-foreground">
                Loading not-nots...
              </span>
            </div>
          ) : !notNots || notNots.length === 0 ? (
            <div className="text-center py-12">
              <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">
                No Not-Nots Generated Yet
              </h3>
              <div className="text-muted-foreground mb-6 space-y-2">
                <p>
                  {generationStatus?.eligibleForGeneration
                    ? "Click 'Generate Not-Nots' to discover authentic demand patterns in your documents."
                    : `Add 1 or more documents with embeddings to enable not-not generation.`}
                </p>
                {generationStatus?.eligibleForGeneration && (
                  <p>
                    If none are generated, add more documents as current documents may
                    not reveal clear not-not patterns.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {notNots.length} not-not{notNots.length !== 1 ? "s" : ""}{" "}
                  found
                </p>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Title</TableHead>
                    <TableHead className="w-[25%]">Source Document</TableHead>
                    <TableHead className="w-[20%]">Generated</TableHead>
                    <TableHead className="w-[15%]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notNots.map((notNot) => (
                    <TableRow key={notNot.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <p className="font-medium leading-tight">
                            {notNot.title}
                          </p>
                          {notNot.description && (
                            <p className="text-xs text-muted-foreground line-clamp-2">
                              {notNot.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {notNot.document.title}
                          </span>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 px-2"
                              >
                                <Info className="h-3 w-3" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-2xl">
                              <DialogHeader>
                                <DialogTitle>{notNot.title}</DialogTitle>
                                <DialogDescription>
                                  Source document and analysis details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-4">
                                {notNot.description && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">
                                      Description
                                    </h4>
                                    <p className="text-sm text-muted-foreground">
                                      {notNot.description}
                                    </p>
                                  </div>
                                )}
                                <div>
                                  <h4 className="text-sm font-medium mb-2">
                                    Source Document
                                  </h4>
                                  <div className="flex items-center gap-2 text-sm">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {notNot.document.title}
                                  </div>
                                </div>
                                {notNot.metadata && (
                                  <div>
                                    <h4 className="text-sm font-medium mb-2">
                                      Generation Metadata
                                    </h4>
                                    <div className="text-xs text-muted-foreground bg-muted p-2 rounded">
                                      <pre>
                                        {JSON.stringify(
                                          notNot.metadata,
                                          null,
                                          2
                                        )}
                                      </pre>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {formatDate(notNot.createdAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-950 dark:hover:text-red-400"
                              disabled={deleteNotNotMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Delete Not-Not
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete &quot;
                                {notNot.title}&quot;? This action cannot be
                                undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                className="bg-red-600 text-white hover:bg-red-700 dark:bg-red-900 dark:text-white dark:hover:bg-red-800"
                                onClick={() => handleDeleteNotNot(notNot.id)}
                              >
                                Delete Not-Not
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
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
