"use client";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useCollection } from "./collection-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";
import { Button } from "@prism/ui/components/button";
import { ArrowRight } from "lucide-react";
import { api } from "~/trpc/react";

export default function CollectionPage() {
  const params = useParams();
  const collectionId = params.collectionId as string;
  const { isLoading, collection } = useCollection();

  // Get all documents for this collection (for total count)
  const { data: documents } = api.document.getByCollectionId.useQuery(
    { collectionId },
    { enabled: !!collectionId }
  );

  if (isLoading) {
    return (
      <div className="prism-loading-state">
        <div className="prism-loading-text">Loading collection...</div>
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
          <CardContent>
            <Button asChild>
              <Link href="/workspace">Back to Workspace</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--spacing-xl)]">
      {/* Collection Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="prism-text-l-semibold">
            Collection Overview
          </CardTitle>
          <CardDescription>
            General information about this collection
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-l">
            <div>
              <dt className="prism-text-s text-muted-foreground mb-[var(--spacing-xs)]">
                Collection ID
              </dt>
              <dd className="font-mono text-sm">{collection.id}</dd>
            </div>
            <div>
              <dt className="prism-text-s text-muted-foreground mb-[var(--spacing-xs)]">
                Collection Name
              </dt>
              <dd className="font-medium">{collection.name}</dd>
            </div>
            <div>
              <dt className="prism-text-s text-muted-foreground mb-[var(--spacing-xs)]">
                Created
              </dt>
              <dd className="text-sm">
                {new Date(collection.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div>
              <dt className="prism-text-s text-muted-foreground mb-[var(--spacing-xs)]">
                Total Documents
              </dt>
              <dd className="text-sm">{documents?.length ?? 0}</dd>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Connect to Your AI Agent */}
      <Card>
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <CardTitle className="prism-text-l-semibold mb-[var(--spacing-s)]">
              Connect to your AI agent
            </CardTitle>
            <CardDescription>
              Integrate your documents with your development workflow
            </CardDescription>
          </div>
          <Link href={`/workspace/${collectionId}/connect`}>
            <Button>
              Connect
              <ArrowRight className="ml-[var(--spacing-s)] h-4 w-4" />
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
