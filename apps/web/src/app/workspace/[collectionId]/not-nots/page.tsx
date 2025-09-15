"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useCollection } from "../collection-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";

export default function NotNotsPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();

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
          <CardTitle>Not-nots</CardTitle>
          <CardDescription>
            This page is currently empty and ready for development.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Content for the not-nots feature will be added here.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}