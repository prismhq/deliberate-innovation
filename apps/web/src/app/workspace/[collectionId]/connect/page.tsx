"use client";
import { useCollection } from "../collection-context";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@prism/ui/components/card";

export default function ConnectPage() {
  const { isLoading, collection } = useCollection();

  if (isLoading) {
    return (
      <div className="prism-loading-state">
        <div className="prism-loading-text">Loading connect page...</div>
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
          <CardTitle className="prism-text-l-semibold">
            Connect Your Documents
          </CardTitle>
          <CardDescription>
            Integrate your documents with your workflow
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-[var(--spacing-l)]">
            <p className="prism-text-m text-muted-foreground">
              This is a placeholder for connecting your documents to your
              codebase and coding agents.
            </p>
            <p className="prism-text-s text-muted-foreground">
              Future features will include:
            </p>
            <ul className="list-disc list-inside space-y-[var(--spacing-xs)] prism-text-s text-muted-foreground ml-[var(--spacing-m)]">
              <li>GitHub repository integration</li>
              <li>CI/CD pipeline setup</li>
              <li>Code generation tools</li>
              <li>Document synchronization</li>
              <li>Automated component updates</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
